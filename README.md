# Email Test API

GraphQL API for receiving emails in order to e2e test email sending built on top of AWS.

## Component Diagram

[![Component Diagram](./docs/Component%20diagram_%20Email%20Test%20API%20-%20Email%20Test%20API.jpg)](https://miro.com/app/board/o9J_kxMnIv0=/)

## Setup

### Prerequisites

This service uses AWS SES to receive emails to your Hosted Zone Name. See the [Elivagar wiki](https://github.com/nRFCloud/elivagar/wiki/Setting-up-the-Stacks#creating-a-hosted-zone) for steps to create a Hosted Zone and configure SES on your AWS sub-account.

### Deploy

Make sure your have AWS credentials in your environment.

    npm ci
    npx tsc
    
    # if this is the first time you are setting up this project's stack in your account:
    npx cdk -a 'node dist/aws/cloudformation-sourcecode.js' deploy

    export DOMAIN_NAME=<YOUR_HOSTED_ZONE_NAME_
    npx cdk deploy

### Activate Ruleset

When the stack is complete a new SES ruleset (`receiveEmailsreceiveAllxxx`) will be created. This needs to be [manually set to Active](https://console.aws.amazon.com/ses/home?region=us-east-1#receipt-rules:) since it cannot be done using CloudFormation.

