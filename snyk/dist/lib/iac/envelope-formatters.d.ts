import { IacShareResultsFormat, IaCTestFlags } from '../../cli/commands/test/iac-local-execution/types';
import { GitTarget, ScanResult } from '../ecosystems/types';
import { Policy } from '../policy/find-and-load-policy';
export declare function convertIacResultToScanResult(iacResult: IacShareResultsFormat, policy: Policy | undefined, gitTarget: GitTarget, options?: IaCTestFlags): ScanResult;