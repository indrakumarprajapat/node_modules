import { PerformanceAnalyticsKey } from './types';
declare type Awaited<T> = T extends PromiseLike<infer U> ? U : T;
export declare function asyncPerformanceAnalyticsDecorator<T extends (...args: any[]) => Promise<any>>(measurableMethod: T, analyticsKey: PerformanceAnalyticsKey): (...args: Parameters<T>) => Promise<Awaited<ReturnType<T>>>;
export declare function performanceAnalyticsDecorator<T extends (...args: any[]) => any>(measurableMethod: T, analyticsKey: PerformanceAnalyticsKey): (...args: Parameters<T>) => ReturnType<T>;
declare const measurableInitLocalCache: (__0?: {
    customRulesPath?: string | undefined;
} | undefined) => Promise<void>;
declare const measurableParseFiles: (filesData: import("./types").IacFileData[], options?: import("./types").IaCTestFlags | undefined, isTFVarSupportEnabled?: boolean | undefined) => Promise<import("./types").ParsingResults>;
declare const measurableloadContentForFiles: (filePaths: string[]) => Promise<import("./types").IacFileData[]>;
declare const measurableScanFiles: (parsedFiles: import("./types").IacFileParsed[]) => Promise<import("./types").IacFileScanResult[]>;
declare const measurableGetIacOrgSettings: (publicOrgId?: string | undefined) => Promise<import("./types").IacOrgSettings>;
declare const measurableApplyCustomSeverities: (scannedFiles: import("./types").IacFileScanResult[], customPolicies: Record<string, {
    severity?: string | undefined;
}>) => Promise<import("./types").IacFileScanResult[]>;
declare const measurableCleanLocalCache: () => void;
declare const measurableFormatScanResults: (scanResults: import("./types").IacFileScanResult[], options: import("./types").IaCTestFlags, meta: import("./types").TestMeta, projectPublicIds: Record<string, string>, gitRemoteUrl?: string | undefined) => import("./types").FormattedResult[];
declare const measurableTrackUsage: (formattedResults: import("./usage-tracking").TrackableResult[]) => Promise<void>;
declare const measurableLocalTest: (pathToScan: string, options: import("./types").IaCTestFlags) => Promise<import("./types").TestReturnValue>;
declare const measurableOciPull: (__0: import("./types").OCIRegistryURLComponents, opt?: import("./types").OCIPullOptions | undefined) => Promise<string>;
export { measurableInitLocalCache as initLocalCache, measurableloadContentForFiles as loadContentForFiles, measurableParseFiles as parseFiles, measurableScanFiles as scanFiles, measurableGetIacOrgSettings as getIacOrgSettings, measurableApplyCustomSeverities as applyCustomSeverities, measurableFormatScanResults as formatScanResults, measurableTrackUsage as trackUsage, measurableCleanLocalCache as cleanLocalCache, measurableLocalTest as localTest, measurableOciPull as pull, };
