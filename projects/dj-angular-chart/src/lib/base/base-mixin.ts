import {select} from 'd3-selection';
import {dispatch} from 'd3-dispatch';

import {pluck, utils, instanceOfChart, deregisterChart, redrawAll, registerChart, renderAll, events, logger, printers} from 'dc';
import {ElementRef} from '@angular/core';

class InvalidStateException extends Error {}
class BadArgumentException extends Error {}

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


const _defaultFilterHandler = (dimension: any, filters: Array<any>) => {
  if (filters.length === 0) {
    dimension.filter(null);
  } else if (filters.length === 1 && !filters[0].isFiltered) {
    // single value and not a function-based filter
    dimension.filterExact(filters[0]);
  } else if (filters.length === 1 && filters[0].filterType === 'RangedFilter') {
    // single range-based filter
    dimension.filterRange(filters[0]);
  } else {
    dimension.filterFunction( (d: any) => {
      for (let i = 0; i < filters.length; i++) {
        const filter = filters[i];
        if (filter.isFiltered) {
          if (filter.isFiltered(d)) {
            return true;
          }
        } else if (filter <= d && filter >= d) {
          return true;
        }
      }
      return false;
    });
  }
  return filters;
};

const _defaultHasFilterHandler = (filters: Array<any>, filter: any) => {
  if (filter === null || typeof (filter) === 'undefined') {
    return filters.length > 0;
  }
  return filters.some(f => filter <= f && filter >= f);
};

const _defaultRemoveFilterHandler = (filters: Array<any>, filter: any) => {
  for (let i = 0; i < filters.length; i++) {
    if (filters[i] <= filter && filters[i] >= filter) {
      filters.splice(i, 1);
      break;
    }
  }
  return filters;
};

const _defaultAddFilterHandler = (filters: Array<any>, filter: any) => {
  filters.push(filter);
  return filters;
};

const _defaultResetFilterHandler = (filters: Array<any>) => [];

export class BaseMixin {
  __dcFlag__;
  _dimension: undefined;
  _group: undefined;
  _groupName: any;
  _anchor: string | undefined;
  // @ts-ignore
  _root;
  // @ts-ignore
  _svg;
  _isChild: boolean | undefined;
  _minWidth;
  // @ts-ignore
  _defaultWidthCalc;
  _widthCalc;
  _minHeight;
  // @ts-ignore
  _defaultHeightCalc;
  _heightCalc;
  _width: any;
  _height: any;
  _useViewBoxResizing;
  _keyAccessor;
  _valueAccessor;
  _label;
  _ordering;
  _renderLabel;
  // @ts-ignore
  _title;
  _renderTitle: any;
  _controlsUseVisibility;
  _transitionDuration;
  _transitionDelay;
  _filterPrinter;
  // @ts-ignore
  _mandatoryAttributesList;
  _chartGroup;
  // @ts-ignore
  _listeners;

  // @ts-ignore
  _legend;
  // @ts-ignore
  _commitHandler;

  // @ts-ignore
  _defaultData;
  _data;

  _filters: any[];

  _filterHandler = _defaultFilterHandler;
  _hasFilterHandler = _defaultHasFilterHandler;
  _removeFilterHandler = _defaultRemoveFilterHandler;
  _addFilterHandler = _defaultAddFilterHandler;
  _resetFilterHandler = _defaultResetFilterHandler;

