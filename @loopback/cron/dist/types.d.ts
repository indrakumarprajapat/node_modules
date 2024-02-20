/// <reference types="node" />
import { Binding } from '@loopback/core';
import { CronJob as BaseCronJob, CronJobParameters } from 'cron';
import { EventEmitter } from 'events';
/**
 * Options for a cron job. It adds an optional `name` to cron parameters.
 *
 * {@link https://github.com/kelektiv/node-cron#api | cron configuration}
 */
export declare type CronJobOptions = CronJobParameters & {
    name?: string;
};
/**
 * Configuration for a cron job.
 */
export declare type CronJobConfig = Partial<CronJobOptions>;
/**
 * Name of the cron job extension point
 */
export declare const CRON_JOB_SCHEDULER = "cron.jobScheduler";
/**
 * A `BindingTemplate` function to configure the binding as a cron job.
 *
 * @param binding - Binding object
 */
export declare function asCronJob<T = unknown>(binding: Binding<T>): Binding<T>;
/**
 * Cron job with an optional name
 */
export declare class CronJob extends BaseCronJob {
    private static count;
    readonly name: string;
    readonly emitter: EventEmitter;
    constructor(options: CronJobOptions);
    onError(listener: (err: unknown) => void): void;
}