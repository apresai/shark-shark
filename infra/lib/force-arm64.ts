import * as cdk from 'aws-cdk-lib';
import { IConstruct } from 'constructs';

// Every Lambda in this app is ARM64 (Graviton2). CDK-generated helper
// functions (LogRetention, S3 auto-delete, AwsCustomResource, the Nextjs
// DynamoDB seed provider) are raw AWS::Lambda::Function resources with no
// Architectures property, and CloudFormation defaults a missing property to
// x86_64. This aspect sets arm64 on every function in the scope, including
// the ones the construct library creates for us.
export function forceArm64Lambdas(scope: IConstruct): void {
  cdk.Aspects.of(scope).add({
    visit(node: IConstruct): void {
      if (!cdk.CfnResource.isCfnResource(node) || node.cfnResourceType !== 'AWS::Lambda::Function') {
        return;
      }
      node.addPropertyOverride('Architectures', ['arm64']);
    },
  });
}
