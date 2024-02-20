"use strict";
// Copyright IBM Corp. 2018,2020. All Rights Reserved.
// Node module: @loopback/testlab
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
/**
 * A collection of test utilities we use to write LoopBack tests.
 *
 * @remarks
 * Test utilities to help write LoopBack 4 tests:
 *
 * - `expect` - behavior-driven development (BDD) style assertions
 * - `sinon`
 *   - test spies: functions recording arguments and other information for all
 *     of their calls
 *   - stubs: functions (spies) with pre-programmed behavior
 *   - mocks: fake methods (like spies) with pre-programmed behavior
 *     (like stubs) as well as pre-programmed expectations
 * - Helpers for creating `supertest` clients for LoopBack applications
 * - HTTP request/response stubs for writing tests without a listening HTTP
 *   server
 * - Swagger/OpenAPI spec validation
 *
 * @packageDocumentation
 */
(0, tslib_1.__exportStar)(require("./client"), exports);
(0, tslib_1.__exportStar)(require("./expect"), exports);
(0, tslib_1.__exportStar)(require("./http-error-logger"), exports);
(0, tslib_1.__exportStar)(require("./http-server-config"), exports);
(0, tslib_1.__exportStar)(require("./request"), exports);
(0, tslib_1.__exportStar)(require("./shot"), exports);
(0, tslib_1.__exportStar)(require("./sinon"), exports);
(0, tslib_1.__exportStar)(require("./skip"), exports);
(0, tslib_1.__exportStar)(require("./test-sandbox"), exports);
(0, tslib_1.__exportStar)(require("./to-json"), exports);
(0, tslib_1.__exportStar)(require("./validate-api-spec"), exports);
//# sourceMappingURL=index.js.map