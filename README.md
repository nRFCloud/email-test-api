# Email Test API

GraphQL API for receiving emails in order to e2e test email sending built on top of AWS.

## Component Diagram

[![Component Diagram](./docs/Component%20diagram_%20Email%20Test%20API%20-%20Email%20Test%20API.jpg)](https://miro.com/app/board/o9J_kxMnIv0=/)

## Setup

### Prerequisites

This service uses AWS SES to receive emails, so you need a verified domain name configured in your account. If you do not have a domain:

1. Go to [AWS Route 53](https://console.aws.amazon.com/route53/home?#DomainRegistration:) domain registration.
1. Order a new domain name, e.g., nrfcloudtest123.com.
1. Follow instructions for verification.

To verify a domain in your account for use with SES:

1. When the domain zone is created by Route53, [in SES](https://console.aws.amazon.com/ses/home#verified-senders-domain:) click *Create a New Domain*.
1. Enter "test-mails.<YOUR_NEW_DOMAIN>", e.g., "test-mails.nrfcloudtest123.com", and check *Generate DKIM Settings*.
1. In the next dialog click *Use Route 53* to set the domain records automatically.
1. Wait for verification, which is usually < 1 hour. See https://docs.aws.amazon.com/ses/latest/DeveloperGuide/verify-domain-procedure.html

### Deploy

Make sure your have AWS credentials in your environment.

    npm ci
    npx tsc
    
    # if this is the first time you are setting up this project's stack in your account:
    npx cdk -a 'node dist/aws/cloudformation-sourcecode.js' deploy

    export DOMAIN_NAME=<YOUR_NEW_DOMAIN>
    npx cdk deploy

### Activate Ruleset

When the stack is complete a new SES ruleset (`receiveEmailsreceiveAllxxx`) will be created. This needs to be [manually set to Active](https://console.aws.amazon.com/ses/home?region=us-east-1#receipt-rules:) since it cannot be done using CloudFormation.

