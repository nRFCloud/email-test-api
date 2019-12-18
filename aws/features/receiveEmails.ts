import { CfnParameter, Construct, RemovalPolicy, Stack } from '@aws-cdk/core';
import { IFunction } from '@aws-cdk/aws-lambda';
import { ServicePrincipal } from '@aws-cdk/aws-iam';
import { IBucket } from '@aws-cdk/aws-s3';
import { ReceiptRule, ReceiptRuleSet } from '@aws-cdk/aws-ses';
import { LambdaInvocationType, S3, Lambda } from '@aws-cdk/aws-ses-actions';
import { Bucket } from '@aws-cdk/aws-s3';

export class ReceiveEmailsFeature extends Construct {
    public readonly bucket: Bucket;

    constructor(
        stack: Stack,
        id: string,
        lambda: IFunction,
        domain: CfnParameter,
        bucket: IBucket,
    ) {
        super(stack, id);

        this.bucket = new Bucket(this, 'emailStore', {
            removalPolicy: RemovalPolicy.RETAIN,
        });

        const ruleSet = new ReceiptRuleSet(this, 'receiveAll', {
            dropSpam: true,
        });

        new ReceiptRule(this, 'rule', {
            ruleSet,
            recipients: [domain.valueAsString],
            actions: [
                new S3({ bucket }),
                new Lambda({
                    function: lambda,
                    invocationType: LambdaInvocationType.EVENT,
                }),
            ],
        });

        lambda.addPermission('invokeBySES', {
            principal: new ServicePrincipal('ses.amazonaws.com'),
        });
    }
}
