"use strict";
exports.id = 663;
exports.ids = [663,85];
exports.modules = {

/***/ 29430:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.createApp = void 0;
const Debug = __webpack_require__(15158);
const apps_1 = __webpack_require__(14589);
const promise_1 = __webpack_require__(90430);
const spinner_1 = __webpack_require__(86766);
const debug = Debug(apps_1.SNYK_APP_DEBUG);
/**
 * Function to process the app creation request and
 * handle any errors that are request error and print
 * in a formatted string. It throws is error is unknown
 * or cannot be handled.
 * @param {ICreateAppRequest} data to create the app
 * @returns {String} response formatted string
 */
async function createApp(data) {
    debug('App data', data);
    const { orgId, snykAppName: name, snykAppRedirectUris: redirectUris, snykAppScopes: scopes, } = data;
    const payload = {
        method: 'POST',
        url: apps_1.getAppsURL(apps_1.EAppsURL.CREATE_APP, { orgId }),
        body: {
            name,
            redirectUris,
            scopes,
        },
        qs: {
            version: '2021-08-11~experimental',
        },
    };
    try {
        await spinner_1.spinner('Creating your Snyk App');
        const response = await promise_1.makeRequestRest(payload);
        debug(response);
        spinner_1.spinner.clearAll();
        return apps_1.handleCreateAppRes(response);
    }
    catch (error) {
        spinner_1.spinner.clearAll();
        apps_1.handleRestError(error);
    }
}
exports.createApp = createApp;


/***/ }),

/***/ 68458:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
const Debug = __webpack_require__(15158);
const process_command_args_1 = __webpack_require__(52369);
const apps_1 = __webpack_require__(14589);
const create_app_1 = __webpack_require__(29430);
// import * as path from 'path';
const create_app_2 = __webpack_require__(38276);
const help_1 = __webpack_require__(21085);
const debug = Debug(apps_1.SNYK_APP_DEBUG);
async function apps(...args0) {
    debug('Snyk apps CLI called');
    const { options, paths } = process_command_args_1.processCommandArgs(...args0);
    debug(options, paths);
    const commandVerb1 = paths[0];
    const validCommandVerb = commandVerb1 && apps_1.validAppsSubCommands.includes(commandVerb1);
    if (!validCommandVerb) {
        // Display help md for apps
        debug(`Unknown subcommand: ${commandVerb1}`);
        return help_1.default('apps');
    }
    // Check if experimental flag is being used
    if (!options.experimental)
        throw new Error(apps_1.AppsErrorMessages.useExperimental);
    if (commandVerb1 === apps_1.EValidSubCommands.CREATE) {
        const createAppData = options.interactive
            ? await create_app_2.createAppDataInteractive()
            : create_app_2.createAppDataScriptable(options);
        return await create_app_1.createApp(createAppData);
    }
}
exports.default = apps;


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

