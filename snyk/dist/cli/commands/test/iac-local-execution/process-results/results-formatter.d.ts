import { FormattedResult, IacFileScanResult, IaCTestFlags, PolicyMetadata, TestMeta } from '../types';
import { SEVERITY } from '../../../../../lib/snyk-test/common';
import { CustomError } from '../../../../../lib/errors';
export declare function formatScanResults(scanResults: IacFileScanResult[], options: IaCTestFlags, meta: TestMeta, projectPublicIds: Record<string, string>, gitRemoteUrl?: string): FormattedResult[];
export declare function filterPoliciesBySeverity(violatedPolicies: PolicyMetadata[], severityThreshold?: SEVERITY): PolicyMetadata[];
export declare class FailedToFormatResults extends CustomError {
    constructor(message?: string);
}