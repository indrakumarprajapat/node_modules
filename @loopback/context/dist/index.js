"use strict";
// Copyright IBM Corp. 2017,2020. All Rights Reserved.
// Node module: @loopback/context
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
/**
 * Facilities to manage artifacts and their dependencies using {@link Context}
 * in your Node.js applications. It can be used independent of the LoopBack
 * framework.
 *
 * @remarks
 * This package exposes TypeScript/JavaScript APIs and decorators to register
 * artifacts, declare dependencies, and resolve artifacts by keys. The
 * {@link Context} also serves as an IoC container to support dependency
 * injection.
 * Context and Binding are the two core concepts. A context is a registry of
 * bindings and each binding represents a resolvable artifact by the key.
 *
 * - Bindings can be fulfilled by a constant, a factory function, a class, or a
 *   provider.
 * - Bindings can be grouped by tags and searched by tags.
 * - Binding scopes can be used to control how a resolved binding value is
 *   shared.
 * - Bindings can be resolved synchronously or asynchronously.
 * - Provide {@link inject | @inject} and other variants of decorators to
 *   express dependencies.
 * - Support Constructor, property, and method injections.
 * - Allow contexts to form a hierarchy to share or override bindings.
 *
 * @pakageDocumentation
 */
(0, tslib_1.__exportStar)(require("@loopback/metadata"), exports);
(0, tslib_1.__exportStar)(require("./binding"), exports);
(0, tslib_1.__exportStar)(require("./binding-config"), exports);
(0, tslib_1.__exportStar)(require("./binding-decorator"), exports);
(0, tslib_1.__exportStar)(require("./binding-filter"), exports);
(0, tslib_1.__exportStar)(require("./binding-inspector"), exports);
(0, tslib_1.__exportStar)(require("./binding-key"), exports);
(0, tslib_1.__exportStar)(require("./binding-sorter"), exports);
(0, tslib_1.__exportStar)(require("./context"), exports);
(0, tslib_1.__exportStar)(require("./context-event"), exports);
(0, tslib_1.__exportStar)(require("./context-observer"), exports);
(0, tslib_1.__exportStar)(require("./context-subscription"), exports);
(0, tslib_1.__exportStar)(require("./context-view"), exports);
(0, tslib_1.__exportStar)(require("./inject"), exports);
(0, tslib_1.__exportStar)(require("./inject-config"), exports);
(0, tslib_1.__exportStar)(require("./interception-proxy"), exports);
(0, tslib_1.__exportStar)(require("./interceptor"), exports);
(0, tslib_1.__exportStar)(require("./interceptor-chain"), exports);
(0, tslib_1.__exportStar)(require("./invocation"), exports);
(0, tslib_1.__exportStar)(require("./json-types"), exports);
(0, tslib_1.__exportStar)(require("./keys"), exports);
(0, tslib_1.__exportStar)(require("./provider"), exports);
(0, tslib_1.__exportStar)(require("./resolution-session"), exports);
(0, tslib_1.__exportStar)(require("./resolver"), exports);
(0, tslib_1.__exportStar)(require("./unique-id"), exports);
(0, tslib_1.__exportStar)(require("./value-promise"), exports);
//# sourceMappingURL=index.js.map