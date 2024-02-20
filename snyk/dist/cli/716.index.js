"use strict";
exports.id = 716;
exports.ids = [716];
exports.modules = {

/***/ 22716:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.addIacDriftAnalytics = exports.performanceAnalyticsObject = exports.addIacAnalytics = void 0;
const types_1 = __webpack_require__(42258);
const analytics = __webpack_require__(82744);
const math_utils_1 = __webpack_require__(48537);
const file_utils_1 = __webpack_require__(58486);
const drift_1 = __webpack_require__(26445);
function addIacAnalytics(formattedResults, opts) {
    let totalIssuesCount = 0;
    const customRulesIdsFoundInIssues = {};
    let issuesFromCustomRulesCount = 0;
    const projectTypeAnalytics = {};
    const packageManagers = Array();
    formattedResults.forEach((res) => {
        var _a;
        totalIssuesCount =
            (totalIssuesCount || 0) + res.result.cloudConfigResults.length;
        const projectType = res.packageManager;
        packageManagers.push(projectType);
        projectTypeAnalytics[projectType] = (_a = projectTypeAnalytics[projectType]) !== null && _a !== void 0 ? _a : {
            count: 0,
        };
        projectTypeAnalytics[projectType]['count']++;
        res.result.cloudConfigResults.forEach((policy) => {
            projectTypeAnalytics[projectType][policy.severity] =
                (projectTypeAnalytics[projectType][policy.severity] || 0) + 1;
            if (policy.isGeneratedByCustomRule) {
                issuesFromCustomRulesCount++;
                customRulesIdsFoundInIssues[policy.publicId] = true;
            }
        });
    });
    const uniqueCustomRulesCount = Object.keys(customRulesIdsFoundInIssues).length;
    analytics.add('packageManager', Array.from(new Set(packageManagers)));
    analytics.add('iac-issues-count', totalIssuesCount);
    analytics.add('iac-ignored-issues-count', opts.ignoredIssuesCount);
    analytics.add('iac-type', projectTypeAnalytics);
    analytics.add('iac-metrics', exports.performanceAnalyticsObject);
    analytics.add('iac-test-count', formattedResults.length); // TODO: remove this once we all analytics use iac-files-count
    analytics.add('iac-files-count', formattedResults.length);
    analytics.add('iac-local-custom-rules', opts.rulesOrigin === types_1.RulesOrigin.Local);
    analytics.add('iac-remote-custom-rules', opts.rulesOrigin === types_1.RulesOrigin.Remote);
    analytics.add('iac-custom-rules-issues-count', issuesFromCustomRulesCount);
    analytics.add('iac-custom-rules-issues-percentage', math_utils_1.calculatePercentage(issuesFromCustomRulesCount, totalIssuesCount));
    analytics.add('iac-custom-rules-checksum', file_utils_1.computeCustomRulesBundleChecksum());
    analytics.add('iac-custom-rules-coverage-count', uniqueCustomRulesCount);
}
exports.addIacAnalytics = addIacAnalytics;
exports.performanceAnalyticsObject = {
    [types_1.PerformanceAnalyticsKey.InitLocalCache]: null,
    [types_1.PerformanceAnalyticsKey.FileLoading]: null,
    [types_1.PerformanceAnalyticsKey.FileParsing]: null,
    [types_1.PerformanceAnalyticsKey.FileScanning]: null,
    [types_1.PerformanceAnalyticsKey.OrgSettings]: null,
    [types_1.PerformanceAnalyticsKey.CustomSeverities]: null,
    [types_1.PerformanceAnalyticsKey.ResultFormatting]: null,
    [types_1.PerformanceAnalyticsKey.UsageTracking]: null,
    [types_1.PerformanceAnalyticsKey.CacheCleanup]: null,
    [types_1.PerformanceAnalyticsKey.Total]: null,
};
function addIacDriftAnalytics(analysis, options) {
    analytics.add('iac-drift-coverage', analysis.coverage);
    analytics.add('iac-drift-total-resources', analysis.summary.total_resources);
    analytics.add('iac-drift-total-unmanaged', analysis.summary.total_unmanaged);
    analytics.add('iac-drift-total-managed', analysis.summary.total_managed);
    analytics.add('iac-drift-total-missing', analysis.summary.total_missing);
    analytics.add('iac-drift-total-changed', analysis.summary.total_changed);
    analytics.add('iac-drift-iac-source-count', analysis.summary.total_iac_source_count);
    analytics.add('iac-drift-provider-name', analysis.provider_name);
    analytics.add('iac-drift-provider-version', analysis.provider_version);
    analytics.add('iac-drift-version', drift_1.driftctlVersion);
    analytics.add('iac-drift-scan-duration', analysis.scan_duration);
    let scope = 'all';
    if (options['only-managed']) {
        scope = 'managed';
    }
    else if (options['only-unmanaged']) {
        scope = 'unmanaged';
    }
    analytics.add('iac-drift-scan-scope', scope);
}
exports.addIacDriftAnalytics = addIacDriftAnalytics;


/***/ }),

