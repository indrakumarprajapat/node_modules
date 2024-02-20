"use strict";
// Copyright IBM Corp. 2020. All Rights Reserved.
// Node module: @loopback/cron
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT
Object.defineProperty(exports, "__esModule", { value: true });
exports.CronJob = exports.asCronJob = exports.CRON_JOB_SCHEDULER = void 0;
const core_1 = require("@loopback/core");
const cron_1 = require("cron");
const events_1 = require("events");
const keys_1 = require("./keys");
/**
 * Name of the cron job extension point
 */
exports.CRON_JOB_SCHEDULER = 'cron.jobScheduler';
/**
 * A `BindingTemplate` function to configure the binding as a cron job.
 *
 * @param binding - Binding object
 */
function asCronJob(binding) {
    return binding
        .apply(core_1.extensionFor(exports.CRON_JOB_SCHEDULER))
        .tag({ namespace: keys_1.CronBindings.CRON_JOB_NAMESPACE })
        .inScope(core_1.BindingScope.SINGLETON);
}
exports.asCronJob = asCronJob;
/**
 * Cron job with an optional name
 */
class CronJob extends cron_1.CronJob {
    constructor(options) {
        super(options);
        this.emitter = new events_1.EventEmitter();
        if (options.name) {
            this.name = options.name;
        }
        else {
            this.name = `job-${++CronJob.count}`;
        }
        // Override `fireOnTick` to catch errors
        this.fireOnTick = () => {
            try {
                return super.fireOnTick();
            }
            catch (err) {
                this.emitter.emit('error', err);
            }
        };
    }
    onError(listener) {
        this.emitter.on('error', listener);
    }
}
exports.CronJob = CronJob;
CronJob.count = 0;
//# sourceMappingURL=types.js.map