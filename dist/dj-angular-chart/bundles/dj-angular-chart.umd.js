(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('@angular/core'), require('dc'), require('d3'), require('d3-cloud'), require('lodash'), require('d3-selection'), require('d3-dispatch'), require('d3-scale-chromatic'), require('d3-time'), require('d3-array'), require('d3-scale'), require('d3-axis'), require('d3-zoom'), require('d3-brush'), require('d3-interpolate'), require('moment'), require('rxjs/internal-compatibility')) :
    typeof define === 'function' && define.amd ? define('dj-angular-chart', ['exports', '@angular/core', 'dc', 'd3', 'd3-cloud', 'lodash', 'd3-selection', 'd3-dispatch', 'd3-scale-chromatic', 'd3-time', 'd3-array', 'd3-scale', 'd3-axis', 'd3-zoom', 'd3-brush', 'd3-interpolate', 'moment', 'rxjs/internal-compatibility'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global['dj-angular-chart'] = {}, global.ng.core, global.dc, global.d3, global._d3Cloud, global._, global.d3Selection, global.d3Dispatch, global.d3ScaleChromatic, global.d3Time, global.d3Array, global.d3Scale, global.d3Axis, global.d3Zoom, global.d3Brush, global.d3Interpolate, global.moment$1, global.rxjs['internal-compatibility']));
}(this, (function (exports, i0, dc, d3, _d3Cloud, _, d3Selection, d3Dispatch, d3ScaleChromatic, d3Time, d3Array, d3Scale, d3Axis, d3Zoom, d3Brush, d3Interpolate, moment$1, internalCompatibility) { 'use strict';

    function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

    function _interopNamespace(e) {
        if (e && e.__esModule) return e;
        var n = Object.create(null);
        if (e) {
            Object.keys(e).forEach(function (k) {
                if (k !== 'default') {
                    var d = Object.getOwnPropertyDescriptor(e, k);
                    Object.defineProperty(n, k, d.get ? d : {
                        enumerable: true,
                        get: function () {
                            return e[k];
                        }
                    });
                }
            });
        }
        n['default'] = e;
        return Object.freeze(n);
    }

    var i0__namespace = /*#__PURE__*/_interopNamespace(i0);
    var dc__namespace = /*#__PURE__*/_interopNamespace(dc);
    var d3__namespace = /*#__PURE__*/_interopNamespace(d3);
    var _d3Cloud__namespace = /*#__PURE__*/_interopNamespace(_d3Cloud);
    var ___namespace = /*#__PURE__*/_interopNamespace(_);
    var moment__default = /*#__PURE__*/_interopDefaultLegacy(moment$1);
    var moment__namespace = /*#__PURE__*/_interopNamespace(moment$1);

    var DjAngularChartService = /** @class */ (function () {
        function DjAngularChartService() {
        }
        return DjAngularChartService;
    }());
    DjAngularChartService.ɵfac = i0__namespace.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "12.1.1", ngImport: i0__namespace, type: DjAngularChartService, deps: [], target: i0__namespace.ɵɵFactoryTarget.Injectable });
    DjAngularChartService.ɵprov = i0__namespace.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "12.1.1", ngImport: i0__namespace, type: DjAngularChartService, providedIn: 'root' });
    i0__namespace.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "12.1.1", ngImport: i0__namespace, type: DjAngularChartService, decorators: [{
                type: i0.Injectable,
                args: [{
                        providedIn: 'root'
                    }]
            }], ctorParameters: function () { return []; } });

    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation.

    Permission to use, copy, modify, and/or distribute this software for any
    purpose with or without fee is hereby granted.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
    REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
    AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
    INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
    LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
    OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
    PERFORMANCE OF THIS SOFTWARE.
    ***************************************************************************** */
    /* global Reflect, Promise */
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b)
                if (Object.prototype.hasOwnProperty.call(b, p))
                    d[p] = b[p]; };
        return extendStatics(d, b);
    };
    function __extends(d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    }
    var __assign = function () {
        __assign = Object.assign || function __assign(t) {
            for (var s, i = 1, n = arguments.length; i < n; i++) {
                s = arguments[i];
                for (var p in s)
                    if (Object.prototype.hasOwnProperty.call(s, p))
                        t[p] = s[p];
            }
            return t;
        };
        return __assign.apply(this, arguments);
    };
    function __rest(s, e) {
        var t = {};
        for (var p in s)
            if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
                t[p] = s[p];
        if (s != null && typeof Object.getOwnPropertySymbols === "function")
            for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
                if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                    t[p[i]] = s[p[i]];
            }
        return t;
    }
    function __decorate(decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function")
            r = Reflect.decorate(decorators, target, key, desc);
        else
            for (var i = decorators.length - 1; i >= 0; i--)
                if (d = decorators[i])
                    r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    }
    function __param(paramIndex, decorator) {
        return function (target, key) { decorator(target, key, paramIndex); };
    }
    function __metadata(metadataKey, metadataValue) {
        if (typeof Reflect === "object" && typeof Reflect.metadata === "function")
            return Reflect.metadata(metadataKey, metadataValue);
    }
    function __awaiter(thisArg, _arguments, P, generator) {
        function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try {
                step(generator.next(value));
            }
            catch (e) {
                reject(e);
            } }
            function rejected(value) { try {
                step(generator["throw"](value));
            }
            catch (e) {
                reject(e);
            } }
            function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    }
    function __generator(thisArg, body) {
        var _ = { label: 0, sent: function () { if (t[0] & 1)
                throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
        return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function () { return this; }), g;
        function verb(n) { return function (v) { return step([n, v]); }; }
        function step(op) {
            if (f)
                throw new TypeError("Generator is already executing.");
            while (_)
                try {
                    if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done)
                        return t;
                    if (y = 0, t)
                        op = [op[0] & 2, t.value];
                    switch (op[0]) {
                        case 0:
                        case 1:
                            t = op;
                            break;
                        case 4:
                            _.label++;
                            return { value: op[1], done: false };
                        case 5:
                            _.label++;
                            y = op[1];
                            op = [0];
                            continue;
                        case 7:
                            op = _.ops.pop();
                            _.trys.pop();
                            continue;
                        default:
                            if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) {
                                _ = 0;
                                continue;
                            }
                            if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) {
                                _.label = op[1];
                                break;
                            }
                            if (op[0] === 6 && _.label < t[1]) {
                                _.label = t[1];
                                t = op;
                                break;
                            }
                            if (t && _.label < t[2]) {
                                _.label = t[2];
                                _.ops.push(op);
                                break;
                            }
                            if (t[2])
                                _.ops.pop();
                            _.trys.pop();
                            continue;
                    }
                    op = body.call(thisArg, _);
                }
                catch (e) {
                    op = [6, e];
                    y = 0;
                }
                finally {
                    f = t = 0;
                }
            if (op[0] & 5)
                throw op[1];
            return { value: op[0] ? op[1] : void 0, done: true };
        }
    }
    var __createBinding = Object.create ? (function (o, m, k, k2) {
        if (k2 === undefined)
            k2 = k;
        Object.defineProperty(o, k2, { enumerable: true, get: function () { return m[k]; } });
    }) : (function (o, m, k, k2) {
        if (k2 === undefined)
            k2 = k;
        o[k2] = m[k];
    });
    function __exportStar(m, o) {
        for (var p in m)
            if (p !== "default" && !Object.prototype.hasOwnProperty.call(o, p))
                __createBinding(o, m, p);
    }
    function __values(o) {
        var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
        if (m)
            return m.call(o);
        if (o && typeof o.length === "number")
            return {
                next: function () {
                    if (o && i >= o.length)
                        o = void 0;
                    return { value: o && o[i++], done: !o };
                }
            };
        throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
    }
    function __read(o, n) {
        var m = typeof Symbol === "function" && o[Symbol.iterator];
        if (!m)
            return o;
        var i = m.call(o), r, ar = [], e;
        try {
            while ((n === void 0 || n-- > 0) && !(r = i.next()).done)
                ar.push(r.value);
        }
        catch (error) {
            e = { error: error };
        }
        finally {
            try {
                if (r && !r.done && (m = i["return"]))
                    m.call(i);
            }
            finally {
                if (e)
                    throw e.error;
            }
        }
        return ar;
    }
    /** @deprecated */
    function __spread() {
        for (var ar = [], i = 0; i < arguments.length; i++)
            ar = ar.concat(__read(arguments[i]));
        return ar;
    }
    /** @deprecated */
    function __spreadArrays() {
        for (var s = 0, i = 0, il = arguments.length; i < il; i++)
            s += arguments[i].length;
        for (var r = Array(s), k = 0, i = 0; i < il; i++)
            for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
                r[k] = a[j];
        return r;
    }
    function __spreadArray(to, from, pack) {
        if (pack || arguments.length === 2)
            for (var i = 0, l = from.length, ar; i < l; i++) {
                if (ar || !(i in from)) {
                    if (!ar)
                        ar = Array.prototype.slice.call(from, 0, i);
                    ar[i] = from[i];
                }
            }
        return to.concat(ar || from);
    }
    function __await(v) {
        return this instanceof __await ? (this.v = v, this) : new __await(v);
    }
    function __asyncGenerator(thisArg, _arguments, generator) {
        if (!Symbol.asyncIterator)
            throw new TypeError("Symbol.asyncIterator is not defined.");
        var g = generator.apply(thisArg, _arguments || []), i, q = [];
        return i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i;
        function verb(n) { if (g[n])
            i[n] = function (v) { return new Promise(function (a, b) { q.push([n, v, a, b]) > 1 || resume(n, v); }); }; }
        function resume(n, v) { try {
            step(g[n](v));
        }
        catch (e) {
            settle(q[0][3], e);
        } }
        function step(r) { r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r); }
        function fulfill(value) { resume("next", value); }
        function reject(value) { resume("throw", value); }
        function settle(f, v) { if (f(v), q.shift(), q.length)
            resume(q[0][0], q[0][1]); }
    }
    function __asyncDelegator(o) {
        var i, p;
        return i = {}, verb("next"), verb("throw", function (e) { throw e; }), verb("return"), i[Symbol.iterator] = function () { return this; }, i;
        function verb(n, f) { i[n] = o[n] ? function (v) { return (p = !p) ? { value: __await(o[n](v)), done: n === "return" } : f ? f(v) : v; } : f; }
    }
    function __asyncValues(o) {
        if (!Symbol.asyncIterator)
            throw new TypeError("Symbol.asyncIterator is not defined.");
        var m = o[Symbol.asyncIterator], i;
        return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
        function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
        function settle(resolve, reject, d, v) { Promise.resolve(v).then(function (v) { resolve({ value: v, done: d }); }, reject); }
    }
    function __makeTemplateObject(cooked, raw) {
        if (Object.defineProperty) {
            Object.defineProperty(cooked, "raw", { value: raw });
        }
        else {
            cooked.raw = raw;
        }
        return cooked;
    }
    ;
    var __setModuleDefault = Object.create ? (function (o, v) {
        Object.defineProperty(o, "default", { enumerable: true, value: v });
    }) : function (o, v) {
        o["default"] = v;
    };
    function __importStar(mod) {
        if (mod && mod.__esModule)
            return mod;
        var result = {};
        if (mod != null)
            for (var k in mod)
                if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k))
                    __createBinding(result, mod, k);
        __setModuleDefault(result, mod);
        return result;
    }
    function __importDefault(mod) {
        return (mod && mod.__esModule) ? mod : { default: mod };
    }
    function __classPrivateFieldGet(receiver, state, kind, f) {
        if (kind === "a" && !f)
            throw new TypeError("Private accessor was defined without a getter");
        if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver))
            throw new TypeError("Cannot read private member from an object whose class did not declare it");
        return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
    }
    function __classPrivateFieldSet(receiver, state, value, kind, f) {
        if (kind === "m")
            throw new TypeError("Private method is not writable");
        if (kind === "a" && !f)
            throw new TypeError("Private accessor was defined without a setter");
        if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver))
            throw new TypeError("Cannot write private member to an object whose class did not declare it");
        return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
    }

    var DcChart = /** @class */ (function () {
        function DcChart() {
            var _this = this;
            Object.keys(dc__namespace).forEach(function (key) {
                // @ts-ignore
                _this[key] = dc__namespace[key];
            });
        }
        return DcChart;
    }());

    var InvalidStateException = /** @class */ (function (_super) {
        __extends(InvalidStateException, _super);
        function InvalidStateException() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        return InvalidStateException;
    }(Error));
    var BadArgumentException = /** @class */ (function (_super) {
        __extends(BadArgumentException, _super);
        function BadArgumentException() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        return BadArgumentException;
    }(Error));
    var constants$2 = {
        CHART_CLASS: 'dc-chart',
        DEBUG_GROUP_CLASS: 'debug',
        STACK_CLASS: 'stack',
        DESELECTED_CLASS: 'deselected',
        SELECTED_CLASS: 'selected',
        NODE_INDEX_NAME: '__index__',
        GROUP_INDEX_NAME: '__group_index__',
        DEFAULT_CHART_GROUP: '__default_chart_group__',
        EVENT_DELAY: 40,
        NEGLIGIBLE_NUMBER: 1e-10
    };
    var _defaultFilterHandler = function (dimension, filters) {
        if (filters.length === 0) {
            dimension.filter(null);
        }
        else if (filters.length === 1 && !filters[0].isFiltered) {
            // single value and not a function-based filter
            dimension.filterExact(filters[0]);
        }
        else if (filters.length === 1 && filters[0].filterType === 'RangedFilter') {
            // single range-based filter
            dimension.filterRange(filters[0]);
        }
        else {
            dimension.filterFunction(function (d) {
                for (var i = 0; i < filters.length; i++) {
                    var filter = filters[i];
                    if (filter.isFiltered) {
                        if (filter.isFiltered(d)) {
                            return true;
                        }
                    }
                    else if (filter <= d && filter >= d) {
                        return true;
                    }
                }
                return false;
            });
        }
        return filters;
    };
    var _defaultHasFilterHandler = function (filters, filter) {
        if (filter === null || typeof (filter) === 'undefined') {
            return filters.length > 0;
        }
        return filters.some(function (f) { return filter <= f && filter >= f; });
    };
    var _defaultRemoveFilterHandler = function (filters, filter) {
        for (var i = 0; i < filters.length; i++) {
            if (filters[i] <= filter && filters[i] >= filter) {
                filters.splice(i, 1);
                break;
            }
        }
        return filters;
    };
    var _defaultAddFilterHandler = function (filters, filter) {
        filters.push(filter);
        return filters;
    };
    var _defaultResetFilterHandler = function (filters) { return []; };
    var BaseMixin = /** @class */ (function () {
        function BaseMixin() {
            var _this = this;
            this._filterHandler = _defaultFilterHandler;
            this._hasFilterHandler = _defaultHasFilterHandler;
            this._removeFilterHandler = _defaultRemoveFilterHandler;
            this._addFilterHandler = _defaultAddFilterHandler;
            this._resetFilterHandler = _defaultResetFilterHandler;
            this.__dcFlag__ = dc.utils.uniqueId();
            this._dimension = undefined;
            this._group = undefined;
            this._anchor = undefined;
            this._root = undefined;
            this._svg = undefined;
            this._isChild = undefined;
            this._minWidth = 100;
            this._defaultWidthCalc = function (element) {
                var width = element && element.getBoundingClientRect && element.getBoundingClientRect().width;
                return (width && width > _this._minWidth) ? width : _this._minWidth;
            };
            this._widthCalc = this._defaultWidthCalc;
            this._minHeight = 100;
            this._defaultHeightCalc = function (element) {
                var height = element && element.getBoundingClientRect && element.getBoundingClientRect().height;
                return (height && height > _this._minHeight) ? height : _this._minHeight;
            };
            this._heightCalc = this._defaultHeightCalc;
            this._useViewBoxResizing = false;
            this._keyAccessor = dc.pluck('key');
            this._valueAccessor = dc.pluck('value');
            this._label = dc.pluck('key');
            this._ordering = dc.pluck('key');
            this._renderLabel = false;
            // @ts-ignore
            this._title = function (d) { return _this.keyAccessor()(d) + ": " + _this.valueAccessor()(d); };
            this._renderTitle = true;
            this._controlsUseVisibility = false;
            this._transitionDuration = 750;
            this._transitionDelay = 0;
            this._filterPrinter = dc.printers.filters;
            this._mandatoryAttributesList = ['dimension', 'group'];
            this._chartGroup = constants$2.DEFAULT_CHART_GROUP;
            this._listeners = d3Dispatch.dispatch('preRender', 'postRender', 'preRedraw', 'postRedraw', 'filtered', 'zoomed', 'renderlet', 'pretransition');
            this._legend = undefined;
            this._commitHandler = undefined;
            this._defaultData = function (group) { return group.all(); };
            this._data = this._defaultData;
            this._filters = [];
        }
        BaseMixin.prototype.height = function (height) {
            if (height === undefined) {
                if (!dc.utils.isNumber(this._height)) {
                    // only calculate once
                    this._height = this._heightCalc(this._root.node());
                }
                return this._height;
            }
            this._heightCalc = height ? (typeof height === 'function' ? height : dc.utils.constant(height)) : this._defaultHeightCalc;
            this._height = undefined;
            return this;
        };
        BaseMixin.prototype.width = function (width) {
            if (width === undefined) {
                if (!dc.utils.isNumber(this._width)) {
                    // only calculate once
                    this._width = this._widthCalc(this._root.node());
                }
                return this._width;
            }
            this._widthCalc = width ? (typeof width === 'function' ? width : dc.utils.constant(width)) : this._defaultWidthCalc;
            this._width = undefined;
            return this;
        };
        BaseMixin.prototype.minWidth = function (minWidth) {
            if (minWidth === undefined) {
                return this._minWidth;
            }
            this._minWidth = minWidth;
            return this;
        };
        BaseMixin.prototype.minHeight = function (minHeight) {
            if (minHeight === undefined) {
                return this._minHeight;
            }
            this._minHeight = minHeight;
            return this;
        };
        BaseMixin.prototype.useViewBoxResizing = function (useViewBoxResizing) {
            if (useViewBoxResizing === undefined) {
                return this._useViewBoxResizing;
            }
            this._useViewBoxResizing = useViewBoxResizing;
            return this;
        };
        BaseMixin.prototype.dimension = function (dimension) {
            if (dimension === undefined) {
                return this._dimension;
            }
            this._dimension = dimension;
            this.expireCache();
            return this;
        };
        BaseMixin.prototype.data = function (callback) {
            if (callback === undefined) {
                return this._data(this._group);
            }
            this._data = typeof callback === 'function' ? callback : dc.utils.constant(callback);
            this.expireCache();
            return this;
        };
        BaseMixin.prototype.group = function (group, name) {
            if (group === undefined) {
                return this._group;
            }
            this._group = group;
            this._groupName = name;
            this.expireCache();
            return this;
        };
        BaseMixin.prototype.ordering = function (orderFunction) {
            if (orderFunction === undefined) {
                return this._ordering;
            }
            this._ordering = orderFunction;
            this.expireCache();
            return this;
        };
        BaseMixin.prototype._computeOrderedGroups = function (data) {
            var _this = this;
            // clone the array before sorting, otherwise Array.sort sorts in-place
            return Array.from(data).sort(function (a, b) { return _this._ordering(a) - _this._ordering(b); });
        };
        BaseMixin.prototype.filterAll = function () {
            return this.filter(null);
        };
        BaseMixin.prototype.select = function (sel) {
            return this._root.select(sel);
        };
        BaseMixin.prototype.selectAll = function (sel) {
            return this._root ? this._root.selectAll(sel) : null;
        };
        BaseMixin.prototype.anchor = function (parent, chartGroup) {
            if (parent === undefined) {
                return this._anchor;
            }
            if (dc.instanceOfChart(parent)) {
                this._anchor = parent.anchor();
                // @ts-ignore
                if (this._anchor.children) { // is _anchor a div?
                    this._anchor = "#" + parent.anchorName();
                }
                this._root = parent.root();
                this._isChild = true;
            }
            else if (parent) {
                if (parent.select && parent.classed) { // detect d3 selection
                    this._anchor = parent.node();
                }
                else {
                    this._anchor = parent;
                }
                // @ts-ignore
                this._root = d3Selection.select(this._anchor);
                this._root.classed(constants$2.CHART_CLASS, true);
                // @ts-ignore
                dc.registerChart(this, chartGroup);
                this._isChild = false;
            }
            else {
                throw new BadArgumentException('parent must be defined');
            }
            this._chartGroup = chartGroup;
            return this;
        };
        BaseMixin.prototype.anchorName = function () {
            var a = this.anchor();
            if (a && a.id) {
                return a.id;
            }
            if (a && a.replace) {
                return a.replace('#', '');
            }
            return "dc-chart" + this.chartID();
        };
        BaseMixin.prototype.root = function (rootElement) {
            if (rootElement === undefined) {
                return this._root;
            }
            this._root = rootElement;
            return this;
        };
        BaseMixin.prototype.svg = function (svgElement) {
            if (svgElement === undefined) {
                return this._svg;
            }
            this._svg = svgElement;
            return this;
        };
        BaseMixin.prototype.resetSvg = function () {
            this.select('svg').remove();
            return this.generateSvg();
        };
        BaseMixin.prototype.sizeSvg = function () {
            if (this._svg) {
                if (!this._useViewBoxResizing) {
                    this._svg
                        .attr('width', this.width())
                        .attr('height', this.height());
                }
                else if (!this._svg.attr('viewBox')) {
                    this._svg
                        .attr('viewBox', "0 0 " + this.width() + " " + this.height());
                }
            }
        };
        BaseMixin.prototype.generateSvg = function () {
            this._svg = this.root().append('svg');
            this.sizeSvg();
            return this._svg;
        };
        BaseMixin.prototype.filterPrinter = function (filterPrinterFunction) {
            if (filterPrinterFunction === undefined) {
                return this._filterPrinter;
            }
            this._filterPrinter = filterPrinterFunction;
            return this;
        };
        BaseMixin.prototype.controlsUseVisibility = function (controlsUseVisibility) {
            if (controlsUseVisibility === undefined) {
                return this._controlsUseVisibility;
            }
            this._controlsUseVisibility = controlsUseVisibility;
            return this;
        };
        BaseMixin.prototype.turnOnControls = function () {
            if (this._root) {
                var attribute = this.controlsUseVisibility() ? 'visibility' : 'display';
                this.selectAll('.reset').style(attribute, null);
                this.selectAll('.filter').text(this._filterPrinter(this.filters())).style(attribute, null);
            }
            return this;
        };
        BaseMixin.prototype.turnOffControls = function () {
            if (this._root) {
                var attribute = this.controlsUseVisibility() ? 'visibility' : 'display';
                var value = this.controlsUseVisibility() ? 'hidden' : 'none';
                this.selectAll('.reset').style(attribute, value);
                this.selectAll('.filter').style(attribute, value).text(this.filter());
            }
            return this;
        };
        BaseMixin.prototype.transitionDuration = function (duration) {
            if (duration === undefined) {
                return this._transitionDuration;
            }
            this._transitionDuration = duration;
            return this;
        };
        BaseMixin.prototype.transitionDelay = function (delay) {
            if (delay === undefined) {
                return this._transitionDelay;
            }
            this._transitionDelay = delay;
            return this;
        };
        BaseMixin.prototype._mandatoryAttributes = function (_) {
            if (_ === undefined) {
                return this._mandatoryAttributesList;
            }
            this._mandatoryAttributesList = _;
            return this;
        };
        BaseMixin.prototype.checkForMandatoryAttributes = function (a) {
            // @ts-ignore
            if (!this[a] || !this[a]()) {
                throw new InvalidStateException("Mandatory attribute chart." + a + " is missing on chart[#" + this.anchorName() + "]");
            }
        };
        BaseMixin.prototype.render = function () {
            var _this = this;
            this._height = this._width = undefined; // force recalculate
            this._listeners.call('preRender', this, this);
            if (this._mandatoryAttributesList) {
                this._mandatoryAttributesList.forEach(function (e) { return _this.checkForMandatoryAttributes(e); });
            }
            var result = this._doRender();
            if (this._legend) {
                this._legend.render();
            }
            this._activateRenderlets('postRender');
            return result;
        };
        BaseMixin.prototype._activateRenderlets = function (event) {
            var _this = this;
            this._listeners.call('pretransition', this, this);
            if (this.transitionDuration() > 0 && this._svg) {
                this._svg.transition().duration(this.transitionDuration()).delay(this.transitionDelay())
                    .on('end', function () {
                    _this._listeners.call('renderlet', _this, _this);
                    if (event) {
                        _this._listeners.call(event, _this, _this);
                    }
                });
            }
            else {
                this._listeners.call('renderlet', this, this);
                if (event) {
                    this._listeners.call(event, this, this);
                }
            }
        };
        BaseMixin.prototype.redraw = function () {
            this.sizeSvg();
            this._listeners.call('preRedraw', this, this);
            var result = this._doRedraw();
            if (this._legend) {
                this._legend.render();
            }
            this._activateRenderlets('postRedraw');
            return result;
        };
        BaseMixin.prototype.commitHandler = function (commitHandler) {
            if (commitHandler === undefined) {
                return this._commitHandler;
            }
            this._commitHandler = commitHandler;
            return this;
        };
        BaseMixin.prototype.redrawGroup = function () {
            var _this = this;
            if (this._commitHandler) {
                this._commitHandler(false, function (error, result) {
                    if (error) {
                        console.log(error);
                    }
                    else {
                        // @ts-ignore
                        dc.redrawAll(_this.chartGroup());
                    }
                });
            }
            else {
                // @ts-ignore
                dc.redrawAll(this.chartGroup());
            }
            return this;
        };
        BaseMixin.prototype.renderGroup = function () {
            var _this = this;
            if (this._commitHandler) {
                this._commitHandler(false, function (error, result) {
                    if (error) {
                        console.log(error);
                    }
                    else {
                        // @ts-ignore
                        dc.renderAll(_this.chartGroup());
                    }
                });
            }
            else {
                // @ts-ignore
                dc.renderAll(this.chartGroup());
            }
            return this;
        };
        BaseMixin.prototype._invokeFilteredListener = function (f) {
            if (f !== undefined) {
                this._listeners.call('filtered', this, this, f);
            }
        };
        BaseMixin.prototype._invokeZoomedListener = function () {
            this._listeners.call('zoomed', this, this);
        };
        BaseMixin.prototype.hasFilterHandler = function (hasFilterHandler) {
            if (hasFilterHandler === undefined) {
                return this._hasFilterHandler;
            }
            this._hasFilterHandler = hasFilterHandler;
            return this;
        };
        BaseMixin.prototype.hasFilter = function (filter) {
            return this._hasFilterHandler(this._filters, filter);
        };
        BaseMixin.prototype.removeFilterHandler = function (removeFilterHandler) {
            if (removeFilterHandler === undefined) {
                return this._removeFilterHandler;
            }
            this._removeFilterHandler = removeFilterHandler;
            return this;
        };
        BaseMixin.prototype.addFilterHandler = function (addFilterHandler) {
            if (!arguments.length) {
                return this._addFilterHandler;
            }
            this._addFilterHandler = addFilterHandler;
            return this;
        };
        BaseMixin.prototype.resetFilterHandler = function (resetFilterHandler) {
            if (!arguments.length) {
                return this._resetFilterHandler;
            }
            this._resetFilterHandler = resetFilterHandler;
            return this;
        };
        BaseMixin.prototype.applyFilters = function (filters) {
            // @ts-ignore
            if (this.dimension() && this.dimension().filter) {
                var fs = this._filterHandler(this.dimension(), filters);
                if (fs) {
                    filters = fs;
                }
            }
            return filters;
        };
        BaseMixin.prototype.replaceFilter = function (filter) {
            this._filters = this._resetFilterHandler(this._filters);
            this.filter(filter);
            return this;
        };
        BaseMixin.prototype.filter = function (filter) {
            var _this = this;
            if (filter === undefined) {
                return this._filters.length > 0 ? this._filters[0] : null;
            }
            var filters = this._filters;
            // @ts-ignore
            if (filter instanceof Array && filter[0] instanceof Array && !filter['isFiltered']) {
                // toggle each filter
                filter[0].forEach(function (f) {
                    if (_this._hasFilterHandler(filters, f)) {
                        filters = _this._removeFilterHandler(filters, f);
                    }
                    else {
                        filters = _this._addFilterHandler(filters, f);
                    }
                });
            }
            else if (filter === null) {
                filters = this._resetFilterHandler(filters);
            }
            else {
                if (this._hasFilterHandler(filters, filter)) {
                    filters = this._removeFilterHandler(filters, filter);
                }
                else {
                    filters = this._addFilterHandler(filters, filter);
                }
            }
            this._filters = this.applyFilters(filters);
            this._invokeFilteredListener(filter);
            if (this._root !== null && this.hasFilter()) {
                this.turnOnControls();
            }
            else {
                this.turnOffControls();
            }
            return this;
        };
        BaseMixin.prototype.filters = function () {
            return this._filters;
        };
        BaseMixin.prototype.highlightSelected = function (e) {
            d3Selection.select(e).classed(constants$2.SELECTED_CLASS, true);
            d3Selection.select(e).classed(constants$2.DESELECTED_CLASS, false);
        };
        BaseMixin.prototype.fadeDeselected = function (e) {
            d3Selection.select(e).classed(constants$2.SELECTED_CLASS, false);
            d3Selection.select(e).classed(constants$2.DESELECTED_CLASS, true);
        };
        BaseMixin.prototype.resetHighlight = function (e) {
            d3Selection.select(e).classed(constants$2.SELECTED_CLASS, false);
            d3Selection.select(e).classed(constants$2.DESELECTED_CLASS, false);
        };
        BaseMixin.prototype.onClick = function (datum, i) {
            var _this = this;
            // @ts-ignore
            var filter = this.keyAccessor()(datum);
            dc.events.trigger(function () {
                _this.filter(filter);
                _this.redrawGroup();
            });
        };
        BaseMixin.prototype.filterHandler = function (filterHandler) {
            if (!arguments.length) {
                return this._filterHandler;
            }
            this._filterHandler = filterHandler;
            return this;
        };
        // abstract function stub
        BaseMixin.prototype._doRender = function () {
            // do nothing in base, should be overridden by sub-function
            return this;
        };
        BaseMixin.prototype._doRedraw = function () {
            // do nothing in base, should be overridden by sub-function
            return this;
        };
        BaseMixin.prototype.legendables = function () {
            // do nothing in base, should be overridden by sub-function
            return [];
        };
        BaseMixin.prototype.legendHighlight = function () {
            // do nothing in base, should be overridden by sub-function
        };
        BaseMixin.prototype.legendReset = function () {
            // do nothing in base, should be overridden by sub-function
        };
        BaseMixin.prototype.legendToggle = function () {
            // do nothing in base, should be overriden by sub-function
        };
        BaseMixin.prototype.isLegendableHidden = function () {
            // do nothing in base, should be overridden by sub-function
            return false;
        };
        BaseMixin.prototype.keyAccessor = function (keyAccessor) {
            if (keyAccessor === undefined) {
                return this._keyAccessor;
            }
            this._keyAccessor = keyAccessor;
            return this;
        };
        BaseMixin.prototype.valueAccessor = function (valueAccessor) {
            if (valueAccessor === undefined) {
                return this._valueAccessor;
            }
            this._valueAccessor = valueAccessor;
            return this;
        };
        BaseMixin.prototype.label = function (labelFunction, enableLabels) {
            if (!arguments.length) {
                return this._label;
            }
            this._label = labelFunction;
            if ((enableLabels === undefined) || enableLabels) {
                this._renderLabel = true;
            }
            return this;
        };
        BaseMixin.prototype.renderLabel = function (renderLabel) {
            if (!arguments.length) {
                return this._renderLabel;
            }
            this._renderLabel = renderLabel;
            return this;
        };
        BaseMixin.prototype.title = function (titleFunction) {
            if (!arguments.length) {
                return this._title;
            }
            this._title = titleFunction;
            return this;
        };
        BaseMixin.prototype.renderTitle = function (renderTitle) {
            if (!arguments.length) {
                return this._renderTitle;
            }
            this._renderTitle = renderTitle;
            return this;
        };
        BaseMixin.prototype.chartGroup = function (chartGroup) {
            if (chartGroup === undefined) {
                return this._chartGroup;
            }
            if (!this._isChild) {
                // @ts-ignore
                dc.deregisterChart(this, this._chartGroup);
            }
            this._chartGroup = chartGroup;
            if (!this._isChild) {
                // @ts-ignore
                dc.registerChart(this, this._chartGroup);
            }
            return this;
        };
        BaseMixin.prototype.expireCache = function () {
            // do nothing in base, should be overridden by sub-function
            return this;
        };
        BaseMixin.prototype.legend = function (legend) {
            if (legend === undefined) {
                return this._legend;
            }
            this._legend = legend;
            this._legend.parent(this);
            return this;
        };
        BaseMixin.prototype.chartID = function () {
            return this.__dcFlag__;
        };
        BaseMixin.prototype.options = function (opts) {
            var applyOptions = [
                'anchor',
                'group',
                'xAxisLabel',
                'yAxisLabel',
                'stack',
                'title',
                'point',
                'getColor',
                'overlayGeoJson'
            ];
            for (var o in opts) {
                // @ts-ignore
                if (typeof (this[o]) === 'function') {
                    if (opts[o] instanceof Array && applyOptions.indexOf(o) !== -1) {
                        // @ts-ignore
                        this[o].apply(this, opts[o]);
                    }
                    else {
                        // @ts-ignore
                        this[o].call(this, opts[o]);
                    }
                }
                else {
                    dc.logger.debug("Not a valid option setter name: " + o);
                }
            }
            return this;
        };
        BaseMixin.prototype.on = function (event, listener) {
            this._listeners.on(event, listener);
            return this;
        };
        BaseMixin.prototype.renderlet = function (renderletFunction) {
            dc.logger.warnOnce('chart.renderlet has been deprecated. Please use chart.on("renderlet.<renderletKey>", renderletFunction)');
            this.on("renderlet." + dc.utils.uniqueId(), renderletFunction);
            return this;
        };
        return BaseMixin;
    }());

    var d3Cloud = _d3Cloud__namespace;
    var CloudChart = /** @class */ (function (_super) {
        __extends(CloudChart, _super);
        function CloudChart(element, option) {
            var _this = _super.call(this) || this;
            _this.element = element;
            _this.option = option;
            _this._scale = [15, 70];
            _this._color = d3__namespace.schemeCategory10;
            _this._padding = 2;
            _this._width = 100;
            _this._height = 100;
            return _this;
        }
        CloudChart.prototype.render = function () {
            if (this.svg()) {
                // @ts-ignore
                this.svg().remove();
            }
            this.chartRender();
            return this;
        };
        CloudChart.prototype.redraw = function () {
            this.render();
            return this;
        };
        CloudChart.prototype.width = function (width) {
            if (!width) {
                this._width = this.option.width ? this.option.width : this.element.clientWidth;
                return this._width;
            }
            this._width = width;
            return this;
        };
        CloudChart.prototype.height = function (height) {
            if (!height) {
                this._height = this.option.height ? this.option.height : this.element.clientHeight;
                return this._height;
            }
            this._height = height;
            return this;
        };
        CloudChart.prototype.legends = function (object) {
            if (!object) {
                return this._legends;
            }
            this._legends = object;
            return this;
        };
        CloudChart.prototype.padding = function (padding) {
            if (!padding) {
                return this._padding;
            }
            this._padding = padding;
            return this;
        };
        CloudChart.prototype.color = function (color) {
            if (!color) {
                return this._customColor ? this._customColor : this._color;
            }
            this._customColor = color;
            return this;
        };
        CloudChart.prototype.dimension = function (dimension) {
            if (!dimension) {
                return this._dimension;
            }
            this._dimension = dimension;
            return this;
        };
        CloudChart.prototype.group = function (object) {
            if (!object) {
                return this._group;
            }
            this._group = object;
            return this;
        };
        CloudChart.prototype.chartRender = function () {
            var _this = this;
            // @ts-ignore
            var data = this._group.all();
            var fontScale = d3__namespace.scaleLinear().range(this._scale);
            var domain = [d3__namespace.min(data, function (d) { return d.value; }), d3__namespace.max(data, function (d) { return d.value; })];
            // @ts-ignore
            fontScale.domain(domain);
            // @ts-ignore
            d3Cloud()
                .size([this._width, this._height])
                .words(data)
                .padding(this._padding)
                .rotate(0)
                .font('sans-serif')
                .text(function (d) {
                var key = d.key || d.keys;
                key = typeof key === 'string' ? key : key[0];
                if (_this._legends && _this._legends[key]) {
                    key = _this._legends[key];
                }
                return key;
            })
                .fontSize(function (d) { return fontScale(d.value); })
                .on('end', this.draw.bind(this))
                .start();
        };
        CloudChart.prototype.svg = function () {
            // @ts-ignore
            if (!d3__namespace.select(this.element).select('svg')._groups[0][0]) {
                return;
            }
            return d3__namespace.select(this.element).select('svg');
        };
        CloudChart.prototype.draw = function (words) {
            var _this = this;
            var cloud = d3__namespace.select(this.element).append('svg')
                .attr('class', 'wise-chart-cloud')
                .attr('width', this._width)
                .attr('height', this._height)
                .append('g')
                .attr('transform', 'translate(' + this._width / 2 + ',' + this._height / 2 + ')')
                .selectAll('text')
                .data(words)
                .enter().append('text')
                .style('font-size', function (d) { return d.size + 'px'; })
                .style('font-family', 'sans-serif')
                .style('fill', function (d, i) {
                return _this._customColor ? _this._customColor[d.key[0]] : _this._color[i % _this._color.length];
            })
                .style('opacity', function (d, i) {
                if (_this['filters']().length) {
                    var filters = _this['filters']().map(function (dd) { return dd.toString(); });
                    if (___namespace.includes(filters, d.key.toString())) {
                        return 1;
                    }
                    else {
                        return .1;
                    }
                }
                else {
                    return null;
                }
            })
                .attr('text-anchor', 'middle')
                .attr('transform', function (d) { return 'translate(' + [d.x, d.y] + ')rotate(' + d.rotate + ')'; })
                .text(function (d) { return d.text; });
            // @ts-ignore
            cloud.on('click', function (d, i) {
                var key = d.key, value = d.value;
                _this['onClick']({ key: key, value: value }, i);
            });
            if (this.option && this.option.tooltip) {
                var tooltip_1 = this.getTooltipElem();
                cloud
                    .on('mouseover', function (data) {
                    // @ts-ignore
                    var screenX = event.view.innerWidth;
                    // @ts-ignore
                    var screenY = event.view.innerHeight;
                    // @ts-ignore
                    var pageX = event.pageX;
                    // @ts-ignore
                    var pageY = event.pageY;
                    var toolX = tooltip_1.node().clientWidth;
                    var toolY = tooltip_1.node().clientHeight;
                    var left = 0, top = 0;
                    tooltip_1.transition()
                        .duration(200)
                        .style('opacity', .9);
                    tooltip_1.html(_this.option.tooltip(data));
                    setTimeout(function () {
                        if ((screenX - pageX) < tooltip_1.node().clientWidth) {
                            left = pageX - toolX - 12;
                            tooltip_1.classed('right', true);
                            tooltip_1.classed('left', false);
                        }
                        else {
                            left = pageX + 12;
                            tooltip_1.classed('right', false);
                            tooltip_1.classed('left', true);
                        }
                        if ((screenY - pageY) < tooltip_1.node().clientHeight) {
                            top = pageY - toolY + 10;
                            tooltip_1.classed('bottom', true);
                            tooltip_1.classed('top', false);
                        }
                        else {
                            top = pageY - 10;
                            tooltip_1.classed('bottom', false);
                            tooltip_1.classed('top', true);
                        }
                        tooltip_1
                            .style('top', top + 'px')
                            .style('left', left + 'px');
                    });
                })
                    .on('mouseout', function (data) {
                    tooltip_1.transition()
                        .duration(500)
                        .style('opacity', 0);
                });
            }
        };
        CloudChart.prototype.getTooltipElem = function () {
            if (!this._tooltip || this._tooltip.empty()) {
                this._tooltip = d3__namespace.select('body')
                    .append('div')
                    .attr('class', 'wise-chart-tooltip')
                    .html('')
                    .style('opacity', 0)
                    .style('position', 'absolute');
            }
            return this._tooltip;
        };
        return CloudChart;
    }(BaseMixin));

    var config = dc__namespace['config'];
    var utils = dc__namespace['utils'];
    var ColorMixin = function (Base) { return /** @class */ (function (_super) {
        __extends(class_1, _super);
        function class_1() {
            var _this = _super.call(this) || this;
            // @ts-ignore
            _this._colors = d3Scale.scaleOrdinal(config.defaultColors());
            _this._colorAccessor = function (d) { return _this.keyAccessor()(d); };
            _this._colorCalculator = undefined;
            {
                var chart_1 = _this;
                chart_1.getColor = function (d, i) {
                    return chart_1._colorCalculator ?
                        chart_1._colorCalculator.call(this, d, i) :
                        chart_1._colors(chart_1._colorAccessor.call(this, d, i));
                };
            }
            return _this;
        }
        class_1.prototype.calculateColorDomain = function () {
            var newDomain = [d3Array.min(this.data(), this.colorAccessor()),
                d3Array.max(this.data(), this.colorAccessor())];
            this._colors.domain(newDomain);
            return this;
        };
        class_1.prototype.colors = function (colorScale) {
            if (!arguments.length) {
                return this._colors;
            }
            if (colorScale instanceof Array) {
                this._colors = d3Scale.scaleQuantize().range(colorScale); // deprecated legacy support, note: this fails for ordinal domains
            }
            else {
                this._colors = typeof colorScale === 'function' ? colorScale : utils.constant(colorScale);
            }
            return this;
        };
        class_1.prototype.ordinalColors = function (r) {
            return this.colors(d3Scale.scaleOrdinal().range(r));
        };
        class_1.prototype.linearColors = function (r) {
            // @ts-ignore
            var scaleLinear = scaleLinear().range(r);
            scaleLinear.interpolate(d3Interpolate.interpolateHcl);
            var colors = this.colors(scaleLinear);
            return colors;
        };
        class_1.prototype.colorAccessor = function (colorAccessor) {
            if (!colorAccessor) {
                return this._colorAccessor;
            }
            this._colorAccessor = colorAccessor;
            return this;
        };
        class_1.prototype.colorDomain = function (domain) {
            if (!domain) {
                return this._colors.domain();
            }
            this._colors.domain(domain);
            return this;
        };
        class_1.prototype.colorCalculator = function (colorCalculator) {
            if (!colorCalculator) {
                return this._colorCalculator || this.getColor;
            }
            this._colorCalculator = colorCalculator;
            return this;
        };
        return class_1;
    }(Base)); };

    var MarginMixin = /** @class */ (function (_super) {
        __extends(MarginMixin, _super);
        function MarginMixin() {
            var _this = _super.call(this) || this;
            _this._margin = {
                top: 10,
                right: 50,
                bottom: 30,
                left: 30
            };
            return _this;
        }
        MarginMixin.prototype.margins = function (margins) {
            if (!margins) {
                return this._margin;
            }
            this._margin = margins;
            return this;
        };
        MarginMixin.prototype.effectiveWidth = function () {
            // @ts-ignore
            return this.width() - this.margins().left - this.margins().right;
        };
        MarginMixin.prototype.effectiveHeight = function () {
            // @ts-ignore
            return this.height() - this.margins().top - this.margins().bottom;
        };
        return MarginMixin;
    }(BaseMixin));

    var GRID_LINE_CLASS = 'grid-line';
    var HORIZONTAL_CLASS = 'horizontal';
    var VERTICAL_CLASS = 'vertical';
    var Y_AXIS_LABEL_CLASS = 'y-axis-label';
    var X_AXIS_LABEL_CLASS = 'x-axis-label';
    var CUSTOM_BRUSH_HANDLE_CLASS = 'custom-brush-handle';
    var DEFAULT_AXIS_LABEL_PADDING = 12;
    var constants$1 = {
        CHART_CLASS: 'dc-chart',
        DEBUG_GROUP_CLASS: 'debug',
        STACK_CLASS: 'stack',
        DESELECTED_CLASS: 'deselected',
        SELECTED_CLASS: 'selected',
        NODE_INDEX_NAME: '__index__',
        GROUP_INDEX_NAME: '__group_index__',
        DEFAULT_CHART_GROUP: '__default_chart_group__',
        EVENT_DELAY: 40,
        NEGLIGIBLE_NUMBER: 1e-10
    };
    var CoordinateGridMixin = /** @class */ (function (_super) {
        __extends(CoordinateGridMixin, _super);
        function CoordinateGridMixin() {
            var _this = _super.call(this) || this;
            _this.colors(d3Scale.scaleOrdinal(d3ScaleChromatic.schemeCategory10));
            _this._mandatoryAttributes().push('x');
            _this._parent = undefined;
            _this._g = undefined;
            _this._chartBodyG = undefined;
            _this._x = undefined;
            _this._origX = undefined; // Will hold original scale in case of zoom
            _this._xOriginalDomain = undefined;
            // @ts-ignore
            _this._xAxis = d3Axis.axisBottom();
            _this._xUnits = dc.units.integers;
            _this._xAxisPadding = 0;
            _this._xAxisPaddingUnit = d3Time.timeDay;
            _this._xElasticity = false;
            _this._xAxisLabel = undefined;
            _this._xAxisLabelPadding = 0;
            _this._lastXDomain = undefined;
            _this._y = undefined;
            _this._yAxis = null;
            _this._yAxisPadding = 0;
            _this._yElasticity = false;
            _this._yAxisLabel = undefined;
            _this._yAxisLabelPadding = 0;
            _this._brush = d3Brush.brushX();
            _this._gBrush = undefined;
            _this._brushOn = true;
            _this._parentBrushOn = false;
            _this._round = undefined;
            _this._renderHorizontalGridLine = false;
            _this._renderVerticalGridLine = false;
            _this._resizing = false;
            _this._unitCount = undefined;
            _this._zoomScale = [1, Infinity];
            _this._zoomOutRestrict = true;
            _this._zoom = d3Zoom.zoom().on('zoom', function () { return _this._onZoom(); });
            _this._nullZoom = d3Zoom.zoom().on('zoom', null);
            _this._hasBeenMouseZoomable = false;
            _this._rangeChart = undefined;
            _this._focusChart = undefined;
            _this._mouseZoomable = false;
            _this._clipPadding = 0;
            _this._fOuterRangeBandPadding = 0.5;
            _this._fRangeBandPadding = 0;
            _this._useRightYAxis = false;
            return _this;
        }
        CoordinateGridMixin.prototype.rescale = function () {
            this._unitCount = undefined;
            this._resizing = true;
            return this;
        };
        CoordinateGridMixin.prototype.resizing = function (resizing) {
            if (resizing === undefined) {
                return this._resizing;
            }
            this._resizing = resizing;
            return this;
        };
        CoordinateGridMixin.prototype.rangeChart = function (rangeChart) {
            if (rangeChart === undefined) {
                return this._rangeChart;
            }
            this._rangeChart = rangeChart;
            this._rangeChart.focusChart(this);
            return this;
        };
        CoordinateGridMixin.prototype.zoomScale = function (extent) {
            if (extent === undefined) {
                return this._zoomScale;
            }
            this._zoomScale = extent;
            return this;
        };
        CoordinateGridMixin.prototype.zoomOutRestrict = function (zoomOutRestrict) {
            if (zoomOutRestrict === undefined) {
                return this._zoomOutRestrict;
            }
            this._zoomOutRestrict = zoomOutRestrict;
            return this;
        };
        CoordinateGridMixin.prototype._generateG = function (parent) {
            if (parent === undefined) {
                this._parent = this.svg();
            }
            else {
                this._parent = parent;
            }
            var href = window.location.href.split('#')[0];
            this._g = this._parent.append('g');
            this._chartBodyG = this._g.append('g').attr('class', 'chart-body')
                .attr('transform', "translate(" + this.margins().left + ", " + this.margins().top + ")")
                .attr('clip-path', "url(" + href + "#" + this._getClipPathId() + ")");
            return this._g;
        };
        CoordinateGridMixin.prototype.g = function (gElement) {
            if (gElement === undefined) {
                return this._g;
            }
            this._g = gElement;
            return this;
        };
        CoordinateGridMixin.prototype.mouseZoomable = function (mouseZoomable) {
            if (mouseZoomable === undefined) {
                return this._mouseZoomable;
            }
            this._mouseZoomable = mouseZoomable;
            return this;
        };
        CoordinateGridMixin.prototype.chartBodyG = function (chartBodyG) {
            if (chartBodyG === undefined) {
                return this._chartBodyG;
            }
            this._chartBodyG = chartBodyG;
            return this;
        };
        CoordinateGridMixin.prototype.x = function (xScale) {
            if (xScale === undefined) {
                return this._x;
            }
            this._x = xScale;
            this._xOriginalDomain = this._x.domain();
            this.rescale();
            return this;
        };
        CoordinateGridMixin.prototype.xOriginalDomain = function () {
            return this._xOriginalDomain;
        };
        CoordinateGridMixin.prototype.xUnits = function (xUnits) {
            if (xUnits === undefined) {
                return this._xUnits;
            }
            this._xUnits = xUnits;
            return this;
        };
        CoordinateGridMixin.prototype.xAxis = function (xAxis) {
            if (xAxis === undefined) {
                return this._xAxis;
            }
            this._xAxis = xAxis;
            return this;
        };
        CoordinateGridMixin.prototype.elasticX = function (elasticX) {
            if (elasticX === undefined) {
                return this._xElasticity;
            }
            this._xElasticity = elasticX;
            return this;
        };
        CoordinateGridMixin.prototype.xAxisPadding = function (padding) {
            if (padding === undefined) {
                return this._xAxisPadding;
            }
            this._xAxisPadding = padding;
            return this;
        };
        CoordinateGridMixin.prototype.xAxisPaddingUnit = function (unit) {
            if (unit === undefined) {
                return this._xAxisPaddingUnit;
            }
            this._xAxisPaddingUnit = unit;
            return this;
        };
        CoordinateGridMixin.prototype.xUnitCount = function () {
            if (this._unitCount === undefined) {
                if (this.isOrdinal()) {
                    // In this case it number of items in domain
                    this._unitCount = this.x().domain().length;
                }
                else {
                    this._unitCount = this.xUnits()(this.x().domain()[0], this.x().domain()[1]);
                    // Sometimes xUnits() may return an array while sometimes directly the count
                    if (this._unitCount instanceof Array) {
                        this._unitCount = this._unitCount.length;
                    }
                }
            }
            return this._unitCount;
        };
        CoordinateGridMixin.prototype.useRightYAxis = function (useRightYAxis) {
            if (useRightYAxis === undefined) {
                return this._useRightYAxis;
            }
            // We need to warn if value is changing after self._yAxis was created
            if (this._useRightYAxis !== useRightYAxis && this._yAxis) {
                dc.logger.warn('Value of useRightYAxis has been altered, after yAxis was created. ' +
                    'You might get unexpected yAxis behavior. ' +
                    'Make calls to useRightYAxis sooner in your chart creation process.');
            }
            this._useRightYAxis = useRightYAxis;
            return this;
        };
        CoordinateGridMixin.prototype.isOrdinal = function () {
            return this.xUnits() === dc.units.ordinal;
        };
        CoordinateGridMixin.prototype._useOuterPadding = function () {
            return true;
        };
        CoordinateGridMixin.prototype._ordinalXDomain = function () {
            var groups = this._computeOrderedGroups(this.data());
            return groups.map(this.keyAccessor());
        };
        CoordinateGridMixin.prototype._prepareXAxis = function (g, render) {
            if (!this.isOrdinal()) {
                if (this.elasticX()) {
                    this._x.domain([this.xAxisMin(), this.xAxisMax()]);
                }
            }
            else { // self._chart.isOrdinal()
                // D3v4 - Ordinal charts would need scaleBand
                // bandwidth is a method in scaleBand
                // (https://github.com/d3/d3-scale/blob/master/README.md#scaleBand)
                if (!this._x.bandwidth) {
                    // If self._x is not a scaleBand create a new scale and
                    // copy the original domain to the new scale
                    dc.logger.warn('For compatibility with d3v4+, dc.js d3.0 ordinal bar/line/bubble charts need ' +
                        'd3.scaleBand() for the x scale, instead of d3.scaleOrdinal(). ' +
                        'Replacing .x() with a d3.scaleBand with the same domain - ' +
                        'make the same change in your code to avoid this warning!');
                    this._x = d3Scale.scaleBand().domain(this._x.domain());
                }
                if (this.elasticX() || this._x.domain().length === 0) {
                    this._x.domain(this._ordinalXDomain());
                }
            }
            // has the domain changed?
            var xdom = this._x.domain();
            if (render || !dc.utils.arraysEqual(this._lastXDomain, xdom)) {
                this.rescale();
            }
            this._lastXDomain = xdom;
            // please can't we always use rangeBands for bar charts?
            if (this.isOrdinal()) {
                this._x.range([0, this.xAxisLength()])
                    .paddingInner(this._fRangeBandPadding)
                    .paddingOuter(this._useOuterPadding() ? this._fOuterRangeBandPadding : 0);
            }
            else {
                this._x.range([0, this.xAxisLength()]);
            }
            this._xAxis = this._xAxis.scale(this.x());
            this._renderVerticalGridLines(g);
        };
        CoordinateGridMixin.prototype.renderXAxis = function (g) {
            var axisXG = g.select('g.x');
            if (axisXG.empty()) {
                axisXG = g.append('g')
                    .attr('class', 'axis x')
                    .attr('transform', "translate(" + this.margins().left + "," + this._xAxisY() + ")");
            }
            var axisXLab = g.select("text." + X_AXIS_LABEL_CLASS);
            if (axisXLab.empty() && this.xAxisLabel()) {
                axisXLab = g.append('text')
                    .attr('class', X_AXIS_LABEL_CLASS)
                    .attr('transform', "translate(" + (this.margins().left + this.xAxisLength() / 2) + "," + (this.height() - this._xAxisLabelPadding) + ")")
                    .attr('text-anchor', 'middle');
            }
            if (this.xAxisLabel() && axisXLab.text() !== this.xAxisLabel()) {
                axisXLab.text(this.xAxisLabel());
            }
            dc.transition(axisXG, this.transitionDuration(), this.transitionDelay())
                .attr('transform', "translate(" + this.margins().left + "," + this._xAxisY() + ")")
                .call(this._xAxis);
            dc.transition(axisXLab, this.transitionDuration(), this.transitionDelay())
                .attr('transform', "translate(" + (this.margins().left + this.xAxisLength() / 2) + "," + (this.height() - this._xAxisLabelPadding) + ")");
        };
        CoordinateGridMixin.prototype._renderVerticalGridLines = function (g) {
            var _this = this;
            var gridLineG = g.select("g." + VERTICAL_CLASS);
            if (this._renderVerticalGridLine) {
                if (gridLineG.empty()) {
                    gridLineG = g.insert('g', ':first-child')
                        .attr('class', GRID_LINE_CLASS + " " + VERTICAL_CLASS)
                        .attr('transform', "translate(" + this.margins().left + "," + this.margins().top + ")");
                }
                var ticks = this._xAxis.tickValues() ? this._xAxis.tickValues() :
                    (typeof this._x.ticks === 'function' ? this._x.ticks.apply(this._x, this._xAxis.tickArguments()) : this._x.domain());
                var lines = gridLineG.selectAll('line')
                    .data(ticks);
                // enter
                var linesGEnter = lines.enter()
                    .append('line')
                    .attr('x1', function (d) { return _this._x(d); })
                    .attr('y1', this._xAxisY() - this.margins().top)
                    .attr('x2', function (d) { return _this._x(d); })
                    .attr('y2', 0)
                    .attr('opacity', 0);
                dc.transition(linesGEnter, this.transitionDuration(), this.transitionDelay())
                    .attr('opacity', 0.5);
                // update
                dc.transition(lines, this.transitionDuration(), this.transitionDelay())
                    .attr('x1', function (d) { return _this._x(d); })
                    .attr('y1', this._xAxisY() - this.margins().top)
                    .attr('x2', function (d) { return _this._x(d); })
                    .attr('y2', 0);
                // exit
                lines.exit().remove();
            }
            else {
                gridLineG.selectAll('line').remove();
            }
        };
        CoordinateGridMixin.prototype._xAxisY = function () {
            return (this.height() - this.margins().bottom);
        };
        CoordinateGridMixin.prototype.xAxisLength = function () {
            return this.effectiveWidth();
        };
        CoordinateGridMixin.prototype.xAxisLabel = function (labelText, padding) {
            if (labelText === undefined) {
                return this._xAxisLabel;
            }
            this._xAxisLabel = labelText;
            this.margins().bottom -= this._xAxisLabelPadding;
            this._xAxisLabelPadding = (padding === undefined) ? DEFAULT_AXIS_LABEL_PADDING : padding;
            this.margins().bottom += this._xAxisLabelPadding;
            return this;
        };
        CoordinateGridMixin.prototype._createYAxis = function () {
            // @ts-ignore
            return this._useRightYAxis ? d3Axis.axisRight() : d3Axis.axisLeft();
        };
        CoordinateGridMixin.prototype._prepareYAxis = function (g) {
            if (this._y === undefined || this.elasticY()) {
                if (this._y === undefined) {
                    this._y = d3Scale.scaleLinear();
                }
                var _min = this.yAxisMin() || 0;
                var _max = this.yAxisMax() || 0;
                this._y.domain([_min, _max]).rangeRound([this.yAxisHeight(), 0]);
            }
            this._y.range([this.yAxisHeight(), 0]);
            if (!this._yAxis) {
                this._yAxis = this._createYAxis();
            }
            this._yAxis.scale(this._y);
            this._renderHorizontalGridLinesForAxis(g, this._y, this._yAxis);
        };
        CoordinateGridMixin.prototype.renderYAxisLabel = function (axisClass, text, rotation, labelXPosition) {
            labelXPosition = labelXPosition || this._yAxisLabelPadding;
            var axisYLab = this.g().select("text." + Y_AXIS_LABEL_CLASS + "." + axisClass + "-label");
            var labelYPosition = (this.margins().top + this.yAxisHeight() / 2);
            if (axisYLab.empty() && text) {
                axisYLab = this.g().append('text')
                    .attr('transform', "translate(" + labelXPosition + "," + labelYPosition + "),rotate(" + rotation + ")")
                    .attr('class', Y_AXIS_LABEL_CLASS + " " + axisClass + "-label")
                    .attr('text-anchor', 'middle')
                    .text(text);
            }
            if (text && axisYLab.text() !== text) {
                axisYLab.text(text);
            }
            dc.transition(axisYLab, this.transitionDuration(), this.transitionDelay())
                .attr('transform', "translate(" + labelXPosition + "," + labelYPosition + "),rotate(" + rotation + ")");
        };
        CoordinateGridMixin.prototype.renderYAxisAt = function (axisClass, axis, position) {
            var axisYG = this.g().select("g." + axisClass);
            if (axisYG.empty()) {
                axisYG = this.g().append('g')
                    .attr('class', "axis " + axisClass)
                    .attr('transform', "translate(" + position + "," + this.margins().top + ")");
            }
            dc.transition(axisYG, this.transitionDuration(), this.transitionDelay())
                .attr('transform', "translate(" + position + "," + this.margins().top + ")")
                .call(axis);
        };
        CoordinateGridMixin.prototype.renderYAxis = function (g) {
            var axisPosition = this._useRightYAxis ? (this.width() - this.margins().right) : this._yAxisX();
            this.renderYAxisAt('y', this._yAxis, axisPosition);
            var labelPosition = this._useRightYAxis ? (this.width() - this._yAxisLabelPadding) : this._yAxisLabelPadding;
            var rotation = this._useRightYAxis ? 90 : -90;
            this.renderYAxisLabel('y', this.yAxisLabel(), rotation, labelPosition);
        };
        CoordinateGridMixin.prototype._renderHorizontalGridLinesForAxis = function (g, scale, axis) {
            var gridLineG = g.select("g." + HORIZONTAL_CLASS);
            if (this._renderHorizontalGridLine) {
                // see https://github.com/d3/d3-axis/blob/master/src/axis.js#L48
                var ticks = axis.tickValues() ? axis.tickValues() :
                    (scale.ticks ? scale.ticks.apply(scale, axis.tickArguments()) : scale.domain());
                if (gridLineG.empty()) {
                    gridLineG = g.insert('g', ':first-child')
                        .attr('class', GRID_LINE_CLASS + " " + HORIZONTAL_CLASS)
                        .attr('transform', "translate(" + this.margins().left + "," + this.margins().top + ")");
                }
                var lines = gridLineG.selectAll('line')
                    .data(ticks);
                // enter
                var linesGEnter = lines.enter()
                    .append('line')
                    .attr('x1', 1)
                    .attr('y1', function (d) { return scale(d); })
                    .attr('x2', this.xAxisLength())
                    .attr('y2', function (d) { return scale(d); })
                    .attr('opacity', 0);
                dc.transition(linesGEnter, this.transitionDuration(), this.transitionDelay())
                    .attr('opacity', 0.5);
                // update
                dc.transition(lines, this.transitionDuration(), this.transitionDelay())
                    .attr('x1', 1)
                    .attr('y1', function (d) { return scale(d); })
                    .attr('x2', this.xAxisLength())
                    .attr('y2', function (d) { return scale(d); });
                // exit
                lines.exit().remove();
            }
            else {
                gridLineG.selectAll('line').remove();
            }
        };
        CoordinateGridMixin.prototype._yAxisX = function () {
            return this.useRightYAxis() ? this.width() - this.margins().right : this.margins().left;
        };
        CoordinateGridMixin.prototype.yAxisLabel = function (labelText, padding) {
            if (labelText === undefined) {
                return this._yAxisLabel;
            }
            this._yAxisLabel = labelText;
            this.margins().left -= this._yAxisLabelPadding;
            this._yAxisLabelPadding = (padding === undefined) ? DEFAULT_AXIS_LABEL_PADDING : padding;
            this.margins().left += this._yAxisLabelPadding;
            return this;
        };
        CoordinateGridMixin.prototype.y = function (yScale) {
            if (yScale === undefined) {
                return this._y;
            }
            this._y = yScale;
            this.rescale();
            return this;
        };
        CoordinateGridMixin.prototype.yAxis = function (yAxis) {
            if (yAxis === undefined) {
                if (!this._yAxis) {
                    this._yAxis = this._createYAxis();
                }
                return this._yAxis;
            }
            this._yAxis = yAxis;
            return this;
        };
        CoordinateGridMixin.prototype.elasticY = function (elasticY) {
            if (elasticY === undefined) {
                return this._yElasticity;
            }
            this._yElasticity = elasticY;
            return this;
        };
        CoordinateGridMixin.prototype.renderHorizontalGridLines = function (renderHorizontalGridLines) {
            if (renderHorizontalGridLines === undefined) {
                return this._renderHorizontalGridLine;
            }
            this._renderHorizontalGridLine = renderHorizontalGridLines;
            return this;
        };
        CoordinateGridMixin.prototype.renderVerticalGridLines = function (renderVerticalGridLines) {
            if (renderVerticalGridLines === undefined) {
                return this._renderVerticalGridLine;
            }
            this._renderVerticalGridLine = renderVerticalGridLines;
            return this;
        };
        CoordinateGridMixin.prototype.xAxisMin = function () {
            var _this = this;
            var m = d3Array.min(this.data(), function (e) { return _this.keyAccessor()(e); });
            // @ts-ignore
            return dc.utils.subtract(m, this._xAxisPadding, this._xAxisPaddingUnit);
        };
        CoordinateGridMixin.prototype.xAxisMax = function () {
            var _this = this;
            var m = d3Array.max(this.data(), function (e) { return _this.keyAccessor()(e); });
            // @ts-ignore
            return dc.utils.add(m, this._xAxisPadding, this._xAxisPaddingUnit);
        };
        CoordinateGridMixin.prototype.yAxisMin = function () {
            var _this = this;
            var m = d3Array.min(this.data(), function (e) { return _this.valueAccessor()(e); });
            // @ts-ignore
            return dc.utils.subtract(m, this._yAxisPadding);
        };
        CoordinateGridMixin.prototype.yAxisMax = function () {
            var _this = this;
            var m = d3Array.max(this.data(), function (e) { return _this.valueAccessor()(e); });
            // @ts-ignore
            return dc.utils.add(m, this._yAxisPadding);
        };
        CoordinateGridMixin.prototype.yAxisPadding = function (padding) {
            if (padding === undefined) {
                return this._yAxisPadding;
            }
            this._yAxisPadding = padding;
            return this;
        };
        CoordinateGridMixin.prototype.yAxisHeight = function () {
            return this.effectiveHeight();
        };
        CoordinateGridMixin.prototype.round = function (round) {
            if (round === undefined) {
                return this._round;
            }
            this._round = round;
            return this;
        };
        CoordinateGridMixin.prototype._rangeBandPadding = function (_) {
            if (_ === undefined) {
                return this._fRangeBandPadding;
            }
            this._fRangeBandPadding = _;
            return this;
        };
        CoordinateGridMixin.prototype._outerRangeBandPadding = function (_) {
            if (_ === undefined) {
                return this._fOuterRangeBandPadding;
            }
            this._fOuterRangeBandPadding = _;
            return this;
        };
        CoordinateGridMixin.prototype.filter = function (_) {
            if (_ === undefined) {
                return _super.prototype.filter.call(this);
            }
            _super.prototype.filter.call(this, _);
            this.redrawBrush(_, false);
            return this;
        };
        CoordinateGridMixin.prototype.brush = function (_) {
            if (_ === undefined) {
                return this._brush;
            }
            this._brush = _;
            return this;
        };
        CoordinateGridMixin.prototype.renderBrush = function (g, doTransition) {
            var _this = this;
            if (this._brushOn) {
                this._brush.on('start brush end', function () { return _this._brushing(); });
                // To retrieve selection we need self._gBrush
                this._gBrush = g.append('g')
                    .attr('class', 'brush')
                    .attr('transform', "translate(" + this.margins().left + "," + this.margins().top + ")");
                this.setBrushExtents();
                this.createBrushHandlePaths(this._gBrush, doTransition);
                this.redrawBrush(this.filter(), doTransition);
            }
        };
        CoordinateGridMixin.prototype.createBrushHandlePaths = function (gBrush, option) {
            var _this = this;
            var brushHandles = gBrush.selectAll("path." + CUSTOM_BRUSH_HANDLE_CLASS).data([{ type: 'w' }, { type: 'e' }]);
            brushHandles = brushHandles
                .enter()
                .append('path')
                .attr('class', CUSTOM_BRUSH_HANDLE_CLASS)
                .merge(brushHandles);
            brushHandles
                .attr('d', function (d) { return _this.resizeHandlePath(d); });
        };
        CoordinateGridMixin.prototype.extendBrush = function (brushSelection) {
            if (brushSelection && this.round()) {
                brushSelection[0] = this.round()(brushSelection[0]);
                brushSelection[1] = this.round()(brushSelection[1]);
            }
            return brushSelection;
        };
        CoordinateGridMixin.prototype.brushIsEmpty = function (brushSelection) {
            return !brushSelection || brushSelection[1] <= brushSelection[0];
        };
        CoordinateGridMixin.prototype._brushing = function () {
            var _this = this;
            // Avoids infinite recursion (mutual recursion between range and focus operations)
            // Source Event will be null when brush.move is called programmatically (see below as well).
            // @ts-ignore
            if (!event.sourceEvent) {
                return;
            }
            // Ignore event if recursive event - i.e. not directly generated by user action (like mouse/touch etc.)
            // In this case we are more worried about this handler causing brush move programmatically which will
            // cause this handler to be invoked again with a new d3.event (and current event set as sourceEvent)
            // This check avoids recursive calls
            // @ts-ignore
            if (event.sourceEvent.type && ['start', 'brush', 'end'].indexOf(event.sourceEvent.type) !== -1) {
                return;
            }
            // @ts-ignore
            var brushSelection = event.selection;
            if (brushSelection) {
                brushSelection = brushSelection.map(this.x().invert);
            }
            brushSelection = this.extendBrush(brushSelection);
            this.redrawBrush(brushSelection, false);
            var rangedFilter = this.brushIsEmpty(brushSelection) ? null : dc.filters.RangedFilter(brushSelection[0], brushSelection[1]);
            dc.events.trigger(function () {
                _this.applyBrushSelection(rangedFilter);
            }, constants$1.EVENT_DELAY);
        };
        // This can be overridden in a derived chart. For example Composite chart overrides it
        CoordinateGridMixin.prototype.applyBrushSelection = function (rangedFilter) {
            this.replaceFilter(rangedFilter);
            this.redrawGroup();
        };
        CoordinateGridMixin.prototype.setBrushExtents = function (doTransition) {
            // Set boundaries of the brush, must set it before applying to self._gBrush
            this._brush.extent([[0, 0], [this.effectiveWidth(), this.effectiveHeight()]]);
            this._gBrush
                .call(this._brush);
        };
        CoordinateGridMixin.prototype.redrawBrush = function (brushSelection, doTransition) {
            var _this = this;
            if (this._brushOn && this._gBrush) {
                if (this._resizing) {
                    this.setBrushExtents(doTransition);
                }
                if (!brushSelection) {
                    this._gBrush
                        .call(this._brush.move, null);
                    this._gBrush.selectAll("path." + CUSTOM_BRUSH_HANDLE_CLASS)
                        .attr('display', 'none');
                }
                else {
                    var scaledSelection = [this._x(brushSelection[0]), this._x(brushSelection[1])];
                    var gBrush = dc.optionalTransition(doTransition, this.transitionDuration(), this.transitionDelay())(this._gBrush);
                    // @ts-ignore
                    gBrush
                        .call(this._brush.move, scaledSelection);
                    // @ts-ignore
                    gBrush.selectAll("path." + CUSTOM_BRUSH_HANDLE_CLASS)
                        .attr('display', null)
                        .attr('transform', function (d, i) { return "translate(" + _this._x(brushSelection[i]) + ", 0)"; })
                        .attr('d', function (d) { return _this.resizeHandlePath(d); });
                }
            }
            this.fadeDeselectedArea(brushSelection);
        };
        CoordinateGridMixin.prototype.fadeDeselectedArea = function (brushSelection) {
            // do nothing, sub-chart should override this function
        };
        // borrowed from Crossfilter example
        CoordinateGridMixin.prototype.resizeHandlePath = function (d) {
            d = d.type;
            var e = +(d === 'e'), x = e ? 1 : -1, y = this.effectiveHeight() / 3;
            return "M" + 0.5 * x + "," + y + "A6,6 0 0 " + e + " " + 6.5 * x + "," + (y + 6) + "V" + (2 * y - 6) + "A6,6 0 0 " + e + " " + 0.5 * x + "," + 2 * y + "Z" +
                ("M" + 2.5 * x + "," + (y + 8) + "V" + (2 * y - 8) + "M" + 4.5 * x + "," + (y + 8) + "V" + (2 * y - 8));
        };
        CoordinateGridMixin.prototype._getClipPathId = function () {
            return this.anchorName().replace(/[ .#=\[\]"]/g, '-') + "-clip";
        };
        CoordinateGridMixin.prototype.clipPadding = function (padding) {
            if (padding === undefined) {
                return this._clipPadding;
            }
            this._clipPadding = padding;
            return this;
        };
        CoordinateGridMixin.prototype._generateClipPath = function () {
            // @ts-ignore
            var defs = dc.utils.appendOrSelect(this._parent, 'defs');
            // cannot select <clippath> elements; bug in WebKit, must select by id
            // https://groups.google.com/forum/#!topic/d3-js/6EpAzQ2gU9I
            var id = this._getClipPathId();
            var chartBodyClip = dc.utils.appendOrSelect(defs, "#" + id, 'clipPath').attr('id', id);
            var padding = this._clipPadding * 2;
            // @ts-ignore
            dc.utils.appendOrSelect(chartBodyClip, 'rect')
                .attr('width', this.xAxisLength() + padding)
                .attr('height', this.yAxisHeight() + padding)
                .attr('transform', "translate(-" + this._clipPadding + ", -" + this._clipPadding + ")");
        };
        CoordinateGridMixin.prototype._preprocessData = function () {
        };
        CoordinateGridMixin.prototype._doRender = function () {
            this.resetSvg();
            this._preprocessData();
            this._generateG();
            this._generateClipPath();
            this._drawChart(true);
            this._configureMouseZoom();
            return this;
        };
        CoordinateGridMixin.prototype._doRedraw = function () {
            this._preprocessData();
            this._drawChart(false);
            this._generateClipPath();
            return this;
        };
        CoordinateGridMixin.prototype._drawChart = function (render) {
            if (this.isOrdinal()) {
                this._brushOn = false;
            }
            this._prepareXAxis(this.g(), render);
            this._prepareYAxis(this.g());
            this['plotData']();
            if (this.elasticX() || this._resizing || render) {
                this.renderXAxis(this.g());
            }
            if (this.elasticY() || this._resizing || render) {
                this.renderYAxis(this.g());
            }
            if (render) {
                this.renderBrush(this.g(), false);
            }
            else {
                // Animate the brush only while resizing
                this.redrawBrush(this.filter(), this._resizing);
            }
            this.fadeDeselectedArea(this.filter());
            this.resizing(false);
        };
        CoordinateGridMixin.prototype._configureMouseZoom = function () {
            // Save a copy of original x scale
            this._origX = this._x.copy();
            if (this._mouseZoomable) {
                this._enableMouseZoom();
            }
            else if (this._hasBeenMouseZoomable) {
                this._disableMouseZoom();
            }
        };
        CoordinateGridMixin.prototype._enableMouseZoom = function () {
            this._hasBeenMouseZoomable = true;
            var extent = [[0, 0], [this.effectiveWidth(), this.effectiveHeight()]];
            this._zoom
                .scaleExtent(this._zoomScale)
                .extent(extent)
                .duration(this.transitionDuration());
            if (this._zoomOutRestrict) {
                // Ensure minimum zoomScale is at least 1
                var zoomScaleMin = Math.max(this._zoomScale[0], 1);
                this._zoom
                    .translateExtent(extent)
                    .scaleExtent([zoomScaleMin, this._zoomScale[1]]);
            }
            this.root().call(this._zoom);
            // Tell D3 zoom our current zoom/pan status
            this._updateD3zoomTransform();
        };
        CoordinateGridMixin.prototype._disableMouseZoom = function () {
            this.root().call(this._nullZoom);
        };
        CoordinateGridMixin.prototype._zoomHandler = function (newDomain, noRaiseEvents) {
            var _this = this;
            var domFilter;
            if (this._hasRangeSelected(newDomain)) {
                this.x().domain(newDomain);
                domFilter = dc.filters.RangedFilter(newDomain[0], newDomain[1]);
            }
            else {
                this.x().domain(this._xOriginalDomain);
                domFilter = null;
            }
            this.replaceFilter(domFilter);
            this.rescale();
            this.redraw();
            if (!noRaiseEvents) {
                if (this._rangeChart && !dc.utils.arraysEqual(this.filter(), this._rangeChart.filter())) {
                    dc.events.trigger(function () {
                        // @ts-ignore
                        _this._rangeChart.replaceFilter(domFilter);
                        _this._rangeChart.redraw();
                    });
                }
                this._invokeZoomedListener();
                dc.events.trigger(function () {
                    _this.redrawGroup();
                }, constants$1.EVENT_DELAY);
            }
        };
        // event.transform.rescaleX(self._origX).domain() should give back newDomain
        CoordinateGridMixin.prototype._domainToZoomTransform = function (newDomain, origDomain, xScale) {
            var k = (origDomain[1] - origDomain[0]) / (newDomain[1] - newDomain[0]);
            var xt = -1 * xScale(newDomain[0]);
            return d3Zoom.zoomIdentity.scale(k).translate(xt, 0);
        };
        // If we changing zoom status (for example by calling focus), tell D3 zoom about it
        CoordinateGridMixin.prototype._updateD3zoomTransform = function () {
            if (this._zoom) {
                this._zoom.transform(this.root(), this._domainToZoomTransform(this.x().domain(), this._xOriginalDomain, this._origX));
            }
        };
        CoordinateGridMixin.prototype._onZoom = function () {
            // Avoids infinite recursion (mutual recursion between range and focus operations)
            // Source Event will be null when zoom is called programmatically (see below as well).
            // @ts-ignore
            if (!event.sourceEvent) {
                return;
            }
            // Ignore event if recursive event - i.e. not directly generated by user action (like mouse/touch etc.)
            // In this case we are more worried about this handler causing zoom programmatically which will
            // cause this handler to be invoked again with a new d3.event (and current event set as sourceEvent)
            // This check avoids recursive calls
            // @ts-ignore
            if (event.sourceEvent.type && ['start', 'zoom', 'end'].indexOf(event.sourceEvent.type) !== -1) {
                return;
            }
            // @ts-ignore
            var newDomain = event.transform.rescaleX(this._origX).domain();
            this.focus(newDomain, false);
        };
        CoordinateGridMixin.prototype._checkExtents = function (ext, outerLimits) {
            if (!ext || ext.length !== 2 || !outerLimits || outerLimits.length !== 2) {
                return ext;
            }
            if (ext[0] > outerLimits[1] || ext[1] < outerLimits[0]) {
                console.warn('Could not intersect extents, will reset');
            }
            // Math.max does not work (as the values may be dates as well)
            return [ext[0] > outerLimits[0] ? ext[0] : outerLimits[0], ext[1] < outerLimits[1] ? ext[1] : outerLimits[1]];
        };
        CoordinateGridMixin.prototype.focus = function (range, noRaiseEvents) {
            if (this._zoomOutRestrict) {
                // ensure range is within self._xOriginalDomain
                range = this._checkExtents(range, this._xOriginalDomain);
                // If it has an associated range chart ensure range is within domain of that rangeChart
                if (this._rangeChart) {
                    range = this._checkExtents(range, this._rangeChart.x().domain());
                }
            }
            this._zoomHandler(range, noRaiseEvents);
            this._updateD3zoomTransform();
        };
        CoordinateGridMixin.prototype.refocused = function () {
            return !dc.utils.arraysEqual(this.x().domain(), this._xOriginalDomain);
        };
        CoordinateGridMixin.prototype.focusChart = function (c) {
            var _this = this;
            if (c === undefined) {
                return this._focusChart;
            }
            this._focusChart = c;
            this.on('filtered.dcjs-range-chart', function (chart) {
                if (!chart.filter()) {
                    dc.events.trigger(function () {
                        _this._focusChart.x().domain(_this._focusChart.xOriginalDomain(), true);
                    });
                }
                else if (!dc.utils.arraysEqual(chart.filter(), _this._focusChart.filter())) {
                    dc.events.trigger(function () {
                        _this._focusChart.focus(chart.filter(), true);
                    });
                }
            });
            return this;
        };
        CoordinateGridMixin.prototype.brushOn = function (brushOn) {
            if (brushOn === undefined) {
                return this._brushOn;
            }
            this._brushOn = brushOn;
            return this;
        };
        CoordinateGridMixin.prototype.parentBrushOn = function (brushOn) {
            if (brushOn === undefined) {
                return this._parentBrushOn;
            }
            this._parentBrushOn = brushOn;
            return this;
        };
        // Get the SVG rendered brush
        CoordinateGridMixin.prototype.gBrush = function () {
            return this._gBrush;
        };
        CoordinateGridMixin.prototype._hasRangeSelected = function (range) {
            return range instanceof Array && range.length > 1;
        };
        return CoordinateGridMixin;
    }(ColorMixin(MarginMixin)));

    var constants = {
        CHART_CLASS: 'dj-chart',
        DEBUG_GROUP_CLASS: 'debug',
        STACK_CLASS: 'stack',
        DESELECTED_CLASS: 'deselected',
        SELECTED_CLASS: 'selected',
        NODE_INDEX_NAME: '__index__',
        GROUP_INDEX_NAME: '__group_index__',
        DEFAULT_CHART_GROUP: '__default_chart_group__',
        EVENT_DELAY: 40,
        NEGLIGIBLE_NUMBER: 1e-10
    };
    var MultiChart = /** @class */ (function (_super) {
        __extends(MultiChart, _super);
        function MultiChart(element, option) {
            var _this = _super.call(this) || this;
            _this._gap = 2;
            _this.MIN_BAR_WIDTH = 1;
            _this._centerBar = true;
            _this._symbol = d3__namespace.symbol();
            _this._click = null;
            _this._highlightedSize = 7;
            _this._symbolSize = 5;
            _this._excludedSize = 3;
            _this._excludedColor = null;
            _this._excludedOpacity = 1.0;
            _this._emptySize = 0;
            _this._filtered = [];
            _this.multiOption = option;
            _this.originalKeyAccessor = _this.keyAccessor();
            _this.keyAccessor(function (d) { return _this.originalKeyAccessor(d)[0]; });
            _this.valueAccessor(function (d) { return _this.originalKeyAccessor(d)[1]; });
            _this.colorAccessor(function () { return _this._groupName; });
            _this.lines = function () { return _this; };
            _this._existenceAccessor = function (d) {
                return d.value ? d.value : d.y;
            };
            _this._symbol.size(function (d, i) {
                if (!_this._existenceAccessor(d)) {
                    return _this._emptySize;
                }
                else if (_this._filtered[i]) {
                    return Math.pow(_this._symbolSize, 2);
                }
                else {
                    return Math.pow(_this._excludedSize, 2);
                }
            });
            return _this;
        }
        MultiChart.prototype._filter = function (filter) {
            if (!filter) {
                return this.__filter();
            }
            return this.__filter(dc.filters.RangedTwoDimensionalFilter(filter));
        };
        MultiChart.prototype.plotData = function (zoomX, zoomY) {
            var _this = this;
            var chartList = [];
            var type;
            var axisLabel;
            var yAxisLabel;
            var errorBar;
            var chartOption;
            var axisWidth;
            var clipPath;
            if (this.svg()) {
                clipPath = this.svg().select('.chart-body').attr('clip-path');
            }
            else {
                clipPath = this.g().select('.chart-body').attr('clip-path');
            }
            this.chartBodyG().attr('clip-path', clipPath);
            this.multiOption.axisOption.forEach(function (v) {
                if (v.series) {
                    chartList.push(v.series);
                    if (_this.data()[0].key[0].toString() === v.series.toString()) {
                        type = v.type;
                        axisLabel = v.axisLabel;
                    }
                    if (_this._groupName === v.series) {
                        yAxisLabel = v.axisLabel;
                        errorBar = v.errorBar;
                        chartOption = v;
                    }
                }
            });
            if (chartOption) {
                // stacks 가 있으면 stack 설정
                if (chartOption.stacks) {
                    var _stacks_1 = [];
                    var sel_stack_1 = (function (key) { return function (d) { return d.value[key]; }; });
                    chartOption.stacks.forEach(function (d) {
                        var layer = { group: _this.group(), name: d, accessor: sel_stack_1 };
                        _stacks_1.push(layer);
                    });
                    this.data = function () {
                        var layers = _stacks_1.filter(function (l) { return !l.hidden; });
                        if (!layers.length) {
                            return [];
                        }
                        layers.forEach(function (layer, layerIdx) {
                            layer.name = String(layer.name || layerIdx);
                            var allValues = layer.group.all().map(function (d, i) {
                                return {
                                    x: _this.keyAccessor()(d, i),
                                    y: layer.hidden ? null : sel_stack_1(layer.name)(d),
                                    data: d,
                                    layer: layer.name,
                                    hidden: layer.hidden
                                };
                            });
                            layer.domainValues = allValues;
                            layer.values = allValues;
                            layer['key'] = layer.group.all()[0].key;
                        });
                        var v4data = layers[0].values.map(function (v, i) {
                            var col = { x: v.x };
                            layers.forEach(function (layer) {
                                // @ts-ignore
                                col[layer.name] = layer.values[i].y;
                            });
                            return col;
                        });
                        var keys = layers.map(function (layer) { return layer.name; });
                        var v4result = d3__namespace.stack().keys(keys)(v4data);
                        v4result.forEach(function (series, i) {
                            series.forEach(function (ys, j) {
                                layers[i].values[j].y0 = ys[0];
                                layers[i].values[j].y1 = ys[1];
                            });
                        });
                        return layers;
                    };
                }
                // boolean 일때 설정
                if (type === 'boolean') {
                    if (!chartOption.symbol) {
                        chartOption.symbol = 'square';
                    }
                    if (!chartOption.symbol) {
                        chartOption.symbol = 'square';
                    }
                    if (!chartOption.gap) {
                        chartOption.gap = 5;
                    }
                    if (!chartOption.size) {
                        chartOption.size = 7;
                    }
                    if (!chartOption.lineWidth) {
                        chartOption.lineWidth = 1.5;
                    }
                }
                var y_1 = d3__namespace.scaleLinear().range([this.yAxisHeight(), 0]);
                var yAxis = d3__namespace.axisRight(y_1).ticks(10);
                if (chartOption.tickFormat) {
                    yAxis.tickFormat(chartOption.tickFormat);
                }
                if (chartOption.ticks) {
                    yAxis.ticks(chartOption.ticks);
                }
                // x domain 설정
                if (zoomX) {
                    this.x().domain(zoomX);
                }
                // 도메인에 해당하는 데이터만 찾기기
                var data_1 = [];
                var domain_1 = this.x().domain();
                this.data().forEach(function (v) {
                    var x = v.key[0];
                    if (domain_1[0] <= x && domain_1[1] >= x) {
                        data_1.push(v);
                    }
                });
                // y domain 설정
                var yDomain = void 0;
                if (zoomY) { // zoom in 일때
                    domain_1 = this._groupScale[this._groupName];
                    var area = (domain_1[0] - domain_1[0]) + (domain_1[1] - domain_1[0]);
                    if (type === 'boolean') {
                        y_1.domain([-0.5, 1.5]);
                        // @ts-ignore
                        yAxis.ticks(2).tickFormat(function (d) {
                            if (!d) {
                                return 'FAIL';
                            }
                            else if (d === 1) {
                                return 'PASS';
                            }
                            else {
                                return null;
                            }
                        });
                    }
                    else if (axisLabel === 'EVENT') {
                        y_1.domain(domain_1);
                    }
                    else {
                        yDomain = [
                            (area / zoomY[0]) + domain_1[0] + (chartOption.gap ? -chartOption.gap : 0),
                            (area / zoomY[1]) + domain_1[0] + (chartOption.gap ? chartOption.gap : 0)
                        ];
                        y_1.domain([
                            (area / zoomY[0]) + domain_1[0] + (chartOption.gap ? -chartOption.gap : 0),
                            (area / zoomY[1]) + domain_1[0] + (chartOption.gap ? chartOption.gap : 0)
                        ]);
                    }
                    var dom = y_1.domain();
                }
                else if (!zoomX && !zoomY && this.yOriginalDomain && this.yOriginalDomain()) {
                    y_1.domain(this.yOriginalDomain());
                }
                else { // zoom out 일때
                    if (this.multiOption.axisOption) {
                        this.multiOption.axisOption.forEach(function (v) {
                            if (_this._groupName === v.series) {
                                domain_1 = v.domain;
                            }
                        });
                    }
                    if (type === 'boolean') {
                        y_1.domain([-0.5, 1.5]);
                        // @ts-ignore
                        yAxis.ticks(2).tickFormat(function (d) {
                            if (!d) {
                                return 'FAIL';
                            }
                            else if (d === 1) {
                                return 'PASS';
                            }
                            else {
                                return null;
                            }
                        });
                    }
                    else if (axisLabel === 'EVENT') {
                        y_1.domain(domain_1);
                    }
                    else if (domain_1) {
                        var dom = [domain_1[0] + (chartOption.gap ? -chartOption.gap : 0), domain_1[1] + (chartOption.gap ? chartOption.gap : 0)];
                        y_1.domain(dom);
                    }
                    else {
                        var dom = [
                            // @ts-ignore
                            d3__namespace.min(data_1, function (d) { return typeof d.value === 'object' ? d.value.value : d.value; }) + (chartOption.gap ? -chartOption.gap : 0),
                            d3__namespace.max(data_1, function (d) { return typeof d.value === 'object' ? d.value.value : d.value; }) + (chartOption.gap ? chartOption.gap : 0)
                        ];
                        y_1.domain(dom);
                    }
                }
                this._locator = function (d) {
                    var rotate = '';
                    if (chartOption.symbolRotate) {
                        rotate = ' rotate(' + chartOption.symbolRotate + ')';
                    }
                    var bandwidth = 0;
                    if (_this.x().bandwidth) {
                        bandwidth = _this.x().bandwidth() / 2;
                    }
                    if (d.key) {
                        var check = _this.y()(_this.valueAccessor()(d));
                        if (isNaN(check)) {
                            check = 0;
                        }
                        return 'translate(' + (_this.x()(_this.keyAccessor()(d)) + bandwidth) + ',' + check + ')' + rotate;
                    }
                    else {
                        var check = y_1(d.y);
                        if (isNaN(check)) {
                            check = 0;
                        }
                        return 'translate(' + (_this.x()(d.x) + bandwidth) + ',' + check + ')' + rotate;
                    }
                };
                this._annotateLocation = function (d) {
                    var rotate = '';
                    if (chartOption.symbolRotate) {
                        rotate = ' rotate(' + chartOption.symbolRotate + ')';
                    }
                    if (d.key) {
                        var check = _this.y()(_this.valueAccessor()(d));
                        if (isNaN(check)) {
                            check = 0;
                        }
                        return 'translate(' + _this.x()(_this.keyAccessor()(d)) + ',' + check + ')' + rotate;
                    }
                    else {
                        var check = y_1(d.y);
                        if (isNaN(check)) {
                            check = 0;
                        }
                        return 'translate(' + (_this.x()(d.x) - 7) + ',' + (check - 10) + ')' + rotate;
                    }
                };
                if (!this._groupScale) {
                    this._groupScale = {};
                }
                this._groupScale[this._groupName] = y_1.domain();
                // Y Axis 그리기
                var axisPadding = 0;
                for (var i = 0; i < chartList.indexOf(this._groupName); i++) {
                    if (i) {
                        axisPadding += this.multiOption.axisOption[i].width ? this.multiOption.axisOption[i].width + 35 : 0;
                    }
                }
                // chart 그리기
                var valAccessor_1 = this.valueAccessor();
                var drawData = this.data();
                if (!chartOption.stacks) {
                    drawData = [{
                            group: {
                                all: function () { return _this.data(); }
                            },
                            name: this.data()[0].key[1].toString(),
                            values: this.data().map(function (d, i) {
                                return {
                                    x: _this.keyAccessor()(d, i),
                                    y: valAccessor_1(d, i),
                                    z: d.value.z,
                                    data: d,
                                    layer: d.key[1],
                                    hidden: undefined
                                };
                            })
                        }];
                }
                this.drawChart(type, y_1, drawData, chartOption, zoomX, yDomain);
                if (!chartOption.hide) {
                    var axis = chartList.indexOf(this._groupName) ? yAxis : d3__namespace.axisLeft(y_1).ticks(10);
                    if (chartOption.tickFormat) {
                        axis.tickFormat(chartOption.tickFormat);
                    }
                    if (chartOption.ticks) {
                        axis.ticks(chartOption.ticks);
                    }
                    var axisClass = this.multiOption.axisOption.filter(function (d) { return !d.hide; }).map(function (d) { return d.series; }).indexOf(this._groupName);
                    var chartWith = this.renderYAxisAt(axisClass, axis, this.width() - this.margins().right + axisPadding);
                    axisWidth = this.renderYAxisAt(axisClass, axis, this.width() - this.margins().right + axisPadding) || 0;
                    // label
                    this.renderYAxisLabel(axisClass, yAxisLabel, 90, this.width() - this.margins().right + axisWidth + 5 + axisPadding);
                }
                // set y right axis width
                this.multiOption.axisOption.forEach(function (v) {
                    if (_this._groupName === v.series) {
                        v.width = axisWidth;
                    }
                });
            }
            if (!this.yOriginalDomain) {
                this.yOriginalDomain = function () {
                    var domain;
                    _this.multiOption.axisOption.forEach(function (v) {
                        if (_this._groupName === v.series) {
                            domain = v.domain;
                        }
                    });
                    return domain;
                };
            }
        };
        MultiChart.prototype.click = function (click) {
            if (!click) {
                return this._click;
            }
            this._click = click;
            return this;
        };
        MultiChart.prototype.defined = function (defined) {
            if (!defined) {
                return this._defined;
            }
            this._defined = defined;
            return this;
        };
        MultiChart.prototype.dashStyle = function (dashStyle) {
            if (!dashStyle) {
                return this._dashStyle;
            }
            this._dashStyle = dashStyle;
            return this;
        };
        MultiChart.prototype.renderYAxisLabel = function (axisClass, text, rotation, labelXPosition) {
            labelXPosition = labelXPosition || 0;
            if (axisClass && this.svg()) {
                var axisYLab = this.svg().selectAll('text.' + 'y-axis-label' + '.y' + axisClass + '-label');
                var labelYPosition = ((this.margins().top + this.yAxisHeight()) / 2);
                if (axisYLab.empty() && text) {
                    axisYLab = d3__namespace.select(this.g()._groups[0][0].parentNode).append('text')
                        .attr('transform', 'translate(' + labelXPosition + ',' + labelYPosition + '),rotate(' + rotation + ')')
                        .attr('class', 'y-axis-label' + ' y' + axisClass + '-label')
                        .attr('text-anchor', 'middle')
                        .text(text);
                }
                if (text && axisYLab.text() !== text) {
                    axisYLab.text(text);
                }
                dc.transition(axisYLab, this.transitionDuration(), this.transitionDelay())
                    .attr('transform', 'translate(' + labelXPosition + ',' + labelYPosition + '),rotate(' + rotation + ')');
            }
        };
        MultiChart.prototype.renderYAxisAt = function (axisClass, axis, position) {
            var axisYG;
            if (axisClass && this.svg()) {
                axisYG = this.svg().selectAll('g.' + 'y' + axisClass);
                if (axisYG.empty()) {
                    axisYG = d3__namespace.select(this.g()._groups[0][0].parentNode).append('g')
                        .attr('class', 'axis y-axis-at ' + 'y' + axisClass)
                        .attr('transform', 'translate(' + position + ',' + this.margins().top + ')');
                }
                dc.transition(axisYG, this.transitionDuration(), this.transitionDelay())
                    .attr('transform', 'translate(' + position + ',' + this.margins().top + ')')
                    .call(axis);
            }
            else {
                if (this.svg()) {
                    axisYG = this.svg().select('g.' + 'y');
                }
                else {
                    axisYG = d3__namespace.select(this.g()._groups[0][0].parentNode).select('g.' + 'y');
                }
                dc.transition(axisYG, this.transitionDuration(), this.transitionDelay()).call(axis);
            }
            if (axisYG && axisYG._groups[0][0]) {
                return axisYG._groups[0][0].getBoundingClientRect().width;
            }
            else {
                return 0;
            }
        };
        MultiChart.prototype.drawChart = function (chart, y, data, option, zoomX, zoomY) {
            var _this = this;
            if (chart === 'lineSymbol') {
                /*--------- line Start----------*/
                var chartBody = this.chartBodyG();
                var layersList = chartBody.selectAll('g.stack-list');
                if (layersList.empty()) {
                    layersList = chartBody.append('g').attr('class', 'stack-list');
                }
                var layers = layersList.selectAll('g.stack').data(data);
                var layersEnter = layers.enter().append('g').attr('class', function (d, i) { return 'stack ' + '_' + i; });
                this.drawLine(layersEnter, layers, y, option, option.smooth);
                /*--------- line End----------*/
                /*--------- symbol Start----------*/
                var layers2 = this.chartBodyG().selectAll('path.symbol').data(data);
                layers2.enter()
                    .append('g')
                    .attr('class', function (d, i) {
                    return 'stack ' + '_' + i;
                });
                data.forEach(function (d, i) {
                    _this.renderSymbol(d, option);
                });
                // 추가된 데이터가 있으면 다시 렌더
                if (data.length !== layers.size()) {
                    this.plotData();
                }
                /*--------- symbol End----------*/
                // renderArea 추가
                if (option.renderArea) {
                    this.drawArea(layersEnter, layers, y, option, option.smooth ? d3__namespace.curveMonotoneX : d3__namespace.curveCardinal.tension(1));
                }
            }
            else if (chart === 'smoothLine') {
                /*--------- line Start----------*/
                var chartBody = this.chartBodyG();
                var layersList = chartBody.selectAll('g.stack-list');
                if (layersList.empty()) {
                    layersList = chartBody.append('g').attr('class', 'stack-list');
                }
                var layers = layersList.selectAll('g.stack').data(data);
                var layersEnter = layers.enter().append('g').attr('class', function (d, i) { return 'stack ' + '_' + i; });
                this.drawLine(layersEnter, layers, y, option, true);
                /*--------- line End----------*/
                /*--------- symbol Start----------*/
                var layers2 = this.chartBodyG().selectAll('path.symbol').data(data);
                layers2.enter()
                    .append('g')
                    .attr('class', function (d, i) {
                    return 'stack ' + '_' + i;
                });
                data.forEach(function (d, i) {
                    _this.renderSymbol(d, option);
                });
                // 추가된 데이터가 있으면 다시 렌더
                if (data.length !== layers.size()) {
                    this.plotData();
                }
                // renderArea 추가
                if (option.renderArea) {
                    this.drawArea(layersEnter, layers, y, option, d3__namespace.curveMonotoneX);
                }
                /*--------- symbol End----------*/
            }
            else if (chart === 'line') {
                var chartBody = this.chartBodyG();
                var layersList = chartBody.selectAll('g.stack-list');
                if (layersList.empty()) {
                    layersList = chartBody.append('g').attr('class', 'stack-list');
                }
                var layers = layersList.selectAll('g.stack').data(data);
                var layersEnter = layers.enter().append('g').attr('class', function (d, i) { return 'stack ' + '_' + i; });
                this.drawLine(layersEnter, layers, y, option, option.smooth);
                // 추가된 데이터가 있으면 다시 렌더
                if (data.length !== layers.size()) {
                    this.plotData();
                }
                if (option.renderArea) {
                    this.drawArea(layersEnter, layers, y, option, option.smooth ? d3__namespace.curveMonotoneX : d3__namespace.curveCardinal.tension(1));
                }
            }
            else if (chart === 'stepLine') {
                var chartBody = this.chartBodyG();
                var layersList = chartBody.selectAll('g.stack-list');
                if (layersList.empty()) {
                    layersList = chartBody.append('g').attr('class', 'stack-list');
                }
                var layers = layersList.selectAll('g.stack').data(data);
                var layersEnter = layers.enter().append('g').attr('class', function (d, i) { return 'stack ' + '_' + i; });
                this.stepLine(layersEnter, layers, y, option);
                if (option.renderArea) {
                    this.drawArea(layersEnter, layers, y, option, d3__namespace.curveStepAfter);
                }
                // 추가된 데이터가 있으면 다시 렌더
                if (data.length !== layers.size()) {
                    this.plotData();
                }
            }
            else if (chart === 'symbol' || chart === 'boolean') {
                if (this.chartBodyG().selectAll('path.symbol').empty()) {
                    this.chartBodyG().append('path').attr('class', 'symbol');
                }
                var layers = this.chartBodyG().selectAll('path.symbol').data(data);
                layers.enter()
                    .append('g')
                    .attr('class', function (d, i) { return 'stack ' + '_' + i; });
                data.forEach(function (d, i) { return _this.renderSymbol(d, option); });
            }
            else if (chart === 'bar') {
                var bars_1 = this.multiOption.axisOption.filter(function (d) { return d.type === 'bar'; });
                var barIndex_1 = bars_1.map(function (d) { return d.series; }).indexOf(this._groupName);
                if (this.chartBodyG().selectAll('g.stack').empty()) {
                    this.chartBodyG().append('g').attr('class', 'stack _0');
                }
                var layers_1 = this.chartBodyG().selectAll('g.stack').data(data);
                this.calculateBarWidth();
                layers_1.enter()
                    .append('g')
                    .attr('class', function (d, i) {
                    return 'stack ' + '_' + i;
                })
                    .merge(layers_1);
                var last_1 = layers_1.size() - 1;
                layers_1.each(function (d, i) {
                    var layer = d3__namespace.select(d);
                    _this.renderBars(layers_1, i, d, y, option, bars_1, barIndex_1);
                    if (_this.renderLabel() && last_1 === i) {
                        _this.renderLabels(layer, i, d);
                    }
                });
            }
            else if (chart === 'thermal') {
                var xStep_1 = option.gap, yStep_1 = 1;
                if (zoomX && zoomY) {
                    this.x().domain([zoomX[0], +zoomX[1]]);
                    y.domain([zoomY[0], zoomY[1] + yStep_1]);
                }
                else {
                    this.x().domain([this.multiOption.xRange[0] - (xStep_1 / 2), +this.multiOption.xRange[1] + (xStep_1 / 2)]);
                    y.domain([option.domain[0], option.domain[1] + yStep_1]);
                }
                var layers = this.chartBodyG().selectAll('rect.thermal').data(data);
                layers.enter()
                    .append('g')
                    .attr('class', function (d, i) { return 'stack ' + '_' + i; });
                data.forEach(function (d, i) { return _this.renderThermal(d, option, xStep_1, yStep_1, y); });
            }
        };
        MultiChart.prototype.barPadding = function (barPadding) {
            if (!barPadding) {
                return this._rangeBandPadding();
            }
            this._rangeBandPadding(barPadding);
            this._gap = undefined;
            return this;
        };
        MultiChart.prototype.calculateBarWidth = function () {
            if (this._barWidth === undefined) {
                var numberOfBars = this.xUnitCount();
                if (this.isOrdinal() && this._gap === undefined) {
                    this._barWidth = Math.floor(this.x().bandwidth());
                }
                else if (this._gap) {
                    this._barWidth = Math.floor((this.xAxisLength() - (numberOfBars - 1) * this._gap) / numberOfBars);
                }
                else {
                    this._barWidth = Math.floor(this.xAxisLength() / (1 + this.barPadding()) / numberOfBars);
                }
                if (this._barWidth === Infinity || isNaN(this._barWidth) || this._barWidth < this.MIN_BAR_WIDTH) {
                    this._barWidth = this.MIN_BAR_WIDTH;
                }
            }
        };
        MultiChart.prototype.drawLine = function (layersEnter, layers, y, option, smooth) {
            var _this = this;
            var bandwidth = 0;
            if (this.x().bandwidth) {
                bandwidth = this.x().bandwidth() / 2;
            }
            var line = d3__namespace.line()
                .x(function (d) { return _this.x()(d.x) + bandwidth; })
                .y(function (d) { return y ? y(d.y) : _this.y()(d.y); })
                .curve(smooth ? d3__namespace.curveMonotoneX : d3__namespace.curveCardinal.tension(1));
            if (this._defined) {
                line.defined(this._defined);
            }
            var path = layersEnter.append('path').attr('class', 'line').attr('stroke', option.color ? option.color : this.colors2.bind(this))
                .attr('stroke', option.color ? option.color : this.colors2.bind(this))
                .attr('d', function (d) { return _this.safeD(line(d.values)); })
                .attr('chartKey', function (d) { return d.key; })
                .style('stroke-width', option.lineWidth + 'px');
            if (option.dashStyle) {
                path.attr('stroke-dasharray', option.dashStyle);
            }
            dc.transition(layers.select('path.line'), this.transitionDuration(), this.transitionDelay())
                .attr('stroke', option.color ? option.color : this.colors2.bind(this))
                .attr('d', function (d) { return _this.safeD(line(d.values)); })
                .attr('seriesKey', function (d) { return d.values[0].data.key[0]; })
                .style('stroke-width', option.lineWidth + 'px');
        };
        MultiChart.prototype.colors2 = function (d, i) {
            return this.getColor.call(d, d.values, i);
        };
        MultiChart.prototype.safeD = function (d) {
            return (!d || d.indexOf('NaN') >= 0) ? 'M0,0' : d;
        };
        MultiChart.prototype.renderSymbol = function (d, option) {
            var _this = this;
            var getSymbol = function () {
                if (option.symbol) {
                    if (option.symbol === 'cross') {
                        return d3__namespace.symbolCross;
                    }
                    else if (option.symbol === 'diamond') {
                        return d3__namespace.symbolDiamond;
                    }
                    else if (option.symbol === 'square') {
                        return d3__namespace.symbolSquare;
                    }
                    else if (option.symbol === 'star') {
                        return d3__namespace.symbolStar;
                    }
                    else if (option.symbol === 'triangle') {
                        return d3__namespace.symbolTriangle;
                    }
                    else if (option.symbol === 'wye') {
                        return d3__namespace.symbolWye;
                    }
                    else {
                        return d3__namespace.symbolCircle;
                    }
                }
                else {
                    return d3__namespace.symbolCircle;
                }
            };
            var symbolSize = function () {
                if (option.size) {
                    return option.size * option.size;
                }
                else {
                    return 7 * 7;
                }
            };
            var color = option.colorOption ? option.colorOption : (option.color || this.getColor);
            var symbols = this.chartBodyG().selectAll('path.symbol').data(d.values);
            symbols.enter()
                .append('path').attr('class', 'symbol')
                .attr('opacity', 0)
                .attr('fill', option.color ? option.color : this.getColor)
                .attr('transform', this._locator)
                .attr('d', d3__namespace.symbol().type(getSymbol()).size(symbolSize()))
                .on('click', function (data) {
                if (_this._click) {
                    // @ts-ignore
                    return _this._click(d);
                }
            });
            if (this.multiOption.tooltip) {
                var tooltip_1 = this.getTooltipElem();
                symbols
                    .on('mousemove', function (data) {
                    // @ts-ignore
                    var pageX = event.pageX;
                    // @ts-ignore
                    var pageY = event.pageY;
                    var left = 0, top = 0;
                    tooltip_1.transition()
                        .duration(100)
                        .style('opacity', .9)
                        .style('background', color)
                        .style('border-color', color)
                        .style('z-index', 10000);
                    tooltip_1.html(_this.multiOption.tooltip(data));
                    setTimeout(function () {
                        var toolX = tooltip_1.node().clientWidth;
                        var toolY = tooltip_1.node().clientHeight;
                        top = pageY - toolY - 15;
                        left = pageX - (toolX / 2);
                        tooltip_1
                            .style('top', top + 'px')
                            .style('left', left + 'px');
                    });
                })
                    .on('mouseout', function (data) {
                    tooltip_1.transition()
                        .duration(200)
                        .style('opacity', 0)
                        .style('z-index', -1);
                });
            }
            if (this.multiOption.onClick) {
                // @ts-ignore
                symbols.on('click', function (data) { return _this.multiOption.onClick(data, event); });
            }
            // @ts-ignore
            dc.transition(symbols, this.transitionDuration(), this.transitionDelay())
                .attr('opacity', function (data, i) { return isNaN(_this._existenceAccessor(data)) ? 0 : _this._filtered[i] ? 1 : _this.excludedOpacity(); })
                .attr('stroke', function (data, i) {
                if (_this.excludedColor() && !_this._filtered[i]) {
                    return _this.excludedColor();
                }
                else if (typeof color === 'function') {
                    return color(data.data.value);
                }
                else {
                    return color;
                }
            })
                .attr('seriesKey', function (data) { return data.data.key[0]; })
                .attr('fill', '#fff')
                .attr('transform', this._locator)
                // @ts-ignore
                .attr('d', d3__namespace.symbol().type(getSymbol()).size(symbolSize()));
            dc.transition(symbols.exit(), this.transitionDuration(), this.transitionDelay()).attr('opacity', 0).remove();
            // 추가된 데이터가 있으면 다시 렌더
            if (d.values && d.values.length !== symbols.size()) {
                this.renderSymbol(d, option);
            }
        };
        MultiChart.prototype.barHeight = function (y, d) {
            var rtn = +(this.yAxisHeight() - y(d.y)) < 0 ? 0 : dc.utils.safeNumber(+(this.yAxisHeight() - y(d.y)));
            if (d.y0 !== undefined) {
                return (y(d.y0) - y(d.y + d.y0));
            }
            return rtn;
        };
        MultiChart.prototype.drawArea = function (layersEnter, layers, y, option, curve) {
            var _this = this;
            var area = d3__namespace.area()
                .x(function (d) { return _this.x()(d.x); })
                .y1(function (d) { return y ? y(d.y) : _this.y()(d.y); })
                .y0(function (d) {
                if (option.renderAreaRange) {
                    return y ? y(option.renderAreaRange) : _this.y()(option.renderAreaRange);
                }
                else {
                    return _this.yAxisHeight();
                }
            })
                .curve(curve);
            if (this._defined) {
                area.defined(this._defined);
            }
            layersEnter.append('path')
                .attr('class', 'area')
                .attr('fill', option.color ? option.color : this.colors2.bind(this))
                .attr('d', function (d) { return _this.safeD(area(d.values)); });
            dc.transition(layers.select('path.area'), this.transitionDuration(), this.transitionDelay())
                .attr('stroke', option.color ? option.color : this.colors2.bind(this)).attr('d', function (d) { return _this.safeD(area(d.values)); });
        };
        MultiChart.prototype.renderLabels = function (layer, layerIndex, d) {
            var _this = this;
            var labels = layer.selectAll('text.barLabel')
                .data(d.values, dc.pluck('x'));
            labels.enter()
                .append('text')
                .attr('class', 'barLabel')
                .attr('text-anchor', 'middle');
            if (this.isOrdinal()) {
                labels.attr('cursor', 'pointer');
            }
            dc.transition(labels, this.transitionDuration(), this.transitionDelay())
                .attr('x', function (data) {
                var x = _this.x()(data.x);
                if (!_this._centerBar) {
                    x += _this._barWidth / 2;
                }
                return dc.utils.safeNumber(x);
            })
                .attr('y', function (data) {
                var y = _this.y()(data.y + data.y0);
                if (data.y < 0) {
                    y -= _this.barHeight(y, data);
                }
                return dc.utils.safeNumber(y - 3);
            })
                .text(function (data) { return _this.label()(data); });
            dc.transition(labels.exit(), this.transitionDuration(), this.transitionDelay())
                .attr('height', 0)
                .remove();
        };
        MultiChart.prototype.renderThermal = function (data, option, xStep, yStep, y) {
            var _this = this;
            var symbols = this.chartBodyG().selectAll('rect.thermal').data(data.values);
            symbols.enter().append('rect').attr('class', 'thermal');
            dc.transition(symbols, this.transitionDuration(), this.transitionDelay())
                .attr('x', function (d) { return _this.x()((+d.x - xStep / 2)); })
                .attr('y', function (d) { return y(+d.y + yStep); })
                .attr('width', this.x()(this.x().domain()[0] + xStep) - this.x()(this.x().domain()[0]))
                .attr('height', y(y.domain()[0]) - y(y.domain()[0] + yStep))
                .attr('opacity', function (d) { return isNaN(d.z) ? 0 : 1; })
                .style('fill', function (d) { return option.colorScale(option.colorAccessor(d.data)); });
            dc.transition(symbols.exit(), this.transitionDuration(), this.transitionDelay()).attr('opacity', 0).remove();
        };
        MultiChart.prototype.renderBars = function (layer, layerIndex, data, y, option, barlist, barIndex) {
            var _this = this;
            var bars = layer.selectAll('rect.bar').data(data.values, dc.pluck('x'));
            var ordinalType = false;
            if (option.barWidth) {
                this._barWidth = option.barWidth;
            }
            if (this._x.bandwidth) {
                ordinalType = true;
                this._barWidth = this._x.bandwidth();
            }
            if (this.multiOption.xAxisOption && this.multiOption.xAxisOption.type === 'date') {
                var _a = this.margins(), left = _a.left, right = _a.right;
                var xAxisWidth = this._widthCalc() - left - right;
                var uniqKeys = ___namespace.uniq(this.data().map(function (d) { return d.key[1]; }));
                this._barWidth = xAxisWidth / uniqKeys.length;
            }
            dc.transition(bars.exit(), this.transitionDuration(), this.transitionDelay())
                .attr('x', function (d) { return _this.x()(d.x); })
                .attr('width', this._barWidth * 0.9)
                .remove();
            bars.enter()
                .append('rect')
                .attr('class', 'bar')
                .attr('x', function (d) {
                var x = _this.x()(d.x);
                if (_this._centerBar && !_this.isOrdinal()) {
                    x -= _this._barWidth / 2;
                }
                if (_this.isOrdinal() && _this._gap !== undefined) {
                    x += _this._gap / 2;
                }
                var position = (_this._barWidth / barlist.length) * barIndex;
                return dc.utils.safeNumber(x + position);
            })
                .attr('y', function (d) {
                var yVal;
                if (d.y0 !== undefined) {
                    yVal = y(d.y + d.y0);
                    if (d.y < 0) {
                        yVal -= _this.barHeight(y, d);
                    }
                }
                else {
                    yVal = y(d.y);
                }
                return dc.utils.safeNumber(yVal);
            })
                .attr('width', this._barWidth / barlist.length)
                .attr('height', function (d) { return _this.barHeight(y, d); })
                .attr('fill', dc.pluck('layer', option.color ? function (d, i) {
                if (option.stacks) {
                    var index = option.stacks.indexOf(d);
                    return option.color[index];
                }
                else {
                    return option.color;
                }
            } : this.getColor))
                .select('title').text(dc.pluck('data', this.title(data.name)));
            if (this.multiOption.onClick) {
                // @ts-ignore
                bars.on('click', function (d) { return _this.multiOption.onClick(d, event); });
            }
            dc.transition(bars, this.transitionDuration(), this.transitionDelay())
                .attr('x', function (d) {
                var x = _this.x()(d.x);
                if (_this._centerBar && !_this.isOrdinal()) {
                    x -= _this._barWidth / 2;
                }
                if (_this.isOrdinal() && _this._gap !== undefined) {
                    x += _this._gap / 2;
                }
                var position = (_this._barWidth / barlist.length) * barIndex;
                return dc.utils.safeNumber(x + position);
            })
                .attr('y', function (d) {
                var yVal;
                if (d.y0 !== undefined) {
                    yVal = y(d.y + d.y0);
                    if (d.y < 0) {
                        yVal -= _this.barHeight(y, d);
                    }
                }
                else {
                    yVal = y(d.y);
                }
                return dc.utils.safeNumber(yVal);
            })
                .attr('width', this._barWidth / barlist.length)
                .attr('height', function (d) { return _this.barHeight(y, d); })
                .attr('fill', dc.pluck('layer', option.color ? function (d, i) {
                if (option.stacks) {
                    var index = option.stacks.indexOf(d);
                    return option.color[index];
                }
                else {
                    return option.color;
                }
            } : this.getColor))
                .select('title').text(dc.pluck('data', this.title(data.name)));
        };
        MultiChart.prototype.stepLine = function (layersEnter, layers, y, option) {
            var _this = this;
            var bandwidth = 0;
            if (this.x().bandwidth) {
                bandwidth = this.x().bandwidth() / 2;
            }
            var line = d3__namespace.line()
                .x(function (d) { return (_this.x()(d.x) + bandwidth); })
                .y(function (d) { return y ? y(d.y) : _this.y()(d.y); })
                .curve(d3__namespace.curveStepAfter);
            if (this._defined) {
                line.defined(this._defined);
            }
            var path = layersEnter.append('path').attr('class', 'line').attr('stroke', option.color ? option.color : this.colors2.bind(this));
            if (option.dashStyle) {
                path.attr('stroke-dasharray', option.dashStyle);
            }
            dc.transition(layers.select('path.line'), this.transitionDuration(), this.transitionDelay())
                .attr('stroke', option.color ? option.color : this.colors2.bind(this))
                .attr('d', function (d) { return _this.safeD(line(d.values)); })
                .style('stroke-width', option.lineWidth + 'px');
        };
        MultiChart.prototype.symbol = function (type) {
            if (!type) {
                return this._symbol.type();
            }
            this._symbol.type(type);
            return this;
        };
        MultiChart.prototype.excludedColor = function (excludedColor) {
            if (!excludedColor) {
                return this._excludedColor;
            }
            this._excludedColor = excludedColor;
            return this;
        };
        MultiChart.prototype.excludedOpacity = function (excludedOpacity) {
            if (!excludedOpacity) {
                return this._excludedOpacity;
            }
            this._excludedOpacity = excludedOpacity;
            return this;
        };
        MultiChart.prototype.resizeSymbolsWhere = function (condition, size) {
            var _this = this;
            // @ts-ignore
            var symbols = this.selectAll('.chart-body path.symbol').filter(function () { return condition(d3__namespace.select(_this)); });
            var oldSize = this._symbol.size();
            this._symbol.size(Math.pow(size, 2));
            // @ts-ignore
            dc.transition(symbols, this.transitionDuration(), this.transitionDelay()).attr('d', this._symbol);
            this._symbol.size(oldSize);
        };
        MultiChart.prototype.extendBrush = function () {
            var extent = this.brush().extent();
            if (this.round()) {
                extent[0] = extent[0].map(this.round());
                extent[1] = extent[1].map(this.round());
                this.g().select('.brush').call(this.brush().extent(extent));
            }
            return extent;
        };
        MultiChart.prototype.brushIsEmpty = function (extent) {
            return this.brush().empty() || !extent || extent[0][0] >= extent[1][0] || extent[0][1] >= extent[1][1];
        };
        MultiChart.prototype._brushing = function () {
            var _this = this;
            var extent = this.extendBrush();
            this.redrawBrush(this.g());
            if (this.brushIsEmpty(extent)) {
                dc.events.trigger(function () {
                    _this.filter(null);
                    _this.redrawGroup();
                });
            }
            else {
                var ranged2DFilter_1 = dc.filters.RangedTwoDimensionalFilter(extent);
                dc.events.trigger(function () {
                    _this.filter(null);
                    _this.filter(ranged2DFilter_1);
                    _this.redrawGroup();
                }, constants.EVENT_DELAY);
            }
        };
        MultiChart.prototype.getTooltipElem = function () {
            if (!this._tooltip || this._tooltip.empty()) {
                this._tooltip = d3__namespace.select('body')
                    .append('div')
                    .attr('class', 'wise-chart-tooltip')
                    .html('')
                    .style('opacity', 0)
                    .style('position', 'absolute')
                    .style('z-index', -1);
            }
            return this._tooltip;
        };
        return MultiChart;
    }(CoordinateGridMixin));

    var DjChart = /** @class */ (function (_super) {
        __extends(DjChart, _super);
        function DjChart(option) {
            var _this = _super.call(this) || this;
            _this.option = option;
            return _this;
        }
        DjChart.prototype.cloudChart = function (element) {
            return new CloudChart(element, this.option);
        };
        DjChart.prototype.multiChart = function (element) {
            var chart = new MultiChart(element, this.option);
            return chart['anchor'](element);
        };
        return DjChart;
    }(DcChart));

    var DjAngularChartComponent = /** @class */ (function () {
        function DjAngularChartComponent(elRef, zone) {
            this.elRef = elRef;
            this.zone = zone;
            this.resizeDelay = 300;
            this.changFilter = new i0.EventEmitter();
            this.rendered = new i0.EventEmitter();
        }
        Object.defineProperty(DjAngularChartComponent.prototype, "option", {
            get: function () {
                // @ts-ignore
                return this._option;
            },
            set: function (option) {
                if (option.type === 'composite') {
                    option.setAxisOption();
                }
                this.wiseChart = new DjChart(option);
                this._option = option;
                switch (option.type) {
                    case 'pieChart':
                        this.chart = this.wiseChart.pieChart(this.elRef.nativeElement);
                        this.setPieChart();
                        break;
                    case 'cloudChart':
                        this.chart = this.wiseChart.cloudChart(this.elRef.nativeElement);
                        this.setCloudChart();
                        break;
                    case 'dcChart':
                        this.setDcChart();
                        break;
                    default:
                        this.chart = this.wiseChart.seriesChart(this.elRef.nativeElement);
                        this.setMultiSeries();
                        break;
                }
                this.chart.render();
                this.rendered.emit(this.chart);
            },
            enumerable: false,
            configurable: true
        });
        DjAngularChartComponent.prototype.ngOnInit = function () {
            var _this = this;
            // init document width
            this.domWidth = this.elRef.nativeElement.clientWidth;
            // element 사이즈가 변경되었을때
            this.observer = new ResizeObserver(function (entries) {
                _this.zone.runOutsideAngular(function () {
                    // resize duration: this.resizeDelay
                    var width = entries[0].contentRect.width;
                    clearTimeout(_this.resizeTimer);
                    _this.resizeTimer = setTimeout(function () {
                        if (_this.domWidth !== width) {
                            _this.domWidth = width;
                            // redraw
                            if (_this.chart) {
                                _this.chart.minWidth(100);
                                _this.chart.minHeight(50);
                                _this.chart.width(0);
                                _this.chart.height(0);
                                if (_this.chart.rescale) {
                                    _this.chart.rescale();
                                }
                                if (_this.chart.update) {
                                    _this.chart.update();
                                }
                                else {
                                    _this.chart.redraw();
                                }
                            }
                        }
                    }, _this.resizeDelay);
                });
            });
            this.observer.observe(this.elRef.nativeElement);
        };
        DjAngularChartComponent.prototype.ngOnDestroy = function () {
            // 생성된 tooltip 제거
            if (this._tooltip) {
                this._tooltip.remove();
            }
            if (this.chart.children) {
                this.chart.children().forEach(function (chart) {
                    if (chart._tooltip) {
                        chart._tooltip.remove();
                    }
                });
            }
            // @ts-ignore
            this.observer.unobserve(this.elRef.nativeElement);
        };
        DjAngularChartComponent.prototype.create = function () {
            var _this = this;
            this.setWidthHeight();
            this.setMargins();
            // input type이 crossfilter와 data일때 처리
            if (this.option.data !== undefined) {
                this.chart.dimension(this.filter());
                this.chart.group({ all: function () { return _this.option.data; }, size: function () { return _this.option.data.length; } });
            }
            else {
                this.chart.dimension(this.option.dimension);
                this.chart.group(this.option.group);
            }
            var overrideFields = ['onClick'];
            overrideFields.forEach(function (key) {
                // @ts-ignore
                if (_this.option[key] !== undefined) {
                    if (key === 'onClick') {
                        // @ts-ignore
                        _this.chart[key] = function (d) { return _this.option.onClick(d, event); };
                    }
                    else {
                        // @ts-ignore
                        _this.chart[key] = _this.option[key];
                    }
                }
            });
            if (this.option.onClickEvent) {
                this.chart['_onClickEvent'] = this.chart.onClick;
                this.chart['onClick'] = function (d) {
                    _this.chart._onClickEvent(d);
                    _this.option.onClickEvent(d);
                };
            }
            if (this.option.onFilterChanged) {
                // @ts-ignore
                this.chart.on('filtered', function (d) { return _this.option.onFilterChanged(d); });
            }
            this.option['chart'] = this.chart;
        };
        DjAngularChartComponent.prototype.setPieChart = function () {
            var _this = this;
            this.create();
            var _innerRadius = this.option.innerRadius || 30;
            var _radius = this.option.radius || 80;
            var _externalLabels = this.option.externalLabels || 0;
            var size = d3__namespace.min([+this.width, +this.height]);
            this.chart
                // @ts-ignore
                .radius((size / 2) * (_radius / 100))
                // @ts-ignore
                .innerRadius((size / 2) * (_innerRadius / 100))
                .externalLabels(_externalLabels)
                .drawPaths(true);
            if (this.option.slicesPercent) {
                var data = this.option.data ? this.option.data : this.option.group.all();
                data = data.sort(function (a, b) { return b.value - a.value; });
                var sum_1 = 0;
                var index = 0;
                data.forEach(function (d) { return sum_1 += d.value; });
                while (index < data.length) {
                    var percent = (data[index].value / sum_1) * 100;
                    if (percent < this.option.slicesPercent) {
                        break;
                    }
                    index++;
                }
                this.chart.slicesCap(index);
            }
            if (this.option.slicesCap) {
                this.chart.slicesCap(this.option.slicesCap);
            }
            if (this.option.colors) {
                this.chart.colors(function (d) {
                    var key = internalCompatibility.isArray(d) ? d[0] : d;
                    // @ts-ignore
                    return _this.option.colors[key] || '#ccc';
                });
            }
            this.chart.on('pretransition', function (chart) {
                chart.selectAll('text.pie-slice').text(function (d) {
                    var key = d.data.key;
                    var angle = d.endAngle - d.startAngle;
                    if (_this.option.legends) {
                        key = _this.option.legends[key] || key;
                    }
                    if (angle > 0.5 || (angle > 0.5 && _externalLabels)) {
                        return key;
                    }
                    return '';
                });
                if (_this.option.tooltip) {
                    var tooltip_1 = _this.getTooltipElem();
                    chart.selectAll('title').remove();
                    chart.selectAll('g.pie-slice')
                        .on('mousemove', function (data) {
                        var key = internalCompatibility.isArray(data.data.key) ? data.data.key[0] : data.data.key;
                        var color = _this.option.colors ? _this.option.colors[key] : _this.chart.getColor(data.data);
                        // @ts-ignore
                        var pageX = event.pageX;
                        // @ts-ignore
                        var pageY = event.pageY;
                        var left = 0, top = 0;
                        tooltip_1.transition()
                            .duration(100)
                            .style('opacity', .9)
                            .style('background', color)
                            .style('border-color', color)
                            .style('z-index', 10000);
                        tooltip_1.html(_this.option.tooltip(data));
                        setTimeout(function () {
                            var toolX = tooltip_1.node().clientWidth;
                            var toolY = tooltip_1.node().clientHeight;
                            top = pageY - toolY - 20;
                            left = pageX - (toolX / 2);
                            tooltip_1
                                .style('top', top + 'px')
                                .style('left', left + 'px');
                        });
                    })
                        .on('mouseout', function (data) {
                        tooltip_1.transition()
                            .duration(300)
                            .style('opacity', 0)
                            .style('z-index', -1);
                    });
                    /*symbols
                      */
                }
            });
        };
        DjAngularChartComponent.prototype.setDcChart = function () {
            var _this = this;
            // @ts-ignore
            this.chart = this.wiseChart[this.option.dcChart](this.elRef.nativeElement);
            this.create();
            Object.keys(this.option).forEach(function (key) {
                if (_this.chart[key]) {
                    // @ts-ignore
                    _this.chart[key](_this.option[key]);
                }
            });
        };
        DjAngularChartComponent.prototype.setCloudChart = function () {
            this.create();
            this.chart.padding(this.option.padding);
            this.chart.legends(this.option.legends);
        };
        DjAngularChartComponent.prototype.setMargins = function () {
            if (this.option.margins) {
                this.chart.margins().left = this.option.margins.left !== undefined ? +this.option.margins.left : 30;
                this.chart.margins().right = this.option.margins.right !== undefined ? +this.option.margins.right : 50;
                this.chart.margins().bottom = this.option.margins.bottom !== undefined ? +this.option.margins.bottom : 30;
                this.chart.margins().top = this.option.margins.top !== undefined ? +this.option.margins.top : 10;
            }
        };
        DjAngularChartComponent.prototype.setMultiSeries = function () {
            var _this = this;
            this.create();
            var min = d3__namespace.min(this.chart.group().all(), function (d) { return +d.key[1]; }) || 0;
            var max = d3__namespace.max(this.chart.group().all(), function (d) { return +d.key[1]; });
            var subChart = function (c) {
                return _this.wiseChart.multiChart(c);
            };
            var rightYAxisWidth = 0;
            var leftYAxisWidth = 30;
            this.chart
                .chart(subChart)
                .renderHorizontalGridLines(true)
                .renderVerticalGridLines(true)
                // @ts-ignore
                .x(d3__namespace.scaleLinear().domain([min, max]))
                .yAxisLabel(this.option.axisOption && this.option.axisOption.length ? this.option.axisOption[0].axisLabel : this.option.yAxisLabel)
                .xAxisLabel(this.option.xAxisLabel)
                .clipPadding(5)
                .elasticY(false)
                .mouseZoomable(false)
                .brushOn(false)
                .seriesAccessor(function (d) { return d.key[0]; })
                .seriesSort(function (a, b) {
                var orderList = _this.option.axisOption.map(function (d) { return d.series; });
                return orderList.indexOf(a) - orderList.indexOf(b);
            })
                .keyAccessor(function (d) {
                return d.key ? isNaN(d.key[1]) ? d.key[1] : +d.key[1] : null;
            })
                .valueAccessor(function (d) { return d.value; });
            // set lef y axis
            this.setLeftYAxis();
            // xAxis
            if (this.option.xAxisOption) {
                if (this.option.xAxisOption.domain) {
                    min = this.option.xAxisOption.domain[0];
                    max = this.option.xAxisOption.domain[1];
                }
                switch (this.option.xAxisOption.type) {
                    case 'ordinal':
                        this.chart.x(d3__namespace.scaleBand()).xUnits(this.wiseChart.units.ordinal).domain([min, max]);
                        break;
                    case 'date':
                        if (this.option.xAxisOption.domain) {
                            min = moment__default['default'](min, this.option.xAxisOption.dateFormat).valueOf();
                            max = moment__default['default'](max, this.option.xAxisOption.dateFormat).valueOf();
                        }
                        // @ts-ignore
                        this.chart.x(d3__namespace.scaleTime().domain([new Date(min), new Date(max)]));
                        if (this.option.xAxisOption.dateTickFormat) {
                            // @ts-ignore
                            this.chart.xAxis().tickFormat(function (d) { return moment__default['default'](d).format(_this.option.xAxisOption.dateTickFormat); });
                        }
                        break;
                    default:
                        // @ts-ignore
                        this.chart.x(d3__namespace.scaleLinear().domain([min, max]));
                        break;
                }
                if (this.option.xAxisOption.ticks) {
                    this.chart.xAxis().ticks(this.option.xAxisOption.ticks);
                }
                if (this.option.xAxisOption.tickFormat) {
                    this.chart.xAxis().tickFormat(this.option.xAxisOption.tickFormat);
                }
                this.chart.xAxisLabel(this.option.xAxisOption.axisLabel);
            }
            // series sort
            if (this.option.order) {
                this.chart.seriesSort(function (a, b) {
                    var order = _this.option.order;
                    var before = order.indexOf(a);
                    var after = order.indexOf(b);
                    return before - after;
                });
            }
            // renderlet
            this.chart['renderOn'] = function (chart) {
                if (_this.option.highlight) {
                    _this.renderHighlight(chart);
                }
            };
            // update
            this.chart['update'] = function () {
                var rightWidth = 0;
                _this.chart.redraw();
                _this.setLeftYAxis();
                setTimeout(function () {
                    _this.option.axisOption.forEach(function (v, i) {
                        if (i && !v.hide) {
                            rightWidth += +v.width ? +v.width : 0;
                        }
                    });
                    // right yAxis 2개 이상부터 35씩 추가
                    // @ts-ignore
                    if (_this.option.yAxisOptions.length > 2) {
                        // @ts-ignore
                        rightWidth += (_this.option.yAxisOptions.length - 2) * 35;
                    }
                    if (_this.option.elasticRightMargin) {
                        _this.chart.margins().right = _this.chart.marginRight + rightWidth;
                    }
                    else {
                        _this.chart.margins().right = _this.chart.marginRight;
                    }
                    // left yAxis 의 width 구하기
                    if (_this.option.elasticLeftMargin) {
                        leftYAxisWidth = _this.chart.svg().selectAll('.axis.y')._groups[0][0].getBoundingClientRect().width + 20;
                        _this.chart.margins().left = _this.option.axisOption[0].axisLabel || _this.option.yAxisLabel ? leftYAxisWidth : _this.chart.margins().left;
                    }
                    // left margin 영역 만큼 chart g 이동
                    var chartBodys = _this.chart.g().selectAll('g.chart-body');
                    var gridLines = _this.chart.g().selectAll('g.grid-line');
                    var highlight = _this.chart.g().selectAll('g.highlight');
                    dc.transition(chartBodys, _this.chart.transitionDuration(), _this.chart.transitionDelay())
                        .attr('transform', "translate(" + _this.chart.margins().left + ", " + _this.chart.margins().top + ")");
                    dc.transition(gridLines, _this.chart.transitionDuration(), _this.chart.transitionDelay())
                        .attr('transform', "translate(" + _this.chart.margins().left + ", " + _this.chart.margins().top + ")");
                    dc.transition(highlight, _this.chart.transitionDuration(), _this.chart.transitionDelay())
                        .attr('transform', "translate(" + _this.chart.margins().left + ", " + _this.chart.margins().top + ")");
                    setTimeout(function () {
                        _this.chart.redraw();
                    });
                }, 500);
            };
            // redraw change
            this.chart['_redraw'] = this.chart.redraw;
            this.chart['_redraw'] = this.chart.redraw;
            this.chart['redraw'] = function () {
                _this.chart._redraw();
                _this.chart.renderOn(_this.chart);
            };
            // render change
            this.chart['_render'] = this.chart.render;
            this.chart.render = function () {
                _this.chart['marginRight'] = _this.chart.margins().right;
                _this.chart._render();
                setTimeout(function () {
                    _this.chart.update();
                }, 300);
            };
        };
        DjAngularChartComponent.prototype.setLeftYAxis = function () {
            var _this = this;
            var axisOption = this.option.axisOption;
            if (axisOption && axisOption[0]) {
                var domain = void 0;
                var leftOption_1 = axisOption[0];
                // domain
                if (axisOption && axisOption.length && leftOption_1.domain) {
                    domain = leftOption_1.domain;
                }
                else {
                    if (this.chart.group().all().length) {
                        domain = [
                            // @ts-ignore
                            d3__namespace.min(this.chart.group().all(), function (d) { return typeof d.value === 'object' ? d.value.value : d.value; }) + (this.option.gap ? -this.option.gap : 0),
                            d3__namespace.max(this.chart.group().all(), function (d) { return typeof d.value === 'object' ? d.value.value : d.value; }) + (this.option.gap ? this.option.gap : 0)
                        ];
                    }
                    else {
                        domain = [0, 100];
                    }
                }
                this.chart.y(d3__namespace.scaleLinear().domain(domain ? domain : [0, 100]));
                // tickformat
                if (leftOption_1.tickFormat) {
                    this.chart.yAxis().tickFormat(leftOption_1.tickFormat);
                }
                else if (leftOption_1.prevTickText || leftOption_1.nextTickText) {
                    var tickFormat = function (d) {
                        var tick = '';
                        if (leftOption_1.prevTickText) {
                            tick += leftOption_1.prevTickText;
                        }
                        tick += _this.commaSeparateNumber(d) || 0;
                        if (leftOption_1.nextTickText) {
                            tick += leftOption_1.nextTickText;
                        }
                        return tick;
                    };
                    this.chart.yAxis().tickFormat(tickFormat);
                }
                else {
                    this.chart.yAxis().tickFormat(function (d) { return _this.commaSeparateNumber(d) || 0; });
                }
                // label
                if (leftOption_1.axisLabel) {
                    this.chart.yAxisLabel(leftOption_1.axisLabel);
                }
            }
            else {
                this.chart.y(d3__namespace.scaleLinear().domain([0, 100]));
            }
        };
        DjAngularChartComponent.prototype.setWidthHeight = function () {
            this.width = this.option.width ? this.option.width : this.elRef.nativeElement.clientWidth || 200;
            this.height = this.option.height ? this.option.height : this.elRef.nativeElement.clientHeight || 400;
            this.chart
                .width(this.width)
                .height(this.height);
        };
        DjAngularChartComponent.prototype.filter = function () {
            var _this = this;
            if (!this.option.filters) {
                this.option['filters'] = [];
            }
            return {
                filter: function (d) {
                    _this.option.filters = _this.getFilters();
                    _this.changFilter.emit();
                },
                filterExact: function (d) {
                    _this.option.filters = _this.getFilters();
                    _this.changFilter.emit();
                },
                filterFunction: function (d, e) {
                    _this.option.filters = _this.getFilters();
                    _this.changFilter.emit();
                }
            };
        };
        DjAngularChartComponent.prototype.getFilters = function () {
            var filters = this.chart.filters().map(function (d) {
                if (Array.isArray(d)) {
                    return d[0];
                }
                else {
                    return d;
                }
            });
            return filters;
        };
        DjAngularChartComponent.prototype.getTooltipElem = function () {
            if (!this._tooltip || this._tooltip.empty()) {
                this._tooltip = d3__namespace.select('body')
                    .append('div')
                    .attr('class', 'wise-chart-tooltip')
                    .html('')
                    .style('opacity', 0)
                    .style('position', 'absolute')
                    .style('z-index', 10000);
            }
            return this._tooltip;
        };
        DjAngularChartComponent.prototype.renderHighlight = function (chart) {
            var _this = this;
            var g = chart.g();
            var highlight = g.selectAll('g.highlight');
            if (highlight.empty()) {
                highlight = g.insert('g', ':first-child')
                    .attr('class', 'highlight')
                    .attr('transform', "translate(" + this.chart.margins().left + "," + this.chart.margins().top + ")");
            }
            var sections = highlight.selectAll('rect.section').data(this.option.highlight);
            sections.enter()
                .append('rect')
                .attr('class', function (d, i) { return "section _" + i; })
                .attr('fill', function (d) { return d.color || 'blue'; })
                .attr('fill-opacity', function (d) { return d.opacity || .3; })
                .attr('stroke', '#fff')
                .attr('x', function (d) {
                var domain = d.domain;
                var x0;
                // @ts-ignore
                if (_this.option.xAxisOption.type === 'date') {
                    // @ts-ignore
                    var dateFormat = _this.option.xAxisOption.dateFormat;
                    if (domain[0].valueOf) {
                        x0 = domain[0].valueOf();
                    }
                    else {
                        x0 = moment__default['default'](domain[0], dateFormat).valueOf();
                    }
                }
                else {
                    x0 = domain[0];
                }
                return _this.chart.x()(x0);
            })
                .attr('y', 0)
                .attr('height', this.chart.yAxisHeight())
                .attr('width', function (d) {
                var domain = d.domain;
                var x0, x1;
                // @ts-ignore
                if (_this.option.xAxisOption.type === 'date') {
                    // @ts-ignore
                    var dateFormat = _this.option.xAxisOption.dateFormat;
                    x0 = moment__default['default'](domain[0], dateFormat).valueOf();
                    x1 = moment__default['default'](domain[1], dateFormat).valueOf();
                }
                else {
                    x0 = domain[0];
                    x1 = domain[1];
                }
                var x = _this.chart.x()(x0);
                return _this.chart.x()(x1) - x;
            });
            dc.transition(sections, this.chart.transitionDuration(), this.chart.transitionDelay())
                .attr('fill', function (d) { return d.color || 'blue'; })
                .attr('fill-opacity', function (d) { return d.opacity || .3; })
                .attr('stroke', '#fff')
                .attr('x', function (d) {
                var domain = d.domain;
                var x0;
                // @ts-ignore
                if (_this.option.xAxisOption.type === 'date') {
                    // @ts-ignore
                    var dateFormat = _this.option.xAxisOption.dateFormat;
                    x0 = moment__default['default'](domain[0], dateFormat).valueOf();
                }
                else {
                    x0 = domain[0];
                }
                return _this.chart.x()(x0);
            })
                .attr('width', function (d) {
                var domain = d.domain;
                var x0, x1;
                // @ts-ignore
                if (_this.option.xAxisOption.type === 'date') {
                    // @ts-ignore
                    var dateFormat = _this.option.xAxisOption.dateFormat;
                    x0 = moment__default['default'](domain[0], dateFormat).valueOf();
                    x1 = moment__default['default'](domain[1], dateFormat).valueOf();
                }
                else {
                    x0 = domain[0];
                    x1 = domain[1];
                }
                var x = _this.chart.x()(x0);
                return _this.chart.x()(x1) - x;
            });
            dc.transition(sections.exit(), this.chart.transitionDuration(), this.chart.transitionDelay()).attr('opacity', 0).remove();
        };
        DjAngularChartComponent.prototype.commaSeparateNumber = function (value) {
            if (!value) {
                return '';
            }
            while (/(\d+)(\d{3})/.test(value.toString())) {
                value = value.toString().replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1,');
            }
            return value;
        };
        return DjAngularChartComponent;
    }());
    DjAngularChartComponent.ɵfac = i0__namespace.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "12.1.1", ngImport: i0__namespace, type: DjAngularChartComponent, deps: [{ token: i0__namespace.ElementRef }, { token: i0__namespace.NgZone }], target: i0__namespace.ɵɵFactoryTarget.Component });
    DjAngularChartComponent.ɵcmp = i0__namespace.ɵɵngDeclareComponent({ minVersion: "12.0.0", version: "12.1.1", type: DjAngularChartComponent, selector: "dj-chart", inputs: { option: "option" }, outputs: { changFilter: "changFilter", rendered: "rendered" }, ngImport: i0__namespace, template: "", isInline: true, styles: ["::ng-deep dj-chart svg.wise-chart-cloud text{font-family:Noto Sans KR,Nanum Gothic Coding,SpoqaHanSans,sans-serif!important;cursor:pointer}::ng-deep dj-chart svg.wise-chart-cloud text:hover{opacity:.5}::ng-deep dj-chart .axis line,::ng-deep dj-chart .axis path{fill:none;stroke:#000;shape-rendering:crispEdges}::ng-deep dj-chart .drag rect.extent{fill:#008bff;fill-opacity:.2}::ng-deep dj-chart .x-axis-label,::ng-deep dj-chart .y-axis-label{opacity:.5;font-size:11px!important}::ng-deep dj-chart g.dc-legend{font-size:15px}::ng-deep dj-chart app-wise-chart.radar{margin:0!important}::ng-deep dj-chart app-wise-chart .svg-vis .level-labels{font-size:9px}::ng-deep dj-chart app-wise-chart .svg-vis.radarAxis .axis-labels{font-size:9px}::ng-deep dj-chart .ntnChart .y.axis .tick text{font-size:9px}::ng-deep dj-chart.dc-chart .axis text,::ng-deep dj-chart.dc-chart .bar_group text.text{font-size:9px;font-family:Helvetica Neue,Roboto,Arial,Droid Sans,sans-serif}::ng-deep dj-chart .test-result-tc g.dc-legend{font-size:11px}::ng-deep dj-chart .annotation{font-size:100%;font-weight:inherit}::ng-deep dj-chart.dc-chart path.dc-symbol,::ng-deep dj-chart .dc-legend g.dc-legend-item.fadeout{fill-opacity:.5;stroke-opacity:.5}::ng-deep dj-chart.dc-chart rect.bar{stroke:none;cursor:pointer}::ng-deep dj-chart.dc-chart rect.bar:hover{fill-opacity:.5}::ng-deep dj-chart.dc-chart rect.deselected{stroke:none;fill:#ccc}::ng-deep dj-chart.dc-chart .pie-slice{fill:#fff;font-size:12px;cursor:pointer}::ng-deep dj-chart.dc-chart .pie-slice.external{fill:#000}::ng-deep dj-chart.dc-chart .pie-slice.highlight,::ng-deep dj-chart.dc-chart .pie-slice :hover{fill-opacity:.8}::ng-deep dj-chart.dc-chart .pie-path{fill:none;stroke-width:2px;stroke:#000;opacity:.4}::ng-deep dj-chart.dc-chart .selected circle,::ng-deep dj-chart.dc-chart .selected path{stroke-width:3;stroke:#ccc;fill-opacity:1}::ng-deep dj-chart.dc-chart .deselected circle,::ng-deep dj-chart.dc-chart .deselected path{stroke:none;fill-opacity:.5;fill:#ccc}::ng-deep dj-chart.dc-chart .axis line,::ng-deep dj-chart.dc-chart .axis path{fill:none;stroke:#000;shape-rendering:crispEdges}::ng-deep dj-chart.dc-chart .axis text{font:10px sans-serif}::ng-deep dj-chart.dc-chart .axis .grid-line,::ng-deep dj-chart.dc-chart .axis .grid-line line,::ng-deep dj-chart.dc-chart .grid-line,::ng-deep dj-chart.dc-chart .grid-line line{fill:none;stroke:#ccc;shape-rendering:crispEdges}::ng-deep dj-chart.dc-chart .brush rect.selection{fill:#4682b4;fill-opacity:.125}::ng-deep dj-chart.dc-chart .brush .custom-brush-handle{fill:#eee;stroke:#666;cursor:ew-resize}::ng-deep dj-chart.dc-chart path.line{fill:none;stroke-width:1.5px}::ng-deep dj-chart.dc-chart path.area{fill-opacity:.3;stroke:none}::ng-deep dj-chart.dc-chart path.highlight{stroke-width:3;fill-opacity:1;stroke-opacity:1}::ng-deep dj-chart.dc-chart g.state{cursor:pointer}::ng-deep dj-chart.dc-chart g.state :hover{fill-opacity:.8}::ng-deep dj-chart.dc-chart g.state path{stroke:#fff}::ng-deep dj-chart.dc-chart g.deselected path{fill:grey}::ng-deep dj-chart.dc-chart g.deselected text{display:none}::ng-deep dj-chart.dc-chart g.row rect{fill-opacity:.8;cursor:pointer}::ng-deep dj-chart.dc-chart g.row rect:hover{fill-opacity:.6}::ng-deep dj-chart.dc-chart g.row text{fill:#fff;font-size:12px;cursor:pointer}::ng-deep dj-chart.dc-chart g.dc-tooltip path{fill:none;stroke:grey;stroke-opacity:.8}::ng-deep dj-chart.dc-chart g.county path{stroke:#fff;fill:none}::ng-deep dj-chart.dc-chart g.debug rect{fill:#00f;fill-opacity:.2}::ng-deep dj-chart.dc-chart g.axis text{-webkit-touch-callout:none;-webkit-user-select:none;user-select:none;pointer-events:none}::ng-deep dj-chart.dc-chart .node{font-size:.7em;cursor:pointer}::ng-deep dj-chart.dc-chart .node :hover{fill-opacity:.8}::ng-deep dj-chart.dc-chart .bubble{stroke:none;fill-opacity:.6}::ng-deep dj-chart.dc-chart .highlight{fill-opacity:1;stroke-opacity:1}::ng-deep dj-chart.dc-chart .fadeout{fill-opacity:.2;stroke-opacity:.2}::ng-deep dj-chart.dc-chart .box text{font:10px sans-serif;-webkit-touch-callout:none;-webkit-user-select:none;user-select:none;pointer-events:none}::ng-deep dj-chart.dc-chart .box line{fill:#fff}::ng-deep dj-chart.dc-chart .box circle,::ng-deep dj-chart.dc-chart .box line,::ng-deep dj-chart.dc-chart .box rect{stroke:#000;stroke-width:1.5px}::ng-deep dj-chart.dc-chart .box .center{stroke-dasharray:3,3}::ng-deep dj-chart.dc-chart .box .data{stroke:none;stroke-width:0px}::ng-deep dj-chart.dc-chart .box .outlier{fill:none;stroke:#ccc}::ng-deep dj-chart.dc-chart .box .outlierBold{fill:red;stroke:none}::ng-deep dj-chart.dc-chart .box.deselected{opacity:.5}::ng-deep dj-chart.dc-chart .box.deselected .box{fill:#ccc}::ng-deep dj-chart.dc-chart .symbol{stroke-width:1.5px;cursor:pointer}::ng-deep dj-chart.dc-chart .heatmap .box-group.deselected rect{stroke:none;fill-opacity:.5;fill:#ccc}::ng-deep dj-chart.dc-chart .heatmap g.axis text{pointer-events:all;cursor:pointer}::ng-deep dj-chart.dc-chart .empty-chart .pie-slice{cursor:default}::ng-deep dj-chart.dc-chart .empty-chart .pie-slice path{fill:#fee;cursor:default}::ng-deep dj-chart .dc-data-count{float:right;margin-top:15px;margin-right:15px}::ng-deep dj-chart .dc-data-count .filter-count,::ng-deep dj-chart .dc-data-count .total-count{color:#3182bd;font-weight:700}::ng-deep dj-chart .dc-legend{font-size:11px}::ng-deep dj-chart .dc-legend .dc-legend-item{cursor:pointer}::ng-deep dj-chart .dc-legend g.dc-legend-item.selected{fill:blue}::ng-deep dj-chart .dc-hard .number-display{float:none}::ng-deep dj-chart div.dc-html-legend{overflow-y:auto;overflow-x:hidden;height:inherit;float:right;padding-right:2px}::ng-deep dj-chart div.dc-html-legend .dc-legend-item-horizontal{display:inline-block;margin-left:5px;margin-right:5px;cursor:pointer}::ng-deep dj-chart div.dc-html-legend .dc-legend-item-horizontal.selected{background-color:#3182bd;color:#fff}::ng-deep dj-chart div.dc-html-legend .dc-legend-item-vertical{display:block;margin-top:5px;padding-top:1px;padding-bottom:1px;cursor:pointer}::ng-deep dj-chart div.dc-html-legend .dc-legend-item-vertical.selected{background-color:#3182bd;color:#fff}::ng-deep dj-chart div.dc-html-legend .dc-legend-item-color{display:table-cell;width:12px;height:12px}::ng-deep dj-chart div.dc-html-legend .dc-legend-item-label{line-height:12px;display:table-cell;vertical-align:middle;padding-left:3px;padding-right:3px;font-size:.75em}::ng-deep dj-chart .dc-html-legend-container{height:inherit}::ng-deep .wise-chart-tooltip{position:relative;min-width:30px;min-height:30px;padding:8px;border-radius:4px;color:#fff}::ng-deep .wise-chart-tooltip:after,::ng-deep .wise-chart-tooltip:before{border:solid #0000;content:\" \";height:0;width:0;position:absolute;pointer-events:none}::ng-deep .wise-chart-tooltip:after{border-color:#fff0;border-width:5px;margin-top:-5px}::ng-deep .wise-chart-tooltip:before{border-color:#0000;border-width:6px;margin-top:-6px}::ng-deep .wise-chart-tooltip.top:after,::ng-deep .wise-chart-tooltip.top:before{top:10px}::ng-deep .wise-chart-tooltip.bottom:after,::ng-deep .wise-chart-tooltip.bottom:before{bottom:4px}::ng-deep .wise-chart-tooltip:after,::ng-deep .wise-chart-tooltip:before{bottom:-10px;border-top-color:inherit;left:calc(50% - 6px)}"] });
    i0__namespace.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "12.1.1", ngImport: i0__namespace, type: DjAngularChartComponent, decorators: [{
                type: i0.Component,
                args: [{
                        selector: 'dj-chart',
                        template: "",
                        styleUrls: ['./dj-angular-chart.component.scss']
                    }]
            }], ctorParameters: function () { return [{ type: i0__namespace.ElementRef }, { type: i0__namespace.NgZone }]; }, propDecorators: { option: [{
                    type: i0.Input,
                    args: ['option']
                }], changFilter: [{
                    type: i0.Output
                }], rendered: [{
                    type: i0.Output
                }] } });

    var DjAngularChartModule = /** @class */ (function () {
        function DjAngularChartModule() {
        }
        return DjAngularChartModule;
    }());
    DjAngularChartModule.ɵfac = i0__namespace.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "12.1.1", ngImport: i0__namespace, type: DjAngularChartModule, deps: [], target: i0__namespace.ɵɵFactoryTarget.NgModule });
    DjAngularChartModule.ɵmod = i0__namespace.ɵɵngDeclareNgModule({ minVersion: "12.0.0", version: "12.1.1", ngImport: i0__namespace, type: DjAngularChartModule, declarations: [DjAngularChartComponent], exports: [DjAngularChartComponent] });
    DjAngularChartModule.ɵinj = i0__namespace.ɵɵngDeclareInjector({ minVersion: "12.0.0", version: "12.1.1", ngImport: i0__namespace, type: DjAngularChartModule, imports: [[]] });
    i0__namespace.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "12.1.1", ngImport: i0__namespace, type: DjAngularChartModule, decorators: [{
                type: i0.NgModule,
                args: [{
                        declarations: [
                            DjAngularChartComponent,
                        ],
                        imports: [],
                        exports: [
                            DjAngularChartComponent,
                        ]
                    }]
            }] });

    var AxisOption = /** @class */ (function () {
        function AxisOption(fields) {
            var _this = this;
            var fieldList = ['axisLabel', 'color', 'domain', 'hide', 'series', 'errorBar', 'type', 'size', 'tickFormat',
                'ticks', 'renderArea', 'smooth', 'dashStyle', 'lineWidth'];
            fieldList.forEach(function (key) {
                if (fields[key] !== undefined) {
                    // @ts-ignore
                    _this[key] = fields[key];
                }
            });
        }
        AxisOption.prototype.setDomain = function (data) {
            // @ts-ignore
            this.domain = [d3__namespace.min(data, function (d) { return d.value; }), d3__namespace.max(data, function (d) { return d.value; })];
        };
        AxisOption.prototype.setAxisLabel = function (axisLabel) {
            this.axisLabel = axisLabel;
        };
        return AxisOption;
    }());

    var moment = moment__namespace;
    var DjChartType;
    (function (DjChartType) {
        DjChartType["PIE_CHART"] = "pieChart";
        DjChartType["CLOUD_CHART"] = "cloudChart";
        DjChartType["COMPOSITE"] = "composite";
        DjChartType["HEATMAP"] = "heatmap";
        DjChartType["DC_CHART"] = "dcChart";
        DjChartType["STACKED_BAR"] = "stackedBar";
    })(DjChartType || (DjChartType = {}));
    var AxisOptionType;
    (function (AxisOptionType) {
        AxisOptionType["DATE"] = "date";
        AxisOptionType["LINEAR"] = "linear";
        AxisOptionType["ORDINAL"] = "ordinal"; // x축을 있는 그대로 표기할때 사용
    })(AxisOptionType || (AxisOptionType = {}));
    var DjChartOption = /** @class */ (function () {
        function DjChartOption(chartOption) {
            var _this = this;
            this.elasticLeftMargin = true;
            this.elasticRightMargin = true;
            this._legendObj = {};
            var defaultOption = {
                cloudChart: ['type', 'onClick', 'onClickEvent', 'onFilterChanged', 'legends', 'colors', 'padding', 'dimension', 'group', 'tooltip'],
                pieChart: ['type', 'onClick', 'onClickEvent', 'onFilterChanged', 'legends', 'colors', 'slicesCap', 'slicesPercent', 'radius',
                    'externalLabels', 'innerRadius', 'dimension', 'group', 'tooltip'],
                composite: ['type', 'onClick', 'onClickEvent', 'onFilterChanged', 'legends', 'colors', 'seriesTypes', 'yAxisOptions', 'yAxisLabel',
                    'xAxisOption', 'xAxisLabel', 'dimension', 'group', 'tooltip', 'seriesOptions', 'margins', 'highlight', 'elasticLeftMargin',
                    'elasticRightMargin']
            };
            if (chartOption && chartOption.type) {
                // @ts-ignore
                if (defaultOption[chartOption.type]) {
                    // @ts-ignore
                    defaultOption[chartOption.type].forEach(function (field) {
                        // @ts-ignore
                        if (chartOption[field] !== undefined) {
                            // @ts-ignore
                            _this[field] = chartOption[field];
                        }
                    });
                }
                if (chartOption.type === DjChartType.DC_CHART) {
                    Object.keys(chartOption).forEach(function (key) {
                        // @ts-ignore
                        _this[key] = chartOption[key];
                    });
                }
                if (chartOption.data) {
                    this.setData(chartOption.data);
                }
            }
        }
        DjChartOption.prototype.setData = function (data) {
            var _this = this;
            if (this.type === DjChartType.COMPOSITE && this.xAxisOption && this.xAxisOption.type === 'date') {
                this.data = data;
                this.data.forEach(function (d) {
                    // @ts-ignore
                    d.key[1] = moment(d.key[1], _this.xAxisOption.dateFormat).toDate();
                });
            }
            else {
                this.data = data;
            }
        };
        DjChartOption.prototype.setAxisOption = function () {
            var _this = this;
            if (this.yAxisOptions) {
                var data_1;
                var seriesTypes_1 = this.seriesTypes || {};
                var axisOption_1 = [];
                if (this.data !== undefined) {
                    data_1 = this.data;
                }
                else {
                    data_1 = this.group().all();
                }
                this.yAxisOptions.forEach(function (axis) {
                    // @ts-ignore
                    var filterData = data_1.filter(function (d) {
                        if (axis.keys.indexOf(d.key[0]) > -1) {
                            return true;
                        }
                    });
                    var max = d3__namespace.max(filterData, function (d) { return d.value; });
                    var min = d3__namespace.min(filterData, function (d) { return d.value; }) || 0;
                    axis.keys.forEach(function (key, i) {
                        var _option = {
                            axisLabel: axis.axisLabel,
                            domain: axis.domain ? axis.domain : [min, max],
                            hide: i,
                            series: key,
                            type: seriesTypes_1[key] || 'line',
                            size: axis.size || 6,
                        };
                        if (_this.seriesOptions && _this.seriesOptions[key]) {
                            Object.keys(_this.seriesOptions[key]).forEach(function (op) {
                                // @ts-ignore
                                _option[op] = _this.seriesOptions[key][op];
                            });
                        }
                        if (_this.colors && _this.colors[key]) {
                            _option['color'] = _this.colors[key];
                        }
                        if (axis.prevTickText || axis.nextTickText) {
                            _option['tickFormat'] = function (d) {
                                var tick = '';
                                if (axis.prevTickText) {
                                    tick += axis.prevTickText;
                                }
                                tick += _this.commaSeparateNumber(d) || 0;
                                if (axis.nextTickText) {
                                    tick += axis.nextTickText;
                                }
                                return tick;
                            };
                        }
                        if (axis.tickFormat) {
                            _option['tickFormat'] = axis.tickFormat;
                        }
                        axisOption_1.push(new AxisOption(_option));
                    });
                });
                return this.axisOption = axisOption_1;
            }
            return this.axisOption = [];
        };
        DjChartOption.prototype.getKeys = function () {
            var keys = this.data.map(function (d) {
                if (Array.isArray(d.key)) {
                    return d.key[0];
                }
                return d.key;
            });
            return ___namespace.uniq(keys);
        };
        DjChartOption.prototype.getLegends = function () {
            if (!this._legendObj) {
                this.setLegendObj();
            }
            return this._legendObj;
        };
        DjChartOption.prototype.setFilters = function (filters) {
            this.setLegendObj();
        };
        DjChartOption.prototype.filterAll = function () {
            this.chart.filterAll();
        };
        DjChartOption.prototype.setLegendObj = function () {
            var _this = this;
            this._legendObj = [];
            this.getKeys().forEach(function (key) {
                var legend = {
                    key: key,
                    // @ts-ignore
                    name: _this.legends[key] || key,
                    filter: function () { return _this.chart.filter(key); },
                    color: function () {
                        var defaultColor = _this.chart.getColor(key);
                        // @ts-ignore
                        return _this.colors ? _this.colors[key] || defaultColor : defaultColor;
                    }
                };
                _this._legendObj.push(legend);
            });
        };
        DjChartOption.prototype.commaSeparateNumber = function (value) {
            if (!value) {
                return '';
            }
            while (/(\d+)(\d{3})/.test(value.toString())) {
                value = value.toString().replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1,');
            }
            return value;
        };
        return DjChartOption;
    }());

    /*
     * Public API Surface of dj-angular-chart
     */

    /**
     * Generated bundle index. Do not edit.
     */

    exports.DjAngularChartComponent = DjAngularChartComponent;
    exports.DjAngularChartModule = DjAngularChartModule;
    exports.DjAngularChartService = DjAngularChartService;
    exports.DjChartOption = DjChartOption;

    Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=dj-angular-chart.umd.js.map