/***/ 58486:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.makeFileAndDirectoryGenerator = exports.computePaths = exports.computeCustomRulesBundleChecksum = exports.isValidBundle = exports.extractBundle = exports.createIacDir = void 0;
const fs = __webpack_require__(35747);
const tar = __webpack_require__(97998);
const path = __webpack_require__(85622);
const crypto = __webpack_require__(76417);
const local_cache_1 = __webpack_require__(6255);
const oci_pull_1 = __webpack_require__(5029);
const detect_1 = __webpack_require__(45318);
const fs_1 = __webpack_require__(35747);
const path_1 = __webpack_require__(85622);
function hashData(s) {
    const hashedData = crypto
        .createHash('sha1')
        .update(s)
        .digest('hex');
    return hashedData;
}
function createIacDir() {
    // this path will be able to be customised by the user in the future
    const iacPath = path.join(local_cache_1.LOCAL_POLICY_ENGINE_DIR);
    try {
        if (!fs.existsSync(iacPath)) {
            fs.mkdirSync(iacPath, '700');
        }
        fs.accessSync(iacPath, fs.constants.W_OK);
    }
    catch {
        throw new local_cache_1.FailedToInitLocalCacheError();
    }
}
exports.createIacDir = createIacDir;
function extractBundle(response) {
    return new Promise((resolve, reject) => {
        response
            .on('error', reject)
            .pipe(tar.x({
            C: path.join(local_cache_1.LOCAL_POLICY_ENGINE_DIR),
        }))
            .on('finish', resolve)
            .on('error', reject);
    });
}
exports.extractBundle = extractBundle;
function isValidBundle(wasmPath, dataPath) {
    try {
        // verify that the correct files were generated, since this is user input
        return !(!fs.existsSync(wasmPath) || !fs.existsSync(dataPath));
    }
    catch {
        return false;
    }
}
exports.isValidBundle = isValidBundle;
function computeCustomRulesBundleChecksum() {
    try {
        const customRulesPolicyWasmPath = path.join(local_cache_1.LOCAL_POLICY_ENGINE_DIR, oci_pull_1.CUSTOM_RULES_TARBALL);
        // if bundle is not configured we don't want to include the checksum
        if (!fs.existsSync(customRulesPolicyWasmPath)) {
            return;
        }
        const policyWasm = fs.readFileSync(customRulesPolicyWasmPath, 'utf8');
        return hashData(policyWasm);
    }
    catch (err) {
        return;
    }
}
exports.computeCustomRulesBundleChecksum = computeCustomRulesBundleChecksum;
function computePaths(filePath, pathArg = '.') {
    const targetFilePath = path.resolve(filePath, '.');
    // the absolute path is needed to compute the full project path
    const cmdPath = path.resolve(pathArg);
    let projectPath;
    let targetFile;
    if (!detect_1.isLocalFolder(cmdPath)) {
        // if the provided path points to a file, then the project starts at the parent folder of that file
        // and the target file was provided as the path argument
        projectPath = path.dirname(cmdPath);
        targetFile = path.isAbsolute(pathArg)
            ? path.relative(process.cwd(), pathArg)
            : pathArg;
    }
    else {
        // otherwise, the project starts at the provided path
        // and the target file must be the relative path from the project path to the path of the scanned file
        projectPath = cmdPath;
        targetFile = path.relative(projectPath, targetFilePath);
    }
    return {
        targetFilePath,
        projectName: path.basename(projectPath),
        targetFile,
    };
}
exports.computePaths = computePaths;
/**
 * makeFileAndDirectoryGenerator is a generator function that helps walking the directory and file structure of this pathToScan
 * @param root
 * @param maxDepth? - An optional `maxDepth` argument can be provided to limit how deep in the file tree the search will go.
 * @returns {Generator<object>} - a generator which yields an object with directories or paths for the path to scan
 */
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
function* makeFileAndDirectoryGenerator(root = '.', maxDepth) {
    function* generatorHelper(pathToScan, currentDepth) {
        {
            yield { directory: pathToScan };
        }
        if (maxDepth !== currentDepth) {
            for (const dirent of fs_1.readdirSync(pathToScan, { withFileTypes: true })) {
                if (dirent.isDirectory() &&
                    fs.readdirSync(path_1.join(pathToScan, dirent.name)).length !== 0) {
                    yield* generatorHelper(path_1.join(pathToScan, dirent.name), currentDepth + 1);
                }
                else if (dirent.isFile()) {
                    yield {
                        file: {
                            dir: pathToScan,
                            fileName: path_1.join(pathToScan, dirent.name),
                        },
                    };
                }
            }
        }
    }
    yield* generatorHelper(root, 0);
}
exports.makeFileAndDirectoryGenerator = makeFileAndDirectoryGenerator;


