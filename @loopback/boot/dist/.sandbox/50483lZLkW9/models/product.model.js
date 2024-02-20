"use strict";
// Copyright IBM Corp. 2019. All Rights Reserved.
// Node module: @loopback/boot
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT
Object.defineProperty(exports, "__esModule", { value: true });
exports.Product = void 0;
const tslib_1 = require("tslib");
const repository_1 = require("@loopback/repository");
let Product = class Product extends repository_1.Entity {
};
(0, tslib_1.__decorate)([
    (0, repository_1.property)({ id: true }),
    (0, tslib_1.__metadata)("design:type", Number)
], Product.prototype, "id", void 0);
(0, tslib_1.__decorate)([
    (0, repository_1.property)({ required: true }),
    (0, tslib_1.__metadata)("design:type", String)
], Product.prototype, "name", void 0);
Product = (0, tslib_1.__decorate)([
    (0, repository_1.model)()
], Product);
exports.Product = Product;
//# sourceMappingURL=product.model.js.map
//# sourceMappingURL=/Users/dhmlau/loopback-release/loopback-next/packages/boot/dist/__tests__/fixtures/product.model.js.map