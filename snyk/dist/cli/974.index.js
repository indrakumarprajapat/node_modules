exports.id = 974;
exports.ids = [974];
exports.modules = {

/***/ 62148:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

var readline = __webpack_require__(51058);

var defaultSpinnerString = 0;
var defaultSpinnerDelay = 60;

function defaultOnTick(msg) {
  this.clearLine(this.stream);
  this.stream.write(msg);
};

var Spinner = function(options){
  if(!(this instanceof Spinner)) return new Spinner(options)

  if(typeof options === "string"){
    options = { text: options };
  } else if(!options){
    options = {};
  }

  this.text = options.text || '';
  this.setSpinnerString(defaultSpinnerString);
  this.setSpinnerDelay(defaultSpinnerDelay);
  this.onTick = options.onTick || defaultOnTick;
  this.stream = options.stream || process.stdout;
};

Spinner.spinners = __webpack_require__(18138);

Spinner.setDefaultSpinnerString = function(value) {
  defaultSpinnerString = value;

  return this;
};

Spinner.setDefaultSpinnerDelay = function(value) {
  defaultSpinnerDelay = value;

  return this;
};

Spinner.prototype.start = function() {
  if(this.stream === process.stdout && this.stream.isTTY !== true) {
    return this;
  }

  var current = 0;
  var self = this;

  var iteration = function() {
    var msg = self.text.indexOf('%s') > -1
      ? self.text.replace('%s', self.chars[current])
      : self.chars[current] + ' ' + self.text;

    self.onTick(msg);

    current = ++current % self.chars.length;
  };

  iteration();
  this.id = setInterval(iteration, this.delay);

  return this;
};

Spinner.prototype.isSpinning = function() {
  return this.id !== undefined;
}

Spinner.prototype.setSpinnerDelay = function(n) {
  this.delay = n;

  return this;
};

Spinner.prototype.setSpinnerString = function(str) {
  const map = mapToSpinner(str, this.spinners);
  this.chars = Array.isArray(map) ? map : map.split('');

  return this;
};

Spinner.prototype.setSpinnerTitle = function(str) {
  this.text = str;

  return this;
}

Spinner.prototype.stop = function(clear) {
  if(this.isSpinning === false) {
    return this;
  }

  clearInterval(this.id);
  this.id = undefined;

  if (clear) {
    this.clearLine(this.stream);
  }

  return this;
};

Spinner.prototype.clearLine = function(stream) {
  readline.clearLine(stream, 0);
  readline.cursorTo(stream, 0);

  return this;
}

// Helpers

function isInt(value) {
  return (typeof value==='number' && (value%1)===0);
}

function mapToSpinner(value, spinners) {
  // Not an integer, return as strng
  if (!isInt(value)) {
    return value + '';
  }

  var length = Spinner.spinners.length;

  // Check if index is within bounds
  value = (value >= length) ? 0 : value;
  // If negative, count from the end
  value = (value < 0) ? length + value : value;

  return Spinner.spinners[value];
}

exports.Spinner = Spinner;


/***/ }),

/***/ 41595:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

const fs = __webpack_require__(35747);

let isDocker;

function hasDockerEnv() {
	try {
		fs.statSync('/.dockerenv');
		return true;
	} catch (_) {
		return false;
	}
}

function hasDockerCGroup() {
	try {
		return fs.readFileSync('/proc/self/cgroup', 'utf8').includes('docker');
	} catch (_) {
		return false;
	}
}

module.exports = () => {
	if (isDocker === undefined) {
		isDocker = hasDockerEnv() || hasDockerCGroup();
	}

	return isDocker;
};


/***/ }),

/***/ 82818:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

const os = __webpack_require__(12087);
const fs = __webpack_require__(35747);
const isDocker = __webpack_require__(41595);

