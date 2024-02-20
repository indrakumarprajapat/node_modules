import { Provider } from '@loopback/core';
import { ErrorWriterOptions } from 'strong-error-handler';
import { HandlerContext, LogError, Reject } from '../types';
export declare class RejectProvider implements Provider<Reject> {
    protected logError: LogError;
    protected errorWriterOptions?: ErrorWriterOptions | undefined;
    constructor(logError: LogError, errorWriterOptions?: ErrorWriterOptions | undefined);
    value(): Reject;
    action({ request, response }: HandlerContext, error: Error): void;
}
