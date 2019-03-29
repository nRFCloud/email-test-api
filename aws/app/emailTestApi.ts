import { App } from '@aws-cdk/cdk';
import { EmailTestApiAppLayeredLambdas } from '../resources/lambdas';
import { CoreStack } from '../stacks/core';

export class EmailTestApiApp extends App {
    constructor(
        stackName: string,
        domainName: string,
        sourceCodeBucketName: string,
        baseLayerZipFileName: string,
        layeredLambdas: EmailTestApiAppLayeredLambdas,
    ) {
        super();

        new CoreStack(
            this,
            stackName,
            {
                domainName,
            },
            sourceCodeBucketName,
            baseLayerZipFileName,
            layeredLambdas,
        );
    }
}
