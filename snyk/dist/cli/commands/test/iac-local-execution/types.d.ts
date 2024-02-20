/// <reference types="node" />
import { IacFileTypes, IacProjectType, IacProjectTypes } from '../../../../lib/iac/constants';
import { SEVERITY } from '../../../../lib/snyk-test/common';
import { AnnotatedIssue, IgnoreSettings, TestResult } from '../../../../lib/snyk-test/legacy';
import { IacFileInDirectory, Options, TestOptions, PolicyOptions } from '../../../../lib/types';
export interface IacFileData extends IacFileInDirectory {
    fileContent: string;
}
export declare enum ValidFileType {
    Terraform = "tf",
    JSON = "json",
    YAML = "yaml",
    YML = "yml",
    TFVARS = "tfvars"
}
export declare const VALID_FILE_TYPES: string[];
export declare const VALID_TERRAFORM_FILE_TYPES: string[];
export interface IacFileParsed extends IacFileData {
    jsonContent: Record<string, unknown> | TerraformScanInput;
    projectType: IacProjectType;
    engineType: EngineType;
    docId?: number;
}
export interface IacFileParseFailure extends IacFileData {
    jsonContent: null;
    engineType: null;
    failureReason: string;
    err: Error;
}
export declare type ScanningResults = {
    scannedFiles: Array<IacFileScanResult>;
    unscannedFiles: Array<IacFileParseFailure>;
};
export declare type ParsingResults = {
    parsedFiles: Array<IacFileParsed>;
    failedFiles: Array<IacFileParseFailure>;
};
export interface IacFileScanResult extends IacFileParsed {
    violatedPolicies: PolicyMetadata[];
}
export interface IacShareResultsFormat {
    projectName: string;
    targetFile: string;
    filePath: string;
    fileType: IacFileTypes;
    projectType: IacProjectType;
    violatedPolicies: PolicyMetadata[];
}
export declare type FormattedResult = {
    result: {
        cloudConfigResults: Array<PolicyMetadata>;
        projectType: IacProjectTypes;
    };
    meta: TestMeta;
    filesystemPolicy: boolean;
    vulnerabilities: AnnotatedIssue[];
    dependencyCount: number;
    licensesPolicy: object | null;
    ignoreSettings: IgnoreSettings | null;
    targetFile: string;
    projectName: string;
    org: string;
    policy: string;
    isPrivate: boolean;
    targetFilePath: string;
    packageManager: IacProjectType;
};
export declare type IacCustomPolicies = Record<string, {
    severity?: string;
}>;
export declare enum RulesOrigin {
    Local = "local",
    Remote = "remote",
    Internal = "internal"
}
export interface IacCustomRules {
    isEnabled?: boolean;
    ociRegistryURL?: string;
    ociRegistryTag?: string;
}
export interface IacEntitlements {
    infrastructureAsCode?: boolean;
    iacDrift?: boolean;
    iacCustomRulesEntitlement?: boolean;
}
export interface IacOrgSettings {
    meta: TestMeta;
    customPolicies: IacCustomPolicies;
    customRules?: IacCustomRules;
    entitlements?: IacEntitlements;
}
export interface TestMeta {
    isPrivate: boolean;
    isLicensesEnabled: boolean;
    org: string;
    ignoreSettings?: IgnoreSettings | null;
    projectId?: string;
    policy?: string;
    gitRemoteUrl?: string;
}
export interface OpaWasmInstance {
    evaluate: (data: Record<string, any>) => {
        results: PolicyMetadata[];
    };
    setData: (data: Record<string, any>) => void;
}
export declare type SafeAnalyticsOutput = Omit<IacFileParsed | IacFileParseFailure, 'fileContent' | 'jsonContent' | 'engineType'>;
export declare enum EngineType {
    Kubernetes = 0,
    Terraform = 1,
    CloudFormation = 2,
    ARM = 3,
    Custom = 4
}
export interface PolicyMetadata {
    id?: string;
    publicId: string;
    type?: string;
    subType: string;
    title: string;
    documentation?: string;
    isGeneratedByCustomRule?: boolean;
    description?: string;
    severity: SEVERITY | 'none';
    msg: string;
    issue: string;
    impact: string;
    resolve: string;
    references: string[];
    remediation?: Partial<Record<'terraform' | 'cloudformation' | 'arm' | 'kubernetes', string>>;
    docId?: number;
}
export declare type IaCTestFlags = Pick<Options & TestOptions & PolicyOptions, 'org' | 'insecure' | 'debug' | 'experimental' | 'detectionDepth' | 'severityThreshold' | 'json' | 'sarif' | 'report' | 'target-reference' | 'ignore-policy' | 'policy-path' | 'tags'> & {
    'json-file-output'?: string;
    'sarif-file-output'?: string;
    v?: boolean;
    version?: boolean;
    h?: boolean;
    help?: 'help';
    q?: boolean;
    quiet?: boolean;
    path?: string;
    rules?: string;
    'project-tags'?: string;
    'project-environment'?: string;
    'project-lifecycle'?: string;
    'project-business-criticality'?: string;
} & TerraformPlanFlags;
interface TerraformPlanFlags {
    scan?: TerraformPlanScanMode;
}
export declare enum TerraformPlanScanMode {
    DeltaScan = "resource-changes",
    FullScan = "planned-values"
}
export interface TerraformPlanResource {
    address: string;
    mode: string;
    type: string;
    name: string;
    values: Record<string, unknown>;
    index: number | string;
}
export interface TerraformPlanResourceChange extends Omit<TerraformPlanResource, 'values'> {
    change: {
        actions: ResourceActions;
        before: Record<string, unknown> | null;
        after: Record<string, unknown> | null;
    };
}
export interface TerraformPlanJson {
    resource_changes: Array<TerraformPlanResourceChange>;
    configuration: {
        root_module: {
            resources: Array<TerraformPlanReferencedResource>;
        };
    };
}
export interface TerraformPlanReferencedResource extends TerraformPlanResource {
    expressions: Record<string, TerraformPlanExpression>;
}
export interface TerraformPlanExpression {
    references: Array<string>;
}
export interface TerraformScanInput {
    resource: Record<string, Record<string, unknown>>;
    data: Record<string, Record<string, unknown>>;
}
export declare type ResourceActions = ['no-op'] | ['create'] | ['read'] | ['update'] | ['delete', 'create'] | ['create', 'delete'] | ['delete'];
export declare const VALID_RESOURCE_ACTIONS_FOR_DELTA_SCAN: ResourceActions[];
export declare const VALID_RESOURCE_ACTIONS_FOR_FULL_SCAN: ResourceActions[];
export declare enum IaCErrorCodes {
    FailedToInitLocalCacheError = 1000,
    FailedToCleanLocalCacheError = 1001,
    FailedToDownloadRulesError = 1002,
    FailedToExtractCustomRulesError = 1003,
    InvalidCustomRules = 1004,
    InvalidCustomRulesPath = 1005,
    NoFilesToScanError = 1010,
    FailedToLoadFileError = 1011,
    UnsupportedFileTypeError = 1020,
    InvalidJsonFileError = 1021,
    InvalidYamlFileError = 1022,
    FailedToDetectJsonConfigError = 1023,
    FailedToDetectYamlConfigError = 1024,
    MissingRequiredFieldsInKubernetesYamlError = 1031,
    FailedToParseHelmError = 1032,
    FailedToParseTerraformFileError = 1040,
    FailedToExtractResourcesInTerraformPlanError = 1052,
    FailedToBuildPolicyEngine = 1060,
    FailedToExecutePolicyEngine = 1061,
    FailedToFormatResults = 1070,
    FailedToExtractLineNumberError = 1071,
    FailedToGetIacOrgSettingsError = 1080,
    FlagError = 1090,
    FlagValueError = 1091,
    UnsupportedEntitlementFlagError = 1092,
    FeatureFlagError = 1093,
    FailedToExecuteCustomRulesError = 1100,
    FailedToPullCustomBundleError = 1101,
    FailedToBuildOCIArtifactError = 1102,
    InvalidRemoteRegistryURLError = 1103,
    InvalidManifestSchemaVersionError = 1104,
    UnsupportedFeatureFlagPullError = 1105,
    UnsupportedEntitlementPullError = 1106,
    InvalidServiceError = 1110,
    UnsupportedReportCommandError = 1120
}
export interface TestReturnValue {
    results: TestResult | TestResult[];
    failures?: IacFileInDirectory[];
}
export interface ImageManifest {
    schemaVersion: number;
    mediaType: string;
    config: ManifestConfig;
    layers: ManifestConfig[];
}
export interface ManifestConfig {
    mediaType: string;
    size: number;
    digest: string;
}
export interface Layer {
    config: ManifestConfig;
    blob: Buffer;
}
export interface OCIPullOptions {
    username?: string;
    password?: string;
    reqOptions?: {
        accept?: string;
        indexContentType?: string;
    };
    imageSavePath?: string;
}
export interface OCIRegistryURLComponents {
    registryBase: string;
    repo: string;
    tag: string;
}
export declare const manifestContentType = "application/vnd.oci.image.manifest.v1+json";
export declare const layerContentType = "application/vnd.oci.image.layer.v1.tar+gzip";
export declare enum PerformanceAnalyticsKey {
    InitLocalCache = "cache-init-ms",
    FileLoading = "file-loading-ms",
    FileParsing = "file-parsing-ms",
    FileScanning = "file-scanning-ms",
    OrgSettings = "org-settings-ms",
    CustomSeverities = "custom-severities-ms",
    ResultFormatting = "results-formatting-ms",
    UsageTracking = "usage-tracking-ms",
    CacheCleanup = "cache-cleanup-ms",
    Total = "total-iac-ms"
}
export interface ShareResultsOutput {
    projectPublicIds: {
        [targetFile: string]: string;
    };
    gitRemoteUrl?: string;
}
export {};