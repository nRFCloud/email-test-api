# Email Test API

GraphQL API for receiving emails in order to e2e test email sending built on top of AWS.

## Setup

### Prerequisites

This service uses AWS SES to receive emails, so you need a verified domain name configured. Get started [here](https://console.aws.amazon.com/ses/home#verified-senders-domain:), if you do not have a domain yet, you can register one with your domain reseller of choice or directly in AWS Route 53 which makes the set-up really simple.

In the following example we use `example.com` as the verified domain.

You can set a different domain name using the environment variable `DOMAIN_NAME`.

### Deploy

Make sure your have AWS credentials in your environment.

    npm ci
    npx tsc
    
    # if this is the run the first time in an account
    npx cdk -a 'node dist/cloudformation-sourcecode.js' deploy

    npx cdk deploy

### Activate Ruleset

A new SES ruleset (`receiveEmailsreceiveAllxxx`) has been created. This needs to be activated manually since it cannot be done using CloudFormation.

