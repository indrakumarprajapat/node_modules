import { BasicResultData, SEVERITY, TestDepGraphMeta } from './legacy';
export interface AnnotatedIacIssue {
    id: string;
    title: string;
    description?: string;
    severity: SEVERITY | 'none';
    isIgnored: boolean;
    cloudConfigPath: string[];
    subType: string;
    path?: string[];
    documentation?: string;
    isGeneratedByCustomRule?: boolean;
    name?: string;
    from?: string[];
    lineNumber?: number;
    iacDescription: {
        issue: string;
        impact: string;
        resolve: string;
    };
}
declare type FILTERED_OUT_FIELDS = 'cloudConfigPath' | 'name' | 'from';
export interface IacTestResponse extends BasicResultData {
    path: string;
    targetFile: string;
    projectName: string;
    displayTargetFile: string;
    foundProjectCount: number;
    meta: TestDepGraphMeta;
    result: {
        cloudConfigResults: AnnotatedIacIssue[];
        projectType: string;
    };
}
declare const IAC_ISSUES_KEY = "infrastructureAsCodeIssues";
export declare function mapIacTestResult(iacTest: IacTestResponse): MappedIacTestResponse | IacTestError;
/**
 * The following types represent manipulations to the data structure returned from Registry's `test-iac`.
 * These manipulations are being done prior to outputing as JSON, for renaming fields only.
 * The types above, IacTestResult & AnnotatedIacIssue, represent how the response from Registry actually is.
 * These were introduced in order to prevent cascading complex changes caused by changing Registry's `test-iac` response.
 */
export interface IacTestError {
    ok: boolean;
    error: string;
    path: string;
}
export interface MappedIacTestResponse extends Omit<IacTestResponse, 'result'> {
    [IAC_ISSUES_KEY]: MappedAnnotatedIacIssue[];
    projectType: string;
}
export interface MappedAnnotatedIacIssue extends Omit<AnnotatedIacIssue, FILTERED_OUT_FIELDS> {
    path: string[];
}
export declare function mapIacIssue(iacIssue: AnnotatedIacIssue): MappedAnnotatedIacIssue;
export {};