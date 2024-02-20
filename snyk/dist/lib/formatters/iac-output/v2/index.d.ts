import { IacTestResponse } from '../../../../lib/snyk-test/iac-test-result';
import { IacFileInDirectory } from '../../../../lib/types';
export declare function getIacDisplayedOutput(iacTest: IacTestResponse, testedInfoText: string, meta: string, prefix: string): string;
export declare function getIacDisplayErrorFileOutput(iacFileResult: IacFileInDirectory): string;
