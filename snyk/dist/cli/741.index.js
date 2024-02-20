"use strict";
exports.id = 741;
exports.ids = [741];
exports.modules = {

/***/ 80423:
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.convertLegacyTestResultToNew = void 0;
function convertVulnerabilities(vulns) {
    const issuesData = {};
    const issues = [];
    vulns.forEach((vuln) => {
        issuesData[vuln.id] = {
            id: vuln.id,
            severity: vuln.severity,
            title: vuln.title,
        };
        issues.push({
            pkgName: vuln.packageName,
            pkgVersion: vuln.version,
            issueId: vuln.id,
            // TODO: add fixInfo when needed
            fixInfo: {},
        });
    });
    return { issuesData, issues };
}
function convertLegacyTestResultToNew(testResult) {
    const { issues, issuesData } = convertVulnerabilities(testResult.vulnerabilities);
    return {
        issuesData,
        issues,
        remediation: testResult.remediation,
        // TODO: grab this once Ecosystems flow starts sending back ScanResult
        depGraphData: {},
    };
}
exports.convertLegacyTestResultToNew = convertLegacyTestResultToNew;


/***/ }),

/***/ 16898:
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.convertLegacyTestResultToScanResult = void 0;
function convertLegacyTestResultToScanResult(testResult) {
    if (!testResult.packageManager) {
        throw new Error('Only results with packageManagers are supported for conversion');
    }
    return {
        identity: {
            type: testResult.packageManager,
            // this is because not all plugins send it back today, but we should always have it
            targetFile: testResult.targetFile || testResult.displayTargetFile,
        },
        name: testResult.projectName,
        // TODO: grab this once Ecosystems flow starts sending back ScanResult
        facts: [],
        policy: testResult.policy,
        // TODO: grab this once Ecosystems flow starts sending back ScanResult
        target: {},
    };
}
exports.convertLegacyTestResultToScanResult = convertLegacyTestResultToScanResult;


/***/ }),

/***/ 92730:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.convertLegacyTestResultToFixEntities = void 0;
const fs = __webpack_require__(35747);
const pathLib = __webpack_require__(85622);
const convert_legacy_test_result_to_new_1 = __webpack_require__(80423);
const convert_legacy_test_result_to_scan_result_1 = __webpack_require__(16898);
function convertLegacyTestResultToFixEntities(testResults, root, options) {
    if (testResults instanceof Error) {
        return [];
    }
    const oldResults = Array.isArray(testResults) ? testResults : [testResults];
    return oldResults.map((res) => ({
        options,
        workspace: {
            path: root,
            readFile: async (path) => {
                return fs.readFileSync(pathLib.resolve(root, path), 'utf8');
            },
            writeFile: async (path, content) => {
                return fs.writeFileSync(pathLib.resolve(root, path), content, 'utf8');
            },
        },
        scanResult: convert_legacy_test_result_to_scan_result_1.convertLegacyTestResultToScanResult(res),
        testResult: convert_legacy_test_result_to_new_1.convertLegacyTestResultToNew(res),
    }));
}
exports.convertLegacyTestResultToFixEntities = convertLegacyTestResultToFixEntities;


/***/ }),

/***/ 79898:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.getDisplayPath = void 0;
const pathLib = __webpack_require__(85622);
const detect_1 = __webpack_require__(45318);
function getDisplayPath(path) {
    if (!detect_1.isLocalFolder(path)) {
        return path;
    }
    if (path === process.cwd()) {
        return pathLib.parse(path).name;
    }
    return pathLib.relative(process.cwd(), path);
}
exports.getDisplayPath = getDisplayPath;


/***/ }),

/***/ 73741:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
const Debug = __webpack_require__(15158);
const snykFix = __webpack_require__(53776);
const ora = __webpack_require__(63395);
const snyk = __webpack_require__(9146);
const analytics = __webpack_require__(82744);
const convert_legacy_tests_results_to_fix_entities_1 = __webpack_require__(92730);
const format_test_error_1 = __webpack_require__(68214);
const process_command_args_1 = __webpack_require__(52369);
const validate_credentials_1 = __webpack_require__(4593);
const validate_test_options_1 = __webpack_require__(83476);
const set_default_test_options_1 = __webpack_require__(13285);
const validate_fix_command_is_supported_1 = __webpack_require__(16117);
const get_display_path_1 = __webpack_require__(79898);
const chalk_1 = __webpack_require__(32589);
const theme_1 = __webpack_require__(86988);
const debug = Debug('snyk-fix');
const snykFixFeatureFlag = 'cliSnykFix';
async function fix(...args) {
    const { options: rawOptions, paths } = await process_command_args_1.processCommandArgs(...args);
    const options = set_default_test_options_1.setDefaultTestOptions(rawOptions);
    debug(options);
    await validate_fix_command_is_supported_1.validateFixCommandIsSupported(options);
    validate_test_options_1.validateTestOptions(options);
    validate_credentials_1.validateCredentials(options);
    const results = [];
    results.push(...(await runSnykTestLegacy(options, paths)));
    // fix
    debug(`Organization has ${snykFixFeatureFlag} feature flag enabled for experimental Snyk fix functionality`);
    const vulnerableResults = results.filter((res) => Object.keys(res.testResult.issues).length);
    const { dryRun, quiet, sequential: sequentialFix } = options;
    const { fixSummary, meta, results: resultsByPlugin } = await snykFix.fix(results, {
        dryRun,
        quiet,
        sequentialFix,
    });
    setSnykFixAnalytics(fixSummary, meta, results, resultsByPlugin, vulnerableResults);
    // `snyk test` did not return any test results
    if (results.length === 0) {
        throw new Error(fixSummary);
    }
    // `snyk test` returned no vulnerable results, so nothing to fix
    if (vulnerableResults.length === 0) {
        return fixSummary;
    }
    // `snyk test` returned vulnerable results
    // however some errors occurred during `snyk fix` and nothing was fixed in the end
    const anyFailed = meta.failed > 0;
    const noneFixed = meta.fixed === 0;
    if (anyFailed && noneFixed) {
        throw new Error(fixSummary);
    }
    return fixSummary;
}
exports.default = fix;
/* @deprecated
 * TODO: once project envelope is default all code below will be deleted
 * we should be calling test via new Ecosystems instead
 */
async function runSnykTestLegacy(options, paths) {
    const results = [];
    const stdOutSpinner = ora({
        isSilent: options.quiet,
        stream: process.stdout,
    });
    const stdErrSpinner = ora({
        isSilent: options.quiet,
        stream: process.stdout,
    });
    stdErrSpinner.start();
    stdOutSpinner.start();
    for (const path of paths) {
        let displayPath = path;
        const spinnerMessage = `Running \`snyk test\` for ${displayPath}`;
        try {
            displayPath = get_display_path_1.getDisplayPath(path);
            stdOutSpinner.text = spinnerMessage;
            stdOutSpinner.render();
            // Create a copy of the options so a specific test can
            // modify them i.e. add `options.file` etc. We'll need
            // these options later.
            const snykTestOptions = {
                ...options,
                path,
                projectName: options['project-name'],
            };
            const testResults = [];
            const testResultForPath = await snyk.test(path, { ...snykTestOptions, quiet: true });
            testResults.push(...(Array.isArray(testResultForPath)
                ? testResultForPath
                : [testResultForPath]));
            const newRes = convert_legacy_tests_results_to_fix_entities_1.convertLegacyTestResultToFixEntities(testResults, path, options);
            results.push(...newRes);
            stdOutSpinner.stopAndPersist({
                text: spinnerMessage,
                symbol: `\n${theme_1.icon.RUN}`,
            });
        }
        catch (error) {
            const testError = format_test_error_1.formatTestError(error);
            const userMessage = theme_1.color.status.error(`Failed! ${testError.message}.`) +
                `\n  Tip: run \`snyk test ${displayPath} -d\` for more information.`;
            stdOutSpinner.stopAndPersist({
                text: spinnerMessage,
                symbol: `\n${theme_1.icon.RUN}`,
            });
            stdErrSpinner.stopAndPersist({
                text: userMessage,
                symbol: chalk_1.default.red(' '),
            });
            debug(userMessage);
        }
    }
    stdOutSpinner.stop();
    stdErrSpinner.stop();
    return results;
}
function setSnykFixAnalytics(fixSummary, meta, snykTestResponses, resultsByPlugin, vulnerableResults) {
    // Analytics # of projects
    analytics.add('snykFixFailedProjects', meta.failed);
    analytics.add('snykFixFixedProjects', meta.fixed);
    analytics.add('snykFixTotalProjects', snykTestResponses.length);
    analytics.add('snykFixVulnerableProjects', vulnerableResults.length);
    // Analytics # of issues
    analytics.add('snykFixFixableIssues', meta.fixableIssues);
    analytics.add('snykFixFixedIssues', meta.fixedIssues);
    analytics.add('snykFixTotalIssues', meta.totalIssues);
    analytics.add('snykFixSummary', fixSummary);
    // Analytics for errors
    for (const plugin of Object.keys(resultsByPlugin)) {
        const errors = [];
        const failedToFix = resultsByPlugin[plugin].failed;
        for (const failed of failedToFix) {
            if ('error' in failed) {
                errors.push(failed.error.message);
            }
            if ('changes' in failed) {
                errors.push(...failed.changes.map((f) => JSON.stringify(f)));
            }
        }
        analytics.add('snykFixErrors', { [plugin]: errors });
    }
}


/***/ }),

/***/ 16117:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.validateFixCommandIsSupported = void 0;
const Debug = __webpack_require__(15158);
const ecosystems_1 = __webpack_require__(5168);
const feature_flags_1 = __webpack_require__(63011);
const not_supported_by_ecosystem_1 = __webpack_require__(72571);
const errors_1 = __webpack_require__(55191);
const chalk_1 = __webpack_require__(32589);
const debug = Debug('snyk-fix');
const snykFixFeatureFlag = 'cliSnykFix';
async function validateFixCommandIsSupported(options) {
    if (options.docker) {
        throw new not_supported_by_ecosystem_1.FeatureNotSupportedByEcosystemError('snyk fix', 'docker');
    }
    const ecosystem = ecosystems_1.getEcosystemForTest(options);
    if (ecosystem) {
        throw new not_supported_by_ecosystem_1.FeatureNotSupportedByEcosystemError('snyk fix', ecosystem);
    }
    const snykFixSupported = await feature_flags_1.isFeatureFlagSupportedForOrg(snykFixFeatureFlag, options.org);
    debug('Feature flag check returned: ', snykFixSupported);
    if (snykFixSupported.code === 401 || snykFixSupported.code === 403) {
        throw errors_1.AuthFailedError(snykFixSupported.error, snykFixSupported.code);
    }
    if (!snykFixSupported.ok) {
        const snykFixErrorMessage = chalk_1.default.red(`\`snyk fix\` is not supported${options.org ? ` for org '${options.org}'` : ''}.`) +
            '\nSee documentation on how to enable this beta feature: https://docs.snyk.io/features/snyk-cli/fix-vulnerabilities-from-the-cli/automatic-remediation-with-snyk-fix';
        const unsupportedError = new Error(snykFixErrorMessage);
        throw unsupportedError;
    }
    return true;
}
exports.validateFixCommandIsSupported = validateFixCommandIsSupported;


/***/ }),

/***/ 68214:
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.formatTestError = void 0;
function formatTestError(error) {
    // Possible error cases:
    // - the test found some vulns. `error.message` is a
    // JSON-stringified
    //   test result.
    // - the flow failed, `error` is a real Error object.
    // - the flow failed, `error` is a number or string
    // describing the problem.
    //
    // To standardise this, make sure we use the best _object_ to
    // describe the error.
    let errorResponse;
    if (error instanceof Error) {
        errorResponse = error;
    }
    else if (typeof error !== 'object') {
        errorResponse = new Error(error);
    }
    else {
        try {
            errorResponse = JSON.parse(error.message);
        }
        catch (unused) {
            errorResponse = error;
        }
    }
    return errorResponse;
}
exports.formatTestError = formatTestError;


/***/ }),

