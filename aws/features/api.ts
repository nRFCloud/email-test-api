import { Construct, Stack, RemovalPolicy } from '@aws-cdk/core';
import { PolicyStatement, Role, ServicePrincipal } from '@aws-cdk/aws-iam';
import { LogGroup, RetentionDays } from '@aws-cdk/aws-logs';
import {
    CfnGraphQLApi,
    CfnGraphQLSchema,
    CfnApiKey,
    CfnResolver,
    CfnDataSource,
} from '@aws-cdk/aws-appsync';
import { readFileSync } from 'fs';
import * as path from 'path';

export class ApiFeature extends Construct {
    public readonly api: CfnGraphQLApi;
    public readonly apiKey: CfnApiKey;

    constructor(stack: Stack, id: string) {
        super(stack, id);

        const apiRole = new Role(this, 'Role', {
            assumedBy: new ServicePrincipal('appsync.amazonaws.com'),
        });
        apiRole.addToPolicy(
            new PolicyStatement({
                resources: [
                    `arn:aws:logs:${stack.region}:${stack.account}:/aws/appsync/apis/*`,
                ],
                actions: [
                    'logs:CreateLogGroup',
                    'logs:CreateLogStream',
                    'logs:PutLogEvents',
                ],
            }),
        );

        this.api = new CfnGraphQLApi(this, 'Api', {
            name: 'SMTPtoGQL',
            authenticationType: 'API_KEY',
            logConfig: {
                fieldLogLevel: 'ALL',
                cloudWatchLogsRoleArn: apiRole.roleArn,
            },
        });

        new LogGroup(this, 'LogGroup', {
            retention: RetentionDays.ONE_WEEK,
            removalPolicy: RemovalPolicy.DESTROY,
            logGroupName: `/aws/appsync/apis/${this.api.attrApiId}`,
        });

        new CfnGraphQLSchema(this, 'Schema', {
            apiId: this.api.attrApiId,
            definition: readFileSync(
                path.resolve(
                    __dirname,
                    '..',
                    '..',
                    '..',
                    'appsync',
                    'schema.graphql',
                ),
                'utf-8',
            ),
        });

        const noneDataSource = new CfnDataSource(this, `noneDataSource`, {
            apiId: this.api.attrApiId,
            name: `noneDataSource`,
            type: 'NONE',
        });

        new CfnResolver(this, `publishEmailMutationResolver`, {
            apiId: this.api.attrApiId,
            typeName: 'Mutation',
            fieldName: 'publishEmail',
            dataSourceName: noneDataSource.attrName,
            requestMappingTemplate:
                '{"version" : "2017-02-28",  "payload": $util.toJson($context.arguments)}',
            responseMappingTemplate: `$util.toJson($context.result)`,
        });

        new CfnResolver(this, `emailsSubscriptionResolver`, {
            apiId: this.api.attrApiId,
            typeName: 'Subscription',
            fieldName: 'emails',
            dataSourceName: noneDataSource.attrName,
            requestMappingTemplate: `{"version" : "2017-02-28",  "payload": $util.toJson($context.arguments)}`,
            responseMappingTemplate: `null`,
        });

        this.apiKey = new CfnApiKey(this, `apiKey${new Date().getFullYear()}`, {
            apiId: this.api.attrApiId,
            expires: Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60, // 1 year is max lifetime
        });
    }
}
