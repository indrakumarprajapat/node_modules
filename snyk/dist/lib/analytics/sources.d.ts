import { ArgsOptions } from '../../cli/args';
export declare const INTEGRATION_NAME_ENVVAR = "SNYK_INTEGRATION_NAME";
export declare const INTEGRATION_VERSION_ENVVAR = "SNYK_INTEGRATION_VERSION";
export declare const INTEGRATION_ENVIRONMENT_ENVVAR = "SNYK_INTEGRATION_ENVIRONMENT";
export declare const INTEGRATION_ENVIRONMENT_VERSION_ENVVAR = "SNYK_INTEGRATION_ENVIRONMENT_VERSION";
export declare const getIntegrationName: (args: ArgsOptions[]) => string;
export declare const getIntegrationVersion: (args: ArgsOptions[]) => string;
export declare const getIntegrationEnvironment: (args: ArgsOptions[]) => string;
export declare const getIntegrationEnvironmentVersion: (args: ArgsOptions[]) => string;
export declare function isScoop(): boolean;
export declare function validateScoopManifestFile(snykExecutablePath: string): boolean;
export declare function isHomebrew(): boolean;
export declare function validateHomebrew(snykExecutablePath: string): boolean;
export declare function isInstalled(commandToCheck: string): Promise<boolean>;
