/**
 * @jest-environment node
 */
import * as fs from 'fs';
import * as path from 'path';
import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { SharkSharkStack } from '../lib/shark-shark-stack';

// Runtimes AWS Lambda no longer accepts for new functions or is about to retire.
const DEPRECATED_RUNTIME = /^(nodejs(1[0-9]|20)\.x|nodejs[0-9]\.[0-9]+\.?x?|python3\.(?:[0-9]|1[01])|go1\.x|provided$)/;

describe('SharkSharkStack Lambdas', () => {
  const infraDir = path.resolve(__dirname, '..');
  const openNextDir = path.resolve(infraDir, '..', '.open-next');
  const originalCwd = process.cwd();
  const originalEnv = { ...process.env };
  let createdOpenNext = false;
  let template: Template;

  beforeAll(() => {
    // The stack points the Nextjs construct at ../ relative to infra/.
    process.chdir(infraDir);
    process.env.AUTH_SECRET = 'test';
    process.env.AUTH_GOOGLE_ID = 'test';
    process.env.AUTH_GOOGLE_SECRET = 'test';
    createdOpenNext = !fs.existsSync(openNextDir);

    // bundling-stacks=[] makes the construct mock the .open-next dirs with
    // placeholder files instead of running the real OpenNext build.
    const app = new cdk.App({ context: { 'aws:cdk:bundling-stacks': [] } });
    const stack = new SharkSharkStack(app, 'TestStack', {
      environment: 'test',
      env: { account: '123456789012', region: 'us-east-1' },
    });
    template = Template.fromStack(stack);
  });

  afterAll(() => {
    process.chdir(originalCwd);
    process.env = originalEnv;
    if (createdOpenNext) {
      fs.rmSync(openNextDir, { recursive: true, force: true });
    }
  });

  test('every AWS::Lambda::Function is arm64, including CDK helper functions', () => {
    const fns = template.findResources('AWS::Lambda::Function');
    expect(Object.keys(fns).length).toBeGreaterThan(0);
    const offenders = Object.entries(fns)
      .filter(([, r]) => JSON.stringify(r.Properties.Architectures) !== JSON.stringify(['arm64']))
      .map(([id]) => id);
    expect(offenders).toEqual([]);
  });

  test('no Lambda uses a deprecated runtime', () => {
    const fns = template.findResources('AWS::Lambda::Function');
    const offenders = Object.entries(fns)
      .filter(([, r]) => DEPRECATED_RUNTIME.test(String(r.Properties.Runtime ?? 'provided')))
      .map(([id, r]) => `${id}: ${r.Properties.Runtime}`);
    expect(offenders).toEqual([]);
  });
});
