exports.id = 784;
exports.ids = [784];
exports.modules = {

/***/ 61452:
/***/ ((module) => {

function webpackEmptyContext(req) {
	var e = new Error("Cannot find module '" + req + "'");
	e.code = 'MODULE_NOT_FOUND';
	throw e;
}
webpackEmptyContext.keys = () => ([]);
webpackEmptyContext.resolve = webpackEmptyContext;
webpackEmptyContext.id = 61452;
module.exports = webpackEmptyContext;

/***/ }),

/***/ 3196:
/***/ ((module) => {

function webpackEmptyContext(req) {
	var e = new Error("Cannot find module '" + req + "'");
	e.code = 'MODULE_NOT_FOUND';
	throw e;
}
webpackEmptyContext.keys = () => ([]);
webpackEmptyContext.resolve = webpackEmptyContext;
webpackEmptyContext.id = 3196;
module.exports = webpackEmptyContext;

/***/ }),

/***/ 3708:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.validateTags = exports.generateTags = exports.generateProjectAttributes = exports.validateProjectAttributes = void 0;
const chalk_1 = __webpack_require__(32589);
const fs = __webpack_require__(35747);
const Debug = __webpack_require__(15158);
const pathUtil = __webpack_require__(85622);
const cli_interface_1 = __webpack_require__(65266);
const options_validator_1 = __webpack_require__(1570);
const types_1 = __webpack_require__(94055);
const config_1 = __webpack_require__(22541);
const detect = __webpack_require__(45318);
const spinner_1 = __webpack_require__(86766);
const analytics = __webpack_require__(82744);
const api_token_1 = __webpack_require__(95181);
const print_deps_1 = __webpack_require__(79792);
const monitor_1 = __webpack_require__(3959);
const process_json_monitor_1 = __webpack_require__(21506);
const snyk = __webpack_require__(9146); // TODO(kyegupov): fix import
const formatters_1 = __webpack_require__(81329);
const get_deps_from_plugin_1 = __webpack_require__(4842);
const get_extra_project_count_1 = __webpack_require__(34355);
const extract_package_manager_1 = __webpack_require__(22805);
const convert_multi_plugin_res_to_multi_custom_1 = __webpack_require__(23110);
const convert_single_splugin_res_to_multi_custom_1 = __webpack_require__(99695);
const dev_count_analysis_1 = __webpack_require__(73898);
const errors_1 = __webpack_require__(55191);
const is_multi_project_scan_1 = __webpack_require__(62435);
const ecosystems_1 = __webpack_require__(5168);
const monitor_2 = __webpack_require__(62406);
const process_command_args_1 = __webpack_require__(52369);
const SEPARATOR = '\n-------------------------------------------------------\n';
const debug = Debug('snyk');
// This is used instead of `let x; try { x = await ... } catch { cleanup }` to avoid
// declaring the type of x as possibly undefined.
async function promiseOrCleanup(p, cleanup) {
    return p.catch((error) => {
        cleanup();
        throw error;
    });
}
// Returns an array of Registry responses (one per every sub-project scanned), a single response,
// or an error message.
async function monitor(...args0) {
    var _a;
    const { options, paths } = process_command_args_1.processCommandArgs(...args0);
    const results = [];
    if (options.id) {
        snyk.id = options.id;
    }
    if (options.allSubProjects && options['project-name']) {
        throw new Error('`--all-sub-projects` is currently not compatible with `--project-name`');
    }
    if (options.docker && options['remote-repo-url']) {
        throw new Error('`--remote-repo-url` is not supported for container scans');
    }
    // Handles no image arg provided to the container command until
    // a validation interface is implemented in the docker plugin.
    if (options.docker && paths.length === 0) {
        throw new errors_1.MissingArgError();
    }
    api_token_1.apiOrOAuthTokenExists();
    let contributors = [];
    if (!options.docker && analytics.allowAnalytics()) {
        try {
            contributors = await dev_count_analysis_1.getContributors();
        }
        catch (err) {
            debug('error getting repo contributors', err);
        }
    }
    const ecosystem = ecosystems_1.getEcosystem(options);
    if (ecosystem) {
        const commandResult = await ecosystems_1.monitorEcosystem(ecosystem, paths, options);
        const [monitorResults, monitorErrors] = commandResult;
        return await monitor_2.getFormattedMonitorOutput(results, monitorResults, monitorErrors, options);
    }
    // Part 1: every argument is a scan target; process them sequentially
    for (const path of paths) {
        debug(`Processing ${path}...`);
        try {
            validateMonitorPath(path, options.docker);
            let analysisType = 'all';
            let packageManager;
            if (is_multi_project_scan_1.isMultiProjectScan(options)) {
                analysisType = 'all';
            }
            else if (options.docker) {
                analysisType = 'docker';
            }
            else {
                packageManager = detect.detectPackageManager(path, options);
            }
            await options_validator_1.validateOptions(options, packageManager);
            const targetFile = !options.scanAllUnmanaged && options.docker && !options.file // snyk monitor --docker (without --file)
                ? undefined
                : options.file || detect.detectPackageFile(path);
            const displayPath = pathUtil.relative('.', pathUtil.join(path, targetFile || ''));
            const analyzingDepsSpinnerLabel = 'Analyzing ' +
                (packageManager ? packageManager : analysisType) +
                ' dependencies for ' +
                displayPath;
            await spinner_1.spinner(analyzingDepsSpinnerLabel);
            // Scan the project dependencies via a plugin
            debug('getDepsFromPlugin ...');
            // each plugin will be asked to scan once per path
            // some return single InspectResult & newer ones return Multi
            const inspectResult = await promiseOrCleanup(get_deps_from_plugin_1.getDepsFromPlugin(path, {
                ...options,
                path,
                packageManager,
            }), spinner_1.spinner.clear(analyzingDepsSpinnerLabel));
            analytics.add('pluginName', inspectResult.plugin.name);
            // We send results from "all-sub-projects" scanning as different Monitor objects
            // multi result will become default, so start migrating code to always work with it
            let perProjectResult;
            if (!cli_interface_1.legacyPlugin.isMultiResult(inspectResult)) {
                perProjectResult = convert_single_splugin_res_to_multi_custom_1.convertSingleResultToMultiCustom(inspectResult);
            }
            else {
                perProjectResult = convert_multi_plugin_res_to_multi_custom_1.convertMultiResultToMultiCustom(inspectResult);
            }
            const failedResults = inspectResult
                .failedResults;
            if (failedResults === null || failedResults === void 0 ? void 0 : failedResults.length) {
                failedResults.forEach((result) => {
                    results.push({
                        ok: false,
                        data: new errors_1.MonitorError(500, result.errMessage),
                        path: result.targetFile || '',
                    });
                });
            }
            const postingMonitorSpinnerLabel = 'Posting monitor snapshot for ' + displayPath + ' ...';
            await spinner_1.spinner(postingMonitorSpinnerLabel);
            // Post the project dependencies to the Registry
            for (const projectDeps of perProjectResult.scannedProjects) {
                try {
                    if (!projectDeps.depGraph && !projectDeps.depTree) {
                        debug('scannedProject is missing depGraph or depTree, cannot run test/monitor');
                        throw new errors_1.FailedToRunTestError('Your monitor request could not be completed. Please email support@snyk.io');
                    }
                    const extractedPackageManager = extract_package_manager_1.extractPackageManager(projectDeps, perProjectResult, options);
                    analytics.add('packageManager', extractedPackageManager);
                    const projectName = getProjectName(projectDeps);
                    if (projectDeps.depGraph) {
                        debug(`Processing ${(_a = projectDeps.depGraph.rootPkg) === null || _a === void 0 ? void 0 : _a.name}...`);
                        print_deps_1.maybePrintDepGraph(options, projectDeps.depGraph);
                    }
                    if (projectDeps.depTree) {
                        debug(`Processing ${projectDeps.depTree.name}...`);
                        print_deps_1.maybePrintDepTree(options, projectDeps.depTree);
                    }
                    const tFile = projectDeps.targetFile || targetFile;
                    const targetFileRelativePath = projectDeps.plugin.targetFile ||
                        (tFile && pathUtil.join(pathUtil.resolve(path), tFile)) ||
                        '';
                    const res = await promiseOrCleanup(monitor_1.monitor(path, generateMonitorMeta(options, extractedPackageManager), projectDeps, options, projectDeps.plugin, targetFileRelativePath, contributors, generateProjectAttributes(options), generateTags(options)), spinner_1.spinner.clear(postingMonitorSpinnerLabel));
                    res.path = path;
                    const monOutput = formatters_1.formatMonitorOutput(extractedPackageManager, res, options, projectName, await get_extra_project_count_1.getExtraProjectCount(path, options, inspectResult));
                    // push a good result
                    results.push({ ok: true, data: monOutput, path, projectName });
                }
                catch (err) {
                    // pushing this error allow this inner loop to keep scanning the projects
                    // even if 1 in 100 fails
                    results.push({ ok: false, data: err, path });
                }
            }
        }
        catch (err) {
            // push this error, the loop continues
            results.push({ ok: false, data: err, path });
        }
        finally {
            spinner_1.spinner.clearAll();
        }
    }
    // Part 2: process the output from the Registry
    if (options.json) {
        return process_json_monitor_1.processJsonMonitorResponse(results);
    }
    const output = results
        .map((res) => {
        if (res.ok) {
            return res.data;
        }
        const errorMessage = res.data && res.data.userMessage
            ? chalk_1.default.bold.red(res.data.userMessage)
            : res.data
                ? res.data.message
                : 'Unknown error occurred.';
        return (chalk_1.default.bold.white('\nMonitoring ' + res.path + '...\n\n') + errorMessage);
    })
        .join('\n' + SEPARATOR);
    if (results.every((res) => res.ok)) {
        return output;
    }
    throw new Error(output);
}
exports.default = monitor;
function generateMonitorMeta(options, packageManager) {
    return {
        method: 'cli',
        packageManager,
        'policy-path': options['policy-path'],
        'project-name': options['project-name'] || config_1.default.PROJECT_NAME,
        isDocker: !!options.docker,
        prune: !!options.pruneRepeatedSubdependencies,
        'remote-repo-url': options['remote-repo-url'],
        targetReference: options['target-reference'],
    };
}
/**
 * Parse an attribute from the CLI into the relevant enum type.
 *
 * @param attribute The project attribute (e.g. environment)
 * @param permitted Permitted options
 * @param options CLI options provided
 * @returns An array of attributes to set on the project or undefined to mean "do not touch".
 */
function getProjectAttribute(attribute, permitted, options) {
    const permittedValues = Object.values(permitted);
    if (options[attribute] === undefined) {
        return undefined;
    }
    // Explicit flag to clear the existing values for this attribute already set on the project
    // e.g. if you specify --environment=
    // then this means you want to remove existing environment values on the project.
    if (options[attribute] === '') {
        return [];
    }
    // When it's specified without the =, we raise an explicit error to avoid
    // accidentally clearing the existing values.
    if (options[attribute] === true) {
        throw new errors_1.ValidationError(`--${attribute} must contain an '=' with a comma-separated list of values. To clear all existing values, pass no values i.e. --${attribute}=`);
    }
    const values = options[attribute].split(',');
    const extra = values.filter((value) => !permittedValues.includes(value));
    if (extra.length > 0) {
        throw new errors_1.ValidationError(`${extra.length} invalid ${attribute}: ${extra.join(', ')}. ` +
            `Possible values are: ${permittedValues.join(', ')}`);
    }
    return values;
}
function validateProjectAttributes(options) {
    // The validation is deep within the parsing, so call the generate but throw away the return for simplicity.
    // Using this method makes it much clearer what the intent is of the caller.
    generateProjectAttributes(options);
}
exports.validateProjectAttributes = validateProjectAttributes;
function generateProjectAttributes(options) {
    return {
        criticality: getProjectAttribute('project-business-criticality', types_1.PROJECT_CRITICALITY, options),
        environment: getProjectAttribute('project-environment', types_1.PROJECT_ENVIRONMENT, options),
        lifecycle: getProjectAttribute('project-lifecycle', types_1.PROJECT_LIFECYCLE, options),
    };
}
exports.generateProjectAttributes = generateProjectAttributes;
/**
 * Parse CLI --tags options into an internal data structure.
 *
 * If this returns undefined, it means "do not touch the existing tags on the project".
 *
 * Anything else means "replace existing tags on the project with this list" even if empty.
 *
 * @param options CLI options
 * @returns List of parsed tags or undefined if they are to be left untouched.
 */
function generateTags(options) {
    if (options['project-tags'] === undefined && options['tags'] === undefined) {
        return undefined;
    }
    if (options['project-tags'] !== undefined && options['tags'] !== undefined) {
        throw new errors_1.ValidationError('Only one of --tags or --project-tags may be specified, not both');
    }
    const rawTags = options['tags'] === undefined ? options['project-tags'] : options['tags'];
    if (rawTags === '') {
        return [];
    }
    // When it's specified without the =, we raise an explicit error to avoid
    // accidentally clearing the existing tags;
    if (rawTags === true) {
        throw new errors_1.ValidationError(`--project-tags must contain an '=' with a comma-separated list of pairs (also separated with an '='). To clear all existing values, pass no values i.e. --project-tags=`);
    }
    const keyEqualsValuePairs = rawTags.split(',');
    const tags = [];
    for (const keyEqualsValue of keyEqualsValuePairs) {
        const parts = keyEqualsValue.split('=');
        if (parts.length !== 2) {
            throw new errors_1.ValidationError(`The tag "${keyEqualsValue}" does not have an "=" separating the key and value. For example: --project-tag=KEY=VALUE`);
        }
        tags.push({
            key: parts[0],
            value: parts[1],
        });
    }
    return tags;
}
exports.generateTags = generateTags;
function validateTags(options) {
    // The validation is deep within the parsing, so call the generate but throw away the return for simplicity.
    // Using this method makes it much clearer what the intent is of the caller.
    generateTags(options);
}
exports.validateTags = validateTags;
function validateMonitorPath(path, isDocker) {
    const exists = fs.existsSync(path);
    if (!exists && !isDocker) {
        throw new Error('"' + path + '" is not a valid path for "snyk monitor"');
    }
}
function getProjectName(projectDeps) {
    var _a, _b, _c, _d;
    return (((_a = projectDeps.meta) === null || _a === void 0 ? void 0 : _a.gradleProjectName) || ((_c = (_b = projectDeps.depGraph) === null || _b === void 0 ? void 0 : _b.rootPkg) === null || _c === void 0 ? void 0 : _c.name) || ((_d = projectDeps.depTree) === null || _d === void 0 ? void 0 : _d.name));
}


/***/ }),

/***/ 21506:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.processJsonMonitorResponse = void 0;
function processJsonMonitorResponse(results) {
    let dataToSend = results.map((result) => {
        if (result.ok) {
            const jsonData = JSON.parse(result.data);
            if (result.projectName) {
                jsonData.projectName = result.projectName;
            }
            return jsonData;
        }
        return { ok: false, error: result.data.message, path: result.path };
    });
    // backwards compat - strip array if only one result
    dataToSend = dataToSend.length === 1 ? dataToSend[0] : dataToSend;
    const stringifiedData = JSON.stringify(dataToSend, null, 2);
    if (results.every((res) => res.ok)) {
        return stringifiedData;
    }
    const err = new Error(stringifiedData);
    err.json = stringifiedData;
    throw err;
}
exports.processJsonMonitorResponse = processJsonMonitorResponse;


/***/ }),

/***/ 52369:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.processCommandArgs = void 0;
function processCommandArgs(...args) {
    let options = {};
    if (typeof args[args.length - 1] === 'object') {
        options = args.pop();
    }
    args = args.filter(Boolean);
    // For repository scanning, populate with default path (cwd) if no path given
    if (args.length === 0 && !options.docker) {
        args.unshift(process.cwd());
    }
    return { options, paths: args };
}
exports.processCommandArgs = processCommandArgs;


/***/ }),

/***/ 55246:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.TestCommandResult = exports.CommandResult = void 0;
class CommandResult {
    constructor(result) {
        this.result = result;
    }
    toString() {
        return this.result;
    }
    getDisplayResults() {
        return this.result;
    }
}
exports.CommandResult = CommandResult;
class TestCommandResult extends CommandResult {
    constructor() {
        super(...arguments);
        this.jsonResult = '';
        this.sarifResult = '';
    }
    getJsonResult() {
        return this.jsonResult;
    }
    getSarifResult() {
        return this.sarifResult;
    }
    static createHumanReadableTestCommandResult(humanReadableResult, jsonResult, sarifResult) {
        return new HumanReadableTestCommandResult(humanReadableResult, jsonResult, sarifResult);
    }
    static createJsonTestCommandResult(stdout, jsonResult, sarifResult) {
        return new JsonTestCommandResult(stdout, jsonResult, sarifResult);
    }
}
exports.TestCommandResult = TestCommandResult;
class HumanReadableTestCommandResult extends TestCommandResult {
    constructor(humanReadableResult, jsonResult, sarifResult) {
        super(humanReadableResult);
        this.jsonResult = '';
        this.sarifResult = '';
        this.jsonResult = jsonResult;
        if (sarifResult) {
            this.sarifResult = sarifResult;
        }
    }
    getJsonResult() {
        return this.jsonResult;
    }
    getSarifResult() {
        return this.sarifResult;
    }
}
class JsonTestCommandResult extends TestCommandResult {
    constructor(stdout, jsonResult, sarifResult) {
        super(stdout);
        if (jsonResult) {
            this.jsonResult = jsonResult;
        }
        if (sarifResult) {
            this.sarifResult = sarifResult;
        }
        else {
            this.jsonResult = stdout;
        }
    }
    getJsonResult() {
        return this.jsonResult;
    }
    getSarifResult() {
        return this.sarifResult;
    }
}


/***/ }),

/***/ 65623:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.CALL_PATH_TRAILING_ELEMENTS = exports.CALL_PATH_LEADING_ELEMENTS = exports.PATH_HIDDEN_ELEMENTS = exports.PATH_SEPARATOR = void 0;
// Separator used while displaying various paths (e.g. package paths, call
// paths) to the user
exports.PATH_SEPARATOR = ' > ';
// String used to signify hidden path elements e.g. for abbreviated paths
exports.PATH_HIDDEN_ELEMENTS = '...';
// Number of function names to show in the beginning of an abbreviated call path
exports.CALL_PATH_LEADING_ELEMENTS = 2;
// Number of function names to show in the end of an abbreviated call path
exports.CALL_PATH_TRAILING_ELEMENTS = 2;


/***/ }),

/***/ 69813:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.isUnmanagedEcosystem = void 0;
function isUnmanagedEcosystem(ecosystem) {
    return ecosystem === 'cpp';
}
exports.isUnmanagedEcosystem = isUnmanagedEcosystem;


/***/ }),

/***/ 5168:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.getEcosystem = exports.getEcosystemForTest = void 0;
var test_1 = __webpack_require__(60937);
Object.defineProperty(exports, "testEcosystem", ({ enumerable: true, get: function () { return test_1.testEcosystem; } }));
var monitor_1 = __webpack_require__(62406);
Object.defineProperty(exports, "monitorEcosystem", ({ enumerable: true, get: function () { return monitor_1.monitorEcosystem; } }));
var plugins_1 = __webpack_require__(78053);
Object.defineProperty(exports, "getPlugin", ({ enumerable: true, get: function () { return plugins_1.getPlugin; } }));
/**
 * Ecosystems are listed here if you opt in to the new plugin test flow.
 * This is a breaking change to the old plugin formats, so only a select few
 * plugins currently work with it.
 *
 * Currently container scanning is not yet ready to work with this flow,
 * hence this is in a separate function from getEcosystem().
 */
function getEcosystemForTest(options) {
    if (options.unmanaged) {
        return 'cpp';
    }
    if (options.code) {
        return 'code';
    }
    return null;
}
exports.getEcosystemForTest = getEcosystemForTest;
function getEcosystem(options) {
    if (options.unmanaged) {
        return 'cpp';
    }
    if (options.docker) {
        return 'docker';
    }
    return null;
}
exports.getEcosystem = getEcosystem;


/***/ }),

/***/ 62406:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.getFormattedMonitorOutput = exports.generateMonitorDependenciesRequest = exports.monitorEcosystem = void 0;
const chalk_1 = __webpack_require__(32589);
const config_1 = __webpack_require__(22541);
const is_ci_1 = __webpack_require__(10090);
const promise_1 = __webpack_require__(90430);
const spinner_1 = __webpack_require__(86766);
const plugins_1 = __webpack_require__(78053);
const formatters_1 = __webpack_require__(81329);
const get_extra_project_count_1 = __webpack_require__(34355);
const errors_1 = __webpack_require__(55191);
const policy_1 = __webpack_require__(4669);
const api_token_1 = __webpack_require__(95181);
const resolve_monitor_facts_1 = __webpack_require__(47630);
const monitor_1 = __webpack_require__(3708);
const common_1 = __webpack_require__(69813);
const policy_2 = __webpack_require__(32615);
const SEPARATOR = '\n-------------------------------------------------------\n';
async function monitorEcosystem(ecosystem, paths, options) {
    const plugin = plugins_1.getPlugin(ecosystem);
    monitor_1.validateTags(options);
    monitor_1.validateProjectAttributes(options);
    const scanResultsByPath = {};
    for (const path of paths) {
        try {
            await spinner_1.spinner(`Analyzing dependencies in ${path}`);
            options.path = path;
            const pluginResponse = await plugin.scan(options);
            scanResultsByPath[path] = pluginResponse.scanResults;
            const policy = await policy_2.findAndLoadPolicy(path, 'cpp', options);
            if (policy) {
                scanResultsByPath[path].forEach((scanResult) => (scanResult.policy = policy.toString()));
            }
        }
        catch (error) {
            if (ecosystem === 'docker' &&
                error.statusCode === 401 &&
                error.message === 'authentication required') {
                throw new errors_1.DockerImageNotFoundError(path);
            }
            if (ecosystem === 'docker' && error.message === 'invalid image format') {
                throw new errors_1.DockerImageNotFoundError(path);
            }
            throw error;
        }
        finally {
            spinner_1.spinner.clearAll();
        }
    }
    const [monitorResults, errors] = await selectAndExecuteMonitorStrategy(ecosystem, scanResultsByPath, options);
    return [monitorResults, errors];
}
exports.monitorEcosystem = monitorEcosystem;
async function selectAndExecuteMonitorStrategy(ecosystem, scanResultsByPath, options) {
    return common_1.isUnmanagedEcosystem(ecosystem)
        ? await resolve_monitor_facts_1.resolveAndMonitorFacts(scanResultsByPath, options)
        : await monitorDependencies(scanResultsByPath, options);
}
async function generateMonitorDependenciesRequest(scanResult, options) {
    // WARNING! This mutates the payload. The project name logic should be handled in the plugin.
    scanResult.name =
        options['project-name'] || config_1.default.PROJECT_NAME || scanResult.name;
    // WARNING! This mutates the payload. Policy logic should be in the plugin.
    const policy = await policy_1.findAndLoadPolicyForScanResult(scanResult, options);
    if (policy !== undefined) {
        scanResult.policy = policy.toString();
    }
    return {
        scanResult,
        method: 'cli',
        projectName: options['project-name'] || config_1.default.PROJECT_NAME || undefined,
        tags: monitor_1.generateTags(options),
        attributes: monitor_1.generateProjectAttributes(options),
    };
}
exports.generateMonitorDependenciesRequest = generateMonitorDependenciesRequest;
async function monitorDependencies(scans, options) {
    const results = [];
    const errors = [];
    for (const [path, scanResults] of Object.entries(scans)) {
        await spinner_1.spinner(`Monitoring dependencies in ${path}`);
        for (const scanResult of scanResults) {
            const monitorDependenciesRequest = await generateMonitorDependenciesRequest(scanResult, options);
            const configOrg = config_1.default.org ? decodeURIComponent(config_1.default.org) : undefined;
            const payload = {
                method: 'PUT',
                url: `${config_1.default.API}/monitor-dependencies`,
                json: true,
                headers: {
                    'x-is-ci': is_ci_1.isCI(),
                    authorization: api_token_1.getAuthHeader(),
                },
                body: monitorDependenciesRequest,
                qs: {
                    org: options.org || configOrg,
                },
            };
            try {
                const response = await promise_1.makeRequest(payload);
                results.push({
                    ...response,
                    path,
                    scanResult,
                });
            }
            catch (error) {
                if (error.code === 401) {
                    throw errors_1.AuthFailedError();
                }
                if (error.code >= 400 && error.code < 500) {
                    throw new errors_1.MonitorError(error.code, error.message);
                }
                errors.push({
                    error: 'Could not monitor dependencies in ' + path,
                    path,
                    scanResult,
                });
            }
        }
        spinner_1.spinner.clearAll();
    }
    return [results, errors];
}
async function getFormattedMonitorOutput(results, monitorResults, errors, options) {
    for (const monitorResult of monitorResults) {
        let monOutput = '';
        if (monitorResult.ok) {
            monOutput = formatters_1.formatMonitorOutput(monitorResult.scanResult.identity.type, monitorResult, options, monitorResult.projectName, await get_extra_project_count_1.getExtraProjectCount(monitorResult.path, options, 
            // TODO: Fix to pass the old "inspectResult.plugin.meta.allSubProjectNames", which ecosystem uses this?
            // "allSubProjectNames" can become a Fact returned by a plugin.
            {}));
        }
        else {
            monOutput = formatters_1.formatErrorMonitorOutput(monitorResult.scanResult.identity.type, monitorResult, options);
        }
        results.push({
            ok: true,
            data: monOutput,
            path: monitorResult.path,
            projectName: monitorResult.id,
        });
    }
    for (const monitorError of errors) {
        results.push({
            ok: false,
            data: new errors_1.MonitorError(500, monitorError.error),
            path: monitorError.path,
        });
    }
    const outputString = results
        .map((res) => {
        if (res.ok) {
            return res.data;
        }
        const errorMessage = res.data && res.data.userMessage
            ? chalk_1.default.bold.red(res.data.userMessage)
            : res.data
                ? res.data.message
                : 'Unknown error occurred.';
        return (chalk_1.default.bold.white('\nMonitoring ' + res.path + '...\n\n') + errorMessage);
    })
        .join('\n' + SEPARATOR);
    if (results.every((res) => res.ok)) {
        return outputString;
    }
    throw new Error(outputString);
}
exports.getFormattedMonitorOutput = getFormattedMonitorOutput;


/***/ }),

/***/ 33077:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.extractAndApplyPluginAnalytics = void 0;
const analytics = __webpack_require__(82744);
function extractAndApplyPluginAnalytics(pluginAnalytics, asyncRequestToken) {
    if (asyncRequestToken) {
        analytics.add('asyncRequestToken', asyncRequestToken);
    }
    for (const { name, data } of pluginAnalytics) {
        analytics.add(name, data);
    }
}
exports.extractAndApplyPluginAnalytics = extractAndApplyPluginAnalytics;


/***/ }),

/***/ 78053:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.getPlugin = void 0;
const cppPlugin = __webpack_require__(96957);
const dockerPlugin = __webpack_require__(61165);
const sast_1 = __webpack_require__(93221);
const EcosystemPlugins = {
    cpp: cppPlugin,
    // TODO: not any
    docker: dockerPlugin,
    code: sast_1.codePlugin,
};
function getPlugin(ecosystem) {
    return EcosystemPlugins[ecosystem];
}
exports.getPlugin = getPlugin;


/***/ }),

/***/ 4669:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.filterIgnoredIssues = exports.findAndLoadPolicyForScanResult = void 0;
const path = __webpack_require__(85622);
const policy_1 = __webpack_require__(32615);
async function findAndLoadPolicyForScanResult(scanResult, options) {
    const targetFileRelativePath = scanResult.identity.targetFile
        ? path.join(path.resolve(`${options.path}`), scanResult.identity.targetFile)
        : undefined;
    const targetFileDir = targetFileRelativePath
        ? path.parse(targetFileRelativePath).dir
        : undefined;
    const scanType = options.docker
        ? 'docker'
        : scanResult.identity.type;
    // TODO: fix this and send only send when we used resolve-deps for node
    // it should be a ExpandedPkgTree type instead
    const packageExpanded = undefined;
    const policy = (await policy_1.findAndLoadPolicy(options.path, scanType, options, packageExpanded, targetFileDir)); // TODO: findAndLoadPolicy() does not return a string!
    return policy;
}
exports.findAndLoadPolicyForScanResult = findAndLoadPolicyForScanResult;
function filterIgnoredIssues(issues, issuesData, policy) {
    if (!(policy === null || policy === void 0 ? void 0 : policy.ignore)) {
        return [issues, issuesData];
    }
    const filteredIssuesData = { ...issuesData };
    const filteredIssues = issues.filter((issue) => {
        const ignoredIssue = policy.ignore[issue.issueId];
        if (!ignoredIssue) {
            return true;
        }
        const allResourcesRule = ignoredIssue.find((element) => '*' in element);
        if (!allResourcesRule) {
            return true;
        }
        const expiredIgnoreRule = new Date(allResourcesRule['*'].expires) < new Date();
        if (!expiredIgnoreRule) {
            delete filteredIssuesData[issue.issueId];
            return false;
        }
        return true;
    });
    return [filteredIssues, filteredIssuesData];
}
exports.filterIgnoredIssues = filterIgnoredIssues;


/***/ }),

/***/ 47630:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.resolveAndMonitorFacts = void 0;
const spinner_1 = __webpack_require__(86766);
const polling_monitor_1 = __webpack_require__(59354);
const plugin_analytics_1 = __webpack_require__(33077);
const errors_1 = __webpack_require__(55191);
const common_1 = __webpack_require__(74434);
async function resolveAndMonitorFacts(scans, options) {
    const results = [];
    const errors = [];
    for (const [path, scanResults] of Object.entries(scans)) {
        await spinner_1.spinner(`Resolving and Monitoring fileSignatures in ${path}`);
        for (const scanResult of scanResults) {
            try {
                const res = await polling_monitor_1.requestMonitorPollingToken(options, true, scanResult);
                if (scanResult.analytics) {
                    plugin_analytics_1.extractAndApplyPluginAnalytics(scanResult.analytics, res.token);
                }
                const resolutionMeta = common_1.extractResolutionMetaFromScanResult(scanResult);
                const { maxAttempts, pollInterval } = res.pollingTask;
                const attemptsCount = 0;
                const response = await polling_monitor_1.pollingMonitorWithTokenUntilDone(res.token, true, options, pollInterval, attemptsCount, maxAttempts, resolutionMeta);
                const ecosystemMonitorResult = {
                    ...response,
                    path,
                    scanResult,
                };
                results.push(ecosystemMonitorResult);
            }
            catch (error) {
                if (error.code === 401) {
                    throw errors_1.AuthFailedError();
                }
                if (error.code >= 400 && error.code < 500) {
                    throw new errors_1.MonitorError(error.code, error.message);
                }
                errors.push({
                    error: 'Could not monitor dependencies in ' + path,
                    path,
                    scanResult,
                });
            }
        }
        spinner_1.spinner.clearAll();
    }
    return [results, errors];
}
exports.resolveAndMonitorFacts = resolveAndMonitorFacts;


/***/ }),

