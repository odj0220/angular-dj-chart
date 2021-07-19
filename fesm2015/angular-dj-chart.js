import * as i0 from '@angular/core';
import { Injectable, EventEmitter, Component, Input, Output, NgModule } from '@angular/core';
import * as d3 from 'd3';
import { isArray } from 'rxjs/internal-compatibility';
import * as moment$1 from 'moment';
import moment__default from 'moment';
import * as dc from 'dc';
import { utils as utils$1, pluck, printers, instanceOfChart, registerChart, redrawAll, renderAll, events, deregisterChart, logger, units, transition, filters, optionalTransition } from 'dc';
import * as _d3Cloud from 'd3-cloud';
import * as _ from 'lodash';
import { select } from 'd3-selection';
import { dispatch } from 'd3-dispatch';
import { schemeCategory10 } from 'd3-scale-chromatic';
import { timeDay } from 'd3-time';
import { min, max } from 'd3-array';
import { scaleOrdinal, scaleQuantize, scaleBand, scaleLinear } from 'd3-scale';
import { axisBottom, axisRight, axisLeft } from 'd3-axis';
import { zoom, zoomIdentity } from 'd3-zoom';
import { brushX } from 'd3-brush';
import { interpolateHcl } from 'd3-interpolate';

class AngularDjChartService {
    constructor() { }
}
AngularDjChartService.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "12.1.1", ngImport: i0, type: AngularDjChartService, deps: [], target: i0.ɵɵFactoryTarget.Injectable });
AngularDjChartService.ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "12.1.1", ngImport: i0, type: AngularDjChartService, providedIn: 'root' });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "12.1.1", ngImport: i0, type: AngularDjChartService, decorators: [{
            type: Injectable,
            args: [{
                    providedIn: 'root'
                }]
        }], ctorParameters: function () { return []; } });

class DcChart {
    constructor() {
        Object.keys(dc).forEach(key => {
            // @ts-ignore
            this[key] = dc[key];
        });
    }
}

