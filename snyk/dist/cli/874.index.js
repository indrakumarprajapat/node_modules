"use strict";
exports.id = 874;
exports.ids = [874,85];
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

/***/ 70919:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
const process_command_args_1 = __webpack_require__(52369);
const legacyError = __webpack_require__(79407);
const drift_1 = __webpack_require__(26445);
const get_iac_org_settings_1 = __webpack_require__(1802);
const assert_iac_options_flag_1 = __webpack_require__(68590);
const config_1 = __webpack_require__(22541);
const analytics_1 = __webpack_require__(22716);
const analytics = __webpack_require__(82744);
const policy_1 = __webpack_require__(32615);
const describe_required_argument_error_1 = __webpack_require__(37541);
const help_1 = __webpack_require__(21085);
exports.default = async (...args) => {
    var _a, _b;
    const { options } = process_command_args_1.processCommandArgs(...args);
    // Ensure that this describe command can only be runned when using `snyk iac describe`
    // Avoid `snyk describe` direct usage
    if (options.iac != true) {
        return legacyError('describe');
    }
    // Ensure that we are allowed to run that command
    // by checking the entitlement
    const orgPublicId = (_a = options.org) !== null && _a !== void 0 ? _a : config_1.default.org;
    const iacOrgSettings = await get_iac_org_settings_1.getIacOrgSettings(orgPublicId);
    if (!((_b = iacOrgSettings.entitlements) === null || _b === void 0 ? void 0 : _b.iacDrift)) {
        throw new assert_iac_options_flag_1.UnsupportedEntitlementCommandError('drift', 'iacDrift');
    }
    const policy = await policy_1.findAndLoadPolicy(process.cwd(), 'iac', options);
    const driftIgnore = drift_1.driftignoreFromPolicy(policy);
    try {
        const describe = await drift_1.runDriftCTL({
            options: { ...options, kind: 'describe' },
            driftIgnore: driftIgnore,
        });
        analytics.add('is-iac-drift', true);
        analytics.add('iac-drift-exit-code', describe.code);
        if (describe.code === drift_1.DCTL_EXIT_CODES.EXIT_ERROR) {
            process.exitCode = describe.code;
            throw new Error();
        }
        // Parse analysis JSON and add to analytics
        const analysis = drift_1.parseDriftAnalysisResults(describe.stdout);
        analytics_1.addIacDriftAnalytics(analysis, options);
        const fmtResult = await drift_1.runDriftCTL({
            options: { ...options, kind: 'fmt' },
            input: describe.stdout,
        });
        process.stdout.write(drift_1.processDriftctlOutput(options, fmtResult.stdout));
        process.exitCode = describe.code;
    }
    catch (e) {
        if (e instanceof describe_required_argument_error_1.DescribeRequiredArgumentError) {
            // when missing a required arg we will display help to explain
            const helpMsg = await help_1.default('iac', 'describe');
            console.log(helpMsg);
        }
        return Promise.reject(e);
    }
};


/***/ }),

/***/ 21085:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.findHelpFile = void 0;
const fs = __webpack_require__(35747);
const path = __webpack_require__(85622);
const markdown_renderer_1 = __webpack_require__(99387);
function findHelpFile(helpArgs, helpFolderPath = '../../help/cli-commands') {
    while (helpArgs.length > 0) {
        // cleanse the filename to only contain letters
        // aka: /\W/g but figured this was easier to read
        const file = `${helpArgs.join('-').replace(/[^a-z0-9-]/gi, '')}.md`;
        const testHelpAbsolutePath = path.resolve(__dirname, helpFolderPath, file);
        if (fs.existsSync(testHelpAbsolutePath)) {
            return testHelpAbsolutePath;
        }
        helpArgs = helpArgs.slice(0, -1);
    }
    return path.resolve(__dirname, helpFolderPath, `README.md`); // Default help file
}
exports.findHelpFile = findHelpFile;
async function help(...args) {
    const helpArgs = args.filter((arg) => typeof arg === 'string');
    const helpFileAbsolutePath = findHelpFile(helpArgs);
    return markdown_renderer_1.renderMarkdown(fs.readFileSync(helpFileAbsolutePath, 'utf8'));
}
exports.default = help;


