"use strict";
exports.id = 450;
exports.ids = [450];
exports.modules = {

/***/ 16932:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.UnsupportedReportCommandError = void 0;
const errors_1 = __webpack_require__(55191);
const error_utils_1 = __webpack_require__(23872);
const types_1 = __webpack_require__(42258);
class UnsupportedReportCommandError extends errors_1.CustomError {
    constructor(message) {
        super(message || 'Command "report" is only supported for IaC');
        this.code = types_1.IaCErrorCodes.UnsupportedReportCommandError;
        this.strCode = error_utils_1.getErrorStringCode(this.code);
        this.userMessage =
            '"report" is not a supported command. Did you mean to use "iac report"?';
    }
}
exports.UnsupportedReportCommandError = UnsupportedReportCommandError;


/***/ }),

/***/ 44450:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
const test_1 = __webpack_require__(86917);
const feature_flags_1 = __webpack_require__(63011);
const errors_1 = __webpack_require__(55191);
const process_command_args_1 = __webpack_require__(52369);
const unsupported_report_command_1 = __webpack_require__(16932);
async function report(...args) {
    const { paths, options } = process_command_args_1.processCommandArgs(...args);
    if (options.iac != true) {
        throw new unsupported_report_command_1.UnsupportedReportCommandError();
    }
    await assertReportSupported(options);
    options.report = true;
    return await test_1.default(...paths, options);
}
exports.default = report;
async function assertReportSupported(options) {
    const isReportSupported = await feature_flags_1.hasFeatureFlag('iacCliShareResults', options);
    if (!isReportSupported) {
        throw new errors_1.UnsupportedFeatureFlagError('iacCliShareResults');
    }
}


/***/ })

};
;
//# sourceMappingURL=450.index.js.map