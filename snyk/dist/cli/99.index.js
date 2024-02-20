"use strict";
exports.id = 99;
exports.ids = [99];
exports.modules = {

/***/ 21766:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {


const path = __webpack_require__(85622);
const os = __webpack_require__(12087);

const homedir = os.homedir();
const tmpdir = os.tmpdir();
const {env} = process;

const macos = name => {
	const library = path.join(homedir, 'Library');

	return {
		data: path.join(library, 'Application Support', name),
		config: path.join(library, 'Preferences', name),
		cache: path.join(library, 'Caches', name),
		log: path.join(library, 'Logs', name),
		temp: path.join(tmpdir, name)
	};
};

const windows = name => {
	const appData = env.APPDATA || path.join(homedir, 'AppData', 'Roaming');
	const localAppData = env.LOCALAPPDATA || path.join(homedir, 'AppData', 'Local');

	return {
		// Data/config/cache/log are invented by me as Windows isn't opinionated about this
		data: path.join(localAppData, name, 'Data'),
		config: path.join(appData, name, 'Config'),
		cache: path.join(localAppData, name, 'Cache'),
		log: path.join(localAppData, name, 'Log'),
		temp: path.join(tmpdir, name)
	};
};

// https://specifications.freedesktop.org/basedir-spec/basedir-spec-latest.html
const linux = name => {
	const username = path.basename(homedir);

	return {
		data: path.join(env.XDG_DATA_HOME || path.join(homedir, '.local', 'share'), name),
		config: path.join(env.XDG_CONFIG_HOME || path.join(homedir, '.config'), name),
		cache: path.join(env.XDG_CACHE_HOME || path.join(homedir, '.cache'), name),
		// https://wiki.debian.org/XDGBaseDirectorySpecification#state
		log: path.join(env.XDG_STATE_HOME || path.join(homedir, '.local', 'state'), name),
		temp: path.join(tmpdir, username, name)
	};
};

const envPaths = (name, options) => {
	if (typeof name !== 'string') {
		throw new TypeError(`Expected string, got ${typeof name}`);
	}

	options = Object.assign({suffix: 'nodejs'}, options);

	if (options.suffix) {
		// Add suffix to prevent possible conflict with native apps
		name += `-${options.suffix}`;
	}

	if (process.platform === 'darwin') {
		return macos(name);
	}

	if (process.platform === 'win32') {
		return windows(name);
	}

	return linux(name);
};

module.exports = envPaths;
// TODO: Remove this for the next major release
module.exports.default = envPaths;


/***/ }),

/***/ 52369:
/***/ ((__unused_webpack_module, exports) => {


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

/***/ 87831:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
const process_command_args_1 = __webpack_require__(52369);
const legacyError = __webpack_require__(79407);
const fs = __webpack_require__(35747);
const snykPolicyLib = __webpack_require__(70535);
const get_iac_org_settings_1 = __webpack_require__(1802);
const assert_iac_options_flag_1 = __webpack_require__(68590);
const config_1 = __webpack_require__(22541);
const drift_1 = __webpack_require__(26445);
exports.default = async (...args) => {
    var _a, _b;
    const { options } = process_command_args_1.processCommandArgs(...args);
    // Ensure that this update-exclude-policy command can only be runned when using `snyk iac update-exclude-policy`
    // Avoid `snyk update-exclude-policy` direct usage
    if (options.iac != true) {
        return legacyError('update-exclude-policy');
    }
    // Ensure that we are allowed to run that command
    // by checking the entitlement
    const orgPublicId = (_a = options.org) !== null && _a !== void 0 ? _a : config_1.default.org;
    const iacOrgSettings = await get_iac_org_settings_1.getIacOrgSettings(orgPublicId);
    if (!((_b = iacOrgSettings.entitlements) === null || _b === void 0 ? void 0 : _b.iacDrift)) {
        throw new assert_iac_options_flag_1.UnsupportedEntitlementCommandError('update-exclude-policy', 'iacDrift');
    }
    try {
        // There's an open bug for this in Windows in the current version of node when called with no stdinput.
        // See https://github.com/nodejs/node/issues/19831
        // The actual error handling behavior is enough for now but may be improved if needed
        const analysis = drift_1.parseDriftAnalysisResults(fs.readFileSync(0).toString());
        let policy;
        try {
            policy = await snykPolicyLib.load();
        }
        catch (error) {
            if (error.code === 'ENOENT') {
                // policy file does not exist - create it
                policy = await snykPolicyLib.create();
            }
            else {
                throw error;
            }
        }
        await drift_1.updateExcludeInPolicy(policy, analysis, options);
        await snykPolicyLib.save(policy);
    }
    catch (e) {
        const err = new Error('Error running `iac update-exclude-policy` ' + e);
        return Promise.reject(err);
    }
};


/***/ })

};
;
//# sourceMappingURL=99.index.js.map