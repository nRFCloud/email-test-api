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
                    }:/aws/lambda/*`,
                )
                .addAction('logs:CreateLogGroup')
                .addAction('logs:CreateLogStream')
                .addAction('logs:PutLogEvents'),
        );

        this.api = new CfnGraphQLApi(this, 'Api', {
            name: 'Ausgaben',
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

        this.apiKey = new CfnApiKey(this, 'apiKey', {
            apiId: this.api.graphQlApiApiId,
        });
    }
}