/***/ 13285:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.setDefaultTestOptions = void 0;
const config_1 = __webpack_require__(22541);
function setDefaultTestOptions(options) {
    const svpSupplied = (options['show-vulnerable-paths'] || '')
        .toString()
        .toLowerCase();
    delete options['show-vulnerable-paths'];
    return {
        ...options,
        // org fallback to config unless specified
        org: options.org || config_1.default.org,
        // making `show-vulnerable-paths` 'some' by default.
        showVulnPaths: showVulnPathsMapping[svpSupplied] || 'some',
    };
}
exports.setDefaultTestOptions = setDefaultTestOptions;
const showVulnPathsMapping = {
    false: 'none',
    none: 'none',
    true: 'some',
    some: 'some',
    all: 'all',
};


/***/ }),

/***/ 4593:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.validateCredentials = void 0;
const api_token_1 = __webpack_require__(95181);
function validateCredentials(options) {
    try {
        api_token_1.apiTokenExists();
    }
    catch (err) {
        if (api_token_1.getOAuthToken()) {
            return;
        }
        else if (options.docker && api_token_1.getDockerToken()) {
            options.testDepGraphDockerEndpoint = '/docker-jwt/test-dependencies';
            options.isDockerUser = true;
        }
        else {
            throw err;
        }
    }
}
exports.validateCredentials = validateCredentials;


/***/ }),

/***/ 83476:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.validateTestOptions = void 0;
const theme_1 = __webpack_require__(86988);
const common_1 = __webpack_require__(53110);
const fail_on_error_ts_1 = __webpack_require__(18195);
function validateTestOptions(options) {
    if (options.severityThreshold &&
        !validateSeverityThreshold(options.severityThreshold)) {
        throw new Error('INVALID_SEVERITY_THRESHOLD');
    }
    if (options.failOn && !validateFailOn(options.failOn)) {
        const error = new fail_on_error_ts_1.FailOnError();
        throw theme_1.color.status.error(error.message);
    }
}
exports.validateTestOptions = validateTestOptions;
function validateSeverityThreshold(severityThreshold) {
    return common_1.SEVERITIES.map((s) => s.verboseName).indexOf(severityThreshold) > -1;
}
function validateFailOn(arg) {
    return Object.keys(common_1.FAIL_ON).includes(arg);
}


/***/ }),

/***/ 18195:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.FailOnError = void 0;
const custom_error_1 = __webpack_require__(17188);
const common_1 = __webpack_require__(53110);
class FailOnError extends custom_error_1.CustomError {
    constructor() {
        super(FailOnError.ERROR_MESSAGE);
    }
}
exports.FailOnError = FailOnError;
FailOnError.ERROR_MESSAGE = 'Invalid fail on argument, please use one of: ' +
    Object.keys(common_1.FAIL_ON).join(' | ');


/***/ }),

/***/ 72571:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.FeatureNotSupportedByEcosystemError = void 0;
const custom_error_1 = __webpack_require__(17188);
class FeatureNotSupportedByEcosystemError extends custom_error_1.CustomError {
    constructor(feature, ecosystem) {
        super(`Unsupported ecosystem ${ecosystem} for ${feature}.`);
        this.code = 422;
        this.feature = feature;
        this.userMessage = `\`${feature}\` is not supported for ecosystem '${ecosystem}'`;
    }
}
exports.FeatureNotSupportedByEcosystemError = FeatureNotSupportedByEcosystemError;


/***/ }),

/***/ 53776:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.extractMeta = exports.groupEntitiesPerScanType = exports.fix = void 0;
const debugLib = __webpack_require__(15158);
const pMap = __webpack_require__(54270);
const ora = __webpack_require__(63395);
const chalk = __webpack_require__(98250);
const outputFormatter = __webpack_require__(70962);
const load_plugin_1 = __webpack_require__(65090);
const partition_by_vulnerable_1 = __webpack_require__(24957);
const error_to_user_message_1 = __webpack_require__(5258);
const total_issues_count_1 = __webpack_require__(41160);
const fixable_issues_1 = __webpack_require__(86635);
const debug = debugLib('snyk-fix:main');
async function fix(entities, options = {
    dryRun: false,
    quiet: false,
    stripAnsi: false,
}) {
    debug('Running snyk fix with options:', options);
    const spinner = ora({ isSilent: options.quiet, stream: process.stdout });
    let resultsByPlugin = {};
    const { vulnerable, notVulnerable: nothingToFix, } = await partition_by_vulnerable_1.partitionByVulnerable(entities);
    const entitiesPerType = groupEntitiesPerScanType(vulnerable);
    const exceptions = {};
    await pMap(Object.keys(entitiesPerType), async (scanType) => {
        try {
            const fixPlugin = load_plugin_1.loadPlugin(scanType);
            const results = await fixPlugin(entitiesPerType[scanType], options);
            resultsByPlugin = { ...resultsByPlugin, ...results };
        }
        catch (e) {
            debug(`Failed to processes ${scanType}`, e);
            exceptions[scanType] = {
                originals: entitiesPerType[scanType],
                userMessage: error_to_user_message_1.convertErrorToUserMessage(e),
            };
        }
    }, {
        concurrency: 3,
    });
    const fixSummary = await outputFormatter.showResultsSummary(nothingToFix, resultsByPlugin, exceptions, options, entities.length);
    const meta = extractMeta(resultsByPlugin, exceptions);
    spinner.start();
    if (meta.fixed > 0) {
        spinner.stopAndPersist({
            text: 'Done',
            symbol: chalk.green('✔'),
        });
    }
    else {
        spinner.stop();
    }
    return {
        results: resultsByPlugin,
        exceptions,
        fixSummary,
        meta,
    };
}
exports.fix = fix;
function groupEntitiesPerScanType(entities) {
    var _a, _b, _c;
    const entitiesPerType = {};
    for (const entity of entities) {
        // TODO: group all node
        const type = (_c = (_b = (_a = entity.scanResult) === null || _a === void 0 ? void 0 : _a.identity) === null || _b === void 0 ? void 0 : _b.type) !== null && _c !== void 0 ? _c : 'missing-type';
        if (entitiesPerType[type]) {
            entitiesPerType[type].push(entity);
            continue;
        }
        entitiesPerType[type] = [entity];
    }
    return entitiesPerType;
}
exports.groupEntitiesPerScanType = groupEntitiesPerScanType;
function extractMeta(resultsByPlugin, exceptions) {
    const testResults = outputFormatter.getTestResults(resultsByPlugin, exceptions);
    const issueData = testResults.map((i) => i.issuesData);
    const failed = outputFormatter.calculateFailed(resultsByPlugin, exceptions);
    const fixed = outputFormatter.calculateFixed(resultsByPlugin);
    const totalIssueCount = total_issues_count_1.getTotalIssueCount(issueData);
    const { count: fixableCount } = fixable_issues_1.hasFixableIssues(testResults);
    const fixedIssueCount = outputFormatter.calculateFixedIssues(resultsByPlugin);
    return {
        fixed,
        failed,
        totalIssues: totalIssueCount,
        fixableIssues: fixableCount,
        fixedIssues: fixedIssueCount,
    };
}
exports.extractMeta = extractMeta;
//# sourceMappingURL=index.js.map

/***/ }),

/***/ 72353:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.CommandFailedError = void 0;
const custom_error_1 = __webpack_require__(33129);
class CommandFailedError extends custom_error_1.CustomError {
    constructor(customMessage, command) {
        super(customMessage, custom_error_1.ERROR_CODES.CommandFailed);
        this.command = command;
    }
}
exports.CommandFailedError = CommandFailedError;
//# sourceMappingURL=command-failed-to-run-error.js.map

/***/ }),

/***/ 75391:
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.contactSupportMessage = exports.reTryMessage = void 0;
exports.reTryMessage = 'Tip: Re-run in debug mode to see more information: DEBUG=*snyk* <COMMAND>';
exports.contactSupportMessage = 'If the issue persists contact support@snyk.io';
//# sourceMappingURL=common.js.map

/***/ }),

/***/ 33129:
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ERROR_CODES = exports.CustomError = void 0;
class CustomError extends Error {
    constructor(message, errorCode) {
        super(message);
        this.name = this.constructor.name;
        this.innerError = undefined;
        this.errorCode = errorCode;
    }
}
exports.CustomError = CustomError;
var ERROR_CODES;
(function (ERROR_CODES) {
    ERROR_CODES["UnsupportedTypeError"] = "G10";
    ERROR_CODES["MissingRemediationData"] = "G11";
    ERROR_CODES["MissingFileName"] = "G12";
    ERROR_CODES["FailedToParseManifest"] = "G13";
    ERROR_CODES["CommandFailed"] = "G14";
    ERROR_CODES["NoFixesCouldBeApplied"] = "G15";
})(ERROR_CODES = exports.ERROR_CODES || (exports.ERROR_CODES = {}));
//# sourceMappingURL=custom-error.js.map

/***/ }),

/***/ 5258:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.convertErrorToUserMessage = void 0;
const unsupported_type_error_1 = __webpack_require__(90361);
function convertErrorToUserMessage(error) {
    if (error instanceof unsupported_type_error_1.UnsupportedTypeError) {
        return `${error.scanType} is not supported.`;
    }
    return error.message;
}
exports.convertErrorToUserMessage = convertErrorToUserMessage;
//# sourceMappingURL=error-to-user-message.js.map

/***/ }),

/***/ 84657:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.FailedToParseManifest = void 0;
const custom_error_1 = __webpack_require__(33129);
class FailedToParseManifest extends custom_error_1.CustomError {
    constructor() {
        super('Failed to parse manifest', custom_error_1.ERROR_CODES.FailedToParseManifest);
    }
}
exports.FailedToParseManifest = FailedToParseManifest;
//# sourceMappingURL=failed-to-parse-manifest.js.map

/***/ }),

/***/ 86920:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.MissingFileNameError = void 0;
const custom_error_1 = __webpack_require__(33129);
class MissingFileNameError extends custom_error_1.CustomError {
    constructor() {
        super('Filename is missing from test result', custom_error_1.ERROR_CODES.MissingFileName);
    }
}
exports.MissingFileNameError = MissingFileNameError;
//# sourceMappingURL=missing-file-name.js.map

/***/ }),

/***/ 95084:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.MissingRemediationDataError = void 0;
const custom_error_1 = __webpack_require__(33129);
class MissingRemediationDataError extends custom_error_1.CustomError {
    constructor() {
        super('Remediation data is required to apply fixes', custom_error_1.ERROR_CODES.MissingRemediationData);
    }
}
exports.MissingRemediationDataError = MissingRemediationDataError;
//# sourceMappingURL=missing-remediation-data.js.map

/***/ }),

/***/ 80799:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.NoFixesCouldBeAppliedError = void 0;
const custom_error_1 = __webpack_require__(33129);
class NoFixesCouldBeAppliedError extends custom_error_1.CustomError {
    constructor(message, tip) {
        super(message || 'No fixes could be applied', custom_error_1.ERROR_CODES.NoFixesCouldBeApplied);
        this.tip = tip;
    }
}
exports.NoFixesCouldBeAppliedError = NoFixesCouldBeAppliedError;
//# sourceMappingURL=no-fixes-applied.js.map

/***/ }),

/***/ 90361:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.UnsupportedTypeError = void 0;
const custom_error_1 = __webpack_require__(33129);
class UnsupportedTypeError extends custom_error_1.CustomError {
    constructor(scanType) {
        super('Provided scan type is not supported', custom_error_1.ERROR_CODES.UnsupportedTypeError);
        this.scanType = scanType;
    }
}
exports.UnsupportedTypeError = UnsupportedTypeError;
//# sourceMappingURL=unsupported-type-error.js.map

/***/ }),

/***/ 86635:
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.hasFixableIssues = void 0;
function hasFixableIssues(results) {
    let hasFixes = false;
    let count = 0;
    for (const result of Object.values(results)) {
        const { remediation } = result;
        if (remediation) {
            const { upgrade, pin, patch } = remediation;
            const upgrades = Object.keys(upgrade);
            const pins = Object.keys(pin);
            if (pins.length || upgrades.length) {
                hasFixes = true;
                // pins & upgrades are mutually exclusive
                count += getUpgradableIssues(pins.length ? pin : upgrade);
            }
            const patches = Object.keys(patch);
            if (patches.length) {
                hasFixes = true;
                count += patches.length;
            }
        }
    }
    return {
        hasFixes,
        count,
    };
}
exports.hasFixableIssues = hasFixableIssues;
function getUpgradableIssues(updates) {
    const issues = [];
    for (const id of Object.keys(updates)) {
        issues.push(...updates[id].vulns);
    }
    return issues.length;
}
//# sourceMappingURL=fixable-issues.js.map

