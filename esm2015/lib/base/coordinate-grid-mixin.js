import { schemeCategory10 } from 'd3-scale-chromatic';
import { timeDay } from 'd3-time';
import { max, min } from 'd3-array';
import { scaleBand, scaleLinear, scaleOrdinal } from 'd3-scale';
import { axisBottom, axisLeft, axisRight } from 'd3-axis';
import { zoom, zoomIdentity } from 'd3-zoom';
import { brushX } from 'd3-brush';
import { optionalTransition, units, utils, logger, filters, events, transition } from 'dc';
import { ColorMixin } from './color-mixin';
import { MarginMixin } from './margin-mixin';
const GRID_LINE_CLASS = 'grid-line';
const HORIZONTAL_CLASS = 'horizontal';
const VERTICAL_CLASS = 'vertical';
const Y_AXIS_LABEL_CLASS = 'y-axis-label';
const X_AXIS_LABEL_CLASS = 'x-axis-label';
const CUSTOM_BRUSH_HANDLE_CLASS = 'custom-brush-handle';
const DEFAULT_AXIS_LABEL_PADDING = 12;
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
export class CoordinateGridMixin extends ColorMixin(MarginMixin) {
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
        if (render || !utils.arraysEqual(this._lastXDomain, xdom)) {
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
        return utils.subtract(m, this._xAxisPadding, this._xAxisPaddingUnit);
    }
    xAxisMax() {
        const m = max(this.data(), e => this.keyAccessor()(e));
        // @ts-ignore
        return utils.add(m, this._xAxisPadding, this._xAxisPaddingUnit);
    }
    yAxisMin() {
        const m = min(this.data(), e => this.valueAccessor()(e));
        // @ts-ignore
        return utils.subtract(m, this._yAxisPadding);
    }
    yAxisMax() {
        const m = max(this.data(), e => this.valueAccessor()(e));
        // @ts-ignore
        return utils.add(m, this._yAxisPadding);
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
        }, constants.EVENT_DELAY);
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
        const defs = utils.appendOrSelect(this._parent, 'defs');
        // cannot select <clippath> elements; bug in WebKit, must select by id
        // https://groups.google.com/forum/#!topic/d3-js/6EpAzQ2gU9I
        const id = this._getClipPathId();
        const chartBodyClip = utils.appendOrSelect(defs, `#${id}`, 'clipPath').attr('id', id);
        const padding = this._clipPadding * 2;
        // @ts-ignore
        utils.appendOrSelect(chartBodyClip, 'rect')
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
            if (this._rangeChart && !utils.arraysEqual(this.filter(), this._rangeChart.filter())) {
                events.trigger(() => {
                    // @ts-ignore
                    this._rangeChart.replaceFilter(domFilter);
                    this._rangeChart.redraw();
                });
            }
            this._invokeZoomedListener();
            events.trigger(() => {
                this.redrawGroup();
            }, constants.EVENT_DELAY);
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
        return !utils.arraysEqual(this.x().domain(), this._xOriginalDomain);
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
            else if (!utils.arraysEqual(chart.filter(), this._focusChart.filter())) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29vcmRpbmF0ZS1ncmlkLW1peGluLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vcHJvamVjdHMvYW5ndWxhci1kai1jaGFydC9zcmMvbGliL2Jhc2UvY29vcmRpbmF0ZS1ncmlkLW1peGluLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBQyxnQkFBZ0IsRUFBQyxNQUFNLG9CQUFvQixDQUFDO0FBQ3BELE9BQU8sRUFBQyxPQUFPLEVBQUMsTUFBTSxTQUFTLENBQUM7QUFDaEMsT0FBTyxFQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFDbEMsT0FBTyxFQUFDLFNBQVMsRUFBRSxXQUFXLEVBQUUsWUFBWSxFQUFDLE1BQU0sVUFBVSxDQUFDO0FBQzlELE9BQU8sRUFBQyxVQUFVLEVBQUUsUUFBUSxFQUFFLFNBQVMsRUFBQyxNQUFNLFNBQVMsQ0FBQztBQUN4RCxPQUFPLEVBQUMsSUFBSSxFQUFFLFlBQVksRUFBQyxNQUFNLFNBQVMsQ0FBQztBQUMzQyxPQUFPLEVBQUMsTUFBTSxFQUFDLE1BQU0sVUFBVSxDQUFDO0FBQ2hDLE9BQU8sRUFBQyxrQkFBa0IsRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLE1BQU0sRUFBRSxPQUFPLEVBQUUsTUFBTSxFQUFFLFVBQVUsRUFBQyxNQUFNLElBQUksQ0FBQztBQUN6RixPQUFPLEVBQUMsVUFBVSxFQUFDLE1BQU0sZUFBZSxDQUFDO0FBQ3pDLE9BQU8sRUFBQyxXQUFXLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUUzQyxNQUFNLGVBQWUsR0FBRyxXQUFXLENBQUM7QUFDcEMsTUFBTSxnQkFBZ0IsR0FBRyxZQUFZLENBQUM7QUFDdEMsTUFBTSxjQUFjLEdBQUcsVUFBVSxDQUFDO0FBQ2xDLE1BQU0sa0JBQWtCLEdBQUcsY0FBYyxDQUFDO0FBQzFDLE1BQU0sa0JBQWtCLEdBQUcsY0FBYyxDQUFDO0FBQzFDLE1BQU0seUJBQXlCLEdBQUcs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QUFDO0lBQ2QsQ0FBQztJQUVELE9BQU8sQ0FBRSxPQUFhO1FBQ3BCLElBQUksT0FBTyxLQUFLLFNBQVMsRUFBRTtZQUN6QixPQUFPLElBQUksQ0FBQyxRQUFRLENBQUM7U0FDdEI7UUFDRCxJQUFJLENBQUMsUUFBUSxHQUFHLE9BQU8sQ0FBQztRQUN4QixPQUFPLElBQUksQ0FBQztJQUNkLENBQUM7SUFFRCxhQUFhLENBQUUsT0FBYTtRQUMxQixJQUFJLE9BQU8sS0FBSyxTQUFTLEVBQUU7WUFDekIsT0FBTyxJQUFJLENBQUMsY0FBYyxDQUFDO1NBQzVCO1FBQ0QsSUFBSSxDQUFDLGNBQWMsR0FBRyxPQUFPLENBQUM7UUFDOUIsT0FBTyxJQUFJLENBQUM7SUFDZCxDQUFDO0lBRUQsNkJBQTZCO0lBQzdCLE1BQU07UUFDSixPQUFPLElBQUksQ0FBQyxPQUFPLENBQUM7SUFDdEIsQ0FBQztJQUVELGlCQUFpQixDQUFFLEtBQVU7UUFDM0IsT0FBTyxLQUFLLFlBQVksS0FBSyxJQUFJLEtBQUssQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO0lBQ3BELENBQUM7Q0FDRiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7c2NoZW1lQ2F0ZWdvcnkxMH0gZnJvbSAnZDMtc2NhbGUtY2hyb21hdGljJztcbmltcG9ydCB7dGltZURheX0gZnJvbSAnZDMtdGltZSc7XG5pbXBvcnQge21heCwgbWlufSBmcm9tICdkMy1hcnJheSc7XG5pbXBvcnQge3NjYWxlQmFuZCwgc2NhbGVMaW5lYXIsIHNjYWxlT3JkaW5hbH0gZnJvbSAnZDMtc2NhbGUnO1xuaW1wb3J0IHtheGlzQm90dG9tLCBheGlzTGVmdCwgYXhpc1JpZ2h0fSBmcm9tICdkMy1heGlzJztcbmltcG9ydCB7em9vbSwgem9vbUlkZW50aXR5fSBmcm9tICdkMy16b29tJztcbmltcG9ydCB7YnJ1c2hYfSBmcm9tICdkMy1icnVzaCc7XG5pbXBvcnQge29wdGlvbmFsVHJhbnNpdGlvbiwgdW5pdHMsIHV0aWxzLCBsb2dnZXIsIGZpbHRlcnMsIGV2ZW50cywgdHJhbnNpdGlvbn0gZnJvbSAnZGMnO1xuaW1wb3J0IHtDb2xvck1peGlufSBmcm9tICcuL2NvbG9yLW1peGluJztcbmltcG9ydCB7TWFyZ2luTWl4aW59IGZyb20gJy4vbWFyZ2luLW1peGluJztcblxuY29uc3QgR1JJRF9MSU5FX0NMQVNTID0gJ2dyaWQtbGluZSc7XG5jb25zdCBIT1JJWk9OVEFMX0NMQVNTID0gJ2hvcml6b250YWwnO1xuY29uc3QgVkVSVElDQUxfQ0xBU1MgPSAndmVydGljYWwnO1xuY29uc3QgWV9BWElTX0xBQkVMX0NMQVNTID0gJ3ktYXhpcy1sYWJlbCc7XG5jb25zdCBYX0FYSVNfTEFCRUxfQ0xBU1MgPSAneC1heGlzLWxhYmVsJztcbmNvbnN0IENVU1RPTV9CUlVTSF9IQU5ETEVfQ0xBU1MgPSAnY3VzdG9tLWJydXNoLWhhbmRsZSc7XG5jb25zdCBERUZBVUxUX0FYSVNfTEFCRUxfUEFERElORyA9IDEyO1xuXG5jb25zdCBjb25zdGFudHMgPSB7XG4gIENIQVJUX0NMQVNTOiAnZGMtY2hhcnQnLFxuICBERUJVR19HUk9VUF9DTEFTUzogJ2RlYnVnJyxcbiAgU1RBQ0tfQ0xBU1M6ICdzdGFjaycsXG4gIERFU0VMRUNURURfQ0xBU1M6ICdkZXNlbGVjdGVkJyxcbiAgU0VMRUNURURfQ0xBU1M6ICdzZWxlY3RlZCcsXG4gIE5PREVfSU5ERVhfTkFNRTogJ19faW5kZXhfXycsXG4gIEdST1VQX0lOREVYX05BTUU6ICdfX2dyb3VwX2luZGV4X18nLFxuICBERUZBVUxUX0NIQVJUX0dST1VQOiAnX19kZWZhdWx0X2NoYXJ0X2dyb3VwX18nLFxuICBFVkVOVF9ERUxBWTogNDAsXG4gIE5FR0xJR0lCTEVfTlVNQkVSOiAxZS0xMFxufTtcblxuZXhwb3J0IGNsYXNzIENvb3JkaW5hdGVHcmlkTWl4aW4gZXh0ZW5kcyBDb2xvck1peGluKE1hcmdpbk1peGluKSB7XG5cbiAgb246IGFueTtcbiAgc3ZnOiBhbnk7XG4gIHJvb3Q6IGFueTtcbiAgZGF0YTogYW55O1xuICB3aWR0aDogYW55O1xuICBoZWlnaHQ6IGFueTtcbiAgcmVkcmF3OiBhbnk7XG4gIGNvbG9yczogYW55O1xuICBtYXJnaW5zOiBhbnk7XG4gIGFuY2hvck5hbWU6IGFueTtcbiAga2V5QWNjZXNzb3I6IGFueTtcbiAgdmFsdWVBY2Nlc3NvcjogYW55O1xuICBlZmZlY3RpdmVXaWR0aDogYW55O1xuICBlZmZlY3RpdmVIZWlnaHQ6IGFueTtcbiAgdHJhbnNpdGlvbkRlbGF5OiBhbnk7XG4gIHRyYW5zaXRpb25EdXJhdGlvbjogYW55O1xuICByZXBsYWNlRmlsdGVyOiBhbnk7XG4gIHJlZHJhd0dyb3VwOiBhbnk7XG4gIHJlc2V0U3ZnOiBhbnk7XG5cbiAgX2ludm9rZVpvb21lZExpc3RlbmVyOiBhbnk7XG4gIF9jb21wdXRlT3JkZXJlZEdyb3VwczogYW55O1xuICBfbWFuZGF0b3J5QXR0cmlidXRlczogYW55O1xuICBfcGFyZW50OiBhbnk7XG4gIF9nOiBhbnk7XG4gIF9jaGFydEJvZHlHOiBhbnk7XG4gIF94OiBhbnk7XG4gIF9vcmlnWDogYW55O1xuICBfeE9yaWdpbmFsRG9tYWluOiBhbnk7XG4gIF94QXhpczogYW55O1xuICBfeFVuaXRzOiBhbnk7XG4gIF94QXhpc1BhZGRpbmc6IGFueTtcbiAgX3hBeGlzUGFkZGluZ1VuaXQ6IGFueTtcbiAgX3hFbGFzdGljaXR5OiBhbnk7XG4gIF94QXhpc0xhYmVsOiBhbnk7XG4gIF94QXhpc0xhYmVsUGFkZGluZzogYW55O1xuICBfbGFzdFhEb21haW46IGFueTtcbiAgX3k6IGFueTtcbiAgX3lBeGlzOiBhbnk7XG4gIF95QXhpc1BhZGRpbmc6IGFueTtcbiAgX3lFbGFzdGljaXR5OiBhbnk7XG4gIF95QXhpc0xhYmVsOiBhbnk7XG4gIF95QXhpc0xhYmVsUGFkZGluZzogYW55O1xuICBfYnJ1c2g6IGFueTtcbiAgX2dCcnVzaDogYW55O1xuICBfYnJ1c2hPbjogYW55O1xuICBfcGFyZW50QnJ1c2hPbjogYW55O1xuICBfcm91bmQ6IGFueTtcbiAgX3JlbmRlckhvcml6b250YWxHcmlkTGluZTogYW55O1xuICBfcmVuZGVyVmVydGljYWxHcmlkTGluZTogYW55O1xuICBfcmVzaXppbmc6IGFueTtcbiAgX3VuaXRDb3VudDogYW55O1xuICBfem9vbVNjYWxlOiBhbnk7XG4gIF96b29tT3V0UmVzdHJpY3Q6IGFueTtcbiAgX3pvb206IGFueTtcbiAgX251bGxab29tOiBhbnk7XG4gIF9oYXNCZWVuTW91c2Vab29tYWJsZTogYW55O1xuICBfcmFuZ2VDaGFydDogYW55O1xuICBfZm9jdXNDaGFydDogYW55O1xuICBfbW91c2Vab29tYWJsZTogYW55O1xuICBfY2xpcFBhZGRpbmc6IGFueTtcbiAgX2ZPdXRlclJhbmdlQmFuZFBhZGRpbmc6IGFueTtcbiAgX2ZSYW5nZUJhbmRQYWRkaW5nOiBhbnk7XG4gIF91c2VSaWdodFlBeGlzOiBhbnk7XG5cbiAgY29uc3RydWN0b3IgKCkge1xuICAgIHN1cGVyKCk7XG5cbiAgICB0aGlzLmNvbG9ycyhzY2FsZU9yZGluYWwoc2NoZW1lQ2F0ZWdvcnkxMCkpO1xuICAgIHRoaXMuX21hbmRhdG9yeUF0dHJpYnV0ZXMoKS5wdXNoKCd4Jyk7XG4gICAgdGhpcy5fcGFyZW50ID0gdW5kZWZpbmVkO1xuICAgIHRoaXMuX2cgPSB1bmRlZmluZWQ7XG4gICAgdGhpcy5fY2hhcnRCb2R5RyA9IHVuZGVmaW5lZDtcbiAgICB0aGlzLl94ID0gdW5kZWZpbmVkO1xuICAgIHRoaXMuX29yaWdYID0gdW5kZWZpbmVkOyAvLyBXaWxsIGhvbGQgb3JpZ2luYWwgc2NhbGUgaW4gY2FzZSBvZiB6b29tXG4gICAgdGhpcy5feE9yaWdpbmFsRG9tYWluID0gdW5kZWZpbmVkO1xuICAgIC8vIEB0cy1pZ25vcmVcbiAgICB0aGlzLl94QXhpcyA9IGF4aXNCb3R0b20oKTtcbiAgICB0aGlzLl94VW5pdHMgPSB1bml0cy5pbnRlZ2VycztcbiAgICB0aGlzLl94QXhpc1BhZGRpbmcgPSAwO1xuICAgIHRoaXMuX3hBeGlzUGFkZGluZ1VuaXQgPSB0aW1lRGF5O1xuICAgIHRoaXMuX3hFbGFzdGljaXR5ID0gZmFsc2U7XG4gICAgdGhpcy5feEF4aXNMYWJlbCA9IHVuZGVmaW5lZDtcbiAgICB0aGlzLl94QXhpc0xhYmVsUGFkZGluZyA9IDA7XG4gICAgdGhpcy5fbGFzdFhEb21haW4gPSB1bmRlZmluZWQ7XG4gICAgdGhpcy5feSA9IHVuZGVmaW5lZDtcbiAgICB0aGlzLl95QXhpcyA9IG51bGw7XG4gICAgdGhpcy5feUF4aXNQYWRkaW5nID0gMDtcbiAgICB0aGlzLl95RWxhc3RpY2l0eSA9IGZhbHNlO1xuICAgIHRoaXMuX3lBeGlzTGFiZWwgPSB1bmRlZmluZWQ7XG4gICAgdGhpcy5feUF4aXNMYWJlbFBhZGRpbmcgPSAwO1xuICAgIHRoaXMuX2JydXNoID0gYnJ1c2hYKCk7XG4gICAgdGhpcy5fZ0JydXNoID0gdW5kZWZpbmVkO1xuICAgIHRoaXMuX2JydXNoT24gPSB0cnVlO1xuICAgIHRoaXMuX3BhcmVudEJydXNoT24gPSBmYWxzZTtcbiAgICB0aGlzLl9yb3VuZCA9IHVuZGVmaW5lZDtcbiAgICB0aGlzLl9yZW5kZXJIb3Jpem9udGFsR3JpZExpbmUgPSBmYWxzZTtcbiAgICB0aGlzLl9yZW5kZXJWZXJ0aWNhbEdyaWRMaW5lID0gZmFsc2U7XG4gICAgdGhpcy5fcmVzaXppbmcgPSBmYWxzZTtcbiAgICB0aGlzLl91bml0Q291bnQgPSB1bmRlZmluZWQ7XG4gICAgdGhpcy5fem9vbVNjYWxlID0gWzEsIEluZmluaXR5XTtcbiAgICB0aGlzLl96b29tT3V0UmVzdHJpY3QgPSB0cnVlO1xuICAgIHRoaXMuX3pvb20gPSB6b29tKCkub24oJ3pvb20nLCAoKSA9PiB0aGlzLl9vblpvb20oKSk7XG4gICAgdGhpcy5fbnVsbFpvb20gPSB6b29tKCkub24oJ3pvb20nLCBudWxsKTtcbiAgICB0aGlzLl9oYXNCZWVuTW91c2Vab29tYWJsZSA9IGZhbHNlO1xuICAgIHRoaXMuX3JhbmdlQ2hhcnQgPSB1bmRlZmluZWQ7XG4gICAgdGhpcy5fZm9jdXNDaGFydCA9IHVuZGVmaW5lZDtcbiAgICB0aGlzLl9tb3VzZVpvb21hYmxlID0gZmFsc2U7XG4gICAgdGhpcy5fY2xpcFBhZGRpbmcgPSAwO1xuICAgIHRoaXMuX2ZPdXRlclJhbmdlQmFuZFBhZGRpbmcgPSAwLjU7XG4gICAgdGhpcy5fZlJhbmdlQmFuZFBhZGRpbmcgPSAwO1xuICAgIHRoaXMuX3VzZVJpZ2h0WUF4aXMgPSBmYWxzZTtcbiAgfVxuXG4gIHJlc2NhbGUgKCkge1xuICAgIHRoaXMuX3VuaXRDb3VudCA9IHVuZGVmaW5lZDtcbiAgICB0aGlzLl9yZXNpemluZyA9IHRydWU7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICByZXNpemluZyAocmVzaXppbmc/OiBhbnkpIHtcbiAgICBpZiAocmVzaXppbmcgPT09IHVuZGVmaW5lZCkge1xuICAgICAgcmV0dXJuIHRoaXMuX3Jlc2l6aW5nO1xuICAgIH1cbiAgICB0aGlzLl9yZXNpemluZyA9IHJlc2l6aW5nO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgcmFuZ2VDaGFydCAocmFuZ2VDaGFydD86IGFueSkge1xuICAgIGlmIChyYW5nZUNoYXJ0ID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybiB0aGlzLl9yYW5nZUNoYXJ0O1xuICAgIH1cbiAgICB0aGlzLl9yYW5nZUNoYXJ0ID0gcmFuZ2VDaGFydDtcbiAgICB0aGlzLl9yYW5nZUNoYXJ0LmZvY3VzQ2hhcnQodGhpcyk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICB6b29tU2NhbGUgKGV4dGVudD86IGFueSkge1xuICAgIGlmIChleHRlbnQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgcmV0dXJuIHRoaXMuX3pvb21TY2FsZTtcbiAgICB9XG4gICAgdGhpcy5fem9vbVNjYWxlID0gZXh0ZW50O1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgem9vbU91dFJlc3RyaWN0ICh6b29tT3V0UmVzdHJpY3Q/OiBhbnkpIHtcbiAgICBpZiAoem9vbU91dFJlc3RyaWN0ID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybiB0aGlzLl96b29tT3V0UmVzdHJpY3Q7XG4gICAgfVxuICAgIHRoaXMuX3pvb21PdXRSZXN0cmljdCA9IHpvb21PdXRSZXN0cmljdDtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIF9nZW5lcmF0ZUcgKHBhcmVudD86IGFueSkge1xuICAgIGlmIChwYXJlbnQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhpcy5fcGFyZW50ID0gdGhpcy5zdmcoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5fcGFyZW50ID0gcGFyZW50O1xuICAgIH1cblxuICAgIGNvbnN0IGhyZWYgPSB3aW5kb3cubG9jYXRpb24uaHJlZi5zcGxpdCgnIycpWzBdO1xuXG4gICAgdGhpcy5fZyA9IHRoaXMuX3BhcmVudC5hcHBlbmQoJ2cnKTtcblxuICAgIHRoaXMuX2NoYXJ0Qm9keUcgPSB0aGlzLl9nLmFwcGVuZCgnZycpLmF0dHIoJ2NsYXNzJywgJ2NoYXJ0LWJvZHknKVxuICAgICAgLmF0dHIoJ3RyYW5zZm9ybScsIGB0cmFuc2xhdGUoJHt0aGlzLm1hcmdpbnMoKS5sZWZ0fSwgJHt0aGlzLm1hcmdpbnMoKS50b3B9KWApXG4gICAgICAuYXR0cignY2xpcC1wYXRoJywgYHVybCgke2hyZWZ9IyR7dGhpcy5fZ2V0Q2xpcFBhdGhJZCgpfSlgKTtcblxuICAgIHJldHVybiB0aGlzLl9nO1xuICB9XG5cbiAgZyAoZ0VsZW1lbnQ/OiBhbnkpIHtcbiAgICBpZiAoZ0VsZW1lbnQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgcmV0dXJuIHRoaXMuX2c7XG4gICAgfVxuICAgIHRoaXMuX2cgPSBnRWxlbWVudDtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIG1vdXNlWm9vbWFibGUgKG1vdXNlWm9vbWFibGU/OiBhbnkpIHtcbiAgICBpZiAobW91c2Vab29tYWJsZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm4gdGhpcy5fbW91c2Vab29tYWJsZTtcbiAgICB9XG4gICAgdGhpcy5fbW91c2Vab29tYWJsZSA9IG1vdXNlWm9vbWFibGU7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBjaGFydEJvZHlHIChjaGFydEJvZHlHPzogYW55KSB7XG4gICAgaWYgKGNoYXJ0Qm9keUcgPT09IHVuZGVmaW5lZCkge1xuICAgICAgcmV0dXJuIHRoaXMuX2NoYXJ0Qm9keUc7XG4gICAgfVxuICAgIHRoaXMuX2NoYXJ0Qm9keUcgPSBjaGFydEJvZHlHO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgeCAoeFNjYWxlPzogYW55KSB7XG4gICAgaWYgKHhTY2FsZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm4gdGhpcy5feDtcbiAgICB9XG4gICAgdGhpcy5feCA9IHhTY2FsZTtcbiAgICB0aGlzLl94T3JpZ2luYWxEb21haW4gPSB0aGlzLl94LmRvbWFpbigpO1xuICAgIHRoaXMucmVzY2FsZSgpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgeE9yaWdpbmFsRG9tYWluICgpIHtcbiAgICByZXR1cm4gdGhpcy5feE9yaWdpbmFsRG9tYWluO1xuICB9XG5cbiAgeFVuaXRzICh4VW5pdHM/OiBhbnkpIHtcbiAgICBpZiAoeFVuaXRzID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybiB0aGlzLl94VW5pdHM7XG4gICAgfVxuICAgIHRoaXMuX3hVbml0cyA9IHhVbml0cztcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHhBeGlzICh4QXhpcz86IGFueSkge1xuICAgIGlmICh4QXhpcyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm4gdGhpcy5feEF4aXM7XG4gICAgfVxuICAgIHRoaXMuX3hBeGlzID0geEF4aXM7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBlbGFzdGljWCAoZWxhc3RpY1g/OiBhbnkpIHtcbiAgICBpZiAoZWxhc3RpY1ggPT09IHVuZGVmaW5lZCkge1xuICAgICAgcmV0dXJuIHRoaXMuX3hFbGFzdGljaXR5O1xuICAgIH1cbiAgICB0aGlzLl94RWxhc3RpY2l0eSA9IGVsYXN0aWNYO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgeEF4aXNQYWRkaW5nIChwYWRkaW5nPzogYW55KSB7XG4gICAgaWYgKHBhZGRpbmcgPT09IHVuZGVmaW5lZCkge1xuICAgICAgcmV0dXJuIHRoaXMuX3hBeGlzUGFkZGluZztcbiAgICB9XG4gICAgdGhpcy5feEF4aXNQYWRkaW5nID0gcGFkZGluZztcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHhBeGlzUGFkZGluZ1VuaXQgKHVuaXQ/OiBhbnkpIHtcbiAgICBpZiAodW5pdCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm4gdGhpcy5feEF4aXNQYWRkaW5nVW5pdDtcbiAgICB9XG4gICAgdGhpcy5feEF4aXNQYWRkaW5nVW5pdCA9IHVuaXQ7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICB4VW5pdENvdW50ICgpIHtcbiAgICBpZiAodGhpcy5fdW5pdENvdW50ID09PSB1bmRlZmluZWQpIHtcbiAgICAgIGlmICh0aGlzLmlzT3JkaW5hbCgpKSB7XG4gICAgICAgIC8vIEluIHRoaXMgY2FzZSBpdCBudW1iZXIgb2YgaXRlbXMgaW4gZG9tYWluXG4gICAgICAgIHRoaXMuX3VuaXRDb3VudCA9IHRoaXMueCgpLmRvbWFpbigpLmxlbmd0aDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuX3VuaXRDb3VudCA9IHRoaXMueFVuaXRzKCkodGhpcy54KCkuZG9tYWluKClbMF0sIHRoaXMueCgpLmRvbWFpbigpWzFdKTtcblxuICAgICAgICAvLyBTb21ldGltZXMgeFVuaXRzKCkgbWF5IHJldHVybiBhbiBhcnJheSB3aGlsZSBzb21ldGltZXMgZGlyZWN0bHkgdGhlIGNvdW50XG4gICAgICAgIGlmICh0aGlzLl91bml0Q291bnQgaW5zdGFuY2VvZiBBcnJheSkge1xuICAgICAgICAgIHRoaXMuX3VuaXRDb3VudCA9IHRoaXMuX3VuaXRDb3VudC5sZW5ndGg7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5fdW5pdENvdW50O1xuICB9XG5cbiAgdXNlUmlnaHRZQXhpcyAodXNlUmlnaHRZQXhpcz86IGFueSkge1xuICAgIGlmICh1c2VSaWdodFlBeGlzID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybiB0aGlzLl91c2VSaWdodFlBeGlzO1xuICAgIH1cblxuICAgIC8vIFdlIG5lZWQgdG8gd2FybiBpZiB2YWx1ZSBpcyBjaGFuZ2luZyBhZnRlciBzZWxmLl95QXhpcyB3YXMgY3JlYXRlZFxuICAgIGlmICh0aGlzLl91c2VSaWdodFlBeGlzICE9PSB1c2VSaWdodFlBeGlzICYmIHRoaXMuX3lBeGlzKSB7XG4gICAgICBsb2dnZXIud2FybignVmFsdWUgb2YgdXNlUmlnaHRZQXhpcyBoYXMgYmVlbiBhbHRlcmVkLCBhZnRlciB5QXhpcyB3YXMgY3JlYXRlZC4gJyArXG4gICAgICAgICdZb3UgbWlnaHQgZ2V0IHVuZXhwZWN0ZWQgeUF4aXMgYmVoYXZpb3IuICcgK1xuICAgICAgICAnTWFrZSBjYWxscyB0byB1c2VSaWdodFlBeGlzIHNvb25lciBpbiB5b3VyIGNoYXJ0IGNyZWF0aW9uIHByb2Nlc3MuJyk7XG4gICAgfVxuXG4gICAgdGhpcy5fdXNlUmlnaHRZQXhpcyA9IHVzZVJpZ2h0WUF4aXM7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBpc09yZGluYWwgKCkge1xuICAgIHJldHVybiB0aGlzLnhVbml0cygpID09PSB1bml0cy5vcmRpbmFsO1xuICB9XG5cbiAgX3VzZU91dGVyUGFkZGluZyAoKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICBfb3JkaW5hbFhEb21haW4gKCkge1xuICAgIGNvbnN0IGdyb3VwcyA9IHRoaXMuX2NvbXB1dGVPcmRlcmVkR3JvdXBzKHRoaXMuZGF0YSgpKTtcbiAgICByZXR1cm4gZ3JvdXBzLm1hcCh0aGlzLmtleUFjY2Vzc29yKCkpO1xuICB9XG5cbiAgX3ByZXBhcmVYQXhpcyAoZzogYW55LCByZW5kZXI6IGFueSkge1xuICAgIGlmICghdGhpcy5pc09yZGluYWwoKSkge1xuICAgICAgaWYgKHRoaXMuZWxhc3RpY1goKSkge1xuICAgICAgICB0aGlzLl94LmRvbWFpbihbdGhpcy54QXhpc01pbigpLCB0aGlzLnhBeGlzTWF4KCldKTtcbiAgICAgIH1cbiAgICB9IGVsc2UgeyAvLyBzZWxmLl9jaGFydC5pc09yZGluYWwoKVxuICAgICAgLy8gRDN2NCAtIE9yZGluYWwgY2hhcnRzIHdvdWxkIG5lZWQgc2NhbGVCYW5kXG4gICAgICAvLyBiYW5kd2lkdGggaXMgYSBtZXRob2QgaW4gc2NhbGVCYW5kXG4gICAgICAvLyAoaHR0cHM6Ly9naXRodWIuY29tL2QzL2QzLXNjYWxlL2Jsb2IvbWFzdGVyL1JFQURNRS5tZCNzY2FsZUJhbmQpXG4gICAgICBpZiAoIXRoaXMuX3guYmFuZHdpZHRoKSB7XG4gICAgICAgIC8vIElmIHNlbGYuX3ggaXMgbm90IGEgc2NhbGVCYW5kIGNyZWF0ZSBhIG5ldyBzY2FsZSBhbmRcbiAgICAgICAgLy8gY29weSB0aGUgb3JpZ2luYWwgZG9tYWluIHRvIHRoZSBuZXcgc2NhbGVcbiAgICAgICAgbG9nZ2VyLndhcm4oJ0ZvciBjb21wYXRpYmlsaXR5IHdpdGggZDN2NCssIGRjLmpzIGQzLjAgb3JkaW5hbCBiYXIvbGluZS9idWJibGUgY2hhcnRzIG5lZWQgJyArXG4gICAgICAgICAgJ2QzLnNjYWxlQmFuZCgpIGZvciB0aGUgeCBzY2FsZSwgaW5zdGVhZCBvZiBkMy5zY2FsZU9yZGluYWwoKS4gJyArXG4gICAgICAgICAgJ1JlcGxhY2luZyAueCgpIHdpdGggYSBkMy5zY2FsZUJhbmQgd2l0aCB0aGUgc2FtZSBkb21haW4gLSAnICtcbiAgICAgICAgICAnbWFrZSB0aGUgc2FtZSBjaGFuZ2UgaW4geW91ciBjb2RlIHRvIGF2b2lkIHRoaXMgd2FybmluZyEnKTtcbiAgICAgICAgdGhpcy5feCA9IHNjYWxlQmFuZCgpLmRvbWFpbih0aGlzLl94LmRvbWFpbigpKTtcbiAgICAgIH1cblxuICAgICAgaWYgKHRoaXMuZWxhc3RpY1goKSB8fCB0aGlzLl94LmRvbWFpbigpLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICB0aGlzLl94LmRvbWFpbih0aGlzLl9vcmRpbmFsWERvbWFpbigpKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBoYXMgdGhlIGRvbWFpbiBjaGFuZ2VkP1xuICAgIGNvbnN0IHhkb20gPSB0aGlzLl94LmRvbWFpbigpO1xuICAgIGlmIChyZW5kZXIgfHwgIXV0aWxzLmFycmF5c0VxdWFsKHRoaXMuX2xhc3RYRG9tYWluLCB4ZG9tKSkge1xuICAgICAgdGhpcy5yZXNjYWxlKCk7XG4gICAgfVxuICAgIHRoaXMuX2xhc3RYRG9tYWluID0geGRvbTtcblxuICAgIC8vIHBsZWFzZSBjYW4ndCB3ZSBhbHdheXMgdXNlIHJhbmdlQmFuZHMgZm9yIGJhciBjaGFydHM/XG4gICAgaWYgKHRoaXMuaXNPcmRpbmFsKCkpIHtcbiAgICAgIHRoaXMuX3gucmFuZ2UoWzAsIHRoaXMueEF4aXNMZW5ndGgoKV0pXG4gICAgICAgIC5wYWRkaW5nSW5uZXIodGhpcy5fZlJhbmdlQmFuZFBhZGRpbmcpXG4gICAgICAgIC5wYWRkaW5nT3V0ZXIodGhpcy5fdXNlT3V0ZXJQYWRkaW5nKCkgPyB0aGlzLl9mT3V0ZXJSYW5nZUJhbmRQYWRkaW5nIDogMCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX3gucmFuZ2UoWzAsIHRoaXMueEF4aXNMZW5ndGgoKV0pO1xuICAgIH1cblxuICAgIHRoaXMuX3hBeGlzID0gdGhpcy5feEF4aXMuc2NhbGUodGhpcy54KCkpO1xuXG4gICAgdGhpcy5fcmVuZGVyVmVydGljYWxHcmlkTGluZXMoZyk7XG4gIH1cblxuICByZW5kZXJYQXhpcyAoZzogYW55KSB7XG4gICAgbGV0IGF4aXNYRyA9IGcuc2VsZWN0KCdnLngnKTtcblxuICAgIGlmIChheGlzWEcuZW1wdHkoKSkge1xuICAgICAgYXhpc1hHID0gZy5hcHBlbmQoJ2cnKVxuICAgICAgICAuYXR0cignY2xhc3MnLCAnYXhpcyB4JylcbiAgICAgICAgLmF0dHIoJ3RyYW5zZm9ybScsIGB0cmFuc2xhdGUoJHt0aGlzLm1hcmdpbnMoKS5sZWZ0fSwke3RoaXMuX3hBeGlzWSgpfSlgKTtcbiAgICB9XG5cbiAgICBsZXQgYXhpc1hMYWIgPSBnLnNlbGVjdChgdGV4dC4ke1hfQVhJU19MQUJFTF9DTEFTU31gKTtcbiAgICBpZiAoYXhpc1hMYWIuZW1wdHkoKSAmJiB0aGlzLnhBeGlzTGFiZWwoKSkge1xuICAgICAgYXhpc1hMYWIgPSBnLmFwcGVuZCgndGV4dCcpXG4gICAgICAgIC5hdHRyKCdjbGFzcycsIFhfQVhJU19MQUJFTF9DTEFTUylcbiAgICAgICAgLmF0dHIoJ3RyYW5zZm9ybScsIGB0cmFuc2xhdGUoJHt0aGlzLm1hcmdpbnMoKS5sZWZ0ICsgdGhpcy54QXhpc0xlbmd0aCgpIC8gMn0sJHtcbiAgICAgICAgICB0aGlzLmhlaWdodCgpIC0gdGhpcy5feEF4aXNMYWJlbFBhZGRpbmd9KWApXG4gICAgICAgIC5hdHRyKCd0ZXh0LWFuY2hvcicsICdtaWRkbGUnKTtcbiAgICB9XG4gICAgaWYgKHRoaXMueEF4aXNMYWJlbCgpICYmIGF4aXNYTGFiLnRleHQoKSAhPT0gdGhpcy54QXhpc0xhYmVsKCkpIHtcbiAgICAgIGF4aXNYTGFiLnRleHQodGhpcy54QXhpc0xhYmVsKCkpO1xuICAgIH1cblxuICAgIHRyYW5zaXRpb24oYXhpc1hHLCB0aGlzLnRyYW5zaXRpb25EdXJhdGlvbigpLCB0aGlzLnRyYW5zaXRpb25EZWxheSgpKVxuICAgICAgLmF0dHIoJ3RyYW5zZm9ybScsIGB0cmFuc2xhdGUoJHt0aGlzLm1hcmdpbnMoKS5sZWZ0fSwke3RoaXMuX3hBeGlzWSgpfSlgKVxuICAgICAgLmNhbGwodGhpcy5feEF4aXMpO1xuICAgIHRyYW5zaXRpb24oYXhpc1hMYWIsIHRoaXMudHJhbnNpdGlvbkR1cmF0aW9uKCksIHRoaXMudHJhbnNpdGlvbkRlbGF5KCkpXG4gICAgICAuYXR0cigndHJhbnNmb3JtJywgYHRyYW5zbGF0ZSgke3RoaXMubWFyZ2lucygpLmxlZnQgKyB0aGlzLnhBeGlzTGVuZ3RoKCkgLyAyfSwke1xuICAgICAgICB0aGlzLmhlaWdodCgpIC0gdGhpcy5feEF4aXNMYWJlbFBhZGRpbmd9KWApO1xuICB9XG5cbiAgX3JlbmRlclZlcnRpY2FsR3JpZExpbmVzIChnOiBhbnkpIHtcbiAgICBsZXQgZ3JpZExpbmVHID0gZy5zZWxlY3QoYGcuJHtWRVJUSUNBTF9DTEFTU31gKTtcblxuICAgIGlmICh0aGlzLl9yZW5kZXJWZXJ0aWNhbEdyaWRMaW5lKSB7XG4gICAgICBpZiAoZ3JpZExpbmVHLmVtcHR5KCkpIHtcbiAgICAgICAgZ3JpZExpbmVHID0gZy5pbnNlcnQoJ2cnLCAnOmZpcnN0LWNoaWxkJylcbiAgICAgICAgICAuYXR0cignY2xhc3MnLCBgJHtHUklEX0xJTkVfQ0xBU1N9ICR7VkVSVElDQUxfQ0xBU1N9YClcbiAgICAgICAgICAuYXR0cigndHJhbnNmb3JtJywgYHRyYW5zbGF0ZSgke3RoaXMubWFyZ2lucygpLmxlZnR9LCR7dGhpcy5tYXJnaW5zKCkudG9wfSlgKTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgdGlja3MgPSB0aGlzLl94QXhpcy50aWNrVmFsdWVzKCkgPyB0aGlzLl94QXhpcy50aWNrVmFsdWVzKCkgOlxuICAgICAgICAodHlwZW9mIHRoaXMuX3gudGlja3MgPT09ICdmdW5jdGlvbicgPyB0aGlzLl94LnRpY2tzLmFwcGx5KHRoaXMuX3gsIHRoaXMuX3hBeGlzLnRpY2tBcmd1bWVudHMoKSkgOiB0aGlzLl94LmRvbWFpbigpKTtcblxuICAgICAgY29uc3QgbGluZXMgPSBncmlkTGluZUcuc2VsZWN0QWxsKCdsaW5lJylcbiAgICAgICAgLmRhdGEodGlja3MpO1xuXG4gICAgICAvLyBlbnRlclxuICAgICAgY29uc3QgbGluZXNHRW50ZXIgPSBsaW5lcy5lbnRlcigpXG4gICAgICAgIC5hcHBlbmQoJ2xpbmUnKVxuICAgICAgICAuYXR0cigneDEnLCAoZDogYW55KSA9PiB0aGlzLl94KGQpKVxuICAgICAgICAuYXR0cigneTEnLCB0aGlzLl94QXhpc1koKSAtIHRoaXMubWFyZ2lucygpLnRvcClcbiAgICAgICAgLmF0dHIoJ3gyJywgKGQ6IGFueSkgPT4gdGhpcy5feChkKSlcbiAgICAgICAgLmF0dHIoJ3kyJywgMClcbiAgICAgICAgLmF0dHIoJ29wYWNpdHknLCAwKTtcbiAgICAgIHRyYW5zaXRpb24obGluZXNHRW50ZXIsIHRoaXMudHJhbnNpdGlvbkR1cmF0aW9uKCksIHRoaXMudHJhbnNpdGlvbkRlbGF5KCkpXG4gICAgICAgIC5hdHRyKCdvcGFjaXR5JywgMC41KTtcblxuICAgICAgLy8gdXBkYXRlXG4gICAgICB0cmFuc2l0aW9uKGxpbmVzLCB0aGlzLnRyYW5zaXRpb25EdXJhdGlvbigpLCB0aGlzLnRyYW5zaXRpb25EZWxheSgpKVxuICAgICAgICAuYXR0cigneDEnLCBkID0+IHRoaXMuX3goZCkpXG4gICAgICAgIC5hdHRyKCd5MScsIHRoaXMuX3hBeGlzWSgpIC0gdGhpcy5tYXJnaW5zKCkudG9wKVxuICAgICAgICAuYXR0cigneDInLCBkID0+IHRoaXMuX3goZCkpXG4gICAgICAgIC5hdHRyKCd5MicsIDApO1xuXG4gICAgICAvLyBleGl0XG4gICAgICBsaW5lcy5leGl0KCkucmVtb3ZlKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGdyaWRMaW5lRy5zZWxlY3RBbGwoJ2xpbmUnKS5yZW1vdmUoKTtcbiAgICB9XG4gIH1cblxuICBfeEF4aXNZICgpIHtcbiAgICByZXR1cm4gKHRoaXMuaGVpZ2h0KCkgLSB0aGlzLm1hcmdpbnMoKS5ib3R0b20pO1xuICB9XG5cbiAgeEF4aXNMZW5ndGggKCkge1xuICAgIHJldHVybiB0aGlzLmVmZmVjdGl2ZVdpZHRoKCk7XG4gIH1cblxuICB4QXhpc0xhYmVsIChsYWJlbFRleHQ/OiBhbnksIHBhZGRpbmc/OiBhbnkpIHtcbiAgICBpZiAobGFiZWxUZXh0ID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybiB0aGlzLl94QXhpc0xhYmVsO1xuICAgIH1cbiAgICB0aGlzLl94QXhpc0xhYmVsID0gbGFiZWxUZXh0O1xuICAgIHRoaXMubWFyZ2lucygpLmJvdHRvbSAtPSB0aGlzLl94QXhpc0xhYmVsUGFkZGluZztcbiAgICB0aGlzLl94QXhpc0xhYmVsUGFkZGluZyA9IChwYWRkaW5nID09PSB1bmRlZmluZWQpID8gREVGQVVMVF9BWElTX0xBQkVMX1BBRERJTkcgOiBwYWRkaW5nO1xuICAgIHRoaXMubWFyZ2lucygpLmJvdHRvbSArPSB0aGlzLl94QXhpc0xhYmVsUGFkZGluZztcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIF9jcmVhdGVZQXhpcyAoKSB7XG4gICAgLy8gQHRzLWlnbm9yZVxuICAgIHJldHVybiB0aGlzLl91c2VSaWdodFlBeGlzID8gYXhpc1JpZ2h0KCkgOiBheGlzTGVmdCgpO1xuICB9XG5cbiAgX3ByZXBhcmVZQXhpcyAoZzogYW55KSB7XG4gICAgaWYgKHRoaXMuX3kgPT09IHVuZGVmaW5lZCB8fCB0aGlzLmVsYXN0aWNZKCkpIHtcbiAgICAgIGlmICh0aGlzLl95ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgdGhpcy5feSA9IHNjYWxlTGluZWFyKCk7XG4gICAgICB9XG4gICAgICBjb25zdCBfbWluID0gdGhpcy55QXhpc01pbigpIHx8IDA7XG4gICAgICBjb25zdCBfbWF4ID0gdGhpcy55QXhpc01heCgpIHx8IDA7XG4gICAgICB0aGlzLl95LmRvbWFpbihbX21pbiwgX21heF0pLnJhbmdlUm91bmQoW3RoaXMueUF4aXNIZWlnaHQoKSwgMF0pO1xuICAgIH1cblxuICAgIHRoaXMuX3kucmFuZ2UoW3RoaXMueUF4aXNIZWlnaHQoKSwgMF0pO1xuXG4gICAgaWYgKCF0aGlzLl95QXhpcykge1xuICAgICAgdGhpcy5feUF4aXMgPSB0aGlzLl9jcmVhdGVZQXhpcygpO1xuICAgIH1cblxuICAgIHRoaXMuX3lBeGlzLnNjYWxlKHRoaXMuX3kpO1xuXG4gICAgdGhpcy5fcmVuZGVySG9yaXpvbnRhbEdyaWRMaW5lc0ZvckF4aXMoZywgdGhpcy5feSwgdGhpcy5feUF4aXMpO1xuICB9XG5cbiAgcmVuZGVyWUF4aXNMYWJlbCAoYXhpc0NsYXNzPzogYW55LCB0ZXh0PzogYW55LCByb3RhdGlvbj86IGFueSwgbGFiZWxYUG9zaXRpb24/OiBhbnkpIHtcbiAgICBsYWJlbFhQb3NpdGlvbiA9IGxhYmVsWFBvc2l0aW9uIHx8IHRoaXMuX3lBeGlzTGFiZWxQYWRkaW5nO1xuXG4gICAgbGV0IGF4aXNZTGFiID0gdGhpcy5nKCkuc2VsZWN0KGB0ZXh0LiR7WV9BWElTX0xBQkVMX0NMQVNTfS4ke2F4aXNDbGFzc30tbGFiZWxgKTtcbiAgICBjb25zdCBsYWJlbFlQb3NpdGlvbiA9ICh0aGlzLm1hcmdpbnMoKS50b3AgKyB0aGlzLnlBeGlzSGVpZ2h0KCkgLyAyKTtcbiAgICBpZiAoYXhpc1lMYWIuZW1wdHkoKSAmJiB0ZXh0KSB7XG4gICAgICBheGlzWUxhYiA9IHRoaXMuZygpLmFwcGVuZCgndGV4dCcpXG4gICAgICAgIC5hdHRyKCd0cmFuc2Zvcm0nLCBgdHJhbnNsYXRlKCR7bGFiZWxYUG9zaXRpb259LCR7bGFiZWxZUG9zaXRpb259KSxyb3RhdGUoJHtyb3RhdGlvbn0pYClcbiAgICAgICAgLmF0dHIoJ2NsYXNzJywgYCR7WV9BWElTX0xBQkVMX0NMQVNTfSAke2F4aXNDbGFzc30tbGFiZWxgKVxuICAgICAgICAuYXR0cigndGV4dC1hbmNob3InLCAnbWlkZGxlJylcbiAgICAgICAgLnRleHQodGV4dCk7XG4gICAgfVxuICAgIGlmICh0ZXh0ICYmIGF4aXNZTGFiLnRleHQoKSAhPT0gdGV4dCkge1xuICAgICAgYXhpc1lMYWIudGV4dCh0ZXh0KTtcbiAgICB9XG4gICAgdHJhbnNpdGlvbihheGlzWUxhYiwgdGhpcy50cmFuc2l0aW9uRHVyYXRpb24oKSwgdGhpcy50cmFuc2l0aW9uRGVsYXkoKSlcbiAgICAgIC5hdHRyKCd0cmFuc2Zvcm0nLCBgdHJhbnNsYXRlKCR7bGFiZWxYUG9zaXRpb259LCR7bGFiZWxZUG9zaXRpb259KSxyb3RhdGUoJHtyb3RhdGlvbn0pYCk7XG4gIH1cblxuICByZW5kZXJZQXhpc0F0IChheGlzQ2xhc3M6IGFueSwgYXhpczogYW55LCBwb3NpdGlvbjogYW55KSB7XG4gICAgbGV0IGF4aXNZRyA9IHRoaXMuZygpLnNlbGVjdChgZy4ke2F4aXNDbGFzc31gKTtcbiAgICBpZiAoYXhpc1lHLmVtcHR5KCkpIHtcbiAgICAgIGF4aXNZRyA9IHRoaXMuZygpLmFwcGVuZCgnZycpXG4gICAgICAgIC5hdHRyKCdjbGFzcycsIGBheGlzICR7YXhpc0NsYXNzfWApXG4gICAgICAgIC5hdHRyKCd0cmFuc2Zvcm0nLCBgdHJhbnNsYXRlKCR7cG9zaXRpb259LCR7dGhpcy5tYXJnaW5zKCkudG9wfSlgKTtcbiAgICB9XG5cbiAgICB0cmFuc2l0aW9uKGF4aXNZRywgdGhpcy50cmFuc2l0aW9uRHVyYXRpb24oKSwgdGhpcy50cmFuc2l0aW9uRGVsYXkoKSlcbiAgICAgIC5hdHRyKCd0cmFuc2Zvcm0nLCBgdHJhbnNsYXRlKCR7cG9zaXRpb259LCR7dGhpcy5tYXJnaW5zKCkudG9wfSlgKVxuICAgICAgLmNhbGwoYXhpcyk7XG4gIH1cblxuICByZW5kZXJZQXhpcyAoZz86IGFueSkge1xuICAgIGNvbnN0IGF4aXNQb3NpdGlvbiA9IHRoaXMuX3VzZVJpZ2h0WUF4aXMgPyAodGhpcy53aWR0aCgpIC0gdGhpcy5tYXJnaW5zKCkucmlnaHQpIDogdGhpcy5feUF4aXNYKCk7XG4gICAgdGhpcy5yZW5kZXJZQXhpc0F0KCd5JywgdGhpcy5feUF4aXMsIGF4aXNQb3NpdGlvbik7XG4gICAgY29uc3QgbGFiZWxQb3NpdGlvbiA9IHRoaXMuX3VzZVJpZ2h0WUF4aXMgPyAodGhpcy53aWR0aCgpIC0gdGhpcy5feUF4aXNMYWJlbFBhZGRpbmcpIDogdGhpcy5feUF4aXNMYWJlbFBhZGRpbmc7XG4gICAgY29uc3Qgcm90YXRpb24gPSB0aGlzLl91c2VSaWdodFlBeGlzID8gOTAgOiAtOTA7XG4gICAgdGhpcy5yZW5kZXJZQXhpc0xhYmVsKCd5JywgdGhpcy55QXhpc0xhYmVsKCksIHJvdGF0aW9uLCBsYWJlbFBvc2l0aW9uKTtcbiAgfVxuXG4gIF9yZW5kZXJIb3Jpem9udGFsR3JpZExpbmVzRm9yQXhpcyAoZzogYW55LCBzY2FsZTogYW55LCBheGlzOiBhbnkpIHtcbiAgICBsZXQgZ3JpZExpbmVHID0gZy5zZWxlY3QoYGcuJHtIT1JJWk9OVEFMX0NMQVNTfWApO1xuXG4gICAgaWYgKHRoaXMuX3JlbmRlckhvcml6b250YWxHcmlkTGluZSkge1xuICAgICAgLy8gc2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9kMy9kMy1heGlzL2Jsb2IvbWFzdGVyL3NyYy9heGlzLmpzI0w0OFxuICAgICAgY29uc3QgdGlja3MgPSBheGlzLnRpY2tWYWx1ZXMoKSA/IGF4aXMudGlja1ZhbHVlcygpIDpcbiAgICAgICAgKHNjYWxlLnRpY2tzID8gc2NhbGUudGlja3MuYXBwbHkoc2NhbGUsIGF4aXMudGlja0FyZ3VtZW50cygpKSA6IHNjYWxlLmRvbWFpbigpKTtcblxuICAgICAgaWYgKGdyaWRMaW5lRy5lbXB0eSgpKSB7XG4gICAgICAgIGdyaWRMaW5lRyA9IGcuaW5zZXJ0KCdnJywgJzpmaXJzdC1jaGlsZCcpXG4gICAgICAgICAgLmF0dHIoJ2NsYXNzJywgYCR7R1JJRF9MSU5FX0NMQVNTfSAke0hPUklaT05UQUxfQ0xBU1N9YClcbiAgICAgICAgICAuYXR0cigndHJhbnNmb3JtJywgYHRyYW5zbGF0ZSgke3RoaXMubWFyZ2lucygpLmxlZnR9LCR7dGhpcy5tYXJnaW5zKCkudG9wfSlgKTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgbGluZXMgPSBncmlkTGluZUcuc2VsZWN0QWxsKCdsaW5lJylcbiAgICAgICAgLmRhdGEodGlja3MpO1xuXG4gICAgICAvLyBlbnRlclxuICAgICAgY29uc3QgbGluZXNHRW50ZXIgPSBsaW5lcy5lbnRlcigpXG4gICAgICAgIC5hcHBlbmQoJ2xpbmUnKVxuICAgICAgICAuYXR0cigneDEnLCAxKVxuICAgICAgICAuYXR0cigneTEnLCAoZDogYW55KSA9PiBzY2FsZShkKSlcbiAgICAgICAgLmF0dHIoJ3gyJywgdGhpcy54QXhpc0xlbmd0aCgpKVxuICAgICAgICAuYXR0cigneTInLCAoZDogYW55KSA9PiBzY2FsZShkKSlcbiAgICAgICAgLmF0dHIoJ29wYWNpdHknLCAwKTtcbiAgICAgIHRyYW5zaXRpb24obGluZXNHRW50ZXIsIHRoaXMudHJhbnNpdGlvbkR1cmF0aW9uKCksIHRoaXMudHJhbnNpdGlvbkRlbGF5KCkpXG4gICAgICAgIC5hdHRyKCdvcGFjaXR5JywgMC41KTtcblxuICAgICAgLy8gdXBkYXRlXG4gICAgICB0cmFuc2l0aW9uKGxpbmVzLCB0aGlzLnRyYW5zaXRpb25EdXJhdGlvbigpLCB0aGlzLnRyYW5zaXRpb25EZWxheSgpKVxuICAgICAgICAuYXR0cigneDEnLCAxKVxuICAgICAgICAuYXR0cigneTEnLCBkID0+IHNjYWxlKGQpKVxuICAgICAgICAuYXR0cigneDInLCB0aGlzLnhBeGlzTGVuZ3RoKCkpXG4gICAgICAgIC5hdHRyKCd5MicsIGQgPT4gc2NhbGUoZCkpO1xuXG4gICAgICAvLyBleGl0XG4gICAgICBsaW5lcy5leGl0KCkucmVtb3ZlKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGdyaWRMaW5lRy5zZWxlY3RBbGwoJ2xpbmUnKS5yZW1vdmUoKTtcbiAgICB9XG4gIH1cblxuICBfeUF4aXNYICgpIHtcbiAgICByZXR1cm4gdGhpcy51c2VSaWdodFlBeGlzKCkgPyB0aGlzLndpZHRoKCkgLSB0aGlzLm1hcmdpbnMoKS5yaWdodCA6IHRoaXMubWFyZ2lucygpLmxlZnQ7XG4gIH1cblxuICB5QXhpc0xhYmVsIChsYWJlbFRleHQ/OiBhbnksIHBhZGRpbmc/OiBhbnkpIHtcbiAgICBpZiAobGFiZWxUZXh0ID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybiB0aGlzLl95QXhpc0xhYmVsO1xuICAgIH1cbiAgICB0aGlzLl95QXhpc0xhYmVsID0gbGFiZWxUZXh0O1xuICAgIHRoaXMubWFyZ2lucygpLmxlZnQgLT0gdGhpcy5feUF4aXNMYWJlbFBhZGRpbmc7XG4gICAgdGhpcy5feUF4aXNMYWJlbFBhZGRpbmcgPSAocGFkZGluZyA9PT0gdW5kZWZpbmVkKSA/IERFRkFVTFRfQVhJU19MQUJFTF9QQURESU5HIDogcGFkZGluZztcbiAgICB0aGlzLm1hcmdpbnMoKS5sZWZ0ICs9IHRoaXMuX3lBeGlzTGFiZWxQYWRkaW5nO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgeSAoeVNjYWxlPzogYW55KSB7XG4gICAgaWYgKHlTY2FsZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm4gdGhpcy5feTtcbiAgICB9XG4gICAgdGhpcy5feSA9IHlTY2FsZTtcbiAgICB0aGlzLnJlc2NhbGUoKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHlBeGlzICh5QXhpcz86IGFueSkge1xuICAgIGlmICh5QXhpcyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBpZiAoIXRoaXMuX3lBeGlzKSB7XG4gICAgICAgIHRoaXMuX3lBeGlzID0gdGhpcy5fY3JlYXRlWUF4aXMoKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0aGlzLl95QXhpcztcbiAgICB9XG4gICAgdGhpcy5feUF4aXMgPSB5QXhpcztcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIGVsYXN0aWNZIChlbGFzdGljWT86IGFueSkge1xuICAgIGlmIChlbGFzdGljWSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm4gdGhpcy5feUVsYXN0aWNpdHk7XG4gICAgfVxuICAgIHRoaXMuX3lFbGFzdGljaXR5ID0gZWxhc3RpY1k7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICByZW5kZXJIb3Jpem9udGFsR3JpZExpbmVzIChyZW5kZXJIb3Jpem9udGFsR3JpZExpbmVzPzogYW55KSB7XG4gICAgaWYgKHJlbmRlckhvcml6b250YWxHcmlkTGluZXMgPT09IHVuZGVmaW5lZCkge1xuICAgICAgcmV0dXJuIHRoaXMuX3JlbmRlckhvcml6b250YWxHcmlkTGluZTtcbiAgICB9XG4gICAgdGhpcy5fcmVuZGVySG9yaXpvbnRhbEdyaWRMaW5lID0gcmVuZGVySG9yaXpvbnRhbEdyaWRMaW5lcztcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHJlbmRlclZlcnRpY2FsR3JpZExpbmVzIChyZW5kZXJWZXJ0aWNhbEdyaWRMaW5lcz86IGFueSkge1xuICAgIGlmIChyZW5kZXJWZXJ0aWNhbEdyaWRMaW5lcyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm4gdGhpcy5fcmVuZGVyVmVydGljYWxHcmlkTGluZTtcbiAgICB9XG4gICAgdGhpcy5fcmVuZGVyVmVydGljYWxHcmlkTGluZSA9IHJlbmRlclZlcnRpY2FsR3JpZExpbmVzO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgeEF4aXNNaW4gKCkge1xuICAgIGNvbnN0IG0gPSBtaW4odGhpcy5kYXRhKCksIGUgPT4gdGhpcy5rZXlBY2Nlc3NvcigpKGUpKTtcbiAgICAvLyBAdHMtaWdub3JlXG4gICAgcmV0dXJuIHV0aWxzLnN1YnRyYWN0KG0sIHRoaXMuX3hBeGlzUGFkZGluZywgdGhpcy5feEF4aXNQYWRkaW5nVW5pdCk7XG4gIH1cblxuICB4QXhpc01heCAoKSB7XG4gICAgY29uc3QgbSA9IG1heCh0aGlzLmRhdGEoKSwgZSA9PiB0aGlzLmtleUFjY2Vzc29yKCkoZSkpO1xuICAgIC8vIEB0cy1pZ25vcmVcbiAgICByZXR1cm4gdXRpbHMuYWRkKG0sIHRoaXMuX3hBeGlzUGFkZGluZywgdGhpcy5feEF4aXNQYWRkaW5nVW5pdCk7XG4gIH1cblxuICB5QXhpc01pbiAoKSB7XG4gICAgY29uc3QgbSA9IG1pbih0aGlzLmRhdGEoKSwgZSA9PiB0aGlzLnZhbHVlQWNjZXNzb3IoKShlKSk7XG4gICAgLy8gQHRzLWlnbm9yZVxuICAgIHJldHVybiB1dGlscy5zdWJ0cmFjdChtLCB0aGlzLl95QXhpc1BhZGRpbmcpO1xuICB9XG5cbiAgeUF4aXNNYXggKCkge1xuICAgIGNvbnN0IG0gPSBtYXgodGhpcy5kYXRhKCksIGUgPT4gdGhpcy52YWx1ZUFjY2Vzc29yKCkoZSkpO1xuICAgIC8vIEB0cy1pZ25vcmVcbiAgICByZXR1cm4gdXRpbHMuYWRkKG0sIHRoaXMuX3lBeGlzUGFkZGluZyk7XG4gIH1cblxuICB5QXhpc1BhZGRpbmcgKHBhZGRpbmc/OiBhbnkpIHtcbiAgICBpZiAocGFkZGluZyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm4gdGhpcy5feUF4aXNQYWRkaW5nO1xuICAgIH1cbiAgICB0aGlzLl95QXhpc1BhZGRpbmcgPSBwYWRkaW5nO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgeUF4aXNIZWlnaHQgKCkge1xuICAgIHJldHVybiB0aGlzLmVmZmVjdGl2ZUhlaWdodCgpO1xuICB9XG5cbiAgcm91bmQgKHJvdW5kPzogYW55KSB7XG4gICAgaWYgKHJvdW5kID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybiB0aGlzLl9yb3VuZDtcbiAgICB9XG4gICAgdGhpcy5fcm91bmQgPSByb3VuZDtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIF9yYW5nZUJhbmRQYWRkaW5nIChfPzogYW55KSB7XG4gICAgaWYgKF8gPT09IHVuZGVmaW5lZCkge1xuICAgICAgcmV0dXJuIHRoaXMuX2ZSYW5nZUJhbmRQYWRkaW5nO1xuICAgIH1cbiAgICB0aGlzLl9mUmFuZ2VCYW5kUGFkZGluZyA9IF87XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBfb3V0ZXJSYW5nZUJhbmRQYWRkaW5nIChfPzogYW55KSB7XG4gICAgaWYgKF8gPT09IHVuZGVmaW5lZCkge1xuICAgICAgcmV0dXJuIHRoaXMuX2ZPdXRlclJhbmdlQmFuZFBhZGRpbmc7XG4gICAgfVxuICAgIHRoaXMuX2ZPdXRlclJhbmdlQmFuZFBhZGRpbmcgPSBfO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgZmlsdGVyIChfPzogYW55KSB7XG4gICAgaWYgKF8gPT09IHVuZGVmaW5lZCkge1xuICAgICAgcmV0dXJuIHN1cGVyLmZpbHRlcigpO1xuICAgIH1cblxuICAgIHN1cGVyLmZpbHRlcihfKTtcblxuICAgIHRoaXMucmVkcmF3QnJ1c2goXywgZmFsc2UpO1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBicnVzaCAoXz86IGFueSkge1xuICAgIGlmIChfID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybiB0aGlzLl9icnVzaDtcbiAgICB9XG4gICAgdGhpcy5fYnJ1c2ggPSBfO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgcmVuZGVyQnJ1c2ggKGc6IGFueSwgZG9UcmFuc2l0aW9uOiBhbnkpIHtcbiAgICBpZiAodGhpcy5fYnJ1c2hPbikge1xuICAgICAgdGhpcy5fYnJ1c2gub24oJ3N0YXJ0IGJydXNoIGVuZCcsICgpID0+IHRoaXMuX2JydXNoaW5nKCkpO1xuXG4gICAgICAvLyBUbyByZXRyaWV2ZSBzZWxlY3Rpb24gd2UgbmVlZCBzZWxmLl9nQnJ1c2hcbiAgICAgIHRoaXMuX2dCcnVzaCA9IGcuYXBwZW5kKCdnJylcbiAgICAgICAgLmF0dHIoJ2NsYXNzJywgJ2JydXNoJylcbiAgICAgICAgLmF0dHIoJ3RyYW5zZm9ybScsIGB0cmFuc2xhdGUoJHt0aGlzLm1hcmdpbnMoKS5sZWZ0fSwke3RoaXMubWFyZ2lucygpLnRvcH0pYCk7XG5cbiAgICAgIHRoaXMuc2V0QnJ1c2hFeHRlbnRzKCk7XG5cbiAgICAgIHRoaXMuY3JlYXRlQnJ1c2hIYW5kbGVQYXRocyh0aGlzLl9nQnJ1c2gsIGRvVHJhbnNpdGlvbik7XG5cbiAgICAgIHRoaXMucmVkcmF3QnJ1c2godGhpcy5maWx0ZXIoKSwgZG9UcmFuc2l0aW9uKTtcbiAgICB9XG4gIH1cblxuICBjcmVhdGVCcnVzaEhhbmRsZVBhdGhzIChnQnJ1c2g/OiBhbnksIG9wdGlvbj86IGFueSkge1xuICAgIGxldCBicnVzaEhhbmRsZXMgPSBnQnJ1c2guc2VsZWN0QWxsKGBwYXRoLiR7Q1VTVE9NX0JSVVNIX0hBTkRMRV9DTEFTU31gKS5kYXRhKFt7dHlwZTogJ3cnfSwge3R5cGU6ICdlJ31dKTtcblxuICAgIGJydXNoSGFuZGxlcyA9IGJydXNoSGFuZGxlc1xuICAgICAgLmVudGVyKClcbiAgICAgIC5hcHBlbmQoJ3BhdGgnKVxuICAgICAgLmF0dHIoJ2NsYXNzJywgQ1VTVE9NX0JSVVNIX0hBTkRMRV9DTEFTUylcbiAgICAgIC5tZXJnZShicnVzaEhhbmRsZXMpO1xuXG4gICAgYnJ1c2hIYW5kbGVzXG4gICAgICAuYXR0cignZCcsIChkOiBhbnkpID0+IHRoaXMucmVzaXplSGFuZGxlUGF0aChkKSk7XG4gIH1cblxuICBleHRlbmRCcnVzaCAoYnJ1c2hTZWxlY3Rpb246IGFueSkge1xuICAgIGlmIChicnVzaFNlbGVjdGlvbiAmJiB0aGlzLnJvdW5kKCkpIHtcbiAgICAgIGJydXNoU2VsZWN0aW9uWzBdID0gdGhpcy5yb3VuZCgpKGJydXNoU2VsZWN0aW9uWzBdKTtcbiAgICAgIGJydXNoU2VsZWN0aW9uWzFdID0gdGhpcy5yb3VuZCgpKGJydXNoU2VsZWN0aW9uWzFdKTtcbiAgICB9XG4gICAgcmV0dXJuIGJydXNoU2VsZWN0aW9uO1xuICB9XG5cbiAgYnJ1c2hJc0VtcHR5IChicnVzaFNlbGVjdGlvbjogYW55KSB7XG4gICAgcmV0dXJuICFicnVzaFNlbGVjdGlvbiB8fCBicnVzaFNlbGVjdGlvblsxXSA8PSBicnVzaFNlbGVjdGlvblswXTtcbiAgfVxuXG4gIF9icnVzaGluZyAoKSB7XG4gICAgLy8gQXZvaWRzIGluZmluaXRlIHJlY3Vyc2lvbiAobXV0dWFsIHJlY3Vyc2lvbiBiZXR3ZWVuIHJhbmdlIGFuZCBmb2N1cyBvcGVyYXRpb25zKVxuICAgIC8vIFNvdXJjZSBFdmVudCB3aWxsIGJlIG51bGwgd2hlbiBicnVzaC5tb3ZlIGlzIGNhbGxlZCBwcm9ncmFtbWF0aWNhbGx5IChzZWUgYmVsb3cgYXMgd2VsbCkuXG4gICAgLy8gQHRzLWlnbm9yZVxuICAgIGlmICghZXZlbnQuc291cmNlRXZlbnQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBJZ25vcmUgZXZlbnQgaWYgcmVjdXJzaXZlIGV2ZW50IC0gaS5lLiBub3QgZGlyZWN0bHkgZ2VuZXJhdGVkIGJ5IHVzZXIgYWN0aW9uIChsaWtlIG1vdXNlL3RvdWNoIGV0Yy4pXG4gICAgLy8gSW4gdGhpcyBjYXNlIHdlIGFyZSBtb3JlIHdvcnJpZWQgYWJvdXQgdGhpcyBoYW5kbGVyIGNhdXNpbmcgYnJ1c2ggbW92ZSBwcm9ncmFtbWF0aWNhbGx5IHdoaWNoIHdpbGxcbiAgICAvLyBjYXVzZSB0aGlzIGhhbmRsZXIgdG8gYmUgaW52b2tlZCBhZ2FpbiB3aXRoIGEgbmV3IGQzLmV2ZW50IChhbmQgY3VycmVudCBldmVudCBzZXQgYXMgc291cmNlRXZlbnQpXG4gICAgLy8gVGhpcyBjaGVjayBhdm9pZHMgcmVjdXJzaXZlIGNhbGxzXG4gICAgLy8gQHRzLWlnbm9yZVxuICAgIGlmIChldmVudC5zb3VyY2VFdmVudC50eXBlICYmIFsnc3RhcnQnLCAnYnJ1c2gnLCAnZW5kJ10uaW5kZXhPZihldmVudC5zb3VyY2VFdmVudC50eXBlKSAhPT0gLTEpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBAdHMtaWdub3JlXG4gICAgbGV0IGJydXNoU2VsZWN0aW9uID0gZXZlbnQuc2VsZWN0aW9uO1xuICAgIGlmIChicnVzaFNlbGVjdGlvbikge1xuICAgICAgYnJ1c2hTZWxlY3Rpb24gPSBicnVzaFNlbGVjdGlvbi5tYXAodGhpcy54KCkuaW52ZXJ0KTtcbiAgICB9XG5cbiAgICBicnVzaFNlbGVjdGlvbiA9IHRoaXMuZXh0ZW5kQnJ1c2goYnJ1c2hTZWxlY3Rpb24pO1xuXG4gICAgdGhpcy5yZWRyYXdCcnVzaChicnVzaFNlbGVjdGlvbiwgZmFsc2UpO1xuXG4gICAgY29uc3QgcmFuZ2VkRmlsdGVyID0gdGhpcy5icnVzaElzRW1wdHkoYnJ1c2hTZWxlY3Rpb24pID8gbnVsbCA6IGZpbHRlcnMuUmFuZ2VkRmlsdGVyKGJydXNoU2VsZWN0aW9uWzBdLCBicnVzaFNlbGVjdGlvblsxXSk7XG5cbiAgICBldmVudHMudHJpZ2dlcigoKSA9PiB7XG4gICAgICB0aGlzLmFwcGx5QnJ1c2hTZWxlY3Rpb24ocmFuZ2VkRmlsdGVyKTtcbiAgICB9LCBjb25zdGFudHMuRVZFTlRfREVMQVkpO1xuICB9XG5cbiAgLy8gVGhpcyBjYW4gYmUgb3ZlcnJpZGRlbiBpbiBhIGRlcml2ZWQgY2hhcnQuIEZvciBleGFtcGxlIENvbXBvc2l0ZSBjaGFydCBvdmVycmlkZXMgaXRcbiAgYXBwbHlCcnVzaFNlbGVjdGlvbiAocmFuZ2VkRmlsdGVyOiBhbnkpIHtcbiAgICB0aGlzLnJlcGxhY2VGaWx0ZXIocmFuZ2VkRmlsdGVyKTtcbiAgICB0aGlzLnJlZHJhd0dyb3VwKCk7XG4gIH1cblxuICBzZXRCcnVzaEV4dGVudHMgKGRvVHJhbnNpdGlvbj86IGFueSkge1xuICAgIC8vIFNldCBib3VuZGFyaWVzIG9mIHRoZSBicnVzaCwgbXVzdCBzZXQgaXQgYmVmb3JlIGFwcGx5aW5nIHRvIHNlbGYuX2dCcnVzaFxuICAgIHRoaXMuX2JydXNoLmV4dGVudChbWzAsIDBdLCBbdGhpcy5lZmZlY3RpdmVXaWR0aCgpLCB0aGlzLmVmZmVjdGl2ZUhlaWdodCgpXV0pO1xuXG4gICAgdGhpcy5fZ0JydXNoXG4gICAgICAuY2FsbCh0aGlzLl9icnVzaCk7XG4gIH1cblxuICByZWRyYXdCcnVzaCAoYnJ1c2hTZWxlY3Rpb246IGFueSwgZG9UcmFuc2l0aW9uOiBhbnkpIHtcbiAgICBpZiAodGhpcy5fYnJ1c2hPbiAmJiB0aGlzLl9nQnJ1c2gpIHtcbiAgICAgIGlmICh0aGlzLl9yZXNpemluZykge1xuICAgICAgICB0aGlzLnNldEJydXNoRXh0ZW50cyhkb1RyYW5zaXRpb24pO1xuICAgICAgfVxuXG4gICAgICBpZiAoIWJydXNoU2VsZWN0aW9uKSB7XG4gICAgICAgIHRoaXMuX2dCcnVzaFxuICAgICAgICAgIC5jYWxsKHRoaXMuX2JydXNoLm1vdmUsIG51bGwpO1xuXG4gICAgICAgIHRoaXMuX2dCcnVzaC5zZWxlY3RBbGwoYHBhdGguJHtDVVNUT01fQlJVU0hfSEFORExFX0NMQVNTfWApXG4gICAgICAgICAgLmF0dHIoJ2Rpc3BsYXknLCAnbm9uZScpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc3Qgc2NhbGVkU2VsZWN0aW9uID0gW3RoaXMuX3goYnJ1c2hTZWxlY3Rpb25bMF0pLCB0aGlzLl94KGJydXNoU2VsZWN0aW9uWzFdKV07XG5cbiAgICAgICAgY29uc3QgZ0JydXNoID1cbiAgICAgICAgICBvcHRpb25hbFRyYW5zaXRpb24oZG9UcmFuc2l0aW9uLCB0aGlzLnRyYW5zaXRpb25EdXJhdGlvbigpLCB0aGlzLnRyYW5zaXRpb25EZWxheSgpKSh0aGlzLl9nQnJ1c2gpO1xuXG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgZ0JydXNoXG4gICAgICAgICAgLmNhbGwodGhpcy5fYnJ1c2gubW92ZSwgc2NhbGVkU2VsZWN0aW9uKTtcblxuICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgIGdCcnVzaC5zZWxlY3RBbGwoYHBhdGguJHtDVVNUT01fQlJVU0hfSEFORExFX0NMQVNTfWApXG4gICAgICAgICAgLmF0dHIoJ2Rpc3BsYXknLCBudWxsKVxuICAgICAgICAgIC5hdHRyKCd0cmFuc2Zvcm0nLCAoZDogYW55LCBpOiBhbnkpID0+IGB0cmFuc2xhdGUoJHt0aGlzLl94KGJydXNoU2VsZWN0aW9uW2ldKX0sIDApYClcbiAgICAgICAgICAuYXR0cignZCcsIChkOiBhbnkpID0+IHRoaXMucmVzaXplSGFuZGxlUGF0aChkKSk7XG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMuZmFkZURlc2VsZWN0ZWRBcmVhKGJydXNoU2VsZWN0aW9uKTtcbiAgfVxuXG4gIGZhZGVEZXNlbGVjdGVkQXJlYSAoYnJ1c2hTZWxlY3Rpb246IGFueSkge1xuICAgIC8vIGRvIG5vdGhpbmcsIHN1Yi1jaGFydCBzaG91bGQgb3ZlcnJpZGUgdGhpcyBmdW5jdGlvblxuICB9XG5cbiAgLy8gYm9ycm93ZWQgZnJvbSBDcm9zc2ZpbHRlciBleGFtcGxlXG4gIHJlc2l6ZUhhbmRsZVBhdGggKGQ6IGFueSkge1xuICAgIGQgPSBkLnR5cGU7XG4gICAgY29uc3QgZSA9ICsoZCA9PT0gJ2UnKSwgeCA9IGUgPyAxIDogLTEsIHkgPSB0aGlzLmVmZmVjdGl2ZUhlaWdodCgpIC8gMztcbiAgICByZXR1cm4gYE0kezAuNSAqIHh9LCR7eVxuICAgICAgfUE2LDYgMCAwICR7ZX0gJHs2LjUgKiB4fSwke3kgKyA2XG4gICAgICB9ViR7MiAqIHkgLSA2XG4gICAgICB9QTYsNiAwIDAgJHtlfSAkezAuNSAqIHh9LCR7MiAqIHlcbiAgICAgIH1aYCArXG4gICAgICBgTSR7Mi41ICogeH0sJHt5ICsgOFxuICAgICAgfVYkezIgKiB5IC0gOFxuICAgICAgfU0kezQuNSAqIHh9LCR7eSArIDhcbiAgICAgIH1WJHsyICogeSAtIDh9YDtcbiAgfVxuXG4gIF9nZXRDbGlwUGF0aElkICgpIHtcbiAgICByZXR1cm4gYCR7dGhpcy5hbmNob3JOYW1lKCkucmVwbGFjZSgvWyAuIz1cXFtcXF1cIl0vZywgJy0nKX0tY2xpcGA7XG4gIH1cblxuICBjbGlwUGFkZGluZyAocGFkZGluZz86IGFueSkge1xuICAgIGlmIChwYWRkaW5nID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybiB0aGlzLl9jbGlwUGFkZGluZztcbiAgICB9XG4gICAgdGhpcy5fY2xpcFBhZGRpbmcgPSBwYWRkaW5nO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgX2dlbmVyYXRlQ2xpcFBhdGggKCkge1xuICAgIC8vIEB0cy1pZ25vcmVcbiAgICBjb25zdCBkZWZzID0gdXRpbHMuYXBwZW5kT3JTZWxlY3QodGhpcy5fcGFyZW50LCAnZGVmcycpO1xuICAgIC8vIGNhbm5vdCBzZWxlY3QgPGNsaXBwYXRoPiBlbGVtZW50czsgYnVnIGluIFdlYktpdCwgbXVzdCBzZWxlY3QgYnkgaWRcbiAgICAvLyBodHRwczovL2dyb3Vwcy5nb29nbGUuY29tL2ZvcnVtLyMhdG9waWMvZDMtanMvNkVwQXpRMmdVOUlcbiAgICBjb25zdCBpZCA9IHRoaXMuX2dldENsaXBQYXRoSWQoKTtcbiAgICBjb25zdCBjaGFydEJvZHlDbGlwID0gdXRpbHMuYXBwZW5kT3JTZWxlY3QoZGVmcywgYCMke2lkfWAsICdjbGlwUGF0aCcpLmF0dHIoJ2lkJywgaWQpO1xuXG4gICAgY29uc3QgcGFkZGluZyA9IHRoaXMuX2NsaXBQYWRkaW5nICogMjtcblxuICAgIC8vIEB0cy1pZ25vcmVcbiAgICB1dGlscy5hcHBlbmRPclNlbGVjdChjaGFydEJvZHlDbGlwLCAncmVjdCcpXG4gICAgICAuYXR0cignd2lkdGgnLCB0aGlzLnhBeGlzTGVuZ3RoKCkgKyBwYWRkaW5nKVxuICAgICAgLmF0dHIoJ2hlaWdodCcsIHRoaXMueUF4aXNIZWlnaHQoKSArIHBhZGRpbmcpXG4gICAgICAuYXR0cigndHJhbnNmb3JtJywgYHRyYW5zbGF0ZSgtJHt0aGlzLl9jbGlwUGFkZGluZ30sIC0ke3RoaXMuX2NsaXBQYWRkaW5nfSlgKTtcbiAgfVxuXG4gIF9wcmVwcm9jZXNzRGF0YSAoKSB7XG4gIH1cblxuICBfZG9SZW5kZXIgKCkge1xuICAgIHRoaXMucmVzZXRTdmcoKTtcblxuICAgIHRoaXMuX3ByZXByb2Nlc3NEYXRhKCk7XG5cbiAgICB0aGlzLl9nZW5lcmF0ZUcoKTtcbiAgICB0aGlzLl9nZW5lcmF0ZUNsaXBQYXRoKCk7XG5cbiAgICB0aGlzLl9kcmF3Q2hhcnQodHJ1ZSk7XG5cbiAgICB0aGlzLl9jb25maWd1cmVNb3VzZVpvb20oKTtcblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgX2RvUmVkcmF3ICgpIHtcbiAgICB0aGlzLl9wcmVwcm9jZXNzRGF0YSgpO1xuXG4gICAgdGhpcy5fZHJhd0NoYXJ0KGZhbHNlKTtcbiAgICB0aGlzLl9nZW5lcmF0ZUNsaXBQYXRoKCk7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIF9kcmF3Q2hhcnQgKHJlbmRlcjogYW55KSB7XG4gICAgaWYgKHRoaXMuaXNPcmRpbmFsKCkpIHtcbiAgICAgIHRoaXMuX2JydXNoT24gPSBmYWxzZTtcbiAgICB9XG5cbiAgICB0aGlzLl9wcmVwYXJlWEF4aXModGhpcy5nKCksIHJlbmRlcik7XG4gICAgdGhpcy5fcHJlcGFyZVlBeGlzKHRoaXMuZygpKTtcblxuICAgIHRoaXNbJ3Bsb3REYXRhJ10oKTtcblxuICAgIGlmICh0aGlzLmVsYXN0aWNYKCkgfHwgdGhpcy5fcmVzaXppbmcgfHwgcmVuZGVyKSB7XG4gICAgICB0aGlzLnJlbmRlclhBeGlzKHRoaXMuZygpKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5lbGFzdGljWSgpIHx8IHRoaXMuX3Jlc2l6aW5nIHx8IHJlbmRlcikge1xuICAgICAgdGhpcy5yZW5kZXJZQXhpcyh0aGlzLmcoKSk7XG4gICAgfVxuXG4gICAgaWYgKHJlbmRlcikge1xuICAgICAgdGhpcy5yZW5kZXJCcnVzaCh0aGlzLmcoKSwgZmFsc2UpO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBBbmltYXRlIHRoZSBicnVzaCBvbmx5IHdoaWxlIHJlc2l6aW5nXG4gICAgICB0aGlzLnJlZHJhd0JydXNoKHRoaXMuZmlsdGVyKCksIHRoaXMuX3Jlc2l6aW5nKTtcbiAgICB9XG4gICAgdGhpcy5mYWRlRGVzZWxlY3RlZEFyZWEodGhpcy5maWx0ZXIoKSk7XG4gICAgdGhpcy5yZXNpemluZyhmYWxzZSk7XG4gIH1cblxuICBfY29uZmlndXJlTW91c2Vab29tICgpIHtcbiAgICAvLyBTYXZlIGEgY29weSBvZiBvcmlnaW5hbCB4IHNjYWxlXG4gICAgdGhpcy5fb3JpZ1ggPSB0aGlzLl94LmNvcHkoKTtcblxuICAgIGlmICh0aGlzLl9tb3VzZVpvb21hYmxlKSB7XG4gICAgICB0aGlzLl9lbmFibGVNb3VzZVpvb20oKTtcbiAgICB9IGVsc2UgaWYgKHRoaXMuX2hhc0JlZW5Nb3VzZVpvb21hYmxlKSB7XG4gICAgICB0aGlzLl9kaXNhYmxlTW91c2Vab29tKCk7XG4gICAgfVxuICB9XG5cbiAgX2VuYWJsZU1vdXNlWm9vbSAoKSB7XG4gICAgdGhpcy5faGFzQmVlbk1vdXNlWm9vbWFibGUgPSB0cnVlO1xuXG4gICAgY29uc3QgZXh0ZW50ID0gW1swLCAwXSwgW3RoaXMuZWZmZWN0aXZlV2lkdGgoKSwgdGhpcy5lZmZlY3RpdmVIZWlnaHQoKV1dO1xuXG4gICAgdGhpcy5fem9vbVxuICAgICAgLnNjYWxlRXh0ZW50KHRoaXMuX3pvb21TY2FsZSlcbiAgICAgIC5leHRlbnQoZXh0ZW50KVxuICAgICAgLmR1cmF0aW9uKHRoaXMudHJhbnNpdGlvbkR1cmF0aW9uKCkpO1xuXG4gICAgaWYgKHRoaXMuX3pvb21PdXRSZXN0cmljdCkge1xuICAgICAgLy8gRW5zdXJlIG1pbmltdW0gem9vbVNjYWxlIGlzIGF0IGxlYXN0IDFcbiAgICAgIGNvbnN0IHpvb21TY2FsZU1pbiA9IE1hdGgubWF4KHRoaXMuX3pvb21TY2FsZVswXSwgMSk7XG4gICAgICB0aGlzLl96b29tXG4gICAgICAgIC50cmFuc2xhdGVFeHRlbnQoZXh0ZW50KVxuICAgICAgICAuc2NhbGVFeHRlbnQoW3pvb21TY2FsZU1pbiwgdGhpcy5fem9vbVNjYWxlWzFdXSk7XG4gICAgfVxuXG4gICAgdGhpcy5yb290KCkuY2FsbCh0aGlzLl96b29tKTtcblxuICAgIC8vIFRlbGwgRDMgem9vbSBvdXIgY3VycmVudCB6b29tL3BhbiBzdGF0dXNcbiAgICB0aGlzLl91cGRhdGVEM3pvb21UcmFuc2Zvcm0oKTtcbiAgfVxuXG4gIF9kaXNhYmxlTW91c2Vab29tICgpIHtcbiAgICB0aGlzLnJvb3QoKS5jYWxsKHRoaXMuX251bGxab29tKTtcbiAgfVxuXG4gIF96b29tSGFuZGxlciAobmV3RG9tYWluOiBhbnksIG5vUmFpc2VFdmVudHM6IGFueSkge1xuICAgIGxldCBkb21GaWx0ZXI6IGFueTtcblxuICAgIGlmICh0aGlzLl9oYXNSYW5nZVNlbGVjdGVkKG5ld0RvbWFpbikpIHtcbiAgICAgIHRoaXMueCgpLmRvbWFpbihuZXdEb21haW4pO1xuICAgICAgZG9tRmlsdGVyID0gZmlsdGVycy5SYW5nZWRGaWx0ZXIobmV3RG9tYWluWzBdLCBuZXdEb21haW5bMV0pO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLngoKS5kb21haW4odGhpcy5feE9yaWdpbmFsRG9tYWluKTtcbiAgICAgIGRvbUZpbHRlciA9IG51bGw7XG4gICAgfVxuXG4gICAgdGhpcy5yZXBsYWNlRmlsdGVyKGRvbUZpbHRlcik7XG4gICAgdGhpcy5yZXNjYWxlKCk7XG4gICAgdGhpcy5yZWRyYXcoKTtcblxuICAgIGlmICghbm9SYWlzZUV2ZW50cykge1xuICAgICAgaWYgKHRoaXMuX3JhbmdlQ2hhcnQgJiYgIXV0aWxzLmFycmF5c0VxdWFsKHRoaXMuZmlsdGVyKCksIHRoaXMuX3JhbmdlQ2hhcnQuZmlsdGVyKCkpKSB7XG4gICAgICAgIGV2ZW50cy50cmlnZ2VyKCgpID0+IHtcbiAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgdGhpcy5fcmFuZ2VDaGFydC5yZXBsYWNlRmlsdGVyKGRvbUZpbHRlcik7XG4gICAgICAgICAgdGhpcy5fcmFuZ2VDaGFydC5yZWRyYXcoKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIHRoaXMuX2ludm9rZVpvb21lZExpc3RlbmVyKCk7XG4gICAgICBldmVudHMudHJpZ2dlcigoKSA9PiB7XG4gICAgICAgIHRoaXMucmVkcmF3R3JvdXAoKTtcbiAgICAgIH0sIGNvbnN0YW50cy5FVkVOVF9ERUxBWSk7XG4gICAgfVxuICB9XG5cbiAgLy8gZXZlbnQudHJhbnNmb3JtLnJlc2NhbGVYKHNlbGYuX29yaWdYKS5kb21haW4oKSBzaG91bGQgZ2l2ZSBiYWNrIG5ld0RvbWFpblxuICBfZG9tYWluVG9ab29tVHJhbnNmb3JtIChuZXdEb21haW46IGFueSwgb3JpZ0RvbWFpbjogYW55LCB4U2NhbGU6IGFueSkge1xuICAgIGNvbnN0IGsgPSAob3JpZ0RvbWFpblsxXSAtIG9yaWdEb21haW5bMF0pIC8gKG5ld0RvbWFpblsxXSAtIG5ld0RvbWFpblswXSk7XG4gICAgY29uc3QgeHQgPSAtMSAqIHhTY2FsZShuZXdEb21haW5bMF0pO1xuXG4gICAgcmV0dXJuIHpvb21JZGVudGl0eS5zY2FsZShrKS50cmFuc2xhdGUoeHQsIDApO1xuICB9XG5cbiAgLy8gSWYgd2UgY2hhbmdpbmcgem9vbSBzdGF0dXMgKGZvciBleGFtcGxlIGJ5IGNhbGxpbmcgZm9jdXMpLCB0ZWxsIEQzIHpvb20gYWJvdXQgaXRcbiAgX3VwZGF0ZUQzem9vbVRyYW5zZm9ybSAoKSB7XG4gICAgaWYgKHRoaXMuX3pvb20pIHtcbiAgICAgIHRoaXMuX3pvb20udHJhbnNmb3JtKHRoaXMucm9vdCgpLCB0aGlzLl9kb21haW5Ub1pvb21UcmFuc2Zvcm0odGhpcy54KCkuZG9tYWluKCksIHRoaXMuX3hPcmlnaW5hbERvbWFpbiwgdGhpcy5fb3JpZ1gpKTtcbiAgICB9XG4gIH1cblxuICBfb25ab29tICgpIHtcbiAgICAvLyBBdm9pZHMgaW5maW5pdGUgcmVjdXJzaW9uIChtdXR1YWwgcmVjdXJzaW9uIGJldHdlZW4gcmFuZ2UgYW5kIGZvY3VzIG9wZXJhdGlvbnMpXG4gICAgLy8gU291cmNlIEV2ZW50IHdpbGwgYmUgbnVsbCB3aGVuIHpvb20gaXMgY2FsbGVkIHByb2dyYW1tYXRpY2FsbHkgKHNlZSBiZWxvdyBhcyB3ZWxsKS5cbiAgICAvLyBAdHMtaWdub3JlXG4gICAgaWYgKCFldmVudC5zb3VyY2VFdmVudCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIElnbm9yZSBldmVudCBpZiByZWN1cnNpdmUgZXZlbnQgLSBpLmUuIG5vdCBkaXJlY3RseSBnZW5lcmF0ZWQgYnkgdXNlciBhY3Rpb24gKGxpa2UgbW91c2UvdG91Y2ggZXRjLilcbiAgICAvLyBJbiB0aGlzIGNhc2Ugd2UgYXJlIG1vcmUgd29ycmllZCBhYm91dCB0aGlzIGhhbmRsZXIgY2F1c2luZyB6b29tIHByb2dyYW1tYXRpY2FsbHkgd2hpY2ggd2lsbFxuICAgIC8vIGNhdXNlIHRoaXMgaGFuZGxlciB0byBiZSBpbnZva2VkIGFnYWluIHdpdGggYSBuZXcgZDMuZXZlbnQgKGFuZCBjdXJyZW50IGV2ZW50IHNldCBhcyBzb3VyY2VFdmVudClcbiAgICAvLyBUaGlzIGNoZWNrIGF2b2lkcyByZWN1cnNpdmUgY2FsbHNcbiAgICAvLyBAdHMtaWdub3JlXG4gICAgaWYgKGV2ZW50LnNvdXJjZUV2ZW50LnR5cGUgJiYgWydzdGFydCcsICd6b29tJywgJ2VuZCddLmluZGV4T2YoZXZlbnQuc291cmNlRXZlbnQudHlwZSkgIT09IC0xKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gQHRzLWlnbm9yZVxuICAgIGNvbnN0IG5ld0RvbWFpbiA9IGV2ZW50LnRyYW5zZm9ybS5yZXNjYWxlWCh0aGlzLl9vcmlnWCkuZG9tYWluKCk7XG4gICAgdGhpcy5mb2N1cyhuZXdEb21haW4sIGZhbHNlKTtcbiAgfVxuXG4gIF9jaGVja0V4dGVudHMgKGV4dDogYW55LCBvdXRlckxpbWl0czogYW55KSB7XG4gICAgaWYgKCFleHQgfHwgZXh0Lmxlbmd0aCAhPT0gMiB8fCAhb3V0ZXJMaW1pdHMgfHwgb3V0ZXJMaW1pdHMubGVuZ3RoICE9PSAyKSB7XG4gICAgICByZXR1cm4gZXh0O1xuICAgIH1cblxuICAgIGlmIChleHRbMF0gPiBvdXRlckxpbWl0c1sxXSB8fCBleHRbMV0gPCBvdXRlckxpbWl0c1swXSkge1xuICAgICAgY29uc29sZS53YXJuKCdDb3VsZCBub3QgaW50ZXJzZWN0IGV4dGVudHMsIHdpbGwgcmVzZXQnKTtcbiAgICB9XG4gICAgLy8gTWF0aC5tYXggZG9lcyBub3Qgd29yayAoYXMgdGhlIHZhbHVlcyBtYXkgYmUgZGF0ZXMgYXMgd2VsbClcbiAgICByZXR1cm4gW2V4dFswXSA+IG91dGVyTGltaXRzWzBdID8gZXh0WzBdIDogb3V0ZXJMaW1pdHNbMF0sIGV4dFsxXSA8IG91dGVyTGltaXRzWzFdID8gZXh0WzFdIDogb3V0ZXJMaW1pdHNbMV1dO1xuICB9XG5cbiAgZm9jdXMgKHJhbmdlOiBhbnksIG5vUmFpc2VFdmVudHM6IGFueSkge1xuICAgIGlmICh0aGlzLl96b29tT3V0UmVzdHJpY3QpIHtcbiAgICAgIC8vIGVuc3VyZSByYW5nZSBpcyB3aXRoaW4gc2VsZi5feE9yaWdpbmFsRG9tYWluXG4gICAgICByYW5nZSA9IHRoaXMuX2NoZWNrRXh0ZW50cyhyYW5nZSwgdGhpcy5feE9yaWdpbmFsRG9tYWluKTtcblxuICAgICAgLy8gSWYgaXQgaGFzIGFuIGFzc29jaWF0ZWQgcmFuZ2UgY2hhcnQgZW5zdXJlIHJhbmdlIGlzIHdpdGhpbiBkb21haW4gb2YgdGhhdCByYW5nZUNoYXJ0XG4gICAgICBpZiAodGhpcy5fcmFuZ2VDaGFydCkge1xuICAgICAgICByYW5nZSA9IHRoaXMuX2NoZWNrRXh0ZW50cyhyYW5nZSwgdGhpcy5fcmFuZ2VDaGFydC54KCkuZG9tYWluKCkpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMuX3pvb21IYW5kbGVyKHJhbmdlLCBub1JhaXNlRXZlbnRzKTtcbiAgICB0aGlzLl91cGRhdGVEM3pvb21UcmFuc2Zvcm0oKTtcbiAgfVxuXG4gIHJlZm9jdXNlZCAoKSB7XG4gICAgcmV0dXJuICF1dGlscy5hcnJheXNFcXVhbCh0aGlzLngoKS5kb21haW4oKSwgdGhpcy5feE9yaWdpbmFsRG9tYWluKTtcbiAgfVxuXG4gIGZvY3VzQ2hhcnQgKGM/OiBhbnkpIHtcbiAgICBpZiAoYyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm4gdGhpcy5fZm9jdXNDaGFydDtcbiAgICB9XG4gICAgdGhpcy5fZm9jdXNDaGFydCA9IGM7XG4gICAgdGhpcy5vbignZmlsdGVyZWQuZGNqcy1yYW5nZS1jaGFydCcsIChjaGFydDogYW55KSA9PiB7XG4gICAgICBpZiAoIWNoYXJ0LmZpbHRlcigpKSB7XG4gICAgICAgIGV2ZW50cy50cmlnZ2VyKCgpID0+IHtcbiAgICAgICAgICB0aGlzLl9mb2N1c0NoYXJ0LngoKS5kb21haW4odGhpcy5fZm9jdXNDaGFydC54T3JpZ2luYWxEb21haW4oKSwgdHJ1ZSk7XG4gICAgICAgIH0pO1xuICAgICAgfSBlbHNlIGlmICghdXRpbHMuYXJyYXlzRXF1YWwoY2hhcnQuZmlsdGVyKCksIHRoaXMuX2ZvY3VzQ2hhcnQuZmlsdGVyKCkpKSB7XG4gICAgICAgIGV2ZW50cy50cmlnZ2VyKCgpID0+IHtcbiAgICAgICAgICB0aGlzLl9mb2N1c0NoYXJ0LmZvY3VzKGNoYXJ0LmZpbHRlcigpLCB0cnVlKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBicnVzaE9uIChicnVzaE9uPzogYW55KSB7XG4gICAgaWYgKGJydXNoT24gPT09IHVuZGVmaW5lZCkge1xuICAgICAgcmV0dXJuIHRoaXMuX2JydXNoT247XG4gICAgfVxuICAgIHRoaXMuX2JydXNoT24gPSBicnVzaE9uO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgcGFyZW50QnJ1c2hPbiAoYnJ1c2hPbj86IGFueSkge1xuICAgIGlmIChicnVzaE9uID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybiB0aGlzLl9wYXJlbnRCcnVzaE9uO1xuICAgIH1cbiAgICB0aGlzLl9wYXJlbnRCcnVzaE9uID0gYnJ1c2hPbjtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8vIEdldCB0aGUgU1ZHIHJlbmRlcmVkIGJydXNoXG4gIGdCcnVzaCAoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2dCcnVzaDtcbiAgfVxuXG4gIF9oYXNSYW5nZVNlbGVjdGVkIChyYW5nZTogYW55KSB7XG4gICAgcmV0dXJuIHJhbmdlIGluc3RhbmNlb2YgQXJyYXkgJiYgcmFuZ2UubGVuZ3RoID4gMTtcbiAgfVxufVxuIl19