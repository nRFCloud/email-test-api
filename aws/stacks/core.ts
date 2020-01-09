import {
    App,
    CfnOutput,
    CfnParameter,
    RemovalPolicy,
    Stack,
    Duration,
} from '@aws-cdk/core';
import { Code, Function, LayerVersion, Runtime } from '@aws-cdk/aws-lambda';
import { Bucket } from '@aws-cdk/aws-s3';
import { EmailTestApiAppLayeredLambdas } from '../resources/lambdas';
import { ApiFeature } from '../features/api';
import { PolicyStatement } from '@aws-cdk/aws-iam';
import { LogGroup, RetentionDays } from '@aws-cdk/aws-logs';
import { ReceiveEmailsFeature } from '../features/receiveEmails';

export class CoreStack extends Stack {
    public readonly domainName: CfnParameter;

    constructor(
        parent: App,
        id: string,
        config: {
            domainName: string;
        },
        sourceCodeBucketName: string,
        baseLayerZipFileName: string,
        layeredLambdas: EmailTestApiAppLayeredLambdas,
    ) {
        super(parent, id);

        this.domainName = new CfnParameter(this, 'domainName', {
            description: 'The domain which is used to receive emails.',
            default: config.domainName,
            type: 'String',
        });

        const sourceCodeBucket = Bucket.fromBucketAttributes(
            this,
            'SourceCodeBucket',
            {
                bucketName: sourceCodeBucketName,
            },
        );

        const baseLayer = new LayerVersion(this, `${id}-layer`, {
            code: Code.bucket(sourceCodeBucket, baseLayerZipFileName),
            compatibleRuntimes: [Runtime.NODEJS_12_X],
        });

        const api = new ApiFeature(this, 'api');

        new CfnOutput(this, 'apiUrl', {
            value: api.api.attrGraphQlUrl,
            exportName: `${this.stackName}:apiUrl`,
        });

        new CfnOutput(this, 'apiKey', {
            value: api.apiKey.attrApiKey,
            exportName: `${this.stackName}:apiKey`,
        });

        const bucket = new Bucket(this, 'emailStore', {
            removalPolicy: RemovalPolicy.RETAIN,
        });

        const el = new Function(this, 'emailToAppSync', {
            code: Code.bucket(
                sourceCodeBucket,
                layeredLambdas.lambdaZipFileNames.emailToAppSync,
            ),
            handler: 'index.handler',
            runtime: Runtime.NODEJS_12_X,
            timeout: Duration.seconds(30),
            memorySize: 1792,
            environment: {
                S3_BUCKET: bucket.bucketName,
                DOMAIN_NAME: this.domainName.value.toString(),
                GRAPHQL_API_ENDPOINT: api.api.attrGraphQlUrl,
                GRAPHQL_API_KEY: api.apiKey.attrApiKey,
            },
            initialPolicy: [
                new PolicyStatement({
                    resources: ['arn:aws:logs:*:*:*'],
                    actions: [
                        'logs:CreateLogGroup',
                        'logs:CreateLogStream',
                        'logs:PutLogEvents',
                    ],
                }),
                new PolicyStatement({
                    resources: [`${bucket.bucketArn}/*`],
                    actions: ['s3:GetObject', 's3:DeleteObject'],
                }),
            ],
            layers: [baseLayer],
        });

        new LogGroup(this, `LogGroup`, {
            retention: RetentionDays.ONE_WEEK,
            removalPolicy: RemovalPolicy.DESTROY,
            logGroupName: `/aws/lambda/${el.functionName}`,
        });

        new ReceiveEmailsFeature(
            this,
            'receiveEmails',
            el,
            this.domainName,
            bucket,
        );
    }
}