/***/ }),

/***/ 29748:
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.getIssueCountBySeverity = void 0;
function getIssueCountBySeverity(issueData) {
    const total = {
        low: [],
        medium: [],
        high: [],
        critical: [],
    };
    for (const entry of issueData) {
        for (const issue of Object.values(entry)) {
            const { severity, id } = issue;
            total[severity.toLowerCase()].push(id);
        }
    }
    return total;
}
exports.getIssueCountBySeverity = getIssueCountBySeverity;
//# sourceMappingURL=issues-by-severity.js.map

/***/ }),

/***/ 41160:
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.getTotalIssueCount = void 0;
function getTotalIssueCount(issueData) {
    let total = 0;
    for (const entry of issueData) {
        total += Object.keys(entry).length;
    }
    return total;
}
exports.getTotalIssueCount = getTotalIssueCount;
//# sourceMappingURL=total-issues-count.js.map

/***/ }),

/***/ 90686:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.formatDisplayName = void 0;
const pathLib = __webpack_require__(85622);
function formatDisplayName(path, identity) {
    if (!identity.targetFile) {
        return `${identity.type} project`;
    }
    // show paths relative to where `snyk fix` is running
    return pathLib.relative(process.cwd(), pathLib.join(path, identity.targetFile));
}
exports.formatDisplayName = formatDisplayName;
//# sourceMappingURL=format-display-name.js.map

/***/ }),

/***/ 31998:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.formatFailed = void 0;
const types_1 = __webpack_require__(71538);
const error_to_user_message_1 = __webpack_require__(5258);
const format_with_changes_item_1 = __webpack_require__(38154);
const format_unresolved_item_1 = __webpack_require__(82187);
function formatFailed(failed) {
    if (types_1.isWithError(failed)) {
        return format_unresolved_item_1.formatUnresolved(failed.original, error_to_user_message_1.convertErrorToUserMessage(failed.error), failed.tip);
    }
    return format_with_changes_item_1.formatChangesSummary(failed.original, failed.changes);
}
exports.formatFailed = formatFailed;
//# sourceMappingURL=format-failed-item.js.map

/***/ }),

/***/ 82187:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.formatUnresolved = void 0;
const chalk = __webpack_require__(98250);
const format_display_name_1 = __webpack_require__(90686);
const show_results_summary_1 = __webpack_require__(70962);
function formatUnresolved(entity, userMessage, tip) {
    const name = format_display_name_1.formatDisplayName(entity.workspace.path, entity.scanResult.identity);
    const tipMessage = tip ? `\n${show_results_summary_1.PADDING_SPACE}Tip:     ${tip}` : '';
    const errorMessage = `${show_results_summary_1.PADDING_SPACE}${name}\n${show_results_summary_1.PADDING_SPACE}${chalk.red('✖')} ${chalk.red(userMessage)}`;
    return errorMessage + tipMessage;
}
exports.formatUnresolved = formatUnresolved;
//# sourceMappingURL=format-unresolved-item.js.map

/***/ }),

/***/ 38154:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.formatChangesSummary = void 0;
const chalk = __webpack_require__(98250);
const format_display_name_1 = __webpack_require__(90686);
const show_results_summary_1 = __webpack_require__(70962);
/*
 * Generate formatted output that describes what changes were applied, which failed.
 */
function formatChangesSummary(entity, changes) {
    return `${show_results_summary_1.PADDING_SPACE}${format_display_name_1.formatDisplayName(entity.workspace.path, entity.scanResult.identity)}\n${changes.map((c) => formatAppliedChange(c)).join('\n')}`;
}
exports.formatChangesSummary = formatChangesSummary;
function formatAppliedChange(change) {
    if (change.success === true) {
        return `${show_results_summary_1.PADDING_SPACE}${chalk.green('✔')} ${change.userMessage}`;
    }
    if (change.success === false) {
        return `${show_results_summary_1.PADDING_SPACE}${chalk.red('x')} ${chalk.red(change.userMessage)}\n${show_results_summary_1.PADDING_SPACE}Reason:${show_results_summary_1.PADDING_SPACE}${change.reason}${change.tip ? `.\n${show_results_summary_1.PADDING_SPACE}Tip:     ${change.tip}` : undefined}`;
    }
    return '';
}
//# sourceMappingURL=format-with-changes-item.js.map

/***/ }),

/***/ 70962:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.getTestResults = exports.generateIssueSummary = exports.getSeveritiesColour = exports.defaultSeverityColor = exports.severitiesColourMapping = exports.formatIssueCountBySeverity = exports.calculateFailed = exports.calculateFixedIssues = exports.calculateFixed = exports.generateOverallSummary = exports.generateUnresolvedSummary = exports.generateSuccessfulFixesSummary = exports.showResultsSummary = exports.PADDING_SPACE = void 0;
const chalk = __webpack_require__(98250);
const stripAnsi = __webpack_require__(71990);
const common_1 = __webpack_require__(75391);
const fixable_issues_1 = __webpack_require__(86635);
const issues_by_severity_1 = __webpack_require__(29748);
const total_issues_count_1 = __webpack_require__(41160);
const format_failed_item_1 = __webpack_require__(31998);
const format_with_changes_item_1 = __webpack_require__(38154);
const format_unresolved_item_1 = __webpack_require__(82187);
exports.PADDING_SPACE = '  '; // 2 spaces
async function showResultsSummary(nothingToFix, resultsByPlugin, exceptions, options, total) {
    const successfulFixesSummary = generateSuccessfulFixesSummary(resultsByPlugin);
    const { summary: unresolvedSummary, count: unresolvedCount, } = generateUnresolvedSummary(resultsByPlugin, exceptions);
    const { summary: overallSummary, count: changedCount, } = generateOverallSummary(resultsByPlugin, exceptions, nothingToFix, options);
    const getHelpText = `${common_1.reTryMessage}. ${common_1.contactSupportMessage}`;
    // called without any `snyk test` results
    if (total === 0) {
        const summary = `\n${chalk.red(' ✖ No successful fixes')}`;
        return options.stripAnsi ? stripAnsi(summary) : summary;
    }
    // 100% not vulnerable and had no errors/unsupported
    if (nothingToFix.length === total && unresolvedCount === 0) {
        const summary = `\n${chalk.green('✔ No vulnerable items to fix')}\n\n${overallSummary}`;
        return options.stripAnsi ? stripAnsi(summary) : summary;
    }
    const summary = `\n${successfulFixesSummary}${unresolvedSummary}${unresolvedCount || changedCount ? `\n\n${overallSummary}` : ''}${unresolvedSummary ? `\n\n${getHelpText}` : ''}`;
    return options.stripAnsi ? stripAnsi(summary) : summary;
}
exports.showResultsSummary = showResultsSummary;
function generateSuccessfulFixesSummary(resultsByPlugin) {
    const sectionTitle = 'Successful fixes:';
    const formattedTitleHeader = `${chalk.bold(sectionTitle)}`;
    let summary = '';
    for (const plugin of Object.keys(resultsByPlugin)) {
        const fixedSuccessfully = resultsByPlugin[plugin].succeeded;
        if (fixedSuccessfully.length > 0) {
            summary +=
                '\n\n' +
                    fixedSuccessfully
                        .map((s) => format_with_changes_item_1.formatChangesSummary(s.original, s.changes))
                        .join('\n\n');
        }
    }
    if (summary) {
        return formattedTitleHeader + summary;
    }
    return chalk.red(' ✖ No successful fixes\n');
}
exports.generateSuccessfulFixesSummary = generateSuccessfulFixesSummary;
function generateUnresolvedSummary(resultsByPlugin, exceptionsByScanType) {
    const title = 'Unresolved items:';
    const formattedTitle = `${chalk.bold(title)}`;
    let summary = '';
    let count = 0;
    for (const plugin of Object.keys(resultsByPlugin)) {
        const skipped = resultsByPlugin[plugin].skipped;
        if (skipped.length > 0) {
            count += skipped.length;
            summary +=
                '\n\n' +
                    skipped
                        .map((s) => format_unresolved_item_1.formatUnresolved(s.original, s.userMessage))
                        .join('\n\n');
        }
        const failed = resultsByPlugin[plugin].failed;
        if (failed.length > 0) {
            count += failed.length;
            summary += '\n\n' + failed.map((s) => format_failed_item_1.formatFailed(s)).join('\n\n');
        }
    }
    if (Object.keys(exceptionsByScanType).length) {
        for (const ecosystem of Object.keys(exceptionsByScanType)) {
            const unresolved = exceptionsByScanType[ecosystem];
            count += unresolved.originals.length;
            summary +=
                '\n\n' +
                    unresolved.originals
                        .map((s) => format_unresolved_item_1.formatUnresolved(s, unresolved.userMessage))
                        .join('\n\n');
        }
    }
    if (summary) {
        return { summary: `\n\n${formattedTitle}${summary}`, count };
    }
    return { summary: '', count: 0 };
}
exports.generateUnresolvedSummary = generateUnresolvedSummary;
function generateOverallSummary(resultsByPlugin, exceptions, nothingToFix, options) {
    const sectionTitle = 'Summary:';
    const formattedTitleHeader = `${chalk.bold(sectionTitle)}`;
    const fixed = calculateFixed(resultsByPlugin);
    const failed = calculateFailed(resultsByPlugin, exceptions);
    const dryRunText = options.dryRun
        ? chalk.hex('#EDD55E')(`${exports.PADDING_SPACE}Command run in ${chalk.bold('dry run')} mode. Fixes are not applied.\n`)
        : '';
    const notFixedMessage = failed > 0
        ? `${exports.PADDING_SPACE}${chalk.bold.red(failed)} items were not fixed\n`
        : '';
    const fixedMessage = fixed > 0
        ? `${exports.PADDING_SPACE}${chalk.green.bold(fixed)} items were successfully fixed\n`
        : '';
    const vulnsSummary = generateIssueSummary(resultsByPlugin, exceptions);
    const notVulnerableSummary = nothingToFix.length > 0
        ? `${exports.PADDING_SPACE}${nothingToFix.length} items were not vulnerable\n`
        : '';
    return {
        summary: `${formattedTitleHeader}\n\n${dryRunText}${notFixedMessage}${fixedMessage}${notVulnerableSummary}${vulnsSummary}`,
        count: fixed + failed,
    };
}
exports.generateOverallSummary = generateOverallSummary;
function calculateFixed(resultsByPlugin) {
    let fixed = 0;
    for (const plugin of Object.keys(resultsByPlugin)) {
        fixed += resultsByPlugin[plugin].succeeded.length;
    }
    return fixed;
}
exports.calculateFixed = calculateFixed;
function calculateFixedIssues(resultsByPlugin) {
    const fixedIssues = [];
    for (const plugin of Object.keys(resultsByPlugin)) {
        for (const entity of resultsByPlugin[plugin].succeeded) {
            // count unique vulns fixed per scanned entity
            // some fixed may need to be made in multiple places
            // and would count multiple times otherwise.
            const fixedPerEntity = new Set();
            entity.changes
                .filter((c) => c.success)
                .forEach((c) => {
                c.issueIds.map((i) => fixedPerEntity.add(i));
            });
            fixedIssues.push(...Array.from(fixedPerEntity));
        }
    }
    return fixedIssues.length;
}
exports.calculateFixedIssues = calculateFixedIssues;
function calculateFailed(resultsByPlugin, exceptions) {
    let failed = 0;
    for (const plugin of Object.keys(resultsByPlugin)) {
        const results = resultsByPlugin[plugin];
        failed += results.failed.length + results.skipped.length;
    }
    if (Object.keys(exceptions).length) {
        for (const ecosystem of Object.keys(exceptions)) {
            const unresolved = exceptions[ecosystem];
            failed += unresolved.originals.length;
        }
    }
    return failed;
}
exports.calculateFailed = calculateFailed;
function formatIssueCountBySeverity({ critical, high, medium, low, }) {
    const summary = [];
    if (critical && critical > 0) {
        summary.push(exports.severitiesColourMapping.critical.colorFunc(`${critical} Critical`));
    }
    if (high && high > 0) {
        summary.push(exports.severitiesColourMapping.high.colorFunc(`${high} High`));
    }
    if (medium && medium > 0) {
        summary.push(exports.severitiesColourMapping.medium.colorFunc(`${medium} Medium`));
    }
    if (low && low > 0) {
        summary.push(exports.severitiesColourMapping.low.colorFunc(`${low} Low`));
    }
    return summary.join(' | ');
}
exports.formatIssueCountBySeverity = formatIssueCountBySeverity;
exports.severitiesColourMapping = {
    low: {
        colorFunc(text) {
            return chalk.hex('#BCBBC8')(text);
        },
    },
    medium: {
        colorFunc(text) {
            return chalk.hex('#EDD55E')(text);
        },
    },
    high: {
        colorFunc(text) {
            return chalk.hex('#FF872F')(text);
        },
    },
    critical: {
        colorFunc(text) {
            return chalk.hex('#FF0B0B')(text);
        },
    },
};
exports.defaultSeverityColor = {
    colorFunc(text) {
        return chalk.grey(text);
    },
};
function getSeveritiesColour(severity) {
    var _a;
    return (_a = exports.severitiesColourMapping[severity]) !== null && _a !== void 0 ? _a : exports.defaultSeverityColor;
}
exports.getSeveritiesColour = getSeveritiesColour;
function generateIssueSummary(resultsByPlugin, exceptions) {
    const testResults = getTestResults(resultsByPlugin, exceptions);
    const issueData = testResults.map((i) => i.issuesData);
    const bySeverity = issues_by_severity_1.getIssueCountBySeverity(issueData);
    const issuesBySeverityMessage = formatIssueCountBySeverity({
        critical: bySeverity.critical.length,
        high: bySeverity.high.length,
        medium: bySeverity.medium.length,
        low: bySeverity.low.length,
    });
    // can't use .flat() or .flatMap() because it's not supported in Node 10
    const issues = [];
    for (const result of testResults) {
        issues.push(...result.issues);
    }
    const totalIssueCount = total_issues_count_1.getTotalIssueCount(issueData);
    let totalIssues = '';
    if (totalIssueCount > 0) {
        totalIssues = `${chalk.bold(totalIssueCount)} issues\n`;
        if (issuesBySeverityMessage) {
            totalIssues = `${chalk.bold(totalIssueCount)} issues: ${issuesBySeverityMessage}\n`;
        }
    }
    const { count: fixableCount } = fixable_issues_1.hasFixableIssues(testResults);
    const fixableIssues = fixableCount > 0 ? `${chalk.bold(fixableCount)} issues are fixable\n` : '';
    const fixedIssueCount = calculateFixedIssues(resultsByPlugin);
    const fixedIssuesSummary = fixedIssueCount > 0
        ? `${chalk.bold(fixedIssueCount)} issues were successfully fixed\n`
        : '';
    return `\n${exports.PADDING_SPACE}${totalIssues}${exports.PADDING_SPACE}${fixableIssues}${exports.PADDING_SPACE}${fixedIssuesSummary}`;
}
exports.generateIssueSummary = generateIssueSummary;
function getTestResults(resultsByPlugin, exceptionsByScanType) {
    const testResults = [];
    for (const plugin of Object.keys(resultsByPlugin)) {
        const { skipped, failed, succeeded } = resultsByPlugin[plugin];
        testResults.push(...skipped.map((i) => i.original.testResult));
        testResults.push(...failed.map((i) => i.original.testResult));
        testResults.push(...succeeded.map((i) => i.original.testResult));
    }
    if (Object.keys(exceptionsByScanType).length) {
        for (const ecosystem of Object.keys(exceptionsByScanType)) {
            const unresolved = exceptionsByScanType[ecosystem];
            testResults.push(...unresolved.originals.map((i) => i.testResult));
        }
    }
    return testResults;
}
exports.getTestResults = getTestResults;
//# sourceMappingURL=show-results-summary.js.map