/***/ 85164:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.resolveAndTestFacts = void 0;
const spinner_1 = __webpack_require__(86766);
const polling_test_1 = __webpack_require__(77584);
const plugin_analytics_1 = __webpack_require__(33077);
const policy_1 = __webpack_require__(32615);
const policy_2 = __webpack_require__(4669);
async function resolveAndTestFacts(ecosystem, scans, options) {
    const results = [];
    const errors = [];
    for (const [path, scanResults] of Object.entries(scans)) {
        await spinner_1.spinner(`Resolving and Testing fileSignatures in ${path}`);
        for (const scanResult of scanResults) {
            try {
                const res = await polling_test_1.requestTestPollingToken(options, true, scanResult);
                if (scanResult.analytics) {
                    plugin_analytics_1.extractAndApplyPluginAnalytics(scanResult.analytics, res.token);
                }
                const { maxAttempts, pollInterval } = res.pollingTask;
                const attemptsCount = 0;
                const response = await polling_test_1.pollingTestWithTokenUntilDone(res.token, ecosystem, options, pollInterval, attemptsCount, maxAttempts);
                const policy = await policy_1.findAndLoadPolicy(path, 'cpp', options);
                const [issues, issuesData] = policy_2.filterIgnoredIssues(response.issues, response.issuesData, policy);
                results.push({
                    issues,
                    issuesData,
                    depGraphData: response === null || response === void 0 ? void 0 : response.depGraphData,
                    depsFilePaths: response === null || response === void 0 ? void 0 : response.depsFilePaths,
                    fileSignaturesDetails: response === null || response === void 0 ? void 0 : response.fileSignaturesDetails,
                });
            }
            catch (error) {
                const hasStatusCodeError = error.code >= 400 && error.code <= 500;
                if (hasStatusCodeError) {
                    errors.push(error.message);
                    continue;
                }
                const failedPath = path ? `in ${path}` : '.';
                errors.push(`Could not test dependencies ${failedPath}`);
            }
        }
    }
    spinner_1.spinner.clearAll();
    return [results, errors];
}
exports.resolveAndTestFacts = resolveAndTestFacts;


/***/ }),

/***/ 60937:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.selectAndExecuteTestStrategy = exports.testEcosystem = void 0;
const config_1 = __webpack_require__(22541);
const is_ci_1 = __webpack_require__(10090);
const promise_1 = __webpack_require__(90430);
const types_1 = __webpack_require__(55246);
const spinner_1 = __webpack_require__(86766);
const plugins_1 = __webpack_require__(78053);
const common_1 = __webpack_require__(53110);
const api_token_1 = __webpack_require__(95181);
const resolve_test_facts_1 = __webpack_require__(85164);
const common_2 = __webpack_require__(69813);
async function testEcosystem(ecosystem, paths, options) {
    const plugin = plugins_1.getPlugin(ecosystem);
    // TODO: this is an intermediate step before consolidating ecosystem plugins
    // to accept flows that act differently in the testDependencies step
    if (plugin.test) {
        const { readableResult: res, sarifResult: sarifRes } = await plugin.test(paths, options);
        return types_1.TestCommandResult.createHumanReadableTestCommandResult(res, '', sarifRes);
    }
    const scanResultsByPath = {};
    for (const path of paths) {
        await spinner_1.spinner(`Scanning dependencies in ${path}`);
        options.path = path;
        const pluginResponse = await plugin.scan(options);
        scanResultsByPath[path] = pluginResponse.scanResults;
    }
    spinner_1.spinner.clearAll();
    const [testResults, errors] = await selectAndExecuteTestStrategy(ecosystem, scanResultsByPath, options);
    const stringifiedData = JSON.stringify(testResults, null, 2);
    if (options.json) {
        return types_1.TestCommandResult.createJsonTestCommandResult(stringifiedData);
    }
    const emptyResults = [];
    const scanResults = emptyResults.concat(...Object.values(scanResultsByPath));
    const readableResult = await plugin.display(scanResults, testResults, errors, options);
    return types_1.TestCommandResult.createHumanReadableTestCommandResult(readableResult, stringifiedData);
}
exports.testEcosystem = testEcosystem;
async function selectAndExecuteTestStrategy(ecosystem, scanResultsByPath, options) {
    return common_2.isUnmanagedEcosystem(ecosystem)
        ? await resolve_test_facts_1.resolveAndTestFacts(ecosystem, scanResultsByPath, options)
        : await testDependencies(scanResultsByPath, options);
}
exports.selectAndExecuteTestStrategy = selectAndExecuteTestStrategy;
async function testDependencies(scans, options) {
    const results = [];
    const errors = [];
    for (const [path, scanResults] of Object.entries(scans)) {
        await spinner_1.spinner(`Testing dependencies in ${path}`);
        for (const scanResult of scanResults) {
            const payload = {
                method: 'POST',
                url: `${config_1.default.API}/test-dependencies`,
                json: true,
                headers: {
                    'x-is-ci': is_ci_1.isCI(),
                    authorization: api_token_1.getAuthHeader(),
                },
                body: {
                    scanResult,
                },
                qs: common_1.assembleQueryString(options),
            };
            try {
                const response = await promise_1.makeRequest(payload);
                results.push({
                    issues: response.result.issues,
                    issuesData: response.result.issuesData,
                    depGraphData: response.result.depGraphData,
                });
            }
            catch (error) {
                if (error.code >= 400 && error.code < 500) {
                    throw new Error(error.message);
                }
                errors.push('Could not test dependencies in ' + path);
            }
        }
    }
    spinner_1.spinner.clearAll();
    return [results, errors];
}


/***/ }),

/***/ 59369:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.abridgeErrorMessage = void 0;
function abridgeErrorMessage(msg, maxLen, ellipsis = ' ... ') {
    if (msg.length <= maxLen) {
        return msg;
    }
    const toKeep = Math.floor((maxLen - ellipsis.length) / 2);
    return (msg.slice(0, toKeep) + ellipsis + msg.slice(msg.length - toKeep, msg.length));
}
exports.abridgeErrorMessage = abridgeErrorMessage;


/***/ }),

/***/ 86033:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.InvalidRemoteUrlError = void 0;
const custom_error_1 = __webpack_require__(17188);
class InvalidRemoteUrlError extends custom_error_1.CustomError {
    constructor() {
        super(InvalidRemoteUrlError.ERROR_MESSAGE);
    }
}
exports.InvalidRemoteUrlError = InvalidRemoteUrlError;
InvalidRemoteUrlError.ERROR_MESSAGE = 'Invalid argument provided for --remote-repo-url. Value must be a string.';


/***/ }),

/***/ 63011:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.hasFeatureFlag = exports.isFeatureFlagSupportedForOrg = void 0;
const request_1 = __webpack_require__(52050);
const api_token_1 = __webpack_require__(95181);
const config_1 = __webpack_require__(22541);
const common_1 = __webpack_require__(53110);
const errors_1 = __webpack_require__(55191);
async function isFeatureFlagSupportedForOrg(featureFlag, org) {
    const response = await request_1.makeRequest({
        method: 'GET',
        headers: {
            Authorization: api_token_1.getAuthHeader(),
        },
        qs: common_1.assembleQueryString({ org }),
        url: `${config_1.default.API}/cli-config/feature-flags/${featureFlag}`,
        gzip: true,
        json: true,
    });
    return response.body;
}
exports.isFeatureFlagSupportedForOrg = isFeatureFlagSupportedForOrg;
async function hasFeatureFlag(featureFlag, options) {
    const { code, error, ok } = await isFeatureFlagSupportedForOrg(featureFlag, options.org);
    if (code === 401 || code === 403) {
        throw errors_1.AuthFailedError(error, code);
    }
    return ok;
}
exports.hasFeatureFlag = hasFeatureFlag;


/***/ }),

/***/ 46123:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.find = exports.getStats = exports.readDirectory = void 0;
const fs = __webpack_require__(35747);
const pathLib = __webpack_require__(85622);
const sortBy = __webpack_require__(58254);
const groupBy = __webpack_require__(20276);
const detect_1 = __webpack_require__(45318);
const debugModule = __webpack_require__(15158);
const debug = debugModule('snyk:find-files');
// TODO: use util.promisify once we move to node 8
/**
 * Returns files inside given file path.
 *
 * @param path file path.
 */
async function readDirectory(path) {
    return await new Promise((resolve, reject) => {
        fs.readdir(path, (err, files) => {
            if (err) {
                reject(err);
            }
            resolve(files);
        });
    });
}
exports.readDirectory = readDirectory;
/**
 * Returns file stats object for given file path.
 *
 * @param path path to file or directory.
 */
async function getStats(path) {
    return await new Promise((resolve, reject) => {
        fs.stat(path, (err, stats) => {
            if (err) {
                reject(err);
            }
            resolve(stats);
        });
    });
}
exports.getStats = getStats;
/**
 * Find all files in given search path. Returns paths to files found.
 *
 * @param path file path to search.
 * @param ignore (optional) files to ignore. Will always ignore node_modules.
 * @param filter (optional) file names to find. If not provided all files are returned.
 * @param levelsDeep (optional) how many levels deep to search, defaults to two, this path and one sub directory.
 */
async function find(path, ignore = [], filter = [], levelsDeep = 4) {
    const found = [];
    const foundAll = [];
    // ensure we ignore find against node_modules path.
    if (path.endsWith('node_modules')) {
        return { files: found, allFilesFound: foundAll };
    }
    // ensure node_modules is always ignored
    if (!ignore.includes('node_modules')) {
        ignore.push('node_modules');
    }
    try {
        if (levelsDeep < 0) {
            return { files: found, allFilesFound: foundAll };
        }
        else {
            levelsDeep--;
        }
        const fileStats = await getStats(path);
        if (fileStats.isDirectory()) {
            const { files, allFilesFound } = await findInDirectory(path, ignore, filter, levelsDeep);
            found.push(...files);
            foundAll.push(...allFilesFound);
        }
        else if (fileStats.isFile()) {
            const fileFound = findFile(path, filter);
            if (fileFound) {
                found.push(fileFound);
                foundAll.push(fileFound);
            }
        }
        const filteredOutFiles = foundAll.filter((f) => !found.includes(f));
        if (filteredOutFiles.length) {
            debug(`Filtered out ${filteredOutFiles.length}/${foundAll.length} files: ${filteredOutFiles.join(', ')}`);
        }
        return { files: filterForDefaultManifests(found), allFilesFound: foundAll };
    }
    catch (err) {
        throw new Error(`Error finding files in path '${path}'.\n${err.message}`);
    }
}
exports.find = find;
function findFile(path, filter = []) {
    if (filter.length > 0) {
        const filename = pathLib.basename(path);
        if (filter.includes(filename)) {
            return path;
        }
    }
    else {
        return path;
    }
    return null;
}
async function findInDirectory(path, ignore = [], filter = [], levelsDeep = 4) {
    const files = await readDirectory(path);
    const toFind = files
        .filter((file) => !ignore.includes(file))
        .map((file) => {
        const resolvedPath = pathLib.resolve(path, file);
        if (!fs.existsSync(resolvedPath)) {
            debug('File does not seem to exist, skipping: ', file);
            return { files: [], allFilesFound: [] };
        }
        return find(resolvedPath, ignore, filter, levelsDeep);
    });
    const found = await Promise.all(toFind);
    return {
        files: Array.prototype.concat.apply([], found.map((f) => f.files)),
        allFilesFound: Array.prototype.concat.apply([], found.map((f) => f.allFilesFound)),
    };
}
function filterForDefaultManifests(files) {
    // take all the files in the same dir & filter out
    // based on package Manager
    if (files.length <= 1) {
        return files;
    }
    const filteredFiles = [];
    const beforeSort = files
        .filter(Boolean)
        .filter((p) => fs.existsSync(p))
        .map((p) => ({
        path: p,
        ...pathLib.parse(p),
        packageManager: detectProjectTypeFromFile(p),
    }));
    const sorted = sortBy(beforeSort, 'dir');
    const foundFiles = groupBy(sorted, 'dir');
    for (const directory of Object.keys(foundFiles)) {
        const filesInDirectory = foundFiles[directory];
        const beforeGroup = filesInDirectory.filter((p) => !!p.packageManager);
        const groupedFiles = groupBy(beforeGroup, 'packageManager');
        for (const packageManager of Object.keys(groupedFiles)) {
            const filesPerPackageManager = groupedFiles[packageManager];
            if (filesPerPackageManager.length <= 1) {
                const shouldSkip = shouldSkipAddingFile(packageManager, filesPerPackageManager[0].path, filteredFiles);
                if (shouldSkip) {
                    continue;
                }
                filteredFiles.push(filesPerPackageManager[0].path);
                continue;
            }
            const defaultManifestFileName = chooseBestManifest(filesPerPackageManager, packageManager);
            if (defaultManifestFileName) {
                const shouldSkip = shouldSkipAddingFile(packageManager, filesPerPackageManager[0].path, filteredFiles);
                if (shouldSkip) {
                    continue;
                }
                filteredFiles.push(defaultManifestFileName);
            }
        }
    }
    return filteredFiles;
}
function detectProjectTypeFromFile(file) {
    try {
        const packageManager = detect_1.detectPackageManagerFromFile(file);
        if (['yarn', 'npm'].includes(packageManager)) {
            return 'node';
        }
        return packageManager;
    }
    catch (error) {
        return null;
    }
}
function shouldSkipAddingFile(packageManager, filePath, filteredFiles) {
    if (['gradle'].includes(packageManager) && filePath) {
        const rootGradleFile = filteredFiles
            .filter((targetFile) => targetFile.endsWith('build.gradle') ||
            targetFile.endsWith('build.gradle.kts'))
            .filter((targetFile) => {
            const parsedPath = pathLib.parse(targetFile);
            const relativePath = pathLib.relative(parsedPath.dir, filePath);
            return !relativePath.startsWith(`..${pathLib.sep}`);
        });
        return !!rootGradleFile.length;
    }
    return false;
}
function chooseBestManifest(files, projectType) {
    switch (projectType) {
        case 'node': {
            const lockFile = files.filter((path) => ['package-lock.json', 'yarn.lock'].includes(path.base))[0];
            debug(`Encountered multiple node lockfiles files, defaulting to ${lockFile.path}`);
            if (lockFile) {
                return lockFile.path;
            }
            const packageJson = files.filter((path) => ['package.json'].includes(path.base))[0];
            debug(`Encountered multiple npm manifest files, defaulting to ${packageJson.path}`);
            return packageJson.path;
        }
        case 'rubygems': {
            const defaultManifest = files.filter((path) => ['Gemfile.lock'].includes(path.base))[0];
            debug(`Encountered multiple gem manifest files, defaulting to ${defaultManifest.path}`);
            return defaultManifest.path;
        }
        case 'cocoapods': {
            const defaultManifest = files.filter((path) => ['Podfile'].includes(path.base))[0];
            debug(`Encountered multiple cocoapods manifest files, defaulting to ${defaultManifest.path}`);
            return defaultManifest.path;
        }
        case 'pip': {
            const defaultManifest = files.filter((path) => ['Pipfile'].includes(path.base))[0];
            debug(`Encountered multiple pip manifest files, defaulting to ${defaultManifest.path}`);
            return defaultManifest.path;
        }
        case 'gradle': {
            const defaultManifest = files.filter((path) => ['build.gradle'].includes(path.base))[0];
            debug(`Encountered multiple gradle manifest files, defaulting to ${defaultManifest.path}`);
            return defaultManifest.path;
        }
        case 'poetry': {
            const defaultManifest = files.filter((path) => ['pyproject.toml'].includes(path.base))[0];
            debug(`Encountered multiple poetry manifest files, defaulting to ${defaultManifest.path}`);
            return defaultManifest.path;
        }
        case 'hex': {
            const defaultManifest = files.filter((path) => ['mix.exs'].includes(path.base))[0];
            debug(`Encountered multiple hex manifest files, defaulting to ${defaultManifest.path}`);
            return defaultManifest.path;
        }
        default: {
            return null;
        }
    }
}


/***/ }),

/***/ 18362:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.dockerRemediationForDisplay = void 0;
const chalk_1 = __webpack_require__(32589);
function dockerRemediationForDisplay(res) {
    if (!res.docker || !res.docker.baseImageRemediation) {
        return '';
    }
    const { advice, message } = res.docker.baseImageRemediation;
    const out = [];
    if (advice) {
        for (const item of advice) {
            out.push(getTerminalStringFormatter(item)(item.message));
        }
    }
    else if (message) {
        out.push(message);
    }
    else {
        return '';
    }
    return `\n\n${out.join('\n')}`;
}
exports.dockerRemediationForDisplay = dockerRemediationForDisplay;
function getTerminalStringFormatter({ color, bold, }) {
    let formatter = chalk_1.default;
    if (color && formatter[color]) {
        formatter = formatter[color];
    }
    if (bold) {
        formatter = formatter.bold;
    }
    return formatter;
}


/***/ }),

/***/ 4928:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.createDockerBinaryHeading = void 0;
const values = __webpack_require__(17720);
const chalk_1 = __webpack_require__(32589);
function createDockerBinaryHeading(pkgInfo) {
    const binaryName = pkgInfo.pkg.name;
    const binaryVersion = pkgInfo.pkg.version;
    const numOfVulns = values(pkgInfo.issues).length;
    const vulnCountText = numOfVulns > 1 ? 'vulnerabilities' : 'vulnerability';
    return numOfVulns
        ? chalk_1.default.bold.white(`------------ Detected ${numOfVulns} ${vulnCountText}` +
            ` for ${binaryName}@${binaryVersion} ------------`, '\n')
        : '';
}
exports.createDockerBinaryHeading = createDockerBinaryHeading;


/***/ }),

/***/ 80576:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.formatDockerBinariesIssues = void 0;
const values = __webpack_require__(17720);
const format_docker_binary_heading_1 = __webpack_require__(4928);
const legacy_format_issue_1 = __webpack_require__(63540);
function formatDockerBinariesIssues(dockerBinariesSortedGroupedVulns, binariesVulns, options) {
    const binariesIssuesOutput = [];
    for (const pkgInfo of values(binariesVulns.affectedPkgs)) {
        binariesIssuesOutput.push(format_docker_binary_heading_1.createDockerBinaryHeading(pkgInfo));
        const binaryIssues = dockerBinariesSortedGroupedVulns.filter((vuln) => vuln.metadata.name === pkgInfo.pkg.name);
        const formattedBinaryIssues = binaryIssues.map((vuln) => legacy_format_issue_1.formatIssues(vuln, options));
        binariesIssuesOutput.push(formattedBinaryIssues.join('\n\n'));
    }
    return binariesIssuesOutput;
}
exports.formatDockerBinariesIssues = formatDockerBinariesIssues;


/***/ }),

/***/ 41287:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var format_docker_advice_1 = __webpack_require__(18362);
Object.defineProperty(exports, "dockerRemediationForDisplay", ({ enumerable: true, get: function () { return format_docker_advice_1.dockerRemediationForDisplay; } }));
var format_docker_binary_issues_1 = __webpack_require__(80576);
Object.defineProperty(exports, "formatDockerBinariesIssues", ({ enumerable: true, get: function () { return format_docker_binary_issues_1.formatDockerBinariesIssues; } }));
var format_docker_binary_heading_1 = __webpack_require__(4928);
Object.defineProperty(exports, "createDockerBinaryHeading", ({ enumerable: true, get: function () { return format_docker_binary_heading_1.createDockerBinaryHeading; } }));


/***/ }),

/***/ 13232:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.summariseErrorResults = void 0;
const errors_1 = __webpack_require__(55191);
function summariseErrorResults(errorResultsLength) {
    const projects = errorResultsLength > 1 ? 'projects' : 'project';
    if (errorResultsLength > 0) {
        return errors_1.errorMessageWithRetry(` Failed to test ${errorResultsLength} ${projects}.`);
    }
    return '';
}
exports.summariseErrorResults = summariseErrorResults;


/***/ }),

/***/ 4040:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.formatMonitorOutput = exports.formatErrorMonitorOutput = void 0;
const assign = __webpack_require__(31730);
const chalk_1 = __webpack_require__(32589);
const url = __webpack_require__(78835);
const config_1 = __webpack_require__(22541);
const show_multi_scan_tip_1 = __webpack_require__(95100);
function formatErrorMonitorOutput(packageManager, res, options, projectName) {
    const humanReadableName = projectName
        ? `${res.path} (${projectName})`
        : res.path;
    const strOutput = chalk_1.default.bold.white('\nMonitoring ' + humanReadableName + '...\n\n') +
        '\n\n' +
        (packageManager === 'maven'
            ? chalk_1.default.yellow('Detected 0 dependencies (no project created)')
            : '');
    return options.json
        ? JSON.stringify(assign({}, res, {
            packageManager,
        }))
        : strOutput;
}
exports.formatErrorMonitorOutput = formatErrorMonitorOutput;
function formatMonitorOutput(packageManager, res, options, projectName, foundProjectCount) {
    const manageUrl = buildManageUrl(res.id, res.org);
    const multiScanTip = show_multi_scan_tip_1.showMultiScanTip(packageManager, options, foundProjectCount);
    const issues = res.licensesPolicy ? 'issues' : 'vulnerabilities';
    const humanReadableName = projectName
        ? `${res.path} (${projectName})`
        : res.path;
    const strOutput = chalk_1.default.bold.white('\nMonitoring ' + humanReadableName + '...\n\n') +
        'Explore this snapshot at ' +
        res.uri +
        '\n\n' +
        (multiScanTip ? `${multiScanTip}\n\n` : '') +
        (res.isMonitored
            ? 'Notifications about newly disclosed ' +
                issues +
                ' related ' +
                'to these dependencies will be emailed to you.\n'
            : chalk_1.default.bold.red('Project is inactive, so notifications are turned ' +
                'off.\nActivate this project here: ' +
                manageUrl +
                '\n\n')) +
        (res.trialStarted
            ? chalk_1.default.yellow("You're over the free plan usage limit, \n" +
                'and are now on a free 14-day premium trial.\n' +
                'View plans here: ' +
                manageUrl +
                '\n\n')
            : '');
    return options.json
        ? JSON.stringify(assign({}, res, {
            manageUrl,
            packageManager,
        }))
        : strOutput;
}
exports.formatMonitorOutput = formatMonitorOutput;
function buildManageUrl(resId, org) {
    const endpoint = url.parse(config_1.default.API);
    let leader = '';
    if (org) {
        leader = '/org/' + org;
    }
    endpoint.pathname = leader + '/manage';
    const manageUrl = url.format(endpoint);
    // TODO: what was this meant to do?
    endpoint.pathname = leader + '/monitor/' + resId;
    return manageUrl;
}


/***/ }),

/***/ 13331:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.formatReachablePath = exports.formatReachablePaths = exports.summariseReachableVulns = exports.getReachabilityJson = exports.getReachabilityText = exports.formatReachability = void 0;
const wrap = __webpack_require__(88152);
const chalk_1 = __webpack_require__(32589);
const legacy_1 = __webpack_require__(34013);
const constants_1 = __webpack_require__(65623);
const reachabilityLevels = {
    [legacy_1.REACHABILITY.FUNCTION]: {
        color: chalk_1.default.redBright,
        text: 'Reachable',
        json: 'reachable',
    },
    [legacy_1.REACHABILITY.PACKAGE]: {
        color: chalk_1.default.yellow,
        text: 'Potentially reachable',
        json: 'potentially-reachable',
    },
    [legacy_1.REACHABILITY.NOT_REACHABLE]: {
        color: chalk_1.default.blueBright,
        text: 'Not reachable',
        json: 'not-reachable',
    },
    [legacy_1.REACHABILITY.NO_INFO]: {
        color: (str) => str,
        text: '',
        json: 'no-path-found',
    },
};
function formatReachability(reachability) {
    if (!reachability) {
        return '';
    }
    const reachableInfo = reachabilityLevels[reachability];
    const textFunc = reachableInfo ? reachableInfo.color : (str) => str;
    const text = reachableInfo && reachableInfo.text ? `[${reachableInfo.text}]` : '';
    return wrap(textFunc(text), 100);
}
exports.formatReachability = formatReachability;
function getReachabilityText(reachability) {
    if (!reachability) {
        return '';
    }
    const reachableInfo = reachabilityLevels[reachability];
    return reachableInfo ? reachableInfo.text : '';
}
exports.getReachabilityText = getReachabilityText;
function getReachabilityJson(reachability) {
    if (!reachability) {
        return '';
    }
    const reachableInfo = reachabilityLevels[reachability];
    return reachableInfo ? reachableInfo.json : '';
}
exports.getReachabilityJson = getReachabilityJson;
function summariseReachableVulns(vulnerabilities) {
    const reachableVulnsCount = vulnerabilities.filter((v) => v.reachability === legacy_1.REACHABILITY.FUNCTION).length;
    if (reachableVulnsCount > 0) {
        const vulnText = reachableVulnsCount === 1 ? 'vulnerability' : 'vulnerabilities';
        return `In addition, found ${reachableVulnsCount} ${vulnText} with a reachable path.`;
    }
    return '';
}
exports.summariseReachableVulns = summariseReachableVulns;
function getDistinctReachablePaths(reachablePaths, maxPathCount) {
    const uniquePaths = new Set();
    for (const path of reachablePaths) {
        if (uniquePaths.size >= maxPathCount) {
            break;
        }
        uniquePaths.add(formatReachablePath(path));
    }
    return Array.from(uniquePaths.values());
}
function formatReachablePaths(sampleReachablePaths, maxPathCount, template) {
    const paths = (sampleReachablePaths === null || sampleReachablePaths === void 0 ? void 0 : sampleReachablePaths.paths) || [];
    const pathCount = (sampleReachablePaths === null || sampleReachablePaths === void 0 ? void 0 : sampleReachablePaths.pathCount) || 0;
    const distinctPaths = getDistinctReachablePaths(paths, maxPathCount);
    const extraPaths = pathCount - distinctPaths.length;
    return template(distinctPaths, extraPaths);
}
exports.formatReachablePaths = formatReachablePaths;
function formatReachablePath(path) {
    const head = path.slice(0, constants_1.CALL_PATH_LEADING_ELEMENTS).join(constants_1.PATH_SEPARATOR);
    const tail = path
        .slice(path.length - constants_1.CALL_PATH_TRAILING_ELEMENTS, path.length)
        .join(constants_1.PATH_SEPARATOR);
    return `${head}${constants_1.PATH_SEPARATOR}${constants_1.PATH_HIDDEN_ELEMENTS}${constants_1.PATH_SEPARATOR}${tail}`;
}
exports.formatReachablePath = formatReachablePath;


/***/ }),

/***/ 28001:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.formatTestMeta = void 0;
const chalk_1 = __webpack_require__(32589);
const right_pad_1 = __webpack_require__(80627);
const iac_output_1 = __webpack_require__(68145);
function formatTestMeta(res, options) {
    const padToLength = 19; // chars to align
    const packageManager = res.packageManager || options.packageManager;
    const targetFile = res.targetFile || res.displayTargetFile || options.file;
    const openSource = res.isPrivate ? 'no' : 'yes';
    const meta = res.org
        ? [chalk_1.default.bold(right_pad_1.rightPadWithSpaces('Organization: ', padToLength)) + res.org]
        : [];
    if (options.iac) {
        meta.push(chalk_1.default.bold(right_pad_1.rightPadWithSpaces('Type: ', padToLength)) +
            iac_output_1.capitalizePackageManager(packageManager));
    }
    else {
        meta.push(chalk_1.default.bold(right_pad_1.rightPadWithSpaces('Package manager: ', padToLength)) +
            packageManager);
    }
    if (targetFile) {
        meta.push(chalk_1.default.bold(right_pad_1.rightPadWithSpaces('Target file: ', padToLength)) + targetFile);
    }
    if (res.projectName) {
        meta.push(chalk_1.default.bold(right_pad_1.rightPadWithSpaces('Project name: ', padToLength)) +
            res.projectName);
    }
    if (options.docker) {
        meta.push(chalk_1.default.bold(right_pad_1.rightPadWithSpaces('Docker image: ', padToLength)) +
            options.path);
        if (res.platform) {
            meta.push(chalk_1.default.bold(right_pad_1.rightPadWithSpaces('Platform: ', padToLength)) +
                res.platform);
        }
    }
    else {
        meta.push(chalk_1.default.bold(right_pad_1.rightPadWithSpaces('Open source: ', padToLength)) + openSource);
        meta.push(chalk_1.default.bold(right_pad_1.rightPadWithSpaces('Project path: ', padToLength)) +
            options.path);
    }
    if (res.payloadType !== 'k8sconfig') {
        const legacyRes = res;
        if (legacyRes.docker && legacyRes.docker.baseImage) {
            meta.push(chalk_1.default.bold(right_pad_1.rightPadWithSpaces('Base image: ', padToLength)) +
                legacyRes.docker.baseImage);
        }
        if (legacyRes.filesystemPolicy) {
            meta.push(chalk_1.default.bold(right_pad_1.rightPadWithSpaces('Local Snyk policy: ', padToLength)) +
                chalk_1.default.green('found'));
            if (legacyRes.ignoreSettings &&
                legacyRes.ignoreSettings.disregardFilesystemIgnores) {
                meta.push(chalk_1.default.bold(right_pad_1.rightPadWithSpaces('Local Snyk policy ignored: ', padToLength)) + chalk_1.default.red('yes'));
            }
        }
        if (legacyRes.licensesPolicy) {
            meta.push(chalk_1.default.bold(right_pad_1.rightPadWithSpaces('Licenses: ', padToLength)) +
                chalk_1.default.green('enabled'));
        }
    }
    return meta.join('\n');
}
exports.formatTestMeta = formatTestMeta;


/***/ }),

/***/ 27495:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.summariseVulnerableResults = void 0;
function summariseVulnerableResults(vulnerableResults, options) {
    const vulnsLength = vulnerableResults.length;
    if (vulnsLength) {
        if (options.showVulnPaths) {
            return `, ${vulnsLength} contained ${options.iac ? 'issues' : 'vulnerable paths'}.`;
        }
        return `, ${vulnsLength} had issues.`;
    }
    if (options.showVulnPaths) {
        return ', no vulnerable paths were found.';
    }
    return ', no issues were found.';
}
exports.summariseVulnerableResults = summariseVulnerableResults;


/***/ }),

/***/ 24898:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.getSeverityValue = void 0;
const common_1 = __webpack_require__(53110);
function getSeverityValue(severity) {
    return common_1.SEVERITIES.find((s) => s.verboseName === severity).value;
}
exports.getSeverityValue = getSeverityValue;


/***/ }),