const isWsl = () => {
	if (process.platform !== 'linux') {
		return false;
	}

	if (os.release().toLowerCase().includes('microsoft')) {
		if (isDocker()) {
			return false;
		}

		return true;
	}

	try {
		return fs.readFileSync('/proc/version', 'utf8').toLowerCase().includes('microsoft') ?
			!isDocker() : false;
	} catch (_) {
		return false;
	}
};

if (process.env.__IS_WSL_TEST__) {
	module.exports = isWsl;
} else {
	module.exports = isWsl();
}


/***/ }),

/***/ 78318:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

const {promisify} = __webpack_require__(31669);
const path = __webpack_require__(85622);
const childProcess = __webpack_require__(63129);
const fs = __webpack_require__(35747);
const isWsl = __webpack_require__(82818);
const isDocker = __webpack_require__(41595);

const pAccess = promisify(fs.access);
const pReadFile = promisify(fs.readFile);

// Path to included `xdg-open`.
const localXdgOpenPath = path.join(__dirname, 'xdg-open');

/**
Get the mount point for fixed drives in WSL.

@inner
@returns {string} The mount point.
*/
const getWslDrivesMountPoint = (() => {
	// Default value for "root" param
	// according to https://docs.microsoft.com/en-us/windows/wsl/wsl-config
	const defaultMountPoint = '/mnt/';

	let mountPoint;

	return async function () {
		if (mountPoint) {
			// Return memoized mount point value
			return mountPoint;
		}

		const configFilePath = '/etc/wsl.conf';

		let isConfigFileExists = false;
		try {
			await pAccess(configFilePath, fs.constants.F_OK);
			isConfigFileExists = true;
		} catch (_) {}

		if (!isConfigFileExists) {
			return defaultMountPoint;
		}

		const configContent = await pReadFile(configFilePath, {encoding: 'utf8'});
		const configMountPoint = /root\s*=\s*(.*)/g.exec(configContent);

		if (!configMountPoint) {
			return defaultMountPoint;
		}

		mountPoint = configMountPoint[1].trim();
		mountPoint = mountPoint.endsWith('/') ? mountPoint : mountPoint + '/';

		return mountPoint;
	};
})();

module.exports = async (target, options) => {
	if (typeof target !== 'string') {
		throw new TypeError('Expected a `target`');
	}

	options = {
		wait: false,
		background: false,
		allowNonzeroExitCode: false,
		...options
	};

	let command;
	let {app} = options;
	let appArguments = [];
	const cliArguments = [];
	const childProcessOptions = {};

	if (Array.isArray(app)) {
		appArguments = app.slice(1);
		app = app[0];
	}

	if (process.platform === 'darwin') {
		command = 'open';

		if (options.wait) {
			cliArguments.push('--wait-apps');
		}

		if (options.background) {
			cliArguments.push('--background');
		}

		if (app) {
			cliArguments.push('-a', app);
		}
	} else if (process.platform === 'win32' || (isWsl && !isDocker())) {
		const mountPoint = await getWslDrivesMountPoint();

		command = isWsl ?
			`${mountPoint}c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe` :
			`${process.env.SYSTEMROOT}\\System32\\WindowsPowerShell\\v1.0\\powershell`;

		cliArguments.push(
			'-NoProfile',
			'-NonInteractive',
			'–ExecutionPolicy',
			'Bypass',
			'-EncodedCommand'
		);

		if (!isWsl) {
			childProcessOptions.windowsVerbatimArguments = true;
		}

		const encodedArguments = ['Start'];

		if (options.wait) {
			encodedArguments.push('-Wait');
		}

		if (app) {
			// Double quote with double quotes to ensure the inner quotes are passed through.
			// Inner quotes are delimited for PowerShell interpretation with backticks.
			encodedArguments.push(`"\`"${app}\`""`, '-ArgumentList');
			appArguments.unshift(target);
		} else {
			encodedArguments.push(`"${target}"`);
		}

		if (appArguments.length > 0) {
			appArguments = appArguments.map(arg => `"\`"${arg}\`""`);
			encodedArguments.push(appArguments.join(','));
		}

		// Using Base64-encoded command, accepted by PowerShell, to allow special characters.
		target = Buffer.from(encodedArguments.join(' '), 'utf16le').toString('base64');
	} else {
		if (app) {
			command = app;
		} else {
			// When bundled by Webpack, there's no actual package file path and no local `xdg-open`.
			const isBundled = !__dirname || __dirname === '/';

			// Check if local `xdg-open` exists and is executable.
			let exeLocalXdgOpen = false;
			try {
				await pAccess(localXdgOpenPath, fs.constants.X_OK);
				exeLocalXdgOpen = true;
			} catch (_) {}

			const useSystemXdgOpen = process.versions.electron ||
				process.platform === 'android' || isBundled || !exeLocalXdgOpen;
			command = useSystemXdgOpen ? 'xdg-open' : localXdgOpenPath;
		}

		if (appArguments.length > 0) {
			cliArguments.push(...appArguments);
		}

		if (!options.wait) {
			// `xdg-open` will block the process unless stdio is ignored
			// and it's detached from the parent even if it's unref'd.
			childProcessOptions.stdio = 'ignore';
			childProcessOptions.detached = true;
		}
	}

	cliArguments.push(target);

	if (process.platform === 'darwin' && appArguments.length > 0) {
		cliArguments.push('--args', ...appArguments);
	}

	const subprocess = childProcess.spawn(command, cliArguments, childProcessOptions);

	if (options.wait) {
		return new Promise((resolve, reject) => {
			subprocess.once('error', reject);

			subprocess.once('close', exitCode => {
				if (options.allowNonzeroExitCode && exitCode > 0) {
					reject(new Error(`Exited with code ${exitCode}`));
					return;
				}

				resolve(subprocess);
			});
		});
	}

	subprocess.unref();

	return subprocess;
};


