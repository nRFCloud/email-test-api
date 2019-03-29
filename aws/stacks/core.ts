import {
    App,
    CfnOutput,
    CfnParameter,
    RemovalPolicy,
    Stack,
} from '@aws-cdk/cdk';
import { Code, Function, LayerVersion, Runtime } from '@aws-cdk/aws-lambda';
import { Bucket } from '@aws-cdk/aws-s3';
import { EmailTestApiAppLayeredLambdas } from '../resources/lambdas';
import { ApiFeature } from '../features/api';
import { PolicyStatement, PolicyStatementEffect } from '@aws-cdk/aws-iam';
import { LogGroup } from '@aws-cdk/aws-logs';
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

        const sourceCodeBucket = Bucket.import(this, 'SourceCodeBucket', {
            bucketName: sourceCodeBucketName,
        });

        const baseLayer = new LayerVersion(this, `${id}-layer`, {
            code: Code.bucket(sourceCodeBucket, baseLayerZipFileName),
            compatibleRuntimes: [Runtime.NodeJS810],
        });

        const api = new ApiFeature(this, 'api');

        new CfnOutput(this, 'apiUrl', {
            value: api.api.graphQlApiGraphQlUrl,
            export: `${this.name}:apiUrl`,
        });

        new CfnOutput(this, 'apiKey', {
            value: api.apiKey.apiKey,
            export: `${this.name}:apiKey`,
        });

        const bucket = new Bucket(this, 'emailStore', {
            removalPolicy: RemovalPolicy.Orphan,
        });

        const el = new Function(this, 'emailToAppSync', {
            code: Code.bucket(
                sourceCodeBucket,
                layeredLambdas.lambdaZipFileNames.emailToAppSync,
            ),
            handler: 'index.handler',
            runtime: Runtime.NodeJS810,
            timeout: 30,
            memorySize: 1792,
            environment: {
                S3_BUCKET: bucket.bucketName,
                DOMAIN_NAME: this.domainName.stringValue,
                GRAPHQL_API_ENDPOINT: api.api.graphQlApiGraphQlUrl,
            },
            initialPolicy: [
                new PolicyStatement(PolicyStatementEffect.Allow)
                    .addResource('arn:aws:logs:*:*:*')
                    .addAction('logs:CreateLogGroup')
                    .addAction('logs:CreateLogStream')
                    .addAction('logs:PutLogEvents'),
                new PolicyStatement(PolicyStatementEffect.Allow)
                    .addAction('appsync:GraphQL')
                    .addResource(
                        `${
                            api.api.graphQlApiArn
                        }/types/Mutation/fields/publishEmail`,
                    ),
                new PolicyStatement(PolicyStatementEffect.Allow)
                    .addResource(`${bucket.bucketArn}/*`)
                    .addActions('s3:GetObject'),
            ],
            layers: [baseLayer],
        });

        new LogGroup(this, `LogGroup`, {
            retainLogGroup: false,
            logGroupName: `/aws/lambda/${el.functionName}`,
            retentionDays: 7,
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
