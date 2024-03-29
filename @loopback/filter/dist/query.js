"use strict";
// Copyright IBM Corp. and LoopBack contributors 2020. All Rights Reserved.
// Node module: @loopback/filter
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT
Object.defineProperty(exports, "__esModule", { value: true });
exports.filterTemplate = exports.FilterBuilder = exports.WhereBuilder = exports.isFilter = void 0;
const tslib_1 = require("tslib");
const assert_1 = tslib_1.__importDefault(require("assert"));
/* eslint-disable @typescript-eslint/no-explicit-any */
const nonWhereFields = [
    'fields',
    'order',
    'limit',
    'skip',
    'offset',
    'include',
];
const filterFields = ['where', ...nonWhereFields];
/**
 * TypeGuard for Filter
 * @param candidate
 */
function isFilter(candidate) {
    if (typeof candidate !== 'object')
        return false;
    for (const key in candidate) {
        if (!filterFields.includes(key)) {
            return false;
        }
    }
    return true;
}
exports.isFilter = isFilter;
/**
 * A builder for Where object. It provides fluent APIs to add clauses such as
 * `and`, `or`, and other operators.
 *
 * @example
 * ```ts
 * const whereBuilder = new WhereBuilder();
 * const where = whereBuilder
 *   .eq('a', 1)
 *   .and({x: 'x'}, {y: {gt: 1}})
 *   .and({b: 'b'}, {c: {lt: 1}})
 *   .or({d: 'd'}, {e: {neq: 1}})
 *   .build();
 * ```
 */
