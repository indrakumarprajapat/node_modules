"use strict";
// Copyright IBM Corp. 2020. All Rights Reserved.
// Node module: @loopback/cron
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT
Object.defineProperty(exports, "__esModule", { value: true });
exports.cronJob = void 0;
const core_1 = require("@loopback/core");
const types_1 = require("../types");
/**
 * `@cronJob` decorates a cron job provider class
 *
 * @example
 * ```ts
 * @cronJob()
 * class CronJobProvider implements Provider<CronJob> {
 *   constructor(@config() private jobConfig: CronJobConfig = {}) {}
 *   value() {
 *     // ...
 *   }
 * }
 * ```
 * @param specs - Extra binding specs
 */
function cronJob(...specs) {
    return core_1.injectable(types_1.asCronJob, ...specs);
}
exports.cronJob = cronJob;
//# sourceMappingURL=cron-job.decorator.js.map