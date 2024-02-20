"use strict";
// Copyright IBM Corp. 2018,2020. All Rights Reserved.
// Node module: @loopback/rest
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogErrorProvider = void 0;
const tslib_1 = require("tslib");
const core_1 = require("@loopback/core");
let LogErrorProvider = class LogErrorProvider {
    value() {
        return (err, statusCode, req) => this.action(err, statusCode, req);
    }
    action(err, statusCode, req) {
        var _a;
        if (statusCode < 500) {
            return;
        }
        console.error('Unhandled error in %s %s: %s %s', req.method, req.url, statusCode, (_a = err.stack) !== null && _a !== void 0 ? _a : err);
    }
};
LogErrorProvider = tslib_1.__decorate([
    core_1.injectable({ scope: core_1.BindingScope.SINGLETON })
], LogErrorProvider);
exports.LogErrorProvider = LogErrorProvider;
//# sourceMappingURL=log-error.provider.js.map