/***/ }),

/***/ 27974:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
const url = __webpack_require__(78835);
const open = __webpack_require__(78318);
const uuid_1 = __webpack_require__(42277);
const Debug = __webpack_require__(15158);
const cli_spinner_1 = __webpack_require__(62148);
const snyk = __webpack_require__(9146);
const is_authed_1 = __webpack_require__(71771);
const is_ci_1 = __webpack_require__(10090);
const is_docker_1 = __webpack_require__(14953);
const args_1 = __webpack_require__(94765);
const config_1 = __webpack_require__(22541);
const request_1 = __webpack_require__(52050);
const errors_1 = __webpack_require__(55191);
const errors_2 = __webpack_require__(55191);
const token_expired_error_1 = __webpack_require__(79578);
const misconfigured_auth_in_ci_error_1 = __webpack_require__(27747);
const query_strings_1 = __webpack_require__(36479);
const apiUrl = url.parse(config_1.default.API);
const authUrl = apiUrl.protocol + '//' + apiUrl.host;
const debug = Debug('snyk-auth');
let attemptsLeft = 0;
function resetAttempts() {
    attemptsLeft = is_docker_1.isDocker() ? 60 : 3 * 60;
}
async function webAuth() {
    const token = uuid_1.v4(); // generate a random key
    let urlStr = authUrl + '/login?token=' + token;
    // It's not optimal, but I have to parse args again here. Alternative is reworking everything about how we parse args
    const args = [args_1.args(process.argv).options];
    const utmParams = query_strings_1.getQueryParamsAsString(args);
    if (utmParams) {
        urlStr += '&' + utmParams;
    }
    // suppress this message in CI
    if (!is_ci_1.isCI()) {
        console.log(browserAuthPrompt(is_docker_1.isDocker(), urlStr));
    }
    else {
        return Promise.reject(misconfigured_auth_in_ci_error_1.MisconfiguredAuthInCI());
    }
    const spinner = new cli_spinner_1.Spinner('Waiting...');
    spinner.setSpinnerString('|/-\\');
    const ipFamily = await getIpFamily();
    try {
        spinner.start();
        if (!is_docker_1.isDocker()) {
            await setTimeout(() => {
                open(urlStr);
            }, 0);
        }
        return await testAuthComplete(token, ipFamily);
    }
    finally {
        spinner.stop(true);
    }
}
async function testAuthComplete(token, ipFamily) {
    const payload = {
        body: {
            token,
        },
        url: config_1.default.API + '/verify/callback',
        json: true,
        method: 'post',
    };
    if (ipFamily) {
        payload.family = ipFamily;
    }
    return new Promise((resolve, reject) => {
        debug(payload);
        request_1.makeRequest(payload, (error, res, body) => {
            debug(error, (res || {}).statusCode, body);
            if (error) {
                return reject(error);
            }
            if (res.statusCode !== 200) {
                return reject(errorForFailedAuthAttempt(res, body));
            }
            // we have success
            if (body.api) {
                return resolve({
                    res,
                    body,
                });
            }
            // we need to wait and poll again in a moment
            setTimeout(() => {
                attemptsLeft--;
                if (attemptsLeft > 0) {
                    return resolve(testAuthComplete(token, ipFamily));
                }
                reject(token_expired_error_1.TokenExpiredError());
            }, 1000);
        });
    });
}
async function auth(apiToken) {
    let promise;
    resetAttempts();
    if (apiToken) {
        // user is manually setting the API token on the CLI - let's trust them
        promise = is_authed_1.verifyAPI(apiToken);
    }
    else {
        promise = webAuth();
    }
    return promise.then((data) => {
        const res = data.res;
        const body = res.body;
        debug(body);
        if (res.statusCode === 200 || res.statusCode === 201) {
            snyk.config.set('api', body.api);
            return ('\nYour account has been authenticated. Snyk is now ready to ' +
                'be used.\n');
        }
        throw errorForFailedAuthAttempt(res, body);
    });
}
exports.default = auth;
/**
 * Resolve an appropriate error for a failed attempt to authenticate
 *
 * @param res The response from the API
 * @param body The body of the failed authentication request
 */