/***/ }),

/***/ 6255:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.InvalidCustomRulesPath = exports.InvalidCustomRules = exports.FailedToExtractCustomRulesError = exports.FailedToDownloadRulesError = exports.FailedToInitLocalCacheError = exports.cleanLocalCache = exports.initLocalCache = exports.getLocalCachePath = exports.assertNever = exports.CUSTOM_POLICY_ENGINE_WASM_PATH = exports.LOCAL_POLICY_ENGINE_DIR = void 0;
const path = __webpack_require__(85622);
const fs = __webpack_require__(35747);
const types_1 = __webpack_require__(42258);
const needle = __webpack_require__(64484);
const rimraf = __webpack_require__(50984);
const file_utils_1 = __webpack_require__(58486);
const Debug = __webpack_require__(15158);
const errors_1 = __webpack_require__(55191);
const analytics = __webpack_require__(82744);
const error_utils_1 = __webpack_require__(23872);
const debug = Debug('iac-local-cache');
exports.LOCAL_POLICY_ENGINE_DIR = '.iac-data';
const KUBERNETES_POLICY_ENGINE_WASM_PATH = path.join(exports.LOCAL_POLICY_ENGINE_DIR, 'k8s_policy.wasm');
const KUBERNETES_POLICY_ENGINE_DATA_PATH = path.join(exports.LOCAL_POLICY_ENGINE_DIR, 'k8s_data.json');
const TERRAFORM_POLICY_ENGINE_WASM_PATH = path.join(exports.LOCAL_POLICY_ENGINE_DIR, 'tf_policy.wasm');
const TERRAFORM_POLICY_ENGINE_DATA_PATH = path.join(exports.LOCAL_POLICY_ENGINE_DIR, 'tf_data.json');
const CLOUDFORMATION_POLICY_ENGINE_WASM_PATH = path.join(exports.LOCAL_POLICY_ENGINE_DIR, 'cloudformation_policy.wasm');
const CLOUDFORMATION_POLICY_ENGINE_DATA_PATH = path.join(exports.LOCAL_POLICY_ENGINE_DIR, 'cloudformation_data.json');
const ARM_POLICY_ENGINE_WASM_PATH = path.join(exports.LOCAL_POLICY_ENGINE_DIR, 'arm_policy.wasm');
const ARM_POLICY_ENGINE_DATA_PATH = path.join(exports.LOCAL_POLICY_ENGINE_DIR, 'arm_data.json');
// NOTE: The filenames used for the custom policy bundles match those output
// by the `opa` CLI tool, which is why they are very generic.
exports.CUSTOM_POLICY_ENGINE_WASM_PATH = path.join(exports.LOCAL_POLICY_ENGINE_DIR, 'policy.wasm');
const CUSTOM_POLICY_ENGINE_DATA_PATH = path.join(exports.LOCAL_POLICY_ENGINE_DIR, 'data.json');
function assertNever(value) {
    throw new Error(`Unhandled discriminated union member: ${JSON.stringify(value)}`);
}
exports.assertNever = assertNever;
function getLocalCachePath(engineType) {
    switch (engineType) {
        case types_1.EngineType.Kubernetes:
            return [
                `${process.cwd()}/${KUBERNETES_POLICY_ENGINE_WASM_PATH}`,
                `${process.cwd()}/${KUBERNETES_POLICY_ENGINE_DATA_PATH}`,
            ];
        case types_1.EngineType.Terraform:
            return [
                `${process.cwd()}/${TERRAFORM_POLICY_ENGINE_WASM_PATH}`,
                `${process.cwd()}/${TERRAFORM_POLICY_ENGINE_DATA_PATH}`,
            ];
        case types_1.EngineType.CloudFormation:
            return [
                `${process.cwd()}/${CLOUDFORMATION_POLICY_ENGINE_WASM_PATH}`,
                `${process.cwd()}/${CLOUDFORMATION_POLICY_ENGINE_DATA_PATH}`,
            ];
        case types_1.EngineType.ARM:
            return [
                `${process.cwd()}/${ARM_POLICY_ENGINE_WASM_PATH}`,
                `${process.cwd()}/${ARM_POLICY_ENGINE_DATA_PATH}`,
            ];
        case types_1.EngineType.Custom:
            return [
                `${process.cwd()}/${exports.CUSTOM_POLICY_ENGINE_WASM_PATH}`,
                `${process.cwd()}/${CUSTOM_POLICY_ENGINE_DATA_PATH}`,
            ];
        default:
            assertNever(engineType);
    }
}
exports.getLocalCachePath = getLocalCachePath;
async function initLocalCache({ customRulesPath, } = {}) {
    try {
        file_utils_1.createIacDir();
    }
    catch (e) {
        throw new FailedToInitLocalCacheError();
    }
    // Attempt to extract the custom rules from the path provided.
    if (customRulesPath) {
        if (!fs.existsSync(customRulesPath)) {
            throw new InvalidCustomRulesPath(customRulesPath);
        }
        try {
            const response = fs.createReadStream(customRulesPath);
            await file_utils_1.extractBundle(response);
        }
        catch (e) {
            throw new FailedToExtractCustomRulesError(customRulesPath);
        }
        if (!file_utils_1.isValidBundle(exports.CUSTOM_POLICY_ENGINE_WASM_PATH, CUSTOM_POLICY_ENGINE_DATA_PATH)) {
            throw new InvalidCustomRules(customRulesPath);
        }
    }
    // We extract the Snyk rules after the custom rules to ensure our files
    // always overwrite whatever might be there.
    try {
        const BUNDLE_URL = 'https://static.snyk.io/cli/wasm/bundle.tar.gz';
        const response = needle.get(BUNDLE_URL);
        await file_utils_1.extractBundle(response);
    }
    catch (e) {
        throw new FailedToDownloadRulesError();
    }
}
exports.initLocalCache = initLocalCache;
function cleanLocalCache() {
    // path to delete is hardcoded for now
    const iacPath = path.join(`${process.cwd()}`, exports.LOCAL_POLICY_ENGINE_DIR);
    try {
        // when we support Node version >= 12.10.0 , we can replace rimraf
        // with the native fs.rmdirSync(path, {recursive: true})
        rimraf.sync(iacPath);
    }
    catch (e) {
        const err = new FailedToCleanLocalCacheError();
        analytics.add('error-code', err.code);
        debug('The local cache directory could not be deleted');
    }
}
exports.cleanLocalCache = cleanLocalCache;
class FailedToInitLocalCacheError extends errors_1.CustomError {
    constructor(message) {
        super(message || 'Failed to initialize local cache');
        this.code = types_1.IaCErrorCodes.FailedToInitLocalCacheError;
        this.strCode = error_utils_1.getErrorStringCode(this.code);
        this.userMessage =
            'We were unable to create a local directory to store the test assets, please ensure that the current working directory is writable';
    }
}
exports.FailedToInitLocalCacheError = FailedToInitLocalCacheError;
class FailedToDownloadRulesError extends errors_1.CustomError {
    constructor(message) {
        super(message || 'Failed to download policies');
        this.code = types_1.IaCErrorCodes.FailedToDownloadRulesError;
        this.strCode = error_utils_1.getErrorStringCode(this.code);
        this.userMessage =
            'We were unable to download the security rules, please ensure the network can access https://static.snyk.io';
    }
}
exports.FailedToDownloadRulesError = FailedToDownloadRulesError;
class FailedToExtractCustomRulesError extends errors_1.CustomError {
    constructor(path, message) {
        super(message || 'Failed to download policies');
        this.code = types_1.IaCErrorCodes.FailedToExtractCustomRulesError;
        this.strCode = error_utils_1.getErrorStringCode(this.code);
        this.userMessage = `We were unable to extract the rules provided at: ${path}. The provided bundle may be corrupted or invalid. Please ensure it was generated using the 'snyk-iac-rules' SDK`;
    }
}
exports.FailedToExtractCustomRulesError = FailedToExtractCustomRulesError;
class InvalidCustomRules extends errors_1.CustomError {
    constructor(path, message) {
        super(message || 'Invalid custom rules bundle');
        this.code = types_1.IaCErrorCodes.InvalidCustomRules;
        this.strCode = error_utils_1.getErrorStringCode(this.code);
        this.userMessage = `We were unable to extract the rules provided at: ${path}. The provided bundle does not match the required structure. Please ensure it was generated using the 'snyk-iac-rules' SDK`;
    }
}
exports.InvalidCustomRules = InvalidCustomRules;
class InvalidCustomRulesPath extends errors_1.CustomError {
    constructor(path, message) {
        super(message || 'Invalid path to custom rules bundle');
        this.code = types_1.IaCErrorCodes.InvalidCustomRulesPath;
        this.strCode = error_utils_1.getErrorStringCode(this.code);
        this.userMessage = `We were unable to extract the rules provided at: ${path}. The bundle at the provided path does not exist`;
    }
}
exports.InvalidCustomRulesPath = InvalidCustomRulesPath;
class FailedToCleanLocalCacheError extends errors_1.CustomError {
    constructor(message) {
        super(message || 'Failed to clean local cache');
        this.code = types_1.IaCErrorCodes.FailedToCleanLocalCacheError;
        this.strCode = error_utils_1.getErrorStringCode(this.code);
        this.userMessage = ''; // Not a user facing error.
    }
}


