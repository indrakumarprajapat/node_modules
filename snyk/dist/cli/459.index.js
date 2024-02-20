"use strict";
exports.id = 459;
exports.ids = [459];
exports.modules = {

/***/ 68590:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.isIacShareResultsOptions = exports.assertIaCOptionsFlags = exports.UnsupportedEntitlementCommandError = exports.UnsupportedEntitlementFlagError = exports.FlagValueError = exports.FeatureFlagError = exports.FlagError = void 0;
const errors_1 = __webpack_require__(55191);
const args_1 = __webpack_require__(94765);
const error_utils_1 = __webpack_require__(23872);
const types_1 = __webpack_require__(42258);
const keys = [
    'org',
    'debug',
    'insecure',
    'detectionDepth',
    'severityThreshold',
    'rules',
    'json',
    'sarif',
    'json-file-output',
    'sarif-file-output',
    'v',
    'version',
    'h',
    'help',
    'q',
    'quiet',
    'scan',
    'report',
    // Tags and attributes
    'tags',
    'project-tags',
    'project-environment',
    'project-lifecycle',
    'project-business-criticality',
    'target-reference',
    // PolicyOptions
    'ignore-policy',
    'policy-path',
];
const allowed = new Set(keys);
function camelcaseToDash(key) {
    return key.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase());
}
function getFlagName(key) {
    const dashes = key.length === 1 ? '-' : '--';
    const flag = camelcaseToDash(key);
    return `${dashes}${flag}`;
}
class FlagError extends errors_1.CustomError {
    constructor(key) {
        const flag = getFlagName(key);
        const msg = `Unsupported flag "${flag}" provided. Run snyk iac test --help for supported flags`;
        super(msg);
        this.code = types_1.IaCErrorCodes.FlagError;
        this.strCode = error_utils_1.getErrorStringCode(this.code);
        this.userMessage = msg;
    }
}
exports.FlagError = FlagError;
class FeatureFlagError extends errors_1.CustomError {
    constructor(key, featureFlag, hasSnykPreview) {
        const flag = getFlagName(key);
        let msg;
        if (hasSnykPreview) {
            msg = `Flag "${flag}" is only supported if feature flag '${featureFlag}' is enabled. The feature flag can be enabled via Snyk Preview if you are on the Enterprise Plan`;
        }
        else {
            msg = `Flag "${flag}" is only supported if feature flag "${featureFlag}" is enabled. To enable it, please contact Snyk support.`;
        }
        super(msg);
        this.code = types_1.IaCErrorCodes.FeatureFlagError;
        this.strCode = error_utils_1.getErrorStringCode(this.code);
        this.userMessage = msg;
    }
}
exports.FeatureFlagError = FeatureFlagError;
class FlagValueError extends errors_1.CustomError {
    constructor(key, value) {
        const flag = getFlagName(key);
        const msg = `Unsupported value "${value}" provided to flag "${flag}".\nSupported values are: ${SUPPORTED_TF_PLAN_SCAN_MODES.join(', ')}`;
        super(msg);
        this.code = types_1.IaCErrorCodes.FlagValueError;
        this.strCode = error_utils_1.getErrorStringCode(this.code);
        this.userMessage = msg;
    }
}
exports.FlagValueError = FlagValueError;
class UnsupportedEntitlementFlagError extends errors_1.CustomError {
    constructor(key, entitlementName) {
        const flag = getFlagName(key);
        super(`Unsupported flag: ${flag} - Missing the ${entitlementName} entitlement`);
        this.code = types_1.IaCErrorCodes.UnsupportedEntitlementFlagError;
        this.strCode = error_utils_1.getErrorStringCode(this.code);
        this.userMessage = `Flag "${flag}" is currently not supported for this org. To enable it, please contact snyk support.`;
    }
}
exports.UnsupportedEntitlementFlagError = UnsupportedEntitlementFlagError;
class UnsupportedEntitlementCommandError extends errors_1.CustomError {
    constructor(key, entitlementName) {
        super(`Unsupported command: ${key} - Missing the ${entitlementName} entitlement`);
        this.code = types_1.IaCErrorCodes.UnsupportedEntitlementFlagError;
        this.strCode = error_utils_1.getErrorStringCode(this.code);
        this.userMessage = `Command "${key}" is currently not supported for this org. To enable it, please contact snyk support.`;
    }
}
exports.UnsupportedEntitlementCommandError = UnsupportedEntitlementCommandError;
/**
 * Validates the command line flags passed to the snyk iac test
 * command. The current argument parsing is very permissive and
 * allows unknown flags to be provided without valdiation.
 *
 * For snyk iac we need to explictly validate the flags to avoid
 * misconfigurations and typos. For example, if the --experimental
 * flag were to be mis-spelled we would end up sending the client
 * data to our backend rather than running it locally as intended.
 * @param argv command line args passed to the process
 */
function assertIaCOptionsFlags(argv) {
    // We process the process.argv so we don't get default values.
    const parsed = args_1.args(argv);
    for (const key of Object.keys(parsed.options)) {
        // The _ property is a special case that contains non
        // flag strings passed to the command line (usually files)
        // and `iac` is the command provided.
        if (key !== '_' && key !== 'iac' && !allowed.has(key)) {
            throw new FlagError(key);
        }
    }
    if (parsed.options.scan) {
        assertTerraformPlanModes(parsed.options.scan);
    }
}
exports.assertIaCOptionsFlags = assertIaCOptionsFlags;
const SUPPORTED_TF_PLAN_SCAN_MODES = [
    types_1.TerraformPlanScanMode.DeltaScan,
    types_1.TerraformPlanScanMode.FullScan,
];
function assertTerraformPlanModes(scanModeArgValue) {
    if (!SUPPORTED_TF_PLAN_SCAN_MODES.includes(scanModeArgValue)) {
        throw new FlagValueError('scan', scanModeArgValue);
    }
}
function isIacShareResultsOptions(options) {
    return options.iac && options.report;
}
exports.isIacShareResultsOptions = isIacShareResultsOptions;


/***/ }),

/***/ 23872:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.getErrorStringCode = void 0;
const types_1 = __webpack_require__(42258);
function getErrorStringCode(code) {
    const errorName = types_1.IaCErrorCodes[code];
    if (!errorName) {
        return 'INVALID_IAC_ERROR';
    }
    let result = errorName.replace(/([A-Z])/g, '_$1');
    if (result.charAt(0) === '_') {
        result = result.substring(1);
    }
    return result.toUpperCase();
}
exports.getErrorStringCode = getErrorStringCode;


/***/ }),

/***/ 1802:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.FailedToGetIacOrgSettingsError = exports.getIacOrgSettings = void 0;
const types_1 = __webpack_require__(42258);
const config_1 = __webpack_require__(22541);
const is_ci_1 = __webpack_require__(10090);
const api_token_1 = __webpack_require__(95181);
const request_1 = __webpack_require__(52050);
const errors_1 = __webpack_require__(55191);
const error_utils_1 = __webpack_require__(23872);
function getIacOrgSettings(publicOrgId) {
    const payload = {
        method: 'get',
        url: config_1.default.API + '/iac-org-settings',
        json: true,
        qs: { org: publicOrgId },
        headers: {
            'x-is-ci': is_ci_1.isCI(),
            authorization: `token ${api_token_1.api()}`,
        },
    };
    return new Promise((resolve, reject) => {
        request_1.makeRequest(payload, (error, res) => {
            if (error) {
                return reject(error);
            }
            if (res.statusCode < 200 || res.statusCode > 299) {
                return reject(new FailedToGetIacOrgSettingsError());
            }
            resolve(res.body);
        });
    });
}
exports.getIacOrgSettings = getIacOrgSettings;
class FailedToGetIacOrgSettingsError extends errors_1.CustomError {
    constructor(message) {
        super(message || 'Failed to fetch IaC organization settings');
        this.code = types_1.IaCErrorCodes.FailedToGetIacOrgSettingsError;
        this.strCode = error_utils_1.getErrorStringCode(this.code);
        this.userMessage =
            'We failed to fetch your organization settings, including custom severity overrides for infrastructure-as-code policies. Please run the command again with the `-d` flag and contact support@snyk.io with the contents of the output.';
    }
}
exports.FailedToGetIacOrgSettingsError = FailedToGetIacOrgSettingsError;


/***/ }),

/***/ 47658:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.DescribeExclusiveArgumentError = void 0;
const custom_error_1 = __webpack_require__(17188);
const drift_1 = __webpack_require__(26445);
class DescribeExclusiveArgumentError extends custom_error_1.CustomError {
    constructor() {
        super('Please use only one of these arguments: ' +
            drift_1.DescribeExclusiveArgs.join(', '));
    }
}
exports.DescribeExclusiveArgumentError = DescribeExclusiveArgumentError;


/***/ }),

/***/ 37541:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.DescribeRequiredArgumentError = void 0;
const custom_error_1 = __webpack_require__(17188);
const drift_1 = __webpack_require__(26445);
class DescribeRequiredArgumentError extends custom_error_1.CustomError {
    constructor() {
        super('Describe command require one of these arguments: ' +
            drift_1.DescribeRequiredArgs.join(', '));
    }
}
exports.DescribeRequiredArgumentError = DescribeRequiredArgumentError;


/***/ }),

