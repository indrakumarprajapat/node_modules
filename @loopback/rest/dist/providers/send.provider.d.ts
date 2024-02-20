import { Provider } from '@loopback/core';
import { Middleware } from '@loopback/express';
import { Send } from '../types';
import { writeResultToResponse } from '../writer';
/**
 * Provides the function that populates the response object with
 * the results of the operation.
 *
 * @returns The handler function that will populate the
 * response with operation results.
 */
export declare class SendProvider implements Provider<Send> {
    value(): typeof writeResultToResponse;
}
export declare class SendResponseMiddlewareProvider implements Provider<Middleware> {
    value(): Middleware;
}