/***/ }),

/***/ 48537:
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.calculatePercentage = void 0;
/**
 * Calculate percentage from relative and total amounts.
 * @param relativeValue The relative amount.
 * @param totalValue  The total amount.
 * @returns The calculated precentage.
 */
exports.calculatePercentage = (relativeValue, totalValue) => +(totalValue ? (relativeValue / totalValue) * 100 : 0).toFixed(2);


/***/ }),

/***/ 5029:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.UnsupportedEntitlementPullError = exports.InvalidRemoteRegistryURLError = exports.InvalidManifestSchemaVersionError = exports.FailedToBuildOCIArtifactError = exports.pull = exports.extractOCIRegistryURLComponents = exports.CUSTOM_RULES_TARBALL = void 0;
const registryClient = __webpack_require__(28310);
const fs_1 = __webpack_require__(35747);
const path = __webpack_require__(85622);
const types_1 = __webpack_require__(42258);
const errors_1 = __webpack_require__(55191);
const error_utils_1 = __webpack_require__(23872);
const local_cache_1 = __webpack_require__(6255);
const Debug = __webpack_require__(15158);
const file_utils_1 = __webpack_require__(58486);
const debug = Debug('iac-oci-pull');
exports.CUSTOM_RULES_TARBALL = 'custom-bundle.tar.gz';
function extractOCIRegistryURLComponents(OCIRegistryURL) {
    try {
        const urlWithoutProtocol = OCIRegistryURL.includes('://')
            ? OCIRegistryURL.split('://')[1]
            : OCIRegistryURL;
        const firstSlashIdx = urlWithoutProtocol.indexOf('/');
        if (firstSlashIdx === -1) {
            throw new InvalidRemoteRegistryURLError(OCIRegistryURL);
        }
        const [registryHost, repoWithTag] = [
            urlWithoutProtocol.substring(0, firstSlashIdx),
            urlWithoutProtocol.substring(firstSlashIdx + 1),
        ];
        if (!registryHost || !repoWithTag) {
            throw new InvalidRemoteRegistryURLError(OCIRegistryURL);
        }
        const [repo, tag = 'latest'] = repoWithTag.split(':');
        if (!repo) {
            throw new InvalidRemoteRegistryURLError(OCIRegistryURL);
        }
        return { registryBase: registryHost, repo, tag };
    }
    catch {
        throw new InvalidRemoteRegistryURLError(OCIRegistryURL);
    }
}
exports.extractOCIRegistryURLComponents = extractOCIRegistryURLComponents;
/**
 * Downloads an OCI Artifact from a remote OCI Registry and writes it to the disk.
 * The artifact here is a custom rules bundle stored in a remote registry.
 * In order to do that, it calls an external docker registry v2 client to get the manifests, the layers and then builds the artifact.
 * Example: https://github.com/opencontainers/image-spec/blob/main/manifest.md#example-image-manifest
 * @param OCIRegistryURL - the URL where the custom rules bundle is stored
 * @param opt????? (optional) - object that holds the credentials and other metadata required for the registry-v2-client
 **/