/***/ 68145:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.getIacDisplayErrorFileOutput = exports.getIacDisplayedOutput = void 0;
const v1 = __webpack_require__(7666);
const v2 = __webpack_require__(49041);
function getIacDisplayedOutput(iacTest, testedInfoText, meta, prefix, isNewIacOutputSupported) {
    return isNewIacOutputSupported
        ? v2.getIacDisplayedOutput(iacTest, testedInfoText, meta, prefix)
        : v1.getIacDisplayedOutput(iacTest, testedInfoText, meta, prefix);
}
exports.getIacDisplayedOutput = getIacDisplayedOutput;
function getIacDisplayErrorFileOutput(iacFileResult, isNewIacOutputSupported) {
    return isNewIacOutputSupported
        ? v2.getIacDisplayErrorFileOutput(iacFileResult)
        : v1.getIacDisplayErrorFileOutput(iacFileResult);
}
exports.getIacDisplayErrorFileOutput = getIacDisplayErrorFileOutput;
var v1_1 = __webpack_require__(7666);
Object.defineProperty(exports, "capitalizePackageManager", ({ enumerable: true, get: function () { return v1_1.capitalizePackageManager; } }));
Object.defineProperty(exports, "createSarifOutputForIac", ({ enumerable: true, get: function () { return v1_1.createSarifOutputForIac; } }));
Object.defineProperty(exports, "shareResultsOutput", ({ enumerable: true, get: function () { return v1_1.shareResultsOutput; } }));


/***/ }),

/***/ 7666:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.shareResultsOutput = exports.mapIacTestResponseToSarifResults = exports.extractReportingDescriptor = exports.createSarifOutputForIac = exports.capitalizePackageManager = exports.getIacDisplayErrorFileOutput = exports.getIacDisplayedOutput = void 0;
const chalk_1 = __webpack_require__(32589);
const theme_1 = __webpack_require__(86988);
const Debug = __webpack_require__(15158);
const pathLib = __webpack_require__(85622);
const url_1 = __webpack_require__(78835);
const upperFirst = __webpack_require__(90039);
const camelCase = __webpack_require__(76884);
const child_process_1 = __webpack_require__(63129);
const remediation_based_format_issues_1 = __webpack_require__(57995);
const legacy_format_issue_1 = __webpack_require__(63540);
const common_1 = __webpack_require__(53110);
const detect_1 = __webpack_require__(45318);
const get_severity_value_1 = __webpack_require__(24898);
const sarif_output_1 = __webpack_require__(5034);
const version_1 = __webpack_require__(38217);
const config_1 = __webpack_require__(22541);
const debug = Debug('iac-output');
function formatIacIssue(issue, isNew, path) {
    const newBadge = isNew ? ' (new)' : '';
    const name = issue.subType ? ` in ${chalk_1.default.bold(issue.subType)}` : '';
    let introducedBy = '';
    if (path) {
        // In this mode, we show only one path by default, for compactness
        const pathStr = remediation_based_format_issues_1.printPath(path, 0);
        introducedBy = `\n    introduced by ${pathStr}`;
    }
    return (common_1.colorTextBySeverity(issue.severity, `  ${theme_1.icon.ISSUE} ${chalk_1.default.bold(issue.title)}${newBadge} [${legacy_format_issue_1.titleCaseText(issue.severity)} Severity]`) +
        ` [${issue.id}]` +
        name +
        introducedBy +
        '\n');
}
function getIacDisplayedOutput(iacTest, testedInfoText, meta, prefix) {
    const issuesTextArray = [
        chalk_1.default.bold.white('\nInfrastructure as code issues:'),
    ];
    const NotNew = false;
    const issues = iacTest.result.cloudConfigResults;
    debug(`iac display output - ${issues.length} issues`);
    issues
        .sort((a, b) => get_severity_value_1.getSeverityValue(b.severity) - get_severity_value_1.getSeverityValue(a.severity))
        .forEach((issue) => {
        issuesTextArray.push(formatIacIssue(issue, NotNew, issue.cloudConfigPath));
    });
    const issuesInfoOutput = [];
    debug(`Iac display output - ${issuesTextArray.length} issues text`);
    if (issuesTextArray.length > 0) {
        issuesInfoOutput.push(issuesTextArray.join('\n'));
    }
    let body = issuesInfoOutput.join('\n\n') + '\n\n' + meta;
    const vulnCountText = `found ${issues.length} issues`;
    const summary = testedInfoText + ', ' + chalk_1.default.red.bold(vulnCountText);
    body = body + '\n\n' + summary;
    return prefix + body;
}
exports.getIacDisplayedOutput = getIacDisplayedOutput;
function getIacDisplayErrorFileOutput(iacFileResult) {
    const fileName = pathLib.basename(iacFileResult.filePath);
    return `

-------------------------------------------------------

Testing ${fileName}...

${iacFileResult.failureReason}`;
}
exports.getIacDisplayErrorFileOutput = getIacDisplayErrorFileOutput;
function capitalizePackageManager(type) {
    switch (type) {
        case 'k8sconfig': {
            return 'Kubernetes';
        }
        case 'helmconfig': {
            return 'Helm';
        }
        case 'terraformconfig': {
            return 'Terraform';
        }
        case 'cloudformationconfig': {
            return 'CloudFormation';
        }
        case 'armconfig': {
            return 'ARM';
        }
        default: {
            return 'Infrastructure as Code';
        }
    }
}
exports.capitalizePackageManager = capitalizePackageManager;
// Used to reference the base path in results.
const PROJECT_ROOT_KEY = 'PROJECTROOT';
function createSarifOutputForIac(iacTestResponses) {
    // If the CLI scans a singular file, then the base path is the current working directory
    // Otherwise it's the computed path
    const basePath = detect_1.isLocalFolder(iacTestResponses[0].path)
        ? pathLib.resolve('.', iacTestResponses[0].path)
        : pathLib.resolve('.');
    const repoRoot = getRepoRoot(basePath);
    const issues = iacTestResponses.reduce((collect, res) => {
        if (res.result) {
            // targetFile is the computed relative path of the scanned file
            // so needs to be cleaned up before assigning to the URI
            const targetPath = getPathRelativeToRepoRoot(repoRoot, basePath, res.targetFile);
            const mapped = res.result.cloudConfigResults.map((issue) => ({
                issue,
                targetPath,
            }));
            collect.push(...mapped);
        }
        return collect;
    }, []);
    const tool = {
        driver: {
            name: 'Snyk IaC',
            fullName: 'Snyk Infrastructure as Code',
            version: version_1.getVersion(),
            informationUri: 'https://docs.snyk.io/products/snyk-infrastructure-as-code',
            rules: extractReportingDescriptor(issues),
        },
    };
    return {
        $schema: 'https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json',
        version: '2.1.0',
        runs: [
            {
                // https://docs.oasis-open.org/sarif/sarif/v2.1.0/os/sarif-v2.1.0-os.html#_Toc34317498
                originalUriBaseIds: {
                    [PROJECT_ROOT_KEY]: {
                        uri: url_1.pathToFileURL(repoRoot).href,
                        description: {
                            text: 'The root directory for all project files.',
                        },
                    },
                },
                tool,
                automationDetails: {
                    id: 'snyk-iac',
                },
                results: mapIacTestResponseToSarifResults(issues),
            },
        ],
    };
}
exports.createSarifOutputForIac = createSarifOutputForIac;
function extractReportingDescriptor(results) {
    const tool = {};
    results.forEach(({ issue }) => {
        if (tool[issue.id]) {
            return;
        }
        // custom rules may not have some of these fields so we check them first
        const fullDescriptionText = issue.subType
            ? `${upperFirst(issue.severity)} severity - ${issue.subType}`
            : `${upperFirst(issue.severity)} severity`;
        const issueText = issue.iacDescription.issue
            ? `The issue is... \n${issue.iacDescription.issue}\n\n`
            : '';
        const issueMarkdown = issue.iacDescription.issue
            ? `**The issue is...** \n${issue.iacDescription.issue}\n\n`
            : '';
        const impactText = issue.iacDescription.impact
            ? ` The impact of this is... \n ${issue.iacDescription.impact}\n\n`
            : '';
        const impactMarkdown = issue.iacDescription.impact
            ? ` **The impact of this is...** \n ${issue.iacDescription.impact}\n\n`
            : '';
        const resolveText = issue.iacDescription.resolve
            ? ` You can resolve this by... \n${issue.iacDescription.resolve}`
            : '';
        const resolveMarkdown = issue.iacDescription.resolve
            ? ` **You can resolve this by...** \n${issue.iacDescription.resolve}`
            : '';
        const tags = ['security'];
        if (issue.subType) {
            tags.push(issue.subType);
        }
        tool[issue.id] = {
            id: issue.id,
            name: upperFirst(camelCase(issue.title)).replace(/ /g, ''),
            shortDescription: {
                text: `${upperFirst(issue.severity)} severity - ${issue.title}`,
            },
            fullDescription: {
                text: fullDescriptionText,
            },
            help: {
                text: `${issueText}${impactText}${resolveText}`.replace(/^\s+/g, ''),
                markdown: `${issueMarkdown}${impactMarkdown}${resolveMarkdown}`.replace(/^\s+/g, ''),
            },
            defaultConfiguration: {
                level: sarif_output_1.getIssueLevel(issue.severity),
            },
            properties: {
                tags,
                problem: {
                    severity: issue.severity,
                },
            },
            helpUri: issue.documentation,
        };
    });
    return Object.values(tool);
}
exports.extractReportingDescriptor = extractReportingDescriptor;
function mapIacTestResponseToSarifResults(issues) {
    return issues.map(({ targetPath, issue }) => {
        const hasLineNumber = issue.lineNumber && issue.lineNumber >= 0;
        // custom rules may not have some of these fields so we check them first
        const affectingText = issue.subType
            ? ` affecting the ${issue.subType}`
            : '';
        return {
            ruleId: issue.id,
            message: {
                text: `This line contains a potential ${issue.severity} severity misconfiguration${affectingText}`,
            },
            locations: [
                {
                    physicalLocation: {
                        artifactLocation: {
                            uri: targetPath,
                            uriBaseId: PROJECT_ROOT_KEY,
                        },
                        // We exclude the `region` key when the line number is missing or -1.
                        // https://docs.oasis-open.org/sarif/sarif/v2.0/csprd02/sarif-v2.0-csprd02.html#_Toc10127873
                        ...(hasLineNumber && {
                            region: {
                                startLine: issue.lineNumber,
                            },
                        }),
                    },
                },
            ],
        };
    });
}
exports.mapIacTestResponseToSarifResults = mapIacTestResponseToSarifResults;
function getRepoRoot(basePath) {
    try {
        const cwd = process.cwd();
        const stdout = child_process_1.execSync('git rev-parse --show-toplevel', {
            encoding: 'utf8',
            cwd,
        });
        return stdout.trim() + '/';
    }
    catch {
        return basePath;
    }
}
function getPathRelativeToRepoRoot(repoRoot, basePath, filePath) {
    const fullPath = pathLib.resolve(basePath, filePath).replace(/\\/g, '/');
    return fullPath.replace(repoRoot, '');
}
function shareResultsOutput(iacOutputMeta) {
    let projectName = iacOutputMeta.projectName;
    if (iacOutputMeta === null || iacOutputMeta === void 0 ? void 0 : iacOutputMeta.gitRemoteUrl) {
        // from "http://github.com/snyk/cli.git" to "snyk/cli"
        projectName = iacOutputMeta.gitRemoteUrl.replace(/^https?:\/\/github.com\/(.*)\.git$/, '$1');
    }
    return `Your test results are available at: ${config_1.default.ROOT}/org/${iacOutputMeta.orgName}/projects under the name ${projectName}`;
}
exports.shareResultsOutput = shareResultsOutput;


/***/ }),

/***/ 49041:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.getIacDisplayErrorFileOutput = exports.getIacDisplayedOutput = void 0;
const chalk_1 = __webpack_require__(32589);
const theme_1 = __webpack_require__(86988);
const Debug = __webpack_require__(15158);
const pathLib = __webpack_require__(85622);
const remediation_based_format_issues_1 = __webpack_require__(57995);
const legacy_format_issue_1 = __webpack_require__(63540);
const common_1 = __webpack_require__(53110);
const get_severity_value_1 = __webpack_require__(24898);
const debug = Debug('iac-output');
function formatIacIssue(issue, isNew, path) {
    const newBadge = isNew ? ' (new)' : '';
    const name = issue.subType ? ` in ${chalk_1.default.bold(issue.subType)}` : '';
    let introducedBy = '';
    if (path) {
        // In this mode, we show only one path by default, for compactness
        const pathStr = remediation_based_format_issues_1.printPath(path, 0);
        introducedBy = `\n    introduced by ${pathStr}`;
    }
    return (common_1.colorTextBySeverity(issue.severity, `  ${theme_1.icon.ISSUE} ${chalk_1.default.bold(issue.title)}${newBadge} [${legacy_format_issue_1.titleCaseText(issue.severity)} Severity]`) +
        ` [${issue.id}]` +
        name +
        introducedBy +
        '\n');
}
function getIacDisplayedOutput(iacTest, testedInfoText, meta, prefix) {
    const issuesTextArray = [
        chalk_1.default.bold.white('\nInfrastructure as code issues:'),
    ];
    const NotNew = false;
    const issues = iacTest.result.cloudConfigResults;
    debug(`iac display output - ${issues.length} issues`);
    issues
        .sort((a, b) => get_severity_value_1.getSeverityValue(b.severity) - get_severity_value_1.getSeverityValue(a.severity))
        .forEach((issue) => {
        issuesTextArray.push(formatIacIssue(issue, NotNew, issue.cloudConfigPath));
    });
    const issuesInfoOutput = [];
    debug(`Iac display output - ${issuesTextArray.length} issues text`);
    if (issuesTextArray.length > 0) {
        issuesInfoOutput.push(issuesTextArray.join('\n'));
    }
    let body = issuesInfoOutput.join('\n\n') + '\n\n' + meta;
    const vulnCountText = `found ${issues.length} issues`;
    const summary = testedInfoText + ', ' + chalk_1.default.red.bold(vulnCountText);
    body = body + '\n\n' + summary;
    return prefix + body;
}
exports.getIacDisplayedOutput = getIacDisplayedOutput;
function getIacDisplayErrorFileOutput(iacFileResult) {
    const fileName = pathLib.basename(iacFileResult.filePath);
    return `

-------------------------------------------------------

Testing ${fileName}...

${iacFileResult.failureReason}`;
}
exports.getIacDisplayErrorFileOutput = getIacDisplayErrorFileOutput;


/***/ }),

/***/ 81329:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !exports.hasOwnProperty(p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
var format_test_meta_1 = __webpack_require__(28001);
Object.defineProperty(exports, "formatTestMeta", ({ enumerable: true, get: function () { return format_test_meta_1.formatTestMeta; } }));
var format_vulnerable_result_summary_1 = __webpack_require__(27495);
Object.defineProperty(exports, "summariseVulnerableResults", ({ enumerable: true, get: function () { return format_vulnerable_result_summary_1.summariseVulnerableResults; } }));
var format_error_result_summary_1 = __webpack_require__(13232);
Object.defineProperty(exports, "summariseErrorResults", ({ enumerable: true, get: function () { return format_error_result_summary_1.summariseErrorResults; } }));
var legacy_format_issue_1 = __webpack_require__(63540);
Object.defineProperty(exports, "formatIssues", ({ enumerable: true, get: function () { return legacy_format_issue_1.formatIssues; } }));
var legal_license_instructions_1 = __webpack_require__(48049);
Object.defineProperty(exports, "formatLegalInstructions", ({ enumerable: true, get: function () { return legal_license_instructions_1.formatLegalInstructions; } }));
var remediation_based_format_issues_1 = __webpack_require__(57995);
Object.defineProperty(exports, "formatIssuesWithRemediation", ({ enumerable: true, get: function () { return remediation_based_format_issues_1.formatIssuesWithRemediation; } }));
var format_reachability_1 = __webpack_require__(13331);
Object.defineProperty(exports, "summariseReachableVulns", ({ enumerable: true, get: function () { return format_reachability_1.summariseReachableVulns; } }));
var format_monitor_response_1 = __webpack_require__(4040);
Object.defineProperty(exports, "formatErrorMonitorOutput", ({ enumerable: true, get: function () { return format_monitor_response_1.formatErrorMonitorOutput; } }));
Object.defineProperty(exports, "formatMonitorOutput", ({ enumerable: true, get: function () { return format_monitor_response_1.formatMonitorOutput; } }));
__exportStar(__webpack_require__(41287), exports);


/***/ }),

/***/ 63540:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.titleCaseText = exports.formatIssues = void 0;
const uniq = __webpack_require__(97644);
const chalk_1 = __webpack_require__(32589);
const config_1 = __webpack_require__(22541);
const detect_1 = __webpack_require__(45318);
const snyk_module_1 = __webpack_require__(60390);
const package_managers_1 = __webpack_require__(53847);
const legal_license_instructions_1 = __webpack_require__(48049);
const format_reachability_1 = __webpack_require__(13331);
const common_1 = __webpack_require__(53110);
const constants_1 = __webpack_require__(65623);
function formatIssues(vuln, options) {
    const vulnID = vuln.list[0].id;
    const packageManager = options.packageManager;
    const localPackageTest = detect_1.isLocalFolder(options.path);
    const uniquePackages = uniq(vuln.list.map((i) => {
        if (i.from[1]) {
            return i.from && i.from[1];
        }
        return i.from;
    })).join(', ');
    const vulnOutput = {
        issueHeading: createSeverityBasedIssueHeading({
            severity: vuln.metadata.severity,
            originalSeverity: vuln.originalSeverity,
            type: vuln.metadata.type,
            packageName: vuln.metadata.name,
            isNew: false,
        }),
        introducedThrough: '  Introduced through: ' + uniquePackages,
        description: '  Description: ' + vuln.title,
        info: '  Info: ' + chalk_1.default.underline(config_1.default.ROOT + '/vuln/' + vulnID),
        fromPaths: createTruncatedVulnsPathsText(vuln.list, options.showVulnPaths),
        extraInfo: vuln.note ? chalk_1.default.bold('\n  Note: ' + vuln.note) : '',
        remediationInfo: vuln.metadata.type !== 'license' && localPackageTest
            ? createRemediationText(vuln, packageManager)
            : '',
        fixedIn: options.docker ? createFixedInText(vuln) : '',
        dockerfilePackage: options.docker ? dockerfileInstructionText(vuln) : '',
        legalInstructions: vuln.legalInstructionsArray
            ? chalk_1.default.bold('\n  Legal instructions:\n') +
                ' '.repeat(2) +
                legal_license_instructions_1.formatLegalInstructions(vuln.legalInstructionsArray, 2)
            : '',
        reachability: vuln.reachability ? createReachabilityInText(vuln) : '',
    };
    return (`${vulnOutput.issueHeading}\n` +
        `${vulnOutput.description}\n` +
        `${vulnOutput.info}\n` +
        `${vulnOutput.introducedThrough}\n` +
        vulnOutput.fromPaths +
        // Optional - not always there
        vulnOutput.reachability +
        vulnOutput.remediationInfo +
        vulnOutput.dockerfilePackage +
        vulnOutput.fixedIn +
        vulnOutput.extraInfo +
        vulnOutput.legalInstructions);
}
exports.formatIssues = formatIssues;
function createSeverityBasedIssueHeading({ severity, originalSeverity, type, packageName, isNew, }) {
    // Example: ✗ Medium severity vulnerability found in xmldom
    const vulnTypeText = type === 'license' ? 'issue' : 'vulnerability';
    let originalSeverityStr = '';
    if (originalSeverity && originalSeverity !== severity) {
        originalSeverityStr = ` (originally ${titleCaseText(originalSeverity)})`;
    }
    return (common_1.colorTextBySeverity(severity, '✗ ' +
        titleCaseText(severity) +
        ` severity${originalSeverityStr} ` +
        vulnTypeText +
        ' found in ' +
        chalk_1.default.underline(packageName)) + chalk_1.default.bold.magenta(isNew ? ' (new)' : ''));
}
function titleCaseText(text) {
    return text[0].toUpperCase() + text.slice(1);
}
exports.titleCaseText = titleCaseText;
function dockerfileInstructionText(vuln) {
    if (vuln.dockerfileInstruction) {
        JSON.stringify(vuln.dockerfileInstruction);
        return `\n  Image layer: '${vuln.dockerfileInstruction}'`;
    }
    if (vuln.dockerBaseImage) {
        return `\n  Image layer: Introduced by your base image (${vuln.dockerBaseImage})`;
    }
    return '';
}
function createTruncatedVulnsPathsText(vulnList, show) {
    if (show === 'none') {
        return '';
    }
    const numberOfPathsToDisplay = show === 'all' ? 1000 : 3;
    const fromPathsArray = vulnList.map((i) => i.from);
    const formatedFromPathsArray = fromPathsArray.map((i) => {
        const fromWithoutBaseProject = i.slice(1);
        // If more than one From path
        if (fromWithoutBaseProject.length) {
            return i.slice(1).join(constants_1.PATH_SEPARATOR);
        }
        // Else issue is in the core package
        return i;
    });
    const notShownPathsNumber = fromPathsArray.length - numberOfPathsToDisplay;
    const shouldTruncatePaths = fromPathsArray.length > numberOfPathsToDisplay;
    const truncatedText = `\n  and ${notShownPathsNumber} more...`;
    const formattedPathsText = formatedFromPathsArray
        .slice(0, numberOfPathsToDisplay)
        .join('\n  From: ');
    if (fromPathsArray.length > 0) {
        return ('  From: ' +
            formattedPathsText +
            (shouldTruncatePaths ? truncatedText : ''));
    }
}
function createFixedInText(vuln) {
    if (vuln.nearestFixedInVersion) {
        return chalk_1.default.bold('\n  Fixed in: ' + vuln.nearestFixedInVersion);
    }
    else if (vuln.fixedIn && vuln.fixedIn.length > 0) {
        return chalk_1.default.bold('\n  Fixed in: ' + vuln.fixedIn.join(', '));
    }
    return '';
}
function createReachabilityInText(vuln) {
    if (!vuln.reachability) {
        return '';
    }
    const reachabilityText = format_reachability_1.getReachabilityText(vuln.reachability);
    if (!reachabilityText) {
        return '';
    }
    return `\n  Reachability: ${reachabilityText}`;
}
function createRemediationText(vuln, packageManager) {
    if (vuln.fixedIn &&
        package_managers_1.PINNING_SUPPORTED_PACKAGE_MANAGERS.includes(packageManager)) {
        const toVersion = vuln.fixedIn.join(' or ');
        const transitive = vuln.list.every((i) => i.from.length > 2);
        const fromVersionArray = vuln.list.map((v) => v.from[1]);
        const fromVersion = fromVersionArray[0];
        if (transitive) {
            return chalk_1.default.bold(`\n  Remediation:\n    Pin the transitive dependency ${vuln.name} to version ${toVersion}`);
        }
        else {
            return chalk_1.default.bold(`\n  Remediation:\n    Upgrade direct dependency ${fromVersion} to ${vuln.name}@${toVersion}`);
        }
    }
    if (vuln.isFixable === true) {
        const upgradePathsArray = uniq(vuln.list.map((v) => {
            const shouldUpgradeItself = !!v.upgradePath[0];
            const shouldUpgradeDirectDep = !!v.upgradePath[1];
            if (shouldUpgradeItself) {
                // If we are testing a library/package like express
                // Then we can suggest they get the latest version
                // Example command: snyk test express@3
                const selfUpgradeInfo = v.upgradePath.length > 0
                    ? ` (triggers upgrades to ${v.upgradePath.join(constants_1.PATH_SEPARATOR)})`
                    : '';
                const testedPackageName = snyk_module_1.parsePackageString(v.upgradePath[0]);
                return (`You've tested an outdated version of ${testedPackageName[0]}.` +
                    +` Upgrade to ${v.upgradePath[0]}${selfUpgradeInfo}`);
            }
            if (shouldUpgradeDirectDep) {
                const formattedUpgradePath = v.upgradePath
                    .slice(1)
                    .join(constants_1.PATH_SEPARATOR);
                const upgradeTextInfo = v.upgradePath.length
                    ? ` (triggers upgrades to ${formattedUpgradePath})`
                    : '';
                return `Upgrade direct dependency ${v.from[1]} to ${v.upgradePath[1]}${upgradeTextInfo}`;
            }
            return 'Some paths have no direct dependency upgrade that can address this issue.';
        }));
        return chalk_1.default.bold(`\n  Remediation:\n    ${upgradePathsArray.join('\n    ')}`);
    }
    if (vuln.fixedIn && vuln.fixedIn.length > 0) {
        return createFixedInText(vuln);
    }
    return '';
}


/***/ }),

/***/ 48049:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.formatLegalInstructions = void 0;
const wrap = __webpack_require__(88152);
const chalk_1 = __webpack_require__(32589);
function formatLegalInstructions(legalInstructions, paddingLength = 4) {
    const legalContent = legalInstructions.map((legalData) => wrap(chalk_1.default.bold(`○ for ${legalData.licenseName}: `) + legalData.legalContent, 100)
        .split('\n')
        .join('\n' + ' '.repeat(paddingLength)));
    return legalContent.join('\n' + ' '.repeat(paddingLength));
}
exports.formatLegalInstructions = formatLegalInstructions;


/***/ }),

