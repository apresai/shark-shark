#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { SharkSharkStack } from '../lib/shark-shark-stack';

const app = new cdk.App();

// Get environment from context or default to 'prod'
const environment = app.node.tryGetContext('environment') || 'prod';

new SharkSharkStack(app, `SharkSharkStack-${environment}`, {
  environment,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
  description: `Shark Shark game infrastructure with OpenNext (${environment})`,
});
