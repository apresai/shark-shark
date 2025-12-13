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
            runtime: Runtime.NODEJS_20_X,
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