class WhereBuilder {
    constructor(w) {
        this.where = w !== null && w !== void 0 ? w : {};
    }
    add(w) {
        for (const k of Object.keys(w)) {
            if (k in this.where) {
                // Found conflicting keys, create an `and` operator to join the existing
                // conditions with the new one
                const where = { and: [this.where, w] };
                this.where = where;
                return this;
            }
        }
        // Merge the where items
        this.where = Object.assign(this.where, w);
        return this;
    }
    /**
     * @deprecated
     * Starting from TypeScript 3.2, we don't have to cast any more. This method
     * should be considered as `deprecated`.
     *
     * Cast an `and`, `or`, or condition clause to Where
     * @param clause - And/Or/Condition clause
     */
    cast(clause) {
        return clause;
    }
    /**
     * Add an `and` clause.
     * @param w - One or more where objects
     */
    and(...w) {
        let clauses = [];
        w.forEach(where => {
            clauses = clauses.concat(Array.isArray(where) ? where : [where]);
        });
        return this.add({ and: clauses });
    }
    /**
     * Add an `or` clause.
     * @param w - One or more where objects
     */
    or(...w) {
        let clauses = [];
        w.forEach(where => {
            clauses = clauses.concat(Array.isArray(where) ? where : [where]);
        });
        return this.add({ or: clauses });
    }
    /**
     * Add an `=` condition
     * @param key - Property name
     * @param val - Property value
     */
    eq(key, val) {
        const w = {};
        w[key] = val;
        return this.add(w);
    }
    /**
     * Add a `!=` condition
     * @param key - Property name
     * @param val - Property value
     */
    neq(key, val) {
        const w = {};
        w[key] = { neq: val };
        return this.add(w);
    }
    /**
     * Add a `>` condition
     * @param key - Property name
     * @param val - Property value
     */
    gt(key, val) {
        const w = {};
        w[key] = { gt: val };
        return this.add(w);
    }
    /**
     * Add a `>=` condition
     * @param key - Property name
     * @param val - Property value
     */
    gte(key, val) {
        const w = {};
        w[key] = { gte: val };
        return this.add(w);
    }
    /**
     * Add a `<` condition
     * @param key - Property name
     * @param val - Property value
     */
    lt(key, val) {
        const w = {};
        w[key] = { lt: val };
        return this.add(w);
    }
    /**
     * Add a `<=` condition
     * @param key - Property name
     * @param val - Property value
     */
    lte(key, val) {
        const w = {};
        w[key] = { lte: val };
        return this.add(w);
    }
    /**
     * Add a `inq` condition
     * @param key - Property name
     * @param val - An array of property values
     */
    inq(key, val) {
        const w = {};
        w[key] = { inq: val };
        return this.add(w);
    }
    /**
     * Add a `nin` condition
     * @param key - Property name
     * @param val - An array of property values
     */
    nin(key, val) {
        const w = {};
        w[key] = { nin: val };
        return this.add(w);
    }
    /**
     * Add a `between` condition
     * @param key - Property name
     * @param val1 - Property value lower bound
     * @param val2 - Property value upper bound
     */
    between(key, val1, val2) {
        const w = {};
        w[key] = { between: [val1, val2] };
        return this.add(w);
    }
    /**
     * Add a `exists` condition
     * @param key - Property name
     * @param val - Exists or not
     */
    exists(key, val) {
        const w = {};
        w[key] = { exists: !!val || val == null };
        return this.add(w);
    }
    /**
     * Add a where object. For conflicting keys with the existing where object,
     * create an `and` clause.
     * @param where - Where filter
     */
    impose(where) {
        if (!this.where) {
            this.where = where || {};
        }
        else {
            this.add(where);
        }
        return this;
    }
    /**
     * Add a `like` condition
     * @param key - Property name
     * @param val - Regexp condition
     */
    like(key, val) {
        const w = {};
        w[key] = { like: val };
        return this.add(w);
    }
    /**
     * Add a `nlike` condition
     * @param key - Property name
     * @param val - Regexp condition
     */
    nlike(key, val) {
        const w = {};
        w[key] = { nlike: val };
        return this.add(w);
    }
    /**
     * Add a `ilike` condition
     * @param key - Property name
     * @param val - Regexp condition
     */
    ilike(key, val) {
        const w = {};
        w[key] = { ilike: val };
        return this.add(w);
    }
    /**
     * Add a `nilike` condition
     * @param key - Property name
     * @param val - Regexp condition
     */
    nilike(key, val) {
        const w = {};
        w[key] = { nilike: val };
        return this.add(w);
    }
    /**
     * Add a `regexp` condition
     * @param key - Property name
     * @param val - Regexp condition
     */
    regexp(key, val) {
        const w = {};
        w[key] = { regexp: val };
        return this.add(w);
    }
    /**
     * Get the where object
     */
    build() {
        return this.where;
    }
}
exports.WhereBuilder = WhereBuilder;
/**
 * A builder for Filter. It provides fleunt APIs to add clauses such as
 * `fields`, `order`, `where`, `limit`, `offset`, and `include`.
 *
 * @example
 * ```ts
 * const filterBuilder = new FilterBuilder();
 * const filter = filterBuilder
 *   .fields('id', 'a', 'b')
 *   .limit(10)
 *   .offset(0)
 *   .order(['a ASC', 'b DESC'])
 *   .where({id: 1})
 *   .build();
 * ```
 */
