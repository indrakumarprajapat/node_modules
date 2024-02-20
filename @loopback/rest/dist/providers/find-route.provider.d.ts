import { Context, Provider } from '@loopback/core';
import { Middleware } from '@loopback/express';
import { HttpHandler } from '../http-handler';
import { ResolvedRoute } from '../router';
import { FindRoute, Request } from '../types';
export declare class FindRouteProvider implements Provider<FindRoute> {
    protected context: Context;
    protected handler: HttpHandler;
    constructor(context: Context, handler: HttpHandler);
    value(): FindRoute;
    action(request: Request): ResolvedRoute;
}
export declare class FindRouteMiddlewareProvider implements Provider<Middleware> {
    value(): Middleware;
}