class InvalidStateException extends Error {
}
class BadArgumentException extends Error {
}
const constants$2 = {
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
const _defaultFilterHandler = (dimension, filters) => {
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
        dimension.filterFunction((d) => {
            for (let i = 0; i < filters.length; i++) {
                const filter = filters[i];
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
const _defaultHasFilterHandler = (filters, filter) => {
    if (filter === null || typeof (filter) === 'undefined') {
        return filters.length > 0;
    }
    return filters.some(f => filter <= f && filter >= f);
};
const _defaultRemoveFilterHandler = (filters, filter) => {
    for (let i = 0; i < filters.length; i++) {
        if (filters[i] <= filter && filters[i] >= filter) {
            filters.splice(i, 1);
            break;
        }
    }
    return filters;
};
const _defaultAddFilterHandler = (filters, filter) => {
    filters.push(filter);
    return filters;
};
const _defaultResetFilterHandler = (filters) => [];
class BaseMixin {
    constructor() {
        this._filterHandler = _defaultFilterHandler;
        this._hasFilterHandler = _defaultHasFilterHandler;
        this._removeFilterHandler = _defaultRemoveFilterHandler;
        this._addFilterHandler = _defaultAddFilterHandler;
        this._resetFilterHandler = _defaultResetFilterHandler;
        this.__dcFlag__ = utils$1.uniqueId();
        this._dimension = undefined;
        this._group = undefined;
        this._anchor = undefined;
        this._root = undefined;
        this._svg = undefined;
        this._isChild = undefined;
        this._minWidth = 100;
        this._defaultWidthCalc = (element) => {
            const width = element && element.getBoundingClientRect && element.getBoundingClientRect().width;
            return (width && width > this._minWidth) ? width : this._minWidth;
        };
        this._widthCalc = this._defaultWidthCalc;
        this._minHeight = 100;
        this._defaultHeightCalc = (element) => {
            const height = element && element.getBoundingClientRect && element.getBoundingClientRect().height;
            return (height && height > this._minHeight) ? height : this._minHeight;
        };
        this._heightCalc = this._defaultHeightCalc;
        this._useViewBoxResizing = false;
        this._keyAccessor = pluck('key');
        this._valueAccessor = pluck('value');
        this._label = pluck('key');
        this._ordering = pluck('key');
        this._renderLabel = false;
        // @ts-ignore
        this._title = d => `${this.keyAccessor()(d)}: ${this.valueAccessor()(d)}`;
        this._renderTitle = true;
        this._controlsUseVisibility = false;
        this._transitionDuration = 750;
        this._transitionDelay = 0;
        this._filterPrinter = printers.filters;
        this._mandatoryAttributesList = ['dimension', 'group'];
        this._chartGroup = constants$2.DEFAULT_CHART_GROUP;
        this._listeners = dispatch('preRender', 'postRender', 'preRedraw', 'postRedraw', 'filtered', 'zoomed', 'renderlet', 'pretransition');
        this._legend = undefined;
        this._commitHandler = undefined;
        this._defaultData = (group) => group.all();
        this._data = this._defaultData;
        this._filters = [];
    }
    height(height) {
        if (height === undefined) {
            if (!utils$1.isNumber(this._height)) {
                // only calculate once
                this._height = this._heightCalc(this._root.node());
            }
            return this._height;
        }
        this._heightCalc = height ? (typeof height === 'function' ? height : utils$1.constant(height)) : this._defaultHeightCalc;
        this._height = undefined;
        return this;
    }
    width(width) {
        if (width === undefined) {
            if (!utils$1.isNumber(this._width)) {
                // only calculate once
                this._width = this._widthCalc(this._root.node());
            }
            return this._width;
        }
        this._widthCalc = width ? (typeof width === 'function' ? width : utils$1.constant(width)) : this._defaultWidthCalc;
        this._width = undefined;
        return this;
    }
    minWidth(minWidth) {
        if (minWidth === undefined) {
            return this._minWidth;
        }
        this._minWidth = minWidth;
        return this;
    }
    minHeight(minHeight) {
        if (minHeight === undefined) {
            return this._minHeight;
        }
        this._minHeight = minHeight;
        return this;
    }
    useViewBoxResizing(useViewBoxResizing) {
        if (useViewBoxResizing === undefined) {
            return this._useViewBoxResizing;
        }
        this._useViewBoxResizing = useViewBoxResizing;
        return this;
    }
    dimension(dimension) {
        if (dimension === undefined) {
            return this._dimension;
        }
        this._dimension = dimension;
        this.expireCache();
        return this;
    }
    data(callback) {
        if (callback === undefined) {
            return this._data(this._group);
        }
        this._data = typeof callback === 'function' ? callback : utils$1.constant(callback);
        this.expireCache();
        return this;
    }
    group(group, name) {
        if (group === undefined) {
            return this._group;
        }
        this._group = group;
        this._groupName = name;
        this.expireCache();
        return this;
    }
    ordering(orderFunction) {
        if (orderFunction === undefined) {
            return this._ordering;
        }
        this._ordering = orderFunction;
        this.expireCache();
        return this;
    }
    _computeOrderedGroups(data) {
        // clone the array before sorting, otherwise Array.sort sorts in-place
        return Array.from(data).sort((a, b) => this._ordering(a) - this._ordering(b));
    }
    filterAll() {
        return this.filter(null);
    }
    select(sel) {
        return this._root.select(sel);
    }
    selectAll(sel) {
        return this._root ? this._root.selectAll(sel) : null;
    }
    anchor(parent, chartGroup) {
        if (parent === undefined) {
            return this._anchor;
        }
        if (instanceOfChart(parent)) {
            this._anchor = parent.anchor();
            // @ts-ignore
            if (this._anchor.children) { // is _anchor a div?
                this._anchor = `#${parent.anchorName()}`;
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
            this._root = select(this._anchor);
            this._root.classed(constants$2.CHART_CLASS, true);
            // @ts-ignore
            registerChart(this, chartGroup);
            this._isChild = false;
        }
        else {
            throw new BadArgumentException('parent must be defined');
        }
        this._chartGroup = chartGroup;
        return this;
    }
    anchorName() {
        const a = this.anchor();
        if (a && a.id) {
            return a.id;
        }
        if (a && a.replace) {
            return a.replace('#', '');
        }
        return `dc-chart${this.chartID()}`;
    }
    root(rootElement) {
        if (rootElement === undefined) {
            return this._root;
        }
        this._root = rootElement;
        return this;
    }
    svg(svgElement) {
        if (svgElement === undefined) {
            return this._svg;
        }
        this._svg = svgElement;
        return this;
    }
    resetSvg() {
        this.select('svg').remove();
        return this.generateSvg();
    }
    sizeSvg() {
        if (this._svg) {
            if (!this._useViewBoxResizing) {
                this._svg
                    .attr('width', this.width())
                    .attr('height', this.height());
            }
            else if (!this._svg.attr('viewBox')) {
                this._svg
                    .attr('viewBox', `0 0 ${this.width()} ${this.height()}`);
            }
        }
    }
    generateSvg() {
        this._svg = this.root().append('svg');
        this.sizeSvg();
        return this._svg;
    }
    filterPrinter(filterPrinterFunction) {
        if (filterPrinterFunction === undefined) {
            return this._filterPrinter;
        }
        this._filterPrinter = filterPrinterFunction;
        return this;
    }
    controlsUseVisibility(controlsUseVisibility) {
        if (controlsUseVisibility === undefined) {
            return this._controlsUseVisibility;
        }
        this._controlsUseVisibility = controlsUseVisibility;
        return this;
    }
    turnOnControls() {
        if (this._root) {
            const attribute = this.controlsUseVisibility() ? 'visibility' : 'display';
            this.selectAll('.reset').style(attribute, null);
            this.selectAll('.filter').text(this._filterPrinter(this.filters())).style(attribute, null);
        }
        return this;
    }
    turnOffControls() {
        if (this._root) {
            const attribute = this.controlsUseVisibility() ? 'visibility' : 'display';
            const value = this.controlsUseVisibility() ? 'hidden' : 'none';
            this.selectAll('.reset').style(attribute, value);
            this.selectAll('.filter').style(attribute, value).text(this.filter());
        }
        return this;
    }
    transitionDuration(duration) {
        if (duration === undefined) {
            return this._transitionDuration;
        }
        this._transitionDuration = duration;
        return this;
    }
    transitionDelay(delay) {
        if (delay === undefined) {
            return this._transitionDelay;
        }
        this._transitionDelay = delay;
        return this;
    }
    _mandatoryAttributes(_) {
        if (_ === undefined) {
            return this._mandatoryAttributesList;
        }
        this._mandatoryAttributesList = _;
        return this;
    }
    checkForMandatoryAttributes(a) {
        // @ts-ignore
        if (!this[a] || !this[a]()) {
            throw new InvalidStateException(`Mandatory attribute chart.${a} is missing on chart[#${this.anchorName()}]`);
        }
    }
    render() {
        this._height = this._width = undefined; // force recalculate
        this._listeners.call('preRender', this, this);
        if (this._mandatoryAttributesList) {
            this._mandatoryAttributesList.forEach((e) => this.checkForMandatoryAttributes(e));
        }
        const result = this._doRender();
        if (this._legend) {
            this._legend.render();
        }
        this._activateRenderlets('postRender');
        return result;
    }
    _activateRenderlets(event) {
        this._listeners.call('pretransition', this, this);
        if (this.transitionDuration() > 0 && this._svg) {
            this._svg.transition().duration(this.transitionDuration()).delay(this.transitionDelay())
                .on('end', () => {
                this._listeners.call('renderlet', this, this);
                if (event) {
                    this._listeners.call(event, this, this);
                }
            });
        }
        else {
            this._listeners.call('renderlet', this, this);
            if (event) {
                this._listeners.call(event, this, this);
            }
        }
    }
    redraw() {
        this.sizeSvg();
        this._listeners.call('preRedraw', this, this);
        const result = this._doRedraw();
        if (this._legend) {
            this._legend.render();
        }
        this._activateRenderlets('postRedraw');
        return result;
    }
    commitHandler(commitHandler) {
        if (commitHandler === undefined) {
            return this._commitHandler;
        }
        this._commitHandler = commitHandler;
        return this;
    }
    redrawGroup() {
        if (this._commitHandler) {
            this._commitHandler(false, (error, result) => {
                if (error) {
                    console.log(error);
                }
                else {
                    // @ts-ignore
                    redrawAll(this.chartGroup());
                }
            });
        }
        else {
            // @ts-ignore
            redrawAll(this.chartGroup());
        }
        return this;
    }
    renderGroup() {
        if (this._commitHandler) {
            this._commitHandler(false, (error, result) => {
                if (error) {
                    console.log(error);
                }
                else {
                    // @ts-ignore
                    renderAll(this.chartGroup());
                }
            });
        }
        else {
            // @ts-ignore
            renderAll(this.chartGroup());
        }
        return this;
    }
    _invokeFilteredListener(f) {
        if (f !== undefined) {
            this._listeners.call('filtered', this, this, f);
        }
    }
    _invokeZoomedListener() {
        this._listeners.call('zoomed', this, this);
    }
    hasFilterHandler(hasFilterHandler) {
        if (hasFilterHandler === undefined) {
            return this._hasFilterHandler;
        }
        this._hasFilterHandler = hasFilterHandler;
        return this;
    }
    hasFilter(filter) {
        return this._hasFilterHandler(this._filters, filter);
    }
    removeFilterHandler(removeFilterHandler) {
        if (removeFilterHandler === undefined) {
            return this._removeFilterHandler;
        }
        this._removeFilterHandler = removeFilterHandler;
        return this;
    }
    addFilterHandler(addFilterHandler) {
        if (!arguments.length) {
            return this._addFilterHandler;
        }
        this._addFilterHandler = addFilterHandler;
        return this;
    }
    resetFilterHandler(resetFilterHandler) {
        if (!arguments.length) {
            return this._resetFilterHandler;
        }
        this._resetFilterHandler = resetFilterHandler;
        return this;
    }
    applyFilters(filters) {
        // @ts-ignore
        if (this.dimension() && this.dimension().filter) {
            const fs = this._filterHandler(this.dimension(), filters);
            if (fs) {
                filters = fs;
            }
        }
        return filters;
    }
    replaceFilter(filter) {
        this._filters = this._resetFilterHandler(this._filters);
        this.filter(filter);
        return this;
    }
    filter(filter) {
        if (filter === undefined) {
            return this._filters.length > 0 ? this._filters[0] : null;
        }
        let filters = this._filters;
        // @ts-ignore
        if (filter instanceof Array && filter[0] instanceof Array && !filter['isFiltered']) {
            // toggle each filter
            filter[0].forEach(f => {
                if (this._hasFilterHandler(filters, f)) {
                    filters = this._removeFilterHandler(filters, f);
                }
                else {
                    filters = this._addFilterHandler(filters, f);
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
    }
    filters() {
        return this._filters;
    }
    highlightSelected(e) {
        select(e).classed(constants$2.SELECTED_CLASS, true);
        select(e).classed(constants$2.DESELECTED_CLASS, false);
    }
    fadeDeselected(e) {
        select(e).classed(constants$2.SELECTED_CLASS, false);
        select(e).classed(constants$2.DESELECTED_CLASS, true);
    }
    resetHighlight(e) {
        select(e).classed(constants$2.SELECTED_CLASS, false);
        select(e).classed(constants$2.DESELECTED_CLASS, false);
    }
    onClick(datum, i) {
        // @ts-ignore
        const filter = this.keyAccessor()(datum);
        events.trigger(() => {
            this.filter(filter);
            this.redrawGroup();
        });
    }
    filterHandler(filterHandler) {
        if (!arguments.length) {
            return this._filterHandler;
        }
        this._filterHandler = filterHandler;
        return this;
    }
    // abstract function stub
    _doRender() {
        // do nothing in base, should be overridden by sub-function
        return this;
    }
    _doRedraw() {
        // do nothing in base, should be overridden by sub-function
        return this;
    }
    legendables() {
        // do nothing in base, should be overridden by sub-function
        return [];
    }
    legendHighlight() {
        // do nothing in base, should be overridden by sub-function
    }
    legendReset() {
        // do nothing in base, should be overridden by sub-function
    }
    legendToggle() {
        // do nothing in base, should be overriden by sub-function
    }
    isLegendableHidden() {
        // do nothing in base, should be overridden by sub-function
        return false;
    }
    keyAccessor(keyAccessor) {
        if (keyAccessor === undefined) {
            return this._keyAccessor;
        }
        this._keyAccessor = keyAccessor;
        return this;
    }
    valueAccessor(valueAccessor) {
        if (valueAccessor === undefined) {
            return this._valueAccessor;
        }
        this._valueAccessor = valueAccessor;
        return this;
    }
    label(labelFunction, enableLabels) {
        if (!arguments.length) {
            return this._label;
        }
        this._label = labelFunction;
        if ((enableLabels === undefined) || enableLabels) {
            this._renderLabel = true;
        }
        return this;
    }
    renderLabel(renderLabel) {
        if (!arguments.length) {
            return this._renderLabel;
        }
        this._renderLabel = renderLabel;
        return this;
    }
    title(titleFunction) {
        if (!arguments.length) {
            return this._title;
        }
        this._title = titleFunction;
        return this;
    }
    renderTitle(renderTitle) {
        if (!arguments.length) {
            return this._renderTitle;
        }
        this._renderTitle = renderTitle;
        return this;
    }
    chartGroup(chartGroup) {
        if (chartGroup === undefined) {
            return this._chartGroup;
        }
        if (!this._isChild) {
            // @ts-ignore
            deregisterChart(this, this._chartGroup);
        }
        this._chartGroup = chartGroup;
        if (!this._isChild) {
            // @ts-ignore
            registerChart(this, this._chartGroup);
        }
        return this;
    }
    expireCache() {
        // do nothing in base, should be overridden by sub-function
        return this;
    }
    legend(legend) {
        if (legend === undefined) {
            return this._legend;
        }
        this._legend = legend;
        this._legend.parent(this);
        return this;
    }
    chartID() {
        return this.__dcFlag__;
    }
    options(opts) {
        const applyOptions = [
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
        for (const o in opts) {
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
                logger.debug(`Not a valid option setter name: ${o}`);
            }
        }
        return this;
    }
    on(event, listener) {
        this._listeners.on(event, listener);
        return this;
    }
    renderlet(renderletFunction) {
        logger.warnOnce('chart.renderlet has been deprecated. Please use chart.on("renderlet.<renderletKey>", renderletFunction)');
        this.on(`renderlet.${utils$1.uniqueId()}`, renderletFunction);
        return this;
    }
}

const d3Cloud = _d3Cloud;
class CloudChart extends BaseMixin {
    constructor(element, option) {
        super();
        this.element = element;
        this.option = option;
        this._scale = [15, 70];
        this._color = d3.schemeCategory10;
        this._padding = 2;
        this._width = 100;
        this._height = 100;
    }
    render() {
        if (this.svg()) {
            // @ts-ignore
            this.svg().remove();
        }
        this.chartRender();
        return this;
    }
    redraw() {
        this.render();
        return this;
    }
    width(width) {
        if (!width) {
            this._width = this.option.width ? this.option.width : this.element.clientWidth;
            return this._width;
        }
        this._width = width;
        return this;
    }
    height(height) {
        if (!height) {
            this._height = this.option.height ? this.option.height : this.element.clientHeight;
            return this._height;
        }
        this._height = height;
        return this;
    }
    legends(object) {
        if (!object) {
            return this._legends;
        }
        this._legends = object;
        return this;
    }
    padding(padding) {
        if (!padding) {
            return this._padding;
        }
        this._padding = padding;
        return this;
    }
    color(color) {
        if (!color) {
            return this._customColor ? this._customColor : this._color;
        }
        this._customColor = color;
        return this;
    }
    dimension(dimension) {
        if (!dimension) {
            return this._dimension;
        }
        this._dimension = dimension;
        return this;
    }
    group(object) {
        if (!object) {
            return this._group;
        }
        this._group = object;
        return this;
    }
    chartRender() {
        // @ts-ignore
        const data = this._group.all();
        const fontScale = d3.scaleLinear().range(this._scale);
        const domain = [d3.min(data, (d) => d.value), d3.max(data, (d) => d.value)];
        // @ts-ignore
        fontScale.domain(domain);
        // @ts-ignore
        d3Cloud()
            .size([this._width, this._height])
            .words(data)
            .padding(this._padding)
            .rotate(0)
            .font('sans-serif')
            .text((d) => {
            let key = d.key || d.keys;
            key = typeof key === 'string' ? key : key[0];
            if (this._legends && this._legends[key]) {
                key = this._legends[key];
            }
            return key;
        })
            .fontSize((d) => fontScale(d.value))
            .on('end', this.draw.bind(this))
            .start();
    }
    svg() {
        // @ts-ignore
        if (!d3.select(this.element).select('svg')._groups[0][0]) {
            return;
        }
        return d3.select(this.element).select('svg');
    }
    draw(words) {
        const cloud = d3.select(this.element).append('svg')
            .attr('class', 'wise-chart-cloud')
            .attr('width', this._width)
            .attr('height', this._height)
            .append('g')
            .attr('transform', 'translate(' + this._width / 2 + ',' + this._height / 2 + ')')
            .selectAll('text')
            .data(words)
            .enter().append('text')
            .style('font-size', (d) => d.size + 'px')
            .style('font-family', 'sans-serif')
            .style('fill', (d, i) => {
            return this._customColor ? this._customColor[d.key[0]] : this._color[i % this._color.length];
        })
            .style('opacity', (d, i) => {
            if (this['filters']().length) {
                const filters = this['filters']().map(dd => dd.toString());
                if (_.includes(filters, d.key.toString())) {
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
            .attr('transform', (d) => 'translate(' + [d.x, d.y] + ')rotate(' + d.rotate + ')')
            .text((d) => d.text);
        // @ts-ignore
        cloud.on('click', (d, i) => {
            const { key, value } = d;
            this['onClick']({ key, value }, i);
        });
        if (this.option && this.option.tooltip) {
            const tooltip = this.getTooltipElem();
            cloud
                .on('mouseover', data => {
                // @ts-ignore
                const screenX = event.view.innerWidth;
                // @ts-ignore
                const screenY = event.view.innerHeight;
                // @ts-ignore
                const pageX = event.pageX;
                // @ts-ignore
                const pageY = event.pageY;
                const toolX = tooltip.node().clientWidth;
                const toolY = tooltip.node().clientHeight;
                let left = 0, top = 0;
                tooltip.transition()
                    .duration(200)
                    .style('opacity', .9);
                tooltip.html(this.option.tooltip(data));
                setTimeout(() => {
                    if ((screenX - pageX) < tooltip.node().clientWidth) {
                        left = pageX - toolX - 12;
                        tooltip.classed('right', true);
                        tooltip.classed('left', false);
                    }
                    else {
                        left = pageX + 12;
                        tooltip.classed('right', false);
                        tooltip.classed('left', true);
                    }
                    if ((screenY - pageY) < tooltip.node().clientHeight) {
                        top = pageY - toolY + 10;
                        tooltip.classed('bottom', true);
                        tooltip.classed('top', false);
                    }
                    else {
                        top = pageY - 10;
                        tooltip.classed('bottom', false);
                        tooltip.classed('top', true);
                    }
                    tooltip
                        .style('top', top + 'px')
                        .style('left', left + 'px');
                });
            })
                .on('mouseout', data => {
                tooltip.transition()
                    .duration(500)
                    .style('opacity', 0);
            });
        }
    }
    getTooltipElem() {
        if (!this._tooltip || this._tooltip.empty()) {
            this._tooltip = d3.select('body')
                .append('div')
                .attr('class', 'wise-chart-tooltip')
                .html('')
                .style('opacity', 0)
                .style('position', 'absolute');
        }
        return this._tooltip;
    }
}

const config = dc['config'];
const utils = dc['utils'];
const ColorMixin = (Base) => class extends Base {
    constructor() {
        super();
        // @ts-ignore
        this._colors = scaleOrdinal(config.defaultColors());
        this._colorAccessor = (d) => this.keyAccessor()(d);
        this._colorCalculator = undefined;
        {
            const chart = this;
            chart.getColor = function (d, i) {
                return chart._colorCalculator ?
                    chart._colorCalculator.call(this, d, i) :
                    chart._colors(chart._colorAccessor.call(this, d, i));
            };
        }
    }
    calculateColorDomain() {
        const newDomain = [min(this.data(), this.colorAccessor()),
            max(this.data(), this.colorAccessor())];
        this._colors.domain(newDomain);
        return this;
    }
    colors(colorScale) {
        if (!arguments.length) {
            return this._colors;
        }
        if (colorScale instanceof Array) {
            this._colors = scaleQuantize().range(colorScale); // deprecated legacy support, note: this fails for ordinal domains
        }
        else {
            this._colors = typeof colorScale === 'function' ? colorScale : utils.constant(colorScale);
        }
        return this;
    }
    ordinalColors(r) {
        return this.colors(scaleOrdinal().range(r));
    }
    linearColors(r) {
        // @ts-ignore
        const scaleLinear = scaleLinear().range(r);
        scaleLinear.interpolate(interpolateHcl);
        const colors = this.colors(scaleLinear);
        return colors;
    }
    colorAccessor(colorAccessor) {
        if (!colorAccessor) {
            return this._colorAccessor;
        }
        this._colorAccessor = colorAccessor;
        return this;
    }
    colorDomain(domain) {
        if (!domain) {
            return this._colors.domain();
        }
        this._colors.domain(domain);
        return this;
    }
    colorCalculator(colorCalculator) {
        if (!colorCalculator) {
            return this._colorCalculator || this.getColor;
        }
        this._colorCalculator = colorCalculator;
        return this;
    }
};

class MarginMixin extends BaseMixin {
    constructor() {
        super();
        this._margin = {
            top: 10,
            right: 50,
            bottom: 30,
            left: 30
        };
    }
    margins(margins) {
        if (!margins) {
            return this._margin;
        }
        this._margin = margins;
        return this;
    }
    effectiveWidth() {
        // @ts-ignore
        return this.width() - this.margins().left - this.margins().right;
    }
    effectiveHeight() {
        // @ts-ignore
        return this.height() - this.margins().top - this.margins().bottom;
    }
}

const GRID_LINE_CLASS = 'grid-line';
const HORIZONTAL_CLASS = 'horizontal';
const VERTICAL_CLASS = 'vertical';
const Y_AXIS_LABEL_CLASS = 'y-axis-label';
const X_AXIS_LABEL_CLASS = 'x-axis-label';
const CUSTOM_BRUSH_HANDLE_CLASS = 'custom-brush-handle';
const DEFAULT_AXIS_LABEL_PADDING = 12;
const constants$1 = {
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
class CoordinateGridMixin extends ColorMixin(MarginMixin) {
    constructor() {
        super();
        this.colors(scaleOrdinal(schemeCategory10));
        this._mandatoryAttributes().push('x');
        this._parent = undefined;
        this._g = undefined;
        this._chartBodyG = undefined;
        this._x = undefined;
        this._origX = undefined; // Will hold original scale in case of zoom
        this._xOriginalDomain = undefined;
        // @ts-ignore
        this._xAxis = axisBottom();
        this._xUnits = units.integers;
        this._xAxisPadding = 0;
        this._xAxisPaddingUnit = timeDay;
        this._xElasticity = false;
        this._xAxisLabel = undefined;
        this._xAxisLabelPadding = 0;
        this._lastXDomain = undefined;
        this._y = undefined;
        this._yAxis = null;
        this._yAxisPadding = 0;
        this._yElasticity = false;
        this._yAxisLabel = undefined;
        this._yAxisLabelPadding = 0;
        this._brush = brushX();
        this._gBrush = undefined;
        this._brushOn = true;
        this._parentBrushOn = false;
        this._round = undefined;
        this._renderHorizontalGridLine = false;
        this._renderVerticalGridLine = false;
        this._resizing = false;
        this._unitCount = undefined;
        this._zoomScale = [1, Infinity];
        this._zoomOutRestrict = true;
        this._zoom = zoom().on('zoom', () => this._onZoom());
        this._nullZoom = zoom().on('zoom', null);
        this._hasBeenMouseZoomable = false;
        this._rangeChart = undefined;
        this._focusChart = undefined;
        this._mouseZoomable = false;
        this._clipPadding = 0;
        this._fOuterRangeBandPadding = 0.5;
        this._fRangeBandPadding = 0;
        this._useRightYAxis = false;
    }
    rescale() {
        this._unitCount = undefined;
        this._resizing = true;
        return this;
    }
    resizing(resizing) {
        if (resizing === undefined) {
            return this._resizing;
        }
        this._resizing = resizing;
        return this;
    }
    rangeChart(rangeChart) {
        if (rangeChart === undefined) {
            return this._rangeChart;
        }
        this._rangeChart = rangeChart;
        this._rangeChart.focusChart(this);
        return this;
    }
    zoomScale(extent) {
        if (extent === undefined) {
            return this._zoomScale;
        }
        this._zoomScale = extent;
        return this;
    }
    zoomOutRestrict(zoomOutRestrict) {
        if (zoomOutRestrict === undefined) {
            return this._zoomOutRestrict;
        }
        this._zoomOutRestrict = zoomOutRestrict;
        return this;
    }
    _generateG(parent) {
        if (parent === undefined) {
            this._parent = this.svg();
        }
        else {
            this._parent = parent;
        }
        const href = window.location.href.split('#')[0];
        this._g = this._parent.append('g');
        this._chartBodyG = this._g.append('g').attr('class', 'chart-body')
            .attr('transform', `translate(${this.margins().left}, ${this.margins().top})`)
            .attr('clip-path', `url(${href}#${this._getClipPathId()})`);
        return this._g;
    }
    g(gElement) {
        if (gElement === undefined) {
            return this._g;
        }
        this._g = gElement;
        return this;
    }
    mouseZoomable(mouseZoomable) {
        if (mouseZoomable === undefined) {
            return this._mouseZoomable;
        }
        this._mouseZoomable = mouseZoomable;
        return this;
    }
    chartBodyG(chartBodyG) {
        if (chartBodyG === undefined) {
            return this._chartBodyG;
        }
        this._chartBodyG = chartBodyG;
        return this;
    }
    x(xScale) {
        if (xScale === undefined) {
            return this._x;
        }
        this._x = xScale;
        this._xOriginalDomain = this._x.domain();
        this.rescale();
        return this;
    }
    xOriginalDomain() {
        return this._xOriginalDomain;
    }
    xUnits(xUnits) {
        if (xUnits === undefined) {
            return this._xUnits;
        }
        this._xUnits = xUnits;
        return this;
    }
    xAxis(xAxis) {
        if (xAxis === undefined) {
            return this._xAxis;
        }
        this._xAxis = xAxis;
        return this;
    }
    elasticX(elasticX) {
        if (elasticX === undefined) {
            return this._xElasticity;
        }
        this._xElasticity = elasticX;
        return this;
    }
    xAxisPadding(padding) {
        if (padding === undefined) {
            return this._xAxisPadding;
        }
        this._xAxisPadding = padding;
        return this;
    }
    xAxisPaddingUnit(unit) {
        if (unit === undefined) {
            return this._xAxisPaddingUnit;
        }
        this._xAxisPaddingUnit = unit;
        return this;
    }
    xUnitCount() {
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
    }
    useRightYAxis(useRightYAxis) {
        if (useRightYAxis === undefined) {
            return this._useRightYAxis;
        }
        // We need to warn if value is changing after self._yAxis was created
        if (this._useRightYAxis !== useRightYAxis && this._yAxis) {
            logger.warn('Value of useRightYAxis has been altered, after yAxis was created. ' +
                'You might get unexpected yAxis behavior. ' +
                'Make calls to useRightYAxis sooner in your chart creation process.');
        }
        this._useRightYAxis = useRightYAxis;
        return this;
    }
    isOrdinal() {
        return this.xUnits() === units.ordinal;
    }
    _useOuterPadding() {
        return true;
    }
    _ordinalXDomain() {
        const groups = this._computeOrderedGroups(this.data());
        return groups.map(this.keyAccessor());
    }
    _prepareXAxis(g, render) {
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
                logger.warn('For compatibility with d3v4+, dc.js d3.0 ordinal bar/line/bubble charts need ' +
                    'd3.scaleBand() for the x scale, instead of d3.scaleOrdinal(). ' +
                    'Replacing .x() with a d3.scaleBand with the same domain - ' +
                    'make the same change in your code to avoid this warning!');
                this._x = scaleBand().domain(this._x.domain());
            }
            if (this.elasticX() || this._x.domain().length === 0) {
                this._x.domain(this._ordinalXDomain());
            }
        }
        // has the domain changed?
        const xdom = this._x.domain();
        if (render || !utils$1.arraysEqual(this._lastXDomain, xdom)) {
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
    }
    renderXAxis(g) {
        let axisXG = g.select('g.x');
        if (axisXG.empty()) {
            axisXG = g.append('g')
                .attr('class', 'axis x')
                .attr('transform', `translate(${this.margins().left},${this._xAxisY()})`);
        }
        let axisXLab = g.select(`text.${X_AXIS_LABEL_CLASS}`);
        if (axisXLab.empty() && this.xAxisLabel()) {
            axisXLab = g.append('text')
                .attr('class', X_AXIS_LABEL_CLASS)
                .attr('transform', `translate(${this.margins().left + this.xAxisLength() / 2},${this.height() - this._xAxisLabelPadding})`)
                .attr('text-anchor', 'middle');
        }
        if (this.xAxisLabel() && axisXLab.text() !== this.xAxisLabel()) {
            axisXLab.text(this.xAxisLabel());
        }
        transition(axisXG, this.transitionDuration(), this.transitionDelay())
            .attr('transform', `translate(${this.margins().left},${this._xAxisY()})`)
            .call(this._xAxis);
        transition(axisXLab, this.transitionDuration(), this.transitionDelay())
            .attr('transform', `translate(${this.margins().left + this.xAxisLength() / 2},${this.height() - this._xAxisLabelPadding})`);
    }
    _renderVerticalGridLines(g) {
        let gridLineG = g.select(`g.${VERTICAL_CLASS}`);
        if (this._renderVerticalGridLine) {
            if (gridLineG.empty()) {
                gridLineG = g.insert('g', ':first-child')
                    .attr('class', `${GRID_LINE_CLASS} ${VERTICAL_CLASS}`)
                    .attr('transform', `translate(${this.margins().left},${this.margins().top})`);
            }
            const ticks = this._xAxis.tickValues() ? this._xAxis.tickValues() :
                (typeof this._x.ticks === 'function' ? this._x.ticks.apply(this._x, this._xAxis.tickArguments()) : this._x.domain());
            const lines = gridLineG.selectAll('line')
                .data(ticks);
            // enter
            const linesGEnter = lines.enter()
                .append('line')
                .attr('x1', (d) => this._x(d))
                .attr('y1', this._xAxisY() - this.margins().top)
                .attr('x2', (d) => this._x(d))
                .attr('y2', 0)
                .attr('opacity', 0);
            transition(linesGEnter, this.transitionDuration(), this.transitionDelay())
                .attr('opacity', 0.5);
            // update
            transition(lines, this.transitionDuration(), this.transitionDelay())
                .attr('x1', d => this._x(d))
                .attr('y1', this._xAxisY() - this.margins().top)
                .attr('x2', d => this._x(d))
                .attr('y2', 0);
            // exit
            lines.exit().remove();
        }
        else {
            gridLineG.selectAll('line').remove();
        }
    }
    _xAxisY() {
        return (this.height() - this.margins().bottom);
    }
    xAxisLength() {
        return this.effectiveWidth();
    }
    xAxisLabel(labelText, padding) {
        if (labelText === undefined) {
            return this._xAxisLabel;
        }
        this._xAxisLabel = labelText;
        this.margins().bottom -= this._xAxisLabelPadding;
        this._xAxisLabelPadding = (padding === undefined) ? DEFAULT_AXIS_LABEL_PADDING : padding;
        this.margins().bottom += this._xAxisLabelPadding;
        return this;
    }
    _createYAxis() {
        // @ts-ignore
        return this._useRightYAxis ? axisRight() : axisLeft();
    }
    _prepareYAxis(g) {
        if (this._y === undefined || this.elasticY()) {
            if (this._y === undefined) {
                this._y = scaleLinear();
            }
            const _min = this.yAxisMin() || 0;
            const _max = this.yAxisMax() || 0;
            this._y.domain([_min, _max]).rangeRound([this.yAxisHeight(), 0]);
        }
        this._y.range([this.yAxisHeight(), 0]);
        if (!this._yAxis) {
            this._yAxis = this._createYAxis();
        }
        this._yAxis.scale(this._y);
        this._renderHorizontalGridLinesForAxis(g, this._y, this._yAxis);
    }
    renderYAxisLabel(axisClass, text, rotation, labelXPosition) {
        labelXPosition = labelXPosition || this._yAxisLabelPadding;
        let axisYLab = this.g().select(`text.${Y_AXIS_LABEL_CLASS}.${axisClass}-label`);
        const labelYPosition = (this.margins().top + this.yAxisHeight() / 2);
        if (axisYLab.empty() && text) {
            axisYLab = this.g().append('text')
                .attr('transform', `translate(${labelXPosition},${labelYPosition}),rotate(${rotation})`)
                .attr('class', `${Y_AXIS_LABEL_CLASS} ${axisClass}-label`)
                .attr('text-anchor', 'middle')
                .text(text);
        }
        if (text && axisYLab.text() !== text) {
            axisYLab.text(text);
        }
        transition(axisYLab, this.transitionDuration(), this.transitionDelay())
            .attr('transform', `translate(${labelXPosition},${labelYPosition}),rotate(${rotation})`);
    }
    renderYAxisAt(axisClass, axis, position) {
        let axisYG = this.g().select(`g.${axisClass}`);
        if (axisYG.empty()) {
            axisYG = this.g().append('g')
                .attr('class', `axis ${axisClass}`)
                .attr('transform', `translate(${position},${this.margins().top})`);
        }
        transition(axisYG, this.transitionDuration(), this.transitionDelay())
            .attr('transform', `translate(${position},${this.margins().top})`)
            .call(axis);
    }
    renderYAxis(g) {
        const axisPosition = this._useRightYAxis ? (this.width() - this.margins().right) : this._yAxisX();
        this.renderYAxisAt('y', this._yAxis, axisPosition);
        const labelPosition = this._useRightYAxis ? (this.width() - this._yAxisLabelPadding) : this._yAxisLabelPadding;
        const rotation = this._useRightYAxis ? 90 : -90;
        this.renderYAxisLabel('y', this.yAxisLabel(), rotation, labelPosition);
    }
    _renderHorizontalGridLinesForAxis(g, scale, axis) {
        let gridLineG = g.select(`g.${HORIZONTAL_CLASS}`);
        if (this._renderHorizontalGridLine) {
            // see https://github.com/d3/d3-axis/blob/master/src/axis.js#L48
            const ticks = axis.tickValues() ? axis.tickValues() :
                (scale.ticks ? scale.ticks.apply(scale, axis.tickArguments()) : scale.domain());
            if (gridLineG.empty()) {
                gridLineG = g.insert('g', ':first-child')
                    .attr('class', `${GRID_LINE_CLASS} ${HORIZONTAL_CLASS}`)
                    .attr('transform', `translate(${this.margins().left},${this.margins().top})`);
            }
            const lines = gridLineG.selectAll('line')
                .data(ticks);
            // enter
            const linesGEnter = lines.enter()
                .append('line')
                .attr('x1', 1)
                .attr('y1', (d) => scale(d))
                .attr('x2', this.xAxisLength())
                .attr('y2', (d) => scale(d))
                .attr('opacity', 0);
            transition(linesGEnter, this.transitionDuration(), this.transitionDelay())
                .attr('opacity', 0.5);
            // update
            transition(lines, this.transitionDuration(), this.transitionDelay())
                .attr('x1', 1)
                .attr('y1', d => scale(d))
                .attr('x2', this.xAxisLength())
                .attr('y2', d => scale(d));
            // exit
            lines.exit().remove();
        }
        else {
            gridLineG.selectAll('line').remove();
        }
    }
    _yAxisX() {
        return this.useRightYAxis() ? this.width() - this.margins().right : this.margins().left;
    }
    yAxisLabel(labelText, padding) {
        if (labelText === undefined) {
            return this._yAxisLabel;
        }
        this._yAxisLabel = labelText;
        this.margins().left -= this._yAxisLabelPadding;
        this._yAxisLabelPadding = (padding === undefined) ? DEFAULT_AXIS_LABEL_PADDING : padding;
        this.margins().left += this._yAxisLabelPadding;
        return this;
    }
    y(yScale) {
        if (yScale === undefined) {
            return this._y;
        }
        this._y = yScale;
        this.rescale();
        return this;
    }
    yAxis(yAxis) {
        if (yAxis === undefined) {
            if (!this._yAxis) {
                this._yAxis = this._createYAxis();
            }
            return this._yAxis;
        }
        this._yAxis = yAxis;
        return this;
    }
    elasticY(elasticY) {
        if (elasticY === undefined) {
            return this._yElasticity;
        }
        this._yElasticity = elasticY;
        return this;
    }
    renderHorizontalGridLines(renderHorizontalGridLines) {
        if (renderHorizontalGridLines === undefined) {
            return this._renderHorizontalGridLine;
        }
        this._renderHorizontalGridLine = renderHorizontalGridLines;
        return this;
    }
    renderVerticalGridLines(renderVerticalGridLines) {
        if (renderVerticalGridLines === undefined) {
            return this._renderVerticalGridLine;
        }
        this._renderVerticalGridLine = renderVerticalGridLines;
        return this;
    }
    xAxisMin() {
        const m = min(this.data(), e => this.keyAccessor()(e));
        // @ts-ignore
        return utils$1.subtract(m, this._xAxisPadding, this._xAxisPaddingUnit);
    }
    xAxisMax() {
        const m = max(this.data(), e => this.keyAccessor()(e));
        // @ts-ignore
        return utils$1.add(m, this._xAxisPadding, this._xAxisPaddingUnit);
    }
    yAxisMin() {
        const m = min(this.data(), e => this.valueAccessor()(e));
        // @ts-ignore
        return utils$1.subtract(m, this._yAxisPadding);
    }
    yAxisMax() {
        const m = max(this.data(), e => this.valueAccessor()(e));
        // @ts-ignore
        return utils$1.add(m, this._yAxisPadding);
    }
    yAxisPadding(padding) {
        if (padding === undefined) {
            return this._yAxisPadding;
        }
        this._yAxisPadding = padding;
        return this;
    }
    yAxisHeight() {
        return this.effectiveHeight();
    }
    round(round) {
        if (round === undefined) {
            return this._round;
        }
        this._round = round;
        return this;
    }
    _rangeBandPadding(_) {
        if (_ === undefined) {
            return this._fRangeBandPadding;
        }
        this._fRangeBandPadding = _;
        return this;
    }
    _outerRangeBandPadding(_) {
        if (_ === undefined) {
            return this._fOuterRangeBandPadding;
        }
        this._fOuterRangeBandPadding = _;
        return this;
    }
    filter(_) {
        if (_ === undefined) {
            return super.filter();
        }
        super.filter(_);
        this.redrawBrush(_, false);
        return this;
    }
    brush(_) {
        if (_ === undefined) {
            return this._brush;
        }
        this._brush = _;
        return this;
    }
    renderBrush(g, doTransition) {
        if (this._brushOn) {
            this._brush.on('start brush end', () => this._brushing());
            // To retrieve selection we need self._gBrush
            this._gBrush = g.append('g')
                .attr('class', 'brush')
                .attr('transform', `translate(${this.margins().left},${this.margins().top})`);
            this.setBrushExtents();
            this.createBrushHandlePaths(this._gBrush, doTransition);
            this.redrawBrush(this.filter(), doTransition);
        }
    }
    createBrushHandlePaths(gBrush, option) {
        let brushHandles = gBrush.selectAll(`path.${CUSTOM_BRUSH_HANDLE_CLASS}`).data([{ type: 'w' }, { type: 'e' }]);
        brushHandles = brushHandles
            .enter()
            .append('path')
            .attr('class', CUSTOM_BRUSH_HANDLE_CLASS)
            .merge(brushHandles);
        brushHandles
            .attr('d', (d) => this.resizeHandlePath(d));
    }
    extendBrush(brushSelection) {
        if (brushSelection && this.round()) {
            brushSelection[0] = this.round()(brushSelection[0]);
            brushSelection[1] = this.round()(brushSelection[1]);
        }
        return brushSelection;
    }
    brushIsEmpty(brushSelection) {
        return !brushSelection || brushSelection[1] <= brushSelection[0];
    }
    _brushing() {
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
        let brushSelection = event.selection;
        if (brushSelection) {
            brushSelection = brushSelection.map(this.x().invert);
        }
        brushSelection = this.extendBrush(brushSelection);
        this.redrawBrush(brushSelection, false);
        const rangedFilter = this.brushIsEmpty(brushSelection) ? null : filters.RangedFilter(brushSelection[0], brushSelection[1]);
        events.trigger(() => {
            this.applyBrushSelection(rangedFilter);
        }, constants$1.EVENT_DELAY);
    }
    // This can be overridden in a derived chart. For example Composite chart overrides it
    applyBrushSelection(rangedFilter) {
        this.replaceFilter(rangedFilter);
        this.redrawGroup();
    }
    setBrushExtents(doTransition) {
        // Set boundaries of the brush, must set it before applying to self._gBrush
        this._brush.extent([[0, 0], [this.effectiveWidth(), this.effectiveHeight()]]);
        this._gBrush
            .call(this._brush);
    }
    redrawBrush(brushSelection, doTransition) {
        if (this._brushOn && this._gBrush) {
            if (this._resizing) {
                this.setBrushExtents(doTransition);
            }
            if (!brushSelection) {
                this._gBrush
                    .call(this._brush.move, null);
                this._gBrush.selectAll(`path.${CUSTOM_BRUSH_HANDLE_CLASS}`)
                    .attr('display', 'none');
            }
            else {
                const scaledSelection = [this._x(brushSelection[0]), this._x(brushSelection[1])];
                const gBrush = optionalTransition(doTransition, this.transitionDuration(), this.transitionDelay())(this._gBrush);
                // @ts-ignore
                gBrush
                    .call(this._brush.move, scaledSelection);
                // @ts-ignore
                gBrush.selectAll(`path.${CUSTOM_BRUSH_HANDLE_CLASS}`)
                    .attr('display', null)
                    .attr('transform', (d, i) => `translate(${this._x(brushSelection[i])}, 0)`)
                    .attr('d', (d) => this.resizeHandlePath(d));
            }
        }
        this.fadeDeselectedArea(brushSelection);
    }
    fadeDeselectedArea(brushSelection) {
        // do nothing, sub-chart should override this function
    }
    // borrowed from Crossfilter example
    resizeHandlePath(d) {
        d = d.type;
        const e = +(d === 'e'), x = e ? 1 : -1, y = this.effectiveHeight() / 3;
        return `M${0.5 * x},${y}A6,6 0 0 ${e} ${6.5 * x},${y + 6}V${2 * y - 6}A6,6 0 0 ${e} ${0.5 * x},${2 * y}Z` +
            `M${2.5 * x},${y + 8}V${2 * y - 8}M${4.5 * x},${y + 8}V${2 * y - 8}`;
    }
    _getClipPathId() {
        return `${this.anchorName().replace(/[ .#=\[\]"]/g, '-')}-clip`;
    }
    clipPadding(padding) {
        if (padding === undefined) {
            return this._clipPadding;
        }
        this._clipPadding = padding;
        return this;
    }
    _generateClipPath() {
        // @ts-ignore
        const defs = utils$1.appendOrSelect(this._parent, 'defs');
        // cannot select <clippath> elements; bug in WebKit, must select by id
        // https://groups.google.com/forum/#!topic/d3-js/6EpAzQ2gU9I
        const id = this._getClipPathId();
        const chartBodyClip = utils$1.appendOrSelect(defs, `#${id}`, 'clipPath').attr('id', id);
        const padding = this._clipPadding * 2;
        // @ts-ignore
        utils$1.appendOrSelect(chartBodyClip, 'rect')
            .attr('width', this.xAxisLength() + padding)
            .attr('height', this.yAxisHeight() + padding)
            .attr('transform', `translate(-${this._clipPadding}, -${this._clipPadding})`);
    }
    _preprocessData() {
    }
    _doRender() {
        this.resetSvg();
        this._preprocessData();
        this._generateG();
        this._generateClipPath();
        this._drawChart(true);
        this._configureMouseZoom();
        return this;
    }
    _doRedraw() {
        this._preprocessData();
        this._drawChart(false);
        this._generateClipPath();
        return this;
    }
    _drawChart(render) {
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
    }
    _configureMouseZoom() {
        // Save a copy of original x scale
        this._origX = this._x.copy();
        if (this._mouseZoomable) {
            this._enableMouseZoom();
        }
        else if (this._hasBeenMouseZoomable) {
            this._disableMouseZoom();
        }
    }
    _enableMouseZoom() {
        this._hasBeenMouseZoomable = true;
        const extent = [[0, 0], [this.effectiveWidth(), this.effectiveHeight()]];
        this._zoom
            .scaleExtent(this._zoomScale)
            .extent(extent)
            .duration(this.transitionDuration());
        if (this._zoomOutRestrict) {
            // Ensure minimum zoomScale is at least 1
            const zoomScaleMin = Math.max(this._zoomScale[0], 1);
            this._zoom
                .translateExtent(extent)
                .scaleExtent([zoomScaleMin, this._zoomScale[1]]);
        }
        this.root().call(this._zoom);
        // Tell D3 zoom our current zoom/pan status
        this._updateD3zoomTransform();
    }
    _disableMouseZoom() {
        this.root().call(this._nullZoom);
    }
    _zoomHandler(newDomain, noRaiseEvents) {
        let domFilter;
        if (this._hasRangeSelected(newDomain)) {
            this.x().domain(newDomain);
            domFilter = filters.RangedFilter(newDomain[0], newDomain[1]);
        }
        else {
            this.x().domain(this._xOriginalDomain);
            domFilter = null;
        }
        this.replaceFilter(domFilter);
        this.rescale();
        this.redraw();
        if (!noRaiseEvents) {
            if (this._rangeChart && !utils$1.arraysEqual(this.filter(), this._rangeChart.filter())) {
                events.trigger(() => {
                    // @ts-ignore
                    this._rangeChart.replaceFilter(domFilter);
                    this._rangeChart.redraw();
                });
            }
            this._invokeZoomedListener();
            events.trigger(() => {
                this.redrawGroup();
            }, constants$1.EVENT_DELAY);
        }
    }
    // event.transform.rescaleX(self._origX).domain() should give back newDomain
    _domainToZoomTransform(newDomain, origDomain, xScale) {
        const k = (origDomain[1] - origDomain[0]) / (newDomain[1] - newDomain[0]);
        const xt = -1 * xScale(newDomain[0]);
        return zoomIdentity.scale(k).translate(xt, 0);
    }
    // If we changing zoom status (for example by calling focus), tell D3 zoom about it
    _updateD3zoomTransform() {
        if (this._zoom) {
            this._zoom.transform(this.root(), this._domainToZoomTransform(this.x().domain(), this._xOriginalDomain, this._origX));
        }
    }
    _onZoom() {
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
        const newDomain = event.transform.rescaleX(this._origX).domain();
        this.focus(newDomain, false);
    }
    _checkExtents(ext, outerLimits) {
        if (!ext || ext.length !== 2 || !outerLimits || outerLimits.length !== 2) {
            return ext;
        }
        if (ext[0] > outerLimits[1] || ext[1] < outerLimits[0]) {
            console.warn('Could not intersect extents, will reset');
        }
        // Math.max does not work (as the values may be dates as well)
        return [ext[0] > outerLimits[0] ? ext[0] : outerLimits[0], ext[1] < outerLimits[1] ? ext[1] : outerLimits[1]];
    }
    focus(range, noRaiseEvents) {
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
    }
    refocused() {
        return !utils$1.arraysEqual(this.x().domain(), this._xOriginalDomain);
    }
    focusChart(c) {
        if (c === undefined) {
            return this._focusChart;
        }
        this._focusChart = c;
        this.on('filtered.dcjs-range-chart', (chart) => {
            if (!chart.filter()) {
                events.trigger(() => {
                    this._focusChart.x().domain(this._focusChart.xOriginalDomain(), true);
                });
            }
            else if (!utils$1.arraysEqual(chart.filter(), this._focusChart.filter())) {
                events.trigger(() => {
                    this._focusChart.focus(chart.filter(), true);
                });
            }
        });
        return this;
    }
    brushOn(brushOn) {
        if (brushOn === undefined) {
            return this._brushOn;
        }
        this._brushOn = brushOn;
        return this;
    }
    parentBrushOn(brushOn) {
        if (brushOn === undefined) {
            return this._parentBrushOn;
        }
        this._parentBrushOn = brushOn;
        return this;
    }
    // Get the SVG rendered brush
    gBrush() {
        return this._gBrush;
    }
    _hasRangeSelected(range) {
        return range instanceof Array && range.length > 1;
    }
}

const constants = {
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
class MultiChart extends CoordinateGridMixin {
    constructor(element, option) {
        super();
        this._gap = 2;
        this.MIN_BAR_WIDTH = 1;
        this._centerBar = true;
        this._symbol = d3.symbol();
        this._click = null;
        this._highlightedSize = 7;
        this._symbolSize = 5;
        this._excludedSize = 3;
        this._excludedColor = null;
        this._excludedOpacity = 1.0;
        this._emptySize = 0;
        this._filtered = [];
        this.multiOption = option;
        this.originalKeyAccessor = this.keyAccessor();
        this.keyAccessor((d) => this.originalKeyAccessor(d)[0]);
        this.valueAccessor((d) => this.originalKeyAccessor(d)[1]);
        this.colorAccessor(() => this._groupName);
        this.lines = () => this;
        this._existenceAccessor = (d) => {
            return d.value ? d.value : d.y;
        };
        this._symbol.size((d, i) => {
            if (!this._existenceAccessor(d)) {
                return this._emptySize;
            }
            else if (this._filtered[i]) {
                return Math.pow(this._symbolSize, 2);
            }
            else {
                return Math.pow(this._excludedSize, 2);
            }
        });
    }
    _filter(filter) {
        if (!filter) {
            return this.__filter();
        }
        return this.__filter(filters.RangedTwoDimensionalFilter(filter));
    }
    plotData(zoomX, zoomY) {
        const chartList = [];
        let type;
        let axisLabel;
        let yAxisLabel;
        let errorBar;
        let chartOption;
        let axisWidth;
        let clipPath;
        if (this.svg()) {
            clipPath = this.svg().select('.chart-body').attr('clip-path');
        }
        else {
            clipPath = this.g().select('.chart-body').attr('clip-path');
        }
        this.chartBodyG().attr('clip-path', clipPath);
        this.multiOption.axisOption.forEach((v) => {
            if (v.series) {
                chartList.push(v.series);
                if (this.data()[0].key[0].toString() === v.series.toString()) {
                    type = v.type;
                    axisLabel = v.axisLabel;
                }
                if (this._groupName === v.series) {
                    yAxisLabel = v.axisLabel;
                    errorBar = v.errorBar;
                    chartOption = v;
                }
            }
        });
        if (chartOption) {
            // stacks 가 있으면 stack 설정
            if (chartOption.stacks) {
                const _stacks = [];
                const sel_stack = ((key) => (d) => d.value[key]);
                chartOption.stacks.forEach((d) => {
                    const layer = { group: this.group(), name: d, accessor: sel_stack };
                    _stacks.push(layer);
                });
                this.data = () => {
                    const layers = _stacks.filter((l) => !l.hidden);
                    if (!layers.length) {
                        return [];
                    }
                    layers.forEach((layer, layerIdx) => {
                        layer.name = String(layer.name || layerIdx);
                        const allValues = layer.group.all().map((d, i) => {
                            return {
                                x: this.keyAccessor()(d, i),
                                y: layer.hidden ? null : sel_stack(layer.name)(d),
                                data: d,
                                layer: layer.name,
                                hidden: layer.hidden
                            };
                        });
                        layer.domainValues = allValues;
                        layer.values = allValues;
                        layer['key'] = layer.group.all()[0].key;
                    });
                    const v4data = layers[0].values.map((v, i) => {
                        const col = { x: v.x };
                        layers.forEach((layer) => {
                            // @ts-ignore
                            col[layer.name] = layer.values[i].y;
                        });
                        return col;
                    });
                    const keys = layers.map((layer) => layer.name);
                    const v4result = d3.stack().keys(keys)(v4data);
                    v4result.forEach((series, i) => {
                        series.forEach((ys, j) => {
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
            const y = d3.scaleLinear().range([this.yAxisHeight(), 0]);
            const yAxis = d3.axisRight(y).ticks(10);
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
            const data = [];
            let domain = this.x().domain();
            this.data().forEach((v) => {
                const x = v.key[0];
                if (domain[0] <= x && domain[1] >= x) {
                    data.push(v);
                }
            });
            // y domain 설정
            let yDomain;
            if (zoomY) { // zoom in 일때
                domain = this._groupScale[this._groupName];
                const area = (domain[0] - domain[0]) + (domain[1] - domain[0]);
                if (type === 'boolean') {
                    y.domain([-0.5, 1.5]);
                    // @ts-ignore
                    yAxis.ticks(2).tickFormat((d) => {
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
                    y.domain(domain);
                }
                else {
                    yDomain = [
                        (area / zoomY[0]) + domain[0] + (chartOption.gap ? -chartOption.gap : 0),
                        (area / zoomY[1]) + domain[0] + (chartOption.gap ? chartOption.gap : 0)
                    ];
                    y.domain([
                        (area / zoomY[0]) + domain[0] + (chartOption.gap ? -chartOption.gap : 0),
                        (area / zoomY[1]) + domain[0] + (chartOption.gap ? chartOption.gap : 0)
                    ]);
                }
                const dom = y.domain();
            }
            else if (!zoomX && !zoomY && this.yOriginalDomain && this.yOriginalDomain()) {
                y.domain(this.yOriginalDomain());
            }
            else { // zoom out 일때
                if (this.multiOption.axisOption) {
                    this.multiOption.axisOption.forEach((v) => {
                        if (this._groupName === v.series) {
                            domain = v.domain;
                        }
                    });
                }
                if (type === 'boolean') {
                    y.domain([-0.5, 1.5]);
                    // @ts-ignore
                    yAxis.ticks(2).tickFormat((d) => {
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
                    y.domain(domain);
                }
                else if (domain) {
                    const dom = [domain[0] + (chartOption.gap ? -chartOption.gap : 0), domain[1] + (chartOption.gap ? chartOption.gap : 0)];
                    y.domain(dom);
                }
                else {
                    const dom = [
                        // @ts-ignore
                        d3.min(data, (d) => typeof d.value === 'object' ? d.value.value : d.value) + (chartOption.gap ? -chartOption.gap : 0),
                        d3.max(data, (d) => typeof d.value === 'object' ? d.value.value : d.value) + (chartOption.gap ? chartOption.gap : 0)
                    ];
                    y.domain(dom);
                }
            }
            this._locator = (d) => {
                let rotate = '';
                if (chartOption.symbolRotate) {
                    rotate = ' rotate(' + chartOption.symbolRotate + ')';
                }
                let bandwidth = 0;
                if (this.x().bandwidth) {
                    bandwidth = this.x().bandwidth() / 2;
                }
                if (d.key) {
                    let check = this.y()(this.valueAccessor()(d));
                    if (isNaN(check)) {
                        check = 0;
                    }
                    return 'translate(' + (this.x()(this.keyAccessor()(d)) + bandwidth) + ',' + check + ')' + rotate;
                }
                else {
                    let check = y(d.y);
                    if (isNaN(check)) {
                        check = 0;
                    }
                    return 'translate(' + (this.x()(d.x) + bandwidth) + ',' + check + ')' + rotate;
                }
            };
            this._annotateLocation = (d) => {
                let rotate = '';
                if (chartOption.symbolRotate) {
                    rotate = ' rotate(' + chartOption.symbolRotate + ')';
                }
                if (d.key) {
                    let check = this.y()(this.valueAccessor()(d));
                    if (isNaN(check)) {
                        check = 0;
                    }
                    return 'translate(' + this.x()(this.keyAccessor()(d)) + ',' + check + ')' + rotate;
                }
                else {
                    let check = y(d.y);
                    if (isNaN(check)) {
                        check = 0;
                    }
                    return 'translate(' + (this.x()(d.x) - 7) + ',' + (check - 10) + ')' + rotate;
                }
            };
            if (!this._groupScale) {
                this._groupScale = {};
            }
            this._groupScale[this._groupName] = y.domain();
            // Y Axis 그리기
            let axisPadding = 0;
            for (let i = 0; i < chartList.indexOf(this._groupName); i++) {
                if (i) {
                    axisPadding += this.multiOption.axisOption[i].width ? this.multiOption.axisOption[i].width + 35 : 0;
                }
            }
            // chart 그리기
            const valAccessor = this.valueAccessor();
            let drawData = this.data();
            if (!chartOption.stacks) {
                drawData = [{
                        group: {
                            all: () => this.data()
                        },
                        name: this.data()[0].key[1].toString(),
                        values: this.data().map((d, i) => {
                            return {
                                x: this.keyAccessor()(d, i),
                                y: valAccessor(d, i),
                                z: d.value.z,
                                data: d,
                                layer: d.key[1],
                                hidden: undefined
                            };
                        })
                    }];
            }
            this.drawChart(type, y, drawData, chartOption, zoomX, yDomain);
            if (!chartOption.hide) {
                const axis = chartList.indexOf(this._groupName) ? yAxis : d3.axisLeft(y).ticks(10);
                if (chartOption.tickFormat) {
                    axis.tickFormat(chartOption.tickFormat);
                }
                if (chartOption.ticks) {
                    axis.ticks(chartOption.ticks);
                }
                const axisClass = this.multiOption.axisOption.filter((d) => !d.hide).map((d) => d.series).indexOf(this._groupName);
                const chartWith = this.renderYAxisAt(axisClass, axis, this.width() - this.margins().right + axisPadding);
                axisWidth = this.renderYAxisAt(axisClass, axis, this.width() - this.margins().right + axisPadding) || 0;
                // label
                this.renderYAxisLabel(axisClass, yAxisLabel, 90, this.width() - this.margins().right + axisWidth + 5 + axisPadding);
            }
            // set y right axis width
            this.multiOption.axisOption.forEach((v) => {
                if (this._groupName === v.series) {
                    v.width = axisWidth;
                }
            });
        }
        if (!this.yOriginalDomain) {
            this.yOriginalDomain = () => {
                let domain;
                this.multiOption.axisOption.forEach((v) => {
                    if (this._groupName === v.series) {
                        domain = v.domain;
                    }
                });
                return domain;
            };
        }
    }
    click(click) {
        if (!click) {
            return this._click;
        }
        this._click = click;
        return this;
    }
    defined(defined) {
        if (!defined) {
            return this._defined;
        }
        this._defined = defined;
        return this;
    }
    dashStyle(dashStyle) {
        if (!dashStyle) {
            return this._dashStyle;
        }
        this._dashStyle = dashStyle;
        return this;
    }
    renderYAxisLabel(axisClass, text, rotation, labelXPosition) {
        labelXPosition = labelXPosition || 0;
        if (axisClass && this.svg()) {
            let axisYLab = this.svg().selectAll('text.' + 'y-axis-label' + '.y' + axisClass + '-label');
            const labelYPosition = ((this.margins().top + this.yAxisHeight()) / 2);
            if (axisYLab.empty() && text) {
                axisYLab = d3.select(this.g()._groups[0][0].parentNode).append('text')
                    .attr('transform', 'translate(' + labelXPosition + ',' + labelYPosition + '),rotate(' + rotation + ')')
                    .attr('class', 'y-axis-label' + ' y' + axisClass + '-label')
                    .attr('text-anchor', 'middle')
                    .text(text);
            }
            if (text && axisYLab.text() !== text) {
                axisYLab.text(text);
            }
            transition(axisYLab, this.transitionDuration(), this.transitionDelay())
                .attr('transform', 'translate(' + labelXPosition + ',' + labelYPosition + '),rotate(' + rotation + ')');
        }
    }
    renderYAxisAt(axisClass, axis, position) {
        let axisYG;
        if (axisClass && this.svg()) {
            axisYG = this.svg().selectAll('g.' + 'y' + axisClass);
            if (axisYG.empty()) {
                axisYG = d3.select(this.g()._groups[0][0].parentNode).append('g')
                    .attr('class', 'axis y-axis-at ' + 'y' + axisClass)
                    .attr('transform', 'translate(' + position + ',' + this.margins().top + ')');
            }
            transition(axisYG, this.transitionDuration(), this.transitionDelay())
                .attr('transform', 'translate(' + position + ',' + this.margins().top + ')')
                .call(axis);
        }
        else {
            if (this.svg()) {
                axisYG = this.svg().select('g.' + 'y');
            }
            else {
                axisYG = d3.select(this.g()._groups[0][0].parentNode).select('g.' + 'y');
            }
            transition(axisYG, this.transitionDuration(), this.transitionDelay()).call(axis);
        }
        if (axisYG && axisYG._groups[0][0]) {
            return axisYG._groups[0][0].getBoundingClientRect().width;
        }
        else {
            return 0;
        }
    }
    drawChart(chart, y, data, option, zoomX, zoomY) {
        if (chart === 'lineSymbol') {
            /*--------- line Start----------*/
            const chartBody = this.chartBodyG();
            let layersList = chartBody.selectAll('g.stack-list');
            if (layersList.empty()) {
                layersList = chartBody.append('g').attr('class', 'stack-list');
            }
            const layers = layersList.selectAll('g.stack').data(data);
            const layersEnter = layers.enter().append('g').attr('class', (d, i) => 'stack ' + '_' + i);
            this.drawLine(layersEnter, layers, y, option, option.smooth);
            /*--------- line End----------*/
            /*--------- symbol Start----------*/
            const layers2 = this.chartBodyG().selectAll('path.symbol').data(data);
            layers2.enter()
                .append('g')
                .attr('class', (d, i) => {
                return 'stack ' + '_' + i;
            });
            data.forEach((d, i) => {
                this.renderSymbol(d, option);
            });
            // 추가된 데이터가 있으면 다시 렌더
            if (data.length !== layers.size()) {
                this.plotData();
            }
            /*--------- symbol End----------*/
            // renderArea 추가
            if (option.renderArea) {
                this.drawArea(layersEnter, layers, y, option, option.smooth ? d3.curveMonotoneX : d3.curveCardinal.tension(1));
            }
        }
        else if (chart === 'smoothLine') {
            /*--------- line Start----------*/
            const chartBody = this.chartBodyG();
            let layersList = chartBody.selectAll('g.stack-list');
            if (layersList.empty()) {
                layersList = chartBody.append('g').attr('class', 'stack-list');
            }
            const layers = layersList.selectAll('g.stack').data(data);
            const layersEnter = layers.enter().append('g').attr('class', (d, i) => 'stack ' + '_' + i);
            this.drawLine(layersEnter, layers, y, option, true);
            /*--------- line End----------*/
            /*--------- symbol Start----------*/
            const layers2 = this.chartBodyG().selectAll('path.symbol').data(data);
            layers2.enter()
                .append('g')
                .attr('class', (d, i) => {
                return 'stack ' + '_' + i;
            });
            data.forEach((d, i) => {
                this.renderSymbol(d, option);
            });
            // 추가된 데이터가 있으면 다시 렌더
            if (data.length !== layers.size()) {
                this.plotData();
            }
            // renderArea 추가
            if (option.renderArea) {
                this.drawArea(layersEnter, layers, y, option, d3.curveMonotoneX);
            }
            /*--------- symbol End----------*/
        }
        else if (chart === 'line') {
            const chartBody = this.chartBodyG();
            let layersList = chartBody.selectAll('g.stack-list');
            if (layersList.empty()) {
                layersList = chartBody.append('g').attr('class', 'stack-list');
            }
            const layers = layersList.selectAll('g.stack').data(data);
            const layersEnter = layers.enter().append('g').attr('class', (d, i) => 'stack ' + '_' + i);
            this.drawLine(layersEnter, layers, y, option, option.smooth);
            // 추가된 데이터가 있으면 다시 렌더
            if (data.length !== layers.size()) {
                this.plotData();
            }
            if (option.renderArea) {
                this.drawArea(layersEnter, layers, y, option, option.smooth ? d3.curveMonotoneX : d3.curveCardinal.tension(1));
            }
        }
        else if (chart === 'stepLine') {
            const chartBody = this.chartBodyG();
            let layersList = chartBody.selectAll('g.stack-list');
            if (layersList.empty()) {
                layersList = chartBody.append('g').attr('class', 'stack-list');
            }
            const layers = layersList.selectAll('g.stack').data(data);
            const layersEnter = layers.enter().append('g').attr('class', (d, i) => 'stack ' + '_' + i);
            this.stepLine(layersEnter, layers, y, option);
            if (option.renderArea) {
                this.drawArea(layersEnter, layers, y, option, d3.curveStepAfter);
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
            const layers = this.chartBodyG().selectAll('path.symbol').data(data);
            layers.enter()
                .append('g')
                .attr('class', (d, i) => 'stack ' + '_' + i);
            data.forEach((d, i) => this.renderSymbol(d, option));
        }
        else if (chart === 'bar') {
            const bars = this.multiOption.axisOption.filter((d) => d.type === 'bar');
            const barIndex = bars.map((d) => d.series).indexOf(this._groupName);
            if (this.chartBodyG().selectAll('g.stack').empty()) {
                this.chartBodyG().append('g').attr('class', 'stack _0');
            }
            const layers = this.chartBodyG().selectAll('g.stack').data(data);
            this.calculateBarWidth();
            layers.enter()
                .append('g')
                .attr('class', (d, i) => {
                return 'stack ' + '_' + i;
            })
                .merge(layers);
            const last = layers.size() - 1;
            layers.each((d, i) => {
                const layer = d3.select(d);
                this.renderBars(layers, i, d, y, option, bars, barIndex);
                if (this.renderLabel() && last === i) {
                    this.renderLabels(layer, i, d);
                }
            });
        }
        else if (chart === 'thermal') {
            const xStep = option.gap, yStep = 1;
            if (zoomX && zoomY) {
                this.x().domain([zoomX[0], +zoomX[1]]);
                y.domain([zoomY[0], zoomY[1] + yStep]);
            }
            else {
                this.x().domain([this.multiOption.xRange[0] - (xStep / 2), +this.multiOption.xRange[1] + (xStep / 2)]);
                y.domain([option.domain[0], option.domain[1] + yStep]);
            }
            const layers = this.chartBodyG().selectAll('rect.thermal').data(data);
            layers.enter()
                .append('g')
                .attr('class', (d, i) => 'stack ' + '_' + i);
            data.forEach((d, i) => this.renderThermal(d, option, xStep, yStep, y));
        }
    }
    barPadding(barPadding) {
        if (!barPadding) {
            return this._rangeBandPadding();
        }
        this._rangeBandPadding(barPadding);
        this._gap = undefined;
        return this;
    }
    calculateBarWidth() {
        if (this._barWidth === undefined) {
            const numberOfBars = this.xUnitCount();
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
    }
    drawLine(layersEnter, layers, y, option, smooth) {
        let bandwidth = 0;
        if (this.x().bandwidth) {
            bandwidth = this.x().bandwidth() / 2;
        }
        const line = d3.line()
            .x((d) => this.x()(d.x) + bandwidth)
            .y((d) => y ? y(d.y) : this.y()(d.y))
            .curve(smooth ? d3.curveMonotoneX : d3.curveCardinal.tension(1));
        if (this._defined) {
            line.defined(this._defined);
        }
        const path = layersEnter.append('path').attr('class', 'line').attr('stroke', option.color ? option.color : this.colors2.bind(this))
            .attr('stroke', option.color ? option.color : this.colors2.bind(this))
            .attr('d', (d) => this.safeD(line(d.values)))
            .attr('chartKey', (d) => d.key)
            .style('stroke-width', option.lineWidth + 'px');
        if (option.dashStyle) {
            path.attr('stroke-dasharray', option.dashStyle);
        }
        transition(layers.select('path.line'), this.transitionDuration(), this.transitionDelay())
            .attr('stroke', option.color ? option.color : this.colors2.bind(this))
            .attr('d', d => this.safeD(line(d.values)))
            .attr('seriesKey', d => d.values[0].data.key[0])
            .style('stroke-width', option.lineWidth + 'px');
    }
    colors2(d, i) {
        return this.getColor.call(d, d.values, i);
    }
    safeD(d) {
        return (!d || d.indexOf('NaN') >= 0) ? 'M0,0' : d;
    }
    renderSymbol(d, option) {
        const getSymbol = () => {
            if (option.symbol) {
                if (option.symbol === 'cross') {
                    return d3.symbolCross;
                }
                else if (option.symbol === 'diamond') {
                    return d3.symbolDiamond;
                }
                else if (option.symbol === 'square') {
                    return d3.symbolSquare;
                }
                else if (option.symbol === 'star') {
                    return d3.symbolStar;
                }
                else if (option.symbol === 'triangle') {
                    return d3.symbolTriangle;
                }
                else if (option.symbol === 'wye') {
                    return d3.symbolWye;
                }
                else {
                    return d3.symbolCircle;
                }
            }
            else {
                return d3.symbolCircle;
            }
        };
        const symbolSize = () => {
            if (option.size) {
                return option.size * option.size;
            }
            else {
                return 7 * 7;
            }
        };
        const color = option.colorOption ? option.colorOption : (option.color || this.getColor);
        const symbols = this.chartBodyG().selectAll('path.symbol').data(d.values);
        symbols.enter()
            .append('path').attr('class', 'symbol')
            .attr('opacity', 0)
            .attr('fill', option.color ? option.color : this.getColor)
            .attr('transform', this._locator)
            .attr('d', d3.symbol().type(getSymbol()).size(symbolSize()))
            .on('click', (data) => {
            if (this._click) {
                // @ts-ignore
                return this._click(d);
            }
        });
        if (this.multiOption.tooltip) {
            const tooltip = this.getTooltipElem();
            symbols
                .on('mousemove', (data) => {
                // @ts-ignore
                const pageX = event.pageX;
                // @ts-ignore
                const pageY = event.pageY;
                let left = 0, top = 0;
                tooltip.transition()
                    .duration(100)
                    .style('opacity', .9)
                    .style('background', color)
                    .style('border-color', color)
                    .style('z-index', 10000);
                tooltip.html(this.multiOption.tooltip(data));
                setTimeout(() => {
                    const toolX = tooltip.node().clientWidth;
                    const toolY = tooltip.node().clientHeight;
                    top = pageY - toolY - 15;
                    left = pageX - (toolX / 2);
                    tooltip
                        .style('top', top + 'px')
                        .style('left', left + 'px');
                });
            })
                .on('mouseout', (data) => {
                tooltip.transition()
                    .duration(200)
                    .style('opacity', 0)
                    .style('z-index', -1);
            });
        }
        if (this.multiOption.onClick) {
            // @ts-ignore
            symbols.on('click', (data) => this.multiOption.onClick(data, event));
        }
        // @ts-ignore
        transition(symbols, this.transitionDuration(), this.transitionDelay())
            .attr('opacity', (data, i) => isNaN(this._existenceAccessor(data)) ? 0 : this._filtered[i] ? 1 : this.excludedOpacity())
            .attr('stroke', (data, i) => {
            if (this.excludedColor() && !this._filtered[i]) {
                return this.excludedColor();
            }
            else if (typeof color === 'function') {
                return color(data.data.value);
            }
            else {
                return color;
            }
        })
            .attr('seriesKey', data => data.data.key[0])
            .attr('fill', '#fff')
            .attr('transform', this._locator)
            // @ts-ignore
            .attr('d', d3.symbol().type(getSymbol()).size(symbolSize()));
        transition(symbols.exit(), this.transitionDuration(), this.transitionDelay()).attr('opacity', 0).remove();
        // 추가된 데이터가 있으면 다시 렌더
        if (d.values && d.values.length !== symbols.size()) {
            this.renderSymbol(d, option);
        }
    }
    barHeight(y, d) {
        const rtn = +(this.yAxisHeight() - y(d.y)) < 0 ? 0 : utils$1.safeNumber(+(this.yAxisHeight() - y(d.y)));
        if (d.y0 !== undefined) {
            return (y(d.y0) - y(d.y + d.y0));
        }
        return rtn;
    }
    drawArea(layersEnter, layers, y, option, curve) {
        const area = d3.area()
            .x((d) => this.x()(d.x))
            .y1((d) => y ? y(d.y) : this.y()(d.y))
            .y0((d) => {
            if (option.renderAreaRange) {
                return y ? y(option.renderAreaRange) : this.y()(option.renderAreaRange);
            }
            else {
                return this.yAxisHeight();
            }
        })
            .curve(curve);
        if (this._defined) {
            area.defined(this._defined);
        }
        layersEnter.append('path')
            .attr('class', 'area')
            .attr('fill', option.color ? option.color : this.colors2.bind(this))
            .attr('d', (d) => this.safeD(area(d.values)));
        transition(layers.select('path.area'), this.transitionDuration(), this.transitionDelay())
            .attr('stroke', option.color ? option.color : this.colors2.bind(this)).attr('d', d => this.safeD(area(d.values)));
    }
    renderLabels(layer, layerIndex, d) {
        const labels = layer.selectAll('text.barLabel')
            .data(d.values, pluck('x'));
        labels.enter()
            .append('text')
            .attr('class', 'barLabel')
            .attr('text-anchor', 'middle');
        if (this.isOrdinal()) {
            labels.attr('cursor', 'pointer');
        }
        transition(labels, this.transitionDuration(), this.transitionDelay())
            .attr('x', data => {
            let x = this.x()(data.x);
            if (!this._centerBar) {
                x += this._barWidth / 2;
            }
            return utils$1.safeNumber(x);
        })
            .attr('y', data => {
            let y = this.y()(data.y + data.y0);
            if (data.y < 0) {
                y -= this.barHeight(y, data);
            }
            return utils$1.safeNumber(y - 3);
        })
            .text(data => this.label()(data));
        transition(labels.exit(), this.transitionDuration(), this.transitionDelay())
            .attr('height', 0)
            .remove();
    }
    renderThermal(data, option, xStep, yStep, y) {
        const symbols = this.chartBodyG().selectAll('rect.thermal').data(data.values);
        symbols.enter().append('rect').attr('class', 'thermal');
        transition(symbols, this.transitionDuration(), this.transitionDelay())
            .attr('x', d => this.x()((+d.x - xStep / 2)))
            .attr('y', d => y(+d.y + yStep))
            .attr('width', this.x()(this.x().domain()[0] + xStep) - this.x()(this.x().domain()[0]))
            .attr('height', y(y.domain()[0]) - y(y.domain()[0] + yStep))
            .attr('opacity', d => isNaN(d.z) ? 0 : 1)
            .style('fill', d => option.colorScale(option.colorAccessor(d.data)));
        transition(symbols.exit(), this.transitionDuration(), this.transitionDelay()).attr('opacity', 0).remove();
    }
    renderBars(layer, layerIndex, data, y, option, barlist, barIndex) {
        const bars = layer.selectAll('rect.bar').data(data.values, pluck('x'));
        let ordinalType = false;
        if (option.barWidth) {
            this._barWidth = option.barWidth;
        }
        if (this._x.bandwidth) {
            ordinalType = true;
            this._barWidth = this._x.bandwidth();
        }
        if (this.multiOption.xAxisOption && this.multiOption.xAxisOption.type === 'date') {
            const { left, right } = this.margins();
            const xAxisWidth = this._widthCalc() - left - right;
            const uniqKeys = _.uniq(this.data().map((d) => d.key[1]));
            this._barWidth = xAxisWidth / uniqKeys.length;
        }
        transition(bars.exit(), this.transitionDuration(), this.transitionDelay())
            .attr('x', d => this.x()(d.x))
            .attr('width', this._barWidth * 0.9)
            .remove();
        bars.enter()
            .append('rect')
            .attr('class', 'bar')
            .attr('x', (d) => {
            let x = this.x()(d.x);
            if (this._centerBar && !this.isOrdinal()) {
                x -= this._barWidth / 2;
            }
            if (this.isOrdinal() && this._gap !== undefined) {
                x += this._gap / 2;
            }
            const position = (this._barWidth / barlist.length) * barIndex;
            return utils$1.safeNumber(x + position);
        })
            .attr('y', (d) => {
            let yVal;
            if (d.y0 !== undefined) {
                yVal = y(d.y + d.y0);
                if (d.y < 0) {
                    yVal -= this.barHeight(y, d);
                }
            }
            else {
                yVal = y(d.y);
            }
            return utils$1.safeNumber(yVal);
        })
            .attr('width', this._barWidth / barlist.length)
            .attr('height', (d) => this.barHeight(y, d))
            .attr('fill', pluck('layer', option.color ? (d, i) => {
            if (option.stacks) {
                const index = option.stacks.indexOf(d);
                return option.color[index];
            }
            else {
                return option.color;
            }
        } : this.getColor))
            .select('title').text(pluck('data', this.title(data.name)));
        if (this.multiOption.onClick) {
            // @ts-ignore
            bars.on('click', (d) => this.multiOption.onClick(d, event));
        }
        transition(bars, this.transitionDuration(), this.transitionDelay())
            .attr('x', d => {
            let x = this.x()(d.x);
            if (this._centerBar && !this.isOrdinal()) {
                x -= this._barWidth / 2;
            }
            if (this.isOrdinal() && this._gap !== undefined) {
                x += this._gap / 2;
            }
            const position = (this._barWidth / barlist.length) * barIndex;
            return utils$1.safeNumber(x + position);
        })
            .attr('y', d => {
            let yVal;
            if (d.y0 !== undefined) {
                yVal = y(d.y + d.y0);
                if (d.y < 0) {
                    yVal -= this.barHeight(y, d);
                }
            }
            else {
                yVal = y(d.y);
            }
            return utils$1.safeNumber(yVal);
        })
            .attr('width', this._barWidth / barlist.length)
            .attr('height', d => this.barHeight(y, d))
            .attr('fill', pluck('layer', option.color ? (d, i) => {
            if (option.stacks) {
                const index = option.stacks.indexOf(d);
                return option.color[index];
            }
            else {
                return option.color;
            }
        } : this.getColor))
            .select('title').text(pluck('data', this.title(data.name)));
    }
    stepLine(layersEnter, layers, y, option) {
        let bandwidth = 0;
        if (this.x().bandwidth) {
            bandwidth = this.x().bandwidth() / 2;
        }
        const line = d3.line()
            .x((d) => (this.x()(d.x) + bandwidth))
            .y((d) => y ? y(d.y) : this.y()(d.y))
            .curve(d3.curveStepAfter);
        if (this._defined) {
            line.defined(this._defined);
        }
        const path = layersEnter.append('path').attr('class', 'line').attr('stroke', option.color ? option.color : this.colors2.bind(this));
        if (option.dashStyle) {
            path.attr('stroke-dasharray', option.dashStyle);
        }
        transition(layers.select('path.line'), this.transitionDuration(), this.transitionDelay())
            .attr('stroke', option.color ? option.color : this.colors2.bind(this))
            .attr('d', d => this.safeD(line(d.values)))
            .style('stroke-width', option.lineWidth + 'px');
    }
    symbol(type) {
        if (!type) {
            return this._symbol.type();
        }
        this._symbol.type(type);
        return this;
    }
    excludedColor(excludedColor) {
        if (!excludedColor) {
            return this._excludedColor;
        }
        this._excludedColor = excludedColor;
        return this;
    }
    excludedOpacity(excludedOpacity) {
        if (!excludedOpacity) {
            return this._excludedOpacity;
        }
        this._excludedOpacity = excludedOpacity;
        return this;
    }
    resizeSymbolsWhere(condition, size) {
        // @ts-ignore
        const symbols = this.selectAll('.chart-body path.symbol').filter(() => condition(d3.select(this)));
        const oldSize = this._symbol.size();
        this._symbol.size(Math.pow(size, 2));
        // @ts-ignore
        transition(symbols, this.transitionDuration(), this.transitionDelay()).attr('d', this._symbol);
        this._symbol.size(oldSize);
    }
    extendBrush() {
        const extent = this.brush().extent();
        if (this.round()) {
            extent[0] = extent[0].map(this.round());
            extent[1] = extent[1].map(this.round());
            this.g().select('.brush').call(this.brush().extent(extent));
        }
        return extent;
    }
    brushIsEmpty(extent) {
        return this.brush().empty() || !extent || extent[0][0] >= extent[1][0] || extent[0][1] >= extent[1][1];
    }
    _brushing() {
        const extent = this.extendBrush();
        this.redrawBrush(this.g());
        if (this.brushIsEmpty(extent)) {
            events.trigger(() => {
                this.filter(null);
                this.redrawGroup();
            });
        }
        else {
            const ranged2DFilter = filters.RangedTwoDimensionalFilter(extent);
            events.trigger(() => {
                this.filter(null);
                this.filter(ranged2DFilter);
                this.redrawGroup();
            }, constants.EVENT_DELAY);
        }
    }
    getTooltipElem() {
        if (!this._tooltip || this._tooltip.empty()) {
            this._tooltip = d3.select('body')
                .append('div')
                .attr('class', 'wise-chart-tooltip')
                .html('')
                .style('opacity', 0)
                .style('position', 'absolute')
                .style('z-index', -1);
        }
        return this._tooltip;
    }
}

class DjChart extends DcChart {
    constructor(option) {
        super();
        this.option = option;
    }
    cloudChart(element) {
        return new CloudChart(element, this.option);
    }
    multiChart(element) {
        const chart = new MultiChart(element, this.option);
        return chart['anchor'](element);
    }
}

class AngularDjChartComponent {
    constructor(elRef, zone) {
        this.elRef = elRef;
        this.zone = zone;
        this.resizeDelay = 300;
        this.changFilter = new EventEmitter();
        this.rendered = new EventEmitter();
    }
    set option(option) {
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
    }
    get option() {
        // @ts-ignore
        return this._option;
    }
    ngOnInit() {
        // init document width
        this.domWidth = this.elRef.nativeElement.clientWidth;
        // element 사이즈가 변경되었을때
        this.observer = new ResizeObserver(entries => {
            this.zone.runOutsideAngular(() => {
                // resize duration: this.resizeDelay
                const width = entries[0].contentRect.width;
                clearTimeout(this.resizeTimer);
                this.resizeTimer = setTimeout(() => {
                    if (this.domWidth !== width) {
                        this.domWidth = width;
                        // redraw
                        if (this.chart) {
                            this.chart.minWidth(100);
                            this.chart.minHeight(50);
                            this.chart.width(0);
                            this.chart.height(0);
                            if (this.chart.rescale) {
                                this.chart.rescale();
                            }
                            if (this.chart.update) {
                                this.chart.update();
                            }
                            else {
                                this.chart.redraw();
                            }
                        }
                    }
                }, this.resizeDelay);
            });
        });
        this.observer.observe(this.elRef.nativeElement);
    }
    ngOnDestroy() {
        // 생성된 tooltip 제거
        if (this._tooltip) {
            this._tooltip.remove();
        }
        if (this.chart.children) {
            this.chart.children().forEach((chart) => {
                if (chart._tooltip) {
                    chart._tooltip.remove();
                }
            });
        }
        // @ts-ignore
        this.observer.unobserve(this.elRef.nativeElement);
    }
    create() {
        this.setWidthHeight();
        this.setMargins();
        // input type이 crossfilter와 data일때 처리
        if (this.option.data !== undefined) {
            this.chart.dimension(this.filter());
            this.chart.group({ all: () => this.option.data, size: () => this.option.data.length });
        }
        else {
            this.chart.dimension(this.option.dimension);
            this.chart.group(this.option.group);
        }
        const overrideFields = ['onClick'];
        overrideFields.forEach(key => {
            // @ts-ignore
            if (this.option[key] !== undefined) {
                if (key === 'onClick') {
                    // @ts-ignore
                    this.chart[key] = (d) => this.option.onClick(d, event);
                }
                else {
                    // @ts-ignore
                    this.chart[key] = this.option[key];
                }
            }
        });
        if (this.option.onClickEvent) {
            this.chart['_onClickEvent'] = this.chart.onClick;
            this.chart['onClick'] = (d) => {
                this.chart._onClickEvent(d);
                this.option.onClickEvent(d);
            };
        }
        if (this.option.onFilterChanged) {
            // @ts-ignore
            this.chart.on('filtered', (d) => this.option.onFilterChanged(d));
        }
        this.option['chart'] = this.chart;
    }
    setPieChart() {
        this.create();
        const _innerRadius = this.option.innerRadius || 30;
        const _radius = this.option.radius || 80;
        const _externalLabels = this.option.externalLabels || 0;
        const size = d3.min([+this.width, +this.height]);
        this.chart
            // @ts-ignore
            .radius((size / 2) * (_radius / 100))
            // @ts-ignore
            .innerRadius((size / 2) * (_innerRadius / 100))
            .externalLabels(_externalLabels)
            .drawPaths(true);
        if (this.option.slicesPercent) {
            let data = this.option.data ? this.option.data : this.option.group.all();
            data = data.sort((a, b) => b.value - a.value);
            let sum = 0;
            let index = 0;
            data.forEach((d) => sum += d.value);
            while (index < data.length) {
                const percent = (data[index].value / sum) * 100;
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
            this.chart.colors((d) => {
                const key = isArray(d) ? d[0] : d;
                // @ts-ignore
                return this.option.colors[key] || '#ccc';
            });
        }
        this.chart.on('pretransition', (chart) => {
            chart.selectAll('text.pie-slice').text((d) => {
                let key = d.data.key;
                const angle = d.endAngle - d.startAngle;
                if (this.option.legends) {
                    key = this.option.legends[key] || key;
                }
                if (angle > 0.5 || (angle > 0.5 && _externalLabels)) {
                    return key;
                }
                return '';
            });
            if (this.option.tooltip) {
                const tooltip = this.getTooltipElem();
                chart.selectAll('title').remove();
                chart.selectAll('g.pie-slice')
                    .on('mousemove', (data) => {
                    const key = isArray(data.data.key) ? data.data.key[0] : data.data.key;
                    const color = this.option.colors ? this.option.colors[key] : this.chart.getColor(data.data);
                    // @ts-ignore
                    const pageX = event.pageX;
                    // @ts-ignore
                    const pageY = event.pageY;
                    let left = 0, top = 0;
                    tooltip.transition()
                        .duration(100)
                        .style('opacity', .9)
                        .style('background', color)
                        .style('border-color', color)
                        .style('z-index', 10000);
                    tooltip.html(this.option.tooltip(data));
                    setTimeout(() => {
                        const toolX = tooltip.node().clientWidth;
                        const toolY = tooltip.node().clientHeight;
                        top = pageY - toolY - 20;
                        left = pageX - (toolX / 2);
                        tooltip
                            .style('top', top + 'px')
                            .style('left', left + 'px');
                    });
                })
                    .on('mouseout', (data) => {
                    tooltip.transition()
                        .duration(300)
                        .style('opacity', 0)
                        .style('z-index', -1);
                });
                /*symbols
                  */
            }
        });
    }
    setDcChart() {
        // @ts-ignore
        this.chart = this.wiseChart[this.option.dcChart](this.elRef.nativeElement);
        this.create();
        Object.keys(this.option).forEach(key => {
            if (this.chart[key]) {
                // @ts-ignore
                this.chart[key](this.option[key]);
            }
        });
    }
    setCloudChart() {
        this.create();
        this.chart.padding(this.option.padding);
        this.chart.legends(this.option.legends);
    }
    setMargins() {
        if (this.option.margins) {
            this.chart.margins().left = this.option.margins.left !== undefined ? +this.option.margins.left : 30;
            this.chart.margins().right = this.option.margins.right !== undefined ? +this.option.margins.right : 50;
            this.chart.margins().bottom = this.option.margins.bottom !== undefined ? +this.option.margins.bottom : 30;
            this.chart.margins().top = this.option.margins.top !== undefined ? +this.option.margins.top : 10;
        }
    }
    setMultiSeries() {
        this.create();
        let min = d3.min(this.chart.group().all(), (d) => +d.key[1]) || 0;
        let max = d3.max(this.chart.group().all(), (d) => +d.key[1]);
        const subChart = (c) => {
            return this.wiseChart.multiChart(c);
        };
        const rightYAxisWidth = 0;
        let leftYAxisWidth = 30;
        this.chart
            .chart(subChart)
            .renderHorizontalGridLines(true)
            .renderVerticalGridLines(true)
            // @ts-ignore
            .x(d3.scaleLinear().domain([min, max]))
            .yAxisLabel(this.option.axisOption && this.option.axisOption.length ? this.option.axisOption[0].axisLabel : this.option.yAxisLabel)
            .xAxisLabel(this.option.xAxisLabel)
            .clipPadding(5)
            .elasticY(false)
            .mouseZoomable(false)
            .brushOn(false)
            .seriesAccessor((d) => d.key[0])
            .seriesSort((a, b) => {
            const orderList = this.option.axisOption.map((d) => d.series);
            return orderList.indexOf(a) - orderList.indexOf(b);
        })
            .keyAccessor((d) => {
            return d.key ? isNaN(d.key[1]) ? d.key[1] : +d.key[1] : null;
        })
            .valueAccessor((d) => d.value);
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
                    this.chart.x(d3.scaleBand()).xUnits(this.wiseChart.units.ordinal).domain([min, max]);
                    break;
                case 'date':
                    if (this.option.xAxisOption.domain) {
                        min = moment__default(min, this.option.xAxisOption.dateFormat).valueOf();
                        max = moment__default(max, this.option.xAxisOption.dateFormat).valueOf();
                    }
                    // @ts-ignore
                    this.chart.x(d3.scaleTime().domain([new Date(min), new Date(max)]));
                    if (this.option.xAxisOption.dateTickFormat) {
                        // @ts-ignore
                        this.chart.xAxis().tickFormat((d) => moment__default(d).format(this.option.xAxisOption.dateTickFormat));
                    }
                    break;
                default:
                    // @ts-ignore
                    this.chart.x(d3.scaleLinear().domain([min, max]));
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
            this.chart.seriesSort((a, b) => {
                const order = this.option.order;
                const before = order.indexOf(a);
                const after = order.indexOf(b);
                return before - after;
            });
        }
        // renderlet
        this.chart['renderOn'] = (chart) => {
            if (this.option.highlight) {
                this.renderHighlight(chart);
            }
        };
        // update
        this.chart['update'] = () => {
            let rightWidth = 0;
            this.chart.redraw();
            this.setLeftYAxis();
            setTimeout(() => {
                this.option.axisOption.forEach((v, i) => {
                    if (i && !v.hide) {
                        rightWidth += +v.width ? +v.width : 0;
                    }
                });
                // right yAxis 2개 이상부터 35씩 추가
                // @ts-ignore
                if (this.option.yAxisOptions.length > 2) {
                    // @ts-ignore
                    rightWidth += (this.option.yAxisOptions.length - 2) * 35;
                }
                if (this.option.elasticRightMargin) {
                    this.chart.margins().right = this.chart.marginRight + rightWidth;
                }
                else {
                    this.chart.margins().right = this.chart.marginRight;
                }
                // left yAxis 의 width 구하기
                if (this.option.elasticLeftMargin) {
                    leftYAxisWidth = this.chart.svg().selectAll('.axis.y')._groups[0][0].getBoundingClientRect().width + 20;
                    this.chart.margins().left = this.option.axisOption[0].axisLabel || this.option.yAxisLabel ? leftYAxisWidth : this.chart.margins().left;
                }
                // left margin 영역 만큼 chart g 이동
                const chartBodys = this.chart.g().selectAll('g.chart-body');
                const gridLines = this.chart.g().selectAll('g.grid-line');
                const highlight = this.chart.g().selectAll('g.highlight');
                transition(chartBodys, this.chart.transitionDuration(), this.chart.transitionDelay())
                    .attr('transform', `translate(${this.chart.margins().left}, ${this.chart.margins().top})`);
                transition(gridLines, this.chart.transitionDuration(), this.chart.transitionDelay())
                    .attr('transform', `translate(${this.chart.margins().left}, ${this.chart.margins().top})`);
                transition(highlight, this.chart.transitionDuration(), this.chart.transitionDelay())
                    .attr('transform', `translate(${this.chart.margins().left}, ${this.chart.margins().top})`);
                setTimeout(() => {
                    this.chart.redraw();
                });
            }, 500);
        };
        // redraw change
        this.chart['_redraw'] = this.chart.redraw;
        this.chart['_redraw'] = this.chart.redraw;
        this.chart['redraw'] = () => {
            this.chart._redraw();
            this.chart.renderOn(this.chart);
        };
        // render change
        this.chart['_render'] = this.chart.render;
        this.chart.render = () => {
            this.chart['marginRight'] = this.chart.margins().right;
            this.chart._render();
            setTimeout(() => {
                this.chart.update();
            }, 300);
        };
    }
    setLeftYAxis() {
        const axisOption = this.option.axisOption;
        if (axisOption && axisOption[0]) {
            let domain;
            const leftOption = axisOption[0];
            // domain
            if (axisOption && axisOption.length && leftOption.domain) {
                domain = leftOption.domain;
            }
            else {
                if (this.chart.group().all().length) {
                    domain = [
                        // @ts-ignore
                        d3.min(this.chart.group().all(), (d) => typeof d.value === 'object' ? d.value.value : d.value) + (this.option.gap ? -this.option.gap : 0),
                        d3.max(this.chart.group().all(), (d) => typeof d.value === 'object' ? d.value.value : d.value) + (this.option.gap ? this.option.gap : 0)
                    ];
                }
                else {
                    domain = [0, 100];
                }
            }
            this.chart.y(d3.scaleLinear().domain(domain ? domain : [0, 100]));
            // tickformat
            if (leftOption.tickFormat) {
                this.chart.yAxis().tickFormat(leftOption.tickFormat);
            }
            else if (leftOption.prevTickText || leftOption.nextTickText) {
                const tickFormat = (d) => {
                    let tick = '';
                    if (leftOption.prevTickText) {
                        tick += leftOption.prevTickText;
                    }
                    tick += this.commaSeparateNumber(d) || 0;
                    if (leftOption.nextTickText) {
                        tick += leftOption.nextTickText;
                    }
                    return tick;
                };
                this.chart.yAxis().tickFormat(tickFormat);
            }
            else {
                this.chart.yAxis().tickFormat((d) => this.commaSeparateNumber(d) || 0);
            }
            // label
            if (leftOption.axisLabel) {
                this.chart.yAxisLabel(leftOption.axisLabel);
            }
        }
        else {
            this.chart.y(d3.scaleLinear().domain([0, 100]));
        }
    }
    setWidthHeight() {
        this.width = this.option.width ? this.option.width : this.elRef.nativeElement.clientWidth || 200;
        this.height = this.option.height ? this.option.height : this.elRef.nativeElement.clientHeight || 400;
        this.chart
            .width(this.width)
            .height(this.height);
    }
    filter() {
        if (!this.option.filters) {
            this.option['filters'] = [];
        }
        return {
            filter: (d) => {
                this.option.filters = this.getFilters();
                this.changFilter.emit();
            },
            filterExact: (d) => {
                this.option.filters = this.getFilters();
                this.changFilter.emit();
            },
            filterFunction: (d, e) => {
                this.option.filters = this.getFilters();
                this.changFilter.emit();
            }
        };
    }
    getFilters() {
        const filters = this.chart.filters().map((d) => {
            if (Array.isArray(d)) {
                return d[0];
            }
            else {
                return d;
            }
        });
        return filters;
    }
    getTooltipElem() {
        if (!this._tooltip || this._tooltip.empty()) {
            this._tooltip = d3.select('body')
                .append('div')
                .attr('class', 'wise-chart-tooltip')
                .html('')
                .style('opacity', 0)
                .style('position', 'absolute')
                .style('z-index', 10000);
        }
        return this._tooltip;
    }
    renderHighlight(chart) {
        const g = chart.g();
        let highlight = g.selectAll('g.highlight');
        if (highlight.empty()) {
            highlight = g.insert('g', ':first-child')
                .attr('class', 'highlight')
                .attr('transform', `translate(${this.chart.margins().left},${this.chart.margins().top})`);
        }
        const sections = highlight.selectAll('rect.section').data(this.option.highlight);
        sections.enter()
            .append('rect')
            .attr('class', (d, i) => `section _${i}`)
            .attr('fill', (d) => d.color || 'blue')
            .attr('fill-opacity', (d) => d.opacity || .3)
            .attr('stroke', '#fff')
            .attr('x', (d) => {
            const domain = d.domain;
            let x0;
            // @ts-ignore
            if (this.option.xAxisOption.type === 'date') {
                // @ts-ignore
                const dateFormat = this.option.xAxisOption.dateFormat;
                if (domain[0].valueOf) {
                    x0 = domain[0].valueOf();
                }
                else {
                    x0 = moment__default(domain[0], dateFormat).valueOf();
                }
            }
            else {
                x0 = domain[0];
            }
            return this.chart.x()(x0);
        })
            .attr('y', 0)
            .attr('height', this.chart.yAxisHeight())
            .attr('width', (d) => {
            const domain = d.domain;
            let x0, x1;
            // @ts-ignore
            if (this.option.xAxisOption.type === 'date') {
                // @ts-ignore
                const dateFormat = this.option.xAxisOption.dateFormat;
                x0 = moment__default(domain[0], dateFormat).valueOf();
                x1 = moment__default(domain[1], dateFormat).valueOf();
            }
            else {
                x0 = domain[0];
                x1 = domain[1];
            }
            const x = this.chart.x()(x0);
            return this.chart.x()(x1) - x;
        });
        transition(sections, this.chart.transitionDuration(), this.chart.transitionDelay())
            .attr('fill', d => d.color || 'blue')
            .attr('fill-opacity', d => d.opacity || .3)
            .attr('stroke', '#fff')
            .attr('x', d => {
            const domain = d.domain;
            let x0;
            // @ts-ignore
            if (this.option.xAxisOption.type === 'date') {
                // @ts-ignore
                const dateFormat = this.option.xAxisOption.dateFormat;
                x0 = moment__default(domain[0], dateFormat).valueOf();
            }
            else {
                x0 = domain[0];
            }
            return this.chart.x()(x0);
        })
            .attr('width', d => {
            const domain = d.domain;
            let x0, x1;
            // @ts-ignore
            if (this.option.xAxisOption.type === 'date') {
                // @ts-ignore
                const dateFormat = this.option.xAxisOption.dateFormat;
                x0 = moment__default(domain[0], dateFormat).valueOf();
                x1 = moment__default(domain[1], dateFormat).valueOf();
            }
            else {
                x0 = domain[0];
                x1 = domain[1];
            }
            const x = this.chart.x()(x0);
            return this.chart.x()(x1) - x;
        });
        transition(sections.exit(), this.chart.transitionDuration(), this.chart.transitionDelay()).attr('opacity', 0).remove();
    }
    commaSeparateNumber(value) {
        if (!value) {
            return '';
        }
        while (/(\d+)(\d{3})/.test(value.toString())) {
            value = value.toString().replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1,');
        }
        return value;
    }
}
AngularDjChartComponent.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "12.1.1", ngImport: i0, type: AngularDjChartComponent, deps: [{ token: i0.ElementRef }, { token: i0.NgZone }], target: i0.ɵɵFactoryTarget.Component });
AngularDjChartComponent.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "12.0.0", version: "12.1.1", type: AngularDjChartComponent, selector: "dj-chart", inputs: { option: "option" }, outputs: { changFilter: "changFilter", rendered: "rendered" }, ngImport: i0, template: ``, isInline: true, styles: ["::ng-deep dj-chart svg.wise-chart-cloud text{font-family:Noto Sans KR,Nanum Gothic Coding,SpoqaHanSans,sans-serif!important;cursor:pointer}::ng-deep dj-chart svg.wise-chart-cloud text:hover{opacity:.5}::ng-deep dj-chart .axis line,::ng-deep dj-chart .axis path{fill:none;stroke:#000;shape-rendering:crispEdges}::ng-deep dj-chart .drag rect.extent{fill:#008bff;fill-opacity:.2}::ng-deep dj-chart .x-axis-label,::ng-deep dj-chart .y-axis-label{opacity:.5;font-size:11px!important}::ng-deep dj-chart g.dc-legend{font-size:15px}::ng-deep dj-chart app-wise-chart.radar{margin:0!important}::ng-deep dj-chart app-wise-chart .svg-vis .level-labels{font-size:9px}::ng-deep dj-chart app-wise-chart .svg-vis.radarAxis .axis-labels{font-size:9px}::ng-deep dj-chart .ntnChart .y.axis .tick text{font-size:9px}::ng-deep dj-chart.dc-chart .axis text,::ng-deep dj-chart.dc-chart .bar_group text.text{font-size:9px;font-family:Helvetica Neue,Roboto,Arial,Droid Sans,sans-serif}::ng-deep dj-chart .test-result-tc g.dc-legend{font-size:11px}::ng-deep dj-chart .annotation{font-size:100%;font-weight:inherit}::ng-deep dj-chart.dc-chart path.dc-symbol,::ng-deep dj-chart .dc-legend g.dc-legend-item.fadeout{fill-opacity:.5;stroke-opacity:.5}::ng-deep dj-chart.dc-chart rect.bar{stroke:none;cursor:pointer}::ng-deep dj-chart.dc-chart rect.bar:hover{fill-opacity:.5}::ng-deep dj-chart.dc-chart rect.deselected{stroke:none;fill:#ccc}::ng-deep dj-chart.dc-chart .pie-slice{fill:#fff;font-size:12px;cursor:pointer}::ng-deep dj-chart.dc-chart .pie-slice.external{fill:#000}::ng-deep dj-chart.dc-chart .pie-slice.highlight,::ng-deep dj-chart.dc-chart .pie-slice :hover{fill-opacity:.8}::ng-deep dj-chart.dc-chart .pie-path{fill:none;stroke-width:2px;stroke:#000;opacity:.4}::ng-deep dj-chart.dc-chart .selected circle,::ng-deep dj-chart.dc-chart .selected path{stroke-width:3;stroke:#ccc;fill-opacity:1}::ng-deep dj-chart.dc-chart .deselected circle,::ng-deep dj-chart.dc-chart .deselected path{stroke:none;fill-opacity:.5;fill:#ccc}::ng-deep dj-chart.dc-chart .axis line,::ng-deep dj-chart.dc-chart .axis path{fill:none;stroke:#000;shape-rendering:crispEdges}::ng-deep dj-chart.dc-chart .axis text{font:10px sans-serif}::ng-deep dj-chart.dc-chart .axis .grid-line,::ng-deep dj-chart.dc-chart .axis .grid-line line,::ng-deep dj-chart.dc-chart .grid-line,::ng-deep dj-chart.dc-chart .grid-line line{fill:none;stroke:#ccc;shape-rendering:crispEdges}::ng-deep dj-chart.dc-chart .brush rect.selection{fill:#4682b4;fill-opacity:.125}::ng-deep dj-chart.dc-chart .brush .custom-brush-handle{fill:#eee;stroke:#666;cursor:ew-resize}::ng-deep dj-chart.dc-chart path.line{fill:none;stroke-width:1.5px}::ng-deep dj-chart.dc-chart path.area{fill-opacity:.3;stroke:none}::ng-deep dj-chart.dc-chart path.highlight{stroke-width:3;fill-opacity:1;stroke-opacity:1}::ng-deep dj-chart.dc-chart g.state{cursor:pointer}::ng-deep dj-chart.dc-chart g.state :hover{fill-opacity:.8}::ng-deep dj-chart.dc-chart g.state path{stroke:#fff}::ng-deep dj-chart.dc-chart g.deselected path{fill:grey}::ng-deep dj-chart.dc-chart g.deselected text{display:none}::ng-deep dj-chart.dc-chart g.row rect{fill-opacity:.8;cursor:pointer}::ng-deep dj-chart.dc-chart g.row rect:hover{fill-opacity:.6}::ng-deep dj-chart.dc-chart g.row text{fill:#fff;font-size:12px;cursor:pointer}::ng-deep dj-chart.dc-chart g.dc-tooltip path{fill:none;stroke:grey;stroke-opacity:.8}::ng-deep dj-chart.dc-chart g.county path{stroke:#fff;fill:none}::ng-deep dj-chart.dc-chart g.debug rect{fill:#00f;fill-opacity:.2}::ng-deep dj-chart.dc-chart g.axis text{-webkit-touch-callout:none;-webkit-user-select:none;user-select:none;pointer-events:none}::ng-deep dj-chart.dc-chart .node{font-size:.7em;cursor:pointer}::ng-deep dj-chart.dc-chart .node :hover{fill-opacity:.8}::ng-deep dj-chart.dc-chart .bubble{stroke:none;fill-opacity:.6}::ng-deep dj-chart.dc-chart .highlight{fill-opacity:1;stroke-opacity:1}::ng-deep dj-chart.dc-chart .fadeout{fill-opacity:.2;stroke-opacity:.2}::ng-deep dj-chart.dc-chart .box text{font:10px sans-serif;-webkit-touch-callout:none;-webkit-user-select:none;user-select:none;pointer-events:none}::ng-deep dj-chart.dc-chart .box line{fill:#fff}::ng-deep dj-chart.dc-chart .box circle,::ng-deep dj-chart.dc-chart .box line,::ng-deep dj-chart.dc-chart .box rect{stroke:#000;stroke-width:1.5px}::ng-deep dj-chart.dc-chart .box .center{stroke-dasharray:3,3}::ng-deep dj-chart.dc-chart .box .data{stroke:none;stroke-width:0px}::ng-deep dj-chart.dc-chart .box .outlier{fill:none;stroke:#ccc}::ng-deep dj-chart.dc-chart .box .outlierBold{fill:red;stroke:none}::ng-deep dj-chart.dc-chart .box.deselected{opacity:.5}::ng-deep dj-chart.dc-chart .box.deselected .box{fill:#ccc}::ng-deep dj-chart.dc-chart .symbol{stroke-width:1.5px;cursor:pointer}::ng-deep dj-chart.dc-chart .heatmap .box-group.deselected rect{stroke:none;fill-opacity:.5;fill:#ccc}::ng-deep dj-chart.dc-chart .heatmap g.axis text{pointer-events:all;cursor:pointer}::ng-deep dj-chart.dc-chart .empty-chart .pie-slice{cursor:default}::ng-deep dj-chart.dc-chart .empty-chart .pie-slice path{fill:#fee;cursor:default}::ng-deep dj-chart .dc-data-count{float:right;margin-top:15px;margin-right:15px}::ng-deep dj-chart .dc-data-count .filter-count,::ng-deep dj-chart .dc-data-count .total-count{color:#3182bd;font-weight:700}::ng-deep dj-chart .dc-legend{font-size:11px}::ng-deep dj-chart .dc-legend .dc-legend-item{cursor:pointer}::ng-deep dj-chart .dc-legend g.dc-legend-item.selected{fill:blue}::ng-deep dj-chart .dc-hard .number-display{float:none}::ng-deep dj-chart div.dc-html-legend{overflow-y:auto;overflow-x:hidden;height:inherit;float:right;padding-right:2px}::ng-deep dj-chart div.dc-html-legend .dc-legend-item-horizontal{display:inline-block;margin-left:5px;margin-right:5px;cursor:pointer}::ng-deep dj-chart div.dc-html-legend .dc-legend-item-horizontal.selected{background-color:#3182bd;color:#fff}::ng-deep dj-chart div.dc-html-legend .dc-legend-item-vertical{display:block;margin-top:5px;padding-top:1px;padding-bottom:1px;cursor:pointer}::ng-deep dj-chart div.dc-html-legend .dc-legend-item-vertical.selected{background-color:#3182bd;color:#fff}::ng-deep dj-chart div.dc-html-legend .dc-legend-item-color{display:table-cell;width:12px;height:12px}::ng-deep dj-chart div.dc-html-legend .dc-legend-item-label{line-height:12px;display:table-cell;vertical-align:middle;padding-left:3px;padding-right:3px;font-size:.75em}::ng-deep dj-chart .dc-html-legend-container{height:inherit}::ng-deep .wise-chart-tooltip{position:relative;min-width:30px;min-height:30px;padding:8px;border-radius:4px;color:#fff}::ng-deep .wise-chart-tooltip:after,::ng-deep .wise-chart-tooltip:before{border:solid #0000;content:\" \";height:0;width:0;position:absolute;pointer-events:none}::ng-deep .wise-chart-tooltip:after{border-color:#fff0;border-width:5px;margin-top:-5px}::ng-deep .wise-chart-tooltip:before{border-color:#0000;border-width:6px;margin-top:-6px}::ng-deep .wise-chart-tooltip.top:after,::ng-deep .wise-chart-tooltip.top:before{top:10px}::ng-deep .wise-chart-tooltip.bottom:after,::ng-deep .wise-chart-tooltip.bottom:before{bottom:4px}::ng-deep .wise-chart-tooltip:after,::ng-deep .wise-chart-tooltip:before{bottom:-10px;border-top-color:inherit;left:calc(50% - 6px)}"] });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "12.1.1", ngImport: i0, type: AngularDjChartComponent, decorators: [{
            type: Component,
            args: [{
                    selector: 'dj-chart',
                    template: ``,
                    styleUrls: ['./angular-dj-chart.component.scss']
                }]
        }], ctorParameters: function () { return [{ type: i0.ElementRef }, { type: i0.NgZone }]; }, propDecorators: { option: [{
                type: Input,
                args: ['option']
            }], changFilter: [{
                type: Output
            }], rendered: [{
                type: Output
            }] } });

class AngularDjChartModule {
}
AngularDjChartModule.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "12.1.1", ngImport: i0, type: AngularDjChartModule, deps: [], target: i0.ɵɵFactoryTarget.NgModule });
AngularDjChartModule.ɵmod = i0.ɵɵngDeclareNgModule({ minVersion: "12.0.0", version: "12.1.1", ngImport: i0, type: AngularDjChartModule, declarations: [AngularDjChartComponent], exports: [AngularDjChartComponent] });
AngularDjChartModule.ɵinj = i0.ɵɵngDeclareInjector({ minVersion: "12.0.0", version: "12.1.1", ngImport: i0, type: AngularDjChartModule, imports: [[]] });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "12.1.1", ngImport: i0, type: AngularDjChartModule, decorators: [{
            type: NgModule,
            args: [{
                    declarations: [
                        AngularDjChartComponent
                    ],
                    imports: [],
                    exports: [
                        AngularDjChartComponent
                    ]
                }]
        }] });

class AxisOption {
    constructor(fields) {
        const fieldList = ['axisLabel', 'color', 'domain', 'hide', 'series', 'errorBar', 'type', 'size', 'tickFormat',
            'ticks', 'renderArea', 'smooth', 'dashStyle', 'lineWidth'];
        fieldList.forEach(key => {
            if (fields[key] !== undefined) {
                // @ts-ignore
                this[key] = fields[key];
            }
        });
    }
    setDomain(data) {
        // @ts-ignore
        this.domain = [d3.min(data, d => d.value), d3.max(data, d => d.value)];
    }
    setAxisLabel(axisLabel) {
        this.axisLabel = axisLabel;
    }
}

const moment = moment$1;
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
class DjChartOption {
    constructor(chartOption) {
        this.elasticLeftMargin = true;
        this.elasticRightMargin = true;
        this._legendObj = {};
        const defaultOption = {
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
                defaultOption[chartOption.type].forEach(field => {
                    // @ts-ignore
                    if (chartOption[field] !== undefined) {
                        // @ts-ignore
                        this[field] = chartOption[field];
                    }
                });
            }
            if (chartOption.type === DjChartType.DC_CHART) {
                Object.keys(chartOption).forEach(key => {
                    // @ts-ignore
                    this[key] = chartOption[key];
                });
            }
            if (chartOption.data) {
                this.setData(chartOption.data);
            }
        }
    }
    setData(data) {
        if (this.type === DjChartType.COMPOSITE && this.xAxisOption && this.xAxisOption.type === 'date') {
            this.data = data;
            this.data.forEach((d) => {
                // @ts-ignore
                d.key[1] = moment(d.key[1], this.xAxisOption.dateFormat).toDate();
            });
        }
        else {
            this.data = data;
        }
    }
    setAxisOption() {
        if (this.yAxisOptions) {
            let data;
            const seriesTypes = this.seriesTypes || {};
            const axisOption = [];
            if (this.data !== undefined) {
                data = this.data;
            }
            else {
                data = this.group().all();
            }
            this.yAxisOptions.forEach(axis => {
                // @ts-ignore
                const filterData = data.filter((d) => {
                    if (axis.keys.indexOf(d.key[0]) > -1) {
                        return true;
                    }
                });
                const max = d3.max(filterData, d => d.value);
                const min = d3.min(filterData, d => d.value) || 0;
                axis.keys.forEach((key, i) => {
                    const _option = {
                        axisLabel: axis.axisLabel,
                        domain: axis.domain ? axis.domain : [min, max],
                        hide: i,
                        series: key,
                        type: seriesTypes[key] || 'line',
                        size: axis.size || 6,
                    };
                    if (this.seriesOptions && this.seriesOptions[key]) {
                        Object.keys(this.seriesOptions[key]).forEach(op => {
                            // @ts-ignore
                            _option[op] = this.seriesOptions[key][op];
                        });
                    }
                    if (this.colors && this.colors[key]) {
                        _option['color'] = this.colors[key];
                    }
                    if (axis.prevTickText || axis.nextTickText) {
                        _option['tickFormat'] = (d) => {
                            let tick = '';
                            if (axis.prevTickText) {
                                tick += axis.prevTickText;
                            }
                            tick += this.commaSeparateNumber(d) || 0;
                            if (axis.nextTickText) {
                                tick += axis.nextTickText;
                            }
                            return tick;
                        };
                    }
                    if (axis.tickFormat) {
                        _option['tickFormat'] = axis.tickFormat;
                    }
                    axisOption.push(new AxisOption(_option));
                });
            });
            return this.axisOption = axisOption;
        }
        return this.axisOption = [];
    }
    getKeys() {
        const keys = this.data.map((d) => {
            if (Array.isArray(d.key)) {
                return d.key[0];
            }
            return d.key;
        });
        return _.uniq(keys);
    }
    getLegends() {
        if (!this._legendObj) {
            this.setLegendObj();
        }
        return this._legendObj;
    }
    setFilters(filters) {
        this.setLegendObj();
    }
    filterAll() {
        this.chart.filterAll();
    }
    setLegendObj() {
        this._legendObj = [];
        this.getKeys().forEach(key => {
            const legend = {
                key: key,
                // @ts-ignore
                name: this.legends[key] || key,
                filter: () => this.chart.filter(key),
                color: () => {
                    const defaultColor = this.chart.getColor(key);
                    // @ts-ignore
                    return this.colors ? this.colors[key] || defaultColor : defaultColor;
                }
            };
            this._legendObj.push(legend);
        });
    }
    commaSeparateNumber(value) {
        if (!value) {
            return '';
        }
        while (/(\d+)(\d{3})/.test(value.toString())) {
            value = value.toString().replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1,');
        }
        return value;
    }
}

/*
 * Public API Surface of angular-dj-chart
 */

/**
 * Generated bundle index. Do not edit.
 */

export { AngularDjChartComponent, AngularDjChartModule, AngularDjChartService, AxisOption, DjChartOption };
//# sourceMappingURL=angular-dj-chart.js.map