/***/ 19679:
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.default = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" width="1560pt" height="2448pt" viewBox="0 0 1560 2448"><g enable-background="new"><g><g id="Layer-1" data-name="AAPL:Style"><g id="Layer-2" data-name="AAPL:StyleContent"><mask id="ma0"><g transform="matrix(1,0,0,.99999997,0,-4)"><use xlink:href="#im1" x="0" y="0" width="1560" height="2456"/></g></mask><symbol id="im1" viewBox="0 0 1560 2456"><image width="1560" height="2456" xlink:href="data:image/png;base64,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GAAIhAGAQBgACIQBgEAYAAiEAYBAGAAIhAGAQBgACIQBgEAYAAiEAYBAGAAIhAGAQBgACIQBgEAYAAiEAYBAGAAIhAGAQBgACIQBgEAYAAiEAYBAGAAIhAGAQBgACIQBgEAYAAiEAYBAGAAIhAGAQBgACIQBgEAYAAiEAYBAGAAIhAGAQBgACIQBgEAYAAiEAYBAGAAIhAGAQBgACIQBgEAYAAiEAYBAGAAIhAGAQBgACIQBgEAYAAiEAYBAGAAIhAGAQBgACIQBgEAYAAiEAYBAGAAIhAGAQBgACIQBgEAYAAiEAYBAGAAIhAGAQBgACIQBgEAYAAiEAYBAGAAIhAGAQBgACIQBgEAYAAiEAYBAGAAIhAGAQBgACIQBgEAYAAiEAYBAGAAIhAGAQBgACIQBgEAYAAiEAYBAGAAIhAGAQBgACIQBgEAYAAiEAYBAGAAIhAGAQBgACIQBgEAYAAiEAYBAGAAIhAGAQBgACIQBgEAYAAiEAYBAGAAIhAGAQBgACIQBgEAYAAiEAYBAGAAIhAGAQBgACIQBgEAYAAiEAYBAGAAIhAGAQBgACIQBgEAYAAiEAYBAGAAIhAGAQBgACIQBgEAYAAiEAYBAGAAIhAGAQBgACIQBgEAYAAiEAYBAGAAIhAGAQBgACIQBgEAYAAiEAYBAGAAIhAGAQBgACIQBgEAYAAiEAYBAGAAIhAGAQBgACIQBgEAYAAiEAYBAGAAIhAGAQBgACIQBgEAYAAiEAYBAGAAIhAGAQBgACIQBgEAYAAiEAYBAGAAIhAGAQBgACIQBgEAYAAiEAYBAGAAIhAGAQBgACIQBgEAYAAiEAYBAGAAIhAGAQBgACIQBgEAYAAiEAYBAGAAIhAGAQBgACIQBgEAYAAiEAYBAGAAIhAGAQBgACIQBgEAYAAiEAYBAGAAIhAGAQBgACIQBgEAYAAiEAYBAGAAIhAGAQBgACIQBgEAYAAiEAYBAGAAIhAGAQBgACIQBgEAYAAiEAYBAGAAIhAGAQBgACIQBgEAYAAiEAYBAGAAIhAGAQBgACIQBgEAYAAiEAYBAGAAIhAGAQBgACIQBgEAYAAiEAYBAGAAIhAGAQBgACIQBgEAYAAiEAYBAGAAIhAGAQBgACIQBgEAYAAiEAYBAGAAIhAGAQBgACIQBgEAYAAiEAYBAGAAIhAGAQBgACIQBgEAYAAiEAYBAGAAIhAGAQBgACIQBgEAYAAiEAYBAGAAIhAGAQBgACIQBgEAYAAiEAYBAGAAIhAGAQBgACIQBgEAYAAiEAYBAGAAIhAGAQBgACIQBgEAYAAiEAYBAGAAIhAGAQBgACIQBgEAYAAiEAYBAGAAIhAGAQBgACIQBgEAYAAiEAYBAGAAIhAGAQBgACIQBgEAYAAiEAYBAGAAIhAGAQBgACIQBgEAYAAiEAYBAGAAIhAGAQBgACIQBgEAYAAiEAYBAGAAIhAGAQBgACIQBgEAYAAiEAYBAGAAIhAGAQBgACIQBgEAYAAiEAYBAGAAIhAGAQBgACIQBgEAYAAiEAYBAGAAIhAGAQBgACIQBgEAYAAiEAYBAGAAIhAGAQBgACIQBgEAYAAiEAYBAGAAIhAGAQBgACIQBgEAYAAiEAYBAGAAIhAGAQBgACIQBgEAYAAiEAYBAGAAIhAGAQBgACIQBgEAYAAiEAYBAGAAIhAGAQBgACIQBgEAYAAiEAYBAGAAIhAGAQBgACIQBgEAYAAiEAYBAGAAIhAGAQBgACIQBgEAYAAiEAYBAGAAIhAGAQBgACIQBgEAYAAiEAYBAGAAIhAGAQBgACIQBgEAYAAiEAYBAGAAIhAGAQBgACIQBgEAYAAiEAYBAGAAIhAGAQBgACIQBgEAYAAiEAYBAGAAIhAGAQBgACIQBgEAYAAiEAYBAGAAIhAGAQBgACIQBgEAYAAiEAYBAGAAIhAGAQBgACIQBgEAYAAiEAYBAGAAIhAGAQBgACIQBgEAYAAiEAYBAGAAIhAGAQBgACIQBgEAYAAiEAYBAGAAIhAGAQBgACIQBgEAYAAiEAYBAGAAIhAGAQBgACIQBgEAYAAiEAYBAGAAIhAGAQBgACIQBgEAYAAiEAYBAGAAIhAGAQBgACIQBgEAYAAiEAYBAGAAIhAGAQBgACIQBgEAYAAiEAYBAGAAIhAGAQBgACIQBgEAYAAiEAYBAGAAIhAGAQBgACIQBgEAYAAiEAYBAGAAIhAGAQBgACIQBgEAYAAiEAYBAGAAIhAGAQBgACIQBgEAYAAiEAYBAGAAIhAGAQBgACIQBgEAYAAiEAYBAGAAIhAGAQBgACIQBgEAYAAiEAYBAGAAIhAGAQBgACIQBgEAYAAiEAYBAGAAIhAGAQBgACIQBgEAYAAiEAYBAGAAIhAGAQBgACIQBgEAY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"/></symbol><g mask="url(#ma0)"><g transform="matrix(1,0,0,.99999997,0,-4)"><symbol id="im2" viewBox="0 0 1560 2456"><image width="1560" height="2456" xlink:href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAABhgAAAmYCAIAAAAMiDHnAAAACXBIWXMAAA7EAAAOxAGVKw4bAAA/y0lEQVR4nOzYgRQAIBBAse6FkVP+OCH0ATaMzT53AQAAAMDPiCQAAAAACpEEAAAAQCKSAAAAAEhEEgAAAACJSAIAAAAgEUkAAAAAJCIJAAAAgEQkAQAAAJCIJAAAAAASkQQAAABAIpIAAAAASEQSAAAAAIlIAgAAACARSQAAAAAkIgkAAACARCQBAAAAkIgkAAAAABKRBAAAAEAikgAAAABIRBIAAAAAiUgCAAAAIBFJAAAAACQiCQAAAIBEJAEAAACQiCQAAAAAEpEEAAAAQCKSAAAAAEhEEgAAAACJSAIAAAAgEUkAAAAAJCIJAAAAgEQkAQAAAJCIJAAAAAASkQQAAABAIpIAAAAASEQSAAAAAIlIAgAAACARSQAAAAAkIgkAAACARCQBAAAAkIgkAAAAABKRBAAAAEAikgAAAABIRBIAAAAAiUgCAAAAIBFJAAAAACQiCQAAAIBEJAEAAACQiCQAAAAAEpEEAAAAQCKSAAAAAEhEEgAAAACJSAIAAAAgEUkAAAAAJCIJAAAAgEQkAQAAAJCIJAAAAAASkQQAAABAIpIAAAAASEQSAAAAAIlIAgAAACARSQAAAAAkIgkAAACARCQBAAAAkIgkAAAAABKRBAAAAEAikgAAAABIRBIAAAAAiUgCAAAAIBFJAAAAACQiCQAAAIBEJAEAAACQiCQAAAAAEpEEAAAAQCKSAAAAAEhEEgAAAACJSAIAAAAgEUkAAAAAJCIJAAAAgEQkAQAAAJCIJAAAAAASkQQAAABAIpIAAAAASEQSAAAAAIlIAgAAACARSQAAAAAkIgkAAACARCQBAAAAkIgkAAAAABKRBAAAAEAikgAAAABIRBIAAAAAiUgCAAAAIBFJAAAAACQiCQAAAIBEJAEAAACQiCQAAAAAEpEEAAAAQCKSAAAAAEhEEgAAAACJSAIAAAAgEUkAAAAAJCIJAAAAgEQkAQAAAJCIJAAAAAASkQQAAABAIpIAAAAASEQSAAAAAIlIAgAAACARSQAAAAAkIgkAAACARCQBAAAAkIgkAAAAABKRBAAAAEAikgAAAABIRBIAAAAAiUgCAAAAIBFJAAAAACQiCQAAAIBEJAEAAACQiCQAAAAAEpEEAAAAQCKSAAAAAEhEEgAAAACJSAIAAAAgEUkAAAAAJCIJAAAAgEQkAQAAAJCIJAAAAAASkQQAAABAIpIAAAAASEQSAAAAAIlIAgAAACARSQAAAAAkIgkAAACARCQBAAAAkIgkAAAAABKRBAAAAEAikgAAAABIRBIAAAAAiUgCAAAAIBFJAAAAACQiCQAAAIBEJAEAAACQiCQAAAAAEpEEAAAAQCKSAAAAAEhEEgAAAACJSAIAAAAgEUkAAAAAJCIJAAAAgEQkAQAAAJCIJAAAAAASkQQAAABAIpIAAAAASEQSAAAAAIlIAgAAACARSQAAAAAkIgkAAACARCQBAAAAkIgkAAAAABKRBAAAAEAikgAAAABIRBIAAAAAiUgCAAAAIBFJAAAAACQiCQAAAIBEJAEAAACQiCQAAAAAEpEEAAAAQCKSAAAAAEhEEgAAAACJSAIAAAAgEUkAAAAAJCIJAAAAgEQkAQAAAJCIJAAAAAASkQQAAABAIpIAAAAASEQSAAAAAIlIAgAAACARSQAAAAAkIgkAAACARCQBAAAAkIgkAAAAABKRBAAAAEAikgAAAABIRBIAAAAAiUgCAAAAIBFJAAAAACQiCQAAAIBEJAEAAACQiCQAAAAAEpEEAAAAQCKSAAAAAEhEEgAAAACJSAIAAAAgEUkAAAAAJCIJAAAAgEQkAQAAAJCIJAAAAAASkQQAAABAIpIAAAAASEQSAAAAAIlIAgAAACARSQAAAAAkIgkAAACARCQBAAAAkIgkAAAAABKRBAAAAEAikgAAAABIRBIAAAAAiUgCAAAAIBFJAAAAACQiCQAAAIBEJAEAAACQiCQAAAAAEpEEAAAAQCKSAAAAAEhEEgAAAACJSAIAAAAgEUkAAAAAJCIJAAAAgEQkAQAAAJCIJAAAAAASkQQAAABAIpIAAAAASEQSAAAAAIlIAgAAACARSQAAAAAkIgkAAACARCQBAAAAkIgkAAAAABKRBAAAAEAikgAAAABIRBIAAAAAiUgCAAAAIBFJAAAAACQiCQAAAIBEJAEAAACQiCQAAAAAEpEEAAAAQCKSAAAAAEhEEgAAAACJSAIAAAAgEUkAAAAAJCIJAAAAgEQkAQAAAJCIJAAAAAASkQQAAABAIpIAAAAASEQSAAAAAIlIAgAAACARSQAAAAAkIgkAAACARCQBAAAAkIgkAAAAABKRBAAAAEAikgAAAABIRBIAAAAAiUgCAAAAIBFJAAAAACQiCQAAAIBEJAEAAACQiCQAAAAAEpEEAAAAQCKSAAAAAEhEEgAAAACJSAIAAAAgEUkAAAAAJCIJAAAAgEQkAQAAAJCIJAAAAAASkQQAAABAIpIAAAAASEQSAAAAAIlIAgAAACARSQAAAAAkIgkAAACARCQBAAAAkIgkAAAAABKRBAAAAEAikgAAAABIRBIAAAAAiUgCAAAAIBFJAAAAACQiCQAAAIBEJAEAAACQiCQAAAAAEpEEAAAAQCKSAAAAAEhEEgAAAACJSAIAAAAgEUkAAAAAJCIJAAAAgEQkAQAAAJCIJAAAAAASkQQAAABAIpIAAAAASEQSAAAAAIlIAgAAACARSQAAAAAkIgkAAACARCQBAAAAkIgkAAAAABKRBAAAAEAikgAAAABIRBIAAAAAiUgCAAAAIBFJAAAAACQiCQAAAIBEJAEAAACQiCQAAAAAEpEEAAAAQCKSAAAAAEhEEgAAAACJSAIAAAAgEUkAAAAAJCIJAAAAgEQkAQAAAJCIJAAAAAASkQQAAABAIpIAAAAASEQSAAAAAIlIAgAAACARSQAAAAAkIgkAAACARCQBAAAAkIgkAAAAABKRBAAAAEAikgAAAABIRBIAAAAAiUgCAAAAIBFJAAAAACQiCQAAAIBEJAEAAACQiCQAAAAAEpEEAAAAQCKSAAAAAEhEEgAAAACJSAIAAAAgEUkAAAAAJCIJAAAAgEQkAQAAAJCIJAAAAAASkQQAAABAIpIAAAAASEQSAAAAAIlIAgAAACARSQAAAAAkIgkAAACARCQBAAAAkIgkAAAAABKRBAAAAEAikgAAAABIRBIAAAAAiUgCAAAAIBFJAAAAACQiCQAAAIBEJAEAAACQiCQAAAAAEpEEAAAAQCKSAAAAAEhEEgAAAACJSAIAAAAgEUkAAAAAJCIJAAAAgEQkAQAAAJCIJAAAAAASkQQAAABAIpIAAAAASEQSAAAAAIlIAgAAACARSQAAAAAkIgkAAACARCQBAAAAkIgkAAAAABKRBAAAAEAikgAAAABIRBIAAAAAiUgCAAAAIBFJAAAAACQiCQAAAIBEJAEAAACQiCQAAAAAEpEEAAAAQCKSAAAAAEhEEgAAAACJSAIAAAAgEUkAAAAAJCIJAAAAgEQkAQAAAJCIJAAAAAASkQQAAABAIpIAAAAASEQSAAAAAIlIAgAAACARSQAAAAAkIgkAAACARCQBAAAAkIgkAAAAABKRBAAAAEAikgAAAABIRBIAAAAAiUgCAAAAIBFJAAAAACQiCQAAAIBEJAEAAACQiCQAAAAAEpEEAAAAQCKSAAAAAEhEEgAAAACJSAIAAAAgEUkAAAAAJCIJAAAAgEQkAQAAAJCIJAAAAAASkQQAAABAIpIAAAAASEQSAAAAAIlIAgAAACARSQAAAAAkIgkAAACARCQBAAAAkIgkAAAAABKRBAAAAEAikgAAAABIRBIAAAAAiUgCAAAAIBFJAAAAACQiCQAAAIBEJAEAAACQiCQAAAAAEpEEAAAAQCKSAAAAAEhEEgAAAACJSAIAAAAgEUkAAAAAJCIJAAAAgEQkAQAAAJCIJAAAAAASkQQAAABAIpIAAAAASEQSAAAAAIlIAgAAACARSQAAAAAkIgkAAACARCQBAAAAkIgkAAAAABKRBAAAAEAikgAAAABIRBIAAAAAiUgCAAAAIBFJAAAAACQiCQAAAIBEJAEAAACQiCQAAAAAEpEEAAAAQCKSAAAAAEhEEgAAAACJSAIAAAAgEUkAAAAAJCIJAAAAgEQkAQAAAJCIJAAAAAASkQQAAABAIpIAAAAASEQSAAAAAIlIAgAAACARSQAAAAAkIgkAAACARCQBAAAAkIgkAAAAABKRBAAAAEAikgAAAABIRBIAAAAAiUgCAAAAIBFJAAAAACQiCQAAAIBEJAEAAACQiCQAAAAAEpEEAAAAQCKSAAAAAEhEEgAAAACJSAIAAAAgEUkAAAAAJCIJAAAAgEQkAQAAAJCIJAAAAAASkQQAAABAIpIAAAAASEQSAAAAAIlIAgAAACARSQAAAAAkIgkAAACARCQBAAAAkIgkAAAAABKRBAAAAEAikgAAAABIRBIAAAAAiUgCAAAAIBFJAAAAACQiCQAAAIBEJAEAAACQiCQAAAAAEpEEAAAAQCKSAAAAAEhEEgAAAACJSAIAAAAgEUkAAAAAJCIJAAAAgEQkAQAAAJCIJAAAAAASkQQAAABAIpIAAAAASEQSAAAAAIlIAgAAACARSQAAAAAkIgkAAACARCQBAAAAkIgkAAAAABKRBAAAAEAikgAAAABIRBIAAAAAiUgCAAAAIBFJAAAAACQiCQAAAIBEJAEAAACQiCQAAAAAEpEEAAAAQCKSAAAAAEhEEgAAAACJSAIAAAAgEUkAAAAAJCIJAAAAgEQkAQAAAJCIJAAAAAASkQQAAABAIpIAAAAASEQSAAAAAIlIAgAAACARSQAAAAAkIgkAAACARCQBAAAAkIgkAAAAABKRBAAAAEAikgAAAABIRBIAAAAAiUgCAAAAIBFJAAAAACQiCQAAAIBEJAEAAACQiCQAAAAAEpEEAAAAQCKSAAAAAEhEEgAAAACJSAIAAAAgEUkAAAAAJCIJAAAAgEQkAQAAAJCIJAAAAAASkQQAAABAIpIAAAAASEQSAAAAAIlIAgAAACARSQAAAAAkIgkAAACARCQBAAAAkIgkAAAAABKRBAAAAEAikgAAAABIRBIAAAAAiUgCAAAAIBFJAAAAACQiCQAAAIBEJAEAAACQiCQAAAAAEpEEAAAAQCKSAAAAAEhEEgAAAACJSAIAAAAgEUkAAAAAJCIJAAAAgEQkAQAAAJCIJAAAAAASkQQAAABAIpIAAAAASEQSAAAAAIlIAgAAACARSQAAAAAkIgkAAACARCQBAAAAkIgkAAAAABKRBAAAAEAikgAAAABIRBIAAAAAiUgCAAAAIBFJAAAAACQiCQAAAIBEJAEAAACQiCQAAAAAEpEEAAAAQCKSAAAAAEhEEgAAAACJSAIAAAAgEUkAAAAAJCIJAAAAgEQkAQAAAJCIJAAAAAASkQQAAABAIpIAAAAASEQSAAAAAIlIAgAAACARSQAAAAAkIgkAAACARCQBAAAAkIgkAAAAABKRBAAAAEAikgAAAABIRBIAAAAAiUgCAAAAIBFJAAAAACQiCQAAAIBEJAEAAACQiCQAAAAAEpEEAAAAQCKSAAAAAEhEEgAAAACJSAIAAAAgEUkAAAAAJCIJAAAAgEQkAQAAAJCIJAAAAAASkQQAAABAIpIAAAAASEQSAAAAAIlIAgAAACARSQAAAAAkIgkAAACARCQBAAAAkIgkAAAAABKRBAAAAEAikgAAAABIRBIAAAAAiUgCAAAAIBFJAAAAACQiCQAAAIBEJAEAAACQiCQAAAAAEpEEAAAAQCKSAAAAAEhEEgAAAACJSAIAAAAgEUkAAAAAJCIJAAAAgEQkAQAAAJCIJAAAAAASkQQAAABAIpIAAAAASEQSAAAAAIlIAgAAACARSQAAAAAkIgkAAACARCQBAAAAkIgkAAAAABKRBAAAAEAikgAAAABIRBIAAAAAiUgCAAAAIBFJAAAAACQiCQAAAIBEJAEAAACQiCQAAAAAEpEEAAAAQCKSAAAAAEhEEgAAAACJSAIAAAAgEUkAAAAAJCIJAAAAgEQkAQAAAJCIJAAAAAASkQQAAABAIpIAAAAASEQSAAAAAIlIAgAAACARSQAAAAAkIgkAAACARCQBAAAAkIgkAAAAABKRBAAAAEAikgAAAABIRBIAAAAAiUgCAAAAIBFJAAAAACQiCQAAAIBEJAEAAACQiCQAAAAAEpEEAAAAQCKSAAAAAEhEEgAAAACJSAIAAAAgEUkAAAAAJCIJAAAAgEQkAQAAAJCIJAAAAAASkQQAAABAIpIAAAAASEQSAAAAAIlIAgAAACARSQAAAAAkIgkAAACARCQBAAAAkIgkAAAAABKRBAAAAEAikgAAAABIRBIAAAAAiUgCAAAAIBFJAAAAACQiCQAAAIBEJAEAAACQiCQAAAAAEpEEAAAAQCKSAAAAAEhEEgAAAACJSAIAAAAgEUkAAAAAJCIJAAAAgEQkAQAAAJCIJAAAAAASkQQAAABAIpIAAAAASEQSAAAAAIlIAgAAACARSQAAAAAkIgkAAACARCQBAAAAkIgkAAAAABKRBAAAAEAikgAAAABIRBIAAAAAiUgCAAAAIBFJAAAAACQiCQAAAIBEJAEAAACQiCQAAAAAEpEEAAAAQCKSAAAAAEhEEgAAAACJSAIAAAAgEUkAAAAAJCIJAAAAgEQkAQAAAJCIJAAAAAASkQQAAABAIpIAAAAASEQSAAAAAIlIAgAAACARSQAAAAAkIgkAAACARCQBAAAAkIgkAAAAABKRBAAAAEAikgAAAABIRBIAAAAAiUgCAAAAIBFJAAAAACQiCQAAAIBEJAEAAACQiCQAAAAAEpEEAAAAQCKSAAAAAEhEEgAAAACJSAIAAAAgEUkAAAAAJCIJAAAAgEQkAQAAAJCIJAAAAAASkQQAAABAIpIAAAAASEQSAAAAAIlIAgAAACARSQAAAAAkIgkAAACARCQBAAAAkIgkAAAAABKRBAAAAEAikgAAAABIRBIAAAAAiUgCAAAAIBFJAAAAACQiCQAAAIBEJAEAAACQiCQAAAAAEpEEAAAAQCKSAAAAAEhEEgAAAACJSAIAAAAgEUkAAAAAJCIJAAAAgEQkAQAAAJCIJAAAAAASkQQAAABAIpIAAAAASEQSAAAAAIlIAgAAACARSQAAAAAkIgkAAACARCQBAAAAkIgkAAAAABKRBAAAAEAikgAAAABIRBIAAAAAiUgCAAAAIBFJAAAAACQiCQAAAIBEJAEAAACQiCQAAAAAEpEEAAAAQCKSAAAAAEhEEgAAAACJSAIAAAAgEUkAAAAAJCIJAAAAgEQkAQAAAJCIJAAAAAASkQQAAABAIpIAAAAASEQSAAAAAIlIAgAAACARSQAAAAAkIgkAAACARCQBAAAAkIgkAAAAABKRBAAAAEAikgAAAABIRBIAAAAAiUgCAAAAIBFJAAAAACQiCQAAAIBEJAEAAACQiCQAAAAAEpEEAAAAQCKSAAAAAEhEEgAAAACJSAIAAAAgEUkAAAAAJCIJAAAAgEQkAQAAAJCIJAAAAAASkQQAAABAIpIAAAAASEQSAAAAAIlIAgAAACARSQAAAAAkIgkAAACARCQBAAAAkIgkAAAAABKRBAAAAEAikgAAAABIRBIAAAAAiUgCAAAA4LFjBwIAAAAAgvytVxigMFpEEgAAAACLSAIAAABgEUkAAAAALCIJAAAAgEUkAQAAALCIJAAAAAAWkQQAAADAIpIAAAAAWEQSAAAAAItIAgAAAGARSQAAAAAsIgkAAACARSQBAAAAsIgkAAAAABaRBAAAAMAikgAAAABYRBIAAAAAi0gCAAAAYBFJAAAAACwiCQAAAIBFJAEAAACwiCQAAAAAFpEEAAAAwCKSAAAAAFhEEgAAAACLSAIAAABgEUkAAAAALCIJAAAAgEUkAQAAALCIJAAAAAAWkQQAAADAIpIAAAAAWEQSAAAAAItIAgAAAGARSQAAAAAsIgkAAACARSQBAAAAsIgkAAAAABaRBAAAAMAikgAAAABYRBIAAAAAi0gCAAAAYBFJAAAAACwiCQAAAIBFJAEAAACwiCQAAAAAFpEEAAAAwCKSAAAAAFhEEgAAAACLSAIAAABgEUkAAAAALCIJAAAAgEUkAQAAALCIJAAAAAAWkQQAAADAIpIAAAAAWEQSAAAAAItIAgAAAGARSQAAAAAsIgkAAACARSQBAAAAsIgkAAAAABaRBAAAAMAikgAAAABYRBIAAAAAi0gCAAAAYBFJAAAAACwiCQAAAIBFJAEAAACwiCQAAAAAFpEEAAAAwCKSAAAAAFhEEgAAAACLSAIAAABgEUkAAAAALCIJAAAAgEUkAQAAALCIJAAAAAAWkQQAAADAIpIAAAAAWEQSAAAAAItIAgAAAGARSQAAAAAsIgkAAACARSQBAAAAsIgkAAAAABaRBAAAAMAikgAAAABYRBIAAAAAi0gCAAAAYBFJAAAAACwiCQAAAIBFJAEAAACwiCQAAAAAFpEEAAAAwCKSAAAAAFhEEgAAAACLSAIAAABgEUkAAAAALCIJAAAAgEUkAQAAALCIJAAAAAAWkQQAAADAIpIAAAAAWEQSAAAAAItIAgAAAGARSQAAAAAsIgkAAACARSQBAAAAsIgkAAAAABaRBAAAAMAikgAAAABYRBIAAAAAi0gCAAAAYBFJAAAAACwiCQAAAIBFJAEAAACwiCQAAAAAFpEEAAAAwCKSAAAAAFhEEgAAAACLSAIAAABgEUkAAAAALCIJAAAAgEUkAQAAALCIJAAAAAAWkQQAAADAIpIAAAAAWEQSAAAAAItIAgAAAGARSQAAAAAsIgkAAACARSQBAAAAsIgkAAAAABaRBAAAAMAikgAAAABYRBIAAAAAi0gCAAAAYBFJAAAAACwiCQAAAIBFJAEAAACwiCQAAAAAFpEEAAAAwCKSAAAAAFhEEgAAAACLSAIAAABgEUkAAAAALCIJAAAAgEUkAQAAALCIJAAAAAAWkQQAAADAIpIAAAAAWEQSAAAAAItIAgAAAGARSQAAAAAsIgkAAACARSQBAAAAsIgkAAAAABaRBAAAAMAikgAAAABYRBIAAAAAi0gCAAAAYBFJAAAAACwiCQAAAIBFJAEAAACwiCQAAAAAFpEEAAAAwCKSAAAAAFhEEgAAAACLSAIAAABgEUkAAAAALCIJAAAAgEUkAQAAALCIJAAAAAAWkQQAAADAIpIAAAAAWEQSAAAAAItIAgAAAGARSQAAAAAsIgkAAACARSQBAAAAsIgkAAAAABaRBAAAAMAikgAAAABYRBIAAAAAi0gCAAAAYBFJAAAAACwiCQAAAIBFJAEAAACwiCQAAAAAFpEEAAAAwCKSAAAAAFhEEgAAAACLSAIAAABgEUkAAAAALCIJAAAAgEUkAQAAALCIJAAAAAAWkQQAAADAIpIAAAAAWEQSAAAAAItIAgAAAGARSQAAAAAsIgkAAACARSQBAAAAsIgkAAAAABaRBAAAAMAikgAAAABYRBIAAAAAi0gCAAAAYBFJAAAAACwiCQAAAIBFJAEAAACwiCQAAAAAFpEEAAAAwCKSAAAAAFhEEgAAAACLSAIAAABgEUkAAAAALCIJAAAAgEUkAQAAALCIJAAAAAAWkQQAAADAIpIAAAAAWEQSAAAAAItIAgAAAGARSQAAAAAsIgkAAACARSQBAAAAsIgkAAAAABaRBAAAAMAikgAAAABYRBIAAAAAi0gCAAAAYBFJAAAAACwiCQAAAIBFJAEAAACwiCQAAAAAFpEEAAAAwCKSAAAAAFhEEgAAAACLSAIAAABgEUkAAAAALCIJAAAAgEUkAQAAALCIJAAAAAAWkQQAAADAIpIAAAAAWEQSAAAAAItIAgAAAGARSQAAAAAsIgkAAACARSQBAAAAsIgkAAAAABaRBAAAAMAikgAAAABYRBIAAAAAi0gCAAAAYBFJAAAAACwiCQAAAIBFJAEAAACwiCQAAAAAFpEEAAAAwCKSAAAAAFhEEgAAAACLSAIAAABgEUkAAAAALCIJAAAAgEUkAQAAALCIJAAAAAAWkQQAAADAIpIAAAAAWEQSAAAAAItIAgAAAGARSQAAAAAsIgkAAACARSQBAAAAsIgkAAAAABaRBAAAAMAikgAAAABYRBIAAAAAi0gCAAAAYBFJAAAAACwiCQAAAIBFJAEAAACwiCQAAAAAFpEEAAAAwCKSAAAAAFhEEgAAAACLSAIAAABgEUkAAAAALCIJAAAAgEUkAQAAALCIJAAAAAAWkQQAAADAIpIAAAAAWEQSAAAAAItIAgAAAGARSQAAAAAsIgkAAACARSQBAAAAsIgkAAAAABaRBAAAAMAikgAAAABYRBIAAAAAi0gCAAAAYBFJAAAAACwiCQAAAIBFJAEAAACwiCQAAAAAFpEEAAAAwCKSAAAAAFhEEgAAAACLSAIAAABgEUkAAAAALCIJAAAAgEUkAQAAALCIJAAAAAAWkQQAAADAIpIAAAAAWEQSAAAAAItIAgAAAGARSQAAAAAsIgkAAACARSQBAAAAsIgkAAAAABaRBAAAAMAikgAAAABYRBIAAAAAi0gCAAAAYBFJAAAAACwiCQAAAIBFJAEAAACwiCQAAAAAFpEEAAAAwCKSAAAAAFhEEgAAAACLSAIAAABgEUkAAAAALCIJAAAAgEUkAQAAALCIJAAAAAAWkQQAAADAIpIAAAAAWEQSAAAAAItIAgAAAGARSQAAAAAsIgkAAACARSQBAAAAsIgkAAAAABaRBAAAAMAikgAAAABYRBIAAAAAi0gCAAAAYBFJAAAAACwiCQAAAIBFJAEAAACwiCQAAAAAFpEEAAAAwCKSAAAAAFhEEgAAAACLSAIAAABgEUkAAAAALCIJAAAAgEUkAQAAALCIJAAAAAAWkQQAAADAIpIAAAAAWEQSAAAAAItIAgAAAGARSQAAAAAsIgkAAACARSQBAAAAsIgkAAAAABaRBAAAAMAikgAAAABYRBIAAAAAi0gCAAAAYBFJAAAAACwiCQAAAIBFJAEAAACwiCQAAAAAFpEEAAAAwCKSAAAAAFhEEgAAAACLSAIAAABgEUkAAAAALCIJAAAAgEUkAQAAALCIJAAAAAAWkQQAAADAIpIAAAAAWEQSAAAAAItIAgAAAGARSQAAAAAsIgkAAACARSQBAAAAsIgkAAAAABaRBAAAAMAikgAAAABYRBIAAAAAi0gCAAAAYBFJAAAAACwiCQAAAIBFJAEAAACwiCQAAAAAFpEEAAAAwCKSAAAAAFhEEgAAAACLSAIAAABgEUkAAAAALCIJAAAAgEUkAQAAALCIJAAAAAAWkQQAAADAIpIAAAAAWEQSAAAAAItIAgAAAGARSQAAAAAsIgkAAACARSQBAAAAsIgkAAAAABaRBAAAAMAikgAAAABYRBIAAAAAi0gCAAAAYBFJAAAAACwiCQAAAIBFJAEAAACwiCQAAAAAFpEEAAAAwCKSAAAAAFhEEgAAAACLSAIAAABgEUkAAAAALCIJAAAAgEUkAQAAALCIJAAAAAAWkQQAAADAIpIAAAAAWEQSAAAAAItIAgAAAGARSQAAAAAsIgkAAACARSQBAAAAsIgkAAAAABaRBAAAAMAikgAAAABYRBIAAAAAi0gCAAAAYBFJAAAAACwiCQAAAIBFJAEAAACwiCQAAAAAFpEEAAAAwCKSAAAAAFhEEgAAAACLSAIAAABgEUkAAAAALCIJAAAAgEUkAQAAALCIJAAAAAAWkQQAAADAIpIAAAAAWEQSAAAAAItIAgAAAGARSQAAAAAsIgkAAACARSQBAAAAsIgkAAAAABaRBAAAAMAikgAAAABYRBIAAAAAi0gCAAAAYBFJAAAAACwiCQAAAIBFJAEAAACwiCQAAAAAFpEEAAAAwCKSAAAAAFhEEgAAAACLSAIAAABgEUkAAAAALCIJAAAAgEUkAQAAALCIJAAAAAAWkQQAAADAIpIAAAAAWEQSAAAAAItIAgAAAGARSQAAAAAsIgkAAACARSQBAAAAsIgkAAAAABaRBAAAAMAikgAAAABYRBIAAAAAi0gCAAAAYBFJAAAAACwiCQAAAIBFJAEAAACwiCQAAAAAFpEEAAAAwCKSAAAAAFhEEgAAAACLSAIAAABgEUkAAAAALCIJAAAAgEUkAQAAALCIJAAAAAAWkQQAAADAIpIAAAAAWEQSAAAAAItIAgAAAGARSQAAAAAsIgkAAACARSQBAAAAsIgkAAAAABaRBAAAAMAikgAAAABYRBIAAAAAi0gCAAAAYBFJAAAAACwiCQAAAIBFJAEAAACwiCQAAAAAFpEEAAAAwCKSAAAAAFhEEgAAAACLSAIAAABgEUkAAAAALCIJAAAAgEUkAQAAALCIJAAAAAAWkQQAAADAIpIAAAAAWEQSAAAAAItIAgAAAGARSQAAAAAsIgkAAACARSQBAAAAsIgkAAAAABaRBAAAAMAikgAAAABYRBIAAAAAi0gCAAAAYBFJAAAAACwiCQAAAIBFJAEAAACwiCQAAAAAFpEEAAAAwCKSAAAAAFhEEgAAAACLSAIAAABgEUkAAAAALCIJAAAAgEUkAQAAALCIJAAAAAAWkQQAAADAIpIAAAAAWEQSAAAAAItIAgAAAGARSQAAAAAsIgkAAACARSQBAAAAsIgkAAAAABaRBAAAAMAikgAAAABYRBIAAAAAi0gCAAAAYBFJAAAAACwiCQAAAIBFJAEAAACwiCQAAAAAFpEEAAAAwCKSAAAAAFhEEgAAAACLSAIAAABgEUkAAAAALCIJAAAAgEUkAQAAALCIJAAAAAAWkQQAAADAIpIAAAAAWEQSAAAAAItIAgAAAGARSQAAAAAsIgkAAACARSQBAAAAsIgkAAAAABaRBAAAAMAikgAAAABYRBIAAAAAi0gCAAAAYBFJAAAAACwiCQAAAIBFJAEAAACwiCQAAAAAFpEEAAAAwCKSAAAAAFhEEgAAAACLSAIAAABgEUkAAAAALCIJAAAAgEUkAQAAALCIJAAAAAAWkQQAAADAIpIAAAAAWEQSAAAAAItIAgAAAGARSQAAAAAsIgkAAACARSQBAAAAsIgkAAAAABaRBAAAAMAikgAAAABYRBIAAAAAi0gCAAAAYBFJAAAAACwiCQAAAIBFJAEAAACwiCQAAAAAFpEEAAAAwCKSAAAAAFhEEgAAAACLSAIAAABgEUkAAAAALCIJAAAAgEUkAQAAALCIJAAAAAAWkQQAAADAIpIAAAAAWEQSAAAAAItIAgAAAGARSQAAAAAsIgkAAACARSQBAAAAsIgkAAAAABaRBAAAAMAikgAAAABYRBIAAAAAi0gCAAAAYBFJAAAAACwiCQAAAIBFJAEAAACwiCQAAAAAFpEEAAAAwCKSAAAAAFhEEgAAAACLSAIAAABgEUkAAAAALCIJAAAAgEUkAQAAALCIJAAAAAAWkQQAAADAIpIAAAAAWEQSAAAAAItIAgAAAGARSQAAAAAsIgkAAACARSQBAAAAsIgkAAAAABaRBAAAAMAikgAAAABYRBIAAAAAi0gCAAAAYBFJAAAAACwiCQAAAIBFJAEAAACwiCQAAAAAFpEEAAAAwCKSAAAAAFhEEgAAAACLSAIAAABgEUkAAAAALCIJAAAAgEUkAQAAALCIJAAAAAAWkQQAAADAIpIAAAAAWEQSAAAAAItIAgAAAGARSQAAAAAsIgkAAACARSQBAAAAsIgkAAAAABaRBAAAAMAikgAAAABYRBIAAAAAi0gCAAAAYBFJAAAAACwiCQAAAIBFJAEAAACwiCQAAAAAFpEEAAAAwCKSAAAAAFhEEgAAAACLSAIAAABgEUkAAAAALCIJAAAAgEUkAQAAALCIJAAAAAAWkQQAAADAIpIAAAAAWEQSAAAAAItIAgAAAGARSQAAAAAsIgkAAACARSQBAAAAsIgkAAAAABaRBAAAAMAikgAAAABYRBIAAAAAi0gCAAAAYBFJAAAAACwiCQAAAIBFJAEAAACwiCQAAAAAFpEEAAAAwCKSAAAAAFhEEgAAAACLSAIAAABgEUkAAAAALCIJAAAAgEUkAQAAALCIJAAAAAAWkQQAAADAIpIAAAAAWEQSAAAAAItIAgAAAGARSQAAAAAsIgkAAACARSQBAAAAsIgkAAAAABaRBAAAAMAikgAAAABYRBIAAAAAi0gCAAAAYBFJAAAAACwiCQAAAIBFJAEAAACwiCQAAAAAFpEEAAAAwCKSAAAAAFhEEgAAAACLSAIAAABgEUkAAAAALCIJAAAAgEUkAQAAALCIJAAAAAAWkQQAAADAIpIAAAAAWEQSAAAAAItIAgAAAGARSQAAAAAsIgkAAACARSQBAAAAsIgkAAAAABaRBAAAAMAikgAAAABYRBIAAAAAi0gCAAAAYBFJAAAAACwiCQAAAIBFJAEAAACwiCQAAAAAFpEEAAAAwCKSAAAAAFhEEgAAAACLSAIAAABgEUkAAAAALCIJAAAAgEUkAQAAALCIJAAAAAAWkQQAAADAIpIAAAAAWEQSAAAAAItIAgAAAGARSQAAAAAsIgkAAACARSQBAAAAsIgkAAAAABaRBAAAAMAikgAAAABYRBIAAAAAi0gCAAAAYBFJAAAAACwiCQAAAIBFJAEAAACwiCQAAAAAFpEEAAAAwCKSAAAAAFhEEgAAAACLSAIAAABgEUkAAAAALCIJAAAAgEUkAQAAALCIJAAAAAAWkQQAAADAIpIAAAAAWEQSAAAAAItIAgAAAGARSQAAAAAsIgkAAACARSQBAAAAsIgkAAAAABaRBAAAAMAikgAAAABYRBIAAAAAi0gCAAAAYBFJAAAAACwiCQAAAIBFJAEAAACwiCQAAAAAFpEEAAAAwCKSAAAAAFhEEgAAAACLSAIAAABgEUkAAAAALCIJAAAAgEUkAQAAALCIJAAAAAAWkQQAAADAIpIAAAAAWEQSAAAAAItIAgAAAGARSQAAAAAsIgkAAACARSQBAAAAsIgkAAAAABaRBAAAAMAikgAAAABYRBIAAAAAi0gCAAAAYBFJAAAAACwiCQAAAIBFJAEAAACwiCQAAAAAFpEEAAAAwCKSAAAAAFhEEgAAAACLSAIAAABgEUkAAAAALCIJAAAAgEUkAQAAALCIJAAAAAAWkQQAAADAIpIAAAAAWEQSAAAAAItIAgAAAGARSQAAAAAsIgkAAACARSQBAAAAsIgkAAAAABaRBAAAAMAikgAAAABYRBIAAAAAi0gCAAAAYBFJAAAAACwiCQAAAIBFJAEAAACwiCQAAAAAFpEE1I4dCAAAAAAI8rdeYYDCCAAAABaRBAAAAMAikgAAAABYRBIAAAAAi0gCAAAAYBFJAAAAACwiCQAAAIBFJAEAAACwiCQAAAAAFpEEAAAAwCKSAAAAAFhEEgAAAACLSAIAAABgEUkAAAAALCIJAAAAgEUkAQAAALCIJAAAAAAWkQQAAADAIpIAAAAAWEQSAAAAAItIAgAAAGARSQAAAAAsIgkAAACARSQBAAAAsIgkAAAAABaRBAAAAMAikgAAAABYRBIAAAAAi0gCAAAAYBFJAAAAACwiCQAAAIBFJAEAAACwiCQAAAAAFpEEAAAAwCKSAAAAAFhEEgAAAACLSAIAAABgEUkAAAAALCIJAAAAgEUkAQAAALCIJAAAAAAWkQQAAADAIpIAAAAAWEQSAAAAAItIAgAAAGARSQAAAAAsIgkAAACARSQBAAAAsIgkAAAAABaRBAAAAMAikgAAAABYRBIAAAAAi0gCAAAAYBFJAAAAACwiCQAAAIBFJAEAAACwiCQAAAAAFpEEAAAAwCKSAAAAAFhEEgAAAACLSAIAAABgEUkAAAAALCIJAAAAgEUkAQAAALCIJAAAAAAWkQQAAADAIpIAAAAAWEQSAAAAAItIAgAAAGARSQAAAAAsIgkAAACARSQBAAAAsIgkAAAAABaRBAAAAMAikgAAAABYRBIAAAAAi0gCAAAAYBFJAAAAACwiCQAAAIBFJAEAAACwiCQAAAAAFpEEAAAAwCKSAAAAAFhEEgAAAACLSAIAAABgEUkAAAAALCIJAAAAgEUkAQAAALCIJAAAAAAWkQQAAADAIpIAAAAAWEQSAAAAAItIAgAAAGARSQAAAAAsIgkAAACARSQBAAAAsIgkAAAAABaRBAAAAMAikgAAAABYRBIAAAAAi0gCAAAAYBFJAAAAACwiCQAAAIBFJAEAAACwiCQAAAAAFpEEAAAAwCKSAAAAAFhEEgAAAACLSAIAAABgEUkAAAAALCIJAAAAgEUkAQAAALCIJAAAAAAWkQQAAADAIpIAAAAAWEQSAAAAAItIAgAAAGARSQAAAAAsIgkAAACARSQBAAAAsIgkAAAAABaRBAAAAMAikgAAAABYRBIAAAAAi0gCAAAAYBFJAAAAACwiCQAAAIBFJAEAAACwiCQAAAAAFpEEAAAAwCKSAAAAAFhEEgAAAACLSAIAAABgEUkAAAAALCIJAAAAgEUkAQAAALCIJAAAAAAWkQQAAADAIpIAAAAAWEQSAAAAAItIAgAAAGARSQAAAAAsIgkAAACARSQBAAAAsIgkAAAAABaRBAAAAMAikgAAAABYRBIAAAAAi0gCAAAAYBFJAAAAACwiCQAAAIBFJAEAAACwiCQAAAAAFpEEAAAAwCKSAAAAAFhEEgAAAACLSAIAAABgEUkAAAAALCIJAAAAgEUkAQAAALCIJAAAAAAWkQQAAADAIpIAAAAAWEQSAAAAAItIAgAAAGARSQAAAAAsIgkAAACARSQBAAAAsIgkAAAAABaRBAAAAMAikgAAAABYRBIAAAAAi0gCAAAAYBFJAAAAACwiCQAAAIBFJAEAAACwiCQAAAAAFpEEAAAAwCKSAAAAAFhEEgAAAACLSAIAAABgEUkAAAAALCIJAAAAgEUkAQAAALCIJAAAAAAWkQQAAADAIpIAAAAAWEQSAAAAAItIAgAAAGARSQAAAAAsIgkAAACARSQBAAAAsIgkAAAAABaRBAAAAMAikgAAAABYRBIAAAAAi0gCAAAAYBFJAAAAACwiCQAAAIBFJAEAAACwiCQAAAAAFpEEAAAAwCKSAAAAAFhEEgAAAACLSAIAAABgEUkAAAAALCIJAAAAgEUkAQAAALCIJAAAAAAWkQQAAADAIpIAAAAAWEQSAAAAAItIAgAAAGARSQAAAAAsIgkAAACARSQBAAAAsIgkAAAAABaRBAAAAMAikgAAAABYRBIAAAAAi0gCAAAAYBFJAAAAACwiCQAAAIBFJAEAAACwiCQAAAAAFpEEAAAAwCKSAAAAAFhEEgAAAACLSAIAAABgEUkAAAAALCIJAAAAgEUkAQAAALCIJAAAAAAWkQQAAADAIpIAAAAAWEQSAAAAAItIAgAAAGARSQAAAAAsIgkAAACARSQBAAAAsIgkAAAAABaRBAAAAMAikgAAAABYRBIAAAAAi0gCAAAAYBFJAAAAACwiCQAAAIBFJAEAAACwiCQAAAAAFpEEAAAAwCKSAAAAAFhEEgAAAACLSAIAAABgEUkAAAAALCIJAAAAgEUkAQAAALCIJAAAAAAWkQQAAADAIpIAAAAAWEQSAAAAAItIAgAAAGARSQAAAAAsIgkAAACARSQBAAAAsIgkAAAAABaRBAAAAMAikgAAAABYRBIAAAAAi0gCAAAAYBFJAAAAACwiCQAAAIBFJAEAAACwiCQAAAAAFpEEAAAAwCKSAAAAAFhEEgAAAACLSAIAAABgEUkAAAAALCIJAAAAgEUkAQAAALCIJAAAAAAWkQQAAADAIpIAAAAAWEQSAAAAAItIAgAAAGARSQAAAAAsIgkAAACARSQBAAAAsIgkAAAAABaRBAAAAMAikgAAAABYRBIAAAAAi0gCAAAAYBFJAAAAACwiCQAAAIBFJAEAAACwiCQAAAAAFpEEAAAAwCKSAAAAAFhEEgAAAACLSAIAAABgEUkAAAAALCIJAAAAgEUkAQAAALCIJAAAAAAWkQQAAADAIpIAAAAAWEQSAAAAAItIAgAAAGARSQAAAAAsIgkAAACARSQBAAAAsIgkAAAAABaRBAAAAMAikgAAAABYRBIAAAAAi0gCAAAAYBFJAAAAACwiCQAAAIBFJAEAAACwiCQAAAAAFpEEAAAAwCKSAAAAAFhEEgAAAACLSAIAAABgEUkAAAAALCIJAAAAgEUkAQAAALCIJAAAAAAWkQQAAADAIpIAAAAAWEQSAAAAAItIAgAAAGARSQAAAAAsIgkAAACARSQBAAAAsIgkAAAAABaRBAAAAMAikgAAAABYRBIAAAAAi0gCAAAAYBFJAAAAACwiCQAAAIBFJAEAAACwiCQAAAAAFpEEAAAAwCKSAAAAAFhEEgAAAACLSAIAAABgEUkAAAAALCIJAAAAgEUkAQAAALCIJAAAAAAWkQQAAADAIpIAAAAAWEQSAAAAAItIAgAAAGARSQAAAAAsIgkAAACARSQBAAAAsIgkAAAAABaRBAAAAMAikgAAAABYRBIAAAAAi0gCAAAAYBFJAAAAACwiCQAAAIBFJAEAAACwiCQAAAAAFpEEAAAAwCKSAAAAAFhEEgAAAACLSAIAAABgEUkAAAAALCIJAAAAgEUkAQAAALCIJAAAAAAWkQQAAADAIpIAAAAAWEQSAAAAAItIAgAAAGARSQAAAAAsIgkAAACARSQBAAAAsIgkAAAAABaRBAAAAMAikgAAAABYRBIAAAAAi0gCAAAAYBFJAAAAACwiCQAAAIBFJAEAAACwiCQAAAAAFpEEAAAAwCKSAAAAAFhEEgAAAACLSAIAAABgEUkAAAAALCIJAAAAgEUkAQAAALCIJAAAAAAWkQQAAADAIpIAAAAAWEQSAAAAAItIAgAAAGARSQAAAAAsIgkAAACARSQBAAAAsIgkAAAAABaRBAAAAMAikgAAAABYRBIAAAAAi0gCAAAAYBFJAAAAACwiCQAAAIBFJAEAAACwiCQAAAAAFpEEAAAAwCKSAAAAAFhEEgAAAACLSAIAAABgEUkAAAAALCIJAAAAgEUkAQAAALCIJAAAAAAWkQQAAADAIpIAAAAAWEQSAAAAAItIAgAAAGARSQAAAAAsIgkAAACARSQBAAAAsIgkAAAAABaRBAAAAMAikgAAAABYRBIAAAAAi0gCAAAAYBFJAAAAACwiCQAAAIBFJAEAAACwiCQAAAAAFpEEAAAAwCKSAAAAAFhEEgAAAACLSAIAAABgEUkAAAAALCIJAAAAgEUkAQAAALCIJAAAAAAWkQQAAADAIpIAAAAAWEQSAAAAAItIAgAAAGARSQAAAAAsIgkAAACARSQBAAAAsIgkAAAAABaRBAAAAMAikgAAAABYRBIAAAAAi0gCAAAAYBFJAAAAACwiCQAAAIBFJAEAAACwiCQAAAAAFpEEAAAAwCKSAAAAAFhEEgAAAACLSAIAAABgEUkAAAAALCIJAAAAgEUkAQAAALCIJAAAAAAWkQQAAADAIpIAAAAAWEQSAAAAAItIAgAAAGARSQAAAAAsIgkAAACARSQBAAAAsIgkAAAAABaRBAAAAMAikgAAAABYRBIAAAAAi0gCAAAAYBFJAAAAACwiCQAAAIBFJAEAAACwiCQAAAAAFpEEAAAAwCKSAAAAAFhEEgAAAACLSAIAAABgEUkAAAAALCIJAAAAgEUkAQAAALCIJAAAAAAWkQQAAADAIpIAAAAAWEQSAAAAAItIAgAAAGARSQAAAAAsIgkAAACARSQBAAAAsIgkAAAAABaRBAAAAMAikgAAAABYRBIAAAAAi0gCAAAAYBFJAAAAACwiCQAAAIBFJAEAAACwiCQAAAAAFpEEAAAAwCKSAAAAAFhEEgAAAACLSAIAAABgEUkAAAAALCIJAAAAgEUkAQAAALCIJAAAAAAWkQQAAADAIpIAAAAAWEQSAAAAAItIAgAAAGARSQAAAAAsIgkAAACARSQBAAAAsIgkAAAAABaRBAAAAMAikgAAAABYRBIAAAAAi0gCAAAAYBFJAAAAACwiCQAAAIBFJAEAAACwiCQAAAAAFpEEAAAAwCKSAAAAAFhEEgAAAACLSAIAAABgEUkAAAAALCIJAAAAgEUkAQAAALCIJAAAAAAWkQQAAADAIpIAAAAAWEQSAAAAAItIAgAAAGARSQAAAAAsIgkAAACARSQBAAAAsIgkAAAAABaRBAAAAMAikgAAAABYRBIAAAAAi0gCAAAAYBFJAAAAACwiCQAAAIBFJAEAAACwiCQAAAAAFpEEAAAAwCKSAAAAAFhEEgAAAACLSAIAAABgEUkAAAAALCIJAAAAgEUkAQAAALCIJAAAAAAWkQQAAADAIpIAAAAAWEQSAAAAAItIAgAAAGARSQAAAAAsIgkAAACARSQBAAAAsIgkAAAAABaRBAAAAMAikgAAAABYRBIAAAAAi0gCAAAAYBFJAAAAACwiCQAAAIBFJAEAAACwiCQAAAAAFpEEAAAAwCKSAAAAAFhEEgAAAACLSAIAAABgEUkAAAAALCIJAAAAgEUkAQAAALCIJAAAAAAWkQQAAADAIpIAAAAAWEQSAAAAAItIAgAAAGARSQAAAAAsIgkAAACARSQBAAAAsIgkAAAAABaRBAAAAMAikgAAAABYRBIAAAAAi0gCAAAAYBFJAAAAACwiCQAAAIBFJAEAAACwiCQAAAAAFpEEAAAAwCKSAAAAAFhEEgAAAACLSAIAAABgEUkAAAAALCIJAAAAgEUkAQAAALCIJAAAAAAWkQQAAADAIpIAAAAAWEQSAAAAAItIAgAAAGARSQAAAAAsIgkAAACARSQBAAAAsIgkAAAAABaRBAAAAMAikgAAAABYRBIAAAAAi0gCAAAAYBFJAAAAACwiCQAAAIBFJAEAAACwiCQAAAAAFpEEAAAAwCKSAAAAAFhEEgAAAACLSAIAAABgEUkAAAAALCIJAAAAgEUkAQAAALCIJAAAAAAWkQQAAADAIpIAAAAAWEQSAAAAAItIAgAAAGARSQAAAAAsIgkAAACARSQBAAAAsIgkAAAAABaRBAAAAMAikgAAAABYRBIAAAAAi0gCAAAAYBFJAAAAACwiCQAAAIBFJAEAAACwiCQAAAAAFpEEAAAAwCKSAAAAAFhEEgAAAACLSAIAAABgEUkAAAAALCIJAAAAgEUkAQAAALCIJAAAAAAWkQQAAADAIpIAAAAAWEQSAAAAAItIAgAAAGARSQAAAAAsIgkAAACARSQBAAAAsIgkAAAAABaRBAAAAMAikgAAAABYRBIAAAAAi0gCAAAAYBFJAAAAACwiCQAAAIBFJAEAAACwiCQAAAAAFpEEAAAAwCKSAAAAAFhEEgAAAACLSAIAAABgEUkAAAAALCIJAAAAgEUkAQAAALCIJAAAAAAWkQQAAADAIpIAAAAAWEQSAAAAAItIAgAAAGARSQAAAAAsIgkAAACARSQBAAAAsIgkAAAAABaRBAAAAMAikgAAAABYRBIAAAAAi0gCAAAAYBFJAAAAACwiCQAAAIBFJAEAAACwiCQAAAAAFpEEAAAAwCKSAAAAAFhEEgAAAACLSAIAAABgEUkAAAAALCIJAAAAgEUkAQAAALCIJAAAAAAWkQQAAADAIpIAAAAAWEQSAAAAAItIAgAAAGARSQAAAAAsIgkAAACARSQBAAAAsIgkAAAAABaRBAAAAMAikgAAAABYRBIAAAAAi0gCAAAAYBFJAAAAACwiCQAAAIBFJAEAAACwiCQAAAAAFpEEAAAAwCKSAAAAAFhEEgAAAABLZvEV9Qr8xRAAAAAASUVORK5CYII="/></symbol><use xlink:href="#im2" x="0" y="0" width="1560" height="2456"/></g></g></g><g><clipPath id="cp3"><path transform="matrix(1,0,0,-1,0,2448)" d="M 32 28 L 1528 28 L 1528 2420 L 32 2420 Z "/></clipPath><g clip-path="url(#cp3)"><clipPath id="cp4"><path transform="matrix(1,0,0,-1,0,2448)" d="M 1112.1 680.7587 L 1098.936 671.1768 L 1097.16 687.6313 C 1092.278 665.5576 1086.207 643.5719 1078.634 622.9377 C 1061.259 575.548 1030.556 539.6363 991.2844 518.3651 C 988.9836 404.758 883.6349 343.4667 784.3751 343.4667 C 684.2923 343.4667 578.0609 404.7087 575.7205 518.2764 C 536.3696 539.587 505.6268 575.4987 488.2323 622.9377 C 479.2435 647.4674 472.3445 673.8682 467.0364 700.0759 L 463.6342 668.4936 L 455.1858 674.4319 L 421.2724 360.4915 L 345.4268 413.6546 L 400.516 923.7587 C 359.6181 977.0598 311.2626 1043.563 298.6977 1075.77 C 278.5363 1127.278 304.2016 1390.828 317.6491 1512.159 L 233.5625 1734.684 L 233.5625 1741.935 C 233.5625 1850.823 376.2694 2129.401 424.358 2220.301 C 450.6306 2273.25 472.2835 2313.63 478.3256 2324.843 L 530.4276 2420 C 530.4276 2420 578.0118 2089.298 577.9771 2089.004 L 603.6328 1910.349 L 627.4751 1713.692 C 656.4059 1722.983 697.7071 1733.983 742.1899 1738.586 C 753.9293 1767.049 766.6556 1785.924 780.625 1785.924 C 807.0499 1785.924 833.3892 1761.183 857.2572 1733.972 C 885.2824 1729.128 910.9329 1722.39 931.5017 1716.104 L 958.1732 1910.341 L 1031.265 2420 L 1068.638 2350.303 L 1069.203 2354.227 L 1127.445 2245.911 C 1148.261 2207.329 1330.437 1865.454 1330.437 1741.935 L 1330.428 1741.935 L 1330.428 1734.694 L 1247.838 1512.139 C 1261.266 1390.828 1287.973 1127.239 1267.811 1075.741 C 1255.365 1043.888 1207.922 978.3603 1167.342 925.2957 L 1222.292 418.6005 L 1146.447 363.5457 L 1112.1 680.7587 Z " fill-rule="evenodd"/></clipPath><g clip-path="url(#cp4)"><clipPath id="cp5"><path transform="matrix(1,0,0,-1,0,2448)" d="M -16 -24 L 1580 -24 L 1580 2468 L -16 2468 Z "/></clipPath><g clip-path="url(#cp5)"><path transform="matrix(1,0,0,-1,0,2448)" d="M 213.5625 2440 L 1350.437 2440 L 1350.437 323.4667 L 213.5625 323.4667 Z " fill="#ffffff"/></g></g><clipPath id="cp6"><path transform="matrix(1,0,0,-1,0,2448)" d="M 1527.312 558.9249 L 779.651 28.69804 L 32 558.9249 L 32 1795.358 C 32 1795.358 308.4514 1898.518 780.6671 1898.518 C 1252.883 1898.518 1527.312 1795.358 1527.312 1795.358 L 1527.312 558.9249 Z " fill-rule="evenodd"/></clipPath><g clip-path="url(#cp6)"><clipPath id="cp7"><path transform="matrix(1,0,0,-1,0,2448)" d="M -16 -24 L 1580 -24 L 1580 2468 L -16 2468 Z "/></clipPath><g clip-path="url(#cp7)"><path transform="matrix(1,0,0,-1,0,2448)" d="M 12 1918.518 L 1547.312 1918.518 L 1547.312 8.698039 L 12 8.698039 Z " fill="#ffffff"/></g></g><clipPath id="cp8"><path transform="matrix(1,0,0,-1,0,2448)" d="M 1102.676 888.0417 L 780.2891 888.0417 L 780.2891 1428.714 L 453.1714 903.8485 L 402.3125 364.8874 L 775.252 98.08248 L 780.2891 94.47059 L 1161.688 366.8074 L 1102.676 888.0417 Z " fill-rule="evenodd"/></clipPath><g clip-path="url(#cp8)"><clipPath id="cp9"><path transform="matrix(1,0,0,-1,0,2448)" d="M -16 -24 L 1580 -24 L 1580 2468 L -16 2468 Z "/></clipPath><g clip-path="url(#cp9)"><path transform="matrix(1,0,0,-1,0,2448)" d="M 382.3125 1448.714 L 1181.688 1448.714 L 1181.688 74.47059 L 382.3125 74.47059 Z " fill="#3b3b63"/></g></g><clipPath id="cp10"><path transform="matrix(1,0,0,-1,0,2448)" d="M 772.6201 103.8667 L 78.875 596.7912 L 78.875 1746.239 C 78.875 1746.239 335.3942 1842.141 773.563 1842.141 C 1211.732 1842.141 1466.375 1746.239 1466.375 1746.239 L 1466.375 596.7912 L 772.6201 103.8667 Z " fill-rule="evenodd"/></clipPath><g clip-path="url(#cp10)"><clipPath id="cp11"><path transform="matrix(1,0,0,-1,0,2448)" d="M -16 -24 L 1580 -24 L 1580 2468 L -16 2468 Z "/></clipPath><g clip-path="url(#cp11)"><path transform="matrix(1,0,0,-1,0,2448)" d="M 58.875 1862.141 L 1486.375 1862.141 L 1486.375 83.86667 L 58.875 83.86667 Z " fill="#dbdbdb"/></g></g><clipPath id="cp12"><path transform="matrix(1,0,0,-1,0,2448)" d="M 782.9527 1842.141 C 782.6286 1842.141 782.3241 1842.131 782 1842.131 L 782 103.8667 L 782.0098 103.8667 L 1475.75 596.7994 L 1475.75 1746.237 C 1475.75 1746.237 1221.112 1842.141 782.9527 1842.141 Z " fill-rule="evenodd"/></clipPath><g clip-path="url(#cp12)"><clipPath id="cp13"><path transform="matrix(1,0,0,-1,0,2448)" d="M -16 -24 L 1580 -24 L 1580 2468 L -16 2468 Z "/></clipPath><g clip-path="url(#cp13)"><path transform="matrix(1,0,0,-1,0,2448)" d="M 762 1862.141 L 1495.75 1862.141 L 1495.75 83.86667 L 762 83.86667 Z " fill="#c6c6c6"/></g></g><clipPath id="cp14"><path transform="matrix(1,0,0,-1,0,2448)" d="M 1157 367.2637 L 1098.352 888.4392 L 777.3125 888.4392 L 777.3125 94.47059 L 1157 367.2637 Z " fill-rule="evenodd"/></clipPath><g clip-path="url(#cp14)"><clipPath id="cp15"><path transform="matrix(1,0,0,-1,0,2448)" d="M -16 -24 L 1580 -24 L 1580 2468 L -16 2468 Z "/></clipPath><g clip-path="url(#cp15)"><path transform="matrix(1,0,0,-1,0,2448)" d="M 757.3125 908.4392 L 1177 908.4392 L 1177 74.47059 L 757.3125 74.47059 Z " fill="#3b3b63"/></g></g><clipPath id="cp16"><path transform="matrix(1,0,0,-1,0,2448)" d="M 402.3125 364.8874 L 782 94.47059 L 782 1428.714 L 453.4016 903.8485 L 402.3125 364.8874 Z " fill-rule="evenodd"/></clipPath><g clip-path="url(#cp16)"><clipPath id="cp17"><path transform="matrix(1,0,0,-1,0,2448)" d="M -16 -24 L 1580 -24 L 1580 2468 L -16 2468 Z "/></clipPath><g clip-path="url(#cp17)"><path transform="matrix(1,0,0,-1,0,2448)" d="M 382.3125 1448.714 L 802 1448.714 L 802 74.47059 L 382.3125 74.47059 Z " fill="#53537a"/></g></g><clipPath id="cp18"><path transform="matrix(1,0,0,-1,0,2448)" d="M 941.375 521.9922 C 941.375 434.0455 857.474 390.4471 780.5048 390.4471 C 703.5355 390.4471 617.9375 434.0455 617.9375 521.9922 " fill-rule="evenodd"/></clipPath><g clip-path="url(#cp18)"><clipPath id="cp19"><path transform="matrix(1,0,0,-1,0,2448)" d="M -16 -24 L 1580 -24 L 1580 2468 L -16 2468 Z "/></clipPath><g clip-path="url(#cp19)"><path transform="matrix(1,0,0,-1,0,2448)" d="M 597.9375 541.9922 L 961.375 541.9922 L 961.375 370.4471 L 597.9375 370.4471 Z " fill="#bc9375"/></g></g><clipPath id="cp20"><path transform="matrix(1,0,0,-1,0,2448)" d="M 894.5 568.9725 C 894.5 465.2393 837.638 437.4275 779.6611 437.4275 C 721.6937 437.4275 664.8125 465.2393 664.8125 568.9725 " fill-rule="evenodd"/></clipPath><g clip-path="url(#cp20)"><clipPath id="cp21"><path transform="matrix(1,0,0,-1,0,2448)" d="M -16 -24 L 1580 -24 L 1580 2468 L -16 2468 Z "/></clipPath><g clip-path="url(#cp21)"><path transform="matrix(1,0,0,-1,0,2448)" d="M 644.8125 588.9725 L 914.5 588.9725 L 914.5 417.4275 L 644.8125 417.4275 Z " fill="#083251"/></g></g><clipPath id="cp22"><path transform="matrix(1,0,0,-1,0,2448)" d="M 779.661 475.0118 C 718.1573 475.0118 688.25 519.5975 688.25 611.2549 L 717.5752 611.2549 C 717.5752 503.9478 759.497 503.9478 779.661 503.9478 C 799.8155 503.9478 841.7468 503.9478 841.7468 611.2549 L 871.0625 611.2549 C 871.0625 519.5975 841.1552 475.0118 779.661 475.0118 Z " fill-rule="evenodd"/></clipPath><g clip-path="url(#cp22)"><clipPath id="cp23"><path transform="matrix(1,0,0,-1,0,2448)" d="M -16 -24 L 1580 -24 L 1580 2468 L -16 2468 Z "/></clipPath><g clip-path="url(#cp23)"><path transform="matrix(1,0,0,-1,0,2448)" d="M 668.25 631.2549 L 891.0625 631.2549 L 891.0625 455.0118 L 668.25 455.0118 Z " fill="#ffffff"/></g></g><clipPath id="cp24"><path transform="matrix(1,0,0,-1,0,2448)" d="M 1269.5 1675.155 C 1269.5 1787.941 1077.684 2142.816 1077.684 2142.816 L 1012.794 1692.761 L 954.5584 1597.743 L 780.0153 1590.693 L 779.3259 1589.296 L 779.3259 1590.693 L 604.7541 1597.743 L 546.538 1692.761 L 481.6481 2142.816 C 481.6481 2142.816 289.8125 1787.941 289.8125 1675.155 L 370.8555 1458.437 C 370.8555 1458.437 329.9606 1094.412 348.6319 1046.751 C 367.2457 999.0803 496.5468 839.6681 496.5468 839.6681 C 496.5468 839.6681 496.1638 705.6543 531.5626 609.3057 C 556.8216 540.503 612.4716 512.5961 665.7566 512.5961 C 747.3741 512.5961 779.3068 587.0049 779.3068 587.0049 C 779.3068 587.0049 812.0055 512.5961 893.6229 512.5961 C 946.8984 512.5961 1002.491 540.4554 1027.807 609.3057 C 1063.168 705.6163 1062.814 839.6681 1062.814 839.6681 C 1062.814 839.6681 1192.086 999.0803 1210.738 1046.751 C 1229.4 1094.422 1188.495 1458.437 1188.495 1458.437 L 1269.5 1675.155 Z " fill-rule="evenodd"/></clipPath><g clip-path="url(#cp24)"><clipPath id="cp25"><path transform="matrix(1,0,0,-1,0,2448)" d="M -16 -24 L 1580 -24 L 1580 2468 L -16 2468 Z "/></clipPath><g clip-path="url(#cp25)"><path transform="matrix(1,0,0,-1,0,2448)" d="M 269.8125 2162.816 L 1289.5 2162.816 L 1289.5 492.5961 L 269.8125 492.5961 Z " fill="#c49a7e"/></g></g><clipPath id="cp26"><path transform="matrix(1,0,0,-1,0,2448)" d="M 777.303 1589.98 L 776.9695 1589.306 L 776.9695 1590.693 L 603.238 1597.743 L 545.3021 1692.761 L 480.7055 2142.816 C 480.7055 2142.816 289.8125 1787.941 289.8125 1675.155 L 370.4463 1458.437 C 370.4463 1458.437 329.7578 1094.412 348.3106 1046.751 C 366.8729 999.0803 495.504 839.6681 495.504 839.6681 C 495.504 839.6681 495.1704 705.6543 530.3608 609.3057 C 555.5362 540.503 610.9183 512.5961 663.8992 512.5961 C 745.1714 512.5961 776.9504 587.0049 776.9504 587.0049 C 776.9504 587.0049 777.0933 586.7389 777.3125 586.2543 L 777.3125 1589.98 L 777.303 1589.98 Z " fill-rule="evenodd"/></clipPath><g clip-path="url(#cp26)"><clipPath id="cp27"><path transform="matrix(1,0,0,-1,0,2448)" d="M -16 -24 L 1580 -24 L 1580 2468 L -16 2468 Z "/></clipPath><g clip-path="url(#cp27)"><path transform="matrix(1,0,0,-1,0,2448)" d="M 269.8125 2162.816 L 797.3125 2162.816 L 797.3125 492.5961 L 269.8125 492.5961 Z " fill="#d8b7a0"/></g></g><clipPath id="cp28"><path transform="matrix(1,0,0,-1,0,2448)" d="M 1189.987 1442.178 C 1175.151 1473.084 1196.244 1546.207 1196.244 1546.207 C 1075.391 1669.535 1045.165 1926.706 1045.165 1926.706 C 1022.601 1845.671 973.5568 1606.746 973.5568 1606.746 C 973.5568 1606.746 883.3585 1640.187 780.7509 1640.349 L 780.3879 1640.349 L 779.9867 1640.349 C 774.3505 1640.32 768.8002 1640.178 763.25 1639.997 L 763.25 631.8203 L 770.9114 620.651 L 770.9114 626.1692 L 775.6496 626.1692 L 775.6496 620.651 L 775.6974 626.1692 L 785.0497 626.1692 L 785.0497 620.651 L 785.0497 626.1692 L 789.8357 626.1692 L 789.8357 620.651 L 873.3757 742.0987 L 891.5357 1083.125 L 995.5476 965.011 L 1129.536 926.0417 C 1129.536 926.0417 1179.67 961.6203 1179.67 961.4873 C 1200.954 991.1583 1208.013 1016.432 1213.162 1029.548 C 1231.771 1077.265 1189.987 1442.178 1189.987 1442.178 Z " fill-rule="evenodd"/></clipPath><g clip-path="url(#cp28)"><clipPath id="cp29"><path transform="matrix(1,0,0,-1,0,2448)" d="M -16 -24 L 1580 -24 L 1580 2468 L -16 2468 Z "/></clipPath><g clip-path="url(#cp29)"><path transform="matrix(1,0,0,-1,0,2448)" d="M 743.25 1946.706 L 1237.938 1946.706 L 1237.938 600.651 L 743.25 600.651 Z " fill="#3b3b63"/></g></g><clipPath id="cp30"><path transform="matrix(1,0,0,-1,0,2448)" d="M 589.5215 1606.736 C 589.5215 1606.736 540.6429 1845.659 518.1831 1926.706 C 518.1831 1926.706 488.0908 1669.528 367.674 1546.196 C 367.674 1546.196 388.6872 1473.061 373.9075 1442.164 C 373.9075 1442.164 332.2808 1077.221 350.8196 1029.579 C 355.9397 1016.453 363.0297 991.1881 384.2047 961.5162 C 384.2047 961.6492 434.1778 926.0601 434.1778 926.0601 L 567.6327 965.04 L 671.2333 1083.138 L 689.3724 742.1023 L 772.5498 620.651 L 772.5498 626.1693 L 777.3177 626.1693 L 777.3177 620.651 L 777.3177 626.1693 L 781.9905 626.1693 L 781.9905 1640.331 C 679.3892 1640.16 589.5215 1606.736 589.5215 1606.736 Z " fill-rule="evenodd"/></clipPath><g clip-path="url(#cp30)"><clipPath id="cp31"><path transform="matrix(1,0,0,-1,0,2448)" d="M -16 -24 L 1580 -24 L 1580 2468 L -16 2468 Z "/></clipPath><g clip-path="url(#cp31)"><path transform="matrix(1,0,0,-1,0,2448)" d="M 326.0625 1946.706 L 801.9905 1946.706 L 801.9905 600.651 L 326.0625 600.651 Z " fill="#53537a"/></g></g><clipPath id="cp32"><path transform="matrix(1,0,0,-1,0,2448)" d="M 1023.522 1212.604 L 1023.522 1212.604 L 905.6571 1212.604 L 866.375 1212.604 L 866.375 1210.984 C 866.375 1157.374 913.828 1113.945 969.4904 1113.945 C 1025.172 1113.945 1072.625 1157.383 1072.625 1210.984 L 1072.625 1212.604 L 1023.522 1212.604 Z " fill-rule="evenodd"/></clipPath><g clip-path="url(#cp32)"><clipPath id="cp33"><path transform="matrix(1,0,0,-1,0,2448)" d="M -16 -24 L 1580 -24 L 1580 2468 L -16 2468 Z "/></clipPath><g clip-path="url(#cp33)"><path transform="matrix(1,0,0,-1,0,2448)" d="M 846.375 1232.604 L 1092.625 1232.604 L 1092.625 1093.945 L 846.375 1093.945 Z " fill="#333152"/></g></g><clipPath id="cp34"><path transform="matrix(1,0,0,-1,0,2448)" d="M 903.875 1212.604 L 903.875 1210.937 C 903.875 1178.12 929.9993 1151.529 962.4735 1151.529 C 994.9477 1151.529 1021.062 1178.12 1021.062 1210.937 L 1021.062 1212.604 L 903.875 1212.604 Z " fill-rule="evenodd"/></clipPath><g clip-path="url(#cp34)"><clipPath id="cp35"><path transform="matrix(1,0,0,-1,0,2448)" d="M -16 -24 L 1580 -24 L 1580 2468 L -16 2468 Z "/></clipPath><g clip-path="url(#cp35)"><path transform="matrix(1,0,0,-1,0,2448)" d="M 883.875 1232.604 L 1041.062 1232.604 L 1041.062 1131.529 L 883.875 1131.529 Z " fill="#ffffff"/></g></g><clipPath id="cp36"><path transform="matrix(1,0,0,-1,0,2448)" d="M 980.6553 1212.604 L 953.0633 1212.604 C 952.795 1212.604 952.5651 1212.472 952.3256 1212.425 C 955.7458 1211.718 957.6428 1204.089 956.9051 1199.012 C 955.8033 1191.25 949.0778 1185.862 941.375 1185.73 C 943.6168 1175.585 952.0286 1167.428 963.1995 1165.883 C 977.4745 1163.896 990.667 1173.523 992.6885 1187.548 C 994.1447 1197.872 989.0957 1212.604 980.6553 1212.604 Z " fill-rule="evenodd"/></clipPath><g clip-path="url(#cp36)"><clipPath id="cp37"><path transform="matrix(1,0,0,-1,0,2448)" d="M -16 -24 L 1580 -24 L 1580 2468 L -16 2468 Z "/></clipPath><g clip-path="url(#cp37)"><path transform="matrix(1,0,0,-1,0,2448)" d="M 921.375 1232.604 L 1012.938 1232.604 L 1012.938 1145.624 L 921.375 1145.624 Z " fill="#333152"/></g></g><clipPath id="cp38"><path transform="matrix(1,0,0,-1,0,2448)" d="M 648.5055 1212.604 L 648.5055 1212.604 L 530.6648 1212.604 L 491.375 1212.604 L 491.375 1210.984 C 491.375 1157.374 538.8354 1113.945 594.4856 1113.945 C 650.1646 1113.945 697.625 1157.383 697.625 1210.984 L 697.625 1212.604 L 648.5055 1212.604 Z " fill-rule="evenodd"/></clipPath><g clip-path="url(#cp38)"><clipPath id="cp39"><path transform="matrix(1,0,0,-1,0,2448)" d="M -16 -24 L 1580 -24 L 1580 2468 L -16 2468 Z "/></clipPath><g clip-path="url(#cp39)"><path transform="matrix(1,0,0,-1,0,2448)" d="M 471.375 1232.604 L 717.625 1232.604 L 717.625 1093.945 L 471.375 1093.945 Z " fill="#333152"/></g></g><clipPath id="cp40"><path transform="matrix(1,0,0,-1,0,2448)" d="M 528.875 1212.604 L 528.875 1210.937 C 528.875 1178.12 555.0226 1151.529 587.4544 1151.529 C 619.9435 1151.529 646.0625 1178.12 646.0625 1210.937 L 646.0625 1212.604 L 528.875 1212.604 Z " fill-rule="evenodd"/></clipPath><g clip-path="url(#cp40)"><clipPath id="cp41"><path transform="matrix(1,0,0,-1,0,2448)" d="M -16 -24 L 1580 -24 L 1580 2468 L -16 2468 Z "/></clipPath><g clip-path="url(#cp41)"><path transform="matrix(1,0,0,-1,0,2448)" d="M 508.875 1232.604 L 666.0625 1232.604 L 666.0625 1131.529 L 508.875 1131.529 Z " fill="#ffffff"/></g></g><clipPath id="cp42"><path transform="matrix(1,0,0,-1,0,2448)" d="M 605.6792 1212.604 L 578.0619 1212.604 C 577.8224 1212.604 577.5637 1212.472 577.3434 1212.425 C 580.7537 1211.718 582.6408 1204.089 581.9224 1199.012 C 580.8111 1191.25 574.1247 1185.862 566.375 1185.73 C 568.6453 1175.585 577.056 1167.428 588.2064 1165.883 C 602.4701 1163.896 615.6897 1173.523 617.6822 1187.548 C 619.1574 1197.872 614.1187 1212.604 605.6792 1212.604 Z " fill-rule="evenodd"/></clipPath><g clip-path="url(#cp42)"><clipPath id="cp43"><path transform="matrix(1,0,0,-1,0,2448)" d="M -16 -24 L 1580 -24 L 1580 2468 L -16 2468 Z "/></clipPath><g clip-path="url(#cp43)"><path transform="matrix(1,0,0,-1,0,2448)" d="M 546.375 1232.604 L 637.9375 1232.604 L 637.9375 1145.624 L 546.375 1145.624 Z " fill="#333152"/></g></g><clipPath id="cp44"><path transform="matrix(1,0,0,-1,0,2448)" d="M 1013.379 1259.584 C 1020.01 1266.782 1076.302 1330.055 1001.014 1330.055 C 932.9832 1330.055 884.0345 1275.679 871.0625 1259.584 L 1013.379 1259.584 Z " fill-rule="evenodd"/></clipPath><g clip-path="url(#cp44)"><clipPath id="cp45"><path transform="matrix(1,0,0,-1,0,2448)" d="M -16 -24 L 1580 -24 L 1580 2468 L -16 2468 Z "/></clipPath><g clip-path="url(#cp45)"><path transform="matrix(1,0,0,-1,0,2448)" d="M 851.0625 1350.055 L 1059.812 1350.055 L 1059.812 1239.584 L 851.0625 1239.584 Z " fill="#c49a7e"/></g></g><clipPath id="cp46"><path transform="matrix(1,0,0,-1,0,2448)" d="M 692.9375 1259.584 C 679.9737 1275.679 631.0199 1330.055 562.9625 1330.055 C 487.7052 1330.055 544.0036 1266.782 550.5963 1259.584 L 692.9375 1259.584 Z " fill-rule="evenodd"/></clipPath><g clip-path="url(#cp46)"><clipPath id="cp47"><path transform="matrix(1,0,0,-1,0,2448)" d="M -16 -24 L 1580 -24 L 1580 2468 L -16 2468 Z "/></clipPath><g clip-path="url(#cp47)"><path transform="matrix(1,0,0,-1,0,2448)" d="M 504.1875 1350.055 L 712.9375 1350.055 L 712.9375 1239.584 L 504.1875 1239.584 Z " fill="#d8b7a0"/></g></g><clipPath id="cp48"><path transform="matrix(1,0,0,-1,0,2448)" d="M 453.875 1240.792 L 739.8125 1240.792 L 739.8125 1212.604 L 453.875 1212.604 L 453.875 1240.792 Z " fill-rule="evenodd"/></clipPath><g clip-path="url(#cp48)"><clipPath id="cp49"><path transform="matrix(1,0,0,-1,0,2448)" d="M -16 -24 L 1580 -24 L 1580 2468 L -16 2468 Z "/></clipPath><g clip-path="url(#cp49)"><path transform="matrix(1,0,0,-1,0,2448)" d="M 433.875 1260.792 L 759.8125 1260.792 L 759.8125 1192.604 L 433.875 1192.604 Z " fill="#53537a"/></g></g><clipPath id="cp50"><path transform="matrix(1,0,0,-1,0,2448)" d="M 1307 1678.829 C 1307 1798.019 1131.831 2127.913 1111.815 2165.142 L 1055.813 2269.663 L 975.5894 1709.851 L 938.5626 1649.044 C 902.8136 1661.013 841.9763 1677.717 780.7195 1677.717 C 719.5294 1677.717 659.1021 1661.07 623.5057 1649.082 L 586.4598 1709.86 L 558.3011 1906.095 C 558.3392 1906.418 558.3869 1906.855 558.3869 1907.055 L 558.1676 1907.084 L 506.1126 2269.663 L 448.9275 2165.142 C 428.8836 2127.913 252.3125 1798.019 252.3125 1678.829 L 252.3125 1671.832 L 333.165 1457.106 C 320.2347 1340.027 295.5565 1085.714 314.9425 1036.011 C 327.0241 1004.933 373.5198 940.7603 412.8447 889.3272 L 359.8743 397.1006 L 432.8028 345.8007 L 471.3457 703.8641 C 476.8859 669.0398 485.058 632.2666 497.1873 599.049 C 513.9128 553.2727 543.4732 518.6195 581.3105 498.0558 C 583.5609 388.4683 685.7065 329.3725 781.94 329.3725 C 877.3821 329.3725 978.679 388.5158 980.8913 498.1414 C 1018.652 518.6671 1048.175 553.3202 1064.881 599.049 C 1077.516 633.5976 1085.802 672.0725 1091.314 708.1042 L 1130.086 348.7479 L 1203.014 401.8732 L 1150.177 890.8103 C 1189.197 942.0152 1234.815 1005.246 1246.783 1035.983 C 1266.168 1085.676 1240.489 1340.027 1227.578 1457.087 L 1306.99 1671.842 L 1306.99 1678.829 L 1307 1678.829 Z M 332 1687.566 C 336.3777 1749.078 400.2031 1896.46 461.0849 2020.667 L 477.3125 1907.101 C 471.1234 1864.639 442.8383 1698.112 366.9648 1593.145 L 332 1687.566 Z M 782.794 409.2392 C 740.2878 409.2392 679.8508 428.096 664.8125 478.0828 C 666.3532 478.0357 667.8655 477.9041 669.4346 477.9041 C 677.6485 477.9041 685.352 478.6565 692.7908 479.7098 C 714.3511 449.84 747.9345 440.6797 781.9622 440.6797 C 816.0466 440.6797 849.6962 449.7553 871.2943 479.6722 C 878.6858 478.6659 886.3042 477.9041 894.452 477.9041 C 896.0494 477.9041 897.5901 478.0357 899.1875 478.0828 C 884.3004 428.096 824.6669 409.2392 782.794 409.2392 Z M 730.4375 490.9479 C 741.011 495.7894 750.5599 501.5554 758.9781 507.898 C 766.6714 505.5717 774.0554 505.5717 779.7191 505.5717 C 785.3537 505.5717 792.6604 505.522 800.2957 507.8483 C 808.7332 501.5554 818.3015 495.7894 828.875 490.9479 C 815.6147 480.748 799.2809 475.0118 779.7577 475.0118 C 760.1282 475.0118 743.7171 480.7082 730.4375 490.9479 Z M 1173.243 1064.807 C 1161.902 1035.801 1083.613 932.1618 1031.609 867.813 L 1022.933 857.0248 L 1022.972 843.2588 C 1022.972 842.0126 1022.933 714.9798 990.4009 626.0769 C 966.8781 561.8232 914.6348 554.8784 893.2904 554.8784 C 839.2509 554.8784 815.9287 604.2055 815.107 605.9845 L 812.021 652.1912 L 746.3252 652.1912 L 743.3633 606.2509 C 742.427 604.158 719.6781 555.0021 665.9061 555.0021 C 644.5139 555.0021 592.2898 561.8708 568.7478 626.1245 C 536.3203 714.7135 536.1674 842.0126 536.1674 843.3064 L 536.2152 857.0723 L 527.5399 867.813 C 475.5641 932.1142 397.2661 1035.753 386.2117 1064.056 C 377.374 1094.67 391.9635 1292.644 410.5371 1458.54 L 411.5595 1467.749 L 396.9031 1507.029 C 447.2546 1559.591 482.5866 1631.931 506.9598 1700.789 L 509.3292 1684.027 L 589.2992 1553.179 L 620.542 1566.536 C 621.3255 1566.869 701.4483 1600.813 779.2495 1600.813 C 856.5538 1600.813 937.9952 1566.84 938.7596 1566.507 L 969.9546 1553.265 L 1049.829 1684.055 L 1052.963 1705.898 C 1077.078 1636.364 1112.372 1562.731 1162.962 1508.999 L 1147.618 1467.777 L 1148.64 1458.578 C 1167.204 1292.644 1181.794 1094.67 1173.243 1064.807 Z M 1192.873 1593.145 C 1110.187 1709.306 1084.246 1898.144 1082 1915.403 L 1097.083 2020.667 C 1158.482 1895.814 1222.897 1747.646 1227.313 1685.81 L 1192.873 1593.145 Z " fill-rule="evenodd"/></clipPath><g clip-path="url(#cp50)"><clipPath id="cp51"><path transform="matrix(1,0,0,-1,0,2448)" d="M -16 -24 L 1580 -24 L 1580 2468 L -16 2468 Z "/></clipPath><g clip-path="url(#cp51)"><path transform="matrix(1,0,0,-1,0,2448)" d="M 232.3125 2289.663 L 1327 2289.663 L 1327 309.3725 L 232.3125 309.3725 Z " fill="#333152"/></g></g><clipPath id="cp52"><path transform="matrix(1,0,0,-1,0,2448)" d="M 870.2128 785.0824 L 685.0288 785.0824 C 685.0288 785.0824 660.125 742.0627 660.125 728.1047 C 660.125 686.6508 774.1044 620.651 774.1044 620.651 C 774.1044 620.651 894.5 688.6175 894.5 728.1047 C 894.5 746.9413 870.2128 785.0824 870.2128 785.0824 Z " fill-rule="evenodd"/></clipPath><g clip-path="url(#cp52)"><clipPath id="cp53"><path transform="matrix(1,0,0,-1,0,2448)" d="M -16 -24 L 1580 -24 L 1580 2468 L -16 2468 Z "/></clipPath><g clip-path="url(#cp53)"><path transform="matrix(1,0,0,-1,0,2448)" d="M 640.125 805.0824 L 914.5 805.0824 L 914.5 600.651 L 640.125 600.651 Z " fill="#333152"/></g></g><clipPath id="cp54"><path transform="matrix(1,0,0,-1,0,2448)" d="M 832.5416 656.8079 C 822.5264 674.278 809.5964 677.4669 803.6638 663.9945 C 797.75 650.5128 801.132 625.4243 811.1472 607.9909 C 821.1624 590.5117 834.1018 587.3228 840.0063 600.8044 C 845.9388 614.2769 842.5755 639.3746 832.5416 656.8079 Z " fill-rule="evenodd"/></clipPath><g clip-path="url(#cp54)"><clipPath id="cp55"><path transform="matrix(1,0,0,-1,0,2448)" d="M -16 -24 L 1580 -24 L 1580 2468 L -16 2468 Z "/></clipPath><g clip-path="url(#cp55)"><path transform="matrix(1,0,0,-1,0,2448)" d="M 780.75 692.3294 L 862.9375 692.3294 L 862.9375 572.4627 L 780.75 572.4627 Z " fill="#c49a7e"/></g></g><clipPath id="cp56"><path transform="matrix(1,0,0,-1,0,2448)" d="M 722.0735 656.8079 C 712.0371 639.3746 708.701 614.2769 714.607 600.8044 C 720.5223 587.3228 733.4369 590.5117 743.5014 607.9909 C 753.5191 625.4151 756.8739 650.5128 750.9399 663.9945 C 745.0339 677.4669 732.11 674.278 722.0735 656.8079 Z " fill-rule="evenodd"/></clipPath><g clip-path="url(#cp56)"><clipPath id="cp57"><path transform="matrix(1,0,0,-1,0,2448)" d="M -16 -24 L 1580 -24 L 1580 2468 L -16 2468 Z "/></clipPath><g clip-path="url(#cp57)"><path transform="matrix(1,0,0,-1,0,2448)" d="M 691.6875 692.3294 L 773.875 692.3294 L 773.875 572.4627 L 691.6875 572.4627 Z " fill="#d8b7a0"/></g></g></g></g></g></g></g></svg>`;


