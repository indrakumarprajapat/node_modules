import { CustomError } from '../../../../lib/errors';
export declare class FlagError extends CustomError {
    constructor(key: string);
}
export declare class FeatureFlagError extends CustomError {
    constructor(key: string, featureFlag: string, hasSnykPreview?: boolean);
}
export declare class FlagValueError extends CustomError {
    constructor(key: string, value: string);
}
export declare class UnsupportedEntitlementFlagError extends CustomError {
    constructor(key: string, entitlementName: string);
}
export declare class UnsupportedEntitlementCommandError extends CustomError {
    constructor(key: string, entitlementName: string);
}
/**
 * Validates the command line flags passed to the snyk iac test
 * command. The current argument parsing is very permissive and
 * allows unknown flags to be provided without valdiation.
 *
 * For snyk iac we need to explictly validate the flags to avoid
 * misconfigurations and typos. For example, if the --experimental
 * flag were to be mis-spelled we would end up sending the client
 * data to our backend rather than running it locally as intended.
 * @param argv command line args passed to the process
 */
export declare function assertIaCOptionsFlags(argv: string[]): void;
export declare function isIacShareResultsOptions(options: any): any;