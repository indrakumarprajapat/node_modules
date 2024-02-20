"use strict";
// Copyright IBM Corp. 2018,2020. All Rights Reserved.
// Node module: @loopback/rest
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT
Object.defineProperty(exports, "__esModule", { value: true });
exports.FindRouteMiddlewareProvider = exports.FindRouteProvider = void 0;
const tslib_1 = require("tslib");
const core_1 = require("@loopback/core");
const express_1 = require("@loopback/express");
const debug_1 = tslib_1.__importDefault(require("debug"));
const http_handler_1 = require("../http-handler");
const keys_1 = require("../keys");
const sequence_1 = require("../sequence");
const debug = debug_1.default('loopback:rest:find-route');
let FindRouteProvider = class FindRouteProvider {
    constructor(context, handler) {
        this.context = context;
        this.handler = handler;
    }
    value() {
        return request => this.action(request);
    }
    action(request) {
        const found = this.handler.findRoute(request);
        debug('Route found for %s %s', request.method, request.originalUrl, found);
        found.updateBindings(this.context);
        return found;
    }
};
FindRouteProvider = tslib_1.__decorate([
    tslib_1.__param(0, core_1.inject(keys_1.RestBindings.Http.CONTEXT)),
    tslib_1.__param(1, core_1.inject(keys_1.RestBindings.HANDLER)),
    tslib_1.__metadata("design:paramtypes", [core_1.Context,
        http_handler_1.HttpHandler])
], FindRouteProvider);
exports.FindRouteProvider = FindRouteProvider;
let FindRouteMiddlewareProvider = class FindRouteMiddlewareProvider {
    value() {
        return async (ctx, next) => {
            const request = ctx.request;
            debug('Finding route for %s %s', request.method, request.originalUrl);
            const handler = await ctx.get(keys_1.RestBindings.HANDLER);
            const route = handler.findRoute(request);
            debug('Route found for %s %s', request.method, request.originalUrl, route);
            route.updateBindings(ctx);
            ctx.bind(keys_1.RestBindings.Operation.ROUTE).to(route);
            return next();
        };
    }
};
FindRouteMiddlewareProvider = tslib_1.__decorate([
    core_1.injectable(express_1.asMiddleware({
        group: sequence_1.RestMiddlewareGroups.FIND_ROUTE,
        chain: keys_1.RestTags.REST_MIDDLEWARE_CHAIN,
    }), { scope: core_1.BindingScope.SINGLETON })
], FindRouteMiddlewareProvider);
exports.FindRouteMiddlewareProvider = FindRouteMiddlewareProvider;
//# sourceMappingURL=find-route.provider.js.map