/***/ }),

/***/ 24957:
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.partitionByVulnerable = void 0;
function partitionByVulnerable(entities) {
    const vulnerable = [];
    const notVulnerable = [];
    for (const entity of entities) {
        const hasIssues = entity.testResult.issues.length > 0;
        if (hasIssues) {
            vulnerable.push(entity);
        }
        else {
            notVulnerable.push(entity);
        }
    }
    return { vulnerable, notVulnerable };
}
exports.partitionByVulnerable = partitionByVulnerable;
//# sourceMappingURL=partition-by-vulnerable.js.map

/***/ }),

/***/ 65090:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.loadPlugin = void 0;
const unsupported_type_error_1 = __webpack_require__(90361);
const python_1 = __webpack_require__(97090);
function loadPlugin(type) {
    switch (type) {
        case 'pip': {
            return python_1.pythonFix;
        }
        case 'poetry': {
            return python_1.pythonFix;
        }
        default: {
            throw new unsupported_type_error_1.UnsupportedTypeError(type);
        }
    }
}
exports.loadPlugin = loadPlugin;
//# sourceMappingURL=load-plugin.js.map

/***/ }),

/***/ 96377:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.checkPackageToolSupported = void 0;
const chalk = __webpack_require__(98250);
const pipenvPipfileFix = __webpack_require__(91989);
const poetryFix = __webpack_require__(69671);
const ora = __webpack_require__(63395);
const supportFunc = {
    pipenv: {
        isInstalled: () => pipenvPipfileFix.isPipenvInstalled(),
        isSupportedVersion: (version) => pipenvPipfileFix.isPipenvSupportedVersion(version),
    },
    poetry: {
        isInstalled: () => poetryFix.isPoetryInstalled(),
        isSupportedVersion: (version) => poetryFix.isPoetrySupportedVersion(version),
    },
};
async function checkPackageToolSupported(packageManager, options) {
    const { version } = await supportFunc[packageManager].isInstalled();
    const spinner = ora({ isSilent: options.quiet, stream: process.stdout });
    spinner.clear();
    spinner.text = `Checking ${packageManager} version`;
    spinner.indent = 2;
    spinner.start();
    if (!version) {
        spinner.stopAndPersist({
            text: chalk.hex('#EDD55E')(`Could not detect ${packageManager} version, proceeding anyway. Some operations may fail.`),
            symbol: chalk.hex('#EDD55E')('⚠️'),
        });
        return;
    }
    const { supported, versions } = supportFunc[packageManager].isSupportedVersion(version);
    if (!supported) {
        const spinnerMessage = ` ${version} ${packageManager} version detected. Currently the following ${packageManager} versions are supported: ${versions.join(',')}`;
        spinner.stopAndPersist({
            text: chalk.hex('#EDD55E')(spinnerMessage),
            symbol: chalk.hex('#EDD55E')('⚠️'),
        });
    }
    else {
        spinner.stop();
    }
}
exports.checkPackageToolSupported = checkPackageToolSupported;
//# sourceMappingURL=package-tool-supported.js.map

/***/ }),

/***/ 10774:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.isRequirementsTxtManifest = exports.getHandlerType = void 0;
const pathLib = __webpack_require__(85622);
const supported_handler_types_1 = __webpack_require__(56394);
function getHandlerType(entity) {
    const targetFile = entity.scanResult.identity.targetFile;
    if (!targetFile) {
        return null;
    }
    const packageManagerOverride = entity.options.packageManager;
    if (packageManagerOverride) {
        return getTypeFromPackageManager(packageManagerOverride);
    }
    const path = pathLib.parse(targetFile);
    if (isRequirementsTxtManifest(targetFile)) {
        return supported_handler_types_1.SUPPORTED_HANDLER_TYPES.REQUIREMENTS;
    }
    else if (['Pipfile'].includes(path.base)) {
        return supported_handler_types_1.SUPPORTED_HANDLER_TYPES.PIPFILE;
    }
    else if (['pyproject.toml', 'poetry.lock'].includes(path.base)) {
        return supported_handler_types_1.SUPPORTED_HANDLER_TYPES.POETRY;
    }
    return null;
}
exports.getHandlerType = getHandlerType;
function isRequirementsTxtManifest(targetFile) {
    return targetFile.endsWith('.txt');
}
exports.isRequirementsTxtManifest = isRequirementsTxtManifest;
function getTypeFromPackageManager(packageManager) {
    switch (packageManager) {
        case 'pip':
            return supported_handler_types_1.SUPPORTED_HANDLER_TYPES.REQUIREMENTS;
        case 'poetry':
            return supported_handler_types_1.SUPPORTED_HANDLER_TYPES.POETRY;
        default:
            return null;
    }
}
//# sourceMappingURL=get-handler-type.js.map

/***/ }),

/***/ 70145:
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.isSuccessfulChange = exports.generateSuccessfulChanges = exports.generateFailedChanges = void 0;
function generateFailedChanges(attemptedUpdates, pins, error, command) {
    const changes = [];
    for (const pkgAtVersion of Object.keys(pins)) {
        const pin = pins[pkgAtVersion];
        if (!attemptedUpdates
            .map((update) => update.replace('==', '@'))
            .includes(pin.upgradeTo)) {
            continue;
        }
        const updatedMessage = pin.isTransitive ? 'pin' : 'upgrade';
        const newVersion = pin.upgradeTo.split('@')[1];
        const [pkgName, version] = pkgAtVersion.split('@');
        changes.push({
            success: false,
            reason: error.message,
            userMessage: `Failed to ${updatedMessage} ${pkgName} from ${version} to ${newVersion}`,
            tip: command ? `Try running \`${command}\`` : undefined,
            issueIds: pin.vulns,
            from: pkgAtVersion,
            to: `${pkgName}@${newVersion}`,
        });
    }
    return changes;
}
exports.generateFailedChanges = generateFailedChanges;
function generateSuccessfulChanges(appliedUpgrades, pins) {
    const changes = [];
    for (const pkgAtVersion of Object.keys(pins)) {
        const pin = pins[pkgAtVersion];
        if (!appliedUpgrades
            .map((upgrade) => upgrade.replace('==', '@'))
            .includes(pin.upgradeTo)) {
            continue;
        }
        const updatedMessage = pin.isTransitive ? 'Pinned' : 'Upgraded';
        const newVersion = pin.upgradeTo.split('@')[1];
        const [pkgName, version] = pkgAtVersion.split('@');
        changes.push({
            success: true,
            userMessage: `${updatedMessage} ${pkgName} from ${version} to ${newVersion}`,
            issueIds: pin.vulns,
            from: pkgAtVersion,
            to: `${pkgName}@${newVersion}`,
        });
    }
    return changes;
}
exports.generateSuccessfulChanges = generateSuccessfulChanges;
function isSuccessfulChange(change) {
    return change.success === true;
}
exports.isSuccessfulChange = isSuccessfulChange;
//# sourceMappingURL=attempted-changes-summary.js.map

/***/ }),

/***/ 60174:
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.partitionByFixable = exports.isSupported = exports.projectTypeSupported = void 0;
function projectTypeSupported(res) {
    return !('reason' in res);
}
exports.projectTypeSupported = projectTypeSupported;
async function isSupported(entity) {
    const remediationData = entity.testResult.remediation;
    if (!remediationData) {
        return { supported: false, reason: 'No remediation data available' };
    }
    if (!remediationData.pin || Object.keys(remediationData.pin).length === 0) {
        return {
            supported: false,
            reason: 'There is no actionable remediation to apply',
        };
    }
    return { supported: true };
}
exports.isSupported = isSupported;
async function partitionByFixable(entities) {
    const fixable = [];
    const skipped = [];
    for (const entity of entities) {
        const isSupportedResponse = await isSupported(entity);
        if (projectTypeSupported(isSupportedResponse)) {
            fixable.push(entity);
            continue;
        }
        skipped.push({
            original: entity,
            userMessage: isSupportedResponse.reason,
        });
    }
    return { fixable, skipped };
}
exports.partitionByFixable = partitionByFixable;
//# sourceMappingURL=is-supported.js.map

