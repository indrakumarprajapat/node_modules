import * as cliInterface from '@snyk/cli-interface';
import { TestOptions, Options, MonitorOptions } from '../types';
import { SupportedPackageManagers } from '../package-managers';
import { PluginMetadata } from '@snyk/cli-interface/legacy/plugin';
import { CallGraph } from '@snyk/cli-interface/legacy/common';
export interface ScannedProjectCustom extends cliInterface.legacyCommon.ScannedProject {
    packageManager: SupportedPackageManagers;
    plugin: PluginMetadata;
    callGraph?: CallGraph;
}
interface FailedProjectScanError {
    targetFile?: string;
    error?: Error;
    errMessage: string;
}
export interface MultiProjectResultCustom extends cliInterface.legacyPlugin.MultiProjectResult {
    scannedProjects: ScannedProjectCustom[];
    failedResults?: FailedProjectScanError[];
}
export declare function getMultiPluginResult(root: string, options: Options & (TestOptions | MonitorOptions), targetFiles: string[]): Promise<MultiProjectResultCustom>;
export declare function filterOutProcessedWorkspaces(root: string, scannedProjects: ScannedProjectCustom[], allTargetFiles: string[]): string[];
export {};