  constructor () {
    this.__dcFlag__ = utils.uniqueId();

    this._dimension = undefined;
    this._group = undefined;

    this._anchor = undefined;
    this._root = undefined;
    this._svg = undefined;
    this._isChild = undefined;

    this._minWidth = 100;
    this._defaultWidthCalc = (element: Element) => {
      const width = element && element.getBoundingClientRect && element.getBoundingClientRect().width;
      return (width && width > this._minWidth) ? width : this._minWidth;
    };
    this._widthCalc = this._defaultWidthCalc;

    this._minHeight = 100;
    this._defaultHeightCalc = (element: Element) => {
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

    this._listeners = dispatch(
      'preRender',
      'postRender',
      'preRedraw',
      'postRedraw',
      'filtered',
      'zoomed',
      'renderlet',
      'pretransition');

    this._legend = undefined;
    this._commitHandler = undefined;

    this._defaultData = (group: any) => group.all();
    this._data = this._defaultData;

    this._filters = [];
  }

  height (height?: any) {
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

  width (width?: any) {
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

  minWidth (minWidth?: any) {
    if (minWidth === undefined) {
      return this._minWidth;
    }
    this._minWidth = minWidth;
    return this;
  }

  minHeight (minHeight?: any) {
    if (minHeight === undefined) {
      return this._minHeight;
    }
    this._minHeight = minHeight;
    return this;
  }

  useViewBoxResizing (useViewBoxResizing?: any) {
    if (useViewBoxResizing === undefined) {
      return this._useViewBoxResizing;
    }
    this._useViewBoxResizing = useViewBoxResizing;
    return this;
  }

  dimension (dimension?: any) {
    if (dimension === undefined) {
      return this._dimension;
    }
    this._dimension = dimension;
    this.expireCache();
    return this;
  }

  data (callback?: any) {
    if (callback === undefined) {
      return this._data(this._group);
    }
    this._data = typeof callback === 'function' ? callback : utils.constant(callback);
    this.expireCache();
    return this;
  }

  group (group?: any, name?: string) {
    if (group === undefined) {
      return this._group;
    }
    this._group = group;
    this._groupName = name;
    this.expireCache();
    return this;
  }

  ordering (orderFunction?: any) {
    if (orderFunction === undefined) {
      return this._ordering;
    }
    this._ordering = orderFunction;
    this.expireCache();
    return this;
  }

  _computeOrderedGroups (data: any) {
    // clone the array before sorting, otherwise Array.sort sorts in-place
    return Array.from(data).sort((a, b) => this._ordering(a) - this._ordering(b));
  }

  filterAll () {
    return this.filter(null);
  }

  select (sel: any) {
    return this._root.select(sel);
  }

  selectAll (sel: any) {
    return this._root ? this._root.selectAll(sel) : null;
  }

  anchor (parent?: any, chartGroup?: any) {
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
    } else if (parent) {
      if (parent.select && parent.classed) { // detect d3 selection
        this._anchor = parent.node();
      } else {
        this._anchor = parent;
      }
      // @ts-ignore
      this._root = select(this._anchor);
      this._root.classed(constants.CHART_CLASS, true);
      // @ts-ignore
      registerChart(this, chartGroup);
      this._isChild = false;
    } else {
      throw new BadArgumentException('parent must be defined');
    }
    this._chartGroup = chartGroup;
    return this;
  }

  anchorName () {
    const a: any = this.anchor();
    if (a && a.id) {
      return a.id;
    }
    if (a && a.replace) {
      return a.replace('#', '');
    }
    return `dc-chart${this.chartID()}`;
  }

  root (rootElement?: any) {
    if (rootElement === undefined) {
      return this._root;
    }
    this._root = rootElement;
    return this;
  }

  svg (svgElement?: any) {
    if (svgElement === undefined) {
      return this._svg;
    }
    this._svg = svgElement;
    return this;
  }

  resetSvg () {
    this.select('svg').remove();
    return this.generateSvg();
  }

  sizeSvg () {
    if (this._svg) {
      if (!this._useViewBoxResizing) {
        this._svg
          .attr('width', this.width())
          .attr('height', this.height());
      } else if (!this._svg.attr('viewBox')) {
        this._svg
          .attr('viewBox', `0 0 ${this.width()} ${this.height()}`);
      }
    }
  }

  generateSvg () {
    this._svg = this.root().append('svg');
    this.sizeSvg();
    return this._svg;
  }

  filterPrinter (filterPrinterFunction?: any) {
    if (filterPrinterFunction === undefined) {
      return this._filterPrinter;
    }
    this._filterPrinter = filterPrinterFunction;
    return this;
  }

  controlsUseVisibility (controlsUseVisibility?: any) {
    if (controlsUseVisibility === undefined) {
      return this._controlsUseVisibility;
    }
    this._controlsUseVisibility = controlsUseVisibility;
    return this;
  }

  turnOnControls () {
    if (this._root) {
      const attribute = this.controlsUseVisibility() ? 'visibility' : 'display';
      this.selectAll('.reset').style(attribute, null);
      this.selectAll('.filter').text(this._filterPrinter(this.filters())).style(attribute, null);
    }
    return this;
  }

  turnOffControls () {
    if (this._root) {
      const attribute = this.controlsUseVisibility() ? 'visibility' : 'display';
      const value = this.controlsUseVisibility() ? 'hidden' : 'none';
      this.selectAll('.reset').style(attribute, value);
      this.selectAll('.filter').style(attribute, value).text(this.filter());
    }
    return this;
  }


  transitionDuration (duration?: any) {
    if (duration === undefined) {
      return this._transitionDuration;
    }
    this._transitionDuration = duration;
    return this;
  }


  transitionDelay (delay?: any) {
    if (delay === undefined) {
      return this._transitionDelay;
    }
    this._transitionDelay = delay;
    return this;
  }

  _mandatoryAttributes (_?: any) {
    if (_ === undefined) {
      return this._mandatoryAttributesList;
    }
    this._mandatoryAttributesList = _;
    return this;
  }

  checkForMandatoryAttributes (a: string) {
    // @ts-ignore
    if (!this[a] || !this[a]()) {
      throw new InvalidStateException(`Mandatory attribute chart.${a} is missing on chart[#${this.anchorName()}]`);
    }
  }


  render() {
    this._height = this._width = undefined; // force recalculate
    this._listeners.call('preRender', this, this);

    if (this._mandatoryAttributesList) {
      this._mandatoryAttributesList.forEach((e: any) => this.checkForMandatoryAttributes(e));
    }

    const result = this._doRender();

    if (this._legend) {
      this._legend.render();
    }

    this._activateRenderlets('postRender');

    return result;
  }

  _activateRenderlets (event: any) {
    this._listeners.call('pretransition', this, this);
    if (this.transitionDuration() > 0 && this._svg) {
      this._svg.transition().duration(this.transitionDuration()).delay(this.transitionDelay())
        .on('end', () => {
          this._listeners.call('renderlet', this, this);
          if (event) {
            this._listeners.call(event, this, this);
          }
        });
    } else {
      this._listeners.call('renderlet', this, this);
      if (event) {
        this._listeners.call(event, this, this);
      }
    }
  }


  redraw () {
    this.sizeSvg();
    this._listeners.call('preRedraw', this, this);

    const result = this._doRedraw();

    if (this._legend) {
      this._legend.render();
    }

    this._activateRenderlets('postRedraw');

    return result;
  }


  commitHandler (commitHandler?: any) {
    if (commitHandler === undefined) {
      return this._commitHandler;
    }
    this._commitHandler = commitHandler;
    return this;
  }

  redrawGroup () {
    if (this._commitHandler) {
      this._commitHandler(false, (error: any, result: any) => {
        if (error) {
          console.log(error);
        } else {
          // @ts-ignore
          redrawAll(this.chartGroup());
        }
      });
    } else {
      // @ts-ignore
      redrawAll(this.chartGroup());
    }
    return this;
  }

  renderGroup () {
    if (this._commitHandler) {
      this._commitHandler(false, (error: any, result: any) => {
        if (error) {
          console.log(error);
        } else {
          // @ts-ignore
          renderAll(this.chartGroup());
        }
      });
    } else {
      // @ts-ignore
      renderAll(this.chartGroup());
    }
    return this;
  }

  _invokeFilteredListener (f: any) {
    if (f !== undefined) {
      this._listeners.call('filtered', this, this, f);
    }
  }

  _invokeZoomedListener () {
    this._listeners.call('zoomed', this, this);
  }


  hasFilterHandler (hasFilterHandler?: any) {
    if (hasFilterHandler === undefined) {
      return this._hasFilterHandler;
    }
    this._hasFilterHandler = hasFilterHandler;
    return this;
  }

  hasFilter (filter?: any) {
    return this._hasFilterHandler(this._filters, filter);
  }


  removeFilterHandler (removeFilterHandler?: any) {
    if (removeFilterHandler === undefined) {
      return this._removeFilterHandler;
    }
    this._removeFilterHandler = removeFilterHandler;
    return this;
  }

  addFilterHandler (addFilterHandler: any) {
    if (!arguments.length) {
      return this._addFilterHandler;
    }
    this._addFilterHandler = addFilterHandler;
    return this;
  }


  resetFilterHandler (resetFilterHandler: any) {
    if (!arguments.length) {
      return this._resetFilterHandler;
    }
    this._resetFilterHandler = resetFilterHandler;
    return this;
  }

  applyFilters (filters: any) {
    // @ts-ignore
    if (this.dimension() && this.dimension().filter) {
      const fs = this._filterHandler(this.dimension(), filters);
      if (fs) {
        filters = fs;
      }
    }
    return filters;
  }

  replaceFilter (filter: any) {
    this._filters = this._resetFilterHandler(this._filters);
    this.filter(filter);
    return this;
  }

  filter (filter?: any) {
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
        } else {
          filters = this._addFilterHandler(filters, f);
        }
      });
    } else if (filter === null) {
      filters = this._resetFilterHandler(filters);
    } else {
      if (this._hasFilterHandler(filters, filter)) {
        filters = this._removeFilterHandler(filters, filter);
      } else {
        filters = this._addFilterHandler(filters, filter);
      }
    }
    this._filters = this.applyFilters(filters);
    this._invokeFilteredListener(filter);

    if (this._root !== null && this.hasFilter()) {
      this.turnOnControls();
    } else {
      this.turnOffControls();
    }

    return this;
  }


  filters () {
    return this._filters;
  }

  highlightSelected (e: any) {
    select(e).classed(constants.SELECTED_CLASS, true);
    select(e).classed(constants.DESELECTED_CLASS, false);
  }

  fadeDeselected (e: any) {
    select(e).classed(constants.SELECTED_CLASS, false);
    select(e).classed(constants.DESELECTED_CLASS, true);
  }

  resetHighlight (e: any) {
    select(e).classed(constants.SELECTED_CLASS, false);
    select(e).classed(constants.DESELECTED_CLASS, false);
  }

  onClick (datum?: any, i?: any) {
    // @ts-ignore
    const filter = this.keyAccessor()(datum);
    events.trigger(() => {
      this.filter(filter);
      this.redrawGroup();
    });
  }

  filterHandler (filterHandler: any) {
    if (!arguments.length) {
      return this._filterHandler;
    }
    this._filterHandler = filterHandler;
    return this;
  }

  // abstract function stub
  _doRender () {
    // do nothing in base, should be overridden by sub-function
    return this;
  }

  _doRedraw () {
    // do nothing in base, should be overridden by sub-function
    return this;
  }

  legendables () {
    // do nothing in base, should be overridden by sub-function
    return [];
  }

  legendHighlight () {
    // do nothing in base, should be overridden by sub-function
  }

  legendReset () {
    // do nothing in base, should be overridden by sub-function
  }

  legendToggle () {
    // do nothing in base, should be overriden by sub-function
  }

  isLegendableHidden () {
    // do nothing in base, should be overridden by sub-function
    return false;
  }

  keyAccessor (keyAccessor?: any) {
    if (keyAccessor === undefined) {
      return this._keyAccessor;
    }
    this._keyAccessor = keyAccessor;
    return this;
  }

  valueAccessor (valueAccessor?: any) {
    if (valueAccessor === undefined) {
      return this._valueAccessor;
    }
    this._valueAccessor = valueAccessor;
    return this;
  }


  label (labelFunction: any, enableLabels: any) {
    if (!arguments.length) {
      return this._label;
    }
    this._label = labelFunction;
    if ((enableLabels === undefined) || enableLabels) {
      this._renderLabel = true;
    }
    return this;
  }


  renderLabel (renderLabel: any) {
    if (!arguments.length) {
      return this._renderLabel;
    }
    this._renderLabel = renderLabel;
    return this;
  }


  title (titleFunction: any) {
    if (!arguments.length) {
      return this._title;
    }
    this._title = titleFunction;
    return this;
  }


  renderTitle (renderTitle: string) {
    if (!arguments.length) {
      return this._renderTitle;
    }
    this._renderTitle = renderTitle;
    return this;
  }


  chartGroup (chartGroup?: any) {
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

  expireCache () {
    // do nothing in base, should be overridden by sub-function
    return this;
  }

  legend (legend?: any) {
    if (legend === undefined) {
      return this._legend;
    }
    this._legend = legend;
    this._legend.parent(this);
    return this;
  }

  chartID () {
    return this.__dcFlag__;
  }

  options (opts: any) {
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
        } else {
          // @ts-ignore
          this[o].call(this, opts[o]);
        }
      } else {
        logger.debug(`Not a valid option setter name: ${o}`);
      }
    }
    return this;
  }

  on(event: any, listener: any) {
    this._listeners.on(event, listener);
    return this;
  }

  renderlet (renderletFunction: any) {
    logger.warnOnce('chart.renderlet has been deprecated. Please use chart.on("renderlet.<renderletKey>", renderletFunction)');
    this.on(`renderlet.${utils.uniqueId()}`, renderletFunction);
    return this;
  }
}
