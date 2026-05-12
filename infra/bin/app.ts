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

// Standard cost-allocation tags — propagate to all stacks and resources via CDK Aspects
cdk.Tags.of(app).add('project',    'sharkshark');
cdk.Tags.of(app).add('env',        'prod');
cdk.Tags.of(app).add('managed-by', 'cdk');
cdk.Tags.of(app).add('owner',      'chad');
