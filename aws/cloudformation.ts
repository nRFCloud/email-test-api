import { LambdaSourcecodeStorageStack } from './stacks/lambda-sourcecode-storage';
import { SourceCodeStackName } from './app/sourcecode';
import * as fs from 'fs';
import { packBaseLayer } from '@nrfcloud/package-layered-lambdas';
import { lambdas } from './resources/lambdas';
import { EmailTestApiApp } from './app/emailTestApi';

const path = require('path');

// tslint:disable-next-line:no-floating-promises
(async () => {
    const outDir = path.resolve(__dirname, '..', '..', 'pack');
    try {
        fs.statSync(outDir);
    } catch (_) {
        fs.mkdirSync(outDir);
    }
    const rootDir = path.resolve(__dirname, '..', '..');

    const Bucket = await LambdaSourcecodeStorageStack.getBucketName(
        SourceCodeStackName,
    );

    const layeredLambdas = await lambdas(rootDir, outDir, Bucket);

    new EmailTestApiApp(
        process.env.EMAIL_TEST_API_STACK_NAME || 'email-test-api',
        process.env.DOMAIN_NAME || 'example.com',
        Bucket,
        await packBaseLayer({
            srcDir: rootDir,
            outDir,
            Bucket,
        }),
        layeredLambdas,
    ).synth();
})();
