"use strict";
exports.id = 542;
exports.ids = [542];
exports.modules = {

/***/ 71771:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.verifyAPI = exports.isAuthed = void 0;
const snyk = __webpack_require__(9146);
const config_1 = __webpack_require__(22541);
const request_1 = __webpack_require__(52050);
function isAuthed() {
    const token = snyk.config.get('api');
    return verifyAPI(token).then((res) => {
        return res.body.ok;
    });
}
exports.isAuthed = isAuthed;
function verifyAPI(api) {
    const payload = {
        body: {
            api,
        },
        method: 'POST',
        url: config_1.default.API + '/verify/token',
        json: true,
    };
    return new Promise((resolve, reject) => {
        request_1.makeRequest(payload, (error, res, body) => {
            if (error) {
                return reject(error);
            }
            resolve({
                res,
                body,
            });
        });
    });
}
exports.verifyAPI = verifyAPI;


/***/ }),

/***/ 3542:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.excludeFilePathPattern = exports.ignoreIssue = void 0;
const policy = __webpack_require__(70535);
const chalk_1 = __webpack_require__(32589);
const authorization = __webpack_require__(69943);
const auth = __webpack_require__(71771);
const api_token_1 = __webpack_require__(95181);
const is_ci_1 = __webpack_require__(10090);
const Debug = __webpack_require__(15158);
const debug = Debug('snyk');
const misconfigured_auth_in_ci_error_1 = __webpack_require__(27747);
function ignore(options) {
    debug('snyk ignore called with options: %O', options);
    return auth
        .isAuthed()
        .then((authed) => {
        if (!authed) {
            if (is_ci_1.isCI()) {
                throw misconfigured_auth_in_ci_error_1.MisconfiguredAuthInCI();
            }
        }
        api_token_1.apiTokenExists();
    })
        .then(() => {
        return authorization.actionAllowed('cliIgnore', options);
    })
        .then((cliIgnoreAuthorization) => {
        if (!cliIgnoreAuthorization.allowed) {
            debug('snyk ignore called when disallowed');
            console.log(chalk_1.default.bold.red(cliIgnoreAuthorization.reason));
            return;
        }
        const isFilePathProvided = !!options['file-path'];
        if (isFilePathProvided) {
            return excludeFilePathPattern(options);
        }
        return ignoreIssue(options);
    });
}
exports.default = ignore;
function ignoreIssue(options) {
    if (!options.id) {
        throw Error('idRequired');
    }
    options.expiry = new Date(options.expiry);
    if (options.expiry.getTime() !== options.expiry.getTime()) {
        debug('No/invalid expiry given, using the default 30 days');
        options.expiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    }
    if (!options.reason) {
        options.reason = 'None Given';
    }
    const isPathProvided = !!options.path;
    if (!isPathProvided) {
        options.path = '*';
    }
    debug(`changing policy: ignore "%s", for %s, reason: "%s", until: %o`, options.id, isPathProvided ? 'all paths' : `path: '${options.path}'`, options.reason, options.expiry);
    return load(options['policy-path']).then(async (pol) => {
        var _a;
        let ignoreRulePathDataIdx = -1;
        const ignoreParams = {
            reason: options.reason,
            expires: options.expiry,
            created: new Date(),
        };
        const ignoreRules = pol.ignore;
        const issueIgnorePaths = (_a = ignoreRules[options.id]) !== null && _a !== void 0 ? _a : [];
        // Checking if the ignore-rule for this issue exists for the provided path.
        ignoreRulePathDataIdx = issueIgnorePaths.findIndex((ignoreMetadata) => !!ignoreMetadata[options.path]);
        // If an ignore-rule for this path doesn't exist, create one.
        if (ignoreRulePathDataIdx === -1) {
            issueIgnorePaths.push({
                [options.path]: ignoreParams,
            });
        }
        // Otherwise, update the existing rule's metadata.
        else {
            issueIgnorePaths[ignoreRulePathDataIdx][options.path] = ignoreParams;
        }
        ignoreRules[options.id] = issueIgnorePaths;
        pol.ignore = ignoreRules;
        return await policy.save(pol, options['policy-path']);
    });
}
exports.ignoreIssue = ignoreIssue;
async function excludeFilePathPattern(options) {
    const pattern = options['file-path'];
    const group = options['file-path-group'] || 'global';
    const policyPath = options['policy-path'];
    const excludeOptions = {};
    if (options.reason !== undefined) {
        excludeOptions['reason'] = options.reason;
    }
    if (options.expiry !== undefined) {
        excludeOptions['expires'] = new Date(options.expiry);
    }
    debug(`changing policy: ignore "%s" added to "%s"`, pattern, policyPath);
    const pol = await load(policyPath);
    pol.addExclude(pattern, group, excludeOptions);
    return policy.save(pol, policyPath);
}
exports.excludeFilePathPattern = excludeFilePathPattern;
async function load(path) {
    return policy.load(path).catch((error) => {
        if (error.code === 'ENOENT') {
            // file does not exist - create it
            return policy.create();
        }
        throw Error('policyFile');
    });
}


/***/ }),

/***/ 69943:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.actionAllowed = void 0;
const snyk = __webpack_require__(9146);
const request_1 = __webpack_require__(52050);
const config_1 = __webpack_require__(22541);
async function actionAllowed(action, options) {
    const org = options.org || config_1.default.org || null;
    try {
        const res = await request_1.makeRequest({
            method: 'GET',
            url: config_1.default.API + '/authorization/' + action,
            json: true,
            headers: {
                authorization: 'token ' + snyk.api,
            },
            qs: org && { org },
        });
        return res.body.result;
    }
    catch (err) {
        return {
            allowed: false,
            reason: 'There was an error while checking authorization',
        };
    }
}
exports.actionAllowed = actionAllowed;


/***/ }),

/***/ 27747:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.MisconfiguredAuthInCI = void 0;
const custom_error_1 = __webpack_require__(17188);
function MisconfiguredAuthInCI() {
    const errorMsg = 'Snyk is missing auth token in order to run inside CI. You must include ' +
        'your API token as an environment value: `SNYK_TOKEN=12345678`';
    const error = new custom_error_1.CustomError(errorMsg);
    error.code = 401;
    error.strCode = 'noAuthInCI';
    error.userMessage = errorMsg;
    return error;
}
exports.MisconfiguredAuthInCI = MisconfiguredAuthInCI;


/***/ })

};
;
//# sourceMappingURL=542.index.js.map