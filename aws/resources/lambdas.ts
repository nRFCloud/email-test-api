import * as path from 'path';
import { LayeredLambdas } from '@nrfcloud/package-layered-lambdas';
import { packLayeredLambdasForCloudFormation } from '../packLambdas';

export type EmailTestApiAppLayeredLambdas = LayeredLambdas<{
    emailToAppSync: string;
}>;

export const lambdas = async (
    rootDir: string,
    outDir: string,
    Bucket: string,
): Promise<EmailTestApiAppLayeredLambdas> =>
    packLayeredLambdasForCloudFormation('emailTestApi', outDir, Bucket, {
        emailToAppSync: path.resolve(rootDir, 'appsync', 'emailToAppSync.ts'),
    });