/***/ }),

/***/ 99387:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.renderMarkdown = void 0;
const marked_1 = __webpack_require__(30970);
const chalk_1 = __webpack_require__(32589);
const reflow_text_1 = __webpack_require__(67211);
// stateful variable to control left-padding by header level
let currentHeader = 1;
const listItemSeparator = 'LISTITEMSEPARATOR'; // Helper string for rendering ListItems
/**
 * @description get padding spaces depending on the last header level used
 * @returns string
 */
function getLeftTextPadding() {
    return '  '.repeat(currentHeader === 1 || currentHeader === 2 ? 1 : currentHeader - 1);
}
/**
 * @description Reads current terminal width if available to limit column width for text-reflowing
 * @returns {number}
 */
const defaultMaximumLineWidth = 100;
function getIdealTextWidth(maximumLineWidth = defaultMaximumLineWidth) {
    if (typeof process.stdout.columns === 'number') {
        if (process.stdout.columns < maximumLineWidth) {
            return process.stdout.columns - getLeftTextPadding().length - 5;
        }
    }
    return maximumLineWidth - getLeftTextPadding().length;
}
// Marked custom renderer class
const renderer = {
    em(text) {
        return chalk_1.default.italic(text);
    },
    strong(text) {
        return chalk_1.default.bold(text);
    },
    link(href, title, text) {
        // Don't render links to relative paths (like local files)
        if (href.startsWith('./') || !href.includes('://')) {
            return text;
        }
        const renderedLink = chalk_1.default.bold.blueBright(href);
        if (text && text !== href) {
            return `${text} ${renderedLink}`;
        }
        return renderedLink;
    },
    blockquote(quote) {
        return quote;
    },
    list(body, ordered, start) {
        return (body
            .split(listItemSeparator)
            .map((listItem, listItemIndex) => {
            const bulletPoint = ordered ? `${listItemIndex + start}. ` : '-  ';
            return reflow_text_1.reflowText(listItem, getIdealTextWidth())
                .split('\n')
                .map((listItemLine, listItemLineIndex) => {
                if (!listItemLine) {
                    return '';
                }
                return `${getLeftTextPadding()}${listItemLineIndex === 0 ? bulletPoint : '   '}${listItemLine}`;
            })
                .join('\n');
        })
            .join('\n') + '\n');
    },
    listitem(text) {
        return text + listItemSeparator;
    },
    paragraph(text) {
        return (reflow_text_1.reflowText(text, getIdealTextWidth())
            .split('\n')
            .map((s) => getLeftTextPadding() + chalk_1.default.reset() + s)
            .join('\n') + '\n\n');
    },
    codespan(text) {
        return chalk_1.default.italic.blueBright(`${text}`);
    },
    code(code) {
        return (code
            .split('\n')
            .map((s) => getLeftTextPadding() + chalk_1.default.reset() + s)
            .join('\n') + '\n\n');
    },
    heading(text, level) {
        currentHeader = level;
        let coloring;
        switch (level) {
            case 1:
                coloring = chalk_1.default.bold.underline;
                break;
            case 3:
            case 4:
                coloring = chalk_1.default;
                break;
            default:
                coloring = chalk_1.default.bold;
                break;
        }
        return `${'  '.repeat(level === 1 ? 0 : currentHeader - 2)}${coloring(text)}\n`;
    },
};
marked_1.marked.use({ renderer });
marked_1.marked.setOptions({
    mangle: false,
});
const htmlUnescapes = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&#96;': '`',
    '&#x20;': '',
};
/**
 * @description Replace HTML entities with their non-encoded variant
 * @param {string} text
 * @returns {string}
 */
function unescape(text) {
    Object.entries(htmlUnescapes).forEach(([escapedChar, unescapedChar]) => {
        const escapedCharRegExp = new RegExp(escapedChar, 'g');
        text = text.replace(escapedCharRegExp, unescapedChar);
    });
    return text;
}
function renderMarkdown(markdown) {
    return unescape(marked_1.marked.parse(markdown));
}
exports.renderMarkdown = renderMarkdown;


