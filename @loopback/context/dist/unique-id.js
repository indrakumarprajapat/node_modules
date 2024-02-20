"use strict";
// Copyright IBM Corp. 2018,2020. All Rights Reserved.
// Node module: @loopback/context
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT
Object.defineProperty(exports, "__esModule", { value: true });
exports.UNIQUE_ID_PATTERN = exports.generateUniqueId = void 0;
const tslib_1 = require("tslib");
const hyperid_1 = (0, tslib_1.__importDefault)(require("hyperid"));
/**
 * Generate a (globally) unique identifier in a very fast way.
 * Please note the ids ARE NOT formatted as UUID and have variable length.
 * The format of generated values may change in the future.
 *
 * @internal
 */
exports.generateUniqueId = (0, hyperid_1.default)({
    fixedLength: false,
    urlSafe: true,
});
/**
 * A regular expression for testing values generated by generateUniqueId.
 * @internal
 */
exports.UNIQUE_ID_PATTERN = /[A-Za-z0-9-_]+-\d+/;
//# sourceMappingURL=unique-id.js.map