/***/ 57995:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.formatIssue = exports.printPath = exports.formatIssuesWithRemediation = void 0;
const chalk_1 = __webpack_require__(32589);
const theme_1 = __webpack_require__(86988);
const config_1 = __webpack_require__(22541);
const common_1 = __webpack_require__(53110);
const legal_license_instructions_1 = __webpack_require__(48049);
const format_reachability_1 = __webpack_require__(13331);
const constants_1 = __webpack_require__(65623);
const get_severity_value_1 = __webpack_require__(24898);
// How many reachable paths to show in the output
const MAX_REACHABLE_PATHS = 2;
function formatIssuesWithRemediation(vulns, remediationInfo, options) {
    var _a;
    const basicVulnInfo = {};
    const basicLicenseInfo = {};
    for (const vuln of vulns) {
        const allReachablePaths = { pathCount: 0, paths: [] };
        for (const issue of vuln.list) {
            const issueReachablePaths = ((_a = issue.reachablePaths) === null || _a === void 0 ? void 0 : _a.paths) || [];
            for (const functionReachablePaths of issueReachablePaths) {
                allReachablePaths.paths = allReachablePaths.paths.concat(functionReachablePaths.callPaths);
                allReachablePaths.pathCount += functionReachablePaths.callPaths.length;
            }
        }
        const vulnData = {
            title: vuln.title,
            severity: vuln.severity,
            originalSeverity: vuln.originalSeverity,
            isNew: vuln.isNew,
            name: vuln.name,
            type: vuln.metadata.type,
            version: vuln.version,
            fixedIn: vuln.fixedIn,
            note: vuln.note,
            legalInstructions: vuln.legalInstructionsArray,
            paths: vuln.list.map((v) => v.from),
            reachability: vuln.reachability,
            sampleReachablePaths: allReachablePaths,
        };
        if (vulnData.type === 'license') {
            basicLicenseInfo[vuln.metadata.id] = vulnData;
        }
        else {
            basicVulnInfo[vuln.metadata.id] = vulnData;
        }
    }
    const results = [''];
    let upgradeTextArray;
    if (remediationInfo.pin && Object.keys(remediationInfo.pin).length) {
        const upgradesByAffected = {};
        for (const topLevelPkg of Object.keys(remediationInfo.upgrade)) {
            for (const targetPkgStr of remediationInfo.upgrade[topLevelPkg]
                .upgrades) {
                if (!upgradesByAffected[targetPkgStr]) {
                    upgradesByAffected[targetPkgStr] = [];
                }
                upgradesByAffected[targetPkgStr].push({
                    name: topLevelPkg,
                    version: remediationInfo.upgrade[topLevelPkg].upgradeTo,
                });
            }
        }
        upgradeTextArray = constructPinText(remediationInfo.pin, upgradesByAffected, basicVulnInfo, options);
        const allVulnIds = new Set();
        Object.keys(remediationInfo.pin).forEach((name) => remediationInfo.pin[name].vulns.forEach((vid) => allVulnIds.add(vid)));
        remediationInfo.unresolved = remediationInfo.unresolved.filter((issue) => !allVulnIds.has(issue.id));
    }
    else {
        upgradeTextArray = constructUpgradesText(remediationInfo.upgrade, basicVulnInfo, options);
    }
    if (upgradeTextArray.length > 0) {
        results.push(upgradeTextArray.join('\n'));
    }
    const patchedTextArray = constructPatchesText(remediationInfo.patch, basicVulnInfo, options);
    if (patchedTextArray.length > 0) {
        results.push(patchedTextArray.join('\n'));
    }
    const unfixableIssuesTextArray = constructUnfixableText(remediationInfo.unresolved, basicVulnInfo, options);
    if (unfixableIssuesTextArray.length > 0) {
        results.push(unfixableIssuesTextArray.join('\n'));
    }
    const licenseIssuesTextArray = constructLicenseText(basicLicenseInfo, options);
    if (licenseIssuesTextArray.length > 0) {
        results.push(licenseIssuesTextArray.join('\n'));
    }
    return results;
}
exports.formatIssuesWithRemediation = formatIssuesWithRemediation;
function constructLicenseText(basicLicenseInfo, testOptions) {
    if (!(Object.keys(basicLicenseInfo).length > 0)) {
        return [];
    }
    const licenseTextArray = [chalk_1.default.bold.green('\nLicense issues:')];
    for (const id of Object.keys(basicLicenseInfo)) {
        const licenseText = formatIssue(id, basicLicenseInfo[id].title, basicLicenseInfo[id].severity, basicLicenseInfo[id].isNew, `${basicLicenseInfo[id].name}@${basicLicenseInfo[id].version}`, basicLicenseInfo[id].paths, testOptions, basicLicenseInfo[id].note, undefined, // We can never override license rules, so no originalSeverity here
        basicLicenseInfo[id].legalInstructions);
        licenseTextArray.push('\n' + licenseText);
    }
    return licenseTextArray;
}
function constructPatchesText(patches, basicVulnInfo, testOptions) {
    if (!(Object.keys(patches).length > 0)) {
        return [];
    }
    const patchedTextArray = [chalk_1.default.bold.green('\nPatchable issues:')];
    for (const id of Object.keys(patches)) {
        if (!basicVulnInfo[id]) {
            continue;
        }
        if (basicVulnInfo[id].type === 'license') {
            continue;
        }
        // todo: add vulnToPatch package name
        const packageAtVersion = `${basicVulnInfo[id].name}@${basicVulnInfo[id].version}`;
        const patchedText = `\n  Patch available for ${chalk_1.default.bold.whiteBright(packageAtVersion)}\n`;
        const thisPatchFixes = formatIssue(id, basicVulnInfo[id].title, basicVulnInfo[id].severity, basicVulnInfo[id].isNew, `${basicVulnInfo[id].name}@${basicVulnInfo[id].version}`, basicVulnInfo[id].paths, testOptions, basicVulnInfo[id].note, basicVulnInfo[id].originalSeverity);
        patchedTextArray.push(patchedText + thisPatchFixes);
    }
    return patchedTextArray;
}
function thisUpgradeFixes(vulnIds, basicVulnInfo, testOptions) {
    return vulnIds
        .filter((id) => basicVulnInfo[id]) // basicVulnInfo only contains issues with the specified severity levels
        .sort((a, b) => get_severity_value_1.getSeverityValue(basicVulnInfo[a].severity) -
        get_severity_value_1.getSeverityValue(basicVulnInfo[b].severity))
        .filter((id) => basicVulnInfo[id].type !== 'license')
        .map((id) => formatIssue(id, basicVulnInfo[id].title, basicVulnInfo[id].severity, basicVulnInfo[id].isNew, `${basicVulnInfo[id].name}@${basicVulnInfo[id].version}`, basicVulnInfo[id].paths, testOptions, basicVulnInfo[id].note, basicVulnInfo[id].originalSeverity, [], basicVulnInfo[id].reachability, basicVulnInfo[id].sampleReachablePaths))
        .join('\n');
}
function processUpgrades(sink, upgradesByDep, deps, basicVulnInfo, testOptions) {
    for (const dep of deps) {
        const data = upgradesByDep[dep];
        const upgradeDepTo = data.upgradeTo;
        const vulnIds = data.vulns || data.vulns;
        const upgradeText = `\n  Upgrade ${chalk_1.default.bold.whiteBright(dep)} to ${chalk_1.default.bold.whiteBright(upgradeDepTo)} to fix\n`;
        sink.push(upgradeText + thisUpgradeFixes(vulnIds, basicVulnInfo, testOptions));
    }
}
function constructUpgradesText(upgrades, basicVulnInfo, testOptions) {
    if (!(Object.keys(upgrades).length > 0)) {
        return [];
    }
    const upgradeTextArray = [chalk_1.default.bold.green('\nIssues to fix by upgrading:')];
    processUpgrades(upgradeTextArray, upgrades, Object.keys(upgrades), basicVulnInfo, testOptions);
    return upgradeTextArray;
}
function constructPinText(pins, upgradesByAffected, // classical "remediation via top-level dep" upgrades
basicVulnInfo, testOptions) {
    if (!Object.keys(pins).length) {
        return [];
    }
    const upgradeTextArray = [];
    upgradeTextArray.push(chalk_1.default.bold.green('\nIssues to fix by upgrading dependencies:'));
    // First, direct upgrades
    const upgradeables = Object.keys(pins).filter((name) => !pins[name].isTransitive);
    if (upgradeables.length) {
        processUpgrades(upgradeTextArray, pins, upgradeables, basicVulnInfo, testOptions);
    }
    // Second, pins
    const pinables = Object.keys(pins).filter((name) => pins[name].isTransitive);
    if (pinables.length) {
        for (const pkgName of pinables) {
            const data = pins[pkgName];
            const vulnIds = data.vulns;
            const upgradeDepTo = data.upgradeTo;
            const upgradeText = `\n  Pin ${chalk_1.default.bold.whiteBright(pkgName)} to ${chalk_1.default.bold.whiteBright(upgradeDepTo)} to fix`;
            upgradeTextArray.push(upgradeText);
            upgradeTextArray.push(thisUpgradeFixes(vulnIds, basicVulnInfo, testOptions));
            // Finally, if we have some upgrade paths that fix the same issues, suggest them as well.
            const topLevelUpgradesAlreadySuggested = new Set();
            for (const vid of vulnIds) {
                for (const topLevelPkg of upgradesByAffected[pkgName + '@' + basicVulnInfo[vid].version] || []) {
                    const setKey = `${topLevelPkg.name}\n${topLevelPkg.version}`;
                    if (!topLevelUpgradesAlreadySuggested.has(setKey)) {
                        topLevelUpgradesAlreadySuggested.add(setKey);
                        upgradeTextArray.push('  The issues above can also be fixed by upgrading top-level dependency ' +
                            `${topLevelPkg.name} to ${topLevelPkg.version}`);
                    }
                }
            }
        }
    }
    return upgradeTextArray;
}
function constructUnfixableText(unresolved, basicVulnInfo, testOptions) {
    if (!(unresolved.length > 0)) {
        return [];
    }
    const unfixableIssuesTextArray = [
        chalk_1.default.bold.white('\nIssues with no direct upgrade or patch:'),
    ];
    for (const issue of unresolved) {
        const issueInfo = basicVulnInfo[issue.id];
        if (!issueInfo) {
            // basicVulnInfo only contains issues with the specified severity levels
            continue;
        }
        const extraInfo = issue.fixedIn && issue.fixedIn.length
            ? `\n  This issue was fixed in versions: ${chalk_1.default.bold(issue.fixedIn.join(', '))}`
            : '\n  No upgrade or patch available';
        unfixableIssuesTextArray.push(formatIssue(issue.id, issue.title, issue.severity, issue.isNew, `${issue.packageName}@${issue.version}`, issueInfo.paths, testOptions, issueInfo.note, issueInfo.originalSeverity, [], issue.reachability) + `${extraInfo}`);
    }
    if (unfixableIssuesTextArray.length === 1) {
        // seems we still only have
        // the initial section title, so nothing to return
        return [];
    }
    return unfixableIssuesTextArray;
}
function printPath(path, slice = 1) {
    return path.slice(slice).join(constants_1.PATH_SEPARATOR);
}
exports.printPath = printPath;
function formatIssue(id, title, severity, isNew, vulnerableModule, paths, testOptions, note, originalSeverity, legalInstructions, reachability, sampleReachablePaths) {
    const newBadge = isNew ? ' (new)' : '';
    const name = vulnerableModule ? ` in ${chalk_1.default.bold(vulnerableModule)}` : '';
    let legalLicenseInstructionsText;
    if (legalInstructions) {
        legalLicenseInstructionsText = legal_license_instructions_1.formatLegalInstructions(legalInstructions);
    }
    let reachabilityText = '';
    if (reachability) {
        reachabilityText = format_reachability_1.formatReachability(reachability);
    }
    let introducedBy = '';
    if (testOptions.showVulnPaths === 'some' &&
        paths &&
        paths.find((p) => p.length > 1)) {
        // In this mode, we show only one path by default, for compactness
        const pathStr = printPath(paths[0]);
        introducedBy =
            paths.length === 1
                ? `\n    introduced by ${pathStr}`
                : `\n    introduced by ${pathStr} and ${chalk_1.default.cyanBright('' + (paths.length - 1))} other path(s)`;
    }
    else if (testOptions.showVulnPaths === 'all' && paths) {
        introducedBy =
            '\n    introduced by:' +
                paths
                    .slice(0, 1000)
                    .map((p) => '\n    ' + printPath(p))
                    .join('');
        if (paths.length > 1000) {
            introducedBy += `\n    and ${chalk_1.default.cyanBright('' + (paths.length - 1))} other path(s)`;
        }
    }
    const reachableVia = format_reachability_1.formatReachablePaths(sampleReachablePaths, MAX_REACHABLE_PATHS, reachablePathsTemplate);
    let originalSeverityStr = '';
    if (originalSeverity && originalSeverity !== severity) {
        originalSeverityStr = ` (originally ${titleCaseText(originalSeverity)})`;
    }
    return (common_1.colorTextBySeverity(severity, `  ${theme_1.icon.ISSUE} ${chalk_1.default.bold(title)}${newBadge} [${titleCaseText(severity)} Severity${originalSeverityStr}]`) +
        reachabilityText +
        `[${config_1.default.ROOT}/vuln/${id}]` +
        name +
        reachableVia +
        introducedBy +
        (legalLicenseInstructionsText
            ? `${chalk_1.default.bold('\n    Legal instructions')}:\n    ${legalLicenseInstructionsText}`
            : '') +
        (note ? `${chalk_1.default.bold('\n    Note')}:\n    ${note}` : ''));
}
exports.formatIssue = formatIssue;
function titleCaseText(text) {
    return text[0].toUpperCase() + text.slice(1);
}
function reachablePathsTemplate(samplePaths, extraPathsCount) {
    if (samplePaths.length === 0 && extraPathsCount === 0) {
        return '';
    }
    if (samplePaths.length === 0) {
        return `\n    reachable via at least ${extraPathsCount} paths`;
    }
    let reachableVia = '\n    reachable via:\n';
    for (const p of samplePaths) {
        reachableVia += `    ${p}\n`;
    }
    if (extraPathsCount > 0) {
        reachableVia += `    and at least ${chalk_1.default.cyanBright('' + extraPathsCount)} other path(s)`;
    }
    return reachableVia;
}


/***/ }),

/***/ 5034:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.getResults = exports.getTool = exports.getIssueLevel = exports.createSarifOutputForContainers = void 0;
const legacy_1 = __webpack_require__(34013);
const upperFirst = __webpack_require__(90039);
function createSarifOutputForContainers(testResults) {
    const sarifRes = {
        version: '2.1.0',
        runs: [],
    };
    testResults.forEach((testResult) => {
        sarifRes.runs.push({
            tool: getTool(testResult),
            results: getResults(testResult),
        });
    });
    return sarifRes;
}
exports.createSarifOutputForContainers = createSarifOutputForContainers;
function getIssueLevel(severity) {
    return severity === legacy_1.SEVERITY.HIGH || severity === legacy_1.SEVERITY.CRITICAL
        ? 'error'
        : 'warning';
}
exports.getIssueLevel = getIssueLevel;
function getTool(testResult) {
    const tool = {
        driver: {
            name: 'Snyk Container',
            rules: [],
        },
    };
    if (!testResult.vulnerabilities) {
        return tool;
    }
    const pushedIds = {};
    tool.driver.rules = testResult.vulnerabilities
        .map((vuln) => {
        if (pushedIds[vuln.id]) {
            return;
        }
        const level = getIssueLevel(vuln.severity);
        const cve = vuln['identifiers']['CVE'][0];
        pushedIds[vuln.id] = true;
        return {
            id: vuln.id,
            shortDescription: {
                text: `${upperFirst(vuln.severity)} severity - ${vuln.title} vulnerability in ${vuln.packageName}`,
            },
            fullDescription: {
                text: cve
                    ? `(${cve}) ${vuln.name}@${vuln.version}`
                    : `${vuln.name}@${vuln.version}`,
            },
            help: {
                text: '',
                markdown: vuln.description,
            },
            defaultConfiguration: {
                level: level,
            },
            properties: {
                tags: ['security', ...vuln.identifiers.CWE],
            },
        };
    })
        .filter(Boolean);
    return tool;
}
exports.getTool = getTool;
function getResults(testResult) {
    const results = [];
    if (!testResult.vulnerabilities) {
        return results;
    }
    testResult.vulnerabilities.forEach((vuln) => {
        results.push({
            ruleId: vuln.id,
            message: {
                text: `This file introduces a vulnerable ${vuln.packageName} package with a ${vuln.severity} severity vulnerability.`,
            },
            locations: [
                {
                    physicalLocation: {
                        artifactLocation: {
                            uri: testResult.displayTargetFile,
                        },
                        region: {
                            startLine: vuln.lineNumber || 1,
                        },
                    },
                },
            ],
        });
    });
    return results;
}
exports.getResults = getResults;


/***/ }),

/***/ 98202:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.showAllProjectsTip = void 0;
const is_multi_project_scan_1 = __webpack_require__(62435);
function showAllProjectsTip(packageManager, options, foundProjectCount) {
    if (packageManager === 'gradle' ||
        !foundProjectCount ||
        is_multi_project_scan_1.isMultiProjectScan(options)) {
        return '';
    }
    return (`Tip: Detected multiple supported manifests (${foundProjectCount}), ` +
        'use --all-projects to scan all of them at once.');
}
exports.showAllProjectsTip = showAllProjectsTip;


/***/ }),

/***/ 9658:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.showGradleSubProjectsTip = void 0;
const is_multi_project_scan_1 = __webpack_require__(62435);
function showGradleSubProjectsTip(packageManager, options, foundProjectCount) {
    if (packageManager !== 'gradle' ||
        !foundProjectCount ||
        is_multi_project_scan_1.isMultiProjectScan(options) ||
        options.allSubProjects) {
        return '';
    }
    return (`Tip: This project has multiple sub-projects (${foundProjectCount}), ` +
        'use --all-sub-projects flag to scan all sub-projects.');
}
exports.showGradleSubProjectsTip = showGradleSubProjectsTip;


/***/ }),

/***/ 95100:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.showMultiScanTip = void 0;
const show_all_projects_tip_1 = __webpack_require__(98202);
const show_all_sub_projects_tip_1 = __webpack_require__(9658);
function showMultiScanTip(projectType, options, foundProjectCount) {
    const gradleSubProjectsTip = show_all_sub_projects_tip_1.showGradleSubProjectsTip(projectType, options, foundProjectCount);
    if (gradleSubProjectsTip) {
        return gradleSubProjectsTip;
    }
    const allProjectsTip = show_all_projects_tip_1.showAllProjectsTip(projectType, options, foundProjectCount);
    if (allProjectsTip) {
        return allProjectsTip;
    }
    return '';
}
exports.showMultiScanTip = showMultiScanTip;


/***/ }),

/***/ 84210:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.getFileContents = void 0;
const fs = __webpack_require__(35747);
const path = __webpack_require__(85622);
function getFileContents(root, fileName) {
    const fullPath = path.resolve(root, fileName);
    if (!fs.existsSync(fullPath)) {
        throw new Error('Manifest ' + fileName + ' not found at location: ' + fileName);
    }
    const content = fs.readFileSync(fullPath, 'utf-8');
    return {
        content,
        fileName,
    };
}
exports.getFileContents = getFileContents;


/***/ }),

/***/ 62435:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.isMultiProjectScan = void 0;
function isMultiProjectScan(options) {
    return !!(options.allProjects || options.yarnWorkspaces);
}
exports.isMultiProjectScan = isMultiProjectScan;


/***/ }),

/***/ 27019:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.jsonStringifyLargeObject = void 0;
const debug = __webpack_require__(15158)('snyk-json');
/**
 * Attempt to json-stringify an object which is potentially very large and might exceed the string limit.
 * If it does exceed the string limit, try again without pretty-print to hopefully come out below the string limit.
 * @param obj the object from which you want to get a JSON string
 */
function jsonStringifyLargeObject(obj) {
    let res = '';
    try {
        // first try pretty-print
        res = JSON.stringify(obj, null, 2);
        return res;
    }
    catch (err) {
        // if that doesn't work, try non-pretty print
        debug('JSON.stringify failed - trying again without pretty print', err);
        res = JSON.stringify(obj);
        return res;
    }
}
exports.jsonStringifyLargeObject = jsonStringifyLargeObject;


/***/ }),

/***/ 80777:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ModuleInfo = void 0;
const merge = __webpack_require__(72378);
const Debug = __webpack_require__(15158);
const debug = Debug('snyk-module-info');
function ModuleInfo(plugin, policy) {
    return {
        async inspect(root, targetFile, options) {
            const pluginOptions = merge({
                args: options._doubleDashArgs,
            }, options);
            debug('calling plugin inspect()', { root, targetFile, pluginOptions });
            const info = await plugin.inspect(root, targetFile, pluginOptions);
            debug('plugin inspect() done');
            // attach policy if not provided by plugin
            if (policy && !info.package.policy) {
                info.package.policy = policy.toString();
            }
            return info;
        },
    };
}
exports.ModuleInfo = ModuleInfo;


/***/ }),

/***/ 61900:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.countTotalDependenciesInTree = void 0;
function countTotalDependenciesInTree(depTree) {
    let count = 0;
    if (depTree.dependencies) {
        for (const name of Object.keys(depTree.dependencies)) {
            const dep = depTree.dependencies[name];
            if (dep) {
                count += 1 + countTotalDependenciesInTree(dep);
            }
        }
    }
    return count;
}
exports.countTotalDependenciesInTree = countTotalDependenciesInTree;


/***/ }),

/***/ 73898:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ShellOutError = exports.execShell = exports.separateLines = exports.runGitLog = exports.getTimestampStartOfContributingDevTimeframe = exports.parseGitLog = exports.parseGitLogLine = exports.GitRepoCommitStats = exports.GitCommitInfo = exports.getContributors = exports.MAX_COMMITS_IN_GIT_LOG = exports.CONTRIBUTING_DEVELOPER_PERIOD_DAYS = exports.SERIOUS_DELIMITER = void 0;
/**
 * This is to count the number of "contributing" developers using Snyk on a given repo.
 * "Contributing" is defined as having contributed a commit in the last 90 days.
 * This is use only on the `snyk monitor` command as that is used to monitor a project's dependencies in an
 * on-going manner.
 * It collects the email of a git user and the most recent commit timestamp (both per the `git log`
 * output) and can be disabled by config (see https://snyk.io/policies/tracking-and-analytics/).
 */
const child_process_1 = __webpack_require__(63129);
exports.SERIOUS_DELIMITER = '_SNYK_SEPARATOR_';
exports.CONTRIBUTING_DEVELOPER_PERIOD_DAYS = 90;
// Limit the number of commits returned from `git log` command to stay within maxBuffer limit
exports.MAX_COMMITS_IN_GIT_LOG = 500;
async function getContributors({ endDate, periodDays, repoPath } = {
    endDate: new Date(),
    periodDays: exports.CONTRIBUTING_DEVELOPER_PERIOD_DAYS,
    repoPath: process.cwd(),
}) {
    const timestampStartOfContributingDeveloperPeriod = getTimestampStartOfContributingDevTimeframe(endDate, periodDays);
    const gitLogResults = await runGitLog(timestampStartOfContributingDeveloperPeriod, Math.floor(endDate.getTime() / 1000), repoPath, execShell);
    const stats = parseGitLog(gitLogResults);
    return stats.getRepoContributors();
}
exports.getContributors = getContributors;
class GitCommitInfo {
    constructor(authorEmail, commitTimestamp) {
        this.authorEmail = authorEmail;
        this.commitTimestamp = commitTimestamp;
    }
}
exports.GitCommitInfo = GitCommitInfo;
class GitRepoCommitStats {
    constructor(commitInfos) {
        this.commitInfos = commitInfos;
    }
    static empty() {
        return new GitRepoCommitStats([]);
    }
    addCommitInfo(info) {
        this.commitInfos.push(info);
    }
    getUniqueAuthorsCount() {
        const uniqueAuthorEmails = this.getUniqueAuthorEmails();
        return uniqueAuthorEmails.size;
    }
    getCommitsCount() {
        return this.commitInfos.length;
    }
    getUniqueAuthorEmails() {
        const allCommitAuthorHashedEmails = this.commitInfos.map((c) => c.authorEmail);
        const uniqueAuthorEmails = new Set(allCommitAuthorHashedEmails);
        return uniqueAuthorEmails;
    }
    getRepoContributors() {
        const uniqueAuthorEmails = this.getUniqueAuthorEmails();
        const contributors = [];
        for (const nextUniqueAuthorEmail of uniqueAuthorEmails) {
            const latestCommitTimestamp = this.getMostRecentCommitTimestamp(nextUniqueAuthorEmail);
            contributors.push({
                email: nextUniqueAuthorEmail,
                lastCommitDate: latestCommitTimestamp,
            });
        }
        return contributors;
    }
    getMostRecentCommitTimestamp(authorHashedEmail) {
        for (const nextGI of this.commitInfos) {
            if (nextGI.authorEmail === authorHashedEmail) {
                return nextGI.commitTimestamp;
            }
        }
        return '';
    }
}
exports.GitRepoCommitStats = GitRepoCommitStats;
function parseGitLogLine(logLine) {
    const lineComponents = logLine.split(exports.SERIOUS_DELIMITER);
    const authorEmail = lineComponents[2];
    const commitTimestamp = lineComponents[3];
    const commitInfo = new GitCommitInfo(authorEmail, commitTimestamp);
    return commitInfo;
}
exports.parseGitLogLine = parseGitLogLine;
function parseGitLog(gitLog) {
    if (gitLog.trim() === '') {
        return GitRepoCommitStats.empty();
    }
    const logLines = separateLines(gitLog);
    const logLineInfos = logLines.map(parseGitLogLine);
    const stats = new GitRepoCommitStats(logLineInfos);
    return stats;
}
exports.parseGitLog = parseGitLog;
/**
 * @returns time stamp in seconds-since-epoch of 90 days ago since 90 days is the "contributing devs" timeframe
 */
function getTimestampStartOfContributingDevTimeframe(dNow, timespanInDays = exports.CONTRIBUTING_DEVELOPER_PERIOD_DAYS) {
    const nowUtcEpocMS = dNow.getTime();
    const nowUtcEpocS = Math.floor(nowUtcEpocMS / 1000);
    const ONE_DAY_IN_SECONDS = 86400;
    const lookbackTimespanSeconds = timespanInDays * ONE_DAY_IN_SECONDS;
    const startOfPeriodEpochSeconds = nowUtcEpocS - lookbackTimespanSeconds;
    return startOfPeriodEpochSeconds;
}
exports.getTimestampStartOfContributingDevTimeframe = getTimestampStartOfContributingDevTimeframe;
async function runGitLog(timestampEpochSecondsStartOfPeriod, timestampEpochSecondsEndOfPeriod, repoPath, fnShellout) {
    try {
        const gitLogCommand = `git --no-pager log --pretty=tformat:"%H${exports.SERIOUS_DELIMITER}%an${exports.SERIOUS_DELIMITER}%ae${exports.SERIOUS_DELIMITER}%aI" --after="${timestampEpochSecondsStartOfPeriod}" --until="${timestampEpochSecondsEndOfPeriod}" --max-count=${exports.MAX_COMMITS_IN_GIT_LOG}`;
        const gitLogStdout = await fnShellout(gitLogCommand, repoPath);
        return gitLogStdout;
    }
    catch {
        return '';
    }
}
exports.runGitLog = runGitLog;
function separateLines(inputText) {
    const linuxStyleNewLine = '\n';
    const windowsStyleNewLine = '\r\n';
    const reg = new RegExp(`${linuxStyleNewLine}|${windowsStyleNewLine}`);
    const lines = inputText.trim().split(reg);
    return lines;
}
exports.separateLines = separateLines;
function execShell(cmd, workingDirectory) {
    const options = {
        cwd: workingDirectory,
    };
    return new Promise((resolve, reject) => {
        child_process_1.exec(cmd, options, (error, stdout, stderr) => {
            if (error) {
                const exitCode = error.code;
                const e = new ShellOutError(error.message, exitCode, stdout, stderr, error);
                reject(e);
            }
            else {
                resolve(stdout ? stdout : stderr);
            }
        });
    });
}
exports.execShell = execShell;
class ShellOutError extends Error {
    constructor(message, exitCode, stdout, stderr, innerError) {
        super(message);
        this.exitCode = exitCode;
        this.stdout = stdout;
        this.stderr = stderr;
        this.innerError = innerError;
    }
}
exports.ShellOutError = ShellOutError;


/***/ }),

/***/ 55916:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.dropEmptyDeps = void 0;
function dropEmptyDeps(depTree) {
    if (depTree.dependencies) {
        const keys = Object.keys(depTree.dependencies);
        if (keys.length === 0) {
            delete depTree.dependencies;
        }
        else {
            for (const k of keys) {
                dropEmptyDeps(depTree.dependencies[k]);
            }
        }
    }
    return depTree;
}
exports.dropEmptyDeps = dropEmptyDeps;


/***/ }),

/***/ 85768:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.filterOutMissingDeps = void 0;
function filterOutMissingDeps(depTree) {
    const filteredDeps = {};
    const missingDeps = [];
    if (!depTree.dependencies) {
        return {
            filteredDepTree: depTree,
            missingDeps,
        };
    }
    for (const depKey of Object.keys(depTree.dependencies)) {
        const dep = depTree.dependencies[depKey];
        if (dep.missingLockFileEntry ||
            (dep.labels && dep.labels.missingLockFileEntry)) {
            // TODO(kyegupov): add field to the type
            missingDeps.push(`${dep.name}@${dep.version}`);
        }
        else {
            filteredDeps[depKey] = dep;
        }
    }
    const filteredDepTree = {
        ...depTree,
        dependencies: filteredDeps,
    };
    return {
        filteredDepTree,
        missingDeps,
    };
}
exports.filterOutMissingDeps = filterOutMissingDeps;


/***/ }),