/***/ }),

/***/ 9744:
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.containsRequireDirective = void 0;
/* Requires like -r, -c are not supported at the moment, as multiple files
 * would have to be identified and fixed together
 * https://pip.pypa.io/en/stable/reference/pip_install/#options
 */
async function containsRequireDirective(requirementsTxt) {
    const allMatches = [];
    const REQUIRE_PATTERN = new RegExp(/^[^\S\n]*-(r|c)\s+(.+)/, 'gm');
    const matches = getAllMatchedGroups(REQUIRE_PATTERN, requirementsTxt);
    for (const match of matches) {
        if (match && match.length > 1) {
            allMatches.push(match);
        }
    }
    return { containsRequire: allMatches.length > 0, matches: allMatches };
}
exports.containsRequireDirective = containsRequireDirective;
function getAllMatchedGroups(re, str) {
    const groups = [];
    let match;
    while ((match = re.exec(str))) {
        groups.push(match);
    }
    return groups;
}
//# sourceMappingURL=contains-require-directive.js.map

/***/ }),

/***/ 85844:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.extractProvenance = void 0;
const path = __webpack_require__(85622);
const debugLib = __webpack_require__(15158);
const requirements_file_parser_1 = __webpack_require__(67285);
const contains_require_directive_1 = __webpack_require__(9744);
const debug = debugLib('snyk-fix:python:extract-version-provenance');
async function extractProvenance(workspace, rootDir, dir, fileName, provenance = {}) {
    const requirementsFileName = path.join(dir, fileName);
    const requirementsTxt = await workspace.readFile(requirementsFileName);
    // keep all provenance paths with `/` as a separator
    const relativeTargetFileName = path
        .normalize(path.relative(rootDir, requirementsFileName))
        .replace(path.sep, '/');
    provenance = {
        ...provenance,
        [relativeTargetFileName]: requirements_file_parser_1.parseRequirementsFile(requirementsTxt),
    };
    const { containsRequire, matches } = await contains_require_directive_1.containsRequireDirective(requirementsTxt);
    if (containsRequire) {
        for (const match of matches) {
            const requiredFilePath = match[2];
            if (provenance[requiredFilePath]) {
                debug('Detected recursive require directive, skipping');
                continue;
            }
            const { dir: requireDir, base } = path.parse(path.join(dir, requiredFilePath));
            provenance = {
                ...provenance,
                ...(await extractProvenance(workspace, rootDir, requireDir, base, provenance)),
            };
        }
    }
    return provenance;
}
exports.extractProvenance = extractProvenance;
//# sourceMappingURL=extract-version-provenance.js.map

/***/ }),

/***/ 81065:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.selectFileForPinning = exports.applyAllFixes = exports.fixIndividualRequirementsTxt = exports.pipRequirementsTxt = void 0;
const debugLib = __webpack_require__(15158);
const pathLib = __webpack_require__(85622);
const sortBy = __webpack_require__(58254);
const groupBy = __webpack_require__(20276);
const update_dependencies_1 = __webpack_require__(5860);
const no_fixes_applied_1 = __webpack_require__(80799);
const extract_version_provenance_1 = __webpack_require__(85844);
const requirements_file_parser_1 = __webpack_require__(67285);
const standardize_package_name_1 = __webpack_require__(78078);
const contains_require_directive_1 = __webpack_require__(9744);
const validate_required_data_1 = __webpack_require__(57894);
const format_display_name_1 = __webpack_require__(90686);
const debug = debugLib('snyk-fix:python:requirements.txt');
async function pipRequirementsTxt(fixable, options) {
    debug(`Preparing to fix ${fixable.length} Python requirements.txt projects`);
    const handlerResult = {
        succeeded: [],
        failed: [],
        skipped: [],
    };
    const ordered = sortByDirectory(fixable);
    let fixedFilesCache = {};
    for (const dir of Object.keys(ordered)) {
        debug(`Fixing entities in directory ${dir}`);
        const entitiesPerDirectory = ordered[dir].map((e) => e.entity);
        const { failed, succeeded, skipped, fixedCache } = await fixAll(entitiesPerDirectory, options, fixedFilesCache);
        fixedFilesCache = {
            ...fixedFilesCache,
            ...fixedCache,
        };
        handlerResult.succeeded.push(...succeeded);
        handlerResult.failed.push(...failed);
        handlerResult.skipped.push(...skipped);
    }
    return handlerResult;
}
exports.pipRequirementsTxt = pipRequirementsTxt;
async function fixAll(entities, options, fixedCache) {
    const handlerResult = {
        succeeded: [],
        failed: [],
        skipped: [],
    };
    for (const entity of entities) {
        const targetFile = entity.scanResult.identity.targetFile;
        try {
            const { dir, base } = pathLib.parse(targetFile);
            // parse & join again to support correct separator
            const filePath = pathLib.normalize(pathLib.join(dir, base));
            if (Object.keys(fixedCache).includes(pathLib.normalize(pathLib.join(dir, base)))) {
                handlerResult.succeeded.push({
                    original: entity,
                    changes: [
                        {
                            success: true,
                            userMessage: `Fixed through ${format_display_name_1.formatDisplayName(entity.workspace.path, {
                                type: entity.scanResult.identity.type,
                                targetFile: fixedCache[filePath].fixedIn,
                            })}`,
                            issueIds: getFixedEntityIssues(fixedCache[filePath].issueIds, entity.testResult.issues),
                        },
                    ],
                });
                continue;
            }
            const { changes, fixedMeta } = await applyAllFixes(entity, options);
            if (!changes.length) {
                debug('Manifest has not changed!');
                throw new no_fixes_applied_1.NoFixesCouldBeAppliedError();
            }
            // keep issues were successfully fixed unique across files that are part of the same project
            // the test result is for 1 entry entity.
            const uniqueIssueIds = new Set();
            for (const c of changes) {
                c.issueIds.map((i) => uniqueIssueIds.add(i));
            }
            Object.keys(fixedMeta).forEach((f) => {
                fixedCache[f] = {
                    fixedIn: targetFile,
                    issueIds: Array.from(uniqueIssueIds),
                };
            });
            handlerResult.succeeded.push({ original: entity, changes });
        }
        catch (e) {
            debug(`Failed to fix ${targetFile}.\nERROR: ${e}`);
            handlerResult.failed.push({ original: entity, error: e });
        }
    }
    return { ...handlerResult, fixedCache };
}
// TODO: optionally verify the deps install
async function fixIndividualRequirementsTxt(workspace, dir, entryFileName, fileName, remediation, parsedRequirements, options, directUpgradesOnly) {
    const entryFilePath = pathLib.normalize(pathLib.join(dir, entryFileName));
    const fullFilePath = pathLib.normalize(pathLib.join(dir, fileName));
    const { updatedManifest, changes } = update_dependencies_1.updateDependencies(parsedRequirements, remediation.pin, directUpgradesOnly, entryFilePath !== fullFilePath
        ? format_display_name_1.formatDisplayName(workspace.path, {
            type: 'pip',
            targetFile: fullFilePath,
        })
        : undefined);
    if (!changes.length) {
        return { changes };
    }
    if (!options.dryRun) {
        debug('Writing changes to file');
        await workspace.writeFile(pathLib.join(dir, fileName), updatedManifest);
    }
    else {
        debug('Skipping writing changes to file in --dry-run mode');
    }
    return { changes };
}
exports.fixIndividualRequirementsTxt = fixIndividualRequirementsTxt;
async function applyAllFixes(entity, options) {
    const { remediation, targetFile: entryFileName, workspace, } = validate_required_data_1.validateRequiredData(entity);
    const fixedMeta = {};
    const { dir, base } = pathLib.parse(entryFileName);
    const provenance = await extract_version_provenance_1.extractProvenance(workspace, dir, dir, base);
    const upgradeChanges = [];
    /* Apply all upgrades first across all files that are included */
    for (const fileName of Object.keys(provenance)) {
        const skipApplyingPins = true;
        const { changes } = await fixIndividualRequirementsTxt(workspace, dir, base, fileName, remediation, provenance[fileName], options, skipApplyingPins);
        upgradeChanges.push(...changes);
        fixedMeta[pathLib.normalize(pathLib.join(dir, fileName))] = upgradeChanges;
    }
    /* Apply all left over remediation as pins in the entry targetFile */
    const toPin = filterOutAppliedUpgrades(remediation, upgradeChanges);
    const directUpgradesOnly = false;
    const fileForPinning = await selectFileForPinning(entity);
    const { changes: pinnedChanges } = await fixIndividualRequirementsTxt(workspace, dir, base, fileForPinning.fileName, toPin, requirements_file_parser_1.parseRequirementsFile(fileForPinning.fileContent), options, directUpgradesOnly);
    return { changes: [...upgradeChanges, ...pinnedChanges], fixedMeta };
}
exports.applyAllFixes = applyAllFixes;
function filterOutAppliedUpgrades(remediation, upgradeChanges) {
    const pinRemediation = {
        ...remediation,
        pin: {},
    };
    const pins = remediation.pin;
    const normalizedAppliedRemediation = upgradeChanges
        .map((c) => {
        var _a;
        if (c.success && c.from) {
            const [pkgName, versionAndMore] = (_a = c.from) === null || _a === void 0 ? void 0 : _a.split('@');
            return `${standardize_package_name_1.standardizePackageName(pkgName)}@${versionAndMore}`;
        }
        return false;
    })
        .filter(Boolean);
    for (const pkgAtVersion of Object.keys(pins)) {
        const [pkgName, versionAndMore] = pkgAtVersion.split('@');
        if (!normalizedAppliedRemediation.includes(`${standardize_package_name_1.standardizePackageName(pkgName)}@${versionAndMore}`)) {
            pinRemediation.pin[pkgAtVersion] = pins[pkgAtVersion];
        }
    }
    return pinRemediation;
}
function sortByDirectory(entities) {
    const mapped = entities.map((e) => ({
        entity: e,
        ...pathLib.parse(e.scanResult.identity.targetFile),
    }));
    const sorted = sortBy(mapped, 'dir');
    return groupBy(sorted, 'dir');
}
async function selectFileForPinning(entity) {
    const targetFile = entity.scanResult.identity.targetFile;
    const { dir, base } = pathLib.parse(targetFile);
    const { workspace } = entity;
    // default to adding pins in the scanned file
    let fileName = base;
    let requirementsTxt = await workspace.readFile(targetFile);
    const { containsRequire, matches } = await contains_require_directive_1.containsRequireDirective(requirementsTxt);
    const constraintsMatch = matches.filter((m) => m.includes('c'));
    if (containsRequire && constraintsMatch[0]) {
        // prefer to pin in constraints file if present
        fileName = constraintsMatch[0][2];
        requirementsTxt = await workspace.readFile(pathLib.join(dir, fileName));
    }
    return { fileContent: requirementsTxt, fileName };
}
exports.selectFileForPinning = selectFileForPinning;
function getFixedEntityIssues(fixedIssueIds, issues) {
    const fixed = [];
    for (const { issueId } of issues) {
        if (fixedIssueIds.includes(issueId)) {
            fixed.push(issueId);
        }
    }
    return fixed;
}
//# sourceMappingURL=index.js.map

/***/ }),

/***/ 57584:
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.applyUpgrades = void 0;
function applyUpgrades(originalRequirements, upgradedRequirements) {
    const updated = [];
    for (const requirement of originalRequirements) {
        const { originalText } = requirement;
        if (upgradedRequirements[originalText]) {
            updated.push(upgradedRequirements[originalText]);
        }
        else {
            updated.push(originalText);
        }
    }
    return updated;
}
exports.applyUpgrades = applyUpgrades;
//# sourceMappingURL=apply-upgrades.js.map

/***/ }),

