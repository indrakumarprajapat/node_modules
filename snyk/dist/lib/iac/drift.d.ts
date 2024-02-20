/// <reference types="node" />
import { StdioOptions } from 'child_process';
import { DescribeOptions, DriftAnalysis, DriftctlExecutionResult, DriftCTLOptions, GenDriftIgnoreOptions } from './types';
import { Policy } from '../policy/find-and-load-policy';
export declare const DCTL_EXIT_CODES: {
    EXIT_IN_SYNC: number;
    EXIT_NOT_IN_SYNC: number;
    EXIT_ERROR: number;
};
export declare const DescribeExclusiveArgs: string[];
export declare const DescribeRequiredArgs: string[];
export declare const driftctlVersion = "v0.25.0";
export declare const validateArgs: (options: DriftCTLOptions) => void;
export declare const generateArgs: (options: DriftCTLOptions, driftIgnore?: string[] | undefined) => string[];
export declare function translateExitCode(exitCode: number | null): number;
export declare const parseDriftAnalysisResults: (input: string) => DriftAnalysis;
export declare const runDriftCTL: ({ options, driftIgnore, input, stdio, }: {
    options: DriftCTLOptions;
    driftIgnore?: string[] | undefined;
    input?: string | undefined;
    stdio?: "pipe" | "ignore" | "inherit" | (number | import("stream").Stream | "pipe" | "ignore" | "inherit" | "ipc" | null | undefined)[] | undefined;
}) => Promise<DriftctlExecutionResult>;
export declare function driftignoreFromPolicy(policy: Policy | undefined): string[];
export declare const updateExcludeInPolicy: (policy: Policy, analysis: DriftAnalysis, options: GenDriftIgnoreOptions) => void;
export declare function processDriftctlOutput(options: DescribeOptions, stdout: string): string;
