import {filters, transition, utils, pluck, events} from 'dc';
import * as _ from 'lodash';
import * as d3 from 'd3';
import {CoordinateGridMixin} from '../base/coordinate-grid-mixin';

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

export class MultiChart extends CoordinateGridMixin {

  private _gap: any = 2;
  private MIN_BAR_WIDTH = 1;
  private _centerBar = true;
  private _symbol = d3.symbol();
  private _click = null;
  private _dashStyle: any;
  private _defined: any;
  private _barWidth: any;
  private _locator: any;
  private _annotateLocation: any;
  private _highlightedSize = 7;
  private _symbolSize = 5;
  private _excludedSize = 3;
  private _excludedColor = null;
  private _excludedOpacity = 1.0;
  private __filter: any;
  private _emptySize = 0;
  private _filtered = [];
  private _existenceAccessor: any;
  private lines: any;
  private originalKeyAccessor;
  private multiOption;
  _tooltip: any;

  x: any;
  _x: any;
  y: any;
  g: any;
  brush: any;
  _widthCalc: any;
  redrawBrush: any;
  redrawGroup: any;
  filter: any;
  round: any;
  label: any;
  title: any;
  svg: any;
  data: any;
  group: any;
  width: any;
  onClick: any;
  getColor: any;
  selectAll: any;
  xAxisLength: any;
  chartBodyG: any;
  xUnitCount: any;
  renderLabel: any;
  yAxisHeight: any;
  margins: any;
  isOrdinal: any;
  _groupName: any;
  _groupScale: any;
  keyAccessor: any;
  valueAccessor: any;
  colorAccessor: any;
  yOriginalDomain: any;
  transitionDuration: any;
  transitionDelay: any;

  constructor(element?: any, option?: any) {
    super();
    this.multiOption = option;
    this.originalKeyAccessor = this.keyAccessor();

    this.keyAccessor((d: any) => this.originalKeyAccessor(d)[0]);
    this.valueAccessor((d: any) => this.originalKeyAccessor(d)[1]);
    this.colorAccessor(() => this._groupName);
    this.lines = () => this;
    this._existenceAccessor = (d: any) => {
      return d.value ? d.value : d.y;
    };

    this._symbol.size((d: any, i: number) => {
      if (!this._existenceAccessor(d)) {
        return this._emptySize;
      } else if (this._filtered[i]) {
        return Math.pow(this._symbolSize, 2);
      } else {
        return Math.pow(this._excludedSize, 2);
      }
    });
  }

  _filter(filter?: any) {
    if (!filter) {
      return this.__filter();
    }
    return this.__filter(filters.RangedTwoDimensionalFilter(filter));
  }

