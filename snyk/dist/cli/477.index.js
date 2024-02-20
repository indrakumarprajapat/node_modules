"use strict";
exports.id = 477;
exports.ids = [477];
exports.modules = {

/***/ 15477:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
const policy = __webpack_require__(70535);
const display_policy_1 = __webpack_require__(85655);
const errors_1 = __webpack_require__(55191);
async function displayPolicy(path) {
    try {
        const loadedPolicy = (await policy.load(path || process.cwd()));
        return await display_policy_1.display(loadedPolicy);
    }
    catch (error) {
        let adaptedError;
        if (error.code === 'ENOENT') {
            adaptedError = new errors_1.PolicyNotFoundError();
        }
        else {
            adaptedError = new errors_1.FailedToLoadPolicyError();
            adaptedError.innerError = error;
        }
        throw adaptedError;
    }
}
exports.default = displayPolicy;


/***/ }),

/***/ 85655:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.display = void 0;
const chalk_1 = __webpack_require__(32589);
const snyk_policy_1 = __webpack_require__(70535);
const config_1 = __webpack_require__(22541);
async function display(policy) {
    const p = snyk_policy_1.demunge(policy, config_1.default.ROOT);
    const delimiter = '\n\n------------------------\n';
    let res = chalk_1.default.bold('Current Snyk policy, read from ' + policy.__filename + ' file') + '\n';
    res += 'Modified: ' + policy.__modified + '\n';
    res += 'Created:  ' + policy.__created + '\n';
    res += p.patch.map(displayRule('Patch vulnerability')).join('\n');
    if (p.patch.length && p.ignore.length) {
        res += delimiter;
    }
    res += p.ignore.map(displayRule('Ignore')).join('\n');
    if (p.ignore.length && p.exclude.length) {
        res += delimiter;
    }
    res += p.exclude.map(displayRule('Exclude')).join('\n');
    return Promise.resolve(res);
}
exports.display = display;
function displayRule(title) {
    return (rule, i) => {
        i += 1;
        const formattedTitle = title === 'Exclude'
            ? chalk_1.default.bold(`\n#${i} ${title}`) +
                ` the following ${chalk_1.default.bold(rule.id)} items/paths:\n`
            : chalk_1.default.bold(`\n#${i} ${title} ${rule.url}`) +
                ' in the following paths:\n';
        return (formattedTitle +
            rule.paths
                .map((p) => {
                return (p.path +
                    (p.reason
                        ? '\nReason: ' +
                            p.reason +
                            '\nExpires: ' +
                            p.expires.toUTCString() +
                            '\n'
                        : '') +
                    '\n');
            })
                .join('')
                .replace(/\s*$/, ''));
    };
}


/***/ })

};
;
//# sourceMappingURL=477.index.js.map