/***/ 40853:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.calculateRelevantFixes = void 0;
const is_defined_1 = __webpack_require__(38122);
const standardize_package_name_1 = __webpack_require__(78078);
function calculateRelevantFixes(requirements, updates, type) {
    const lowerCasedUpdates = {};
    const topLevelDeps = requirements.map(({ name }) => name).filter(is_defined_1.isDefined);
    Object.keys(updates).forEach((update) => {
        const { upgradeTo } = updates[update];
        const [pkgName] = update.split('@');
        const isTransitive = topLevelDeps.indexOf(standardize_package_name_1.standardizePackageName(pkgName)) < 0;
        if (type === 'transitive-pins' ? isTransitive : !isTransitive) {
            const [name, newVersion] = upgradeTo.split('@');
            lowerCasedUpdates[update] = {
                ...updates[update],
                upgradeTo: `${standardize_package_name_1.standardizePackageName(name)}@${newVersion}`,
            };
        }
    });
    return lowerCasedUpdates;
}
exports.calculateRelevantFixes = calculateRelevantFixes;
//# sourceMappingURL=calculate-relevant-fixes.js.map

/***/ }),

/***/ 2694:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.generatePins = void 0;
const calculate_relevant_fixes_1 = __webpack_require__(40853);
const is_defined_1 = __webpack_require__(38122);
const standardize_package_name_1 = __webpack_require__(78078);
function generatePins(requirements, updates, referenceFileInChanges) {
    // Lowercase the upgrades object. This might be overly defensive, given that
    // we control this input internally, but its a low cost guard rail. Outputs a
    // mapping of upgrade to -> from, instead of the nested upgradeTo object.
    const standardizedPins = calculate_relevant_fixes_1.calculateRelevantFixes(requirements, updates, 'transitive-pins');
    if (Object.keys(standardizedPins).length === 0) {
        return {
            pinnedRequirements: [],
            changes: [],
        };
    }
    const changes = [];
    const pinnedRequirements = Object.keys(standardizedPins)
        .map((pkgNameAtVersion) => {
        const [pkgName, version] = pkgNameAtVersion.split('@');
        const newVersion = standardizedPins[pkgNameAtVersion].upgradeTo.split('@')[1];
        const newRequirement = `${standardize_package_name_1.standardizePackageName(pkgName)}>=${newVersion}`;
        changes.push({
            from: `${pkgName}@${version}`,
            to: `${pkgName}@${newVersion}`,
            issueIds: standardizedPins[pkgNameAtVersion].vulns,
            success: true,
            userMessage: `Pinned ${standardize_package_name_1.standardizePackageName(pkgName)} from ${version} to ${newVersion}${referenceFileInChanges ? ` (pinned in ${referenceFileInChanges})` : ''}`,
        });
        return `${newRequirement} # not directly required, pinned by Snyk to avoid a vulnerability`;
    })
        .filter(is_defined_1.isDefined);
    return {
        pinnedRequirements,
        changes,
    };
}
exports.generatePins = generatePins;
//# sourceMappingURL=generate-pins.js.map

/***/ }),

/***/ 86047:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.generateUpgrades = void 0;
const standardize_package_name_1 = __webpack_require__(78078);
const calculate_relevant_fixes_1 = __webpack_require__(40853);
function generateUpgrades(requirements, updates, referenceFileInChanges) {
    // Lowercase the upgrades object. This might be overly defensive, given that
    // we control this input internally, but its a low cost guard rail. Outputs a
    // mapping of upgrade to -> from, instead of the nested upgradeTo object.
    const normalizedUpgrades = calculate_relevant_fixes_1.calculateRelevantFixes(requirements, updates, 'direct-upgrades');
    if (Object.keys(normalizedUpgrades).length === 0) {
        return {
            updatedRequirements: {},
            changes: [],
        };
    }
    const changes = [];
    const updatedRequirements = {};
    requirements.map(({ name, originalName, versionComparator, version, originalText, extras, }) => {
        // Defensive patching; if any of these are undefined, return
        if (typeof name === 'undefined' ||
            typeof versionComparator === 'undefined' ||
            typeof version === 'undefined' ||
            originalText === '') {
            return;
        }
        // Check if we have an upgrade; if we do, replace the version string with
        // the upgrade, but keep the rest of the content
        const upgrade = Object.keys(normalizedUpgrades).filter((packageVersionUpgrade) => {
            const [pkgName, versionAndMore] = packageVersionUpgrade.split('@');
            return `${standardize_package_name_1.standardizePackageName(pkgName)}@${versionAndMore}`.startsWith(`${standardize_package_name_1.standardizePackageName(name)}@${version}`);
        })[0];
        if (!upgrade) {
            return;
        }
        const newVersion = normalizedUpgrades[upgrade].upgradeTo.split('@')[1];
        const updatedRequirement = `${originalName}${versionComparator}${newVersion}`;
        changes.push({
            issueIds: normalizedUpgrades[upgrade].vulns,
            from: `${originalName}@${version}`,
            to: `${originalName}@${newVersion}`,
            success: true,
            userMessage: `Upgraded ${originalName} from ${version} to ${newVersion}${referenceFileInChanges
                ? ` (upgraded in ${referenceFileInChanges})`
                : ''}`,
        });
        updatedRequirements[originalText] = `${updatedRequirement}${extras ? extras : ''}`;
    });
    return {
        updatedRequirements,
        changes,
    };
}
exports.generateUpgrades = generateUpgrades;
//# sourceMappingURL=generate-upgrades.js.map

/***/ }),

/***/ 5860:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.updateDependencies = void 0;
const debugLib = __webpack_require__(15158);
const generate_pins_1 = __webpack_require__(2694);
const apply_upgrades_1 = __webpack_require__(57584);
const generate_upgrades_1 = __webpack_require__(86047);
const failed_to_parse_manifest_1 = __webpack_require__(84657);
const debug = debugLib('snyk-fix:python:update-dependencies');
/*
 * Given contents of manifest file(s) and a set of upgrades, apply the given
 * upgrades to a manifest and return the upgraded manifest.
 *
 * Currently only supported for `requirements.txt` - at least one file named
 * `requirements.txt` must be in the manifests.
 */
function updateDependencies(parsedRequirementsData, updates, directUpgradesOnly = false, referenceFileInChanges) {
    const { requirements, endsWithNewLine: shouldEndWithNewLine, } = parsedRequirementsData;
    if (!requirements.length) {
        debug('Error: Expected to receive parsed manifest data. Is manifest empty?');
        throw new failed_to_parse_manifest_1.FailedToParseManifest();
    }
    debug('Finished parsing manifest');
    const { updatedRequirements, changes: upgradedChanges } = generate_upgrades_1.generateUpgrades(requirements, updates, referenceFileInChanges);
    debug('Finished generating upgrades to apply');
    let pinnedRequirements = [];
    let pinChanges = [];
    if (!directUpgradesOnly) {
        ({ pinnedRequirements, changes: pinChanges } = generate_pins_1.generatePins(requirements, updates, referenceFileInChanges));
        debug('Finished generating pins to apply');
    }
    let updatedManifest = [
        ...apply_upgrades_1.applyUpgrades(requirements, updatedRequirements),
        ...pinnedRequirements,
    ].join('\n');
    // This is a bit of a hack, but an easy one to follow. If a file ends with a
    // new line, ensure we keep it this way. Don't hijack customers formatting.
    if (shouldEndWithNewLine) {
        updatedManifest += '\n';
    }
    debug('Finished applying changes to manifest');
    return {
        updatedManifest,
        changes: [...pinChanges, ...upgradedChanges],
    };
}
exports.updateDependencies = updateDependencies;
//# sourceMappingURL=index.js.map

/***/ }),

/***/ 38122:
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.isDefined = void 0;
// TS is not capable of determining when Array.filter has removed undefined
// values without a manual Type Guard, so thats what this does
function isDefined(t) {
    return typeof t !== 'undefined';
}
exports.isDefined = isDefined;
//# sourceMappingURL=is-defined.js.map

/***/ }),

/***/ 67285:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.parseRequirementsFile = void 0;
const debugLib = __webpack_require__(15158);
const standardize_package_name_1 = __webpack_require__(78078);
const debug = debugLib('snyk-fix:python:requirements-file-parser');
function parseRequirementsFile(requirementsFile) {
    const endsWithNewLine = requirementsFile.endsWith('\n');
    const lines = requirementsFile.replace(/\n$/, '').split('\n');
    const requirements = [];
    lines.map((requirementText, line) => {
        const requirement = extractDependencyDataFromLine(requirementText, line);
        if (requirement) {
            requirements.push(requirement);
        }
    });
    return { requirements, endsWithNewLine };
}
exports.parseRequirementsFile = parseRequirementsFile;
function extractDependencyDataFromLine(requirementText, line) {
    try {
        const requirement = { originalText: requirementText, line };
        const trimmedText = requirementText.trim();
        // Quick returns for cases we cannot remediate
        // - Empty line i.e. ''
        // - 'editable' packages i.e. '-e git://git.myproject.org/MyProject.git#egg=MyProject'
        // - Comments i.e. # This is a comment
        // - Local files i.e. file:../../lib/project#egg=MyProject
        if (requirementText === '' ||
            trimmedText.startsWith('-e') ||
            trimmedText.startsWith('#') ||
            trimmedText.startsWith('file:')) {
            return requirement;
        }
        // Regex to match against a Python package specifier. Any invalid lines (or
        // lines we can't handle) should have been returned this point.
        const regex = /([A-Z0-9-._]*)(!=|===|==|>=|<=|>|<|~=)(\d*\.?\d*\.?\d*[A-Z0-9]*)(.*)/i;
        const result = regex.exec(requirementText);
        if (result !== null) {
            requirement.name = standardize_package_name_1.standardizePackageName(result[1]);
            requirement.originalName = result[1];
            requirement.versionComparator = result[2];
            requirement.version = result[3];
            requirement.extras = result[4];
        }
        if (!(requirement.version && requirement.name)) {
            throw new Error('Failed to extract dependency data');
        }
        return requirement;
    }
    catch (err) {
        debug({ error: err.message, requirementText, line }, 'failed to parse requirement');
        return { originalText: requirementText, line };
    }
}
//# sourceMappingURL=requirements-file-parser.js.map

/***/ }),

/***/ 28006:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.pipenvPipfile = void 0;
const debugLib = __webpack_require__(15158);
const ora = __webpack_require__(63395);
const package_tool_supported_1 = __webpack_require__(96377);
const update_dependencies_1 = __webpack_require__(21110);
const debug = debugLib('snyk-fix:python:Pipfile');
async function pipenvPipfile(fixable, options) {
    debug(`Preparing to fix ${fixable.length} Python Pipfile projects`);
    const handlerResult = {
        succeeded: [],
        failed: [],
        skipped: [],
    };
    await package_tool_supported_1.checkPackageToolSupported('pipenv', options);
    for (const [index, entity] of fixable.entries()) {
        const spinner = ora({ isSilent: options.quiet, stream: process.stdout });
        const spinnerMessage = `Fixing Pipfile ${index + 1}/${fixable.length}`;
        spinner.text = spinnerMessage;
        spinner.start();
        const { failed, succeeded, skipped } = await update_dependencies_1.updateDependencies(entity, options);
        handlerResult.succeeded.push(...succeeded);
        handlerResult.failed.push(...failed);
        handlerResult.skipped.push(...skipped);
        spinner.stop();
    }
    return handlerResult;
}
exports.pipenvPipfile = pipenvPipfile;
//# sourceMappingURL=index.js.map

/***/ }),

/***/ 13755:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.generateUpgrades = void 0;
const standardize_package_name_1 = __webpack_require__(78078);
const validate_required_data_1 = __webpack_require__(57894);
function generateUpgrades(entity) {
    const { remediation } = validate_required_data_1.validateRequiredData(entity);
    const { pin: pins } = remediation;
    const upgrades = [];
    for (const pkgAtVersion of Object.keys(pins)) {
        const pin = pins[pkgAtVersion];
        const newVersion = pin.upgradeTo.split('@')[1];
        const [pkgName] = pkgAtVersion.split('@');
        upgrades.push(`${standardize_package_name_1.standardizePackageName(pkgName)}==${newVersion}`);
    }
    return { upgrades };
}
exports.generateUpgrades = generateUpgrades;
//# sourceMappingURL=generate-upgrades.js.map

/***/ }),

