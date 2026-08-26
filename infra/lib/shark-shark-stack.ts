import * as cdk from 'aws-cdk-lib';
import { Duration, RemovalPolicy } from 'aws-cdk-lib';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Architecture, Runtime } from 'aws-cdk-lib/aws-lambda';
import * as route53 from 'aws-cdk-lib/aws-route53';
import { Nextjs } from 'cdk-nextjs-standalone';
import { Construct } from 'constructs';

export interface SharkSharkStackProps extends cdk.StackProps {
  environment: string;
}

export class SharkSharkStack extends cdk.Stack {
  public readonly distributionUrl: string;

  constructor(scope: Construct, id: string, props: SharkSharkStackProps) {
    super(scope, id, props);

    const { environment } = props;

    // Import existing Route 53 hosted zone for apresai.dev
    const hostedZone = route53.HostedZone.fromHostedZoneAttributes(this, 'ApresAiHostedZone', {
      hostedZoneId: 'Z042792810Z6CUA4J2WCN',
      zoneName: 'apresai.dev',
    });

    // Import existing ACM certificate for sharkshark.apresai.dev (must be in us-east-1)
    const certificate = acm.Certificate.fromCertificateArn(
      this,
      'SharkSharkCertificate',
      'arn:aws:acm:us-east-1:228029809749:certificate/46c5623d-b8c3-4d09-bf72-603a3b275b56'
    );

    // DynamoDB table for high scores
    const highScoresTable = new dynamodb.Table(this, 'HighScoresTable', {
      tableName: `SharkShark-HighScores-${environment}`,
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.RETAIN,
      pointInTimeRecovery: true,
    });

    // OpenNext deployment with Lambda (Graviton2/ARM64, 2GB memory)
    const nextjs = new Nextjs(this, 'SharkSharkApp', {
      nextjsPath: '../',  // Path to Next.js app from infra directory

      // Use the pinned @opennextjs/aws from the app's node_modules instead of the
      // construct's default ephemeral `npx @opennextjs/aws@^3 build`, so builds are
      // deterministic against the version declared in package.json.
      //
      // The two env-var assignments are required, not decorative. OpenNext shells
      // out to a nested `npm install` to build the image-optimization bundle's
      // sharp, and that inner npm inherits this process's environment. Any npm or
      // npx in the chain (`make deploy` runs `npm run cdk deploy`, and `npx cdk`
      // does the same) exports npm_config_allow_scripts from the developer's
      // ~/.npmrc `allow-scripts=` key. npm 12 rejects that variable for
      // project-scoped installs with EALLOWSCRIPTS, the nested install dies, and
      // OpenNext only logs "Could not install dependencies" rather than failing,
      // so the build still reports success and ships an image Lambda with no
      // sharp at all.
      //
      // Both halves are load-bearing, for two different reasons. Clearing
      // npm_config_allow_scripts alone is not enough, because the `npx` below
      // re-reads the user npmrc and the file's real value beats an empty
      // environment value, handing the populated list back to the process it
      // launches. Repointing the user config alone is not enough from inside an
      // `npm run`, where npm has already exported its own resolved config.
      //
      // npm_config_userconfig must be spelled in npm's own lowercase env form,
      // but NOT because npm prefers lowercase. npm matches /^npm_config_/i and
      // resolves duplicates by environ ORDER, not by case; with `env` placing
      // them explicitly, the last-listed spelling wins whichever case it is. The
      // real reason is replacement versus duplication: a shell prefix using the
      // SAME spelling as the inherited entry overwrites it, leaving exactly one,
      // while a different case adds a SECOND entry and the inherited one wins.
      // Measured on npm 12.0.2, 2026-08-26:
      //
      //   npm_config_userconfig=/tmp/A bash -c 'NPM_CONFIG_USERCONFIG=/dev/null ...'
      //     -> /tmp/A   (the guard silently lost)
      //   npm_config_userconfig=/tmp/A bash -c 'npm_config_userconfig=/dev/null ...'
      //     -> /dev/null
      //
      // Since npm exports lowercase, matching it is what makes the guard hold.
      // This is worth stating precisely: someone who believes "npm prefers
      // lowercase" will write an uppercase guard elsewhere in the chain and get a
      // silently unguarded nested install.
      //
      // The prefix lives on this string rather than in the Makefile because a
      // Makefile-level guard would be undone by `npm run cdk` re-exporting a
      // non-empty allow-scripts into the cdk process before the build ever runs.
      // (The construct also copies the environment through a truthy filter,
      // NextjsBuild.getBuildEnvVars, but that alone would not defeat the guard:
      // dropping an empty variable is equivalent to clearing it.)
      //
      // Same pattern as regist/web, podcaster/portal and eleven9s/admin. See the
      // header comment in ../open-next.config.ts.
      buildCommand:
        'npm_config_userconfig=/dev/null npm_config_allow_scripts= npx @opennextjs/aws build' +
        ' && node scripts/assert-sharp-bundle.mjs .open-next/image-optimization-function',

      // Custom domain configuration
      domainProps: {
        domainName: 'sharkshark.apresai.dev',
        hostedZone,
        certificate,
      },

      // Environment variables for the Lambda functions
      // Auth secrets are read from environment at deploy time
      environment: {
        HIGH_SCORES_TABLE_NAME: highScoresTable.tableName,
        AUTH_SECRET: process.env.AUTH_SECRET || '',
        AUTH_URL: process.env.AUTH_URL || 'https://sharkshark.apresai.dev',
        AUTH_GOOGLE_ID: process.env.AUTH_GOOGLE_ID || '',
        AUTH_GOOGLE_SECRET: process.env.AUTH_GOOGLE_SECRET || '',
      },

      overrides: {
        // Server Lambda: Graviton2 (ARM64), 2GB memory
        nextjsServer: {
          functionProps: {
            memorySize: 2048,  // 2GB
            timeout: Duration.seconds(30),
            architecture: Architecture.ARM_64,  // Graviton2
            runtime: Runtime.NODEJS_24_X,
          },
        },

        // Image optimization Lambda: Graviton2, 1.5GB
        nextjsImage: {
          functionProps: {
            memorySize: 1536,
            timeout: Duration.seconds(15),
            architecture: Architecture.ARM_64,
          },
        },

        // Revalidation Lambda
        nextjsRevalidation: {
          queueFunctionProps: {
            memorySize: 512,
            timeout: Duration.seconds(30),
            architecture: Architecture.ARM_64,
          },
        },

        // CloudFront distribution: Disable caching for troubleshooting
        nextjsDistribution: {
          serverBehaviorOptions: {
            cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
          },
          imageBehaviorOptions: {
            cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
          },
          staticBehaviorOptions: {
            cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
          },
        },
      },
    });

    this.distributionUrl = 'https://sharkshark.apresai.dev';

    // Grant Lambda read/write access to DynamoDB
    if (nextjs.serverFunction?.lambdaFunction) {
      highScoresTable.grantReadWriteData(nextjs.serverFunction.lambdaFunction);
    }

    // Stack outputs
    new cdk.CfnOutput(this, 'DistributionUrl', {
      value: this.distributionUrl,
      description: 'CloudFront distribution URL',
      exportName: `SharkShark-${environment}-DistributionUrl`,
    });

    new cdk.CfnOutput(this, 'DistributionId', {
      value: nextjs.distribution.distributionId,
      description: 'CloudFront distribution ID',
      exportName: `SharkShark-${environment}-DistributionId`,
    });

    new cdk.CfnOutput(this, 'HighScoresTableName', {
      value: highScoresTable.tableName,
      description: 'DynamoDB table for high scores',
      exportName: `SharkShark-${environment}-HighScoresTableName`,
    });
  }
}
