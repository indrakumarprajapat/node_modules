import { FormattedResult } from '../types';
import { Policy } from '../../../../../lib/policy/find-and-load-policy';
export declare function filterIgnoredIssues(policy: Policy | undefined, results: FormattedResult[]): {
    filteredIssues: FormattedResult[];
    ignoreCount: number;
};
