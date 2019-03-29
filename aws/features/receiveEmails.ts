import { CfnParameter, Construct, RemovalPolicy, Stack } from '@aws-cdk/cdk';
import { IFunction } from '@aws-cdk/aws-lambda';
import { ServicePrincipal } from '@aws-cdk/aws-iam';
import { IBucket } from '@aws-cdk/aws-s3';
import {
    LambdaInvocationType,
    ReceiptRule,
    ReceiptRuleLambdaAction,
    ReceiptRuleSet,
    ReceiptRuleS3Action,
} from '@aws-cdk/aws-ses';
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
            removalPolicy: RemovalPolicy.Orphan,
        });

        const ruleSet = new ReceiptRuleSet(this, 'receiveAll', {
            dropSpam: true,
        });

        new ReceiptRule(this, 'rule', {
            ruleSet,
            recipients: [domain.stringValue],
            actions: [
                new ReceiptRuleS3Action({
                    bucket,
                }),
                new ReceiptRuleLambdaAction({
                    function: lambda,
                    invocationType: LambdaInvocationType.Event,
                }),
            ],
        });

        lambda.addPermission('invokeBySES', {
            principal: new ServicePrincipal('ses.amazonaws.com'),
        });
    }
}