/***/ 3959:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.monitorDepGraph = exports.monitor = void 0;
const Debug = __webpack_require__(15158);
const path = __webpack_require__(85622);
const depGraphLib = __webpack_require__(71479);
const snyk = __webpack_require__(9146);
const api_token_1 = __webpack_require__(95181);
const request_1 = __webpack_require__(52050);
const config_1 = __webpack_require__(22541);
const os = __webpack_require__(12087);
const get = __webpack_require__(29208);
const is_ci_1 = __webpack_require__(10090);
const analytics = __webpack_require__(82744);
const projectMetadata = __webpack_require__(3594);
const errors_1 = __webpack_require__(55191);
const prune_1 = __webpack_require__(87725);
const package_managers_1 = __webpack_require__(53847);
const count_total_deps_in_tree_1 = __webpack_require__(61900);
const filter_out_missing_deps_1 = __webpack_require__(85768);
const drop_empty_deps_1 = __webpack_require__(55916);
const prune_dep_tree_1 = __webpack_require__(35797);
const policy_1 = __webpack_require__(32615);
const types_1 = __webpack_require__(39409);
const reachable_vulns_1 = __webpack_require__(86978);
const utils_1 = __webpack_require__(49530);
const utils_2 = __webpack_require__(61721);
const alerts = __webpack_require__(21696);
const error_format_1 = __webpack_require__(59369);
const debug = Debug('snyk');
const ANALYTICS_PAYLOAD_MAX_LENGTH = 1024;
async function monitor(root, meta, scannedProject, options, pluginMeta, targetFileRelativePath, contributors, projectAttributes, tags) {
    api_token_1.apiOrOAuthTokenExists();
    const packageManager = meta.packageManager;
    analytics.add('packageManager', packageManager);
    analytics.add('isDocker', !!meta.isDocker);
    if (scannedProject.depGraph) {
        return await monitorDepGraph(root, meta, scannedProject, pluginMeta, options, targetFileRelativePath, contributors, projectAttributes, tags);
    }
    if (package_managers_1.GRAPH_SUPPORTED_PACKAGE_MANAGERS.includes(packageManager)) {
        return await monitorDepGraphFromDepTree(root, meta, scannedProject, pluginMeta, options, targetFileRelativePath, contributors, projectAttributes, tags);
    }
    return await monitorDepTree(root, meta, scannedProject, pluginMeta, options, targetFileRelativePath, contributors, projectAttributes, tags);
}
exports.monitor = monitor;
async function monitorDepTree(root, meta, scannedProject, pluginMeta, options, targetFileRelativePath, contributors, projectAttributes, tags) {
    var _a, _b, _c, _d;
    let treeMissingDeps = [];
    const packageManager = meta.packageManager;
    let depTree = scannedProject.depTree;
    if (!depTree) {
        debug('scannedProject is missing depGraph or depTree, cannot run test/monitor');
        throw new errors_1.FailedToRunTestError(errors_1.errorMessageWithRetry('Your monitor request could not be completed.'));
    }
    let prePruneDepCount;
    if (meta.prune) {
        debug('prune used, counting total dependencies');
        prePruneDepCount = count_total_deps_in_tree_1.countTotalDependenciesInTree(depTree);
        analytics.add('prePruneDepCount', prePruneDepCount);
        debug('total dependencies: %d', prePruneDepCount);
        debug('pruning dep tree');
        depTree = await prune_dep_tree_1.pruneTree(depTree, meta.packageManager);
        debug('finished pruning dep tree');
    }
    if (['npm', 'yarn'].includes(meta.packageManager)) {
        const { filteredDepTree, missingDeps } = filter_out_missing_deps_1.filterOutMissingDeps(depTree);
        depTree = filteredDepTree;
        treeMissingDeps = missingDeps;
    }
    let targetFileDir;
    if (targetFileRelativePath) {
        const { dir } = path.parse(targetFileRelativePath);
        targetFileDir = dir;
    }
    const policy = await policy_1.findAndLoadPolicy(root, meta.isDocker ? 'docker' : packageManager, options, depTree, targetFileDir);
    const target = await projectMetadata.getInfo(scannedProject, meta, depTree);
    if (types_1.isGitTarget(target) && target.branch) {
        analytics.add('targetBranch', target.branch);
    }
    depTree = drop_empty_deps_1.dropEmptyDeps(depTree);
    let callGraphPayload;
    if (options.reachableVulns && ((_a = scannedProject.callGraph) === null || _a === void 0 ? void 0 : _a.innerError)) {
        const err = scannedProject.callGraph;
        analytics.add('callGraphError', error_format_1.abridgeErrorMessage(err.innerError.toString(), ANALYTICS_PAYLOAD_MAX_LENGTH));
        alerts.registerAlerts([
            {
                type: 'error',
                name: 'missing-call-graph',
                msg: err.message,
            },
        ]);
    }
    else if (scannedProject.callGraph) {
        const { callGraph, nodeCount, edgeCount } = reachable_vulns_1.serializeCallGraphWithMetrics(scannedProject.callGraph);
        debug(`Adding call graph to payload, node count: ${nodeCount}, edge count: ${edgeCount}`);
        const callGraphMetrics = get(pluginMeta, 'meta.callGraphMetrics', {});
        analytics.add('callGraphMetrics', {
            callGraphEdgeCount: edgeCount,
            callGraphNodeCount: nodeCount,
            ...callGraphMetrics,
        });
        callGraphPayload = callGraph;
    }
    if (!depTree) {
        debug('scannedProject is missing depGraph or depTree, cannot run test/monitor');
        throw new errors_1.FailedToRunTestError(errors_1.errorMessageWithRetry('Your monitor request could not be completed.'));
    }
    const { res, body } = await request_1.makeRequest({
        body: {
            meta: {
                method: meta.method,
                hostname: os.hostname(),
                id: snyk.id || depTree.name,
                ci: is_ci_1.isCI(),
                pid: process.pid,
                node: process.version,
                master: snyk.config.isMaster,
                name: utils_1.getNameDepTree(scannedProject, depTree, meta),
                version: depTree.version,
                org: config_1.default.org ? decodeURIComponent(config_1.default.org) : undefined,
                pluginName: pluginMeta.name,
                pluginRuntime: pluginMeta.runtime,
                missingDeps: treeMissingDeps,
                dockerImageId: pluginMeta.dockerImageId,
                dockerBaseImage: depTree.docker ? depTree.docker.baseImage : undefined,
                dockerfileLayers: depTree.docker
                    ? depTree.docker.dockerfileLayers
                    : undefined,
                projectName: utils_1.getProjectName(scannedProject, meta),
                prePruneDepCount,
                monitorGraph: false,
                versionBuildInfo: JSON.stringify((_b = scannedProject.meta) === null || _b === void 0 ? void 0 : _b.versionBuildInfo),
                gradleProjectName: (_c = scannedProject.meta) === null || _c === void 0 ? void 0 : _c.gradleProjectName,
                platform: (_d = scannedProject.meta) === null || _d === void 0 ? void 0 : _d.platform,
            },
            policy: policy ? policy.toString() : undefined,
            package: depTree,
            callGraph: callGraphPayload,
            // we take the targetFile from the plugin,
            // because we want to send it only for specific package-managers
            target,
            // WARNING: be careful changing this as it affects project uniqueness
            targetFile: utils_1.getTargetFile(scannedProject, pluginMeta),
            targetFileRelativePath,
            targetReference: meta.targetReference,
            contributors,
            projectAttributes,
            tags,
        },
        gzip: true,
        method: 'PUT',
        headers: {
            authorization: api_token_1.getAuthHeader(),
            'content-encoding': 'gzip',
        },
        url: config_1.default.API + '/monitor/' + packageManager,
        json: true,
    });
    if (res.statusCode && res.statusCode >= 200 && res.statusCode <= 299) {
        return body;
    }
    else {
        const userMessage = body && body.userMessage;
        if (!userMessage && res.statusCode === 504) {
            throw new errors_1.ConnectionTimeoutError();
        }
        else {
            throw new errors_1.MonitorError(res.statusCode, userMessage);
        }
    }
}
async function monitorDepGraph(root, meta, scannedProject, pluginMeta, options, targetFileRelativePath, contributors, projectAttributes, tags) {
    var _a, _b, _c;
    const packageManager = meta.packageManager;
    analytics.add('monitorDepGraph', true);
    let depGraph = scannedProject.depGraph;
    if (!depGraph) {
        debug('scannedProject is missing depGraph or depTree, cannot run test/monitor');
        throw new errors_1.FailedToRunTestError('Your monitor request could not be completed. ');
    }
    let targetFileDir;
    if (targetFileRelativePath) {
        const { dir } = path.parse(targetFileRelativePath);
        targetFileDir = dir;
    }
    const policy = await policy_1.findAndLoadPolicy(root, meta.isDocker ? 'docker' : packageManager, options, undefined, targetFileDir);
    const target = await projectMetadata.getInfo(scannedProject, meta);
    if (types_1.isGitTarget(target) && target.branch) {
        analytics.add('targetBranch', target.branch);
    }
    const pruneIsRequired = options.pruneRepeatedSubdependencies;
    depGraph = await prune_1.pruneGraph(depGraph, packageManager, pruneIsRequired);
    let callGraphPayload;
    if (options.reachableVulns && ((_a = scannedProject.callGraph) === null || _a === void 0 ? void 0 : _a.innerError)) {
        const err = scannedProject.callGraph;
        analytics.add('callGraphError', error_format_1.abridgeErrorMessage(err.innerError.toString(), ANALYTICS_PAYLOAD_MAX_LENGTH));
        alerts.registerAlerts([
            {
                type: 'error',
                name: 'missing-call-graph',
                msg: err.message,
            },
        ]);
    }
    else if (scannedProject.callGraph) {
        const { callGraph, nodeCount, edgeCount } = reachable_vulns_1.serializeCallGraphWithMetrics(scannedProject.callGraph);
        debug(`Adding call graph to payload, node count: ${nodeCount}, edge count: ${edgeCount}`);
        const callGraphMetrics = get(pluginMeta, 'meta.callGraphMetrics', {});
        analytics.add('callGraphMetrics', {
            callGraphEdgeCount: edgeCount,
            callGraphNodeCount: nodeCount,
            ...callGraphMetrics,
        });
        callGraphPayload = callGraph;
    }
    if (!depGraph) {
        debug('scannedProject is missing depGraph or depTree, cannot run test/monitor');
        throw new errors_1.FailedToRunTestError(errors_1.errorMessageWithRetry('Your monitor request could not be completed.'));
    }
    const { res, body } = await request_1.makeRequest({
        body: {
            meta: {
                method: meta.method,
                hostname: os.hostname(),
                id: snyk.id || depGraph.rootPkg.name,
                ci: is_ci_1.isCI(),
                pid: process.pid,
                node: process.version,
                master: snyk.config.isMaster,
                name: utils_1.getNameDepGraph(scannedProject, depGraph, meta),
                version: depGraph.rootPkg.version,
                org: config_1.default.org ? decodeURIComponent(config_1.default.org) : undefined,
                pluginName: pluginMeta.name,
                pluginRuntime: pluginMeta.runtime,
                projectName: utils_1.getProjectName(scannedProject, meta),
                monitorGraph: true,
                versionBuildInfo: JSON.stringify((_b = scannedProject.meta) === null || _b === void 0 ? void 0 : _b.versionBuildInfo),
                gradleProjectName: (_c = scannedProject.meta) === null || _c === void 0 ? void 0 : _c.gradleProjectName,
            },
            policy: policy ? policy.toString() : undefined,
            depGraphJSON: depGraph,
            // we take the targetFile from the plugin,
            // because we want to send it only for specific package-managers
            target,
            targetFile: utils_1.getTargetFile(scannedProject, pluginMeta),
            targetFileRelativePath,
            targetReference: meta.targetReference,
            contributors,
            callGraph: callGraphPayload,
            projectAttributes,
            tags,
        },
        gzip: true,
        method: 'PUT',
        headers: {
            authorization: api_token_1.getAuthHeader(),
            'content-encoding': 'gzip',
        },
        url: `${config_1.default.API}/monitor/${packageManager}/graph`,
        json: true,
    });
    if (res.statusCode && res.statusCode >= 200 && res.statusCode <= 299) {
        return body;
    }
    else {
        const userMessage = body && body.userMessage;
        if (!userMessage && res.statusCode === 504) {
            throw new errors_1.ConnectionTimeoutError();
        }
        else {
            throw new errors_1.MonitorError(res.statusCode, userMessage);
        }
    }
}
exports.monitorDepGraph = monitorDepGraph;
async function monitorDepGraphFromDepTree(root, meta, scannedProject, pluginMeta, options, targetFileRelativePath, contributors, projectAttributes, tags) {
    const packageManager = meta.packageManager;
    let treeMissingDeps;
    let depTree = scannedProject.depTree;
    if (!depTree) {
        debug('scannedProject is missing depGraph or depTree, cannot run test/monitor');
        throw new errors_1.FailedToRunTestError(errors_1.errorMessageWithRetry('Your monitor request could not be completed'));
    }
    let targetFileDir;
    if (targetFileRelativePath) {
        const { dir } = path.parse(targetFileRelativePath);
        targetFileDir = dir;
    }
    const policy = await policy_1.findAndLoadPolicy(root, meta.isDocker ? 'docker' : packageManager, options, 
    // TODO: fix this and send only send when we used resolve-deps for node
    // it should be a ExpandedPkgTree type instead
    depTree, targetFileDir);
    if (['npm', 'yarn'].includes(meta.packageManager)) {
        const { filteredDepTree, missingDeps } = filter_out_missing_deps_1.filterOutMissingDeps(depTree);
        depTree = filteredDepTree;
        treeMissingDeps = missingDeps;
    }
    const depGraph = await depGraphLib.legacy.depTreeToGraph(depTree, packageManager);
    const target = await projectMetadata.getInfo(scannedProject, meta, depTree);
    if (types_1.isGitTarget(target) && target.branch) {
        analytics.add('targetBranch', target.branch);
    }
    let prunedGraph = depGraph;
    let prePruneDepCount;
    if (meta.prune) {
        debug('Trying to prune the graph');
        prePruneDepCount = utils_2.countPathsToGraphRoot(depGraph);
        debug('pre prunedPathsCount: ' + prePruneDepCount);
        prunedGraph = await prune_1.pruneGraph(depGraph, packageManager, meta.prune);
    }
    if (!depTree) {
        debug('scannedProject is missing depGraph or depTree, cannot run test/monitor');
        throw new errors_1.FailedToRunTestError(errors_1.errorMessageWithRetry('Your monitor request could not be completed.'));
    }
    const { res, body } = await request_1.makeRequest({
        body: {
            meta: {
                method: meta.method,
                hostname: os.hostname(),
                id: snyk.id || depTree.name,
                ci: is_ci_1.isCI(),
                pid: process.pid,
                node: process.version,
                master: snyk.config.isMaster,
                name: utils_1.getNameDepGraph(scannedProject, depGraph, meta),
                version: depGraph.rootPkg.version,
                org: config_1.default.org ? decodeURIComponent(config_1.default.org) : undefined,
                pluginName: pluginMeta.name,
                pluginRuntime: pluginMeta.runtime,
                dockerImageId: pluginMeta.dockerImageId,
                dockerBaseImage: depTree.docker ? depTree.docker.baseImage : undefined,
                dockerfileLayers: depTree.docker
                    ? depTree.docker.dockerfileLayers
                    : undefined,
                projectName: utils_1.getProjectName(scannedProject, meta),
                prePruneDepCount,
                missingDeps: treeMissingDeps,
                monitorGraph: true,
            },
            policy: policy ? policy.toString() : undefined,
            depGraphJSON: prunedGraph,
            // we take the targetFile from the plugin,
            // because we want to send it only for specific package-managers
            target,
            targetFile: utils_1.getTargetFile(scannedProject, pluginMeta),
            targetFileRelativePath,
            targetReference: meta.targetReference,
            contributors,
            projectAttributes,
            tags,
        },
        gzip: true,
        method: 'PUT',
        headers: {
            authorization: api_token_1.getAuthHeader(),
            'content-encoding': 'gzip',
        },
        url: `${config_1.default.API}/monitor/${packageManager}/graph`,
        json: true,
    });
    if (res.statusCode && res.statusCode >= 200 && res.statusCode <= 299) {
        return body;
    }
    else {
        const userMessage = body && body.userMessage;
        if (!userMessage && res.statusCode === 504) {
            throw new errors_1.ConnectionTimeoutError();
        }
        else {
            throw new errors_1.MonitorError(res.statusCode, userMessage);
        }
    }
}


/***/ }),

/***/ 35797:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.pruneTree = void 0;
const depGraphLib = __webpack_require__(71479);
async function pruneTree(tree, packageManagerName) {
    // Pruning requires conversion to the graph first.
    // This is slow.
    const graph = await depGraphLib.legacy.depTreeToGraph(tree, packageManagerName);
    const prunedTree = (await depGraphLib.legacy.graphToDepTree(graph, packageManagerName, { deduplicateWithinTopLevelDeps: true }));
    // Transplant pruned dependencies in the original tree (we want to keep all other fields):
    tree.dependencies = prunedTree.dependencies;
    return tree;
}
exports.pruneTree = pruneTree;


/***/ }),

/***/ 49530:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.getTargetFile = exports.getProjectName = exports.getNameDepGraph = exports.getNameDepTree = void 0;
const container_1 = __webpack_require__(51804);
function getNameDepTree(scannedProject, depTree, meta) {
    if (container_1.isContainer(scannedProject)) {
        return container_1.getContainerName(scannedProject, meta);
    }
    return depTree.name;
}
exports.getNameDepTree = getNameDepTree;
function getNameDepGraph(scannedProject, depGraph, meta) {
    var _a;
    if (container_1.isContainer(scannedProject)) {
        return container_1.getContainerName(scannedProject, meta);
    }
    return (_a = depGraph.rootPkg) === null || _a === void 0 ? void 0 : _a.name;
}
exports.getNameDepGraph = getNameDepGraph;
function getProjectName(scannedProject, meta) {
    var _a;
    if (container_1.isContainer(scannedProject)) {
        return container_1.getContainerProjectName(scannedProject, meta);
    }
    if (meta['project-name'] && ((_a = scannedProject.meta) === null || _a === void 0 ? void 0 : _a.projectName)) {
        return scannedProject.meta.projectName;
    }
    return meta['project-name'];
}
exports.getProjectName = getProjectName;
function getTargetFile(scannedProject, pluginMeta) {
    if (container_1.isContainer(scannedProject)) {
        return container_1.getContainerTargetFile(scannedProject);
    }
    return pluginMeta.targetFile;
}
exports.getTargetFile = getTargetFile;


/***/ }),

/***/ 1570:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.validateOptions = void 0;
const config_1 = __webpack_require__(22541);
const reachableVulns = __webpack_require__(86978);
const is_multi_project_scan_1 = __webpack_require__(62435);
const errors_1 = __webpack_require__(55191);
const alerts = __webpack_require__(21696);
async function validateOptions(options, packageManager) {
    if (options.reachableVulns) {
        // Throwing error only in case when both packageManager and allProjects not defined
        if (!packageManager && !is_multi_project_scan_1.isMultiProjectScan(options)) {
            throw new Error('Could not determine package manager');
        }
        const org = options.org || config_1.default.org;
        try {
            await reachableVulns.validatePayload(org, options, packageManager);
        }
        catch (err) {
            if (err instanceof errors_1.FeatureNotSupportedByPackageManagerError &&
                err.feature === 'Reachable vulns' &&
                err.userMessage) {
                alerts.registerAlerts([
                    {
                        type: 'error',
                        name: 'pkgman-not-supported',
                        msg: err.userMessage,
                    },
                ]);
            }
            else {
                throw err;
            }
        }
    }
}
exports.validateOptions = validateOptions;


/***/ }),

/***/ 23110:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.convertMultiResultToMultiCustom = void 0;
const convert_scanned_projects_to_custom_1 = __webpack_require__(92909);
function convertMultiResultToMultiCustom(inspectRes, packageManager, targetFile) {
    // convert all results from the same plugin to MultiProjectResultCustom
    // and annotate each scannedProject with packageManager
    return {
        plugin: inspectRes.plugin,
        scannedProjects: convert_scanned_projects_to_custom_1.convertScannedProjectsToCustom(inspectRes.scannedProjects, inspectRes.plugin, inspectRes.plugin.packageManager ||
            packageManager, targetFile),
    };
}
exports.convertMultiResultToMultiCustom = convertMultiResultToMultiCustom;


/***/ }),

/***/ 92909:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.convertScannedProjectsToCustom = void 0;
function convertScannedProjectsToCustom(scannedProjects, pluginMeta, packageManager, targetFile) {
    // annotate the package manager & targetFile to be used
    // for test & monitor
    return scannedProjects.map((a) => {
        a.plugin =
            a.plugin || pluginMeta;
        a.targetFile = a.targetFile || targetFile;
        a.packageManager = a
            .packageManager
            ? a.packageManager
            : packageManager;
        a.meta = a.meta;
        return a;
    });
}
exports.convertScannedProjectsToCustom = convertScannedProjectsToCustom;


/***/ }),

/***/ 99695:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.convertSingleResultToMultiCustom = void 0;
function convertSingleResultToMultiCustom(inspectRes, packageManager) {
    if (!packageManager) {
        packageManager = inspectRes.plugin
            .packageManager;
    }
    if (inspectRes.dependencyGraph) {
        return convertDepGraphResult(inspectRes, packageManager);
    }
    else {
        return convertDepTreeResult(inspectRes, packageManager);
    }
}
exports.convertSingleResultToMultiCustom = convertSingleResultToMultiCustom;
function convertDepGraphResult(inspectRes, packageManager) {
    const { plugin, meta, dependencyGraph: depGraph, callGraph } = inspectRes;
    return {
        plugin,
        scannedProjects: [
            {
                plugin: plugin,
                depGraph,
                callGraph: callGraph,
                meta,
                targetFile: plugin.targetFile,
                packageManager,
            },
        ],
    };
}
/**
 * @deprecated @boost: delete me when all languages uses depGraph
 */
function convertDepTreeResult(inspectRes, packageManager) {
    if (inspectRes.package &&
        !inspectRes.package.targetFile &&
        inspectRes.plugin) {
        inspectRes.package.targetFile = inspectRes.plugin.targetFile;
    }
    const { plugin, meta, package: depTree, callGraph } = inspectRes;
    if (depTree && !depTree.targetFile && plugin) {
        depTree.targetFile = plugin.targetFile;
    }
    return {
        plugin,
        scannedProjects: [
            {
                plugin: plugin,
                depTree,
                callGraph: callGraph,
                meta,
                targetFile: plugin.targetFile,
                packageManager,
            },
        ],
    };
}


/***/ }),

/***/ 22805:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.extractPackageManager = void 0;
function extractPackageManager(scannedProject, pluginRes, options) {
    // try and use the package Manager from the plugin
    // result if present
    const packageManager = scannedProject.packageManager ||
        (pluginRes.plugin && pluginRes.plugin.packageManager);
    if (packageManager) {
        return packageManager;
    }
    if (!packageManager && options.packageManager) {
        // fallback to Options packageManager
        return options.packageManager;
    }
    // for example: docker
    return undefined;
}
exports.extractPackageManager = extractPackageManager;


/***/ }),

/***/ 4842:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.warnSomeGradleManifestsNotScanned = exports.getDepsFromPlugin = void 0;
const debugModule = __webpack_require__(15158);
const pathLib = __webpack_require__(85622);
const chalk_1 = __webpack_require__(32589);
const theme_1 = __webpack_require__(86988);
const cli_interface_1 = __webpack_require__(65266);
const find_files_1 = __webpack_require__(46123);
const errors_1 = __webpack_require__(55191);
const get_multi_plugin_result_1 = __webpack_require__(66058);
const get_single_plugin_result_1 = __webpack_require__(8598);
const detect_1 = __webpack_require__(45318);
const analytics = __webpack_require__(82744);
const convert_single_splugin_res_to_multi_custom_1 = __webpack_require__(99695);
const convert_multi_plugin_res_to_multi_custom_1 = __webpack_require__(23110);
const yarn_workspaces_parser_1 = __webpack_require__(27326);
const debug = debugModule('snyk-test');
const multiProjectProcessors = {
    yarnWorkspaces: {
        handler: yarn_workspaces_parser_1.processYarnWorkspaces,
        files: ['package.json'],
    },
    allProjects: {
        handler: get_multi_plugin_result_1.getMultiPluginResult,
        files: detect_1.AUTO_DETECTABLE_FILES,
    },
};
// Force getDepsFromPlugin to return scannedProjects for processing
async function getDepsFromPlugin(root, options) {
    let inspectRes;
    if (Object.keys(multiProjectProcessors).some((key) => options[key])) {
        const scanType = options.yarnWorkspaces ? 'yarnWorkspaces' : 'allProjects';
        const levelsDeep = options.detectionDepth;
        const ignore = options.exclude ? options.exclude.split(',') : [];
        const { files: targetFiles, allFilesFound } = await find_files_1.find(root, ignore, multiProjectProcessors[scanType].files, levelsDeep);
        debug(`auto detect manifest files, found ${targetFiles.length}`, targetFiles);
        if (targetFiles.length === 0) {
            throw errors_1.NoSupportedManifestsFoundError([root]);
        }
        // enable full sub-project scan for gradle
        options.allSubProjects = true;
        inspectRes = await multiProjectProcessors[scanType].handler(root, options, targetFiles);
        const scannedProjects = inspectRes.scannedProjects;
        const analyticData = {
            scannedProjects: scannedProjects.length,
            targetFiles,
            packageManagers: targetFiles.map((file) => detect_1.detectPackageManagerFromFile(file)),
            levelsDeep,
            ignore,
        };
        analytics.add(scanType, analyticData);
        debug(`Found ${scannedProjects.length} projects from ${allFilesFound.length} detected manifests`);
        const userWarningMessage = warnSomeGradleManifestsNotScanned(scannedProjects, allFilesFound, root);
        if (!options.json && !options.quiet && userWarningMessage) {
            console.warn(chalk_1.default.bold.red(userWarningMessage));
        }
        return inspectRes;
    }
    // TODO: is this needed for the auto detect handling above?
    // don't override options.file if scanning multiple files at once
    if (!options.scanAllUnmanaged) {
        options.file = options.file || detect_1.detectPackageFile(root);
    }
    if (!options.docker && !(options.file || options.packageManager)) {
        throw errors_1.NoSupportedManifestsFoundError([...root]);
    }
    inspectRes = await get_single_plugin_result_1.getSinglePluginResult(root, options);
    if (!cli_interface_1.legacyPlugin.isMultiResult(inspectRes)) {
        if (!inspectRes.package && !inspectRes.dependencyGraph) {
            // something went wrong if both are not present...
            throw Error(`error getting dependencies from ${options.docker ? 'docker' : options.packageManager} ` + "plugin: neither 'package' nor 'scannedProjects' were found");
        }
        return convert_single_splugin_res_to_multi_custom_1.convertSingleResultToMultiCustom(inspectRes, options.packageManager);
    }
    // We are using "options" to store some information returned from plugin that we need to use later,
    // but don't want to send to Registry in the Payload.
    // TODO(kyegupov): decouple inspect and payload so that we don't need this hack
    options.projectNames = inspectRes.scannedProjects.map((scannedProject) => { var _a; return (_a = scannedProject === null || scannedProject === void 0 ? void 0 : scannedProject.depTree) === null || _a === void 0 ? void 0 : _a.name; });
    return convert_multi_plugin_res_to_multi_custom_1.convertMultiResultToMultiCustom(inspectRes, options.packageManager);
}
exports.getDepsFromPlugin = getDepsFromPlugin;
function warnSomeGradleManifestsNotScanned(scannedProjects, allFilesFound, root) {
    const gradleTargetFilesFilter = (targetFile) => targetFile &&
        (targetFile.endsWith('build.gradle') ||
            targetFile.endsWith('build.gradle.kts'));
    const scannedGradleFiles = scannedProjects
        .map((p) => {
        var _a;
        const targetFile = ((_a = p.meta) === null || _a === void 0 ? void 0 : _a.targetFile) || p.targetFile;
        return targetFile ? pathLib.resolve(root, targetFile) : null;
    })
        .filter(gradleTargetFilesFilter);
    const detectedGradleFiles = allFilesFound.filter(gradleTargetFilesFilter);
    const diff = detectedGradleFiles.filter((file) => !scannedGradleFiles.includes(file));
    if (diff.length > 0) {
        debug(`These Gradle manifests did not return any dependency results:\n${diff.join(',\n')}`);
        return `${theme_1.icon.ISSUE} ${diff.length}/${detectedGradleFiles.length} detected Gradle manifests did not return dependencies. They may have errored or were not included as part of a multi-project build. You may need to scan them individually with --file=path/to/file. Run with \`-d\` for more info.`;
    }
    return null;
}
exports.warnSomeGradleManifestsNotScanned = warnSomeGradleManifestsNotScanned;


/***/ }),

/***/ 34355:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.getExtraProjectCount = void 0;
const find_files_1 = __webpack_require__(46123);
const detect_1 = __webpack_require__(45318);
async function getExtraProjectCount(root, options, inspectResult) {
    if (options.docker || options.unmanaged) {
        return undefined;
    }
    if (inspectResult.plugin.meta &&
        inspectResult.plugin.meta.allSubProjectNames &&
        inspectResult.plugin.meta.allSubProjectNames.length > 0) {
        return inspectResult.plugin.meta.allSubProjectNames.length;
    }
    try {
        const { files: extraTargetFiles } = await find_files_1.find(root, [], detect_1.AUTO_DETECTABLE_FILES);
        const foundProjectsCount = extraTargetFiles.length > 1 ? extraTargetFiles.length - 1 : undefined;
        return foundProjectsCount;
    }
    catch (e) {
        return undefined;
    }
}
exports.getExtraProjectCount = getExtraProjectCount;


/***/ }),

/***/ 66058:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.filterOutProcessedWorkspaces = exports.getMultiPluginResult = void 0;
const cloneDeep = __webpack_require__(83465);
const pathLib = __webpack_require__(85622);
const cliInterface = __webpack_require__(65266);
const chalk_1 = __webpack_require__(32589);
const theme_1 = __webpack_require__(86988);
const debugModule = __webpack_require__(15158);
const detect_1 = __webpack_require__(45318);
const get_single_plugin_result_1 = __webpack_require__(8598);
const convert_single_splugin_res_to_multi_custom_1 = __webpack_require__(99695);
const convert_multi_plugin_res_to_multi_custom_1 = __webpack_require__(23110);
const errors_1 = __webpack_require__(55191);
const yarn_workspaces_parser_1 = __webpack_require__(27326);
const debug = debugModule('snyk-test');
async function getMultiPluginResult(root, options, targetFiles) {
    var _a;
    const allResults = [];
    const failedResults = [];
    // process any yarn workspaces first
    // the files need to be proceeded together as they provide context to each other
    const { scannedProjects, unprocessedFiles, } = await processYarnWorkspacesProjects(root, options, targetFiles);
    allResults.push(...scannedProjects);
    debug(`Not part of a workspace: ${unprocessedFiles.join(', ')}}`);
    // process the rest 1 by 1 sent to relevant plugins
    for (const targetFile of unprocessedFiles) {
        const optionsClone = cloneDeep(options);
        optionsClone.file = pathLib.relative(root, targetFile);
        optionsClone.packageManager = detect_1.detectPackageManagerFromFile(pathLib.basename(targetFile));
        try {
            const inspectRes = await get_single_plugin_result_1.getSinglePluginResult(root, optionsClone, optionsClone.file);
            let resultWithScannedProjects;
            if (!cliInterface.legacyPlugin.isMultiResult(inspectRes)) {
                resultWithScannedProjects = convert_single_splugin_res_to_multi_custom_1.convertSingleResultToMultiCustom(inspectRes, optionsClone.packageManager);
            }
            else {
                resultWithScannedProjects = inspectRes;
            }
            const pluginResultWithCustomScannedProjects = convert_multi_plugin_res_to_multi_custom_1.convertMultiResultToMultiCustom(resultWithScannedProjects, optionsClone.packageManager, optionsClone.file);
            // annotate the package manager, project name & targetFile to be used
            // for test & monitor
            // TODO: refactor how we display meta to not have to do this
            options.projectNames = resultWithScannedProjects.scannedProjects.map((scannedProject) => { var _a; return (_a = scannedProject === null || scannedProject === void 0 ? void 0 : scannedProject.depTree) === null || _a === void 0 ? void 0 : _a.name; });
            allResults.push(...pluginResultWithCustomScannedProjects.scannedProjects);
        }
        catch (error) {
            const errMessage = (_a = error.message) !== null && _a !== void 0 ? _a : 'Something went wrong getting dependencies';
            // TODO: propagate this all the way back and include in --json output
            failedResults.push({
                targetFile,
                error,
                errMessage: errMessage,
            });
            debug(chalk_1.default.bold.red(`\n${theme_1.icon.ISSUE} Failed to get dependencies for ${targetFile}\nERROR: ${errMessage}\n`));
        }
    }
    if (!allResults.length) {
        throw new errors_1.FailedToRunTestError(errors_1.errorMessageWithRetry(`Failed to get dependencies for all ${targetFiles.length} potential projects.`));
    }
    return {
        plugin: {
            name: 'custom-auto-detect',
        },
        scannedProjects: allResults,
        failedResults,
    };
}
exports.getMultiPluginResult = getMultiPluginResult;
async function processYarnWorkspacesProjects(root, options, targetFiles) {
    try {
        const { scannedProjects } = await yarn_workspaces_parser_1.processYarnWorkspaces(root, {
            strictOutOfSync: options.strictOutOfSync,
            dev: options.dev,
        }, targetFiles);
        const unprocessedFiles = filterOutProcessedWorkspaces(root, scannedProjects, targetFiles);
        return { scannedProjects, unprocessedFiles };
    }
    catch (e) {
        debug('Error during detecting or processing Yarn Workspaces: ', e);
        return { scannedProjects: [], unprocessedFiles: targetFiles };
    }
}
function filterOutProcessedWorkspaces(root, scannedProjects, allTargetFiles) {
    const targetFiles = [];
    const scanned = scannedProjects
        .map((p) => p.targetFile)
        .map((p) => pathLib.resolve(process.cwd(), root, p));
    const all = allTargetFiles.map((p) => ({
        path: pathLib.resolve(process.cwd(), root, p),
        original: p,
    }));
    for (const entry of all) {
        const { path, original } = entry;
        const { base } = pathLib.parse(path);
        if (!['package.json', 'yarn.lock'].includes(base)) {
            targetFiles.push(original);
            continue;
        }
        // standardise to package.json
        // we discover the lockfiles but targetFile is package.json
        if (!scanned.includes(path.replace('yarn.lock', 'package.json'))) {
            targetFiles.push(original);
            continue;
        }
    }
    return targetFiles;
}
exports.filterOutProcessedWorkspaces = filterOutProcessedWorkspaces;


/***/ }),

/***/ 8598:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.getSinglePluginResult = void 0;
const plugins = __webpack_require__(45632);
const module_info_1 = __webpack_require__(80777);
async function getSinglePluginResult(root, options, targetFile) {
    const plugin = plugins.loadPlugin(options.packageManager);
    const moduleInfo = module_info_1.ModuleInfo(plugin, options.policy);
    const inspectRes = await moduleInfo.inspect(root, targetFile || options.file, { ...options });
    return inspectRes;
}
exports.getSinglePluginResult = getSinglePluginResult;


/***/ }),

/***/ 45632:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.loadPlugin = void 0;
const rubygemsPlugin = __webpack_require__(92632);
const mvnPlugin = __webpack_require__(29615);
const gradlePlugin = __webpack_require__(71673);
const sbtPlugin = __webpack_require__(1444);
const pythonPlugin = __webpack_require__(85054);
const goPlugin = __webpack_require__(29376);
const nugetPlugin = __webpack_require__(82843);
const phpPlugin = __webpack_require__(18630);
const nodejsPlugin = __webpack_require__(59947);
const cocoapodsPlugin = __webpack_require__(49556);
const hexPlugin = __webpack_require__(1649);
const errors_1 = __webpack_require__(55191);
function loadPlugin(packageManager) {
    switch (packageManager) {
        case 'npm': {
            return nodejsPlugin;
        }
        case 'rubygems': {
            return rubygemsPlugin;
        }
        case 'maven': {
            return mvnPlugin;
        }
        case 'gradle': {
            return gradlePlugin;
        }
        case 'sbt': {
            return sbtPlugin;
        }
        case 'yarn': {
            return nodejsPlugin;
        }
        case 'pip':
        case 'poetry': {
            return pythonPlugin;
        }
        case 'golangdep':
        case 'gomodules':
        case 'govendor': {
            return goPlugin;
        }
        case 'nuget': {
            return nugetPlugin;
        }
        case 'paket': {
            return nugetPlugin;
        }
        case 'composer': {
            return phpPlugin;
        }
        case 'cocoapods': {
            return cocoapodsPlugin;
        }
        case 'hex': {
            return hexPlugin;
        }
        default: {
            throw new errors_1.UnsupportedPackageManagerError(packageManager);
        }
    }
}
exports.loadPlugin = loadPlugin;


/***/ }),

/***/ 59947:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.inspect = void 0;
const modulesParser = __webpack_require__(85994);
const lockParser = __webpack_require__(82791);
const analytics = __webpack_require__(82744);
const missing_targetfile_error_1 = __webpack_require__(56775);
async function inspect(root, targetFile, options = {}) {
    var _a;
    if (!targetFile) {
        throw missing_targetfile_error_1.MissingTargetFileError(root);
    }
    const isLockFileBased = targetFile.endsWith('package-lock.json') ||
        targetFile.endsWith('yarn.lock');
    const getLockFileDeps = isLockFileBased && !options.traverseNodeModules;
    const depTree = getLockFileDeps
        ? await lockParser.parse(root, targetFile, options)
        : await modulesParser.parse(root, targetFile, options);
    if ((_a = depTree === null || depTree === void 0 ? void 0 : depTree.meta) === null || _a === void 0 ? void 0 : _a.lockfileVersion) {
        analytics.add('lockfileVersion', depTree.meta.lockfileVersion);
    }
    return {
        plugin: {
            name: 'snyk-nodejs-lockfile-parser',
            runtime: process.version,
        },
        scannedProjects: [{ depTree }],
    };
}
exports.inspect = inspect;


/***/ }),

