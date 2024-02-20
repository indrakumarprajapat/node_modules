"use strict";
// Copyright IBM Corp. 2019. All Rights Reserved.
// Node module: @loopback/boot
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT
Object.defineProperty(exports, "__esModule", { value: true });
exports.hello = exports.ArtifactTwo = exports.ArtifactOne = void 0;
const tslib_1 = require("tslib");
const rest_1 = require("@loopback/rest");
class ArtifactOne {
    one() {
        return 'ControllerOne.one()';
    }
}
(0, tslib_1.__decorate)([
    (0, rest_1.get)('/one'),
    (0, tslib_1.__metadata)("design:type", Function),
    (0, tslib_1.__metadata)("design:paramtypes", []),
    (0, tslib_1.__metadata)("design:returntype", void 0)
], ArtifactOne.prototype, "one", null);
exports.ArtifactOne = ArtifactOne;
class ArtifactTwo {
    two() {
        return 'ControllerTwo.two()';
    }
}
(0, tslib_1.__decorate)([
    (0, rest_1.get)('/two'),
    (0, tslib_1.__metadata)("design:type", Function),
    (0, tslib_1.__metadata)("design:paramtypes", []),
    (0, tslib_1.__metadata)("design:returntype", void 0)
], ArtifactTwo.prototype, "two", null);
exports.ArtifactTwo = ArtifactTwo;
function hello() {
    return 'hello world';
}
exports.hello = hello;
//# sourceMappingURL=multiple.artifact.js.map
//# sourceMappingURL=/Users/dhmlau/loopback-release/loopback-next/packages/boot/dist/__tests__/fixtures/multiple.artifact.js.map