function errorForFailedAuthAttempt(res, body) {
    if (res.statusCode === 401 || res.statusCode === 403) {
        return errors_2.AuthFailedError(body.userMessage, res.statusCode);
    }
    else {
        const userMessage = body && body.userMessage;
        const error = new errors_1.CustomError(userMessage || 'Auth request failed');
        if (userMessage) {
            error.userMessage = userMessage;
        }
        error.code = res.statusCode;
        return error;
    }
}
async function getIpFamily() {
    const family = 6;
    try {
        // Dispatch a FORCED IPv6 request to test client's ISP and network capability
        await request_1.makeRequest({
            url: config_1.default.API + '/verify/callback',
            family,
            method: 'post',
        });
        return family;
    }
    catch (e) {
        return undefined;
    }
}
function browserAuthPrompt(isDocker, urlStr) {
    if (isDocker) {
        return ('\nTo authenticate your account, open the below URL in your browser.\n' +
            'After your authentication is complete, return to this prompt to ' +
            'start using Snyk.\n\n' +
            urlStr +
            '\n');
    }
    else {
        return ('\nNow redirecting you to our auth page, go ahead and log in,\n' +
            "and once the auth is complete, return to this prompt and you'll\n" +
            "be ready to start using snyk.\n\nIf you can't wait use this url:\n" +
            urlStr +
            '\n');
    }
}


/***/ }),

/***/ 71771:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

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

/***/ 27747:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

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


/***/ }),

/***/ 79578:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.TokenExpiredError = void 0;
const custom_error_1 = __webpack_require__(17188);
function TokenExpiredError() {
    const errorMsg = 'Sorry, but your authentication token has now' +
        ' expired.\nPlease try to authenticate again.';
    const error = new custom_error_1.CustomError(errorMsg);
    error.code = 401;
    error.strCode = 'AUTH_TIMEOUT';
    error.userMessage = errorMsg;
    return error;
}
exports.TokenExpiredError = TokenExpiredError;


/***/ }),