/***/ 89019:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.CreateAppPromptData = exports.AppsErrorMessages = exports.validAppsSubCommands = exports.EAppsURL = exports.EValidSubCommands = exports.SNYK_APP_DEBUG = exports.SNYK_APP_ORG_ID = exports.SNYK_APP_CLIENT_ID = exports.SNYK_APP_SCOPES = exports.SNYK_APP_REDIRECT_URIS = exports.SNYK_APP_NAME = void 0;
const chalk_1 = __webpack_require__(32589);
exports.SNYK_APP_NAME = 'snykAppName';
exports.SNYK_APP_REDIRECT_URIS = 'snykAppRedirectUris';
exports.SNYK_APP_SCOPES = 'snykAppScopes';
exports.SNYK_APP_CLIENT_ID = 'snykAppClientId';
exports.SNYK_APP_ORG_ID = 'snykAppOrgId';
exports.SNYK_APP_DEBUG = 'snyk:apps';
var EValidSubCommands;
(function (EValidSubCommands) {
    EValidSubCommands["CREATE"] = "create";
})(EValidSubCommands = exports.EValidSubCommands || (exports.EValidSubCommands = {}));
var EAppsURL;
(function (EAppsURL) {
    EAppsURL[EAppsURL["CREATE_APP"] = 0] = "CREATE_APP";
})(EAppsURL = exports.EAppsURL || (exports.EAppsURL = {}));
exports.validAppsSubCommands = Object.values(EValidSubCommands);
exports.AppsErrorMessages = {
    orgRequired: `Option '--org' is required! For interactive mode, please use '--interactive' or '-i' flag. For more information please run the help command 'snyk apps --help' or 'snyk apps -h'.`,
    nameRequired: `Option '--name' is required! For interactive mode, please use '--interactive' or '-i' flag. For more information please run the help command 'snyk apps --help' or 'snyk apps -h'.`,
    redirectUrisRequired: `Option '--redirect-uris' is required! For interactive mode, please use '--interactive' or '-i' flag. For more information please run the help command 'snyk apps --help' or 'snyk apps -h'.`,
    scopesRequired: `Option '--scopes' is required! For interactive mode, please use '--interactive' or '-i' flag. For more information please run the help command 'snyk apps --help' or 'snyk apps -h'.`,
    useExperimental: `\n${chalk_1.default.redBright("All 'apps' commands are only accessible behind the '--experimental' flag.")}\n 
The behaviour can change at any time, without prior notice. 
You are kindly advised to use all the commands with caution.
  
${chalk_1.default.bold('Usage')}
  ${chalk_1.default.italic('snyk apps <COMMAND> --experimental')}\n`,
};
exports.CreateAppPromptData = {
    SNYK_APP_NAME: {
        name: exports.SNYK_APP_NAME,
        message: `Name of the Snyk App (visible to users when they install the Snyk App)?`,
    },
    SNYK_APP_REDIRECT_URIS: {
        name: exports.SNYK_APP_REDIRECT_URIS,
        message: `Your Snyk App's redirect URIs (comma seprated list. ${chalk_1.default.yellowBright(' Ex: https://example1.com,https://example2.com')})?: `,
    },
    SNYK_APP_SCOPES: {
        name: exports.SNYK_APP_SCOPES,
        message: `Your Snyk App's permission scopes (comma separated list. ${chalk_1.default.yellowBright(' Ex: apps:beta')})?: `,
    },
    SNYK_APP_ORG_ID: {
        name: exports.SNYK_APP_ORG_ID,
        message: 'Please provide the org id under which you want to create your Snyk App: ',
    },
};


/***/ }),

/***/ 38276:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.createAppDataInteractive = exports.createAppDataScriptable = void 0;
const __1 = __webpack_require__(14589);
const enquirer = __webpack_require__(84031);
const errors_1 = __webpack_require__(55191);
/**
 * Validates and parsed the data required to create app.
 * Throws error if option is not provided or is invalid
 * @param {ICreateAppOptions} options required to create an app
 * @returns {ICreateAppRequest} data that is used to make the request
 */
function createAppDataScriptable(options) {
    if (!options.org) {
        throw new errors_1.ValidationError(__1.AppsErrorMessages.orgRequired);
    }
    else if (typeof __1.validateUUID(options.org) === 'string') {
        // Combines to form "Invalid UUID provided for org id"
        throw new errors_1.ValidationError(`${__1.validateUUID(options.org)} for org id`);
    }
    else if (!options.name) {
        throw new errors_1.ValidationError(__1.AppsErrorMessages.nameRequired);
    }
    else if (!options['redirect-uris']) {
        throw new errors_1.ValidationError(__1.AppsErrorMessages.redirectUrisRequired);
    }
    else if (typeof __1.validateAllURL(options['redirect-uris']) === 'string') {
        throw new errors_1.ValidationError(__1.validateAllURL(options['redirect-uris']));
    }
    else if (!options.scopes) {
        throw new errors_1.ValidationError(__1.AppsErrorMessages.scopesRequired);
    }
    else {
        return {
            orgId: options.org,
            snykAppName: options.name,
            snykAppRedirectUris: options['redirect-uris']
                .replace(/\s+/g, '')
                .split(','),
            snykAppScopes: options.scopes.replace(/\s+/g, '').split(','),
        };
    }
}
exports.createAppDataScriptable = createAppDataScriptable;
// Interactive format
async function createAppDataInteractive() {
    // Proceed with interactive
    const answers = await enquirer.prompt(__1.createAppPrompts);
    // Process answers
    const snykAppName = answers[__1.SNYK_APP_NAME].trim();
    const snykAppRedirectUris = answers[__1.SNYK_APP_REDIRECT_URIS].replace(/\s+/g, '').split(',');
    const snykAppScopes = answers[__1.SNYK_APP_SCOPES].replace(/\s+/g, '').split(',');
    const orgId = answers[__1.SNYK_APP_ORG_ID].trim();
    // POST: to create an app
    return {
        orgId,
        snykAppName,
        snykAppRedirectUris,
        snykAppScopes,
    };
}
exports.createAppDataInteractive = createAppDataInteractive;