/***/ 21110:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.updateDependencies = void 0;
const debugLib = __webpack_require__(15158);
const no_fixes_applied_1 = __webpack_require__(80799);
const generate_upgrades_1 = __webpack_require__(13755);
const pipenv_add_1 = __webpack_require__(22629);
const attempted_changes_summary_1 = __webpack_require__(70145);
const debug = debugLib('snyk-fix:python:Pipfile');
function chooseFixStrategy(options) {
    return options.sequentialFix ? fixSequentially : fixAll;
}
async function updateDependencies(entity, options) {
    const handlerResult = await chooseFixStrategy(options)(entity, options);
    return handlerResult;
}
exports.updateDependencies = updateDependencies;
async function fixAll(entity, options) {
    const handlerResult = {
        succeeded: [],
        failed: [],
        skipped: [],
    };
    const changes = [];
    try {
        const { upgrades } = await generate_upgrades_1.generateUpgrades(entity);
        if (!upgrades.length) {
            throw new no_fixes_applied_1.NoFixesCouldBeAppliedError('Failed to calculate package updates to apply');
        }
        // TODO: for better support we need to:
        // 1. parse the manifest and extract original requirements, version spec etc
        // 2. swap out only the version and retain original spec
        // 3. re-lock the lockfile
        // Currently this is not possible as there is no Pipfile parser that would do this.
        // update prod dependencies first
        if (upgrades.length) {
            changes.push(...(await pipenv_add_1.pipenvAdd(entity, options, upgrades)));
        }
        if (!changes.length) {
            throw new no_fixes_applied_1.NoFixesCouldBeAppliedError();
        }
        if (!changes.some((c) => attempted_changes_summary_1.isSuccessfulChange(c))) {
            handlerResult.failed.push({
                original: entity,
                changes,
            });
        }
        else {
            handlerResult.succeeded.push({
                original: entity,
                changes,
            });
        }
    }
    catch (error) {
        debug(`Failed to fix ${entity.scanResult.identity.targetFile}.\nERROR: ${error}`);
        handlerResult.failed.push({
            original: entity,
            error,
            tip: error.tip,
        });
    }
    return handlerResult;
}
async function fixSequentially(entity, options) {
    const handlerResult = {
        succeeded: [],
        failed: [],
        skipped: [],
    };
    const { upgrades } = await generate_upgrades_1.generateUpgrades(entity);
    // TODO: for better support we need to:
    // 1. parse the manifest and extract original requirements, version spec etc
    // 2. swap out only the version and retain original spec
    // 3. re-lock the lockfile
    // at the moment we do not parse Pipfile and therefore can't tell the difference
    // between prod & dev updates
    const changes = [];
    try {
        if (!upgrades.length) {
            throw new no_fixes_applied_1.NoFixesCouldBeAppliedError('Failed to calculate package updates to apply');
        }
        // update prod dependencies first
        if (upgrades.length) {
            for (const upgrade of upgrades) {
                changes.push(...(await pipenv_add_1.pipenvAdd(entity, options, [upgrade])));
            }
        }
        if (!changes.length) {
            throw new no_fixes_applied_1.NoFixesCouldBeAppliedError();
        }
        if (!changes.some((c) => attempted_changes_summary_1.isSuccessfulChange(c))) {
            handlerResult.failed.push({
                original: entity,
                changes,
            });
        }
        else {
            handlerResult.succeeded.push({
                original: entity,
                changes,
            });
        }
    }
    catch (error) {
        debug(`Failed to fix ${entity.scanResult.identity.targetFile}.\nERROR: ${error}`);
        handlerResult.failed.push({
            original: entity,
            tip: error.tip,
            error,
        });
    }
    return handlerResult;
}
//# sourceMappingURL=index.js.map

/***/ }),

/***/ 22629:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.pipenvAdd = void 0;
const pathLib = __webpack_require__(85622);
const pipenvPipfileFix = __webpack_require__(91989);
const debugLib = __webpack_require__(15158);
const validate_required_data_1 = __webpack_require__(57894);
const attempted_changes_summary_1 = __webpack_require__(70145);
const command_failed_to_run_error_1 = __webpack_require__(72353);
const no_fixes_applied_1 = __webpack_require__(80799);
const debug = debugLib('snyk-fix:python:pipenvAdd');
async function pipenvAdd(entity, options, upgrades) {
    const changes = [];
    let pipenvCommand;
    const { remediation, targetFile } = validate_required_data_1.validateRequiredData(entity);
    try {
        const targetFilePath = pathLib.resolve(entity.workspace.path, targetFile);
        const { dir } = pathLib.parse(targetFilePath);
        if (!options.dryRun && upgrades.length) {
            const { stderr, stdout, command, exitCode, } = await pipenvPipfileFix.pipenvInstall(dir, upgrades, {
                python: entity.options.command,
            });
            debug('`pipenv add` returned:', { stderr, stdout, command });
            if (exitCode !== 0) {
                pipenvCommand = command;
                throwPipenvError(stderr, stdout, command);
            }
        }
        changes.push(...attempted_changes_summary_1.generateSuccessfulChanges(upgrades, remediation.pin));
    }
    catch (error) {
        changes.push(...attempted_changes_summary_1.generateFailedChanges(upgrades, remediation.pin, error, pipenvCommand));
    }
    return changes;
}
exports.pipenvAdd = pipenvAdd;
function throwPipenvError(stderr, stdout, command) {
    const incompatibleDeps = 'There are incompatible versions in the resolved dependencies';
    const lockingFailed = 'Locking failed';
    const versionNotFound = 'Could not find a version that matches';
    const errorsToBubbleUp = [incompatibleDeps, lockingFailed, versionNotFound];
    for (const error of errorsToBubbleUp) {
        if (stderr.toLowerCase().includes(error.toLowerCase()) ||
            stdout.toLowerCase().includes(error.toLowerCase())) {
            throw new command_failed_to_run_error_1.CommandFailedError(error, command);
        }
    }
    const SOLVER_PROBLEM = /SolverProblemError(.* version solving failed)/gms;
    const solverProblemError = SOLVER_PROBLEM.exec(stderr) || SOLVER_PROBLEM.exec(stdout);
    if (solverProblemError) {
        throw new command_failed_to_run_error_1.CommandFailedError(solverProblemError[0].trim(), command);
    }
    throw new no_fixes_applied_1.NoFixesCouldBeAppliedError();
}
//# sourceMappingURL=pipenv-add.js.map

/***/ }),

/***/ 60428:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.poetry = void 0;
const debugLib = __webpack_require__(15158);
const ora = __webpack_require__(63395);
const package_tool_supported_1 = __webpack_require__(96377);
const update_dependencies_1 = __webpack_require__(61526);
const debug = debugLib('snyk-fix:python:Poetry');
async function poetry(fixable, options) {
    debug(`Preparing to fix ${fixable.length} Python Poetry projects`);
    const handlerResult = {
        succeeded: [],
        failed: [],
        skipped: [],
    };
    await package_tool_supported_1.checkPackageToolSupported('poetry', options);
    for (const [index, entity] of fixable.entries()) {
        const spinner = ora({ isSilent: options.quiet, stream: process.stdout });
        const spinnerMessage = `Fixing pyproject.toml ${index + 1}/${fixable.length}`;
        spinner.text = spinnerMessage;
        spinner.start();
        const { failed, succeeded, skipped } = await update_dependencies_1.updateDependencies(entity, options);
        handlerResult.succeeded.push(...succeeded);
        handlerResult.failed.push(...failed);
        handlerResult.skipped.push(...skipped);
        spinner.stop();
    }
    return handlerResult;
}
exports.poetry = poetry;
//# sourceMappingURL=index.js.map

/***/ }),

/***/ 84204:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.generateUpgrades = void 0;
const pathLib = __webpack_require__(85622);
const toml = __webpack_require__(35424);
const debugLib = __webpack_require__(15158);
const validate_required_data_1 = __webpack_require__(57894);
const standardize_package_name_1 = __webpack_require__(78078);
const debug = debugLib('snyk-fix:python:Poetry');
async function generateUpgrades(entity) {
    var _a, _b;
    const { remediation, targetFile } = validate_required_data_1.validateRequiredData(entity);
    const pins = remediation.pin;
    const targetFilePath = pathLib.resolve(entity.workspace.path, targetFile);
    const { dir } = pathLib.parse(targetFilePath);
    const pyProjectTomlRaw = await entity.workspace.readFile(pathLib.resolve(dir, 'pyproject.toml'));
    const pyProjectToml = toml.parse(pyProjectTomlRaw);
    const prodTopLevelDeps = Object.keys((_a = pyProjectToml.tool.poetry.dependencies) !== null && _a !== void 0 ? _a : {}).map((dep) => standardize_package_name_1.standardizePackageName(dep));
    const devTopLevelDeps = Object.keys((_b = pyProjectToml.tool.poetry['dev-dependencies']) !== null && _b !== void 0 ? _b : {}).map((dep) => standardize_package_name_1.standardizePackageName(dep));
    const upgrades = [];
    const devUpgrades = [];
    for (const pkgAtVersion of Object.keys(pins)) {
        const pin = pins[pkgAtVersion];
        const newVersion = pin.upgradeTo.split('@')[1];
        const [pkgName] = pkgAtVersion.split('@');
        const upgrade = `${standardize_package_name_1.standardizePackageName(pkgName)}==${newVersion}`;
        if (pin.isTransitive || prodTopLevelDeps.includes(pkgName)) {
            // transitive and it could have come from a dev or prod dep
            // since we can't tell right now let be pinned into production deps
            upgrades.push(upgrade);
        }
        else if (prodTopLevelDeps.includes(pkgName)) {
            upgrades.push(upgrade);
        }
        else if (entity.options.dev && devTopLevelDeps.includes(pkgName)) {
            devUpgrades.push(upgrade);
        }
        else {
            debug(`Could not determine what type of upgrade ${upgrade} is. When choosing between: transitive upgrade, production or dev direct upgrade. `);
        }
    }
    return { upgrades, devUpgrades };
}
exports.generateUpgrades = generateUpgrades;
//# sourceMappingURL=generate-upgrades.js.map

/***/ }),

/***/ 61526:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.updateDependencies = void 0;
const debugLib = __webpack_require__(15158);
const generate_upgrades_1 = __webpack_require__(84204);
const poetry_add_1 = __webpack_require__(24881);
const no_fixes_applied_1 = __webpack_require__(80799);
const attempted_changes_summary_1 = __webpack_require__(70145);
const debug = debugLib('snyk-fix:python:Poetry');
function chooseFixStrategy(options) {
    return options.sequentialFix ? fixSequentially : fixAll;
}
async function updateDependencies(entity, options) {
    const handlerResult = await chooseFixStrategy(options)(entity, options);
    return handlerResult;
}
exports.updateDependencies = updateDependencies;
async function fixAll(entity, options) {
    const handlerResult = {
        succeeded: [],
        failed: [],
        skipped: [],
    };
    const { upgrades, devUpgrades } = await generate_upgrades_1.generateUpgrades(entity);
    // TODO: for better support we need to:
    // 1. parse the manifest and extract original requirements, version spec etc
    // 2. swap out only the version and retain original spec
    // 3. re-lock the lockfile
    const changes = [];
    try {
        if (![...upgrades, ...devUpgrades].length) {
            throw new no_fixes_applied_1.NoFixesCouldBeAppliedError('Failed to calculate package updates to apply');
        }
        // update prod dependencies first
        if (upgrades.length) {
            changes.push(...(await poetry_add_1.poetryAdd(entity, options, upgrades)));
        }
        // update dev dependencies second
        if (devUpgrades.length) {
            const installDev = true;
            changes.push(...(await poetry_add_1.poetryAdd(entity, options, devUpgrades, installDev)));
        }
        if (!changes.length) {
            throw new no_fixes_applied_1.NoFixesCouldBeAppliedError();
        }
        if (!changes.some((c) => attempted_changes_summary_1.isSuccessfulChange(c))) {
            handlerResult.failed.push({
                original: entity,
                changes,
            });
        }
        else {
            handlerResult.succeeded.push({
                original: entity,
                changes,
            });
        }
    }
    catch (error) {
        debug(`Failed to fix ${entity.scanResult.identity.targetFile}.\nERROR: ${error}`);
        handlerResult.failed.push({
            original: entity,
            tip: error.tip,
            error,
        });
    }
    return handlerResult;
}
async function fixSequentially(entity, options) {
    const handlerResult = {
        succeeded: [],
        failed: [],
        skipped: [],
    };
    const { upgrades, devUpgrades } = await generate_upgrades_1.generateUpgrades(entity);
    // TODO: for better support we need to:
    // 1. parse the manifest and extract original requirements, version spec etc
    // 2. swap out only the version and retain original spec
    // 3. re-lock the lockfile
    const changes = [];
    try {
        if (![...upgrades, ...devUpgrades].length) {
            throw new no_fixes_applied_1.NoFixesCouldBeAppliedError('Failed to calculate package updates to apply');
        }
        // update prod dependencies first
        if (upgrades.length) {
            for (const upgrade of upgrades) {
                changes.push(...(await poetry_add_1.poetryAdd(entity, options, [upgrade])));
            }
        }
        // update dev dependencies second
        if (devUpgrades.length) {
            for (const upgrade of devUpgrades) {
                const installDev = true;
                changes.push(...(await poetry_add_1.poetryAdd(entity, options, [upgrade], installDev)));
            }
        }
        if (!changes.length) {
            throw new no_fixes_applied_1.NoFixesCouldBeAppliedError();
        }
        if (!changes.some((c) => attempted_changes_summary_1.isSuccessfulChange(c))) {
            handlerResult.failed.push({
                original: entity,
                changes,
            });
        }
        else {
            handlerResult.succeeded.push({
                original: entity,
                changes,
            });
        }
    }
    catch (error) {
        debug(`Failed to fix ${entity.scanResult.identity.targetFile}.\nERROR: ${error}`);
        handlerResult.failed.push({
            original: entity,
            tip: error.tip,
            error,
        });
    }
    return handlerResult;
}
//# sourceMappingURL=index.js.map

