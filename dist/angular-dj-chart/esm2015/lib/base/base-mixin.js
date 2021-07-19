import { select } from 'd3-selection';
import { dispatch } from 'd3-dispatch';
import { pluck, utils, instanceOfChart, deregisterChart, redrawAll, registerChart, renderAll, events, logger, printers } from 'dc';
class InvalidStateException extends Error {
}
class BadArgumentException extends Error {
}
const constants = {
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
export class BaseMixin {
    constructor() {
        this._filterHandler = _defaultFilterHandler;
        this._hasFilterHandler = _defaultHasFilterHandler;
        this._removeFilterHandler = _defaultRemoveFilterHandler;
        this._addFilterHandler = _defaultAddFilterHandler;
        this._resetFilterHandler = _defaultResetFilterHandler;
        this.__dcFlag__ = utils.uniqueId();
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
        this._chartGroup = constants.DEFAULT_CHART_GROUP;
        this._listeners = dispatch('preRender', 'postRender', 'preRedraw', 'postRedraw', 'filtered', 'zoomed', 'renderlet', 'pretransition');
        this._legend = undefined;
        this._commitHandler = undefined;
        this._defaultData = (group) => group.all();
        this._data = this._defaultData;
        this._filters = [];
    }
    height(height) {
        if (height === undefined) {
            if (!utils.isNumber(this._height)) {
                // only calculate once
                this._height = this._heightCalc(this._root.node());
            }
            return this._height;
        }
        this._heightCalc = height ? (typeof height === 'function' ? height : utils.constant(height)) : this._defaultHeightCalc;
        this._height = undefined;
        return this;
    }
    width(width) {
        if (width === undefined) {
            if (!utils.isNumber(this._width)) {
                // only calculate once
                this._width = this._widthCalc(this._root.node());
            }
            return this._width;
        }
        this._widthCalc = width ? (typeof width === 'function' ? width : utils.constant(width)) : this._defaultWidthCalc;
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
        this._data = typeof callback === 'function' ? callback : utils.constant(callback);
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
            this._root.classed(constants.CHART_CLASS, true);
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
        select(e).classed(constants.SELECTED_CLASS, true);
        select(e).classed(constants.DESELECTED_CLASS, false);
    }
    fadeDeselected(e) {
        select(e).classed(constants.SELECTED_CLASS, false);
        select(e).classed(constants.DESELECTED_CLASS, true);
    }
    resetHighlight(e) {
        select(e).classed(constants.SELECTED_CLASS, false);
        select(e).classed(constants.DESELECTED_CLASS, false);
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
        this.on(`renderlet.${utils.uniqueId()}`, renderletFunction);
        return this;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFzZS1taXhpbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3Byb2plY3RzL2FuZ3VsYXItZGotY2hhcnQvc3JjL2xpYi9iYXNlL2Jhc2UtbWl4aW4udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFDLE1BQU0sRUFBQyxNQUFNLGNBQWMsQ0FBQztBQUNwQyxPQUFPLEVBQUMsUUFBUSxFQUFDLE1BQU0sYUFBYSxDQUFDO0FBRXJDLE9BQU8sRUFBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLGVBQWUsRUFBRSxlQUFlLEVBQUUsU0FBUyxFQUFFLGFBQWEsRUFBRSxTQUFTLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxRQUFRLEVBQUMsTUFBTSxJQUFJLENBQUM7QUFHakksTUFBTSxxQkFBc0IsU0FBUSxLQUFLO0NBQUc7QUFDNUMsTUFBTSxvQkFBcUIsU0FBUSxLQUFLO0NBQUc7QUFFM0MsTUFBTSxTQUFTLEdBQUc7SUFDaEIsV0FBVyxFQUFFLFVBQVU7SUFDdkIsaUJBQWlCLEVBQUUsT0FBTztJQUMxQixXQUFXLEVBQUUsT0FBTztJQUNwQixnQkFBZ0IsRUFBRSxZQUFZO0lBQzlCLGNBQWMsRUFBRSxVQUFVO0lBQzFCLGVBQWUsRUFBRSxXQUFXO0lBQzVCLGdCQUFnQixFQUFFLGlCQUFpQjtJQUNuQyxtQkFBbUIsRUFBRSx5QkFBeUI7SUFDOUMsV0FBVyxFQUFFLEVBQUU7SUFDZixpQkFBaUIsRUFBRSxLQUFLO0NBQ3pCLENBQUM7QUFHRixNQUFNLHFCQUFxQixHQUFHLENBQUMsU0FBYyxFQUFFLE9BQW1CLEVBQUUsRUFBRTtJQUNwRSxJQUFJLE9BQU8sQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFO1FBQ3hCLFNBQVMsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7S0FDeEI7U0FBTSxJQUFJLE9BQU8sQ0FBQyxNQUFNLEtBQUssQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFD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QUFJLElBQUksRUFBRTtZQUNwQixhQUFhO1lBQ2IsSUFBSSxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssVUFBVSxFQUFFO2dCQUNuQyxJQUFJLElBQUksQ0FBQyxDQUFDLENBQUMsWUFBWSxLQUFLLElBQUksWUFBWSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRTtvQkFDOUQsYUFBYTtvQkFDYixJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztpQkFDOUI7cUJBQU07b0JBQ0wsYUFBYTtvQkFDYixJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztpQkFDN0I7YUFDRjtpQkFBTTtnQkFDTCxNQUFNLENBQUMsS0FBSyxDQUFDLG1DQUFtQyxDQUFDLEVBQUUsQ0FBQyxDQUFDO2FBQ3REO1NBQ0Y7UUFDRCxPQUFPLElBQUksQ0FBQztJQUNkLENBQUM7SUFFRCxFQUFFLENBQUMsS0FBVSxFQUFFLFFBQWE7UUFDMUIsSUFBSSxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUMsS0FBSyxFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBQ3BDLE9BQU8sSUFBSSxDQUFDO0lBQ2QsQ0FBQztJQUVELFNBQVMsQ0FBRSxpQkFBc0I7UUFDL0IsTUFBTSxDQUFDLFFBQVEsQ0FBQyx5R0FBeUcsQ0FBQyxDQUFDO1FBQzNILElBQUksQ0FBQyxFQUFFLENBQUMsYUFBYSxLQUFLLENBQUMsUUFBUSxFQUFFLEVBQUUsRUFBRSxpQkFBaUIsQ0FBQyxDQUFDO1FBQzVELE9BQU8sSUFBSSxDQUFDO0lBQ2QsQ0FBQztDQUNGIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtzZWxlY3R9IGZyb20gJ2QzLXNlbGVjdGlvbic7XG5pbXBvcnQge2Rpc3BhdGNofSBmcm9tICdkMy1kaXNwYXRjaCc7XG5cbmltcG9ydCB7cGx1Y2ssIHV0aWxzLCBpbnN0YW5jZU9mQ2hhcnQsIGRlcmVnaXN0ZXJDaGFydCwgcmVkcmF3QWxsLCByZWdpc3RlckNoYXJ0LCByZW5kZXJBbGwsIGV2ZW50cywgbG9nZ2VyLCBwcmludGVyc30gZnJvbSAnZGMnO1xuaW1wb3J0IHtFbGVtZW50UmVmfSBmcm9tICdAYW5ndWxhci9jb3JlJztcblxuY2xhc3MgSW52YWxpZFN0YXRlRXhjZXB0aW9uIGV4dGVuZHMgRXJyb3Ige31cbmNsYXNzIEJhZEFyZ3VtZW50RXhjZXB0aW9uIGV4dGVuZHMgRXJyb3Ige31cblxuY29uc3QgY29uc3RhbnRzID0ge1xuICBDSEFSVF9DTEFTUzogJ2RjLWNoYXJ0JyxcbiAgREVCVUdfR1JPVVBfQ0xBU1M6ICdkZWJ1ZycsXG4gIFNUQUNLX0NMQVNTOiAnc3RhY2snLFxuICBERVNFTEVDVEVEX0NMQVNTOiAnZGVzZWxlY3RlZCcsXG4gIFNFTEVDVEVEX0NMQVNTOiAnc2VsZWN0ZWQnLFxuICBOT0RFX0lOREVYX05BTUU6ICdfX2luZGV4X18nLFxuICBHUk9VUF9JTkRFWF9OQU1FOiAnX19ncm91cF9pbmRleF9fJyxcbiAgREVGQVVMVF9DSEFSVF9HUk9VUDogJ19fZGVmYXVsdF9jaGFydF9ncm91cF9fJyxcbiAgRVZFTlRfREVMQVk6IDQwLFxuICBORUdMSUdJQkxFX05VTUJFUjogMWUtMTBcbn07XG5cblxuY29uc3QgX2RlZmF1bHRGaWx0ZXJIYW5kbGVyID0gKGRpbWVuc2lvbjogYW55LCBmaWx0ZXJzOiBBcnJheTxhbnk+KSA9PiB7XG4gIGlmIChmaWx0ZXJzLmxlbmd0aCA9PT0gMCkge1xuICAgIGRpbWVuc2lvbi5maWx0ZXIobnVsbCk7XG4gIH0gZWxzZSBpZiAoZmlsdGVycy5sZW5ndGggPT09IDEgJiYgIWZpbHRlcnNbMF0uaXNGaWx0ZXJlZCkge1xuICAgIC8vIHNpbmdsZSB2YWx1ZSBhbmQgbm90IGEgZnVuY3Rpb24tYmFzZWQgZmlsdGVyXG4gICAgZGltZW5zaW9uLmZpbHRlckV4YWN0KGZpbHRlcnNbMF0pO1xuICB9IGVsc2UgaWYgKGZpbHRlcnMubGVuZ3RoID09PSAxICYmIGZpbHRlcnNbMF0uZmlsdGVyVHlwZSA9PT0gJ1JhbmdlZEZpbHRlcicpIHtcbiAgICAvLyBzaW5nbGUgcmFuZ2UtYmFzZWQgZmlsdGVyXG4gICAgZGltZW5zaW9uLmZpbHRlclJhbmdlKGZpbHRlcnNbMF0pO1xuICB9IGVsc2Uge1xuICAgIGRpbWVuc2lvbi5maWx0ZXJGdW5jdGlvbiggKGQ6IGFueSkgPT4ge1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBmaWx0ZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNvbnN0IGZpbHRlciA9IGZpbHRlcnNbaV07XG4gICAgICAgIGlmIChmaWx0ZXIuaXNGaWx0ZXJlZCkge1xuICAgICAgICAgIGlmIChmaWx0ZXIuaXNGaWx0ZXJlZChkKSkge1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKGZpbHRlciA8PSBkICYmIGZpbHRlciA+PSBkKSB7XG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9KTtcbiAgfVxuICByZXR1cm4gZmlsdGVycztcbn07XG5cbmNvbnN0IF9kZWZhdWx0SGFzRmlsdGVySGFuZGxlciA9IChmaWx0ZXJzOiBBcnJheTxhbnk+LCBmaWx0ZXI6IGFueSkgPT4ge1xuICBpZiAoZmlsdGVyID09PSBudWxsIHx8IHR5cGVvZiAoZmlsdGVyKSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICByZXR1cm4gZmlsdGVycy5sZW5ndGggPiAwO1xuICB9XG4gIHJldHVybiBmaWx0ZXJzLnNvbWUoZiA9PiBmaWx0ZXIgPD0gZiAmJiBmaWx0ZXIgPj0gZik7XG59O1xuXG5jb25zdCBfZGVmYXVsdFJlbW92ZUZpbHRlckhhbmRsZXIgPSAoZmlsdGVyczogQXJyYXk8YW55PiwgZmlsdGVyOiBhbnkpID0+IHtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBmaWx0ZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKGZpbHRlcnNbaV0gPD0gZmlsdGVyICYmIGZpbHRlcnNbaV0gPj0gZmlsdGVyKSB7XG4gICAgICBmaWx0ZXJzLnNwbGljZShpLCAxKTtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuICByZXR1cm4gZmlsdGVycztcbn07XG5cbmNvbnN0IF9kZWZhdWx0QWRkRmlsdGVySGFuZGxlciA9IChmaWx0ZXJzOiBBcnJheTxhbnk+LCBmaWx0ZXI6IGFueSkgPT4ge1xuICBmaWx0ZXJzLnB1c2goZmlsdGVyKTtcbiAgcmV0dXJuIGZpbHRlcnM7XG59O1xuXG5jb25zdCBfZGVmYXVsdFJlc2V0RmlsdGVySGFuZGxlciA9IChmaWx0ZXJzOiBBcnJheTxhbnk+KSA9PiBbXTtcblxuZXhwb3J0IGNsYXNzIEJhc2VNaXhpbiB7XG4gIF9fZGNGbGFnX187XG4gIF9kaW1lbnNpb246IHVuZGVmaW5lZDtcbiAgX2dyb3VwOiB1bmRlZmluZWQ7XG4gIF9ncm91cE5hbWU6IGFueTtcbiAgX2FuY2hvcjogc3RyaW5nIHwgdW5kZWZpbmVkO1xuICAvLyBAdHMtaWdub3JlXG4gIF9yb290O1xuICAvLyBAdHMtaWdub3JlXG4gIF9zdmc7XG4gIF9pc0NoaWxkOiBib29sZWFuIHwgdW5kZWZpbmVkO1xuICBfbWluV2lkdGg7XG4gIC8vIEB0cy1pZ25vcmVcbiAgX2RlZmF1bHRXaWR0aENhbGM7XG4gIF93aWR0aENhbGM7XG4gIF9taW5IZWlnaHQ7XG4gIC8vIEB0cy1pZ25vcmVcbiAgX2RlZmF1bHRIZWlnaHRDYWxjO1xuICBfaGVpZ2h0Q2FsYztcbiAgX3dpZHRoOiBhbnk7XG4gIF9oZWlnaHQ6IGFueTtcbiAgX3VzZVZpZXdCb3hSZXNpemluZztcbiAgX2tleUFjY2Vzc29yO1xuICBfdmFsdWVBY2Nlc3NvcjtcbiAgX2xhYmVsO1xuICBfb3JkZXJpbmc7XG4gIF9yZW5kZXJMYWJlbDtcbiAgLy8gQHRzLWlnbm9yZVxuICBfdGl0bGU7XG4gIF9yZW5kZXJUaXRsZTogYW55O1xuICBfY29udHJvbHNVc2VWaXNpYmlsaXR5O1xuICBfdHJhbnNpdGlvbkR1cmF0aW9uO1xuICBfdHJhbnNpdGlvbkRlbGF5O1xuICBfZmlsdGVyUHJpbnRlcjtcbiAgLy8gQHRzLWlnbm9yZVxuICBfbWFuZGF0b3J5QXR0cmlidXRlc0xpc3Q7XG4gIF9jaGFydEdyb3VwO1xuICAvLyBAdHMtaWdub3JlXG4gIF9saXN0ZW5lcnM7XG5cbiAgLy8gQHRzLWlnbm9yZVxuICBfbGVnZW5kO1xuICAvLyBAdHMtaWdub3JlXG4gIF9jb21taXRIYW5kbGVyO1xuXG4gIC8vIEB0cy1pZ25vcmVcbiAgX2RlZmF1bHREYXRhO1xuICBfZGF0YTtcblxuICBfZmlsdGVyczogYW55W107XG5cbiAgX2ZpbHRlckhhbmRsZXIgPSBfZGVmYXVsdEZpbHRlckhhbmRsZXI7XG4gIF9oYXNGaWx0ZXJIYW5kbGVyID0gX2RlZmF1bHRIYXNGaWx0ZXJIYW5kbGVyO1xuICBfcmVtb3ZlRmlsdGVySGFuZGxlciA9IF9kZWZhdWx0UmVtb3ZlRmlsdGVySGFuZGxlcjtcbiAgX2FkZEZpbHRlckhhbmRsZXIgPSBfZGVmYXVsdEFkZEZpbHRlckhhbmRsZXI7XG4gIF9yZXNldEZpbHRlckhhbmRsZXIgPSBfZGVmYXVsdFJlc2V0RmlsdGVySGFuZGxlcjtcblxuICBjb25zdHJ1Y3RvciAoKSB7XG4gICAgdGhpcy5fX2RjRmxhZ19fID0gdXRpbHMudW5pcXVlSWQoKTtcblxuICAgIHRoaXMuX2RpbWVuc2lvbiA9IHVuZGVmaW5lZDtcbiAgICB0aGlzLl9ncm91cCA9IHVuZGVmaW5lZDtcblxuICAgIHRoaXMuX2FuY2hvciA9IHVuZGVmaW5lZDtcbiAgICB0aGlzLl9yb290ID0gdW5kZWZpbmVkO1xuICAgIHRoaXMuX3N2ZyA9IHVuZGVmaW5lZDtcbiAgICB0aGlzLl9pc0NoaWxkID0gdW5kZWZpbmVkO1xuXG4gICAgdGhpcy5fbWluV2lkdGggPSAxMDA7XG4gICAgdGhpcy5fZGVmYXVsdFdpZHRoQ2FsYyA9IChlbGVtZW50OiBFbGVtZW50KSA9PiB7XG4gICAgICBjb25zdCB3aWR0aCA9IGVsZW1lbnQgJiYgZWxlbWVudC5nZXRCb3VuZGluZ0NsaWVudFJlY3QgJiYgZWxlbWVudC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS53aWR0aDtcbiAgICAgIHJldHVybiAod2lkdGggJiYgd2lkdGggPiB0aGlzLl9taW5XaWR0aCkgPyB3aWR0aCA6IHRoaXMuX21pbldpZHRoO1xuICAgIH07XG4gICAgdGhpcy5fd2lkdGhDYWxjID0gdGhpcy5fZGVmYXVsdFdpZHRoQ2FsYztcblxuICAgIHRoaXMuX21pbkhlaWdodCA9IDEwMDtcbiAgICB0aGlzLl9kZWZhdWx0SGVpZ2h0Q2FsYyA9IChlbGVtZW50OiBFbGVtZW50KSA9PiB7XG4gICAgICBjb25zdCBoZWlnaHQgPSBlbGVtZW50ICYmIGVsZW1lbnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0ICYmIGVsZW1lbnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkuaGVpZ2h0O1xuICAgICAgcmV0dXJuIChoZWlnaHQgJiYgaGVpZ2h0ID4gdGhpcy5fbWluSGVpZ2h0KSA/IGhlaWdodCA6IHRoaXMuX21pbkhlaWdodDtcbiAgICB9O1xuICAgIHRoaXMuX2hlaWdodENhbGMgPSB0aGlzLl9kZWZhdWx0SGVpZ2h0Q2FsYztcbiAgICB0aGlzLl91c2VWaWV3Qm94UmVzaXppbmcgPSBmYWxzZTtcblxuICAgIHRoaXMuX2tleUFjY2Vzc29yID0gcGx1Y2soJ2tleScpO1xuICAgIHRoaXMuX3ZhbHVlQWNjZXNzb3IgPSBwbHVjaygndmFsdWUnKTtcbiAgICB0aGlzLl9sYWJlbCA9IHBsdWNrKCdrZXknKTtcblxuICAgIHRoaXMuX29yZGVyaW5nID0gcGx1Y2soJ2tleScpO1xuXG4gICAgdGhpcy5fcmVuZGVyTGFiZWwgPSBmYWxzZTtcblxuICAgIC8vIEB0cy1pZ25vcmVcbiAgICB0aGlzLl90aXRsZSA9IGQgPT4gYCR7dGhpcy5rZXlBY2Nlc3NvcigpKGQpfTogJHt0aGlzLnZhbHVlQWNjZXNzb3IoKShkKX1gO1xuICAgIHRoaXMuX3JlbmRlclRpdGxlID0gdHJ1ZTtcbiAgICB0aGlzLl9jb250cm9sc1VzZVZpc2liaWxpdHkgPSBmYWxzZTtcblxuICAgIHRoaXMuX3RyYW5zaXRpb25EdXJhdGlvbiA9IDc1MDtcblxuICAgIHRoaXMuX3RyYW5zaXRpb25EZWxheSA9IDA7XG5cbiAgICB0aGlzLl9maWx0ZXJQcmludGVyID0gcHJpbnRlcnMuZmlsdGVycztcblxuICAgIHRoaXMuX21hbmRhdG9yeUF0dHJpYnV0ZXNMaXN0ID0gWydkaW1lbnNpb24nLCAnZ3JvdXAnXTtcblxuICAgIHRoaXMuX2NoYXJ0R3JvdXAgPSBjb25zdGFudHMuREVGQVVMVF9DSEFSVF9HUk9VUDtcblxuICAgIHRoaXMuX2xpc3RlbmVycyA9IGRpc3BhdGNoKFxuICAgICAgJ3ByZVJlbmRlcicsXG4gICAgICAncG9zdFJlbmRlcicsXG4gICAgICAncHJlUmVkcmF3JyxcbiAgICAgICdwb3N0UmVkcmF3JyxcbiAgICAgICdmaWx0ZXJlZCcsXG4gICAgICAnem9vbWVkJyxcbiAgICAgICdyZW5kZXJsZXQnLFxuICAgICAgJ3ByZXRyYW5zaXRpb24nKTtcblxuICAgIHRoaXMuX2xlZ2VuZCA9IHVuZGVmaW5lZDtcbiAgICB0aGlzLl9jb21taXRIYW5kbGVyID0gdW5kZWZpbmVkO1xuXG4gICAgdGhpcy5fZGVmYXVsdERhdGEgPSAoZ3JvdXA6IGFueSkgPT4gZ3JvdXAuYWxsKCk7XG4gICAgdGhpcy5fZGF0YSA9IHRoaXMuX2RlZmF1bHREYXRhO1xuXG4gICAgdGhpcy5fZmlsdGVycyA9IFtdO1xuICB9XG5cbiAgaGVpZ2h0IChoZWlnaHQ/OiBhbnkpIHtcbiAgICBpZiAoaGVpZ2h0ID09PSB1bmRlZmluZWQpIHtcbiAgICAgIGlmICghdXRpbHMuaXNOdW1iZXIodGhpcy5faGVpZ2h0KSkge1xuICAgICAgICAvLyBvbmx5IGNhbGN1bGF0ZSBvbmNlXG4gICAgICAgIHRoaXMuX2hlaWdodCA9IHRoaXMuX2hlaWdodENhbGModGhpcy5fcm9vdC5ub2RlKCkpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRoaXMuX2hlaWdodDtcbiAgICB9XG4gICAgdGhpcy5faGVpZ2h0Q2FsYyA9IGhlaWdodCA/ICh0eXBlb2YgaGVpZ2h0ID09PSAnZnVuY3Rpb24nID8gaGVpZ2h0IDogdXRpbHMuY29uc3RhbnQoaGVpZ2h0KSkgOiB0aGlzLl9kZWZhdWx0SGVpZ2h0Q2FsYztcbiAgICB0aGlzLl9oZWlnaHQgPSB1bmRlZmluZWQ7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICB3aWR0aCAod2lkdGg/OiBhbnkpIHtcbiAgICBpZiAod2lkdGggPT09IHVuZGVmaW5lZCkge1xuICAgICAgaWYgKCF1dGlscy5pc051bWJlcih0aGlzLl93aWR0aCkpIHtcbiAgICAgICAgLy8gb25seSBjYWxjdWxhdGUgb25jZVxuICAgICAgICB0aGlzLl93aWR0aCA9IHRoaXMuX3dpZHRoQ2FsYyh0aGlzLl9yb290Lm5vZGUoKSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gdGhpcy5fd2lkdGg7XG4gICAgfVxuICAgIHRoaXMuX3dpZHRoQ2FsYyA9IHdpZHRoID8gKHR5cGVvZiB3aWR0aCA9PT0gJ2Z1bmN0aW9uJyA/IHdpZHRoIDogdXRpbHMuY29uc3RhbnQod2lkdGgpKSA6IHRoaXMuX2RlZmF1bHRXaWR0aENhbGM7XG4gICAgdGhpcy5fd2lkdGggPSB1bmRlZmluZWQ7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBtaW5XaWR0aCAobWluV2lkdGg/OiBhbnkpIHtcbiAgICBpZiAobWluV2lkdGggPT09IHVuZGVmaW5lZCkge1xuICAgICAgcmV0dXJuIHRoaXMuX21pbldpZHRoO1xuICAgIH1cbiAgICB0aGlzLl9taW5XaWR0aCA9IG1pbldpZHRoO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgbWluSGVpZ2h0IChtaW5IZWlnaHQ/OiBhbnkpIHtcbiAgICBpZiAobWluSGVpZ2h0ID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybiB0aGlzLl9taW5IZWlnaHQ7XG4gICAgfVxuICAgIHRoaXMuX21pbkhlaWdodCA9IG1pbkhlaWdodDtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHVzZVZpZXdCb3hSZXNpemluZyAodXNlVmlld0JveFJlc2l6aW5nPzogYW55KSB7XG4gICAgaWYgKHVzZVZpZXdCb3hSZXNpemluZyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm4gdGhpcy5fdXNlVmlld0JveFJlc2l6aW5nO1xuICAgIH1cbiAgICB0aGlzLl91c2VWaWV3Qm94UmVzaXppbmcgPSB1c2VWaWV3Qm94UmVzaXppbmc7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBkaW1lbnNpb24gKGRpbWVuc2lvbj86IGFueSkge1xuICAgIGlmIChkaW1lbnNpb24gPT09IHVuZGVmaW5lZCkge1xuICAgICAgcmV0dXJuIHRoaXMuX2RpbWVuc2lvbjtcbiAgICB9XG4gICAgdGhpcy5fZGltZW5zaW9uID0gZGltZW5zaW9uO1xuICAgIHRoaXMuZXhwaXJlQ2FjaGUoKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIGRhdGEgKGNhbGxiYWNrPzogYW55KSB7XG4gICAgaWYgKGNhbGxiYWNrID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybiB0aGlzLl9kYXRhKHRoaXMuX2dyb3VwKTtcbiAgICB9XG4gICAgdGhpcy5fZGF0YSA9IHR5cGVvZiBjYWxsYmFjayA9PT0gJ2Z1bmN0aW9uJyA/IGNhbGxiYWNrIDogdXRpbHMuY29uc3RhbnQoY2FsbGJhY2spO1xuICAgIHRoaXMuZXhwaXJlQ2FjaGUoKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIGdyb3VwIChncm91cD86IGFueSwgbmFtZT86IHN0cmluZykge1xuICAgIGlmIChncm91cCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm4gdGhpcy5fZ3JvdXA7XG4gICAgfVxuICAgIHRoaXMuX2dyb3VwID0gZ3JvdXA7XG4gICAgdGhpcy5fZ3JvdXBOYW1lID0gbmFtZTtcbiAgICB0aGlzLmV4cGlyZUNhY2hlKCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBvcmRlcmluZyAob3JkZXJGdW5jdGlvbj86IGFueSkge1xuICAgIGlmIChvcmRlckZ1bmN0aW9uID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybiB0aGlzLl9vcmRlcmluZztcbiAgICB9XG4gICAgdGhpcy5fb3JkZXJpbmcgPSBvcmRlckZ1bmN0aW9uO1xuICAgIHRoaXMuZXhwaXJlQ2FjaGUoKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIF9jb21wdXRlT3JkZXJlZEdyb3VwcyAoZGF0YTogYW55KSB7XG4gICAgLy8gY2xvbmUgdGhlIGFycmF5IGJlZm9yZSBzb3J0aW5nLCBvdGhlcndpc2UgQXJyYXkuc29ydCBzb3J0cyBpbi1wbGFjZVxuICAgIHJldHVybiBBcnJheS5mcm9tKGRhdGEpLnNvcnQoKGEsIGIpID0+IHRoaXMuX29yZGVyaW5nKGEpIC0gdGhpcy5fb3JkZXJpbmcoYikpO1xuICB9XG5cbiAgZmlsdGVyQWxsICgpIHtcbiAgICByZXR1cm4gdGhpcy5maWx0ZXIobnVsbCk7XG4gIH1cblxuICBzZWxlY3QgKHNlbDogYW55KSB7XG4gICAgcmV0dXJuIHRoaXMuX3Jvb3Quc2VsZWN0KHNlbCk7XG4gIH1cblxuICBzZWxlY3RBbGwgKHNlbDogYW55KSB7XG4gICAgcmV0dXJuIHRoaXMuX3Jvb3QgPyB0aGlzLl9yb290LnNlbGVjdEFsbChzZWwpIDogbnVsbDtcbiAgfVxuXG4gIGFuY2hvciAocGFyZW50PzogYW55LCBjaGFydEdyb3VwPzogYW55KSB7XG4gICAgaWYgKHBhcmVudCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm4gdGhpcy5fYW5jaG9yO1xuICAgIH1cbiAgICBpZiAoaW5zdGFuY2VPZkNoYXJ0KHBhcmVudCkpIHtcbiAgICAgIHRoaXMuX2FuY2hvciA9IHBhcmVudC5hbmNob3IoKTtcbiAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgIGlmICh0aGlzLl9hbmNob3IuY2hpbGRyZW4pIHsgLy8gaXMgX2FuY2hvciBhIGRpdj9cbiAgICAgICAgdGhpcy5fYW5jaG9yID0gYCMke3BhcmVudC5hbmNob3JOYW1lKCl9YDtcbiAgICAgIH1cbiAgICAgIHRoaXMuX3Jvb3QgPSBwYXJlbnQucm9vdCgpO1xuICAgICAgdGhpcy5faXNDaGlsZCA9IHRydWU7XG4gICAgfSBlbHNlIGlmIChwYXJlbnQpIHtcbiAgICAgIGlmIChwYXJlbnQuc2VsZWN0ICYmIHBhcmVudC5jbGFzc2VkKSB7IC8vIGRldGVjdCBkMyBzZWxlY3Rpb25cbiAgICAgICAgdGhpcy5fYW5jaG9yID0gcGFyZW50Lm5vZGUoKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuX2FuY2hvciA9IHBhcmVudDtcbiAgICAgIH1cbiAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgIHRoaXMuX3Jvb3QgPSBzZWxlY3QodGhpcy5fYW5jaG9yKTtcbiAgICAgIHRoaXMuX3Jvb3QuY2xhc3NlZChjb25zdGFudHMuQ0hBUlRfQ0xBU1MsIHRydWUpO1xuICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgcmVnaXN0ZXJDaGFydCh0aGlzLCBjaGFydEdyb3VwKTtcbiAgICAgIHRoaXMuX2lzQ2hpbGQgPSBmYWxzZTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgbmV3IEJhZEFyZ3VtZW50RXhjZXB0aW9uKCdwYXJlbnQgbXVzdCBiZSBkZWZpbmVkJyk7XG4gICAgfVxuICAgIHRoaXMuX2NoYXJ0R3JvdXAgPSBjaGFydEdyb3VwO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgYW5jaG9yTmFtZSAoKSB7XG4gICAgY29uc3QgYTogYW55ID0gdGhpcy5hbmNob3IoKTtcbiAgICBpZiAoYSAmJiBhLmlkKSB7XG4gICAgICByZXR1cm4gYS5pZDtcbiAgICB9XG4gICAgaWYgKGEgJiYgYS5yZXBsYWNlKSB7XG4gICAgICByZXR1cm4gYS5yZXBsYWNlKCcjJywgJycpO1xuICAgIH1cbiAgICByZXR1cm4gYGRjLWNoYXJ0JHt0aGlzLmNoYXJ0SUQoKX1gO1xuICB9XG5cbiAgcm9vdCAocm9vdEVsZW1lbnQ/OiBhbnkpIHtcbiAgICBpZiAocm9vdEVsZW1lbnQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgcmV0dXJuIHRoaXMuX3Jvb3Q7XG4gICAgfVxuICAgIHRoaXMuX3Jvb3QgPSByb290RWxlbWVudDtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHN2ZyAoc3ZnRWxlbWVudD86IGFueSkge1xuICAgIGlmIChzdmdFbGVtZW50ID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybiB0aGlzLl9zdmc7XG4gICAgfVxuICAgIHRoaXMuX3N2ZyA9IHN2Z0VsZW1lbnQ7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICByZXNldFN2ZyAoKSB7XG4gICAgdGhpcy5zZWxlY3QoJ3N2ZycpLnJlbW92ZSgpO1xuICAgIHJldHVybiB0aGlzLmdlbmVyYXRlU3ZnKCk7XG4gIH1cblxuICBzaXplU3ZnICgpIHtcbiAgICBpZiAodGhpcy5fc3ZnKSB7XG4gICAgICBpZiAoIXRoaXMuX3VzZVZpZXdCb3hSZXNpemluZykge1xuICAgICAgICB0aGlzLl9zdmdcbiAgICAgICAgICAuYXR0cignd2lkdGgnLCB0aGlzLndpZHRoKCkpXG4gICAgICAgICAgLmF0dHIoJ2hlaWdodCcsIHRoaXMuaGVpZ2h0KCkpO1xuICAgICAgfSBlbHNlIGlmICghdGhpcy5fc3ZnLmF0dHIoJ3ZpZXdCb3gnKSkge1xuICAgICAgICB0aGlzLl9zdmdcbiAgICAgICAgICAuYXR0cigndmlld0JveCcsIGAwIDAgJHt0aGlzLndpZHRoKCl9ICR7dGhpcy5oZWlnaHQoKX1gKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBnZW5lcmF0ZVN2ZyAoKSB7XG4gICAgdGhpcy5fc3ZnID0gdGhpcy5yb290KCkuYXBwZW5kKCdzdmcnKTtcbiAgICB0aGlzLnNpemVTdmcoKTtcbiAgICByZXR1cm4gdGhpcy5fc3ZnO1xuICB9XG5cbiAgZmlsdGVyUHJpbnRlciAoZmlsdGVyUHJpbnRlckZ1bmN0aW9uPzogYW55KSB7XG4gICAgaWYgKGZpbHRlclByaW50ZXJGdW5jdGlvbiA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm4gdGhpcy5fZmlsdGVyUHJpbnRlcjtcbiAgICB9XG4gICAgdGhpcy5fZmlsdGVyUHJpbnRlciA9IGZpbHRlclByaW50ZXJGdW5jdGlvbjtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIGNvbnRyb2xzVXNlVmlzaWJpbGl0eSAoY29udHJvbHNVc2VWaXNpYmlsaXR5PzogYW55KSB7XG4gICAgaWYgKGNvbnRyb2xzVXNlVmlzaWJpbGl0eSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm4gdGhpcy5fY29udHJvbHNVc2VWaXNpYmlsaXR5O1xuICAgIH1cbiAgICB0aGlzLl9jb250cm9sc1VzZVZpc2liaWxpdHkgPSBjb250cm9sc1VzZVZpc2liaWxpdHk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICB0dXJuT25Db250cm9scyAoKSB7XG4gICAgaWYgKHRoaXMuX3Jvb3QpIHtcbiAgICAgIGNvbnN0IGF0dHJpYnV0ZSA9IHRoaXMuY29udHJvbHNVc2VWaXNpYmlsaXR5KCkgPyAndmlzaWJpbGl0eScgOiAnZGlzcGxheSc7XG4gICAgICB0aGlzLnNlbGVjdEFsbCgnLnJlc2V0Jykuc3R5bGUoYXR0cmlidXRlLCBudWxsKTtcbiAgICAgIHRoaXMuc2VsZWN0QWxsKCcuZmlsdGVyJykudGV4dCh0aGlzLl9maWx0ZXJQcmludGVyKHRoaXMuZmlsdGVycygpKSkuc3R5bGUoYXR0cmlidXRlLCBudWxsKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICB0dXJuT2ZmQ29udHJvbHMgKCkge1xuICAgIGlmICh0aGlzLl9yb290KSB7XG4gICAgICBjb25zdCBhdHRyaWJ1dGUgPSB0aGlzLmNvbnRyb2xzVXNlVmlzaWJpbGl0eSgpID8gJ3Zpc2liaWxpdHknIDogJ2Rpc3BsYXknO1xuICAgICAgY29uc3QgdmFsdWUgPSB0aGlzLmNvbnRyb2xzVXNlVmlzaWJpbGl0eSgpID8gJ2hpZGRlbicgOiAnbm9uZSc7XG4gICAgICB0aGlzLnNlbGVjdEFsbCgnLnJlc2V0Jykuc3R5bGUoYXR0cmlidXRlLCB2YWx1ZSk7XG4gICAgICB0aGlzLnNlbGVjdEFsbCgnLmZpbHRlcicpLnN0eWxlKGF0dHJpYnV0ZSwgdmFsdWUpLnRleHQodGhpcy5maWx0ZXIoKSk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cblxuICB0cmFuc2l0aW9uRHVyYXRpb24gKGR1cmF0aW9uPzogYW55KSB7XG4gICAgaWYgKGR1cmF0aW9uID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybiB0aGlzLl90cmFuc2l0aW9uRHVyYXRpb247XG4gICAgfVxuICAgIHRoaXMuX3RyYW5zaXRpb25EdXJhdGlvbiA9IGR1cmF0aW9uO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cblxuICB0cmFuc2l0aW9uRGVsYXkgKGRlbGF5PzogYW55KSB7XG4gICAgaWYgKGRlbGF5ID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybiB0aGlzLl90cmFuc2l0aW9uRGVsYXk7XG4gICAgfVxuICAgIHRoaXMuX3RyYW5zaXRpb25EZWxheSA9IGRlbGF5O1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgX21hbmRhdG9yeUF0dHJpYnV0ZXMgKF8/OiBhbnkpIHtcbiAgICBpZiAoXyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm4gdGhpcy5fbWFuZGF0b3J5QXR0cmlidXRlc0xpc3Q7XG4gICAgfVxuICAgIHRoaXMuX21hbmRhdG9yeUF0dHJpYnV0ZXNMaXN0ID0gXztcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIGNoZWNrRm9yTWFuZGF0b3J5QXR0cmlidXRlcyAoYTogc3RyaW5nKSB7XG4gICAgLy8gQHRzLWlnbm9yZVxuICAgIGlmICghdGhpc1thXSB8fCAhdGhpc1thXSgpKSB7XG4gICAgICB0aHJvdyBuZXcgSW52YWxpZFN0YXRlRXhjZXB0aW9uKGBNYW5kYXRvcnkgYXR0cmlidXRlIGNoYXJ0LiR7YX0gaXMgbWlzc2luZyBvbiBjaGFydFsjJHt0aGlzLmFuY2hvck5hbWUoKX1dYCk7XG4gICAgfVxuICB9XG5cblxuICByZW5kZXIoKSB7XG4gICAgdGhpcy5faGVpZ2h0ID0gdGhpcy5fd2lkdGggPSB1bmRlZmluZWQ7IC8vIGZvcmNlIHJlY2FsY3VsYXRlXG4gICAgdGhpcy5fbGlzdGVuZXJzLmNhbGwoJ3ByZVJlbmRlcicsIHRoaXMsIHRoaXMpO1xuXG4gICAgaWYgKHRoaXMuX21hbmRhdG9yeUF0dHJpYnV0ZXNMaXN0KSB7XG4gICAgICB0aGlzLl9tYW5kYXRvcnlBdHRyaWJ1dGVzTGlzdC5mb3JFYWNoKChlOiBhbnkpID0+IHRoaXMuY2hlY2tGb3JNYW5kYXRvcnlBdHRyaWJ1dGVzKGUpKTtcbiAgICB9XG5cbiAgICBjb25zdCByZXN1bHQgPSB0aGlzLl9kb1JlbmRlcigpO1xuXG4gICAgaWYgKHRoaXMuX2xlZ2VuZCkge1xuICAgICAgdGhpcy5fbGVnZW5kLnJlbmRlcigpO1xuICAgIH1cblxuICAgIHRoaXMuX2FjdGl2YXRlUmVuZGVybGV0cygncG9zdFJlbmRlcicpO1xuXG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIF9hY3RpdmF0ZVJlbmRlcmxldHMgKGV2ZW50OiBhbnkpIHtcbiAgICB0aGlzLl9saXN0ZW5lcnMuY2FsbCgncHJldHJhbnNpdGlvbicsIHRoaXMsIHRoaXMpO1xuICAgIGlmICh0aGlzLnRyYW5zaXRpb25EdXJhdGlvbigpID4gMCAmJiB0aGlzLl9zdmcpIHtcbiAgICAgIHRoaXMuX3N2Zy50cmFuc2l0aW9uKCkuZHVyYXRpb24odGhpcy50cmFuc2l0aW9uRHVyYXRpb24oKSkuZGVsYXkodGhpcy50cmFuc2l0aW9uRGVsYXkoKSlcbiAgICAgICAgLm9uKCdlbmQnLCAoKSA9PiB7XG4gICAgICAgICAgdGhpcy5fbGlzdGVuZXJzLmNhbGwoJ3JlbmRlcmxldCcsIHRoaXMsIHRoaXMpO1xuICAgICAgICAgIGlmIChldmVudCkge1xuICAgICAgICAgICAgdGhpcy5fbGlzdGVuZXJzLmNhbGwoZXZlbnQsIHRoaXMsIHRoaXMpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX2xpc3RlbmVycy5jYWxsKCdyZW5kZXJsZXQnLCB0aGlzLCB0aGlzKTtcbiAgICAgIGlmIChldmVudCkge1xuICAgICAgICB0aGlzLl9saXN0ZW5lcnMuY2FsbChldmVudCwgdGhpcywgdGhpcyk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cblxuICByZWRyYXcgKCkge1xuICAgIHRoaXMuc2l6ZVN2ZygpO1xuICAgIHRoaXMuX2xpc3RlbmVycy5jYWxsKCdwcmVSZWRyYXcnLCB0aGlzLCB0aGlzKTtcblxuICAgIGNvbnN0IHJlc3VsdCA9IHRoaXMuX2RvUmVkcmF3KCk7XG5cbiAgICBpZiAodGhpcy5fbGVnZW5kKSB7XG4gICAgICB0aGlzLl9sZWdlbmQucmVuZGVyKCk7XG4gICAgfVxuXG4gICAgdGhpcy5fYWN0aXZhdGVSZW5kZXJsZXRzKCdwb3N0UmVkcmF3Jyk7XG5cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cblxuICBjb21taXRIYW5kbGVyIChjb21taXRIYW5kbGVyPzogYW55KSB7XG4gICAgaWYgKGNvbW1pdEhhbmRsZXIgPT09IHVuZGVmaW5lZCkge1xuICAgICAgcmV0dXJuIHRoaXMuX2NvbW1pdEhhbmRsZXI7XG4gICAgfVxuICAgIHRoaXMuX2NvbW1pdEhhbmRsZXIgPSBjb21taXRIYW5kbGVyO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgcmVkcmF3R3JvdXAgKCkge1xuICAgIGlmICh0aGlzLl9jb21taXRIYW5kbGVyKSB7XG4gICAgICB0aGlzLl9jb21taXRIYW5kbGVyKGZhbHNlLCAoZXJyb3I6IGFueSwgcmVzdWx0OiBhbnkpID0+IHtcbiAgICAgICAgaWYgKGVycm9yKSB7XG4gICAgICAgICAgY29uc29sZS5sb2coZXJyb3IpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICByZWRyYXdBbGwodGhpcy5jaGFydEdyb3VwKCkpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgcmVkcmF3QWxsKHRoaXMuY2hhcnRHcm91cCgpKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICByZW5kZXJHcm91cCAoKSB7XG4gICAgaWYgKHRoaXMuX2NvbW1pdEhhbmRsZXIpIHtcbiAgICAgIHRoaXMuX2NvbW1pdEhhbmRsZXIoZmFsc2UsIChlcnJvcjogYW55LCByZXN1bHQ6IGFueSkgPT4ge1xuICAgICAgICBpZiAoZXJyb3IpIHtcbiAgICAgICAgICBjb25zb2xlLmxvZyhlcnJvcik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgIHJlbmRlckFsbCh0aGlzLmNoYXJ0R3JvdXAoKSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBAdHMtaWdub3JlXG4gICAgICByZW5kZXJBbGwodGhpcy5jaGFydEdyb3VwKCkpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIF9pbnZva2VGaWx0ZXJlZExpc3RlbmVyIChmOiBhbnkpIHtcbiAgICBpZiAoZiAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzLl9saXN0ZW5lcnMuY2FsbCgnZmlsdGVyZWQnLCB0aGlzLCB0aGlzLCBmKTtcbiAgICB9XG4gIH1cblxuICBfaW52b2tlWm9vbWVkTGlzdGVuZXIgKCkge1xuICAgIHRoaXMuX2xpc3RlbmVycy5jYWxsKCd6b29tZWQnLCB0aGlzLCB0aGlzKTtcbiAgfVxuXG5cbiAgaGFzRmlsdGVySGFuZGxlciAoaGFzRmlsdGVySGFuZGxlcj86IGFueSkge1xuICAgIGlmIChoYXNGaWx0ZXJIYW5kbGVyID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybiB0aGlzLl9oYXNGaWx0ZXJIYW5kbGVyO1xuICAgIH1cbiAgICB0aGlzLl9oYXNGaWx0ZXJIYW5kbGVyID0gaGFzRmlsdGVySGFuZGxlcjtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIGhhc0ZpbHRlciAoZmlsdGVyPzogYW55KSB7XG4gICAgcmV0dXJuIHRoaXMuX2hhc0ZpbHRlckhhbmRsZXIodGhpcy5fZmlsdGVycywgZmlsdGVyKTtcbiAgfVxuXG5cbiAgcmVtb3ZlRmlsdGVySGFuZGxlciAocmVtb3ZlRmlsdGVySGFuZGxlcj86IGFueSkge1xuICAgIGlmIChyZW1vdmVGaWx0ZXJIYW5kbGVyID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybiB0aGlzLl9yZW1vdmVGaWx0ZXJIYW5kbGVyO1xuICAgIH1cbiAgICB0aGlzLl9yZW1vdmVGaWx0ZXJIYW5kbGVyID0gcmVtb3ZlRmlsdGVySGFuZGxlcjtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIGFkZEZpbHRlckhhbmRsZXIgKGFkZEZpbHRlckhhbmRsZXI6IGFueSkge1xuICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuICAgICAgcmV0dXJuIHRoaXMuX2FkZEZpbHRlckhhbmRsZXI7XG4gICAgfVxuICAgIHRoaXMuX2FkZEZpbHRlckhhbmRsZXIgPSBhZGRGaWx0ZXJIYW5kbGVyO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cblxuICByZXNldEZpbHRlckhhbmRsZXIgKHJlc2V0RmlsdGVySGFuZGxlcjogYW55KSB7XG4gICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XG4gICAgICByZXR1cm4gdGhpcy5fcmVzZXRGaWx0ZXJIYW5kbGVyO1xuICAgIH1cbiAgICB0aGlzLl9yZXNldEZpbHRlckhhbmRsZXIgPSByZXNldEZpbHRlckhhbmRsZXI7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBhcHBseUZpbHRlcnMgKGZpbHRlcnM6IGFueSkge1xuICAgIC8vIEB0cy1pZ25vcmVcbiAgICBpZiAodGhpcy5kaW1lbnNpb24oKSAmJiB0aGlzLmRpbWVuc2lvbigpLmZpbHRlcikge1xuICAgICAgY29uc3QgZnMgPSB0aGlzLl9maWx0ZXJIYW5kbGVyKHRoaXMuZGltZW5zaW9uKCksIGZpbHRlcnMpO1xuICAgICAgaWYgKGZzKSB7XG4gICAgICAgIGZpbHRlcnMgPSBmcztcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGZpbHRlcnM7XG4gIH1cblxuICByZXBsYWNlRmlsdGVyIChmaWx0ZXI6IGFueSkge1xuICAgIHRoaXMuX2ZpbHRlcnMgPSB0aGlzLl9yZXNldEZpbHRlckhhbmRsZXIodGhpcy5fZmlsdGVycyk7XG4gICAgdGhpcy5maWx0ZXIoZmlsdGVyKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIGZpbHRlciAoZmlsdGVyPzogYW55KSB7XG4gICAgaWYgKGZpbHRlciA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm4gdGhpcy5fZmlsdGVycy5sZW5ndGggPiAwID8gdGhpcy5fZmlsdGVyc1swXSA6IG51bGw7XG4gICAgfVxuICAgIGxldCBmaWx0ZXJzID0gdGhpcy5fZmlsdGVycztcbiAgICAvLyBAdHMtaWdub3JlXG4gICAgaWYgKGZpbHRlciBpbnN0YW5jZW9mIEFycmF5ICYmIGZpbHRlclswXSBpbnN0YW5jZW9mIEFycmF5ICYmICFmaWx0ZXJbJ2lzRmlsdGVyZWQnXSkge1xuICAgICAgLy8gdG9nZ2xlIGVhY2ggZmlsdGVyXG4gICAgICBmaWx0ZXJbMF0uZm9yRWFjaChmID0+IHtcbiAgICAgICAgaWYgKHRoaXMuX2hhc0ZpbHRlckhhbmRsZXIoZmlsdGVycywgZikpIHtcbiAgICAgICAgICBmaWx0ZXJzID0gdGhpcy5fcmVtb3ZlRmlsdGVySGFuZGxlcihmaWx0ZXJzLCBmKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBmaWx0ZXJzID0gdGhpcy5fYWRkRmlsdGVySGFuZGxlcihmaWx0ZXJzLCBmKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSBlbHNlIGlmIChmaWx0ZXIgPT09IG51bGwpIHtcbiAgICAgIGZpbHRlcnMgPSB0aGlzLl9yZXNldEZpbHRlckhhbmRsZXIoZmlsdGVycyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmICh0aGlzLl9oYXNGaWx0ZXJIYW5kbGVyKGZpbHRlcnMsIGZpbHRlcikpIHtcbiAgICAgICAgZmlsdGVycyA9IHRoaXMuX3JlbW92ZUZpbHRlckhhbmRsZXIoZmlsdGVycywgZmlsdGVyKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGZpbHRlcnMgPSB0aGlzLl9hZGRGaWx0ZXJIYW5kbGVyKGZpbHRlcnMsIGZpbHRlcik7XG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMuX2ZpbHRlcnMgPSB0aGlzLmFwcGx5RmlsdGVycyhmaWx0ZXJzKTtcbiAgICB0aGlzLl9pbnZva2VGaWx0ZXJlZExpc3RlbmVyKGZpbHRlcik7XG5cbiAgICBpZiAodGhpcy5fcm9vdCAhPT0gbnVsbCAmJiB0aGlzLmhhc0ZpbHRlcigpKSB7XG4gICAgICB0aGlzLnR1cm5PbkNvbnRyb2xzKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMudHVybk9mZkNvbnRyb2xzKCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuXG4gIGZpbHRlcnMgKCkge1xuICAgIHJldHVybiB0aGlzLl9maWx0ZXJzO1xuICB9XG5cbiAgaGlnaGxpZ2h0U2VsZWN0ZWQgKGU6IGFueSkge1xuICAgIHNlbGVjdChlKS5jbGFzc2VkKGNvbnN0YW50cy5TRUxFQ1RFRF9DTEFTUywgdHJ1ZSk7XG4gICAgc2VsZWN0KGUpLmNsYXNzZWQoY29uc3RhbnRzLkRFU0VMRUNURURfQ0xBU1MsIGZhbHNlKTtcbiAgfVxuXG4gIGZhZGVEZXNlbGVjdGVkIChlOiBhbnkpIHtcbiAgICBzZWxlY3QoZSkuY2xhc3NlZChjb25zdGFudHMuU0VMRUNURURfQ0xBU1MsIGZhbHNlKTtcbiAgICBzZWxlY3QoZSkuY2xhc3NlZChjb25zdGFudHMuREVTRUxFQ1RFRF9DTEFTUywgdHJ1ZSk7XG4gIH1cblxuICByZXNldEhpZ2hsaWdodCAoZTogYW55KSB7XG4gICAgc2VsZWN0KGUpLmNsYXNzZWQoY29uc3RhbnRzLlNFTEVDVEVEX0NMQVNTLCBmYWxzZSk7XG4gICAgc2VsZWN0KGUpLmNsYXNzZWQoY29uc3RhbnRzLkRFU0VMRUNURURfQ0xBU1MsIGZhbHNlKTtcbiAgfVxuXG4gIG9uQ2xpY2sgKGRhdHVtPzogYW55LCBpPzogYW55KSB7XG4gICAgLy8gQHRzLWlnbm9yZVxuICAgIGNvbnN0IGZpbHRlciA9IHRoaXMua2V5QWNjZXNzb3IoKShkYXR1bSk7XG4gICAgZXZlbnRzLnRyaWdnZXIoKCkgPT4ge1xuICAgICAgdGhpcy5maWx0ZXIoZmlsdGVyKTtcbiAgICAgIHRoaXMucmVkcmF3R3JvdXAoKTtcbiAgICB9KTtcbiAgfVxuXG4gIGZpbHRlckhhbmRsZXIgKGZpbHRlckhhbmRsZXI6IGFueSkge1xuICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuICAgICAgcmV0dXJuIHRoaXMuX2ZpbHRlckhhbmRsZXI7XG4gICAgfVxuICAgIHRoaXMuX2ZpbHRlckhhbmRsZXIgPSBmaWx0ZXJIYW5kbGVyO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLy8gYWJzdHJhY3QgZnVuY3Rpb24gc3R1YlxuICBfZG9SZW5kZXIgKCkge1xuICAgIC8vIGRvIG5vdGhpbmcgaW4gYmFzZSwgc2hvdWxkIGJlIG92ZXJyaWRkZW4gYnkgc3ViLWZ1bmN0aW9uXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBfZG9SZWRyYXcgKCkge1xuICAgIC8vIGRvIG5vdGhpbmcgaW4gYmFzZSwgc2hvdWxkIGJlIG92ZXJyaWRkZW4gYnkgc3ViLWZ1bmN0aW9uXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBsZWdlbmRhYmxlcyAoKSB7XG4gICAgLy8gZG8gbm90aGluZyBpbiBiYXNlLCBzaG91bGQgYmUgb3ZlcnJpZGRlbiBieSBzdWItZnVuY3Rpb25cbiAgICByZXR1cm4gW107XG4gIH1cblxuICBsZWdlbmRIaWdobGlnaHQgKCkge1xuICAgIC8vIGRvIG5vdGhpbmcgaW4gYmFzZSwgc2hvdWxkIGJlIG92ZXJyaWRkZW4gYnkgc3ViLWZ1bmN0aW9uXG4gIH1cblxuICBsZWdlbmRSZXNldCAoKSB7XG4gICAgLy8gZG8gbm90aGluZyBpbiBiYXNlLCBzaG91bGQgYmUgb3ZlcnJpZGRlbiBieSBzdWItZnVuY3Rpb25cbiAgfVxuXG4gIGxlZ2VuZFRvZ2dsZSAoKSB7XG4gICAgLy8gZG8gbm90aGluZyBpbiBiYXNlLCBzaG91bGQgYmUgb3ZlcnJpZGVuIGJ5IHN1Yi1mdW5jdGlvblxuICB9XG5cbiAgaXNMZWdlbmRhYmxlSGlkZGVuICgpIHtcbiAgICAvLyBkbyBub3RoaW5nIGluIGJhc2UsIHNob3VsZCBiZSBvdmVycmlkZGVuIGJ5IHN1Yi1mdW5jdGlvblxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIGtleUFjY2Vzc29yIChrZXlBY2Nlc3Nvcj86IGFueSkge1xuICAgIGlmIChrZXlBY2Nlc3NvciA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm4gdGhpcy5fa2V5QWNjZXNzb3I7XG4gICAgfVxuICAgIHRoaXMuX2tleUFjY2Vzc29yID0ga2V5QWNjZXNzb3I7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICB2YWx1ZUFjY2Vzc29yICh2YWx1ZUFjY2Vzc29yPzogYW55KSB7XG4gICAgaWYgKHZhbHVlQWNjZXNzb3IgPT09IHVuZGVmaW5lZCkge1xuICAgICAgcmV0dXJuIHRoaXMuX3ZhbHVlQWNjZXNzb3I7XG4gICAgfVxuICAgIHRoaXMuX3ZhbHVlQWNjZXNzb3IgPSB2YWx1ZUFjY2Vzc29yO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cblxuICBsYWJlbCAobGFiZWxGdW5jdGlvbjogYW55LCBlbmFibGVMYWJlbHM6IGFueSkge1xuICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuICAgICAgcmV0dXJuIHRoaXMuX2xhYmVsO1xuICAgIH1cbiAgICB0aGlzLl9sYWJlbCA9IGxhYmVsRnVuY3Rpb247XG4gICAgaWYgKChlbmFibGVMYWJlbHMgPT09IHVuZGVmaW5lZCkgfHwgZW5hYmxlTGFiZWxzKSB7XG4gICAgICB0aGlzLl9yZW5kZXJMYWJlbCA9IHRydWU7XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cblxuICByZW5kZXJMYWJlbCAocmVuZGVyTGFiZWw6IGFueSkge1xuICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkge1xuICAgICAgcmV0dXJuIHRoaXMuX3JlbmRlckxhYmVsO1xuICAgIH1cbiAgICB0aGlzLl9yZW5kZXJMYWJlbCA9IHJlbmRlckxhYmVsO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cblxuICB0aXRsZSAodGl0bGVGdW5jdGlvbjogYW55KSB7XG4gICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XG4gICAgICByZXR1cm4gdGhpcy5fdGl0bGU7XG4gICAgfVxuICAgIHRoaXMuX3RpdGxlID0gdGl0bGVGdW5jdGlvbjtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG5cbiAgcmVuZGVyVGl0bGUgKHJlbmRlclRpdGxlOiBzdHJpbmcpIHtcbiAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHtcbiAgICAgIHJldHVybiB0aGlzLl9yZW5kZXJUaXRsZTtcbiAgICB9XG4gICAgdGhpcy5fcmVuZGVyVGl0bGUgPSByZW5kZXJUaXRsZTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG5cbiAgY2hhcnRHcm91cCAoY2hhcnRHcm91cD86IGFueSkge1xuICAgIGlmIChjaGFydEdyb3VwID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybiB0aGlzLl9jaGFydEdyb3VwO1xuICAgIH1cbiAgICBpZiAoIXRoaXMuX2lzQ2hpbGQpIHtcbiAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgIGRlcmVnaXN0ZXJDaGFydCh0aGlzLCB0aGlzLl9jaGFydEdyb3VwKTtcbiAgICB9XG4gICAgdGhpcy5fY2hhcnRHcm91cCA9IGNoYXJ0R3JvdXA7XG4gICAgaWYgKCF0aGlzLl9pc0NoaWxkKSB7XG4gICAgICAvLyBAdHMtaWdub3JlXG4gICAgICByZWdpc3RlckNoYXJ0KHRoaXMsIHRoaXMuX2NoYXJ0R3JvdXApO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIGV4cGlyZUNhY2hlICgpIHtcbiAgICAvLyBkbyBub3RoaW5nIGluIGJhc2UsIHNob3VsZCBiZSBvdmVycmlkZGVuIGJ5IHN1Yi1mdW5jdGlvblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgbGVnZW5kIChsZWdlbmQ/OiBhbnkpIHtcbiAgICBpZiAobGVnZW5kID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybiB0aGlzLl9sZWdlbmQ7XG4gICAgfVxuICAgIHRoaXMuX2xlZ2VuZCA9IGxlZ2VuZDtcbiAgICB0aGlzLl9sZWdlbmQucGFyZW50KHRoaXMpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgY2hhcnRJRCAoKSB7XG4gICAgcmV0dXJuIHRoaXMuX19kY0ZsYWdfXztcbiAgfVxuXG4gIG9wdGlvbnMgKG9wdHM6IGFueSkge1xuICAgIGNvbnN0IGFwcGx5T3B0aW9ucyA9IFtcbiAgICAgICdhbmNob3InLFxuICAgICAgJ2dyb3VwJyxcbiAgICAgICd4QXhpc0xhYmVsJyxcbiAgICAgICd5QXhpc0xhYmVsJyxcbiAgICAgICdzdGFjaycsXG4gICAgICAndGl0bGUnLFxuICAgICAgJ3BvaW50JyxcbiAgICAgICdnZXRDb2xvcicsXG4gICAgICAnb3ZlcmxheUdlb0pzb24nXG4gICAgXTtcblxuICAgIGZvciAoY29uc3QgbyBpbiBvcHRzKSB7XG4gICAgICAvLyBAdHMtaWdub3JlXG4gICAgICBpZiAodHlwZW9mICh0aGlzW29dKSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICBpZiAob3B0c1tvXSBpbnN0YW5jZW9mIEFycmF5ICYmIGFwcGx5T3B0aW9ucy5pbmRleE9mKG8pICE9PSAtMSkge1xuICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICB0aGlzW29dLmFwcGx5KHRoaXMsIG9wdHNbb10pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICB0aGlzW29dLmNhbGwodGhpcywgb3B0c1tvXSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGxvZ2dlci5kZWJ1ZyhgTm90IGEgdmFsaWQgb3B0aW9uIHNldHRlciBuYW1lOiAke299YCk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgb24oZXZlbnQ6IGFueSwgbGlzdGVuZXI6IGFueSkge1xuICAgIHRoaXMuX2xpc3RlbmVycy5vbihldmVudCwgbGlzdGVuZXIpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgcmVuZGVybGV0IChyZW5kZXJsZXRGdW5jdGlvbjogYW55KSB7XG4gICAgbG9nZ2VyLndhcm5PbmNlKCdjaGFydC5yZW5kZXJsZXQgaGFzIGJlZW4gZGVwcmVjYXRlZC4gUGxlYXNlIHVzZSBjaGFydC5vbihcInJlbmRlcmxldC48cmVuZGVybGV0S2V5PlwiLCByZW5kZXJsZXRGdW5jdGlvbiknKTtcbiAgICB0aGlzLm9uKGByZW5kZXJsZXQuJHt1dGlscy51bmlxdWVJZCgpfWAsIHJlbmRlcmxldEZ1bmN0aW9uKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxufVxuIl19