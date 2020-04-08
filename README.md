# Email Test API

GraphQL API for receiving emails in order to e2e test email sending built on top of AWS.

## Component Diagram

[![Component Diagram](./docs/Component%20diagram_%20Email%20Test%20API%20-%20Email%20Test%20API.jpg)](https://miro.com/app/board/o9J_kxMnIv0=/)

## Set Up to Deploy

### Prerequisites

This service uses AWS SES to receive emails to your Hosted Zone Name. See the 
[Elivagar wiki](https://github.com/nRFCloud/elivagar/wiki/Setting-up-the-Stacks#creating-a-hosted-zone) 
for steps to create a Hosted Zone and configure SES on your AWS sub-account.

Make sure your have AWS credentials in your environment.

#### Stack Name (optional)

Two CloudFormation stacks will be created below. The default names will be:
    
    email-test-api-sourcecode
    email-test-api
    
If you set the stack name variable:

    export EMAIL_TEST_API_STACK_NAME=<whatever you like>

...then it will use that instead of `email-test-api` in the above names. It has no other effect.

### Set Up Deployment Environment

    npm ci
    npx tsc

## Deploy 

Deploy a bucket named e.g. `email-test-api-source...` (depending on the stack name) to hold files 
for CloudFormation to read and deploy.

    npx cdk -a 'node dist/aws/cloudformation-sourcecode.js' deploy  --require-approval never

Populate that source code bucket with Lambda zip files etc, and create another bucket 
`cdktoolkit-stagingbucket...` to hold the CDK-generated CloudFormation template.
    
    npx cdk bootstrap

For the DOMAIN_NAME, use either your own hosted zone name e.g. lith.nrfcloud.com, or one of the stage's
zone names `[dev|beta].nrfcloud.com` or just `nrfcloud.com` for production. Set it to something,
because there is no valid default (it's `example.com` which you never want).

    export DOMAIN_NAME=<hosted zone name>

For the following command, the CDK:
1. generates a CloudFormation template based on the CDK code rooted at `dist/aws/cloudformation.js`
1. uploads that template in the `cdktoolkit-stagingbucket...` created above
1. triggers CloudFormation to deploy the contents of this template, using the files stored in 
the `email-test-api-source...` bucket created above.
1. shows you the CloudFormation output and monitors its progress until it completes.
```
npx cdk deploy --require-approval never
```

### Activate Ruleset

When the stack is complete a new SES ruleset (`receiveEmailsreceiveAllxxx`) will be created. This needs to be 
[manually set to Active](https://console.aws.amazon.com/ses/home?region=us-east-1#receipt-rules:) since it cannot be 
done using CloudFormation.

## Update

If you change your code, you can update your stack by repeating the deploy command (from above):

    npx cdk deploy --require-approval never

CDK will only deploy the changed resources.

The API key will always be updated, even if nothing else has been changed.

## Remove

Before deleting the stacks, you must 
[manually set the old default rule set to Active](https://console.aws.amazon.com/ses/home?region=us-east-1#receipt-rules:), 
which makes the `receiveEmailsreceiveAllxxx` rule set inactive.

Delete the stacks by running:

    npx cdk -a 'node dist/aws/cloudformation.js' destroy -f
    npx cdk -a 'node dist/aws/cloudformation-sourcecode.js' destroy -f

Some S3 buckets will be left behind, since they may contain emails that need to be kept.
