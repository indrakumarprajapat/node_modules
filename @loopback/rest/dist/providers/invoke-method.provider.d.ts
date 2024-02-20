import { Context, Provider } from '@loopback/core';
import { Middleware } from '@loopback/express';
import { RouteEntry } from '../router';
import { InvokeMethod, OperationArgs, OperationRetval } from '../types';
export declare class InvokeMethodProvider implements Provider<InvokeMethod> {
    protected context: Context;
    constructor(context: Context);
    value(): InvokeMethod;
    action(route: RouteEntry, args: OperationArgs): Promise<OperationRetval>;
}
export declare class InvokeMethodMiddlewareProvider implements Provider<Middleware> {
    value(): Middleware;
}
