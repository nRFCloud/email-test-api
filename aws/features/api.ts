import { Construct, Stack } from '@aws-cdk/cdk';
import {
    PolicyStatement,
    PolicyStatementEffect,
    Role,
    ServicePrincipal,
} from '@aws-cdk/aws-iam';
import { LogGroup } from '@aws-cdk/aws-logs';
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
            new PolicyStatement(PolicyStatementEffect.Allow)
                .addResource(
                    `arn:aws:logs:${stack.region}:${
                        stack.accountId
                    }:/aws/appsync/apis/*`,
                )
                .addAction('logs:CreateLogGroup')
                .addAction('logs:CreateLogStream')
                .addAction('logs:PutLogEvents'),
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
            retainLogGroup: false,
            logGroupName: `/aws/appsync/apis/${this.api.graphQlApiApiId}`,
            retentionDays: 7,
        });

        new CfnGraphQLSchema(this, 'Schema', {
            apiId: this.api.graphQlApiApiId,
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
            apiId: this.api.graphQlApiApiId,
            name: `noneDataSource`,
            type: 'NONE',
        });

        new CfnResolver(this, `publishEmailMutationResolver`, {
            apiId: this.api.graphQlApiApiId,
            typeName: 'Mutation',
            fieldName: 'publishEmail',
            dataSourceName: noneDataSource.dataSourceName,
            requestMappingTemplate:
                '{"version" : "2017-02-28",  "payload": $util.toJson($context.arguments)}',
            responseMappingTemplate: `$util.toJson($context.result)`,
        });

        new CfnResolver(this, `emailsSubscriptionResolver`, {
            apiId: this.api.graphQlApiApiId,
            typeName: 'Subscription',
            fieldName: 'emails',
            dataSourceName: noneDataSource.dataSourceName,
            requestMappingTemplate: `{"version" : "2017-02-28",  "payload": $util.toJson($context.arguments)}`,
            responseMappingTemplate: `null`,
        });

        this.apiKey = new CfnApiKey(this, `apiKey${new Date().getFullYear()}`, {
            apiId: this.api.graphQlApiApiId,
            expires: Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60, // 1 year is max lifetime
        });
    }
}
