# Email Test API

GraphQL API for receiving emails in order to e2e test email sending built on top of AWS.

## Component Diagram

[![Component Diagram](./docs/Component%20diagram_%20Email%20Test%20API%20-%20Email%20Test%20API.jpg)](https://miro.com/app/board/o9J_kxMnIv0=/)

## Setup

### Prerequisites

This service uses AWS SES to receive emails to your Hosted Zone Name. See the [Elivagar wiki](https://github.com/nRFCloud/elivagar/wiki/Setting-up-the-Stacks#creating-a-hosted-zone) for steps to create a Hosted Zone and configure SES on your AWS sub-account.

### Deploy

Make sure your have AWS credentials in your environment.

Optional:

    export EMAIL_TEST_API_STACK_NAME=<whatever you like>

The actual stack name will be this variable with `-sourcecode` appended.
If you don't set the variable, the stack will be named `email-test-api-sourcecode`.

    npm ci
    npx tsc
    # If this is the first time running CDK of any deployment in your account:
    # (Substitute your AWS account number and AWS region name)
    npx cdk bootstrap aws://123456789012/us-east-1
    # If this is the first time you are setting up this project's stack in your account:
    npx cdk -a 'node dist/aws/cloudformation-sourcecode.js' deploy

    # Use either your own hosted zone name e.g. lith.nrfcloud.com, or one of the stage's
    # zone names [dev|beta].nrfcloud.com or just nrfcloud.com for production.
    export DOMAIN_NAME=<hosted zone name>
    npx cdk deploy

### Activate Ruleset

When the stack is complete a new SES ruleset (`receiveEmailsreceiveAllxxx`) will be created. This needs to be [manually set to Active](https://console.aws.amazon.com/ses/home?region=us-east-1#receipt-rules:) since it cannot be done using CloudFormation.

## Remove

Before deleting the stacks, you must [manually set the old default rule set to Active](https://console.aws.amazon.com/ses/home?region=us-east-1#receipt-rules:), which makes the `receiveEmailsreceiveAllxxx` rule set inactive.

Delete the stacks by running:

    npx cdk -a 'node dist/aws/cloudformation.js' destroy -f
    npx cdk -a 'node dist/aws/cloudformation-sourcecode.js' destroy -f