async function pull({ registryBase, repo, tag }, opt) {
    const manifest = await registryClient.getManifest(registryBase, repo, tag, opt === null || opt === void 0 ? void 0 : opt.username, opt === null || opt === void 0 ? void 0 : opt.password, opt === null || opt === void 0 ? void 0 : opt.reqOptions);
    if (manifest.schemaVersion !== 2) {
        throw new InvalidManifestSchemaVersionError(manifest.schemaVersion.toString());
    }
    const manifestLayers = manifest.layers;
    // We assume that we will always have an artifact of a single layer
    if (manifestLayers.length > 1) {
        debug('There were more than one layers found in the OCI Artifact.');
    }
    const blob = await registryClient.getLayer(registryBase, repo, manifestLayers[0].digest, opt === null || opt === void 0 ? void 0 : opt.username, opt === null || opt === void 0 ? void 0 : opt.password, opt === null || opt === void 0 ? void 0 : opt.reqOptions);
    try {
        const downloadPath = path.join(local_cache_1.LOCAL_POLICY_ENGINE_DIR, exports.CUSTOM_RULES_TARBALL);
        file_utils_1.createIacDir();
        await fs_1.promises.writeFile(downloadPath, blob);
        return downloadPath;
    }
    catch (err) {
        throw new FailedToBuildOCIArtifactError();
    }
}
exports.pull = pull;
class FailedToBuildOCIArtifactError extends errors_1.CustomError {
    constructor(message) {
        super(message || 'Could not build OCI Artifact');
        this.code = types_1.IaCErrorCodes.FailedToBuildOCIArtifactError;
        this.strCode = error_utils_1.getErrorStringCode(this.code);
        this.userMessage =
            'We were unable to build the remote OCI Artifact locally, please ensure that the local directory is writeable.';
    }
}
exports.FailedToBuildOCIArtifactError = FailedToBuildOCIArtifactError;
class InvalidManifestSchemaVersionError extends errors_1.CustomError {
    constructor(message) {
        super(message || 'Invalid manifest schema version');
        this.code = types_1.IaCErrorCodes.InvalidRemoteRegistryURLError;
        this.strCode = error_utils_1.getErrorStringCode(this.code);
        this.userMessage = `Invalid manifest schema version: ${message}. We currently support Image Manifest Version 2, Schema 2`;
    }
}
exports.InvalidManifestSchemaVersionError = InvalidManifestSchemaVersionError;
class InvalidRemoteRegistryURLError extends errors_1.CustomError {
    constructor(url) {
        super('Invalid URL for Remote Registry');
        this.code = types_1.IaCErrorCodes.InvalidRemoteRegistryURLError;
        this.strCode = error_utils_1.getErrorStringCode(this.code);
        this.userMessage = `The provided remote registry URL${url ? `: "${url}"` : ''} is invalid. Please check it again.`;
    }
}
exports.InvalidRemoteRegistryURLError = InvalidRemoteRegistryURLError;
class UnsupportedEntitlementPullError extends errors_1.CustomError {
    constructor(entitlement) {
        super(`OCI Pull not supported - Missing the ${entitlement} entitlement`);
        this.code = types_1.IaCErrorCodes.UnsupportedEntitlementPullError;
        this.strCode = error_utils_1.getErrorStringCode(this.code);
        this.userMessage = `The custom rules feature is currently not supported for this org. To enable it, please contact snyk support.`;
    }
}
exports.UnsupportedEntitlementPullError = UnsupportedEntitlementPullError;


/***/ })

};
;
//# sourceMappingURL=716.index.js.map