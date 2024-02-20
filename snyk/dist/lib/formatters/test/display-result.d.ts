import { Options, TestOptions } from '../../../lib/types';
import { TestResult } from '../../../lib/snyk-test/legacy';
interface DisplayResultOptions extends Options, TestOptions {
    isNewIacOutputSupported?: boolean;
}
export declare function displayResult(res: TestResult, options: DisplayResultOptions, foundProjectCount?: number): string;
export {};
