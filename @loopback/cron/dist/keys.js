"use strict";
// Copyright IBM Corp. 2020. All Rights Reserved.
// Node module: @loopback/cron
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT
Object.defineProperty(exports, "__esModule", { value: true });
exports.CronBindings = void 0;
const core_1 = require("@loopback/core");
/**
 * Binding keys used by this component.
 */
var CronBindings;
(function (CronBindings) {
    /**
     * Binding key for `CronComponent`
     */
    CronBindings.COMPONENT = core_1.BindingKey.create('components.CronComponent');
    /**
     * Namespace for cron jobs
     */
    CronBindings.CRON_JOB_NAMESPACE = 'cron.jobs';
})(CronBindings = exports.CronBindings || (exports.CronBindings = {}));
//# sourceMappingURL=keys.js.map