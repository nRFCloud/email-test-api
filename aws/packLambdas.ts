import * as path from 'path';
import {
    packLayeredLambdas,
    WebpackMode,
} from '@nrfcloud/package-layered-lambdas';

const rootFolder = path.resolve(__dirname, '..', '..');

const awsFolder = path.resolve(rootFolder, 'aws');

export const webpackConfig = path.resolve(awsFolder, 'tsconfig-webpack.json');

export const tsConfig = path.resolve(__dirname, '..', '..', 'tsconfig.json');

export const mode =
    (process.env.WEBPACK_LAMBDAS_MODE as WebpackMode) || WebpackMode.production;

export const packLayeredLambdasForCloudFormation = <
    A extends { [key: string]: string }
>(
    id: string,
    outDir: string,
    Bucket: string,
    lambdas: A,
) =>
    packLayeredLambdas<A>({
        id,
        webpackConfig,
        mode,
        srcDir: rootFolder,
        outDir,
        Bucket,
        lambdas,
        tsConfig,
    });
