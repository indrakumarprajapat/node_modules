import { IacTestResponse } from '../../snyk-test/iac-test-result';
import { IacFileInDirectory } from '../../types';
export declare function getIacDisplayedOutput(iacTest: IacTestResponse, testedInfoText: string, meta: string, prefix: string, isNewIacOutputSupported?: boolean): string;
export declare function getIacDisplayErrorFileOutput(iacFileResult: IacFileInDirectory, isNewIacOutputSupported?: boolean): string;
export { capitalizePackageManager, createSarifOutputForIac, shareResultsOutput, } from './v1';
