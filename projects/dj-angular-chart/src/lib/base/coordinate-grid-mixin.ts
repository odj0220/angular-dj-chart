import {schemeCategory10} from 'd3-scale-chromatic';
import {timeDay} from 'd3-time';
import {max, min} from 'd3-array';
import {scaleBand, scaleLinear, scaleOrdinal} from 'd3-scale';
import {axisBottom, axisLeft, axisRight} from 'd3-axis';
import {zoom, zoomIdentity} from 'd3-zoom';
import {brushX} from 'd3-brush';
import {optionalTransition, units, utils, logger, filters, events, transition} from 'dc';
import {ColorMixin} from './color-mixin';
import {MarginMixin} from './margin-mixin';

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

  on: any;
  svg: any;
  root: any;
  data: any;
  width: any;
  height: any;
  redraw: any;
  colors: any;
  margins: any;
  anchorName: any;
  keyAccessor: any;
  valueAccessor: any;
  effectiveWidth: any;
  effectiveHeight: any;
  transitionDelay: any;
  transitionDuration: any;
  replaceFilter: any;
  redrawGroup: any;
  resetSvg: any;

  _invokeZoomedListener: any;
  _computeOrderedGroups: any;
  _mandatoryAttributes: any;
  _parent: any;
  _g: any;
  _chartBodyG: any;
  _x: any;
  _origX: any;
  _xOriginalDomain: any;
  _xAxis: any;
  _xUnits: any;
  _xAxisPadding: any;
  _xAxisPaddingUnit: any;
  _xElasticity: any;
  _xAxisLabel: any;
  _xAxisLabelPadding: any;
  _lastXDomain: any;
  _y: any;
  _yAxis: any;
  _yAxisPadding: any;
  _yElasticity: any;
  _yAxisLabel: any;
  _yAxisLabelPadding: any;
  _brush: any;
  _gBrush: any;
  _brushOn: any;
  _parentBrushOn: any;
  _round: any;
  _renderHorizontalGridLine: any;
  _renderVerticalGridLine: any;
  _resizing: any;
  _unitCount: any;
  _zoomScale: any;
  _zoomOutRestrict: any;
  _zoom: any;
  _nullZoom: any;
  _hasBeenMouseZoomable: any;
  _rangeChart: any;
  _focusChart: any;
  _mouseZoomable: any;
  _clipPadding: any;
  _fOuterRangeBandPadding: any;
  _fRangeBandPadding: any;
  _useRightYAxis: any;

  constructor () {
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

  rescale () {
    this._unitCount = undefined;
    this._resizing = true;
    return this;
  }

  resizing (resizing?: any) {
    if (resizing === undefined) {
      return this._resizing;
    }
    this._resizing = resizing;
    return this;
  }

  rangeChart (rangeChart?: any) {
    if (rangeChart === undefined) {
      return this._rangeChart;
    }
    this._rangeChart = rangeChart;
    this._rangeChart.focusChart(this);
    return this;
  }

  zoomScale (extent?: any) {
    if (extent === undefined) {
      return this._zoomScale;
    }
    this._zoomScale = extent;
    return this;
  }

  zoomOutRestrict (zoomOutRestrict?: any) {
    if (zoomOutRestrict === undefined) {
      return this._zoomOutRestrict;
    }
    this._zoomOutRestrict = zoomOutRestrict;
    return this;
  }

  _generateG (parent?: any) {
    if (parent === undefined) {
      this._parent = this.svg();
    } else {
      this._parent = parent;
    }

    const href = window.location.href.split('#')[0];

    this._g = this._parent.append('g');

    this._chartBodyG = this._g.append('g').attr('class', 'chart-body')
      .attr('transform', `translate(${this.margins().left}, ${this.margins().top})`)
      .attr('clip-path', `url(${href}#${this._getClipPathId()})`);

    return this._g;
  }

  g (gElement?: any) {
    if (gElement === undefined) {
      return this._g;
    }
    this._g = gElement;
    return this;
  }

  mouseZoomable (mouseZoomable?: any) {
    if (mouseZoomable === undefined) {
      return this._mouseZoomable;
    }
    this._mouseZoomable = mouseZoomable;
    return this;
  }

  chartBodyG (chartBodyG?: any) {
    if (chartBodyG === undefined) {
      return this._chartBodyG;
    }
    this._chartBodyG = chartBodyG;
    return this;
  }

  x (xScale?: any) {
    if (xScale === undefined) {
      return this._x;
    }
    this._x = xScale;
    this._xOriginalDomain = this._x.domain();
    this.rescale();
    return this;
  }

  xOriginalDomain () {
    return this._xOriginalDomain;
  }

  xUnits (xUnits?: any) {
    if (xUnits === undefined) {
      return this._xUnits;
    }
    this._xUnits = xUnits;
    return this;
  }

  xAxis (xAxis?: any) {
    if (xAxis === undefined) {
      return this._xAxis;
    }
    this._xAxis = xAxis;
    return this;
  }

  elasticX (elasticX?: any) {
    if (elasticX === undefined) {
      return this._xElasticity;
    }
    this._xElasticity = elasticX;
    return this;
  }

  xAxisPadding (padding?: any) {
    if (padding === undefined) {
      return this._xAxisPadding;
    }
    this._xAxisPadding = padding;
    return this;
  }

  xAxisPaddingUnit (unit?: any) {
    if (unit === undefined) {
      return this._xAxisPaddingUnit;
    }
    this._xAxisPaddingUnit = unit;
    return this;
  }

  xUnitCount () {
    if (this._unitCount === undefined) {
      if (this.isOrdinal()) {
        // In this case it number of items in domain
        this._unitCount = this.x().domain().length;
      } else {
        this._unitCount = this.xUnits()(this.x().domain()[0], this.x().domain()[1]);

        // Sometimes xUnits() may return an array while sometimes directly the count
        if (this._unitCount instanceof Array) {
          this._unitCount = this._unitCount.length;
        }
      }
    }

    return this._unitCount;
  }

  useRightYAxis (useRightYAxis?: any) {
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

  isOrdinal () {
    return this.xUnits() === units.ordinal;
  }

  _useOuterPadding () {
    return true;
  }

  _ordinalXDomain () {
    const groups = this._computeOrderedGroups(this.data());
    return groups.map(this.keyAccessor());
  }

  _prepareXAxis (g: any, render: any) {
    if (!this.isOrdinal()) {
      if (this.elasticX()) {
        this._x.domain([this.xAxisMin(), this.xAxisMax()]);
      }
    } else { // self._chart.isOrdinal()
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
    } else {
      this._x.range([0, this.xAxisLength()]);
    }

    this._xAxis = this._xAxis.scale(this.x());

    this._renderVerticalGridLines(g);
  }

  renderXAxis (g: any) {
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
        .attr('transform', `translate(${this.margins().left + this.xAxisLength() / 2},${
          this.height() - this._xAxisLabelPadding})`)
        .attr('text-anchor', 'middle');
    }
    if (this.xAxisLabel() && axisXLab.text() !== this.xAxisLabel()) {
      axisXLab.text(this.xAxisLabel());
    }

    transition(axisXG, this.transitionDuration(), this.transitionDelay())
      .attr('transform', `translate(${this.margins().left},${this._xAxisY()})`)
      .call(this._xAxis);
    transition(axisXLab, this.transitionDuration(), this.transitionDelay())
      .attr('transform', `translate(${this.margins().left + this.xAxisLength() / 2},${
        this.height() - this._xAxisLabelPadding})`);
  }

  _renderVerticalGridLines (g: any) {
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
        .attr('x1', (d: any) => this._x(d))
        .attr('y1', this._xAxisY() - this.margins().top)
        .attr('x2', (d: any) => this._x(d))
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
    } else {
      gridLineG.selectAll('line').remove();
    }
  }

  _xAxisY () {
    return (this.height() - this.margins().bottom);
  }

  xAxisLength () {
    return this.effectiveWidth();
  }

  xAxisLabel (labelText?: any, padding?: any) {
    if (labelText === undefined) {
      return this._xAxisLabel;
    }
    this._xAxisLabel = labelText;
    this.margins().bottom -= this._xAxisLabelPadding;
    this._xAxisLabelPadding = (padding === undefined) ? DEFAULT_AXIS_LABEL_PADDING : padding;
    this.margins().bottom += this._xAxisLabelPadding;
    return this;
  }

  _createYAxis () {
    // @ts-ignore
    return this._useRightYAxis ? axisRight() : axisLeft();
  }

  _prepareYAxis (g: any) {
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

  renderYAxisLabel (axisClass?: any, text?: any, rotation?: any, labelXPosition?: any) {
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

  renderYAxisAt (axisClass: any, axis: any, position: any) {
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

  renderYAxis (g?: any) {
    const axisPosition = this._useRightYAxis ? (this.width() - this.margins().right) : this._yAxisX();
    this.renderYAxisAt('y', this._yAxis, axisPosition);
    const labelPosition = this._useRightYAxis ? (this.width() - this._yAxisLabelPadding) : this._yAxisLabelPadding;
    const rotation = this._useRightYAxis ? 90 : -90;
    this.renderYAxisLabel('y', this.yAxisLabel(), rotation, labelPosition);
  }

  _renderHorizontalGridLinesForAxis (g: any, scale: any, axis: any) {
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
        .attr('y1', (d: any) => scale(d))
        .attr('x2', this.xAxisLength())
        .attr('y2', (d: any) => scale(d))
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
    } else {
      gridLineG.selectAll('line').remove();
    }
  }

  _yAxisX () {
    return this.useRightYAxis() ? this.width() - this.margins().right : this.margins().left;
  }

  yAxisLabel (labelText?: any, padding?: any) {
    if (labelText === undefined) {
      return this._yAxisLabel;
    }
    this._yAxisLabel = labelText;
    this.margins().left -= this._yAxisLabelPadding;
    this._yAxisLabelPadding = (padding === undefined) ? DEFAULT_AXIS_LABEL_PADDING : padding;
    this.margins().left += this._yAxisLabelPadding;
    return this;
  }

  y (yScale?: any) {
    if (yScale === undefined) {
      return this._y;
    }
    this._y = yScale;
    this.rescale();
    return this;
  }

  yAxis (yAxis?: any) {
    if (yAxis === undefined) {
      if (!this._yAxis) {
        this._yAxis = this._createYAxis();
      }
      return this._yAxis;
    }
    this._yAxis = yAxis;
    return this;
  }

  elasticY (elasticY?: any) {
    if (elasticY === undefined) {
      return this._yElasticity;
    }
    this._yElasticity = elasticY;
    return this;
  }

  renderHorizontalGridLines (renderHorizontalGridLines?: any) {
    if (renderHorizontalGridLines === undefined) {
      return this._renderHorizontalGridLine;
    }
    this._renderHorizontalGridLine = renderHorizontalGridLines;
    return this;
  }

  renderVerticalGridLines (renderVerticalGridLines?: any) {
    if (renderVerticalGridLines === undefined) {
      return this._renderVerticalGridLine;
    }
    this._renderVerticalGridLine = renderVerticalGridLines;
    return this;
  }

  xAxisMin () {
    const m = min(this.data(), e => this.keyAccessor()(e));
    // @ts-ignore
    return utils.subtract(m, this._xAxisPadding, this._xAxisPaddingUnit);
  }

  xAxisMax () {
    const m = max(this.data(), e => this.keyAccessor()(e));
    // @ts-ignore
    return utils.add(m, this._xAxisPadding, this._xAxisPaddingUnit);
  }

  yAxisMin () {
    const m = min(this.data(), e => this.valueAccessor()(e));
    // @ts-ignore
    return utils.subtract(m, this._yAxisPadding);
  }

  yAxisMax () {
    const m = max(this.data(), e => this.valueAccessor()(e));
    // @ts-ignore
    return utils.add(m, this._yAxisPadding);
  }

  yAxisPadding (padding?: any) {
    if (padding === undefined) {
      return this._yAxisPadding;
    }
    this._yAxisPadding = padding;
    return this;
  }

  yAxisHeight () {
    return this.effectiveHeight();
  }

  round (round?: any) {
    if (round === undefined) {
      return this._round;
    }
    this._round = round;
    return this;
  }

  _rangeBandPadding (_?: any) {
    if (_ === undefined) {
      return this._fRangeBandPadding;
    }
    this._fRangeBandPadding = _;
    return this;
  }

  _outerRangeBandPadding (_?: any) {
    if (_ === undefined) {
      return this._fOuterRangeBandPadding;
    }
    this._fOuterRangeBandPadding = _;
    return this;
  }

  filter (_?: any) {
    if (_ === undefined) {
      return super.filter();
    }

    super.filter(_);

    this.redrawBrush(_, false);

    return this;
  }

  brush (_?: any) {
    if (_ === undefined) {
      return this._brush;
    }
    this._brush = _;
    return this;
  }

  renderBrush (g: any, doTransition: any) {
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

  createBrushHandlePaths (gBrush?: any, option?: any) {
    let brushHandles = gBrush.selectAll(`path.${CUSTOM_BRUSH_HANDLE_CLASS}`).data([{type: 'w'}, {type: 'e'}]);

    brushHandles = brushHandles
      .enter()
      .append('path')
      .attr('class', CUSTOM_BRUSH_HANDLE_CLASS)
      .merge(brushHandles);

    brushHandles
      .attr('d', (d: any) => this.resizeHandlePath(d));
  }

  extendBrush (brushSelection: any) {
    if (brushSelection && this.round()) {
      brushSelection[0] = this.round()(brushSelection[0]);
      brushSelection[1] = this.round()(brushSelection[1]);
    }
    return brushSelection;
  }

  brushIsEmpty (brushSelection: any) {
    return !brushSelection || brushSelection[1] <= brushSelection[0];
  }

  _brushing () {
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
  applyBrushSelection (rangedFilter: any) {
    this.replaceFilter(rangedFilter);
    this.redrawGroup();
  }

  setBrushExtents (doTransition?: any) {
    // Set boundaries of the brush, must set it before applying to self._gBrush
    this._brush.extent([[0, 0], [this.effectiveWidth(), this.effectiveHeight()]]);

    this._gBrush
      .call(this._brush);
  }

  redrawBrush (brushSelection: any, doTransition: any) {
    if (this._brushOn && this._gBrush) {
      if (this._resizing) {
        this.setBrushExtents(doTransition);
      }

      if (!brushSelection) {
        this._gBrush
          .call(this._brush.move, null);

        this._gBrush.selectAll(`path.${CUSTOM_BRUSH_HANDLE_CLASS}`)
          .attr('display', 'none');
      } else {
        const scaledSelection = [this._x(brushSelection[0]), this._x(brushSelection[1])];

        const gBrush =
          optionalTransition(doTransition, this.transitionDuration(), this.transitionDelay())(this._gBrush);

        // @ts-ignore
        gBrush
          .call(this._brush.move, scaledSelection);

        // @ts-ignore
        gBrush.selectAll(`path.${CUSTOM_BRUSH_HANDLE_CLASS}`)
          .attr('display', null)
          .attr('transform', (d: any, i: any) => `translate(${this._x(brushSelection[i])}, 0)`)
          .attr('d', (d: any) => this.resizeHandlePath(d));
      }
    }
    this.fadeDeselectedArea(brushSelection);
  }

  fadeDeselectedArea (brushSelection: any) {
    // do nothing, sub-chart should override this function
  }

  // borrowed from Crossfilter example
  resizeHandlePath (d: any) {
    d = d.type;
    const e = +(d === 'e'), x = e ? 1 : -1, y = this.effectiveHeight() / 3;
    return `M${0.5 * x},${y
      }A6,6 0 0 ${e} ${6.5 * x},${y + 6
      }V${2 * y - 6
      }A6,6 0 0 ${e} ${0.5 * x},${2 * y
      }Z` +
      `M${2.5 * x},${y + 8
      }V${2 * y - 8
      }M${4.5 * x},${y + 8
      }V${2 * y - 8}`;
  }

  _getClipPathId () {
    return `${this.anchorName().replace(/[ .#=\[\]"]/g, '-')}-clip`;
  }

  clipPadding (padding?: any) {
    if (padding === undefined) {
      return this._clipPadding;
    }
    this._clipPadding = padding;
    return this;
  }

  _generateClipPath () {
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

  _preprocessData () {
  }

  _doRender () {
    this.resetSvg();

    this._preprocessData();

    this._generateG();
    this._generateClipPath();

    this._drawChart(true);

    this._configureMouseZoom();

    return this;
  }

  _doRedraw () {
    this._preprocessData();

    this._drawChart(false);
    this._generateClipPath();

    return this;
  }

  _drawChart (render: any) {
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
    } else {
      // Animate the brush only while resizing
      this.redrawBrush(this.filter(), this._resizing);
    }
    this.fadeDeselectedArea(this.filter());
    this.resizing(false);
  }

  _configureMouseZoom () {
    // Save a copy of original x scale
    this._origX = this._x.copy();

    if (this._mouseZoomable) {
      this._enableMouseZoom();
    } else if (this._hasBeenMouseZoomable) {
      this._disableMouseZoom();
    }
  }

  _enableMouseZoom () {
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

  _disableMouseZoom () {
    this.root().call(this._nullZoom);
  }

  _zoomHandler (newDomain: any, noRaiseEvents: any) {
    let domFilter: any;

    if (this._hasRangeSelected(newDomain)) {
      this.x().domain(newDomain);
      domFilter = filters.RangedFilter(newDomain[0], newDomain[1]);
    } else {
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
  _domainToZoomTransform (newDomain: any, origDomain: any, xScale: any) {
    const k = (origDomain[1] - origDomain[0]) / (newDomain[1] - newDomain[0]);
    const xt = -1 * xScale(newDomain[0]);

    return zoomIdentity.scale(k).translate(xt, 0);
  }

  // If we changing zoom status (for example by calling focus), tell D3 zoom about it
  _updateD3zoomTransform () {
    if (this._zoom) {
      this._zoom.transform(this.root(), this._domainToZoomTransform(this.x().domain(), this._xOriginalDomain, this._origX));
    }
  }

  _onZoom () {
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

  _checkExtents (ext: any, outerLimits: any) {
    if (!ext || ext.length !== 2 || !outerLimits || outerLimits.length !== 2) {
      return ext;
    }

    if (ext[0] > outerLimits[1] || ext[1] < outerLimits[0]) {
      console.warn('Could not intersect extents, will reset');
    }
    // Math.max does not work (as the values may be dates as well)
    return [ext[0] > outerLimits[0] ? ext[0] : outerLimits[0], ext[1] < outerLimits[1] ? ext[1] : outerLimits[1]];
  }

  focus (range: any, noRaiseEvents: any) {
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

  refocused () {
    return !utils.arraysEqual(this.x().domain(), this._xOriginalDomain);
  }

  focusChart (c?: any) {
    if (c === undefined) {
      return this._focusChart;
    }
    this._focusChart = c;
    this.on('filtered.dcjs-range-chart', (chart: any) => {
      if (!chart.filter()) {
        events.trigger(() => {
          this._focusChart.x().domain(this._focusChart.xOriginalDomain(), true);
        });
      } else if (!utils.arraysEqual(chart.filter(), this._focusChart.filter())) {
        events.trigger(() => {
          this._focusChart.focus(chart.filter(), true);
        });
      }
    });
    return this;
  }

  brushOn (brushOn?: any) {
    if (brushOn === undefined) {
      return this._brushOn;
    }
    this._brushOn = brushOn;
    return this;
  }

  parentBrushOn (brushOn?: any) {
    if (brushOn === undefined) {
      return this._parentBrushOn;
    }
    this._parentBrushOn = brushOn;
    return this;
  }

  // Get the SVG rendered brush
  gBrush () {
    return this._gBrush;
  }

  _hasRangeSelected (range: any) {
    return range instanceof Array && range.length > 1;
  }
}