/***/ }),

/***/ 14589:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


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
__exportStar(__webpack_require__(89019), exports);
__exportStar(__webpack_require__(86950), exports);
__exportStar(__webpack_require__(31940), exports);
__exportStar(__webpack_require__(72511), exports);
__exportStar(__webpack_require__(46693), exports);
__exportStar(__webpack_require__(8864), exports);


/***/ }),

/***/ 8864:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.validInput = exports.validateUUID = exports.validURL = exports.validateAllURL = void 0;
const uuid = __webpack_require__(42277);
/**
 *
 * @param {String} input of space separated URL/URI passed by
 * user for redirect URIs
 * @returns { String | Boolean } complying with enquirer return values, the function
 * separates the string on space and validates each to see
 * if a valid URL/URI. Return a string if invalid and
 * boolean true if valid
 */
function validateAllURL(input) {
    const trimmedInput = input.trim();
    let errMessage = '';
    for (const i of trimmedInput.split(',')) {
        if (typeof validURL(i) == 'string')
            errMessage = errMessage + `\n${validURL(i)}`;
    }
    if (errMessage)
        return errMessage;
    return true;
}
exports.validateAllURL = validateAllURL;
/**
 * Custom validation logic which takes in consideration
 * creation of Snyk Apps and thus allows localhost.com
 * as a valid URL.
 * @param {String} input of URI/URL value to validate using
 * regex
 * @returns {String | Boolean } string message is not valid
 * and boolean true if valid
 */
function validURL(input) {
    try {
        new URL(input);
        return true;
    }
    catch (error) {
        return `${input} is not a valid URL`;
    }
}
exports.validURL = validURL;
/**
 * Function validates if a valid UUID (version of UUID not tacken into account)
 * @param {String} input UUID to be validated
 * @returns {String | Boolean } string message is not valid
 * and boolean true if valid
 */
function validateUUID(input) {
    return uuid.validate(input) ? true : 'Invalid UUID provided';
}
exports.validateUUID = validateUUID;
/**
 * @param {String} input
 * @returns {String | Boolean } string message is not valid
 * and boolean true if valid
 */
function validInput(input) {
    if (!input)
        return 'Please enter something';
    return true;
}
exports.validInput = validInput;


/***/ }),

/***/ 86950:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.createAppPrompts = void 0;
const constants_1 = __webpack_require__(89019);
const input_validator_1 = __webpack_require__(8864);
/**
 * Prompts for $snyk apps create command
 */
exports.createAppPrompts = [
    {
        name: constants_1.CreateAppPromptData.SNYK_APP_NAME.name,
        type: 'input',
        message: constants_1.CreateAppPromptData.SNYK_APP_NAME.message,
        validate: input_validator_1.validInput,
    },
    {
        name: constants_1.CreateAppPromptData.SNYK_APP_REDIRECT_URIS.name,
        type: 'input',
        message: constants_1.CreateAppPromptData.SNYK_APP_REDIRECT_URIS.message,
        validate: input_validator_1.validateAllURL,
    },
    {
        name: constants_1.CreateAppPromptData.SNYK_APP_SCOPES.name,
        type: 'input',
        message: constants_1.CreateAppPromptData.SNYK_APP_SCOPES.message,
        validate: input_validator_1.validInput,
    },
    {
        name: constants_1.CreateAppPromptData.SNYK_APP_ORG_ID.name,
        type: 'input',
        message: constants_1.CreateAppPromptData.SNYK_APP_ORG_ID.message,
        validate: input_validator_1.validateUUID,
    },
];