/***/ }),

/***/ 26445:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.processDriftctlOutput = exports.updateExcludeInPolicy = exports.driftignoreFromPolicy = exports.runDriftCTL = exports.parseDriftAnalysisResults = exports.translateExitCode = exports.generateArgs = exports.validateArgs = exports.driftctlVersion = exports.DescribeRequiredArgs = exports.DescribeExclusiveArgs = exports.DCTL_EXIT_CODES = void 0;
const debugLib = __webpack_require__(15158);
const child_process = __webpack_require__(63129);
const os = __webpack_require__(12087);
const env_paths_1 = __webpack_require__(21766);
const fs = __webpack_require__(35747);
const spinner_1 = __webpack_require__(86766);
const request_1 = __webpack_require__(52050);
const config_1 = __webpack_require__(22541);
const path = __webpack_require__(85622);
const crypto = __webpack_require__(76417);
const service_mappings_1 = __webpack_require__(16228);
const exit_codes_1 = __webpack_require__(80079);
const metrics_1 = __webpack_require__(32971);
const analytics = __webpack_require__(82744);
const describe_exclusive_argument_error_1 = __webpack_require__(47658);
const describe_required_argument_error_1 = __webpack_require__(37541);
const snyk_logo_1 = __webpack_require__(19679);
const cachePath = (_a = config_1.default.CACHE_PATH) !== null && _a !== void 0 ? _a : env_paths_1.default('snyk').cache;
const debug = debugLib('drift');
exports.DCTL_EXIT_CODES = {
    EXIT_IN_SYNC: 0,
    EXIT_NOT_IN_SYNC: 1,
    EXIT_ERROR: 2,
};
exports.DescribeExclusiveArgs = [
    'all',
    'only-managed',
    'drift',
    'only-unmanaged',
];
exports.DescribeRequiredArgs = [
    'all',
    'only-managed',
    'drift',
    'only-unmanaged',
];
exports.driftctlVersion = 'v0.25.0';
const driftctlChecksums = {
    'driftctl_windows_386.exe': 'ce0d01910c0522ba8b4e48ef4e13846d278b6af9a3d4119e686a9cb7197bd786',
    driftctl_darwin_amd64: '587eb76144a58ffb656740b18c163fdfc30f590744cae3f08d232c841b10f940',
    driftctl_linux_386: '73c56cbb8ad86e90bf349f67f5c62307fd0f976b964d8f10da3578124baff2f2',
    driftctl_linux_amd64: '6ec764a36571b19408d89b07cc7c601dc30e68712f3a5822fe81ea392230dcfc',
    driftctl_linux_arm64: '7168fa70ee5997d46ebf9c0aaaabb063e7d8acb2cb6de841e364281b6762b158',
    'driftctl_windows_arm64.exe': '432ff6d1ad0ad99f47d6482abf097fd999231f3f1df688c8bf6cdaa157c3b81b',
    driftctl_darwin_arm64: '16ce674a17fb1b2feab8a8fedcd2f3dca0d28fbce8e97dc351e51825c2a289ac',
    'driftctl_windows_arm.exe': '295b5a979f42aed83b163451950b35627533e63583de641a2bea5e8ada6e8ca7',
    driftctl_linux_arm: '634b61400733ea60e45e2ea57b8ede5083711e8615f61695ffe7ee2ec9a627dd',
    'driftctl_windows_amd64.exe': '4ef220ea8aaca51129086f69c0634d39fa99d50d965fe2ad3644d4f7e19e24f6',
};
const dctlBaseUrl = 'https://static.snyk.io/cli/driftctl/';
const driftctlPath = path.join(cachePath, 'driftctl_' + exports.driftctlVersion);
const driftctlDefaultOptions = ['--no-version-check'];
let isBinaryDownloaded = false;
exports.validateArgs = (options) => {
    if (options.kind === 'describe') {
        return validateDescribeArgs(options);
    }
};
const validateDescribeArgs = (options) => {
    // Check that there is no more than one of the exclusive arguments
    let count = 0;
    for (const describeExclusiveArg of exports.DescribeExclusiveArgs) {
        if (options[describeExclusiveArg]) {
            count++;
        }
    }
    if (count > 1) {
        throw new describe_exclusive_argument_error_1.DescribeExclusiveArgumentError();
    }
    // Check we have one of the required arguments
    count = 0;
    for (const describeRequiredArgs of exports.DescribeRequiredArgs) {
        if (options[describeRequiredArgs]) {
            count++;
        }
    }
    if (count === 0) {
        throw new describe_required_argument_error_1.DescribeRequiredArgumentError();
    }
};
exports.generateArgs = (options, driftIgnore) => {
    if (options.kind === 'describe') {
        return generateScanFlags(options, driftIgnore);
    }
    if (options.kind === 'fmt') {
        return generateFmtFlags(options);
    }
    throw 'Unsupported command';
};
const generateFmtFlags = (options) => {
    const args = ['fmt', ...driftctlDefaultOptions];
    if (options.json) {
        args.push('--output');
        args.push('json://stdout');
    }
    if (options.html) {
        args.push('--output');
        args.push('html://stdout');
    }
    if (options['html-file-output']) {
        args.push('--output');
        args.push('html://' + options['html-file-output']);
    }
    return args;
};
const generateScanFlags = (options, driftIgnore) => {
    const args = ['scan', ...driftctlDefaultOptions];
    if (options.quiet) {
        args.push('--quiet');
    }
    if (options.filter) {
        args.push('--filter');
        args.push(options.filter);
    }
    args.push('--output');
    args.push('json://stdout');
    if (options['fetch-tfstate-headers']) {
        args.push('--headers');
        args.push(options['fetch-tfstate-headers']);
    }
    if (options['tfc-token']) {
        args.push('--tfc-token');
        args.push(options['tfc-token']);
    }
    if (options['tfc-endpoint']) {
        args.push('--tfc-endpoint');
        args.push(options['tfc-endpoint']);
    }
    if (options['tf-provider-version']) {
        args.push('--tf-provider-version');
        args.push(options['tf-provider-version']);
    }
    if (options.strict) {
        args.push('--strict');
    }
    if (options.deep) {
        args.push('--deep');
    }
    if (options['only-managed'] || options.drift) {
        args.push('--only-managed');
    }
    if (options['only-unmanaged']) {
        args.push('--only-unmanaged');
    }
    if (options.driftignore) {
        args.push('--driftignore');
        args.push(options.driftignore);
    }
    if (options['tf-lockfile']) {
        args.push('--tf-lockfile');
        args.push(options['tf-lockfile']);
    }
    if (driftIgnore && driftIgnore.length > 0) {
        args.push('--ignore');
        args.push(driftIgnore.join(','));
    }
    let configDir = cachePath;
    createIfNotExists(cachePath);
    if (options['config-dir']) {
        configDir = options['config-dir'];
    }
    args.push('--config-dir');
    args.push(configDir);
    if (options.from) {
        const froms = options.from.split(',');
        for (const f of froms) {
            args.push('--from');
            args.push(f);
        }
    }
    let to = 'aws+tf';
    if (options.to) {
        to = options.to;
    }
    args.push('--to');
    args.push(to);
    if (options.service) {
        const services = options.service.split(',');
        service_mappings_1.verifyServiceMappingExists(services);
        args.push('--ignore');
        args.push(service_mappings_1.createIgnorePattern(services));
    }
    debug(args);
    return args;
};
function translateExitCode(exitCode) {
    switch (exitCode) {
        case exports.DCTL_EXIT_CODES.EXIT_IN_SYNC:
            return 0;
        case exports.DCTL_EXIT_CODES.EXIT_NOT_IN_SYNC:
            return exit_codes_1.EXIT_CODES.VULNS_FOUND;
        case exports.DCTL_EXIT_CODES.EXIT_ERROR:
            return exit_codes_1.EXIT_CODES.ERROR;
        default:
            debug('driftctl returned %d', exitCode);
            return exit_codes_1.EXIT_CODES.ERROR;
    }
}
exports.translateExitCode = translateExitCode;
exports.parseDriftAnalysisResults = (input) => {
    return JSON.parse(input);
};
exports.runDriftCTL = async ({ options, driftIgnore, input, stdio, }) => {
    const path = await findOrDownload();
    await exports.validateArgs(options);
    const args = await exports.generateArgs(options, driftIgnore);
    if (!stdio) {
        stdio = ['pipe', 'pipe', 'inherit'];
    }
    debug('running driftctl %s ', args.join(' '));
    const p = child_process.spawn(path, args, {
        stdio,
        env: { ...process.env, DCTL_IS_SNYK: 'true' },
    });
    let stdout = '';
    return new Promise((resolve, reject) => {
        var _a, _b, _c;
        if (input) {
            (_a = p.stdin) === null || _a === void 0 ? void 0 : _a.write(input);
            (_b = p.stdin) === null || _b === void 0 ? void 0 : _b.end();
        }
        p.on('error', (error) => {
            reject(error);
        });
        (_c = p.stdout) === null || _c === void 0 ? void 0 : _c.on('data', (data) => {
            stdout += data;
        });
        p.on('exit', (code) => {
            resolve({ code: translateExitCode(code), stdout });
        });
    });
};
async function findOrDownload() {
    let dctl = await findDriftCtl();
    if (isBinaryDownloaded) {
        return dctl;
    }
    let downloadDuration = 0;
    let binaryExist = true;
    if (dctl === '') {
        binaryExist = false;
        try {
            createIfNotExists(cachePath);
            dctl = driftctlPath;
            const duration = new metrics_1.TimerMetricInstance('driftctl_download');
            duration.start();
            await download(driftctlUrl(), dctl);
            duration.stop();
            downloadDuration = Math.round(duration.getValue() / 1000);
        }
        catch (err) {
            return Promise.reject(err);
        }
    }
    analytics.add('iac-drift-binary-already-exist', binaryExist);
    analytics.add('iac-drift-binary-download-duration-seconds', downloadDuration);
    isBinaryDownloaded = true;
    return dctl;
}
async function findDriftCtl() {
    // lookup in custom path contained in env var DRIFTCTL_PATH
    let dctlPath = config_1.default.DRIFTCTL_PATH;
    if (dctlPath != null) {
        const exists = await isExe(dctlPath);
        if (exists) {
            debug('Found driftctl in $DRIFTCTL_PATH: %s', dctlPath);
            return dctlPath;
        }
    }
    // lookup in app cache
    dctlPath = driftctlPath;
    const exists = await isExe(dctlPath);
    if (exists) {
        debug('Found driftctl in cache: %s', dctlPath);
        return dctlPath;
    }
    debug('driftctl not found');
    return '';
}
async function download(url, destination) {
    debug('downloading driftctl into %s', destination);
    const payload = {
        method: 'GET',
        url: url,
        output: destination,
        follow: 3,
    };
    await spinner_1.spinner('Downloading...');
    return new Promise((resolve, reject) => {
        request_1.makeRequest(payload, function (err, res, body) {
            try {
                if (err) {
                    reject(new Error('Could not download driftctl from ' + url + ': ' + err));
                    return;
                }
                if (res.statusCode !== 200) {
                    reject(new Error('Could not download driftctl from ' + url + ': ' + res.statusCode));
                    return;
                }
                validateChecksum(body);
                fs.writeFileSync(destination, body);
                debug('File saved: ' + destination);
                fs.chmodSync(destination, 0o744);
                resolve(true);
            }
            finally {
                spinner_1.spinner.clearAll();
            }
        });
    });
}
function validateChecksum(body) {
    // only validate if we downloaded the official driftctl binary
    if (config_1.default.DRIFTCTL_URL || config_1.default.DRIFTCTL_PATH) {
        return;
    }
    const computedHash = crypto
        .createHash('sha256')
        .update(body)
        .digest('hex');
    const givenHash = driftctlChecksums[driftctlFileName()];
    if (computedHash != givenHash) {
        throw new Error('Downloaded file has inconsistent checksum...');
    }
}
function driftctlFileName() {
    let platform = 'linux';
    switch (os.platform()) {
        case 'darwin':
            platform = 'darwin';
            break;
        case 'win32':
            platform = 'windows';
            break;
    }
    let arch = 'amd64';
    switch (os.arch()) {
        case 'ia32':
        case 'x32':
            arch = '386';
            break;
        case 'arm':
            arch = 'arm';
            break;
        case 'arm64':
            arch = 'arm64';
            break;
    }
    let ext = '';
    switch (os.platform()) {
        case 'win32':
            ext = '.exe';
            break;
    }
    return `driftctl_${platform}_${arch}${ext}`;
}
function driftctlUrl() {
    if (config_1.default.DRIFTCTL_URL) {
        return config_1.default.DRIFTCTL_URL;
    }
    return `${dctlBaseUrl}/${exports.driftctlVersion}/${driftctlFileName()}`;
}
function isExe(dctlPath) {
    return new Promise((resolve) => {
        fs.access(dctlPath, fs.constants.X_OK, (err) => {
            if (err) {
                resolve(false);
                return;
            }
            resolve(true);
        });
    });
}
function createIfNotExists(path) {
    if (!fs.existsSync(path)) {
        fs.mkdirSync(path, { recursive: true });
    }
}
function driftignoreFromPolicy(policy) {
    const excludeSection = 'iac-drift';
    if (!policy || !policy.exclude || !(excludeSection in policy.exclude)) {
        return [];
    }
    return policy.exclude[excludeSection];
}
exports.driftignoreFromPolicy = driftignoreFromPolicy;
exports.updateExcludeInPolicy = (policy, analysis, options) => {
    var _a, _b, _c;
    const excludedResources = driftignoreFromPolicy(policy);
    const addResource = (res) => excludedResources.push(`${res.type}.${res.id}`);
    if (!options['exclude-changed'] && analysis.summary.total_changed > 0) {
        (_a = analysis.differences) === null || _a === void 0 ? void 0 : _a.forEach((change) => addResource(change.res));
    }
    if (!options['exclude-missing'] && analysis.summary.total_missing > 0) {
        (_b = analysis.missing) === null || _b === void 0 ? void 0 : _b.forEach((res) => addResource(res));
    }
    if (!options['exclude-unmanaged'] && analysis.summary.total_unmanaged > 0) {
        (_c = analysis.unmanaged) === null || _c === void 0 ? void 0 : _c.forEach((res) => addResource(res));
    }
    if (!policy.exclude) {
        policy.exclude = {};
    }
    policy.exclude['iac-drift'] = excludedResources;
};
function processDriftctlOutput(options, stdout) {
    if (options.html) {
        stdout = rebrandHTMLOutput(stdout);
    }
    if (options['html-file-output']) {
        const data = fs.readFileSync(options['html-file-output'], {
            encoding: 'utf8',
        });
        fs.writeFileSync(options['html-file-output'], rebrandHTMLOutput(data));
    }
    return stdout;
}
exports.processDriftctlOutput = processDriftctlOutput;
function rebrandHTMLOutput(data) {
    const logoReplaceRegex = new RegExp('(<div id="brand_logo">)((.|\\r|\\n)*?)(<\\/div>)', 'g');
    data = data.replace(logoReplaceRegex, `<div id="brand_logo">${snyk_logo_1.default}</div>`);
    return data;
}