/***/ }),

/***/ 24881:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.poetryAdd = void 0;
const pathLib = __webpack_require__(85622);
const debugLib = __webpack_require__(15158);
const poetryFix = __webpack_require__(69671);
const validate_required_data_1 = __webpack_require__(57894);
const attempted_changes_summary_1 = __webpack_require__(70145);
const command_failed_to_run_error_1 = __webpack_require__(72353);
const no_fixes_applied_1 = __webpack_require__(80799);
const debug = debugLib('snyk-fix:python:poetryAdd');
async function poetryAdd(entity, options, upgrades, dev) {
    var _a;
    const changes = [];
    let poetryCommand;
    const { remediation, targetFile } = validate_required_data_1.validateRequiredData(entity);
    try {
        const targetFilePath = pathLib.resolve(entity.workspace.path, targetFile);
        const { dir } = pathLib.parse(targetFilePath);
        if (!options.dryRun && upgrades.length) {
            const { stderr, stdout, command, exitCode } = await poetryFix.poetryAdd(dir, upgrades, {
                dev,
                python: (_a = entity.options.command) !== null && _a !== void 0 ? _a : undefined,
            });
            debug('`poetry add` returned:', { stderr, stdout, command });
            if (exitCode !== 0) {
                poetryCommand = command;
                throwPoetryError(stderr, stdout, command);
            }
        }
        changes.push(...attempted_changes_summary_1.generateSuccessfulChanges(upgrades, remediation.pin));
    }
    catch (error) {
        changes.push(...attempted_changes_summary_1.generateFailedChanges(upgrades, remediation.pin, error, poetryCommand));
    }
    return changes;
}
exports.poetryAdd = poetryAdd;
function throwPoetryError(stderr, stdout, command) {
    const ALREADY_UP_TO_DATE = 'No dependencies to install or update';
    const INCOMPATIBLE_PYTHON = new RegExp(/Python requirement (.*) is not compatible/g, 'gm');
    const SOLVER_PROBLEM = /SolverProblemError(.* version solving failed)/gms;
    const incompatiblePythonError = INCOMPATIBLE_PYTHON.exec(stderr) || SOLVER_PROBLEM.exec(stdout);
    if (incompatiblePythonError) {
        throw new command_failed_to_run_error_1.CommandFailedError(`The current project's Python requirement ${incompatiblePythonError[1]} is not compatible with some of the required packages`, command);
    }
    const solverProblemError = SOLVER_PROBLEM.exec(stderr) || SOLVER_PROBLEM.exec(stdout);
    if (solverProblemError) {
        throw new command_failed_to_run_error_1.CommandFailedError(solverProblemError[0].trim(), command);
    }
    if (stderr.includes(ALREADY_UP_TO_DATE) ||
        stdout.includes(ALREADY_UP_TO_DATE)) {
        throw new command_failed_to_run_error_1.CommandFailedError('No dependencies could be updated as they seem to be at the correct versions. Make sure installed dependencies in the environment match those in the lockfile by running `poetry update`', command);
    }
    throw new no_fixes_applied_1.NoFixesCouldBeAppliedError();
}
//# sourceMappingURL=poetry-add.js.map

/***/ }),

/***/ 57894:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.validateRequiredData = void 0;
const missing_remediation_data_1 = __webpack_require__(95084);
const missing_file_name_1 = __webpack_require__(86920);
const no_fixes_applied_1 = __webpack_require__(80799);
function validateRequiredData(entity) {
    const { remediation } = entity.testResult;
    if (!remediation) {
        throw new missing_remediation_data_1.MissingRemediationDataError();
    }
    const { targetFile } = entity.scanResult.identity;
    if (!targetFile) {
        throw new missing_file_name_1.MissingFileNameError();
    }
    const { workspace } = entity;
    if (!workspace) {
        throw new no_fixes_applied_1.NoFixesCouldBeAppliedError();
    }
    return { targetFile, remediation, workspace };
}
exports.validateRequiredData = validateRequiredData;
//# sourceMappingURL=validate-required-data.js.map

/***/ }),

/***/ 97090:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.pythonFix = void 0;
const debugLib = __webpack_require__(15158);
const pMap = __webpack_require__(54270);
const ora = __webpack_require__(63395);
const chalk = __webpack_require__(98250);
const load_handler_1 = __webpack_require__(7073);
const map_entities_per_handler_type_1 = __webpack_require__(78646);
const is_supported_1 = __webpack_require__(60174);
const debug = debugLib('snyk-fix:python');
async function pythonFix(entities, options) {
    const spinner = ora({ isSilent: options.quiet, stream: process.stdout });
    const spinnerMessage = 'Looking for supported Python items';
    spinner.text = spinnerMessage;
    spinner.start();
    const handlerResult = {
        python: {
            succeeded: [],
            failed: [],
            skipped: [],
        },
    };
    const results = handlerResult.python;
    const { entitiesPerType, skipped: notSupported } = map_entities_per_handler_type_1.mapEntitiesPerHandlerType(entities);
    results.skipped.push(...notSupported);
    spinner.stopAndPersist({
        text: spinnerMessage,
        symbol: chalk.green('\n✔'),
    });
    await pMap(Object.keys(entitiesPerType), async (projectType) => {
        const projectsToFix = entitiesPerType[projectType];
        if (!projectsToFix.length) {
            return;
        }
        const processingMessage = `Processing ${projectsToFix.length} ${projectType} items`;
        const processedMessage = `Processed ${projectsToFix.length} ${projectType} items`;
        spinner.text = processingMessage;
        spinner.render();
        try {
            const handler = load_handler_1.loadHandler(projectType);
            // drop unsupported Python entities early so only potentially fixable items get
            // attempted to be fixed
            const { fixable, skipped: notFixable } = await is_supported_1.partitionByFixable(projectsToFix);
            results.skipped.push(...notFixable);
            const { failed, skipped, succeeded } = await handler(fixable, options);
            results.failed.push(...failed);
            results.skipped.push(...skipped);
            results.succeeded.push(...succeeded);
        }
        catch (e) {
            debug(`Failed to fix ${projectsToFix.length} ${projectType} projects.\nError: ${e.message}`);
            results.failed.push(...generateFailed(projectsToFix, e));
        }
        spinner.stopAndPersist({
            text: processedMessage,
            symbol: chalk.green('✔'),
        });
    }, {
        concurrency: 5,
    });
    return handlerResult;
}
exports.pythonFix = pythonFix;
function generateFailed(projectsToFix, error) {
    const failed = [];
    for (const project of projectsToFix) {
        failed.push({ original: project, error: error });
    }
    return failed;
}
//# sourceMappingURL=index.js.map

/***/ }),

/***/ 7073:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.loadHandler = void 0;
const pip_requirements_1 = __webpack_require__(81065);
const pipenv_pipfile_1 = __webpack_require__(28006);
const poetry_1 = __webpack_require__(60428);
const supported_handler_types_1 = __webpack_require__(56394);
function loadHandler(type) {
    switch (type) {
        case supported_handler_types_1.SUPPORTED_HANDLER_TYPES.REQUIREMENTS: {
            return pip_requirements_1.pipRequirementsTxt;
        }
        case supported_handler_types_1.SUPPORTED_HANDLER_TYPES.PIPFILE: {
            return pipenv_pipfile_1.pipenvPipfile;
        }
        case supported_handler_types_1.SUPPORTED_HANDLER_TYPES.POETRY: {
            return poetry_1.poetry;
        }
        default: {
            throw new Error('No handler available for requested project type');
        }
    }
}
exports.loadHandler = loadHandler;
//# sourceMappingURL=load-handler.js.map

/***/ }),

/***/ 78646:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.mapEntitiesPerHandlerType = void 0;
const debugLib = __webpack_require__(15158);
const get_handler_type_1 = __webpack_require__(10774);
const supported_handler_types_1 = __webpack_require__(56394);
const debug = debugLib('snyk-fix:python');
function mapEntitiesPerHandlerType(entities) {
    const entitiesPerType = {
        [supported_handler_types_1.SUPPORTED_HANDLER_TYPES.REQUIREMENTS]: [],
        [supported_handler_types_1.SUPPORTED_HANDLER_TYPES.PIPFILE]: [],
        [supported_handler_types_1.SUPPORTED_HANDLER_TYPES.POETRY]: [],
    };
    const skipped = [];
    for (const entity of entities) {
        const type = get_handler_type_1.getHandlerType(entity);
        if (type) {
            entitiesPerType[type].push(entity);
            continue;
        }
        const userMessage = `${entity.scanResult.identity.targetFile} is not supported`;
        debug(userMessage);
        skipped.push({ original: entity, userMessage });
    }
    return { entitiesPerType, skipped };
}
exports.mapEntitiesPerHandlerType = mapEntitiesPerHandlerType;
//# sourceMappingURL=map-entities-per-handler-type.js.map

/***/ }),

/***/ 78078:
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.standardizePackageName = void 0;
/*
 * https://www.python.org/dev/peps/pep-0426/#name
 * All comparisons of distribution names MUST be case insensitive,
 * and MUST consider hyphens and underscores to be equivalent.
 *
 */
function standardizePackageName(name) {
    return name.replace('_', '-').toLowerCase();
}
exports.standardizePackageName = standardizePackageName;
//# sourceMappingURL=standardize-package-name.js.map

/***/ }),

/***/ 56394:
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.SUPPORTED_HANDLER_TYPES = void 0;
var SUPPORTED_HANDLER_TYPES;
(function (SUPPORTED_HANDLER_TYPES) {
    // shortname = display name
    SUPPORTED_HANDLER_TYPES["REQUIREMENTS"] = "requirements.txt";
    SUPPORTED_HANDLER_TYPES["PIPFILE"] = "Pipfile";
    SUPPORTED_HANDLER_TYPES["POETRY"] = "pyproject.toml";
})(SUPPORTED_HANDLER_TYPES = exports.SUPPORTED_HANDLER_TYPES || (exports.SUPPORTED_HANDLER_TYPES = {}));
//# sourceMappingURL=supported-handler-types.js.map

/***/ }),

/***/ 71538:
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.isWithError = void 0;
function isWithError(r) {
    return 'error' in r;
}
exports.isWithError = isWithError;
//# sourceMappingURL=types.js.map

/***/ })

};
;
//# sourceMappingURL=741.index.js.map