/***/ }),

/***/ 72511:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.handleCreateAppRes = exports.handleRestError = exports.getAppsURL = void 0;
/**
 * Collection of utility function for the
 * $snyk apps commands
 */
const _1 = __webpack_require__(14589);
const chalk_1 = __webpack_require__(32589);
const errors_1 = __webpack_require__(55191);
const Debug = __webpack_require__(15158);
const config_1 = __webpack_require__(22541);
const debug = Debug(_1.SNYK_APP_DEBUG);
function getAppsURL(selection, opts = {}) {
    // Get the rest URL from user config
    // Environment variable takes precendence over config
    const baseURL = config_1.default.API_REST_URL;
    debug(`API rest base URL => ${baseURL}`);
    switch (selection) {
        case _1.EAppsURL.CREATE_APP:
            return `${baseURL}/orgs/${opts.orgId}/apps`;
        default:
            throw new Error('Invalid selection for URL');
    }
}
exports.getAppsURL = getAppsURL;
function handleRestError(error) {
    if (error.code) {
        if (error.code === 400) {
            // Bad request
            const responseJSON = error.body;
            const errString = errorsToDisplayString(responseJSON);
            throw new Error(errString);
        }
        else if (error.code === 401) {
            // Unauthorized
            throw errors_1.AuthFailedError();
        }
        else if (error.code === 403) {
            throw new Error('Forbidden! the authentication token does not have access to the resource.');
        }
        else if (error.code === 404) {
            const responseJSON = error.body;
            const errString = errorsToDisplayString(responseJSON);
            throw new Error(errString);
        }
        else if (error.code === 500) {
            throw new errors_1.InternalServerError('Internal server error');
        }
        else {
            throw new Error(error.message);
        }
    }
    else {
        throw error;
    }
}
exports.handleRestError = handleRestError;
/**
 * @param errRes RestError response
 * @returns {String} Iterates over error and
 * converts them into a readible string
 */
function errorsToDisplayString(errRes) {
    const resString = `Uh oh! an error occurred while trying to create the Snyk App.
Please run the command with '--debug' or '-d' to get more information`;
    if (!errRes.errors)
        return resString;
    errRes.errors.forEach((e) => {
        let metaString = '', sourceString = '';
        if (e.meta) {
            for (const [key, value] of Object.entries(e.meta)) {
                metaString += `${key}: ${value}\n`;
            }
        }
        if (e.source) {
            for (const [key, value] of Object.entries(e.source)) {
                sourceString += `${key}: ${value}\n`;
            }
        }
        const meta = metaString || '-';
        const source = sourceString || '-';
        return `Uh oh! an error occured while trying to create the Snyk App.

Error Description:\t${e.detail}
Request Status:\t${e.status}
Source:\t${source}
Meta:\t${meta}`;
    });
    return resString;
}
function handleCreateAppRes(res) {
    const { name, clientId, redirectUris, scopes, isPublic, clientSecret, } = res.data.attributes;
    return `Snyk App created successfully!
Please ensure you save the following details:

App Name:\t${name}
Client ID:\t${clientId}
Redirect URIs:\t${redirectUris}
Scopes:\t${scopes}
Is App Public:\t${isPublic}
Client Secret (${chalk_1.default.redBright('keep it safe and protected')}):\t${clientSecret}`;
}
exports.handleCreateAppRes = handleCreateAppRes;


/***/ }),

/***/ 31940:
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));


/***/ }),

/***/ 46693:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.readAppsHelpMarkdown = void 0;
const fs = __webpack_require__(35747);
const markdown_renderer_1 = __webpack_require__(99387);
function readAppsHelpMarkdown(filename) {
    const file = fs.readFileSync(filename, 'utf8');
    return markdown_renderer_1.renderMarkdown(file);
}
exports.readAppsHelpMarkdown = readAppsHelpMarkdown;


/***/ }),

/***/ 90430:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


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


/***/ })

};
;
//# sourceMappingURL=663.index.js.map