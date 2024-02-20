import * as sarif from 'sarif';
import { TestResult } from '../snyk-test/legacy';
import { SEVERITY } from '../snyk-test/legacy';
export declare function createSarifOutputForContainers(testResults: TestResult[]): sarif.Log;
export declare function getIssueLevel(severity: SEVERITY | 'none'): sarif.ReportingConfiguration.level;
export declare function getTool(testResult: any): sarif.Tool;
export declare function getResults(testResult: any): sarif.Result[];