/***/ }),

/***/ 16228:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.InvalidServiceError = exports.createIgnorePatternWithMap = exports.createIgnorePattern = exports.verifyServiceMappingExists = exports.services2resources = void 0;
const errors_1 = __webpack_require__(55191);
const types_1 = __webpack_require__(42258);
const error_utils_1 = __webpack_require__(23872);
exports.services2resources = new Map([
    // Amazon
    [
        'aws_s3',
        [
            'aws_s3_bucket',
            'aws_s3_bucket_analytics_configuration',
            'aws_s3_bucket_inventory',
            'aws_s3_bucket_metric',
            'aws_s3_bucket_notification',
            'aws_s3_bucket_policy',
        ],
    ],
    [
        'aws_ec2',
        [
            'aws_instance',
            'aws_key_pair',
            'aws_ami',
            'aws_ebs_snapshot',
            'aws_ebs_volume',
            'aws_eip',
            'aws_eip_association',
            'aws_volume_attachment',
            'aws_launch_configuration',
            'aws_launch_template',
        ],
    ],
    ['aws_lambda', ['aws_lambda_function', 'aws_lambda_event_source_mapping']],
    [
        'aws_rds',
        [
            'aws_db_instance',
            'aws_db_subnet_group',
            'aws_rds_cluster',
            'aws_rds_cluster_endpoint',
            'aws_rds_cluster_instance',
        ],
    ],
    ['aws_route53', ['aws_route53_record', 'aws_route53_zone']],
    [
        'aws_iam',
        [
            'aws_iam_access_key',
            'aws_iam_policy',
            'aws_iam_policy_attachment',
            'aws_iam_role',
            'aws_iam_role_policy',
            'aws_iam_role_policy_attachment',
            'aws_iam_user',
            'aws_iam_user_policy',
            'aws_iam_user_policy_attachment',
        ],
    ],
    [
        'aws_vpc',
        [
            'aws_security_group',
            'aws_security_group_rule',
            'aws_subnet',
            'aws_default_vpc',
            'aws_vpc',
            'aws_default_security_group',
            'aws_route_table',
            'aws_default_route_table',
            'aws_route',
            'aws_route_table_association',
            'aws_nat_gateway',
            'aws_internet_gateway',
        ],
    ],
    [
        'aws_api_gateway',
        [
            'aws_api_gateway_resource',
            'aws_api_gateway_rest_api',
            'aws_api_gateway_account',
            'aws_api_gateway_api_key',
            'aws_api_gateway_authorizer',
            'aws_api_gateway_base_path_mapping',
            'aws_api_gateway_domain_name',
            'aws_api_gateway_gateway_response',
            'aws_api_gateway_integration',
            'aws_api_gateway_integration_response',
            'aws_api_gateway_method',
            'aws_api_gateway_method_response',
            'aws_api_gateway_method_settings',
            'aws_api_gateway_model',
            'aws_api_gateway_request_validator',
            'aws_api_gateway_rest_api_policy',
            'aws_api_gateway_stage',
            'aws_api_gateway_vpc_link',
        ],
    ],
    [
        'aws_apigatewayv2',
        [
            'aws_apigatewayv2_api',
            'aws_apigatewayv2_api_mapping',
            'aws_apigatewayv2_authorizer',
            'aws_apigatewayv2_deployment',
            'aws_apigatewayv2_domain_name',
            'aws_apigatewayv2_integration',
            'aws_apigatewayv2_integration_response',
            'aws_apigatewayv2_model',
            'aws_apigatewayv2_route',
            'aws_apigatewayv2_route_response',
            'aws_apigatewayv2_stage',
            'aws_apigatewayv2_vpc_link',
        ],
    ],
    ['aws_sqs', ['aws_sqs_queue', 'aws_sqs_queue_policy']],
    [
        'aws_sns',
        ['aws_sns_topic', 'aws_sns_topic_policy', 'aws_sns_topic_subscription'],
    ],
    ['aws_ecr', ['aws_ecr_repository']],
    ['aws_cloudfront', ['aws_cloudfront_distribution']],
    ['aws_kms', ['aws_kms_key', 'aws_kms_alias']],
    ['aws_dynamodb', ['aws_dynamodb_table']],
    // Azure
    ['azure_base', ['azurerm_resource_group']],
    ['azure_compute', ['azurerm_image', 'azurerm_ssh_public_key']],
    ['azure_storage', ['azurerm_storage_account', 'azurerm_storage_container']],
    [
        'azure_network',
        [
            'azurerm_resource_group',
            'azurerm_subnet',
            'azurerm_public_ip',
            'azurerm_firewall',
            'azurerm_route',
            'azurerm_route_table',
            'azurerm_network_security_group',
        ],
    ],
    ['azure_container', ['azurerm_container_registry']],
    [
        'azure_database',
        ['azurerm_postgresql_server', 'azurerm_postgresql_database'],
    ],
    ['azure_loadbalancer', ['azurerm_lb', 'azurerm_lb_rule']],
    [
        'azure_private_dns',
        [
            'azurerm_private_dns_a_record',
            'azurerm_private_dns_aaaa_record',
            'azurerm_private_dns_cname_record',
            'azurerm_private_dns_mx_record',
            'azurerm_private_dns_ptr_record',
            'azurerm_private_dns_srv_record',
            'azurerm_private_dns_txt_record',
            'azurerm_private_dns_zone',
        ],
    ],
    // Google
    [
        'google_cloud_platform',
        [
            'google_project_iam_binding',
            'google_project_iam_member',
            'google_project_iam_policy',
        ],
    ],
    [
        'google_cloud_storage',
        [
            'google_storage_bucket',
            'google_storage_bucket_iam_binding',
            'google_storage_bucket_iam_member',
            'google_storage_bucket_iam_policy',
        ],
    ],
    [
        'google_compute_engine',
        [
            'google_compute_address',
            'google_compute_disk',
            'google_compute_global_address',
            'google_compute_firewall',
            'google_compute_health_check',
            'google_compute_image',
            'google_compute_instance',
            'google_compute_instance_group',
            'google_compute_network',
            'google_compute_node_group',
            'google_compute_router',
            'google_compute_subnetwork',
        ],
    ],
    ['google_cloud_dns', ['google_dns_managed_zone']],
    [
        'google_cloud_bigtable',
        ['google_bigtable_instance', 'google_bigtable_table'],
    ],
    [
        'google_cloud_bigquery',
        ['google_bigquery_table', 'google_bigquery_dataset'],
    ],
    ['google_cloud_functions', ['google_cloudfunctions_function']],
    ['google_cloud_sql', ['google_sql_database_instance']],
    ['google_cloud_run', ['google_cloud_run_service']],
]);
function verifyServiceMappingExists(services) {
    if (services.length == 0) {
        throw new InvalidServiceError('');
    }
    for (const s of services) {
        if (!exports.services2resources.has(s)) {
            throw new InvalidServiceError(`We were unable to match service "${s}". Please provide a valid service name: ${existingServiceNames()}`);
        }
    }
}
exports.verifyServiceMappingExists = verifyServiceMappingExists;
function existingServiceNames() {
    let res = '';
    for (const s of exports.services2resources.keys()) {
        res += `${s},`;
    }
    return res.substring(0, res.length - 1);
}
function createIgnorePattern(services) {
    return createIgnorePatternWithMap(services, exports.services2resources);
}
exports.createIgnorePattern = createIgnorePattern;
function createIgnorePatternWithMap(services, serviceMap) {
    let res = '*';
    const seenResources = new Set();
    for (const s of services) {
        const resourcePatterns = serviceMap.get(s);
        for (const rp of resourcePatterns || []) {
            // A resource might belong to multiple services, skip it if already processed
            if (seenResources.has(rp)) {
                continue;
            }
            res += `,!${rp}`;
            seenResources.add(rp);
        }
    }
    return res;
}
exports.createIgnorePatternWithMap = createIgnorePatternWithMap;
class InvalidServiceError extends errors_1.CustomError {
    constructor(msg) {
        super(msg);
        this.code = types_1.IaCErrorCodes.InvalidServiceError;
        this.strCode = error_utils_1.getErrorStringCode(this.code);
        this.userMessage = msg;
    }
}
exports.InvalidServiceError = InvalidServiceError;


/***/ })

};
;
//# sourceMappingURL=459.index.js.map