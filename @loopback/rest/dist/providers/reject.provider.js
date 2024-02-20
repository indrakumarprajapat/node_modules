"use strict";
// Copyright IBM Corp. 2018,2020. All Rights Reserved.
// Node module: @loopback/rest
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT
Object.defineProperty(exports, "__esModule", { value: true });
exports.RejectProvider = void 0;
const tslib_1 = require("tslib");
const core_1 = require("@loopback/core");
const strong_error_handler_1 = require("strong-error-handler");
const keys_1 = require("../keys");
// TODO(bajtos) Make this mapping configurable at RestServer level,
// allow apps and extensions to contribute additional mappings.
const codeToStatusCodeMap = {
    ENTITY_NOT_FOUND: 404,
};
let RejectProvider = class RejectProvider {
    constructor(logError, errorWriterOptions) {
        this.logError = logError;
        this.errorWriterOptions = errorWriterOptions;
    }
    value() {
        return (context, error) => this.action(context, error);
    }
    action({ request, response }, error) {
        const err = error;
        if (!err.status && !err.statusCode && err.code) {
            const customStatus = codeToStatusCodeMap[err.code];
            if (customStatus) {
                err.statusCode = customStatus;
            }
        }
        const statusCode = err.statusCode || err.status || 500;
        strong_error_handler_1.writeErrorToResponse(err, request, response, this.errorWriterOptions);
        this.logError(error, statusCode, request);
    }
};
RejectProvider = tslib_1.__decorate([
    core_1.injectable({ scope: core_1.BindingScope.SINGLETON }),
    tslib_1.__param(0, core_1.inject(keys_1.RestBindings.SequenceActions.LOG_ERROR)),
    tslib_1.__param(1, core_1.inject(keys_1.RestBindings.ERROR_WRITER_OPTIONS, { optional: true })),
    tslib_1.__metadata("design:paramtypes", [Function, Object])
], RejectProvider);
exports.RejectProvider = RejectProvider;
//# sourceMappingURL=reject.provider.js.map