/***/ 82791:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.parse = void 0;
const baseDebug = __webpack_require__(15158);
const debug = baseDebug('snyk-test');
const path = __webpack_require__(85622);
const spinner_1 = __webpack_require__(86766);
const analytics = __webpack_require__(82744);
const fs = __webpack_require__(35747);
const lockFileParser = __webpack_require__(423);
async function parse(root, targetFile, options) {
    const lockFileFullPath = path.resolve(root, targetFile);
    if (!fs.existsSync(lockFileFullPath)) {
        throw new Error('Lockfile ' + targetFile + ' not found at location: ' + lockFileFullPath);
    }
    const fullPath = path.parse(lockFileFullPath);
    const manifestFileFullPath = path.resolve(fullPath.dir, 'package.json');
    const shrinkwrapFullPath = path.resolve(fullPath.dir, 'npm-shrinkwrap.json');
    if (!fs.existsSync(manifestFileFullPath)) {
        throw new Error(`Could not find package.json at ${manifestFileFullPath} ` +
            `(lockfile found at ${targetFile})`);
    }
    if (fs.existsSync(shrinkwrapFullPath)) {
        throw new Error('Both `npm-shrinkwrap.json` and `package-lock.json` were found in ' +
            fullPath.dir +
            '.\n' +
            'Please run your command again specifying `--file=package.json` flag.');
    }
    analytics.add('local', true);
    analytics.add('generating-node-dependency-tree', {
        lockFile: true,
        targetFile,
    });
    const resolveModuleSpinnerLabel = `Analyzing npm dependencies for ${lockFileFullPath}`;
    debug(resolveModuleSpinnerLabel);
    try {
        await spinner_1.spinner(resolveModuleSpinnerLabel);
        const strictOutOfSync = options.strictOutOfSync !== false;
        return lockFileParser.buildDepTreeFromFiles(root, manifestFileFullPath, lockFileFullPath, options.dev, strictOutOfSync);
    }
    finally {
        await spinner_1.spinner.clear(resolveModuleSpinnerLabel)();
    }
}
exports.parse = parse;


/***/ }),

/***/ 85994:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.parse = void 0;
const path = __webpack_require__(85622);
const fs = __webpack_require__(35747);
const resolveNodeDeps = __webpack_require__(40068);
const baseDebug = __webpack_require__(15158);
const isEmpty = __webpack_require__(99245);
const spinner_1 = __webpack_require__(86766);
const analytics = __webpack_require__(82744);
const get_file_contents_1 = __webpack_require__(84210);
const debug = baseDebug('snyk-nodejs-plugin');
async function parse(root, targetFile, options) {
    if (targetFile.endsWith('yarn.lock')) {
        options.file =
            options.file && options.file.replace('yarn.lock', 'package.json');
    }
    // package-lock.json falls back to package.json (used in wizard code)
    if (targetFile.endsWith('package-lock.json')) {
        options.file =
            options.file && options.file.replace('package-lock.json', 'package.json');
    }
    // check if there any dependencies
    const packageJsonFileName = path.resolve(root, options.file);
    const packageManager = options.packageManager || 'npm';
    try {
        const packageJson = JSON.parse(get_file_contents_1.getFileContents(root, packageJsonFileName).content);
        let dependencies = packageJson.dependencies;
        if (options.dev) {
            dependencies = { ...dependencies, ...packageJson.devDependencies };
        }
        if (isEmpty(dependencies)) {
            return new Promise((resolve) => resolve({
                name: packageJson.name || 'package.json',
                dependencies: {},
                version: packageJson.version,
            }));
        }
    }
    catch (e) {
        debug(`Failed to read ${packageJsonFileName}: Error: ${e}`);
        throw new Error(`Failed to read ${packageJsonFileName}. Error: ${e.message}`);
    }
    const nodeModulesPath = path.join(path.dirname(path.resolve(root, targetFile)), 'node_modules');
    if (!fs.existsSync(nodeModulesPath)) {
        // throw a custom error
        throw new Error("Missing node_modules folder: we can't test " +
            `without dependencies.\nPlease run '${packageManager} install' first.`);
    }
    analytics.add('local', true);
    analytics.add('generating-node-dependency-tree', {
        lockFile: false,
        targetFile,
    });
    const resolveModuleSpinnerLabel = 'Analyzing npm dependencies for ' +
        path.dirname(path.resolve(root, targetFile));
    try {
        await spinner_1.spinner.clear(resolveModuleSpinnerLabel)();
        await spinner_1.spinner(resolveModuleSpinnerLabel);
        return resolveNodeDeps(root, Object.assign({}, options, { noFromArrays: true }));
    }
    finally {
        await spinner_1.spinner.clear(resolveModuleSpinnerLabel)();
    }
}
exports.parse = parse;


/***/ }),

/***/ 27326:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.packageJsonBelongsToWorkspace = exports.getWorkspacesMap = exports.processYarnWorkspaces = void 0;
const baseDebug = __webpack_require__(15158);
const pathUtil = __webpack_require__(85622);
const sortBy = __webpack_require__(58254);
const groupBy = __webpack_require__(20276);
const micromatch = __webpack_require__(70850);
const debug = baseDebug('snyk-yarn-workspaces');
const lockFileParser = __webpack_require__(423);
const get_file_contents_1 = __webpack_require__(84210);
const errors_1 = __webpack_require__(55191);
async function processYarnWorkspaces(root, settings, targetFiles) {
    // the order of yarnTargetFiles folders is important
    // must have the root level most folders at the top
    const mappedAndFiltered = targetFiles
        .map((p) => ({ path: p, ...pathUtil.parse(p) }))
        .filter((res) => ['package.json', 'yarn.lock'].includes(res.base));
    const sorted = sortBy(mappedAndFiltered, 'dir');
    const grouped = groupBy(sorted, 'dir');
    const yarnTargetFiles = grouped;
    debug(`Processing potential Yarn workspaces (${targetFiles.length})`);
    if (settings.yarnWorkspaces && Object.keys(yarnTargetFiles).length === 0) {
        throw errors_1.NoSupportedManifestsFoundError([root]);
    }
    let yarnWorkspacesMap = {};
    const yarnWorkspacesFilesMap = {};
    const result = {
        plugin: {
            name: 'snyk-nodejs-yarn-workspaces',
            runtime: process.version,
        },
        scannedProjects: [],
    };
    let rootWorkspaceManifestContent = {};
    // the folders must be ordered highest first
    for (const directory of Object.keys(yarnTargetFiles)) {
        debug(`Processing ${directory} as a potential Yarn workspace`);
        let isYarnWorkspacePackage = false;
        let isRootPackageJson = false;
        const packageJsonFileName = pathUtil.join(directory, 'package.json');
        const packageJson = get_file_contents_1.getFileContents(root, packageJsonFileName);
        yarnWorkspacesMap = {
            ...yarnWorkspacesMap,
            ...getWorkspacesMap(packageJson),
        };
        for (const workspaceRoot of Object.keys(yarnWorkspacesMap)) {
            const match = packageJsonBelongsToWorkspace(packageJsonFileName, yarnWorkspacesMap, workspaceRoot);
            if (match) {
                debug(`${packageJsonFileName} matches an existing workspace pattern`);
                yarnWorkspacesFilesMap[packageJsonFileName] = {
                    root: workspaceRoot,
                };
                isYarnWorkspacePackage = true;
            }
            if (packageJsonFileName === workspaceRoot) {
                isRootPackageJson = true;
                rootWorkspaceManifestContent = JSON.parse(packageJson.content);
            }
        }
        if (!(isYarnWorkspacePackage || isRootPackageJson)) {
            debug(`${packageJsonFileName} is not part of any detected workspace, skipping`);
            continue;
        }
        try {
            const rootDir = isYarnWorkspacePackage
                ? pathUtil.dirname(yarnWorkspacesFilesMap[packageJsonFileName].root)
                : pathUtil.dirname(packageJsonFileName);
            const rootYarnLockfileName = pathUtil.join(rootDir, 'yarn.lock');
            const yarnLock = await get_file_contents_1.getFileContents(root, rootYarnLockfileName);
            if (rootWorkspaceManifestContent.hasOwnProperty('resolutions') &&
                lockFileParser.getYarnLockfileType(yarnLock.content) ===
                    lockFileParser.LockfileType.yarn2) {
                const parsedManifestContent = JSON.parse(packageJson.content);
                packageJson.content = JSON.stringify({
                    ...parsedManifestContent,
                    resolutions: rootWorkspaceManifestContent['resolutions'],
                });
            }
            const res = await lockFileParser.buildDepTree(packageJson.content, yarnLock.content, settings.dev, lockFileParser.LockfileType.yarn, settings.strictOutOfSync !== false);
            const project = {
                packageManager: 'yarn',
                targetFile: pathUtil.relative(root, packageJson.fileName),
                depTree: res,
                plugin: {
                    name: 'snyk-nodejs-lockfile-parser',
                    runtime: process.version,
                },
            };
            result.scannedProjects.push(project);
        }
        catch (e) {
            if (settings.yarnWorkspaces) {
                throw e;
            }
            debug(`Error process workspace: ${packageJsonFileName}. ERROR: ${e}`);
        }
    }
    if (!result.scannedProjects.length) {
        debug(`No yarn workspaces detected in any of the ${targetFiles.length} target files.`);
    }
    return result;
}
exports.processYarnWorkspaces = processYarnWorkspaces;
function getWorkspacesMap(file) {
    const yarnWorkspacesMap = {};
    if (!file) {
        return yarnWorkspacesMap;
    }
    try {
        const rootFileWorkspacesDefinitions = lockFileParser.getYarnWorkspaces(file.content);
        if (rootFileWorkspacesDefinitions && rootFileWorkspacesDefinitions.length) {
            yarnWorkspacesMap[file.fileName] = {
                workspaces: rootFileWorkspacesDefinitions,
            };
        }
    }
    catch (e) {
        debug('Failed to process a workspace', e.message);
    }
    return yarnWorkspacesMap;
}
exports.getWorkspacesMap = getWorkspacesMap;
function packageJsonBelongsToWorkspace(packageJsonFileName, yarnWorkspacesMap, workspaceRoot) {
    const workspaceRootFolder = pathUtil.dirname(workspaceRoot.replace(/\\/g, '/'));
    const workspacesGlobs = (yarnWorkspacesMap[workspaceRoot].workspaces || []).map((workspace) => pathUtil.join(workspaceRootFolder, workspace));
    const match = micromatch.isMatch(packageJsonFileName.replace(/\\/g, '/'), workspacesGlobs.map((p) => pathUtil.normalize(pathUtil.join(p, '**')).replace(/\\/g, '/')));
    return match;
}
exports.packageJsonBelongsToWorkspace = packageJsonBelongsToWorkspace;


/***/ }),

/***/ 92632:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.inspect = void 0;
const inspectors_1 = __webpack_require__(9438);
const missing_targetfile_error_1 = __webpack_require__(56775);
const gemfileLockToDependencies = __webpack_require__(97467);
const get = __webpack_require__(29208);
async function inspect(root, targetFile, options = {}) {
    if (!targetFile) {
        throw missing_targetfile_error_1.MissingTargetFileError(root);
    }
    const specs = await gatherSpecs(root, targetFile, options);
    return {
        plugin: {
            name: 'bundled:rubygems',
            runtime: 'unknown',
        },
        scannedProjects: [
            {
                depTree: {
                    name: specs.packageName,
                    targetFile: specs.targetFile,
                    dependencies: getDependenciesFromSpecs(specs),
                },
            },
        ],
    };
}
exports.inspect = inspect;
function getDependenciesFromSpecs(specs) {
    const gemfileLockBase64 = get(specs, 'files.gemfileLock.contents');
    const gemspecBase64 = get(specs, 'files.gemspec.contents');
    const contents = Buffer.from(gemfileLockBase64 || gemspecBase64, 'base64').toString();
    const dependencies = gemfileLockToDependencies(contents);
    return dependencies;
}
async function gatherSpecs(root, targetFile, options) {
    for (const inspector of inspectors_1.inspectors) {
        if (inspector.canHandle(targetFile)) {
            return await inspector.gatherSpecs(root, targetFile, options);
        }
    }
    throw new Error(`Could not handle rubygems file: ${targetFile}`);
}


/***/ }),

/***/ 9162:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.gatherSpecs = exports.canHandle = void 0;
const path = __webpack_require__(85622);
const try_get_spec_1 = __webpack_require__(50552);
/* Supported example patterns:
 * Gemfile
 * Gemfile.lock
 * rails.2.4.5.gemfile
 * rails.2.4.5.gemfile.lock
 * gemfiles/Gemfile.rails-2.4.5.lock
 * gemfiles/Gemfile.lock.rails-2.4.5
 */
const gemfileOrLockfilePattern = /.*[gG]emfile.*(\.lock)?.*$/;
const gemfileLockPattern = /.*[gG]emfile.*(\.lock).*$/;
function canHandle(file) {
    return !!file && gemfileOrLockfilePattern.test(path.basename(file));
}
exports.canHandle = canHandle;
async function gatherSpecs(root, target, options) {
    const { dir, name } = path.parse(target);
    const isGemfileLock = gemfileLockPattern.test(target);
    // if the target is a Gemfile we treat is as the lockfile
    const gemfileLock = await try_get_spec_1.tryGetSpec(root, isGemfileLock ? target : path.join(target + '.lock'));
    if (gemfileLock) {
        const basePackageName = path.basename(root);
        return {
            packageName: options.allSubProjects
                ? path.join(basePackageName, dir)
                : basePackageName,
            targetFile: path.join(dir, name),
            files: { gemfileLock },
        };
    }
    else {
        throw new Error(`Could not read ${target || 'Gemfile.lock'} lockfile: can't test ` +
            'without dependencies.\nPlease run `bundle install` first or' +
            ' if this is a custom file name re-run with --file=path/to/custom.gemfile.lock --package-manager=rubygems');
    }
}
exports.gatherSpecs = gatherSpecs;


/***/ }),

/***/ 31810:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.gatherSpecs = exports.canHandle = void 0;
const path = __webpack_require__(85622);
const try_get_spec_1 = __webpack_require__(50552);
const pattern = /\.gemspec$/;
function canHandle(file) {
    return !!file && pattern.test(file);
}
exports.canHandle = canHandle;
async function gatherSpecs(root, target) {
    const targetName = path.basename(target);
    const targetDir = path.dirname(target);
    const files = {};
    const gemspec = await try_get_spec_1.tryGetSpec(root, path.join(targetDir, targetName));
    if (gemspec) {
        files.gemspec = gemspec;
    }
    else {
        throw new Error(`File not found: ${target}`);
    }
    const gemfileLock = await try_get_spec_1.tryGetSpec(root, path.join(targetDir, 'Gemfile.lock'));
    if (gemfileLock) {
        files.gemfileLock = gemfileLock;
    }
    return {
        packageName: path.basename(root),
        targetFile: path.join(targetDir, targetName),
        files,
    };
}
exports.gatherSpecs = gatherSpecs;


/***/ }),

/***/ 9438:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.inspectors = void 0;
const gemfile = __webpack_require__(9162);
const gemspec = __webpack_require__(31810);
exports.inspectors = [gemfile, gemspec];


/***/ }),

/***/ 50552:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.tryGetSpec = void 0;
const path = __webpack_require__(85622);
const fs = __webpack_require__(35747);
async function tryGetSpec(dir, name) {
    const filePath = path.resolve(dir, name);
    if (fs.existsSync(filePath)) {
        return {
            name,
            contents: Buffer.from(fs.readFileSync(filePath)).toString('base64'),
        };
    }
    return null;
}
exports.tryGetSpec = tryGetSpec;


/***/ }),

/***/ 2806:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.getCodeAnalysisAndParseResults = void 0;
const code_client_1 = __webpack_require__(95951);
const legacy_1 = __webpack_require__(34013);
const api_token_1 = __webpack_require__(95181);
const config_1 = __webpack_require__(22541);
const spinner_1 = __webpack_require__(86766);
const utils_1 = __webpack_require__(33113);
const errors_1 = __webpack_require__(61315);
const proxy_from_env_1 = __webpack_require__(21394);
const global_agent_1 = __webpack_require__(97959);
const chalk_1 = __webpack_require__(32589);
const debugLib = __webpack_require__(15158);
const debug = debugLib('snyk-code');
async function getCodeAnalysisAndParseResults(root, options, sastSettings, requestId) {
    await spinner_1.spinner.clearAll();
    utils_1.analysisProgressUpdate();
    const codeAnalysis = await getCodeAnalysis(root, options, sastSettings, requestId);
    spinner_1.spinner.clearAll();
    return parseSecurityResults(codeAnalysis);
}
exports.getCodeAnalysisAndParseResults = getCodeAnalysisAndParseResults;
async function getCodeAnalysis(root, options, sastSettings, requestId) {
    var _a;
    const isLocalCodeEngineEnabled = isLocalCodeEngine(sastSettings);
    if (isLocalCodeEngineEnabled) {
        validateLocalCodeEngineUrl(sastSettings.localCodeEngine.url);
    }
    const source = 'snyk-cli';
    const baseURL = isLocalCodeEngineEnabled
        ? sastSettings.localCodeEngine.url
        : config_1.default.CODE_CLIENT_PROXY_URL;
    // TODO(james) This mirrors the implementation in request.ts and we need to use this for deeproxy calls
    // This ensures we support lowercase http(s)_proxy values as well
    // The weird IF around it ensures we don't create an envvar with
    // a value of undefined, which throws error when trying to use it as a proxy
    if (process.env.HTTP_PROXY || process.env.http_proxy) {
        process.env.HTTP_PROXY = process.env.HTTP_PROXY || process.env.http_proxy;
    }
    if (process.env.HTTPS_PROXY || process.env.https_proxy) {
        process.env.HTTPS_PROXY =
            process.env.HTTPS_PROXY || process.env.https_proxy;
    }
    const proxyUrl = proxy_from_env_1.getProxyForUrl(baseURL);
    if (proxyUrl) {
        global_agent_1.bootstrap({
            environmentVariableNamespace: '',
        });
    }
    const sessionToken = api_token_1.api() || '';
    const severity = options.severityThreshold
        ? severityToAnalysisSeverity(options.severityThreshold)
        : code_client_1.AnalysisSeverity.info;
    const result = await code_client_1.analyzeFolders({
        connection: { baseURL, sessionToken, source, requestId },
        analysisOptions: { severity },
        fileOptions: { paths: [root] },
        analysisContext: {
            initiator: 'CLI',
            flow: source,
            orgDisplayName: sastSettings.org,
            projectName: config_1.default.PROJECT_NAME,
            org: {
                name: sastSettings.org || 'unknown',
                displayName: 'unknown',
                publicId: 'unknown',
                flags: {},
            },
        },
        languages: sastSettings.supportedLanguages,
    });
    if ((_a = result === null || result === void 0 ? void 0 : result.fileBundle.skippedOversizedFiles) === null || _a === void 0 ? void 0 : _a.length) {
        debug('\n', chalk_1.default.yellow(`Warning!\nFiles were skipped in the analysis due to their size being greater than ${code_client_1.MAX_FILE_SIZE}B. Skipped files: ${[
            ...result.fileBundle.skippedOversizedFiles,
        ].join(', ')}`));
    }
    if ((result === null || result === void 0 ? void 0 : result.analysisResults.type) === 'sarif') {
        return result.analysisResults.sarif;
    }
    return null;
}
function severityToAnalysisSeverity(severity) {
    if (severity === legacy_1.SEVERITY.CRITICAL) {
        throw new errors_1.FeatureNotSupportedBySnykCodeError(legacy_1.SEVERITY.CRITICAL);
    }
    const severityLevel = {
        low: 1,
        medium: 2,
        high: 3,
    };
    return severityLevel[severity];
}
function parseSecurityResults(codeAnalysis) {
    let securityRulesMap;
    if (!codeAnalysis) {
        return codeAnalysis;
    }
    const rules = codeAnalysis.runs[0].tool.driver.rules;
    const results = codeAnalysis.runs[0].results;
    if (rules) {
        securityRulesMap = getSecurityRulesMap(rules);
        codeAnalysis.runs[0].tool.driver.rules = Object.values(securityRulesMap);
    }
    if (results && securityRulesMap) {
        codeAnalysis.runs[0].results = getSecurityResultsOnly(results, Object.keys(securityRulesMap));
    }
    return codeAnalysis;
}
function getSecurityRulesMap(rules) {
    const securityRulesMap = rules.reduce((acc, rule) => {
        var _a;
        const { id: ruleId, properties } = rule;
        const isSecurityRule = (_a = properties === null || properties === void 0 ? void 0 : properties.categories) === null || _a === void 0 ? void 0 : _a.some((category) => category.toLowerCase() === 'security');
        if (isSecurityRule) {
            acc[ruleId] = rule;
        }
        return acc;
    }, {});
    return securityRulesMap;
}
function getSecurityResultsOnly(results, securityRules) {
    const securityResults = results.reduce((acc, result) => {
        const isSecurityResult = securityRules.some((securityRule) => securityRule === (result === null || result === void 0 ? void 0 : result.ruleId));
        if (isSecurityResult) {
            acc.push(result);
        }
        return acc;
    }, []);
    return securityResults;
}
function isLocalCodeEngine(sastSettings) {
    const { sastEnabled, localCodeEngine } = sastSettings;
    return sastEnabled && localCodeEngine.enabled;
}
function validateLocalCodeEngineUrl(localCodeEngineUrl) {
    if (localCodeEngineUrl.length === 0) {
        throw new errors_1.MissingConfigurationError('Snyk Code Local Engine. Refer to our docs on https://docs.snyk.io/products/snyk-code/deployment-options/snyk-code-local-engine/cli-and-ide to learn more');
    }
}


/***/ }),

/***/ 15976:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.trackUsage = exports.getSastSettingsForOrg = void 0;
const request_1 = __webpack_require__(52050);
const api_token_1 = __webpack_require__(95181);
const config_1 = __webpack_require__(22541);
const common_1 = __webpack_require__(53110);
async function getSastSettingsForOrg(org) {
    const response = await request_1.makeRequest({
        method: 'GET',
        headers: {
            Authorization: `token ${api_token_1.api()}`,
        },
        qs: common_1.assembleQueryString({ org }),
        url: `${config_1.default.API}/cli-config/settings/sast`,
        gzip: true,
        json: true,
    });
    return response.body;
}
exports.getSastSettingsForOrg = getSastSettingsForOrg;
async function trackUsage(org) {
    const response = await request_1.makeRequest({
        method: 'POST',
        headers: {
            Authorization: `token ${api_token_1.api()}`,
        },
        qs: common_1.assembleQueryString({ org }),
        url: `${config_1.default.API}/track-sast-usage/cli`,
        gzip: true,
        json: true,
    });
    return response.body;
}
exports.trackUsage = trackUsage;


/***/ }),

/***/ 61315:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var missing_configuration_error_1 = __webpack_require__(73016);
Object.defineProperty(exports, "MissingConfigurationError", ({ enumerable: true, get: function () { return missing_configuration_error_1.MissingConfigurationError; } }));
var unsupported_feature_snyk_code_error_1 = __webpack_require__(90551);
Object.defineProperty(exports, "FeatureNotSupportedBySnykCodeError", ({ enumerable: true, get: function () { return unsupported_feature_snyk_code_error_1.FeatureNotSupportedBySnykCodeError; } }));


/***/ }),

/***/ 73016:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.MissingConfigurationError = void 0;
const custom_error_1 = __webpack_require__(17188);
class MissingConfigurationError extends custom_error_1.CustomError {
    constructor(action, additionalUserHelp = '') {
        super(`Missing configuration for ${action}.`);
        this.code = 422;
        this.action = action;
        this.userMessage = `'Configuration is missing or wrong for ${action}'. ${additionalUserHelp}`;
    }
}
exports.MissingConfigurationError = MissingConfigurationError;


/***/ }),

/***/ 90551:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.FeatureNotSupportedBySnykCodeError = void 0;
const custom_error_1 = __webpack_require__(17188);
class FeatureNotSupportedBySnykCodeError extends custom_error_1.CustomError {
    constructor(feature, additionalUserHelp = '') {
        super(`Unsupported action for ${feature}.`);
        this.code = 422;
        this.feature = feature;
        this.userMessage = `'${feature}' is not supported for snyk code. ${additionalUserHelp}`;
    }
}
exports.FeatureNotSupportedBySnykCodeError = FeatureNotSupportedBySnykCodeError;


/***/ }),

/***/ 75802:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.getPrefix = exports.getMeta = exports.getCodeDisplayedOutput = void 0;
const Debug = __webpack_require__(15158);
const chalk_1 = __webpack_require__(32589);
const theme_1 = __webpack_require__(86988);
const common_1 = __webpack_require__(53110);
const right_pad_1 = __webpack_require__(80627);
const debug = Debug('code-output');
function getCodeDisplayedOutput(codeTest, meta, prefix) {
    let issues = {};
    if (codeTest.runs[0].results) {
        const results = codeTest.runs[0].results;
        const rulesMap = getRulesMap(codeTest.runs[0].tool.driver.rules || []);
        issues = getIssues(results, rulesMap);
    }
    const issuesText = issues.low.join('') + issues.medium.join('') + issues.high.join('');
    const summaryOKText = theme_1.color.status.success(`${theme_1.icon.VALID} Test completed`);
    const codeIssueSummary = getCodeIssuesSummary(issues);
    return (prefix +
        issuesText +
        '\n' +
        summaryOKText +
        '\n\n' +
        meta +
        '\n\n' +
        codeIssueSummary);
}
exports.getCodeDisplayedOutput = getCodeDisplayedOutput;
function getCodeIssuesSummary(issues) {
    const lowSeverityText = issues.low.length
        ? common_1.colorTextBySeverity(common_1.SEVERITY.LOW, ` ${issues.low.length} [Low] `)
        : '';
    const mediumSeverityText = issues.medium.length
        ? common_1.colorTextBySeverity(common_1.SEVERITY.MEDIUM, ` ${issues.medium.length} [Medium] `)
        : '';
    const highSeverityText = issues.high.length
        ? common_1.colorTextBySeverity(common_1.SEVERITY.HIGH, `${issues.high.length} [High] `)
        : '';
    const codeIssueCount = issues.low.length + issues.medium.length + issues.high.length;
    const codeIssueFound = `${codeIssueCount} Code issue${codeIssueCount > 0 ? 's' : ''} found`;
    const issuesBySeverityText = highSeverityText + mediumSeverityText + lowSeverityText;
    const vulnPathsText = theme_1.color.status.success(`${theme_1.icon.VALID} Awesome! No issues were found.`);
    return codeIssueCount > 0
        ? codeIssueFound + '\n' + issuesBySeverityText
        : vulnPathsText;
}
function getIssues(results, rulesMap) {
    const issuesInit = {
        low: [],
        medium: [],
        high: [],
    };
    const issues = results.reduce((acc, res) => {
        var _a, _b;
        if ((_a = res.locations) === null || _a === void 0 ? void 0 : _a.length) {
            const location = res.locations[0].physicalLocation;
            if (res.level && (location === null || location === void 0 ? void 0 : location.artifactLocation) && (location === null || location === void 0 ? void 0 : location.region)) {
                const severity = sarifToSeverityLevel(res.level);
                const ruleId = res.ruleId;
                if (!(ruleId in rulesMap)) {
                    debug('Rule ID does not exist in the rules list');
                }
                const ruleName = ((_b = rulesMap[ruleId].shortDescription) === null || _b === void 0 ? void 0 : _b.text) || rulesMap[ruleId].name;
                const ruleIdSeverityText = common_1.colorTextBySeverity(severity, ` ${theme_1.icon.ISSUE} [${severity}] ${ruleName}`);
                const artifactLocationUri = location.artifactLocation.uri;
                const startLine = location.region.startLine;
                const text = res.message.text;
                const title = ruleIdSeverityText;
                const path = `    Path: ${artifactLocationUri}, line ${startLine}`;
                const info = `    Info: ${text}`;
                acc[severity.toLowerCase()].push(`${title} \n ${path} \n ${info}\n\n`);
            }
        }
        return acc;
    }, issuesInit);
    return issues;
}
function getRulesMap(rules) {
    const rulesMapByID = rules.reduce((acc, rule) => {
        acc[rule.id] = rule;
        return acc;
    }, {});
    return rulesMapByID;
}
function sarifToSeverityLevel(sarifConfigurationLevel) {
    const severityLevel = {
        note: 'Low',
        warning: 'Medium',
        error: 'High',
    };
    return severityLevel[sarifConfigurationLevel];
}
function getMeta(options, path) {
    const padToLength = 19; // chars to align
    const orgName = options.org;
    const projectPath = options.path || path;
    const meta = [
        chalk_1.default.bold(right_pad_1.rightPadWithSpaces('Organization: ', padToLength)) + orgName,
    ];
    meta.push(chalk_1.default.bold(right_pad_1.rightPadWithSpaces('Test type: ', padToLength)) +
        'Static code analysis');
    meta.push(chalk_1.default.bold(right_pad_1.rightPadWithSpaces('Project path: ', padToLength)) + projectPath);
    return meta.join('\n');
}
exports.getMeta = getMeta;
function getPrefix(path) {
    return chalk_1.default.bold.white('\nTesting ' + path + ' ...\n\n');
}
exports.getPrefix = getPrefix;


/***/ }),

/***/ 93221:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.codePlugin = void 0;
const chalk_1 = __webpack_require__(32589);
const debugLib = __webpack_require__(15158);
const uuid_1 = __webpack_require__(42277);
const analysis_1 = __webpack_require__(2806);
const settings_1 = __webpack_require__(24930);
const output_format_1 = __webpack_require__(75802);
const errors_1 = __webpack_require__(55191);
const json_1 = __webpack_require__(27019);
const analytics = __webpack_require__(82744);
const debug = debugLib('snyk-code');
exports.codePlugin = {
    // We currently don't use scan/display. we will need to consolidate ecosystem plugins
    // to accept flows that act differently in the `testDependencies` step, as we have here
    async scan() {
        return null;
    },
    async display() {
        return '';
    },
    async test(paths, options) {
        var _a, _b, _c, _d;
        const requestId = uuid_1.v4();
        debug(`Request ID: ${requestId}`);
        try {
            analytics.add('sast-scan', true);
            const sastSettings = await settings_1.getSastSettings(options);
            // Currently code supports only one path
            const path = paths[0];
            const sarifTypedResult = await analysis_1.getCodeAnalysisAndParseResults(path, options, sastSettings, requestId);
            if (!sarifTypedResult) {
                throw new errors_1.NoSupportedSastFiles();
            }
            const numOfIssues = ((_b = (_a = sarifTypedResult.runs) === null || _a === void 0 ? void 0 : _a[0].results) === null || _b === void 0 ? void 0 : _b.length) || 0;
            analytics.add('sast-issues-found', numOfIssues);
            let newOrg = options.org;
            if (!newOrg && sastSettings.org) {
                newOrg = sastSettings.org;
            }
            const meta = output_format_1.getMeta({ ...options, org: newOrg }, path);
            const prefix = output_format_1.getPrefix(path);
            let readableResult = output_format_1.getCodeDisplayedOutput(sarifTypedResult, meta, prefix);
            let sarifResult;
            if (numOfIssues > 0 && options['no-markdown']) {
                (_d = (_c = sarifTypedResult.runs) === null || _c === void 0 ? void 0 : _c[0].results) === null || _d === void 0 ? void 0 : _d.forEach(({ message }) => {
                    delete message.markdown;
                });
            }
            if (options['sarif-file-output']) {
                sarifResult = json_1.jsonStringifyLargeObject(sarifTypedResult);
            }
            if (options.sarif || options.json) {
                readableResult = json_1.jsonStringifyLargeObject(sarifTypedResult);
            }
            if (numOfIssues > 0) {
                hasIssues(readableResult, sarifResult);
            }
            return sarifResult ? { readableResult, sarifResult } : { readableResult };
        }
        catch (error) {
            let err;
            if (isCodeClientError(error)) {
                const isUnauthorized = isUnauthorizedError(error)
                    ? 'Unauthorized: '
                    : '';
                err = new errors_1.FailedToRunTestError(`${isUnauthorized}Failed to run 'code test'`, error.statusCode);
            }
            else if (error instanceof Error) {
                err = error;
            }
            else if (isUnauthorizedError(error)) {
                err = new errors_1.FailedToRunTestError(error.message, error.code);
            }
            else {
                err = new Error(error);
            }
            debug(chalk_1.default.bold.red(`requestId: ${requestId} statusCode:${error.code ||
                error.statusCode}, message: ${error.statusText || error.message}`));
            throw err;
        }
    },
};
function isCodeClientError(error) {
    return (error.hasOwnProperty('statusCode') &&
        error.hasOwnProperty('statusText') &&
        error.hasOwnProperty('apiName'));
}
function isUnauthorizedError(error) {
    return (error.statusCode === 401 ||
        error.statusCode === 403 ||
        error.code === 403 ||
        error.code === 401);
}
function hasIssues(readableResult, sarifResult) {
    const err = new Error(readableResult);
    err.code = 'VULNS';
    if (sarifResult !== undefined) {
        err.sarifStringifiedResults = sarifResult;
    }
    throw err;
}


