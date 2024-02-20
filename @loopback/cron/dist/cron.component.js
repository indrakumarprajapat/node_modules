"use strict";
// Copyright IBM Corp. 2020. All Rights Reserved.
// Node module: @loopback/cron
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT
Object.defineProperty(exports, "__esModule", { value: true });
exports.CronComponent = void 0;
const tslib_1 = require("tslib");
const core_1 = require("@loopback/core");
const debug_1 = tslib_1.__importDefault(require("debug"));
const keys_1 = require("./keys");
const types_1 = require("./types");
const debug = debug_1.default('loopback:cron');
/**
 * The CronComponent manages cron jobs. It serves as an extension point for
 * cron jobs.
 */
let CronComponent = class CronComponent {
    constructor(getJobs) {
        this.getJobs = getJobs;
    }
    async start() {
        const jobs = await this.getJobs();
        for (const job of jobs) {
            debug('[start] job', job.name);
            if (!job.running) {
                debug('starting job', job.name);
                job.start();
            }
        }
    }
    async stop() {
        const jobs = await this.getJobs();
        for (const job of jobs) {
            debug('[stop] job', job.name);
            if (job.running) {
                debug('stopping job', job.name);
                job.stop();
            }
        }
    }
};
CronComponent = tslib_1.__decorate([
    core_1.extensionPoint(types_1.CRON_JOB_SCHEDULER, {
        tags: { [core_1.ContextTags.KEY]: keys_1.CronBindings.COMPONENT },
        scope: core_1.BindingScope.SINGLETON,
    }),
    tslib_1.__param(0, core_1.extensions()),
    tslib_1.__metadata("design:paramtypes", [Function])
], CronComponent);
exports.CronComponent = CronComponent;
//# sourceMappingURL=cron.component.js.map