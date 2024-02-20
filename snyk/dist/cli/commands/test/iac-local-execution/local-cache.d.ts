import { EngineType } from './types';
import { CustomError } from '../../../../lib/errors';
export declare const LOCAL_POLICY_ENGINE_DIR = ".iac-data";
export declare const CUSTOM_POLICY_ENGINE_WASM_PATH: string;
export declare function assertNever(value: never): never;
export declare function getLocalCachePath(engineType: EngineType): string[];
export declare function initLocalCache({ customRulesPath, }?: {
    customRulesPath?: string;
}): Promise<void>;
export declare function cleanLocalCache(): void;
export declare class FailedToInitLocalCacheError extends CustomError {
    constructor(message?: string);
}
export declare class FailedToDownloadRulesError extends CustomError {
    constructor(message?: string);
}
export declare class FailedToExtractCustomRulesError extends CustomError {
    constructor(path: string, message?: string);
}
export declare class InvalidCustomRules extends CustomError {
    constructor(path: string, message?: string);
}
export declare class InvalidCustomRulesPath extends CustomError {
    constructor(path: string, message?: string);
}