/***/ }),

/***/ 24930:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.getSastSettings = void 0;
const config_1 = __webpack_require__(22541);
const checks_1 = __webpack_require__(15976);
const errors_1 = __webpack_require__(55191);
async function getSastSettings(options) {
    const org = options.org || config_1.default.org;
    // This is an unexpected path, code plugin executed for non-code command.
    if (!options.code) {
        throw new errors_1.FeatureNotSupportedForOrgError(org);
    }
    const sastSettingsResponse = await checks_1.getSastSettingsForOrg(org);
    if ((sastSettingsResponse === null || sastSettingsResponse === void 0 ? void 0 : sastSettingsResponse.code) === 401 ||
        (sastSettingsResponse === null || sastSettingsResponse === void 0 ? void 0 : sastSettingsResponse.code) === 403) {
        throw errors_1.AuthFailedError(sastSettingsResponse.error, sastSettingsResponse.code);
    }
    if ((sastSettingsResponse === null || sastSettingsResponse === void 0 ? void 0 : sastSettingsResponse.code) === 404) {
        throw new errors_1.NotFoundError(sastSettingsResponse === null || sastSettingsResponse === void 0 ? void 0 : sastSettingsResponse.userMessage);
    }
    if (!sastSettingsResponse.sastEnabled) {
        throw new errors_1.FeatureNotSupportedForOrgError(org, 'Snyk Code', 'enable in Settings > Snyk Code');
    }
    const trackUsageResponse = await checks_1.trackUsage(org);
    if (trackUsageResponse.code === 429) {
        throw new errors_1.FailedToRunTestError(trackUsageResponse.userMessage, trackUsageResponse.code);
    }
    return sastSettingsResponse;
}
exports.getSastSettings = getSastSettings;


/***/ }),

/***/ 33113:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var testEmitter_1 = __webpack_require__(83901);
Object.defineProperty(exports, "analysisProgressUpdate", ({ enumerable: true, get: function () { return testEmitter_1.analysisProgressUpdate; } }));


/***/ }),

/***/ 83901:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.analysisProgressUpdate = void 0;
const code_client_1 = __webpack_require__(95951);
const spinner_1 = __webpack_require__(86766);
function analysisProgressUpdate() {
    let currentMessage = '';
    const showSpinner = (message) => {
        if (currentMessage === message)
            return;
        spinner_1.spinner.clear(currentMessage)();
        currentMessage = message;
        return spinner_1.spinner(message);
    };
    code_client_1.emitter.on('supportedFilesLoaded', () => showSpinner(`Supported extensions loaded`));
    code_client_1.emitter.on('scanFilesProgress', (processed) => showSpinner(`Scanning files: ${Math.round(processed / 100)}00`));
    code_client_1.emitter.on('createBundleProgress', (processed, total) => showSpinner(`Batching file upload: ${processed} / ${total}`));
    code_client_1.emitter.on('uploadBundleProgress', (processed, total) => showSpinner(`Upload progress: ${processed} / ${total}`));
    code_client_1.emitter.on('analyseProgress', (data) => showSpinner(`${data.status}: ${Math.round(data.progress * 100)}%`));
    code_client_1.emitter.on('sendError', (error) => {
        throw error;
    });
}
exports.analysisProgressUpdate = analysisProgressUpdate;


/***/ }),

/***/ 8820:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.findAndLoadPolicy = void 0;
const snykPolicyLib = __webpack_require__(70535);
const debugModule = __webpack_require__(15158);
const _1 = __webpack_require__(32615);
const analytics = __webpack_require__(82744);
const debug = debugModule('snyk');
async function findAndLoadPolicy(root, scanType, options, pkg, scannedProjectFolder) {
    const isDocker = scanType === 'docker';
    const isNodeProject = ['npm', 'yarn'].includes(scanType);
    // monitor
    let policyLocations = [
        options['policy-path'] || scannedProjectFolder || root,
    ];
    if (isDocker) {
        policyLocations = policyLocations.filter((loc) => loc !== root);
    }
    else if (isNodeProject) {
        // TODO: pluckPolicies expects a package.json object to
        // find and apply policies in node_modules
        policyLocations = policyLocations.concat(_1.pluckPolicies(pkg));
    }
    debug('Potential policy locations found:', policyLocations);
    analytics.add('policies', policyLocations.length);
    analytics.add('policyLocations', policyLocations);
    if (policyLocations.length === 0) {
        return;
    }
    let policy;
    try {
        policy = await snykPolicyLib.load(policyLocations, options);
    }
    catch (err) {
        // note: inline catch, to handle error from .load
        // if the .snyk file wasn't found, it is fine
        if (err.code !== 'ENOENT' && err.code !== 'ENOTDIR') {
            throw err;
        }
    }
    return policy;
}
exports.findAndLoadPolicy = findAndLoadPolicy;


/***/ }),

/***/ 32615:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var pluck_policies_1 = __webpack_require__(68247);
Object.defineProperty(exports, "pluckPolicies", ({ enumerable: true, get: function () { return pluck_policies_1.pluckPolicies; } }));
var find_and_load_policy_1 = __webpack_require__(8820);
Object.defineProperty(exports, "findAndLoadPolicy", ({ enumerable: true, get: function () { return find_and_load_policy_1.findAndLoadPolicy; } }));


/***/ }),

/***/ 68247:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.pluckPolicies = void 0;
const flatten = __webpack_require__(5800);
function pluckPolicies(pkg) {
    if (!pkg) {
        return [];
    }
    if (pkg.snyk) {
        return pkg.snyk;
    }
    if (!pkg.dependencies) {
        return [];
    }
    return flatten(Object.keys(pkg.dependencies)
        .map((name) => pluckPolicies(pkg.dependencies[name]))
        .filter(Boolean));
}
exports.pluckPolicies = pluckPolicies;


/***/ }),

/***/ 74434:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.extractResolutionMetaFromScanResult = exports.delayNextStep = void 0;
const common_1 = __webpack_require__(70527);
async function delayNextStep(attemptsCount, maxAttempts, pollInterval) {
    attemptsCount++;
    checkPollingAttempts(maxAttempts)(attemptsCount);
    await common_1.sleep(pollInterval);
}
exports.delayNextStep = delayNextStep;
function checkPollingAttempts(maxAttempts) {
    return (attemptsCount) => {
        if (attemptsCount > maxAttempts) {
            throw new Error('Exceeded Polling maxAttempts');
        }
    };
}
function extractResolutionMetaFromScanResult({ name, target, identity, policy, }) {
    return {
        name,
        target,
        identity,
        policy,
    };
}
exports.extractResolutionMetaFromScanResult = extractResolutionMetaFromScanResult;


/***/ }),

/***/ 59354:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.pollingMonitorWithTokenUntilDone = exports.requestMonitorPollingToken = void 0;
const config_1 = __webpack_require__(22541);
const is_ci_1 = __webpack_require__(10090);
const promise_1 = __webpack_require__(90430);
const common_1 = __webpack_require__(53110);
const api_token_1 = __webpack_require__(95181);
const common_2 = __webpack_require__(74434);
const monitor_1 = __webpack_require__(3708);
async function requestMonitorPollingToken(options, isAsync, scanResult) {
    if ((scanResult === null || scanResult === void 0 ? void 0 : scanResult.target) && scanResult.target['remoteUrl'] === '') {
        scanResult.target['remoteUrl'] = scanResult.name;
    }
    const payload = {
        method: 'PUT',
        url: `${config_1.default.API}/monitor-dependencies`,
        json: true,
        headers: {
            'x-is-ci': is_ci_1.isCI(),
            authorization: api_token_1.getAuthHeader(),
        },
        body: {
            isAsync,
            scanResult,
            method: 'cli',
        },
        qs: { ...common_1.assembleQueryString(options) },
    };
    return await promise_1.makeRequest(payload);
}
exports.requestMonitorPollingToken = requestMonitorPollingToken;
async function pollingMonitorWithTokenUntilDone(token, isAsync, options, pollInterval, attemptsCount, maxAttempts = Infinity, resolutionMeta) {
    const payload = {
        method: 'PUT',
        url: `${config_1.default.API}/monitor-dependencies/${token}`,
        json: true,
        headers: {
            'x-is-ci': is_ci_1.isCI(),
            authorization: api_token_1.getAuthHeader(),
        },
        qs: { ...common_1.assembleQueryString(options) },
        body: {
            isAsync,
            resolutionMeta,
            method: 'cli',
            tags: monitor_1.generateTags(options),
            attributes: monitor_1.generateProjectAttributes(options),
            projectName: (resolutionMeta === null || resolutionMeta === void 0 ? void 0 : resolutionMeta.name) || options['project-name'] || config_1.default.PROJECT_NAME,
        },
    };
    const response = await promise_1.makeRequest(payload);
    if (response.ok && response.isMonitored) {
        return response;
    }
    await common_2.delayNextStep(attemptsCount, maxAttempts, pollInterval);
    return await pollingMonitorWithTokenUntilDone(token, isAsync, options, pollInterval, attemptsCount, maxAttempts, resolutionMeta);
}
exports.pollingMonitorWithTokenUntilDone = pollingMonitorWithTokenUntilDone;


/***/ }),

/***/ 77584:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.pollingTestWithTokenUntilDone = exports.requestTestPollingToken = void 0;
const config_1 = __webpack_require__(22541);
const is_ci_1 = __webpack_require__(10090);
const promise_1 = __webpack_require__(90430);
const common_1 = __webpack_require__(53110);
const api_token_1 = __webpack_require__(95181);
const common_2 = __webpack_require__(74434);
async function requestTestPollingToken(options, isAsync, scanResult) {
    const payload = {
        method: 'POST',
        url: `${config_1.default.API}/test-dependencies`,
        json: true,
        headers: {
            'x-is-ci': is_ci_1.isCI(),
            authorization: api_token_1.getAuthHeader(),
        },
        body: {
            isAsync,
            scanResult,
        },
        qs: common_1.assembleQueryString(options),
    };
    return await promise_1.makeRequest(payload);
}
exports.requestTestPollingToken = requestTestPollingToken;
async function pollingTestWithTokenUntilDone(token, type, options, pollInterval, attemptsCount, maxAttempts = Infinity) {
    const payload = {
        method: 'GET',
        url: `${config_1.default.API}/test-dependencies/${token}`,
        json: true,
        headers: {
            'x-is-ci': is_ci_1.isCI(),
            authorization: api_token_1.getAuthHeader(),
        },
        qs: { ...common_1.assembleQueryString(options), type },
    };
    const response = await promise_1.makeRequest(payload);
    if (response.result) {
        const { issues, issuesData, depGraphData, depsFilePaths, fileSignaturesDetails, } = response.result;
        return {
            issues,
            issuesData,
            depGraphData,
            depsFilePaths,
            fileSignaturesDetails,
        };
    }
    await common_2.delayNextStep(attemptsCount, maxAttempts, pollInterval);
    return await pollingTestWithTokenUntilDone(token, type, options, pollInterval, attemptsCount, maxAttempts);
}
exports.pollingTestWithTokenUntilDone = pollingTestWithTokenUntilDone;


/***/ }),

/***/ 79792:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.maybePrintDepTree = exports.maybePrintDepGraph = void 0;
const config_1 = __webpack_require__(22541);
const depGraphLib = __webpack_require__(71479);
const utils_1 = __webpack_require__(61721);
const json_1 = __webpack_require__(27019);
async function maybePrintDepGraph(options, depGraph) {
    // TODO @boost: remove this logic once we get a valid depGraph print format
    const graphPathsCount = utils_1.countPathsToGraphRoot(depGraph);
    const hasTooManyPaths = graphPathsCount > config_1.default.PRUNE_DEPS_THRESHOLD;
    if (!hasTooManyPaths) {
        const depTree = (await depGraphLib.legacy.graphToDepTree(depGraph, depGraph.pkgManager.name));
        maybePrintDepTree(options, depTree);
    }
    else {
        if (options['print-deps']) {
            if (options.json) {
                console.warn('--print-deps --json option not yet supported for large projects. Displaying graph json output instead');
                // TODO @boost: add as output graphviz 'dot' file to visualize?
                console.log(json_1.jsonStringifyLargeObject(depGraph.toJSON()));
            }
            else {
                console.warn('--print-deps option not yet supported for large projects. Try with --json.');
            }
        }
    }
}
exports.maybePrintDepGraph = maybePrintDepGraph;
// This option is still experimental and might be deprecated.
// It might be a better idea to convert it to a command (i.e. do not perform test/monitor).
function maybePrintDepTree(options, rootPackage) {
    if (options['print-deps']) {
        if (options.json) {
            // Will produce 2 JSON outputs, one for the deps, one for the vuln scan.
            console.log(json_1.jsonStringifyLargeObject(rootPackage));
        }
        else {
            printDepsForTree({ [rootPackage.name]: rootPackage });
        }
    }
}
exports.maybePrintDepTree = maybePrintDepTree;
function printDepsForTree(depDict, prefix = '') {
    let counter = 0;
    const keys = Object.keys(depDict);
    for (const name of keys) {
        const dep = depDict[name];
        let branch = '├─ ';
        const last = counter === keys.length - 1;
        if (last) {
            branch = '└─ ';
        }
        console.log(prefix +
            (prefix ? branch : '') +
            dep.name +
            ' @ ' +
            (dep.version ? dep.version : ''));
        if (dep.dependencies) {
            printDepsForTree(dep.dependencies, prefix + (last ? '   ' : '│  '));
        }
        counter++;
    }
}


/***/ }),

/***/ 3594:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.getInfo = void 0;
const gitTargetBuilder = __webpack_require__(24850);
const containerTargetBuilder = __webpack_require__(57493);
const invalid_remote_url_error_1 = __webpack_require__(86033);
const TARGET_BUILDERS = [containerTargetBuilder, gitTargetBuilder];
async function getInfo(scannedProject, options, packageInfo) {
    const isFromContainer = options.docker || options.isDocker || false;
    for (const builder of TARGET_BUILDERS) {
        const target = await builder.getInfo(isFromContainer, scannedProject, packageInfo);
        if (target) {
            const remoteUrl = options['remote-repo-url'];
            if (!remoteUrl) {
                return target;
            }
            if (typeof remoteUrl !== 'string') {
                throw new invalid_remote_url_error_1.InvalidRemoteUrlError();
            }
            return { ...target, remoteUrl };
        }
    }
    return null;
}
exports.getInfo = getInfo;


/***/ }),

/***/ 57493:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.getInfo = void 0;
async function getInfo(isFromContainer, scannedProject, packageInfo) {
    var _a;
    // safety check
    if (!isFromContainer) {
        return null;
    }
    const imageNameOnProjectMeta = scannedProject.meta && scannedProject.meta.imageName;
    return {
        image: imageNameOnProjectMeta || ((_a = packageInfo) === null || _a === void 0 ? void 0 : _a.image) || (packageInfo === null || packageInfo === void 0 ? void 0 : packageInfo.name),
    };
}
exports.getInfo = getInfo;


/***/ }),

/***/ 24850:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.getInfo = void 0;
const url = __webpack_require__(78835);
const subProcess = __webpack_require__(66487);
// for scp-like syntax [user@]server:project.git
const originRegex = /(.+@)?(.+):(.+$)/;
async function getInfo(isFromContainer) {
    // safety check
    if (isFromContainer) {
        return null;
    }
    const target = {};
    try {
        const origin = (await subProcess.execute('git', ['remote', 'get-url', 'origin'])).trim();
        if (origin) {
            const { protocol, host, pathname = '' } = url.parse(origin);
            // Not handling git:// as it has no connection options
            if (host && protocol && ['ssh:', 'http:', 'https:'].includes(protocol)) {
                // same format for parseable URLs
                target.remoteUrl = `http://${host}${pathname}`;
            }
            else {
                const originRes = originRegex.exec(origin);
                if (originRes && originRes[2] && originRes[3]) {
                    target.remoteUrl = `http://${originRes[2]}/${originRes[3]}`;
                }
                else {
                    // else keep the original
                    target.remoteUrl = origin;
                }
            }
        }
    }
    catch (err) {
        // Swallowing exception since we don't want to break the monitor if there is a problem
        // executing git commands.
    }
    try {
        target.branch = (await subProcess.execute('git', ['rev-parse', '--abbrev-ref', 'HEAD'])).trim();
    }
    catch (err) {
        // Swallowing exception since we don't want to break the monitor if there is a problem
        // executing git commands.
    }
    return target;
}
exports.getInfo = getInfo;


/***/ }),

/***/ 39409:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.isGitTarget = void 0;
function isGitTarget(target) {
    return target && (target.branch || target.remoteUrl);
}
exports.isGitTarget = isGitTarget;


/***/ }),

/***/ 87725:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.pruneGraph = void 0;
const _debug = __webpack_require__(15158);
const dep_graph_1 = __webpack_require__(71479);
const config_1 = __webpack_require__(22541);
const errors_1 = __webpack_require__(55191);
const analytics = __webpack_require__(82744);
const utils_1 = __webpack_require__(61721);
const debug = _debug('snyk:prune');
const { depTreeToGraph, graphToDepTree } = dep_graph_1.legacy;
async function pruneGraph(depGraph, packageManager, pruneIsRequired = false) {
    const prePrunePathsCount = utils_1.countPathsToGraphRoot(depGraph);
    const isDenseGraph = prePrunePathsCount > config_1.default.PRUNE_DEPS_THRESHOLD;
    debug('rootPkg', depGraph.rootPkg);
    debug('prePrunePathsCount: ' + prePrunePathsCount);
    debug('isDenseGraph', isDenseGraph);
    analytics.add('prePrunedPathsCount', prePrunePathsCount);
    if (isDenseGraph || pruneIsRequired) {
        debug('Trying to prune the graph');
        const pruneStartTime = Date.now();
        const prunedTree = (await graphToDepTree(depGraph, packageManager, {
            deduplicateWithinTopLevelDeps: true,
        }));
        const graphToTreeEndTime = Date.now();
        analytics.add('prune.graphToTreeDuration', graphToTreeEndTime - pruneStartTime);
        const prunedGraph = await depTreeToGraph(prunedTree, packageManager);
        analytics.add('prune.treeToGraphDuration', Date.now() - graphToTreeEndTime);
        const postPrunePathsCount = utils_1.countPathsToGraphRoot(prunedGraph);
        analytics.add('postPrunedPathsCount', postPrunePathsCount);
        debug('postPrunePathsCount' + postPrunePathsCount);
        if (postPrunePathsCount > config_1.default.MAX_PATH_COUNT) {
            debug('Too many paths to process the project');
            //TODO replace the throw below with TooManyPaths we do not calculate vuln paths there
            throw new errors_1.TooManyVulnPaths();
        }
        return prunedGraph;
    }
    return depGraph;
}
exports.pruneGraph = pruneGraph;


/***/ }),

/***/ 86978:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.validatePayload = exports.serializeCallGraphWithMetrics = void 0;
const graphlib = __webpack_require__(39322);
const package_managers_1 = __webpack_require__(53847);
const feature_flags_1 = __webpack_require__(63011);
const errors_1 = __webpack_require__(55191);
const is_multi_project_scan_1 = __webpack_require__(62435);
const featureFlag = 'reachableVulns';
function serializeCallGraphWithMetrics(callGraph) {
    return {
        callGraph: graphlib.json.write(callGraph),
        nodeCount: callGraph.nodeCount(),
        edgeCount: callGraph.edgeCount(),
    };
}
exports.serializeCallGraphWithMetrics = serializeCallGraphWithMetrics;
async function validatePayload(org, options, packageManager) {
    if (packageManager &&
        !is_multi_project_scan_1.isMultiProjectScan(options) &&
        !package_managers_1.REACHABLE_VULNS_SUPPORTED_PACKAGE_MANAGERS.includes(packageManager)) {
        throw new errors_1.FeatureNotSupportedByPackageManagerError('Reachable vulns', packageManager, `For a list of supported package managers go to https://support.snyk.io/hc/en-us/articles/360010554837-Reachable-Vulnerabilities`);
    }
    const reachableVulnsSupportedRes = await feature_flags_1.isFeatureFlagSupportedForOrg(featureFlag, org);
    if (reachableVulnsSupportedRes.code === 401) {
        throw errors_1.AuthFailedError(reachableVulnsSupportedRes.error, reachableVulnsSupportedRes.code);
    }
    if (reachableVulnsSupportedRes.userMessage) {
        throw new errors_1.UnsupportedFeatureFlagError(featureFlag, reachableVulnsSupportedRes.userMessage);
    }
    return true;
}
exports.validatePayload = validatePayload;


/***/ }),

/***/ 90430:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.makeRequestRest = exports.makeRequest = void 0;
const api_token_1 = __webpack_require__(95181);
const request = __webpack_require__(52050);
async function makeRequest(payload) {
    return new Promise((resolve, reject) => {
        request.makeRequest(payload, (error, res, body) => {
            if (error) {
                return reject(error);
            }
            if (res.statusCode !== 200) {
                return reject({
                    code: res.statusCode,
                    message: body === null || body === void 0 ? void 0 : body.message,
                });
            }
            resolve(body);
        });
    });
}
exports.makeRequest = makeRequest;
/**
 * All rest request will essentially be the same and are JSON by default
 * Thus if no headers provided default headers are used
 * @param {any} payload for the request
 * @returns
 */
async function makeRequestRest(payload) {
    return new Promise((resolve, reject) => {
        var _a;
        payload.headers = (_a = payload.headers) !== null && _a !== void 0 ? _a : {
            'Content-Type': 'application/vnd.api+json',
            authorization: api_token_1.getAuthHeader(),
        };
        payload.json = true;
        request.makeRequest(payload, (error, res, body) => {
            if (error) {
                return reject(error);
            }
            if (res.statusCode >= 400) {
                return reject({
                    code: res.statusCode,
                    body: JSON.parse(body),
                });
            }
            resolve(JSON.parse(body));
        });
    });
}
exports.makeRequestRest = makeRequestRest;


/***/ }),

/***/ 80627:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.rightPadWithSpaces = void 0;
function rightPadWithSpaces(s, padding) {
    const padLength = padding - s.length;
    if (padLength <= 0) {
        return s;
    }
    return s + ' '.repeat(padLength);
}
exports.rightPadWithSpaces = rightPadWithSpaces;


/***/ }),

/***/ 38080:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.assembleEcosystemPayloads = void 0;
const path = __webpack_require__(85622);
const config_1 = __webpack_require__(22541);
const is_ci_1 = __webpack_require__(10090);
const ecosystems_1 = __webpack_require__(5168);
const common_1 = __webpack_require__(53110);
const spinner_1 = __webpack_require__(86766);
const policy_1 = __webpack_require__(4669);
const api_token_1 = __webpack_require__(95181);
const errors_1 = __webpack_require__(55191);
async function assembleEcosystemPayloads(ecosystem, options) {
    // For --all-projects packageManager is yet undefined here. Use 'all'
    let analysisTypeText = 'all dependencies for ';
    if (options.docker) {
        analysisTypeText = 'container dependencies for ';
    }
    else if (options.packageManager) {
        analysisTypeText = options.packageManager + ' dependencies for ';
    }
    const spinnerLbl = 'Analyzing ' +
        analysisTypeText +
        (path.relative('.', path.join(options.path, options.file || '')) ||
            path.relative('..', '.') + ' project dir');
    spinner_1.spinner.clear(spinnerLbl)();
    if (!options.quiet) {
        await spinner_1.spinner(spinnerLbl);
    }
    try {
        const plugin = ecosystems_1.getPlugin(ecosystem);
        const pluginResponse = await plugin.scan(options);
        const payloads = [];
        // TODO: This is a temporary workaround until the plugins themselves can read policy files and set names!
        for (const scanResult of pluginResponse.scanResults) {
            // WARNING! This mutates the payload. Policy logic should be in the plugin.
            const policy = await policy_1.findAndLoadPolicyForScanResult(scanResult, options);
            if (policy !== undefined) {
                scanResult.policy = policy.toString();
            }
            // WARNING! This mutates the payload. The project name logic should be handled in the plugin.
            scanResult.name =
                options['project-name'] || config_1.default.PROJECT_NAME || scanResult.name;
            payloads.push({
                method: 'POST',
                url: `${config_1.default.API}${options.testDepGraphDockerEndpoint ||
                    '/test-dependencies'}`,
                json: true,
                headers: {
                    'x-is-ci': is_ci_1.isCI(),
                    authorization: api_token_1.getAuthHeader(),
                },
                body: {
                    scanResult,
                },
                qs: common_1.assembleQueryString(options),
            });
        }
        return payloads;
    }
    catch (error) {
        if (ecosystem === 'docker' && error.message === 'authentication required') {
            throw new errors_1.DockerImageNotFoundError(options.path);
        }
        if (ecosystem === 'docker' && error.message === 'invalid image format') {
            throw new errors_1.DockerImageNotFoundError(options.path);
        }
        throw error;
    }
    finally {
        spinner_1.spinner.clear(spinnerLbl)();
    }
}
exports.assembleEcosystemPayloads = assembleEcosystemPayloads;


/***/ }),

/***/ 34013:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.convertTestDepGraphResultToLegacy = exports.REACHABILITY = exports.SEVERITY = void 0;
const values = __webpack_require__(17720);
const common_1 = __webpack_require__(53110);
var SEVERITY;
(function (SEVERITY) {
    SEVERITY["LOW"] = "low";
    SEVERITY["MEDIUM"] = "medium";
    SEVERITY["HIGH"] = "high";
    SEVERITY["CRITICAL"] = "critical";
})(SEVERITY = exports.SEVERITY || (exports.SEVERITY = {}));
var REACHABILITY;
(function (REACHABILITY) {
    REACHABILITY["FUNCTION"] = "function";
    REACHABILITY["PACKAGE"] = "package";
    REACHABILITY["NOT_REACHABLE"] = "not-reachable";
    REACHABILITY["NO_INFO"] = "no-info";
})(REACHABILITY = exports.REACHABILITY || (exports.REACHABILITY = {}));
function convertTestDepGraphResultToLegacy(res, depGraph, packageManager, options) {
    const result = res.result;
    const upgradePathsMap = new Map();
    for (const pkgInfo of values(result.affectedPkgs)) {
        for (const pkgIssue of values(pkgInfo.issues)) {
            if (pkgIssue.fixInfo && pkgIssue.fixInfo.upgradePaths) {
                for (const upgradePath of pkgIssue.fixInfo.upgradePaths) {
                    const legacyFromPath = pkgPathToLegacyPath(upgradePath.path);
                    const vulnPathString = getVulnPathString(pkgIssue.issueId, legacyFromPath);
                    upgradePathsMap[vulnPathString] = toLegacyUpgradePath(upgradePath.path);
                }
            }
        }
    }
    // generate the legacy vulns array (vuln-data + metada per vulnerable path).
    //   use the upgradePathsMap to find available upgrade-paths
    const vulns = [];
    for (const pkgInfo of values(result.affectedPkgs)) {
        for (const vulnPkgPath of depGraph.pkgPathsToRoot(pkgInfo.pkg)) {
            const legacyFromPath = pkgPathToLegacyPath(vulnPkgPath.reverse());
            for (const pkgIssue of values(pkgInfo.issues)) {
                const vulnPathString = getVulnPathString(pkgIssue.issueId, legacyFromPath);
                const upgradePath = upgradePathsMap[vulnPathString] || [];
                // TODO: we need the full issue-data for every path only for the --json output,
                //   consider picking only the required fields,
                //   and append the full data only for --json, to minimize chance of out-of-memory
                const annotatedIssue = Object.assign({}, result.issuesData[pkgIssue.issueId], {
                    from: legacyFromPath,
                    upgradePath,
                    isUpgradable: !!upgradePath[0] || !!upgradePath[1],
                    isPatchable: pkgIssue.fixInfo.isPatchable,
                    name: pkgInfo.pkg.name,
                    version: pkgInfo.pkg.version,
                    nearestFixedInVersion: pkgIssue.fixInfo.nearestFixedInVersion,
                }); // TODO(kyegupov): get rid of type assertion
                vulns.push(annotatedIssue);
            }
        }
    }
    const dockerRes = result.docker;
    if (dockerRes && dockerRes.binariesVulns) {
        const binariesVulns = dockerRes.binariesVulns;
        for (const pkgInfo of values(binariesVulns.affectedPkgs)) {
            for (const pkgIssue of values(pkgInfo.issues)) {
                const pkgAndVersion = (pkgInfo.pkg.name +
                    '@' +
                    pkgInfo.pkg.version);
                const annotatedIssue = Object.assign({}, binariesVulns.issuesData[pkgIssue.issueId], {
                    from: ['Upstream', pkgAndVersion],
                    upgradePath: [],
                    isUpgradable: false,
                    isPatchable: false,
                    name: pkgInfo.pkg.name,
                    version: pkgInfo.pkg.version,
                    nearestFixedInVersion: pkgIssue.fixInfo.nearestFixedInVersion,
                }); // TODO(kyegupov): get rid of forced type assertion
                vulns.push(annotatedIssue);
            }
        }
    }
    const meta = res.meta || {};
    const severityThreshold = options.severityThreshold === SEVERITY.LOW
        ? undefined
        : options.severityThreshold;
    const legacyRes = {
        vulnerabilities: vulns,
        ok: vulns.length === 0,
        dependencyCount: depGraph.getPkgs().length - 1,
        org: meta.org,
        policy: meta.policy,
        isPrivate: !meta.isPublic,
        licensesPolicy: meta.licensesPolicy || null,
        packageManager,
        projectId: meta.projectId,
        ignoreSettings: meta.ignoreSettings || null,
        docker: result.docker,
        summary: getSummary(vulns, severityThreshold),
        severityThreshold,
        remediation: result.remediation,
    };
    return legacyRes;
}
exports.convertTestDepGraphResultToLegacy = convertTestDepGraphResultToLegacy;
function getVulnPathString(issueId, vulnPath) {
    return issueId + '|' + JSON.stringify(vulnPath);
}
function pkgPathToLegacyPath(pkgPath) {
    return pkgPath.map(toLegacyPkgId);
}
function toLegacyUpgradePath(upgradePath) {
    return upgradePath
        .filter((item) => !item.isDropped)
        .map((item) => {
        if (!item.newVersion) {
            return false;
        }
        return `${item.name}@${item.newVersion}`;
    });
}
function toLegacyPkgId(pkg) {
    return `${pkg.name}@${pkg.version || '*'}`;
}
function getSummary(vulns, severityThreshold) {
    const count = vulns.length;
    let countText = '' + count;
    const severityFilters = [];
    const severitiesArray = common_1.SEVERITIES.map((s) => s.verboseName);
    if (severityThreshold) {
        severitiesArray
            .slice(severitiesArray.indexOf(severityThreshold))
            .forEach((sev) => {
            severityFilters.push(sev);
        });
    }
    if (!count) {
        if (severityFilters.length) {
            return `No ${severityFilters.join(' or ')} severity vulnerabilities`;
        }
        return 'No known vulnerabilities';
    }
    if (severityFilters.length) {
        countText += ' ' + severityFilters.join(' or ') + ' severity';
    }
    return `${countText} vulnerable dependency ${pl('path', count)}`;
}
function pl(word, count) {
    const ext = {
        y: 'ies',
        default: 's',
    };
    const last = word.split('').pop();
    if (count > 1) {
        return word.slice(0, -1) + (ext[last] || last + ext.default);
    }
    return word;
}