class FilterBuilder {
    constructor(f) {
        this.filter = f !== null && f !== void 0 ? f : {};
    }
    /**
     * Set `limit`
     * @param limit - Maximum number of records to be returned
     */
    limit(limit) {
        (0, assert_1.default)(limit >= 1, `Limit ${limit} must a positive number`);
        this.filter.limit = limit;
        return this;
    }
    /**
     * Set `offset`
     * @param offset - Offset of the number of records to be returned
     */
    offset(offset) {
        this.filter.offset = offset;
        return this;
    }
    /**
     * Alias to `offset`
     * @param skip
     */
    skip(skip) {
        return this.offset(skip);
    }
    /**
     * Describe what fields to be included/excluded
     * @param f - A field name to be included, an array of field names to be
     * included, or an Fields object for the inclusion/exclusion
     */
    fields(...f) {
        if (!this.filter.fields) {
            this.filter.fields = {};
        }
        else if (Array.isArray(this.filter.fields)) {
            this.filter.fields = this.filter.fields.reduce((prev, current) => ({ ...prev, [current]: true }), {});
        }
        const fields = this.filter.fields;
        for (const field of f) {
            if (Array.isArray(field)) {
                field.forEach(i => (fields[i] = true));
            }
            else if (typeof field === 'string') {
                fields[field] = true;
            }
            else {
                Object.assign(fields, field);
            }
        }
        return this;
    }
    validateOrder(order) {
        (0, assert_1.default)(order.match(/^[^\s]+( (ASC|DESC))?$/), 'Invalid order: ' + order);
    }
    /**
     * Describe the sorting order
     * @param o - A field name with optional direction, an array of field names,
     * or an Order object for the field/direction pairs
     */
    order(...o) {
        if (!this.filter.order) {
            this.filter.order = [];
        }
        o.forEach(order => {
            if (typeof order === 'string') {
                this.validateOrder(order);
                if (!order.endsWith(' ASC') && !order.endsWith(' DESC')) {
                    order = order + ' ASC';
                }
                this.filter.order.push(order);
                return this;
            }
            if (Array.isArray(order)) {
                order.forEach(this.validateOrder);
                order = order.map(i => {
                    if (!i.endsWith(' ASC') && !i.endsWith(' DESC')) {
                        i = i + ' ASC';
                    }
                    return i;
                });
                this.filter.order = this.filter.order.concat(order);
                return this;
            }
            for (const i in order) {
                this.filter.order.push(`${i} ${order[i]}`);
            }
        });
        return this;
    }
    /**
     * Declare `include`
     * @param i - A relation name, an array of relation names, or an `Inclusion`
     * object for the relation/scope definitions
     */
    include(...i) {
        if (this.filter.include == null) {
            this.filter.include = [];
        }
        for (const include of i) {
            if (typeof include === 'string') {
                this.filter.include.push({ relation: include });
            }
            else if (Array.isArray(include)) {
                for (const inc of include)
                    this.filter.include.push({ relation: inc });
            }
            else {
                this.filter.include.push(include);
            }
        }
        return this;
    }
    /**
     * Declare a where clause
     * @param w - Where object
     */
    where(w) {
        this.filter.where = w;
        return this;
    }
    /**
     * Add a Filter or Where constraint object. If it is a filter object, create
     * an `and` clause for conflicting keys with its where object. For any other
     * properties, throw an error. If it's not a Filter, coerce it to a filter,
     * and carry out the same logic.
     *
     * @param constraint - a constraint object to merge with own filter object
     */
    impose(constraint) {
        if (!this.filter) {
            // if constraint is a Where, turn into a Filter
            if (!isFilter(constraint)) {
                constraint = { where: constraint };
            }
            this.filter = constraint || {};
        }
        else {
            if (isFilter(constraint)) {
                // throw error if imposed Filter has non-where fields
                for (const key of Object.keys(constraint)) {
                    if (nonWhereFields.includes(key)) {
                        throw new Error('merging strategy for selection, pagination, and sorting not implemented');
                    }
                }
            }
            this.filter.where = isFilter(constraint)
                ? new WhereBuilder(this.filter.where).impose(constraint.where).build()
                : new WhereBuilder(this.filter.where).impose(constraint).build();
        }
        return this;
    }
    /**
     * Return the filter object
     */
    build() {
        return this.filter;
    }
}
exports.FilterBuilder = FilterBuilder;
/**
 * Get nested properties by path
 * @param value - Value of an object
 * @param path - Path to the property
 */
function getDeepProperty(value, path) {
    const props = path.split('.');
    for (const p of props) {
        value = value[p];
        if (value == null) {
            return null;
        }
    }
    return value;
}
function filterTemplate(strings, ...keys) {
    return function filter(ctx) {
        const tokens = [strings[0]];
        keys.forEach((key, i) => {
            if (typeof key === 'object' ||
                typeof key === 'boolean' ||
                typeof key === 'number') {
                tokens.push(JSON.stringify(key), strings[i + 1]);
                return;
            }
            const value = getDeepProperty(ctx, key);
            tokens.push(JSON.stringify(value), strings[i + 1]);
        });
        const result = tokens.join('');
        try {
            return JSON.parse(result);
        }
        catch (e) {
            throw new Error('Invalid JSON: ' + result);
        }
    };
}
exports.filterTemplate = filterTemplate;
//# sourceMappingURL=query.js.map