  plotData(zoomX?: any, zoomY?: any) {
    const chartList: any[] = [];
    let type;
    let axisLabel;
    let yAxisLabel;
    let errorBar;
    let chartOption: any;
    let axisWidth: any;
    let clipPath;
    if (this.svg()) {
      clipPath = this.svg().select('.chart-body').attr('clip-path');
    } else {
      clipPath = this.g().select('.chart-body').attr('clip-path');
    }
    this.chartBodyG().attr('clip-path', clipPath);

    this.multiOption.axisOption.forEach((v: any) => {
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
        const _stacks: any = [];
        const sel_stack = ((key: any) => (d: any) => d.value[key]);
        chartOption.stacks.forEach((d: any) => {
          const layer = {group: this.group(), name: d, accessor: sel_stack};
          _stacks.push(layer);
        });
        this.data = () => {
          const layers = _stacks.filter((l: any) => !l.hidden);
          if (!layers.length) {
            return [];
          }
          layers.forEach((layer: any, layerIdx: any) => {
            layer.name = String(layer.name || layerIdx);
            const allValues = layer.group.all().map((d: any, i: number) => {
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

          const v4data = layers[0].values.map((v: any, i: number) => {
            const col = {x: v.x};
            layers.forEach((layer: any) => {
              // @ts-ignore
              col[layer.name] = layer.values[i].y;
            });
            return col;
          });
          const keys = layers.map((layer: any) => layer.name);
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
      const data: any = [];
      let domain = this.x().domain();
      this.data().forEach((v: any) => {
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
          yAxis.ticks(2).tickFormat((d: any) => {
            if (!d) {
              return 'FAIL';
            } else if (d === 1) {
              return 'PASS';
            } else {
              return null;
            }
          });
        } else if (axisLabel === 'EVENT') {
          y.domain(domain);
        } else {
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
      } else if (!zoomX && !zoomY && this.yOriginalDomain && this.yOriginalDomain()) {
        y.domain(this.yOriginalDomain());
      } else { // zoom out 일때
        if (this.multiOption.axisOption) {
          this.multiOption.axisOption.forEach((v: any) => {
            if (this._groupName === v.series) {
              domain = v.domain;
            }
          });
        }
        if (type === 'boolean') {
          y.domain([-0.5, 1.5]);
          // @ts-ignore
          yAxis.ticks(2).tickFormat((d: any) => {
            if (!d) {
              return 'FAIL';
            } else if (d === 1) {
              return 'PASS';
            } else {
              return null;
            }
          });
        } else if (axisLabel === 'EVENT') {
          y.domain(domain);
        } else if (domain) {
          const dom = [domain[0] + (chartOption.gap ? -chartOption.gap : 0), domain[1] + (chartOption.gap ? chartOption.gap : 0)];
          y.domain(dom);
        } else {
          const dom = [
            // @ts-ignore
            d3.min(data, (d: any) =>  typeof d.value === 'object' ? d.value.value : d.value) + (chartOption.gap ? -chartOption.gap : 0),
            d3.max(data, (d: any) => typeof d.value === 'object' ? d.value.value : d.value) + (chartOption.gap ? chartOption.gap : 0)
          ];
          y.domain(dom);
        }
      }

      this._locator = (d: any) => {
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
        } else {
          let check = y(d.y);
          if (isNaN(check)) {
            check = 0;
          }
          return 'translate(' + (this.x()(d.x) + bandwidth) + ',' + check + ')' + rotate;
        }
      };

      this._annotateLocation = (d: any) => {
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
        } else {
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
          values: this.data().map((d: any, i: number) => {
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
        const axisClass = this.multiOption.axisOption.filter((d: any) => !d.hide).map((d: any) => d.series).indexOf(this._groupName);

        const chartWith = this.renderYAxisAt(axisClass
          , axis
          , this.width() - this.margins().right + axisPadding);


        axisWidth = this.renderYAxisAt(axisClass
          , axis
          , this.width() - this.margins().right + axisPadding) || 0;

        // label
        this.renderYAxisLabel(axisClass
          , yAxisLabel
          , 90
          , this.width() - this.margins().right + axisWidth + 5 + axisPadding);
      }

      // set y right axis width
      this.multiOption.axisOption.forEach((v: any) => {
        if (this._groupName === v.series) {
          v.width = axisWidth;
        }
      });
    }

    if (!this.yOriginalDomain) {
      this.yOriginalDomain = () => {
        let domain;
        this.multiOption.axisOption.forEach((v: any) => {
          if (this._groupName === v.series) {
            domain = v.domain;
          }
        });
        return domain;
      };
    }
  }

  click(click?: any) {
    if (!click) {
      return this._click;
    }
    this._click = click;
    return this;
  }

  defined(defined?: any) {
    if (!defined) {
      return this._defined;
    }
    this._defined = defined;
    return this;
  }

  dashStyle(dashStyle?: any) {
    if (!dashStyle) {
      return this._dashStyle;
    }
    this._dashStyle = dashStyle;
    return this;
  }

  renderYAxisLabel(axisClass?: any, text?: any, rotation?: any, labelXPosition?: any) {
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

  renderYAxisAt(axisClass: any, axis: any, position: any) {
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
    } else {
      if (this.svg()) {
        axisYG = this.svg().select('g.' + 'y');
      } else {
        axisYG = d3.select(this.g()._groups[0][0].parentNode).select('g.' + 'y');
      }

      transition(axisYG, this.transitionDuration(), this.transitionDelay()).call(axis);
    }

    if (axisYG && axisYG._groups[0][0]) {
      return axisYG._groups[0][0].getBoundingClientRect().width;
    } else {
      return 0;
    }
  }

  private drawChart(chart: any, y: any, data: any, option: any, zoomX: any, zoomY: any) {
    if (chart === 'lineSymbol') {
      /*--------- line Start----------*/
      const chartBody = this.chartBodyG();
      let layersList = chartBody.selectAll('g.stack-list');
      if (layersList.empty()) {
        layersList = chartBody.append('g').attr('class', 'stack-list');
      }
      const layers = layersList.selectAll('g.stack').data(data);
      const layersEnter = layers.enter().append('g').attr('class', (d: any, i: number) => 'stack ' + '_' + i);
      this.drawLine(layersEnter, layers, y, option, option.smooth);
      /*--------- line End----------*/

      /*--------- symbol Start----------*/
      const layers2 = this.chartBodyG().selectAll('path.symbol').data(data);
      layers2.enter()
        .append('g')
        .attr('class', (d: any, i: number) => {
          return 'stack ' + '_' + i;
        });

      data.forEach((d: any, i: number) => {
        this.renderSymbol(d, option);
      });

      // 추가된 데이터가 있으면 다시 렌더
      if (data.length !== layers.size()) {
        this.plotData();
      }
      /*--------- symbol End----------*/

      // renderArea 추가
      if (option.renderArea) {
        this.drawArea(layersEnter, layers, y, option, option.smooth ?  d3.curveMonotoneX : d3.curveCardinal.tension(1));
      }
    } else if (chart === 'smoothLine') {
      /*--------- line Start----------*/
      const chartBody = this.chartBodyG();
      let layersList = chartBody.selectAll('g.stack-list');
      if (layersList.empty()) {
        layersList = chartBody.append('g').attr('class', 'stack-list');
      }
      const layers = layersList.selectAll('g.stack').data(data);
      const layersEnter = layers.enter().append('g').attr('class', (d: any, i: number) => 'stack ' + '_' + i);
      this.drawLine(layersEnter, layers, y, option, true);
      /*--------- line End----------*/

      /*--------- symbol Start----------*/
      const layers2 = this.chartBodyG().selectAll('path.symbol').data(data);
      layers2.enter()
        .append('g')
        .attr('class', (d: any, i: number) => {
          return 'stack ' + '_' + i;
        });

      data.forEach((d: any, i: number) => {
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
    } else if (chart === 'line') {
      const chartBody = this.chartBodyG();
      let layersList = chartBody.selectAll('g.stack-list');
      if (layersList.empty()) {
        layersList = chartBody.append('g').attr('class', 'stack-list');
      }
      const layers = layersList.selectAll('g.stack').data(data);
      const layersEnter = layers.enter().append('g').attr('class', (d: any, i: number) => 'stack ' + '_' + i);
      this.drawLine(layersEnter, layers, y, option, option.smooth);

      // 추가된 데이터가 있으면 다시 렌더
      if (data.length !== layers.size()) {
        this.plotData();
      }

      if (option.renderArea) {
        this.drawArea(layersEnter, layers, y, option, option.smooth ?  d3.curveMonotoneX : d3.curveCardinal.tension(1));
      }
    } else if (chart === 'stepLine') {
      const chartBody = this.chartBodyG();
      let layersList = chartBody.selectAll('g.stack-list');
      if (layersList.empty()) {
        layersList = chartBody.append('g').attr('class', 'stack-list');
      }
      const layers = layersList.selectAll('g.stack').data(data);
      const layersEnter = layers.enter().append('g').attr('class', (d: any, i: number) => 'stack ' + '_' + i);
      this.stepLine(layersEnter, layers, y, option);
      if (option.renderArea) {
        this.drawArea(layersEnter, layers, y, option, d3.curveStepAfter);
      }

      // 추가된 데이터가 있으면 다시 렌더
      if (data.length !== layers.size()) {
        this.plotData();
      }
    } else if (chart === 'symbol' || chart === 'boolean') {
      if (this.chartBodyG().selectAll('path.symbol').empty()) {
        this.chartBodyG().append('path').attr('class', 'symbol');
      }
      const layers = this.chartBodyG().selectAll('path.symbol').data(data);
      layers.enter()
        .append('g')
        .attr('class', (d: any, i: number) => 'stack ' + '_' + i);

      data.forEach((d: any, i: number) => this.renderSymbol(d, option));
    } else if (chart === 'bar') {
      const bars = this.multiOption.axisOption.filter((d: any) => d.type === 'bar');
      const barIndex = bars.map((d: any) => d.series).indexOf(this._groupName);
      if (this.chartBodyG().selectAll('g.stack').empty()) {
        this.chartBodyG().append('g').attr('class', 'stack _0');
      }
      const layers = this.chartBodyG().selectAll('g.stack').data(data);
      this.calculateBarWidth();
      layers.enter()
        .append('g')
        .attr('class', (d: any, i: number) => {
          return 'stack ' + '_' + i;
        })
        .merge(layers);

      const last = layers.size() - 1;
      layers.each((d: any, i: number) => {
        const layer = d3.select(d);
        this.renderBars(layers, i, d, y, option, bars, barIndex);

        if (this.renderLabel() && last === i) {
          this.renderLabels(layer, i, d);
        }
      });
    } else if (chart === 'thermal') {
      const xStep = option.gap, yStep = 1;
      if (zoomX && zoomY) {
        this.x().domain([zoomX[0], +zoomX[1]]);
        y.domain([zoomY[0], zoomY[1] + yStep]);
      } else {
        this.x().domain([this.multiOption.xRange[0] - (xStep / 2), +this.multiOption.xRange[1] + (xStep / 2)]);
        y.domain([option.domain[0], option.domain[1] + yStep]);
      }

      const layers = this.chartBodyG().selectAll('rect.thermal').data(data);
      layers.enter()
        .append('g')
        .attr('class', (d: any, i: number) => 'stack ' + '_' + i);

      data.forEach((d: any, i: number) => this.renderThermal(d, option, xStep, yStep, y));
    }
  }

  barPadding(barPadding?: any) {
    if (!barPadding) {
      return this._rangeBandPadding();
    }
    this._rangeBandPadding(barPadding);
    this._gap = undefined;
    return this;
  }

  private calculateBarWidth() {
    if (this._barWidth === undefined) {
      const numberOfBars = this.xUnitCount();
      if (this.isOrdinal() && this._gap === undefined) {
        this._barWidth = Math.floor(this.x().bandwidth());
      } else if (this._gap) {
        this._barWidth = Math.floor((this.xAxisLength() - (numberOfBars - 1) * this._gap) / numberOfBars);
      } else {
        this._barWidth = Math.floor(this.xAxisLength() / (1 + this.barPadding()) / numberOfBars);
      }

      if (this._barWidth === Infinity || isNaN(this._barWidth) || this._barWidth < this.MIN_BAR_WIDTH) {
        this._barWidth = this.MIN_BAR_WIDTH;
      }
    }
  }

  private drawLine(layersEnter: any, layers: any, y: any, option: any, smooth?: any) {
    let bandwidth = 0;
    if (this.x().bandwidth) {
      bandwidth = this.x().bandwidth() / 2;
    }

    const line = d3.line()
      .x((d: any) => this.x()(d.x) + bandwidth)
      .y((d: any) => y ? y(d.y) : this.y()(d.y))
      .curve(smooth ? d3.curveMonotoneX : d3.curveCardinal.tension(1));

    if (this._defined) {
      line.defined(this._defined);
    }

    const path = layersEnter.append('path').attr('class', 'line').attr('stroke', option.color ? option.color : this.colors2.bind(this))
      .attr('stroke', option.color ? option.color : this.colors2.bind(this))
      .attr('d', (d: any) => this.safeD(line(d.values)))
      .attr('chartKey', (d: any) => d.key)
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

  private colors2(d: any, i: number) {
    return this.getColor.call(d, d.values, i);
  }

  private safeD(d: any) {
    return (!d || d.indexOf('NaN') >= 0) ? 'M0,0' : d;
  }

  private renderSymbol(d: any, option: any) {
    const getSymbol = () => {
      if (option.symbol) {
        if (option.symbol === 'cross') {
          return d3.symbolCross;
        } else if (option.symbol === 'diamond') {
          return d3.symbolDiamond;
        } else if (option.symbol === 'square') {
          return d3.symbolSquare;
        } else if (option.symbol === 'star') {
          return d3.symbolStar;
        } else if (option.symbol === 'triangle') {
          return d3.symbolTriangle;
        } else if (option.symbol === 'wye') {
          return d3.symbolWye;
        } else {
          return d3.symbolCircle;
        }
      } else {
        return d3.symbolCircle;
      }
    };

    const symbolSize = () => {
      if (option.size) {
        return option.size * option.size;
      } else {
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
      .on('click', (data: any) => {
        if (this._click) {
          // @ts-ignore
          return this._click(d);
        }
      });

    if (this.multiOption.tooltip) {
      const tooltip = this.getTooltipElem();
      symbols
        .on('mousemove', (data: any) => {
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
        .on('mouseout', (data: any) => {
          tooltip .transition()
            .duration(200)
            .style('opacity', 0)
            .style('z-index', -1);
        });
    }

    if (this.multiOption.onClick) {
      // @ts-ignore
      symbols.on('click', (data: any) => this.multiOption.onClick(data, event));
    }

    // @ts-ignore
    transition(symbols, this.transitionDuration(), this.transitionDelay())
      .attr('opacity', (data, i) => isNaN(this._existenceAccessor(data)) ? 0 : this._filtered[i] ? 1 : this.excludedOpacity())
      .attr('stroke', (data, i) => {
        if (this.excludedColor() && !this._filtered[i]) {
          return this.excludedColor();
        } else if (typeof color === 'function' ) {
          return color(data.data.value);
        } else {
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

  private barHeight(y: any, d: any) {
    const rtn = +(this.yAxisHeight() - y(d.y)) < 0 ? 0 : utils.safeNumber(+(this.yAxisHeight() - y(d.y)));
    if (d.y0 !== undefined) {
      return (y(d.y0) - y(d.y + d.y0));
    }

    return rtn;
  }

  private drawArea(layersEnter: any, layers: any, y: any, option: any, curve: any) {
    const area = d3.area()
      .x((d: any) => this.x()(d.x))
      .y1((d: any) =>  y ? y(d.y) : this.y()(d.y))
      .y0((d: any) => {
        if (option.renderAreaRange) {
          return y ? y(option.renderAreaRange) : this.y()(option.renderAreaRange);
        } else {
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
      .attr('d', (d: any) => this.safeD(area(d.values)));

    transition(layers.select('path.area'), this.transitionDuration(), this.transitionDelay())
      .attr('stroke', option.color ? option.color : this.colors2.bind(this)).attr('d', d => this.safeD(area(d.values)));
  }

  private renderLabels(layer: any, layerIndex: any, d: any) {
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
        return utils.safeNumber(x);
      })
      .attr('y', data => {
        let y = this.y()(data.y + data.y0);

        if (data.y < 0) {
          y -= this.barHeight(y, data);
        }

        return utils.safeNumber(y - 3);
      })
      .text(data =>  this.label()(data));

    transition(labels.exit(), this.transitionDuration(), this.transitionDelay())
      .attr('height', 0)
      .remove();
  }

  private renderThermal(data: any, option: any, xStep: any, yStep: any, y: any) {
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

  private renderBars(layer: any, layerIndex: any, data: any, y: any, option: any, barlist: any, barIndex: any) {
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
      const {left, right} = this.margins();
      const xAxisWidth = this._widthCalc() - left - right;
      const uniqKeys = _.uniq(this.data().map((d: any) => d.key[1]));

      this._barWidth = xAxisWidth / uniqKeys.length;
    }

    transition(bars.exit(), this.transitionDuration(), this.transitionDelay())
      .attr('x', d => this.x()(d.x))
      .attr('width', this._barWidth * 0.9)
      .remove();

    bars.enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', (d: any) => {
        let x = this.x()(d.x);
        if (this._centerBar && !this.isOrdinal()) {
          x -= this._barWidth / 2;
        }
        if (this.isOrdinal() && this._gap !== undefined) {
          x += this._gap / 2;
        }
        const position = (this._barWidth / barlist.length) * barIndex;
        return utils.safeNumber(x + position);
      })
      .attr('y', (d: any) => {
        let yVal;
        if (d.y0 !== undefined) {
          yVal = y(d.y + d.y0);
          if (d.y < 0) {
            yVal -= this.barHeight(y, d);
          }
        } else {
          yVal = y(d.y);
        }
        return utils.safeNumber(yVal);
      })
      .attr('width', this._barWidth / barlist.length)
      .attr('height', (d: any) => this.barHeight(y, d))
      .attr('fill', pluck('layer', option.color ? (d: any, i: number) => {
        if (option.stacks) {
          const index = option.stacks.indexOf(d);
          return option.color[index];
        } else {
          return option.color;
        }
      } : this.getColor))
      .select('title').text(pluck('data', this.title(data.name)));

    if (this.multiOption.onClick) {
      // @ts-ignore
      bars.on('click', (d: any) => this.multiOption.onClick(d, event));
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
        return utils.safeNumber(x + position);
      })
      .attr('y', d => {
        let yVal;
        if (d.y0 !== undefined) {
          yVal = y(d.y + d.y0);
          if (d.y < 0) {
            yVal -= this.barHeight(y, d);
          }
        } else {
          yVal = y(d.y);
        }
        return utils.safeNumber(yVal);
      })
      .attr('width', this._barWidth / barlist.length)
      .attr('height', d => this.barHeight(y, d))
      .attr('fill', pluck('layer', option.color ? (d: any, i: number) => {
        if (option.stacks) {
          const index = option.stacks.indexOf(d);
          return option.color[index];
        } else {
          return option.color;
        }
      } : this.getColor))
      .select('title').text(pluck('data', this.title(data.name)));
  }

  private stepLine(layersEnter: any, layers: any, y: any, option: any) {
    let bandwidth = 0;
    if (this.x().bandwidth) {
      bandwidth = this.x().bandwidth() / 2;
    }

    const line = d3.line()
      .x((d: any) => (this.x()(d.x) + bandwidth))
      .y((d: any) => y ? y(d.y) : this.y()(d.y))
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

  symbol(type?: any) {
    if (!type) {
      return this._symbol.type();
    }
    this._symbol.type(type);
    return this;
  }

  excludedColor(excludedColor?: any) {
    if (!excludedColor) {
      return this._excludedColor;
    }
    this._excludedColor = excludedColor;
    return this;
  }

  excludedOpacity(excludedOpacity?: any) {
    if (!excludedOpacity) {
      return this._excludedOpacity;
    }
    this._excludedOpacity = excludedOpacity;
    return this;
  }

  private resizeSymbolsWhere(condition: any, size: any) {
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

  brushIsEmpty(extent: any) {
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
    } else {
      const ranged2DFilter = filters.RangedTwoDimensionalFilter(extent);
      events.trigger(() => {
        this.filter(null);
        this.filter(ranged2DFilter);
        this.redrawGroup();
      }, constants.EVENT_DELAY);
    }
  }

  private getTooltipElem() {
    if (!this._tooltip || this._tooltip.empty()) {
      this._tooltip  = d3.select('body')
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