/***/ 14953:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.isDocker = void 0;
const fs = __webpack_require__(35747);
function isDocker() {
    return hasDockerEnv() || hasDockerCGroup();
}
exports.isDocker = isDocker;
function hasDockerEnv() {
    try {
        fs.statSync('/.dockerenv');
        return true;
    }
    catch (_) {
        return false;
    }
}
function hasDockerCGroup() {
    try {
        return fs.readFileSync('/proc/self/cgroup', 'utf8').includes('docker');
    }
    catch (_) {
        return false;
    }
}


/***/ }),

/***/ 36479:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.getQueryParamsAsString = void 0;
const url = __webpack_require__(78835);
const os = __webpack_require__(12087);
const is_docker_1 = __webpack_require__(14953);
const sources_1 = __webpack_require__(71653);
function getQueryParamsAsString(args) {
    var _a;
    const utm_source = process.env.SNYK_UTM_SOURCE || 'cli';
    const utm_medium = process.env.SNYK_UTM_MEDIUM || 'cli';
    const utm_campaign = process.env.SNYK_UTM_CAMPAIGN || sources_1.getIntegrationName(args) || 'cli';
    const utm_campaign_content = process.env.SNYK_UTM_CAMPAIGN_CONTENT || sources_1.getIntegrationVersion(args);
    const osType = (_a = os.type()) === null || _a === void 0 ? void 0 : _a.toLowerCase();
    const docker = is_docker_1.isDocker().toString();
    const queryParams = new url.URLSearchParams({
        utm_medium,
        utm_source,
        utm_campaign,
        utm_campaign_content,
        os: osType,
        docker,
    });
    // It may not be set and URLSearchParams won't filter out undefined values
    if (!utm_campaign_content) {
        queryParams.delete('utm_campaign_content');
    }
    return queryParams.toString();
}
exports.getQueryParamsAsString = getQueryParamsAsString;


/***/ }),

/***/ 18138:
/***/ ((module) => {

"use strict";
module.exports = JSON.parse('["|/-\\\\","⠂-–—–-","◐◓◑◒","◴◷◶◵","◰◳◲◱","▖▘▝▗","■□▪▫","▌▀▐▄","▉▊▋▌▍▎▏▎▍▌▋▊▉","▁▃▄▅▆▇█▇▆▅▄▃","←↖↑↗→↘↓↙","┤┘┴└├┌┬┐","◢◣◤◥",".oO°Oo.",".oO@*",["🌍","🌎","🌏"],"◡◡ ⊙⊙ ◠◠","☱☲☴","⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏","⠋⠙⠚⠞⠖⠦⠴⠲⠳⠓","⠄⠆⠇⠋⠙⠸⠰⠠⠰⠸⠙⠋⠇⠆","⠋⠙⠚⠒⠂⠂⠒⠲⠴⠦⠖⠒⠐⠐⠒⠓⠋","⠁⠉⠙⠚⠒⠂⠂⠒⠲⠴⠤⠄⠄⠤⠴⠲⠒⠂⠂⠒⠚⠙⠉⠁","⠈⠉⠋⠓⠒⠐⠐⠒⠖⠦⠤⠠⠠⠤⠦⠖⠒⠐⠐⠒⠓⠋⠉⠈","⠁⠁⠉⠙⠚⠒⠂⠂⠒⠲⠴⠤⠄⠄⠤⠠⠠⠤⠦⠖⠒⠐⠐⠒⠓⠋⠉⠈⠈","⢄⢂⢁⡁⡈⡐⡠","⢹⢺⢼⣸⣇⡧⡗⡏","⣾⣽⣻⢿⡿⣟⣯⣷","⠁⠂⠄⡀⢀⠠⠐⠈",["🌑","🌒","🌓","🌔","🌕","🌝","🌖","🌗","🌘","🌚"],["🕛","🕐","🕑","🕒","🕓","🕔","🕕","🕖","🕗","🕘","🕙","🕚"]]');

/***/ })

};
;
//# sourceMappingURL=974.index.js.map