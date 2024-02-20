import * as depGraphLib from '@snyk/dep-graph';
import { DepsFilePaths, ScanResult, FileSignaturesDetails } from '../ecosystems/types';
import { SupportedPackageManagers } from '../package-managers';
import { Options, SupportedProjectTypes, TestOptions } from '../types';
interface Pkg {
    name: string;
    version?: string;
}
interface Patch {
    version: string;
    id: string;
    urls: string[];
    modificationTime: string;
}
export declare enum SEVERITY {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    CRITICAL = "critical"
}
export declare enum REACHABILITY {
    FUNCTION = "function",
    PACKAGE = "package",
    NOT_REACHABLE = "not-reachable",
    NO_INFO = "no-info"
}
export interface VulnMetaData {
    id: string;
    title: string;
    description: string;
    type: 'license' | 'vuln';
    name: string;
    info: string;
    severity: SEVERITY;
    severityValue: number;
    isNew: boolean;
    version: string;
    packageManager: SupportedPackageManagers | 'upstream';
}
export interface GroupedVuln {
    list: AnnotatedIssue[];
    metadata: VulnMetaData;
    isIgnored: boolean;
    title: string;
    note: string | false;
    severity: SEVERITY;
    originalSeverity?: SEVERITY;
    isNew: boolean;
    name: string;
    version: string;
    isFixable: boolean;
    fixedIn: string[];
    legalInstructionsArray?: LegalInstruction[];
    reachability?: REACHABILITY;
}
export interface LegalInstruction {
    licenseName: string;
    legalContent: string;
}
export interface IssueData {
    id: string;
    packageName: string;
    version: string;
    moduleName?: string;
    below: string;
    semver: {
        vulnerable: string | string[];
        vulnerableHashes?: string[];
        vulnerableByDistro?: {
            [distroNameAndVersion: string]: string[];
        };
    };
    patches: Patch[];
    isNew: boolean;
    description: string;
    title: string;
    severity: SEVERITY;
    fixedIn: string[];
    legalInstructions?: string;
    reachability?: REACHABILITY;
    packageManager?: SupportedProjectTypes;
}
export declare type CallPath = string[];
export interface ReachableFunctionPaths {
    functionName: string;
    callPaths: CallPath[];
}
export interface ReachablePaths {
    pathCount: number;
    paths: ReachableFunctionPaths[];
}
interface AnnotatedIssue extends IssueData {
    credit: string[];
    name: string;
    version: string;
    from: string[];
    upgradePath: Array<string | boolean>;
    isUpgradable: boolean;
    isPatchable: boolean;
    severity: SEVERITY;
    originalSeverity?: SEVERITY;
    bundled?: any;
    shrinkwrap?: any;
    __filename?: string;
    parentDepType: string;
    type?: 'license';
    title: string;
    patch?: any;
    note?: string | false;
    publicationTime?: string;
    reachablePaths?: ReachablePaths;
    identifiers?: {
        [name: string]: string[];
    };
}
export interface DockerIssue {
    nearestFixedInVersion?: string;
    dockerfileInstruction?: any;
    dockerBaseImage?: any;
}
export interface IgnoreSettings {
    adminOnly: boolean;
    reasonRequired: boolean;
    disregardFilesystemIgnores: boolean;
}
export interface BasicResultData {
    ok: boolean;
    payloadType?: string;
    org: string;
    isPrivate: boolean;
    summary: string;
    packageManager?: SupportedProjectTypes;
    severityThreshold?: string;
    platform?: string;
}
export interface LegacyVulnApiResult extends BasicResultData {
    vulnerabilities: AnnotatedIssue[];
    dependencyCount: number;
    policy: string;
    licensesPolicy: object | null;
    ignoreSettings: IgnoreSettings | null;
    docker?: {
        baseImage?: any;
        binariesVulns?: unknown;
        baseImageRemediation?: BaseImageRemediation;
    };
    projectId?: string;
    filesystemPolicy?: boolean;
    uniqueCount?: any;
    remediation?: RemediationChanges;
}
export interface BaseImageRemediation {
    code: string;
    advice: BaseImageRemediationAdvice[];
    message?: string;
}
export interface BaseImageRemediationAdvice {
    message: string;
    bold?: boolean;
    color?: string;
}
export interface TestResult extends LegacyVulnApiResult {
    targetFile?: string;
    projectName?: string;
    targetFilePath?: string;
    displayTargetFile?: string;
    foundProjectCount?: number;
    scanResult?: ScanResult;
}
interface UpgradePathItem {
    name: string;
    version: string;
    newVersion?: string;
    isDropped?: boolean;
}
interface UpgradePath {
    path: UpgradePathItem[];
}
interface FixInfo {
    upgradePaths: UpgradePath[];
    isPatchable: boolean;
    nearestFixedInVersion?: string;
}
export interface AffectedPackages {
    [pkgId: string]: {
        pkg: Pkg;
        issues: {
            [issueId: string]: Issue;
        };
    };
}
interface TestDepGraphResult {
    issuesData: {
        [issueId: string]: IssueData;
    };
    affectedPkgs: AffectedPackages;
    docker: {
        binariesVulns?: TestDepGraphResult;
        baseImage?: any;
    };
    remediation?: RemediationChanges;
}
interface Issue {
    pkgName: string;
    pkgVersion?: string;
    issueId: string;
    fixInfo: FixInfo;
}
export interface TestDependenciesResult {
    issuesData: {
        [issueId: string]: IssueData;
    };
    issues: Issue[];
    docker?: {
        baseImage: string;
        baseImageRemediation: BaseImageRemediation;
        binariesVulns: TestDepGraphResult;
    };
    remediation?: RemediationChanges;
    depsFilePaths?: DepsFilePaths;
    depGraphData: depGraphLib.DepGraphData;
    fileSignaturesDetails: FileSignaturesDetails;
}
export interface TestDepGraphMeta {
    isPublic: boolean;
    isLicensesEnabled: boolean;
    licensesPolicy?: {
        severities: {
            [type: string]: string;
        };
    };
    projectId?: string;
    ignoreSettings?: IgnoreSettings;
    policy: string;
    org: string;
}
export interface TestDepGraphResponse {
    result: TestDepGraphResult;
    meta: TestDepGraphMeta;
}
export interface TestDependenciesResponse {
    result: TestDependenciesResult;
    meta: TestDepGraphMeta;
}
export interface Ignores {
    [path: string]: {
        paths: string[][];
        meta: {
            days?: number;
            reason?: string;
        };
    };
}
export interface PatchObject {
    [name: string]: {
        patched: string;
    };
}
export interface Upgrade {
    upgradeTo: string;
}
export interface UpgradeVulns extends Upgrade {
    vulns: string[];
}
export interface UpgradeRemediation extends UpgradeVulns {
    upgrades: string[];
}
export interface PatchRemediation {
    paths: PatchObject[];
}
export interface DependencyUpdates {
    [from: string]: UpgradeRemediation;
}
export interface PinRemediation extends UpgradeVulns {
    isTransitive: boolean;
}
export interface DependencyPins {
    [name: string]: PinRemediation;
}
export interface RemediationChanges {
    unresolved: IssueData[];
    upgrade: DependencyUpdates;
    patch: {
        [name: string]: PatchRemediation;
    };
    ignore: unknown;
    pin: DependencyPins;
}
declare function convertTestDepGraphResultToLegacy(res: TestDepGraphResponse, depGraph: depGraphLib.DepGraph, packageManager: SupportedProjectTypes | undefined, options: Options & TestOptions): LegacyVulnApiResult;
export { convertTestDepGraphResultToLegacy, AnnotatedIssue };