/***/ }),

/***/ 7964:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.runTest = void 0;
const fs = __webpack_require__(35747);
const get = __webpack_require__(29208);
const path = __webpack_require__(85622);
const pathUtil = __webpack_require__(85622);
const debugModule = __webpack_require__(15158);
const chalk_1 = __webpack_require__(32589);
const theme_1 = __webpack_require__(86988);
const snyk_module_1 = __webpack_require__(60390);
const depGraphLib = __webpack_require__(71479);
const theme = __webpack_require__(86988);
const legacy_1 = __webpack_require__(34013);
const errors_1 = __webpack_require__(55191);
const snyk = __webpack_require__(9146);
const is_ci_1 = __webpack_require__(10090);
const common = __webpack_require__(53110);
const config_1 = __webpack_require__(22541);
const analytics = __webpack_require__(82744);
const print_deps_1 = __webpack_require__(79792);
const projectMetadata = __webpack_require__(3594);
const prune_1 = __webpack_require__(87725);
const get_deps_from_plugin_1 = __webpack_require__(4842);
const extract_package_manager_1 = __webpack_require__(22805);
const get_extra_project_count_1 = __webpack_require__(34355);
const reachable_vulns_1 = __webpack_require__(86978);
const options_validator_1 = __webpack_require__(1570);
const policy_1 = __webpack_require__(32615);
const alerts = __webpack_require__(21696);
const error_format_1 = __webpack_require__(59369);
const api_token_1 = __webpack_require__(95181);
const ecosystems_1 = __webpack_require__(5168);
const assemble_payloads_1 = __webpack_require__(38080);
const request_1 = __webpack_require__(52050);
const spinner_1 = __webpack_require__(86766);
const debug = debugModule('snyk:run-test');
const ANALYTICS_PAYLOAD_MAX_LENGTH = 1024;
function prepareResponseForParsing(payload, response, options) {
    const ecosystem = ecosystems_1.getEcosystem(options);
    return ecosystem
        ? prepareEcosystemResponseForParsing(payload, response, options)
        : prepareLanguagesResponseForParsing(payload);
}
function prepareEcosystemResponseForParsing(payload, response, options) {
    var _a, _b, _c, _d, _e, _f;
    const testDependenciesRequest = payload.body;
    const payloadBody = testDependenciesRequest === null || testDependenciesRequest === void 0 ? void 0 : testDependenciesRequest.scanResult;
    const depGraphData = (_a = response === null || response === void 0 ? void 0 : response.result) === null || _a === void 0 ? void 0 : _a.depGraphData;
    const depGraph = depGraphData !== undefined
        ? depGraphLib.createFromJSON(depGraphData)
        : undefined;
    const imageUserInstructions = payloadBody === null || payloadBody === void 0 ? void 0 : payloadBody.facts.find((fact) => fact.type === 'dockerfileAnalysis' ||
        fact.type === 'autoDetectedUserInstructions');
    const dockerfilePackages = (_b = imageUserInstructions === null || imageUserInstructions === void 0 ? void 0 : imageUserInstructions.data) === null || _b === void 0 ? void 0 : _b.dockerfilePackages;
    const projectName = (payloadBody === null || payloadBody === void 0 ? void 0 : payloadBody.name) || (depGraph === null || depGraph === void 0 ? void 0 : depGraph.rootPkg.name);
    const packageManager = (_c = payloadBody === null || payloadBody === void 0 ? void 0 : payloadBody.identity) === null || _c === void 0 ? void 0 : _c.type;
    const targetFile = ((_d = payloadBody === null || payloadBody === void 0 ? void 0 : payloadBody.identity) === null || _d === void 0 ? void 0 : _d.targetFile) || options.file;
    const platform = (_f = (_e = payloadBody === null || payloadBody === void 0 ? void 0 : payloadBody.identity) === null || _e === void 0 ? void 0 : _e.args) === null || _f === void 0 ? void 0 : _f.platform;
    analytics.add('depGraph', !!depGraph);
    analytics.add('isDocker', !!options.docker);
    return {
        depGraph,
        dockerfilePackages,
        projectName,
        targetFile,
        pkgManager: packageManager,
        displayTargetFile: targetFile,
        foundProjectCount: undefined,
        payloadPolicy: payloadBody === null || payloadBody === void 0 ? void 0 : payloadBody.policy,
        platform,
        scanResult: payloadBody,
    };
}
function prepareLanguagesResponseForParsing(payload) {
    const payloadBody = payload.body;
    const payloadPolicy = payloadBody && payloadBody.policy;
    const depGraph = payloadBody && payloadBody.depGraph;
    const pkgManager = depGraph &&
        depGraph.pkgManager &&
        depGraph.pkgManager.name;
    const targetFile = payloadBody && payloadBody.targetFile;
    const projectName = (payloadBody === null || payloadBody === void 0 ? void 0 : payloadBody.projectNameOverride) || (payloadBody === null || payloadBody === void 0 ? void 0 : payloadBody.originalProjectName);
    const foundProjectCount = payloadBody === null || payloadBody === void 0 ? void 0 : payloadBody.foundProjectCount;
    const displayTargetFile = payloadBody === null || payloadBody === void 0 ? void 0 : payloadBody.displayTargetFile;
    let dockerfilePackages;
    if (payloadBody &&
        payloadBody.docker &&
        payloadBody.docker.dockerfilePackages) {
        dockerfilePackages = payloadBody.docker.dockerfilePackages;
    }
    analytics.add('depGraph', !!depGraph);
    analytics.add('isDocker', !!(payloadBody && payloadBody.docker));
    return {
        depGraph,
        payloadPolicy,
        pkgManager,
        targetFile,
        projectName,
        foundProjectCount,
        displayTargetFile,
        dockerfilePackages,
    };
}
function isTestDependenciesResponse(response) {
    var _a;
    const assumedTestDependenciesResponse = response;
    return ((_a = assumedTestDependenciesResponse === null || assumedTestDependenciesResponse === void 0 ? void 0 : assumedTestDependenciesResponse.result) === null || _a === void 0 ? void 0 : _a.issues) !== undefined;
}
function convertIssuesToAffectedPkgs(response) {
    if (!response.result) {
        return response;
    }
    if (!isTestDependenciesResponse(response)) {
        return response;
    }
    response.result['affectedPkgs'] = getAffectedPkgsFromIssues(response.result.issues);
    return response;
}
function getAffectedPkgsFromIssues(issues) {
    const result = {};
    for (const issue of issues) {
        const packageId = `${issue.pkgName}@${issue.pkgVersion || ''}`;
        if (result[packageId] === undefined) {
            result[packageId] = {
                pkg: { name: issue.pkgName, version: issue.pkgVersion },
                issues: {},
            };
        }
        result[packageId].issues[issue.issueId] = issue;
    }
    return result;
}
async function sendAndParseResults(payloads, spinnerLbl, root, options) {
    const results = [];
    for (const payload of payloads) {
        await spinner_1.spinner.clear(spinnerLbl)();
        if (!options.quiet) {
            await spinner_1.spinner(spinnerLbl);
        }
        /** sendTestPayload() deletes the request.body from the payload once completed. */
        const payloadCopy = Object.assign({}, payload);
        const res = await sendTestPayload(payload);
        const { depGraph, payloadPolicy, pkgManager, targetFile, projectName, foundProjectCount, displayTargetFile, dockerfilePackages, platform, scanResult, } = prepareResponseForParsing(payloadCopy, res, options);
        const ecosystem = ecosystems_1.getEcosystem(options);
        if (ecosystem && options['print-deps']) {
            await spinner_1.spinner.clear(spinnerLbl)();
            await print_deps_1.maybePrintDepGraph(options, depGraph);
        }
        const legacyRes = convertIssuesToAffectedPkgs(res);
        const result = await parseRes(depGraph, pkgManager, legacyRes, options, payload, payloadPolicy, root, dockerfilePackages);
        results.push({
            ...result,
            targetFile,
            projectName,
            foundProjectCount,
            displayTargetFile,
            platform,
            scanResult,
        });
    }
    return results;
}
async function runTest(projectType, root, options) {
    const spinnerLbl = 'Querying vulnerabilities database...';
    try {
        await options_validator_1.validateOptions(options, options.packageManager);
        const payloads = await assemblePayloads(root, options);
        return await sendAndParseResults(payloads, spinnerLbl, root, options);
    }
    catch (error) {
        debug('Error running test', { error });
        // handling denial from registry because of the feature flag
        // currently done for go.mod
        const isFeatureNotAllowed = error.code === 403 && error.message.includes('Feature not allowed');
        const hasFailedToGetVulnerabilities = error.code === 404 &&
            error.name.includes('FailedToGetVulnerabilitiesError') &&
            !error.userMessage;
        if (isFeatureNotAllowed) {
            throw errors_1.NoSupportedManifestsFoundError([root]);
        }
        if (hasFailedToGetVulnerabilities) {
            throw errors_1.FailedToGetVulnsFromUnavailableResource(root, error.code);
        }
        if (ecosystems_1.getEcosystem(options) === 'docker' &&
            error.statusCode === 401 &&
            [
                'authentication required',
                '{"details":"incorrect username or password"}\n',
            ].includes(error.message)) {
            throw new errors_1.DockerImageNotFoundError(root);
        }
        throw new errors_1.FailedToRunTestError(error.userMessage ||
            error.message ||
            `Failed to test ${projectType} project`, error.code);
    }
    finally {
        spinner_1.spinner.clear(spinnerLbl)();
    }
}
exports.runTest = runTest;
async function parseRes(depGraph, pkgManager, res, options, payload, payloadPolicy, root, dockerfilePackages) {
    var _a;
    // TODO: docker doesn't have a package manager
    // so this flow will not be applicable
    // refactor to separate
    if (depGraph && pkgManager) {
        res = legacy_1.convertTestDepGraphResultToLegacy(res, // Double "as" required by Typescript for dodgy assertions
        depGraph, pkgManager, options);
        // For Node.js: inject additional information (for remediation etc.) into the response.
        if (payload.modules) {
            res.dependencyCount =
                payload.modules.numDependencies || depGraph.getPkgs().length - 1;
            if (res.vulnerabilities) {
                res.vulnerabilities.forEach((vuln) => {
                    if (payload.modules && payload.modules.pluck) {
                        const plucked = payload.modules.pluck(vuln.from, vuln.name, vuln.version);
                        vuln.__filename = plucked.__filename;
                        vuln.shrinkwrap = plucked.shrinkwrap;
                        vuln.bundled = plucked.bundled;
                        // this is an edgecase when we're testing the directly vuln pkg
                        if (vuln.from.length === 1) {
                            return;
                        }
                        const parentPkg = snyk_module_1.parsePackageString(vuln.from[1]);
                        const parent = payload.modules.pluck(vuln.from.slice(0, 2), parentPkg.name, parentPkg.version);
                        vuln.parentDepType = parent.depType;
                    }
                });
            }
        }
    }
    // TODO: is this needed? we filter on the other side already based on policy
    // this will move to be filtered server side soon & it will support `'ignore-policy'`
    analytics.add('vulns-pre-policy', res.vulnerabilities.length);
    res.filesystemPolicy = !!payloadPolicy;
    if (!options['ignore-policy']) {
        res.policy = res.policy || payloadPolicy;
        const policy = await snyk.policy.loadFromText(res.policy);
        res = policy.filter(res, root);
    }
    analytics.add('vulns', res.vulnerabilities.length);
    if (res.docker && dockerfilePackages) {
        res.vulnerabilities = res.vulnerabilities.map((vuln) => {
            const dockerfilePackage = dockerfilePackages[vuln.name.split('/')[0]];
            if (dockerfilePackage) {
                vuln.dockerfileInstruction =
                    dockerfilePackage.installCommand;
            }
            vuln.dockerBaseImage = res.docker.baseImage;
            return vuln;
        });
    }
    if (options.docker && ((_a = res.docker) === null || _a === void 0 ? void 0 : _a.baseImage) &&
        options['exclude-base-image-vulns']) {
        const filteredVulns = res.vulnerabilities.filter((vuln) => vuln.dockerfileInstruction);
        // `exclude-base-image-vulns` might have left us with no vulns, so `ok` is now `true`
        if (res.vulnerabilities.length !== 0 &&
            filteredVulns.length === 0 &&
            !res.ok) {
            res.ok = true;
        }
        res.vulnerabilities = filteredVulns;
    }
    res.uniqueCount = countUniqueVulns(res.vulnerabilities);
    return res;
}
function sendTestPayload(payload) {
    var _a;
    const payloadBody = payload.body;
    const filesystemPolicy = payload.body && !!((payloadBody === null || payloadBody === void 0 ? void 0 : payloadBody.policy) || ((_a = payloadBody === null || payloadBody === void 0 ? void 0 : payloadBody.scanResult) === null || _a === void 0 ? void 0 : _a.policy));
    return new Promise((resolve, reject) => {
        request_1.makeRequest(payload, (error, res, body) => {
            if (error) {
                return reject(error);
            }
            if (res.statusCode !== 200) {
                const err = handleTestHttpErrorResponse(res, body);
                return reject(err);
            }
            body.filesystemPolicy = filesystemPolicy;
            resolve(body);
        });
    });
}
function handleTestHttpErrorResponse(res, body) {
    const { statusCode } = res;
    let err;
    const userMessage = body && body.userMessage;
    switch (statusCode) {
        case 401:
        case 403:
            err = errors_1.AuthFailedError(userMessage, statusCode);
            err.innerError = body.stack;
            break;
        case 404:
            err = new errors_1.NotFoundError(userMessage);
            err.innerError = body.stack;
            break;
        case 405:
            err = new errors_1.UnsupportedFeatureFlagError('reachableVulns');
            err.innerError = body.stack;
            break;
        case 500:
            err = new errors_1.InternalServerError(userMessage);
            err.innerError = body.stack;
            break;
        default:
            err = new errors_1.FailedToGetVulnerabilitiesError(userMessage, statusCode);
            err.innerError = body.error;
    }
    return err;
}
function assemblePayloads(root, options) {
    let isLocal;
    if (options.docker) {
        isLocal = true;
    }
    else {
        // TODO: Refactor this check so we don't require files when tests are using mocks
        isLocal = fs.existsSync(root);
    }
    analytics.add('local', isLocal);
    const ecosystem = ecosystems_1.getEcosystem(options);
    if (ecosystem) {
        return assemble_payloads_1.assembleEcosystemPayloads(ecosystem, options);
    }
    if (isLocal) {
        return assembleLocalPayloads(root, options);
    }
    return assembleRemotePayloads(root, options);
}
// Payload to send to the Registry for scanning a package from the local filesystem.
async function assembleLocalPayloads(root, options) {
    var _a, _b;
    // For --all-projects packageManager is yet undefined here. Use 'all'
    let analysisTypeText = 'all dependencies for ';
    if (options.docker) {
        analysisTypeText = 'docker dependencies for ';
    }
    else if (options.packageManager) {
        analysisTypeText = options.packageManager + ' dependencies for ';
    }
    const spinnerLbl = 'Analyzing ' +
        analysisTypeText +
        (path.relative('.', path.join(root, options.file || '')) ||
            path.relative('..', '.') + ' project dir');
    try {
        const payloads = [];
        await spinner_1.spinner.clear(spinnerLbl)();
        if (!options.quiet) {
            await spinner_1.spinner(spinnerLbl);
        }
        const deps = await get_deps_from_plugin_1.getDepsFromPlugin(root, options);
        const failedResults = deps.failedResults;
        if (failedResults === null || failedResults === void 0 ? void 0 : failedResults.length) {
            await spinner_1.spinner.clear(spinnerLbl)();
            if (!options.json && !options.quiet) {
                console.warn(chalk_1.default.bold.red(`${theme_1.icon.ISSUE} ${failedResults.length}/${failedResults.length +
                    deps.scannedProjects
                        .length} potential projects failed to get dependencies.`));
                failedResults.forEach((f) => {
                    if (f.targetFile) {
                        console.warn(theme.color.status.error(`${f.targetFile}:`));
                    }
                    console.warn(theme.color.status.error(`  ${f.errMessage}`));
                });
            }
            debug('getDepsFromPlugin returned failed results, cannot run test/monitor', failedResults);
            if (options['fail-fast']) {
                throw new errors_1.FailedToRunTestError(errors_1.errorMessageWithRetry('Your test request could not be completed.'));
            }
        }
        analytics.add('pluginName', deps.plugin.name);
        const javaVersion = get(deps.plugin, 'meta.versionBuildInfo.metaBuildVersion.javaVersion', null);
        const mvnVersion = get(deps.plugin, 'meta.versionBuildInfo.metaBuildVersion.mvnVersion', null);
        const sbtVersion = get(deps.plugin, 'meta.versionBuildInfo.metaBuildVersion.sbtVersion', null);
        if (javaVersion) {
            analytics.add('javaVersion', javaVersion);
        }
        if (mvnVersion) {
            analytics.add('mvnVersion', mvnVersion);
        }
        if (sbtVersion) {
            analytics.add('sbtVersion', sbtVersion);
        }
        for (const scannedProject of deps.scannedProjects) {
            if (!scannedProject.depTree && !scannedProject.depGraph) {
                debug('scannedProject is missing depGraph or depTree, cannot run test/monitor');
                throw new errors_1.FailedToRunTestError(errors_1.errorMessageWithRetry('Your test request could not be completed.'));
            }
            // prefer dep-graph fallback on dep tree
            // TODO: clean up once dep-graphs only
            const pkg = scannedProject.depGraph
                ? scannedProject.depGraph
                : scannedProject.depTree;
            if (options['print-deps']) {
                if (scannedProject.depGraph) {
                    await spinner_1.spinner.clear(spinnerLbl)();
                    print_deps_1.maybePrintDepGraph(options, pkg);
                }
                else {
                    await spinner_1.spinner.clear(spinnerLbl)();
                    print_deps_1.maybePrintDepTree(options, pkg);
                }
            }
            const project = scannedProject;
            const packageManager = extract_package_manager_1.extractPackageManager(project, deps, options);
            if (pkg.docker) {
                const baseImageFromDockerfile = pkg.docker.baseImage;
                if (!baseImageFromDockerfile && options['base-image']) {
                    pkg.docker.baseImage = options['base-image'];
                }
                if (baseImageFromDockerfile && deps.plugin && deps.plugin.imageLayers) {
                    analytics.add('BaseImage', baseImageFromDockerfile);
                    analytics.add('imageLayers', deps.plugin.imageLayers);
                }
            }
            // todo: normalize what target file gets used across plugins and functions
            const targetFile = scannedProject.targetFile || deps.plugin.targetFile || options.file;
            // Forcing options.path to be a string as pathUtil requires is to be stringified
            const targetFileRelativePath = targetFile
                ? pathUtil.resolve(pathUtil.resolve(`${options.path || root}`), targetFile)
                : '';
            let targetFileDir;
            if (targetFileRelativePath) {
                const { dir } = path.parse(targetFileRelativePath);
                targetFileDir = dir;
            }
            const policy = await policy_1.findAndLoadPolicy(root, options.docker ? 'docker' : packageManager, options, 
            // TODO: fix this and send only send when we used resolve-deps for node
            // it should be a ExpandedPkgTree type instead
            pkg, targetFileDir);
            analytics.add('packageManager', packageManager);
            if (scannedProject.depGraph) {
                const depGraph = pkg;
                addPackageAnalytics(depGraph.rootPkg.name, depGraph.rootPkg.version);
            }
            if (scannedProject.depTree) {
                const depTree = pkg;
                addPackageAnalytics(depTree.name, depTree.version);
            }
            let target;
            if (scannedProject.depGraph) {
                target = await projectMetadata.getInfo(scannedProject, options);
            }
            else {
                target = await projectMetadata.getInfo(scannedProject, options, pkg);
            }
            const originalProjectName = scannedProject.depGraph
                ? pkg.rootPkg.name
                : pkg.name;
            const body = {
                // WARNING: be careful changing this as it affects project uniqueness
                targetFile: project.plugin.targetFile,
                // TODO: Remove relativePath prop once we gather enough ruby related logs
                targetFileRelativePath: `${targetFileRelativePath}`,
                targetReference: options['target-reference'],
                projectNameOverride: options.projectName,
                originalProjectName,
                policy: policy ? policy.toString() : undefined,
                foundProjectCount: await get_extra_project_count_1.getExtraProjectCount(root, options, deps),
                displayTargetFile: targetFile,
                docker: pkg.docker,
                hasDevDependencies: pkg.hasDevDependencies,
                target,
            };
            let depGraph;
            if (scannedProject.depGraph) {
                depGraph = scannedProject.depGraph;
            }
            else {
                // Graphs are more compact and robust representations.
                // Legacy parts of the code are still using trees, but will eventually be fully migrated.
                debug('converting dep-tree to dep-graph', {
                    name: pkg.name,
                    targetFile: scannedProject.targetFile || options.file,
                });
                depGraph = await depGraphLib.legacy.depTreeToGraph(pkg, packageManager);
                debug('done converting dep-tree to dep-graph', {
                    uniquePkgsCount: depGraph.getPkgs().length,
                });
            }
            const pruneIsRequired = options.pruneRepeatedSubdependencies;
            if (packageManager) {
                depGraph = await prune_1.pruneGraph(depGraph, packageManager, pruneIsRequired);
            }
            body.depGraph = depGraph;
            if (options.reachableVulns && ((_a = scannedProject.callGraph) === null || _a === void 0 ? void 0 : _a.message)) {
                const err = scannedProject.callGraph;
                const analyticsError = err.innerError || err;
                analytics.add('callGraphError', {
                    errorType: (_b = analyticsError.constructor) === null || _b === void 0 ? void 0 : _b.name,
                    message: error_format_1.abridgeErrorMessage(analyticsError.message.toString(), ANALYTICS_PAYLOAD_MAX_LENGTH),
                });
                alerts.registerAlerts([
                    {
                        type: 'error',
                        name: 'missing-call-graph',
                        msg: err.message,
                    },
                ]);
            }
            else if (scannedProject.callGraph) {
                const { callGraph, nodeCount, edgeCount, } = reachable_vulns_1.serializeCallGraphWithMetrics(scannedProject.callGraph);
                debug(`Adding call graph to payload, node count: ${nodeCount}, edge count: ${edgeCount}`);
                const callGraphMetrics = get(deps.plugin, 'meta.callGraphMetrics', {});
                analytics.add('callGraphMetrics', {
                    callGraphEdgeCount: edgeCount,
                    callGraphNodeCount: nodeCount,
                    ...callGraphMetrics,
                });
                body.callGraph = callGraph;
            }
            const reqUrl = config_1.default.API +
                (options.testDepGraphDockerEndpoint ||
                    options.vulnEndpoint ||
                    '/test-dep-graph');
            const payload = {
                method: 'POST',
                url: reqUrl,
                json: true,
                headers: {
                    'x-is-ci': is_ci_1.isCI(),
                    authorization: api_token_1.getAuthHeader(),
                },
                qs: common.assembleQueryString(options),
                body,
            };
            if (packageManager && ['yarn', 'npm'].indexOf(packageManager) !== -1) {
                const isLockFileBased = targetFile &&
                    (targetFile.endsWith('package-lock.json') ||
                        targetFile.endsWith('yarn.lock'));
                if (!isLockFileBased || options.traverseNodeModules) {
                    payload.modules = pkg; // See the output of resolve-deps
                }
            }
            payloads.push(payload);
        }
        return payloads;
    }
    finally {
        await spinner_1.spinner.clear(spinnerLbl)();
    }
}
// Payload to send to the Registry for scanning a remote package.
async function assembleRemotePayloads(root, options) {
    const pkg = snyk_module_1.parsePackageString(root);
    debug('testing remote: %s', pkg.name + '@' + pkg.version);
    addPackageAnalytics(pkg.name, pkg.version);
    const encodedName = encodeURIComponent(pkg.name + '@' + pkg.version);
    // options.vulnEndpoint is only used by `snyk protect` (i.e. local filesystem tests)
    const url = `${config_1.default.API}${options.vulnEndpoint ||
        `/vuln/${options.packageManager}`}/${encodedName}`;
    return [
        {
            method: 'GET',
            url,
            qs: common.assembleQueryString(options),
            json: true,
            headers: {
                'x-is-ci': is_ci_1.isCI(),
                authorization: 'token ' + snyk.api,
            },
        },
    ];
}
function addPackageAnalytics(name, version) {
    analytics.add('packageName', name);
    analytics.add('packageVersion', version);
    analytics.add('package', name + '@' + version);
}
function countUniqueVulns(vulns) {
    const seen = {};
    for (const curr of vulns) {
        seen[curr.id] = true;
    }
    return Object.keys(seen).length;
}


/***/ }),

/***/ 66487:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.execute = void 0;
const childProcess = __webpack_require__(63129);
function execute(command, args, options) {
    const spawnOptions = { shell: true };
    if (options && options.cwd) {
        spawnOptions.cwd = options.cwd;
    }
    return new Promise((resolve, reject) => {
        let stdout = '';
        let stderr = '';
        const proc = childProcess.spawn(command, args, spawnOptions);
        if (proc.stdout) {
            proc.stdout.on('data', (data) => {
                stdout += data;
            });
        }
        if (proc.stderr) {
            proc.stderr.on('data', (data) => {
                stderr += data;
            });
        }
        proc.on('close', (code) => {
            if (code !== 0) {
                return reject(stdout || stderr);
            }
            resolve(stdout || stderr);
        });
    });
}
exports.execute = execute;


/***/ }),

/***/ 9146:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const snykConfig = __webpack_require__(22541);

// This module is kind of "world object" that is used to indirectly import modules.
// This also introduces some circular imports.

// TODO(kyegupov): untangle this, resolve circular imports, convert to Typescript

const snyk = {};
module.exports = snyk;

snyk.id = snykConfig.id;

const apiToken = __webpack_require__(95181);

// make snyk.api *always* get the latest api token from the config store
Object.defineProperty(snyk, 'api', {
  enumerable: true,
  configurable: true,
  get: function() {
    return apiToken.api();
  },
  set: function(value) {
    snykConfig.api = value;
  },
});

snyk.test = __webpack_require__(53378);
snyk.policy = __webpack_require__(70535);

// this is the user config, and not the internal config
snyk.config = __webpack_require__(28137).config;


/***/ }),

/***/ 97467:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const gemfile = __webpack_require__(10635);

module.exports = gemfileLockToDependencies;

const detectCycles = (dep, chain) => {
  if (chain.indexOf(dep) >= 0) {
    const error = Error('Cyclic dependency detected in lockfile');
    const UNPROCESSABLE_ENTITY = 422;
    error.code = UNPROCESSABLE_ENTITY;
    error.meta = { dep, chain };
    throw error;
  }
};

const gemfileReducer = (lockFile, allDeps, ancestors) => (deps, dep) => {
  const gemspec = lockFile.specs[dep];
  // If for some reason a dependency isn't included in the specs then its
  // better to just ignore it (otherwise all processing fails).
  // This happens for bundler itself, it isn't included in the Gemfile.lock
  // specs, even if its a dependency! (and that isn't documented anywhere)
  if (gemspec) {
    detectCycles(dep, ancestors);
    if (allDeps.has(dep)) {
      deps[dep] = allDeps.get(dep);
    } else {
      deps[dep] = {
        name: dep,
        version: gemspec.version,
      };
      allDeps.set(dep, deps[dep]);
      deps[dep].dependencies = Object.keys(gemspec)
        .filter((k) => k !== 'version')
        .reduce(gemfileReducer(lockFile, allDeps, ancestors.concat([dep])), {});
    }
  }
  return deps;
};

function gemfileLockToDependencies(fileContents) {
  const lockFile = gemfile.interpret(fileContents, true);

  return (
    Object.keys(lockFile.dependencies || {})
      // this is required to sanitise git deps with no exact version
      // listed as `rspec!`
      .map((dep) => dep.match(/[^!]+/)[0])
      .reduce(gemfileReducer(lockFile, new Map(), []), {})
  );
}


/***/ }),

/***/ 53378:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

module.exports = test;

const detect = __webpack_require__(45318);
const { runTest } = __webpack_require__(7964);
const chalk = __webpack_require__(32589);
const pm = __webpack_require__(53847);
const { UnsupportedPackageManagerError } = __webpack_require__(55191);
const { isMultiProjectScan } = __webpack_require__(62435);

async function test(root, options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }
  if (!options) {
    options = {};
  }
  const promise = executeTest(root, options);
  if (callback) {
    promise
      .then((res) => {
        callback(null, res);
      })
      .catch(callback);
  }
  return promise;
}

async function executeTest(root, options) {
  try {
    if (!options.allProjects) {
      options.packageManager = detect.detectPackageManager(root, options);
    }
    return run(root, options).then((results) => {
      for (const res of results) {
        if (!res.packageManager) {
          res.packageManager = options.packageManager;
        }
      }
      if (results.length === 1) {
        // Return only one result if only one found as this is the default usecase
        return results[0];
      }
      // For gradle, yarnWorkspaces, allProjects we may be returning more than one result
      return results;
    });
  } catch (error) {
    return Promise.reject(
      chalk.red.bold(error.message ? error.message : error),
    );
  }
}

function run(root, options) {
  const projectType = options.packageManager;
  validateProjectType(options, projectType);
  return runTest(projectType, root, options);
}

function validateProjectType(options, projectType) {
  if (
    !(
      options.docker ||
      isMultiProjectScan(options) ||
      pm.SUPPORTED_PACKAGE_MANAGER_NAME[projectType]
    )
  ) {
    throw new UnsupportedPackageManagerError(projectType);
  }
}


/***/ })

};
;
//# sourceMappingURL=784.index.js.map