/***/ }),

/***/ 67211:
/***/ ((__unused_webpack_module, exports) => {


/**
Code in this file is adapted from mikaelbr/marked-terminal
https://github.com/mikaelbr/marked-terminal/blob/7501b8bb24a5ed52ec7d9114d4aeefa14f1bf5e6/index.js#L234-L330


MIT License

Copyright (c) 2017 Mikael Brevik

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
 */
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.reflowText = void 0;
// Compute length of str not including ANSI escape codes.
// See http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
function textLength(str) {
    // eslint-disable-next-line no-control-regex
    return str.replace(/\u001b\[(?:\d{1,3})(?:;\d{1,3})*m/g, '').length;
}
// Munge \n's and spaces in "text" so that the number of
// characters between \n's is less than or equal to "width".
function reflowText(text, width) {
    const HARD_RETURN = '\r|\n';
    const HARD_RETURN_GFM_RE = new RegExp(HARD_RETURN + '|<br ?/?>');
    const splitRe = HARD_RETURN_GFM_RE;
    const sections = text.split(splitRe);
    const reflowed = [];
    sections.forEach((section) => {
        // Split the section by escape codes so that we can
        // deal with them separately.
        // eslint-disable-next-line no-control-regex
        const fragments = section.split(/(\u001b\[(?:\d{1,3})(?:;\d{1,3})*m)/g);
        let column = 0;
        let currentLine = '';
        let lastWasEscapeChar = false;
        while (fragments.length) {
            const fragment = fragments[0];
            if (fragment === '') {
                fragments.splice(0, 1);
                lastWasEscapeChar = false;
                continue;
            }
            // This is an escape code - leave it whole and
            // move to the next fragment.
            if (!textLength(fragment)) {
                currentLine += fragment;
                fragments.splice(0, 1);
                lastWasEscapeChar = true;
                continue;
            }
            const words = fragment.split(/[ \t\n]+/);
            for (let i = 0; i < words.length; i++) {
                let word = words[i];
                let addSpace = column != 0;
                if (lastWasEscapeChar)
                    addSpace = false;
                // If adding the new word overflows the required width
                if (column + word.length > width) {
                    if (word.length <= width) {
                        // If the new word is smaller than the required width
                        // just add it at the beginning of a new line
                        reflowed.push(currentLine);
                        currentLine = word;
                        column = word.length;
                    }
                    else {
                        // If the new word is longer than the required width
                        // split this word into smaller parts.
                        const w = word.substr(0, width - column);
                        if (addSpace)
                            currentLine += ' ';
                        currentLine += w;
                        reflowed.push(currentLine);
                        currentLine = '';
                        column = 0;
                        word = word.substr(w.length);
                        while (word.length) {
                            const w = word.substr(0, width);
                            if (!w.length)
                                break;
                            if (w.length < width) {
                                currentLine = w;
                                column = w.length;
                                break;
                            }
                            else {
                                reflowed.push(w);
                                word = word.substr(width);
                            }
                        }
                    }
                }
                else {
                    if (addSpace) {
                        currentLine += ' ';
                        column++;
                    }
                    currentLine += word;
                    column += word.length;
                }
                lastWasEscapeChar = false;
            }
            fragments.splice(0, 1);
        }
        if (textLength(currentLine))
            reflowed.push(currentLine);
    });
    return reflowed.join('\n');
}
exports.reflowText = reflowText;


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

/***/ 8820:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


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


Object.defineProperty(exports, "__esModule", ({ value: true }));
var pluck_policies_1 = __webpack_require__(68247);
Object.defineProperty(exports, "pluckPolicies", ({ enumerable: true, get: function () { return pluck_policies_1.pluckPolicies; } }));
var find_and_load_policy_1 = __webpack_require__(8820);
Object.defineProperty(exports, "findAndLoadPolicy", ({ enumerable: true, get: function () { return find_and_load_policy_1.findAndLoadPolicy; } }));


/***/ }),

/***/ 68247:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


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


/***/ })

};
;
//# sourceMappingURL=874.index.js.map