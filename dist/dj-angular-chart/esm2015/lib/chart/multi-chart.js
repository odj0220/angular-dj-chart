import { filters, transition, utils, pluck, events } from 'dc';
import * as _ from 'lodash';
import * as d3 from 'd3';
import { CoordinateGridMixin } from '../base/coordinate-grid-mixin';
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
        const rtn = +(this.yAxisHeight() - y(d.y)) < 0 ? 0 : utils.safeNumber(+(this.yAxisHeight() - y(d.y)));
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
            return utils.safeNumber(x);
        })
            .attr('y', data => {
            let y = this.y()(data.y + data.y0);
            if (data.y < 0) {
                y -= this.barHeight(y, data);
            }
            return utils.safeNumber(y - 3);
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
            return utils.safeNumber(x + position);
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
            return utils.safeNumber(yVal);
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
            return utils.safeNumber(x + position);
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
            return utils.safeNumber(yVal);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibXVsdGktY2hhcnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9wcm9qZWN0cy9kai1hbmd1bGFyLWNoYXJ0L3NyYy9saWIvY2hhcnQvbXVsdGktY2hhcnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFDLE9BQU8sRUFBRSxVQUFVLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxNQUFNLEVBQUMsTUFBTSxJQUFJLENBQUM7QUFDN0QsT0FBTyxLQUFLLENBQUMsTUFBTSxRQUFRLENBQUM7QUFDNUIsT0FBTyxLQUFLLEVBQUUsTUFBTSxJQUFJLENBQUM7QUFDekIsT0FBTyxFQUFDLG1CQUFtQixFQUFDLE1BQU0sK0JBQStCLENBQUM7QUFFbEUsTUFBTSxTQUFTLEdBQUc7SUFDaEIsV0FBVyxFQUFFLFVBQVU7SUFDdkIsaUJBQWlCLEVBQUUsT0FBTztJQUMxQixXQUFXLEVBQUUsT0FBTztJQUNwQixnQkFBZ0IsRUFBRSxZQUFZO0lBQzlCLGNBQWMsRUFBRSxVQUFVO0lBQzFCLGVBQWUsRUFBRSxXQUFXO0lBQzVCLGdCQUFnQixFQUFFLGlCQUFpQjtJQUNuQyxtQkFBbUIsRUFBRSx5QkFBeUI7SUFDOUMsV0FBVyxFQUFFLEVBQUU7SUFDZixpQkFBaUIsRUFBRSxLQUFLO0NBQ3pCLENBQUM7QUFFRixNQUFNLE9BQU8sVUFBVyxTQUFRLG1CQUFtQjtJQTZEakQsWUFBWSxPQUFhLEVBQUUsTUFBWTtRQUNyQyxLQUFLLEVBQUUsQ0FBQztRQTVERixTQUFJLEdBQVEsQ0FBQyxDQUFDO1FBQ2Qsa0JBQWEsR0FBRyxDQUFDLENBQUM7UUFDbEIsZUFBVSxHQUFHLElBQUksQ0FBQztRQUNsQixZQUFPLEdBQUcsRUFBRSxDQUFDLE1BQU0sRUFBRSxDQUFDO1FBQ3RCLFdBQU0sR0FBRyxJQUFJLENBQUM7UUFNZCxxQkFBZ0IsR0FBRyxDQUFDLENBQUM7UUFDckIsZ0JBQVcsR0FBRyxDQUFDLENBQUM7UUFDaEIsa0JB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TUFBTSxDQUFDLEtBQUssQ0FBQztpQkFDYixJQUFJLENBQUMsT0FBTyxFQUFFLG9CQUFvQixDQUFDO2lCQUNuQyxJQUFJLENBQUMsRUFBRSxDQUFDO2lCQUNSLEtBQUssQ0FBQyxTQUFTLEVBQUUsQ0FBQyxDQUFDO2lCQUNuQixLQUFLLENBQUMsVUFBVSxFQUFFLFVBQVUsQ0FBQztpQkFDN0IsS0FBSyxDQUFDLFNBQVMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1NBQ3pCO1FBQ0QsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDO0lBQ3ZCLENBQUM7Q0FDRiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7ZmlsdGVycywgdHJhbnNpdGlvbiwgdXRpbHMsIHBsdWNrLCBldmVudHN9IGZyb20gJ2RjJztcbmltcG9ydCAqIGFzIF8gZnJvbSAnbG9kYXNoJztcbmltcG9ydCAqIGFzIGQzIGZyb20gJ2QzJztcbmltcG9ydCB7Q29vcmRpbmF0ZUdyaWRNaXhpbn0gZnJvbSAnLi4vYmFzZS9jb29yZGluYXRlLWdyaWQtbWl4aW4nO1xuXG5jb25zdCBjb25zdGFudHMgPSB7XG4gIENIQVJUX0NMQVNTOiAnZGotY2hhcnQnLFxuICBERUJVR19HUk9VUF9DTEFTUzogJ2RlYnVnJyxcbiAgU1RBQ0tfQ0xBU1M6ICdzdGFjaycsXG4gIERFU0VMRUNURURfQ0xBU1M6ICdkZXNlbGVjdGVkJyxcbiAgU0VMRUNURURfQ0xBU1M6ICdzZWxlY3RlZCcsXG4gIE5PREVfSU5ERVhfTkFNRTogJ19faW5kZXhfXycsXG4gIEdST1VQX0lOREVYX05BTUU6ICdfX2dyb3VwX2luZGV4X18nLFxuICBERUZBVUxUX0NIQVJUX0dST1VQOiAnX19kZWZhdWx0X2NoYXJ0X2dyb3VwX18nLFxuICBFVkVOVF9ERUxBWTogNDAsXG4gIE5FR0xJR0lCTEVfTlVNQkVSOiAxZS0xMFxufTtcblxuZXhwb3J0IGNsYXNzIE11bHRpQ2hhcnQgZXh0ZW5kcyBDb29yZGluYXRlR3JpZE1peGluIHtcblxuICBwcml2YXRlIF9nYXA6IGFueSA9IDI7XG4gIHByaXZhdGUgTUlOX0JBUl9XSURUSCA9IDE7XG4gIHByaXZhdGUgX2NlbnRlckJhciA9IHRydWU7XG4gIHByaXZhdGUgX3N5bWJvbCA9IGQzLnN5bWJvbCgpO1xuICBwcml2YXRlIF9jbGljayA9IG51bGw7XG4gIHByaXZhdGUgX2Rhc2hTdHlsZTogYW55O1xuICBwcml2YXRlIF9kZWZpbmVkOiBhbnk7XG4gIHByaXZhdGUgX2JhcldpZHRoOiBhbnk7XG4gIHByaXZhdGUgX2xvY2F0b3I6IGFueTtcbiAgcHJpdmF0ZSBfYW5ub3RhdGVMb2NhdGlvbjogYW55O1xuICBwcml2YXRlIF9oaWdobGlnaHRlZFNpemUgPSA3O1xuICBwcml2YXRlIF9zeW1ib2xTaXplID0gNTtcbiAgcHJpdmF0ZSBfZXhjbHVkZWRTaXplID0gMztcbiAgcHJpdmF0ZSBfZXhjbHVkZWRDb2xvciA9IG51bGw7XG4gIHByaXZhdGUgX2V4Y2x1ZGVkT3BhY2l0eSA9IDEuMDtcbiAgcHJpdmF0ZSBfX2ZpbHRlcjogYW55O1xuICBwcml2YXRlIF9lbXB0eVNpemUgPSAwO1xuICBwcml2YXRlIF9maWx0ZXJlZCA9IFtdO1xuICBwcml2YXRlIF9leGlzdGVuY2VBY2Nlc3NvcjogYW55O1xuICBwcml2YXRlIGxpbmVzOiBhbnk7XG4gIHByaXZhdGUgb3JpZ2luYWxLZXlBY2Nlc3NvcjtcbiAgcHJpdmF0ZSBtdWx0aU9wdGlvbjtcbiAgX3Rvb2x0aXA6IGFueTtcblxuICB4OiBhbnk7XG4gIF94OiBhbnk7XG4gIHk6IGFueTtcbiAgZzogYW55O1xuICBicnVzaDogYW55O1xuICBfd2lkdGhDYWxjOiBhbnk7XG4gIHJlZHJhd0JydXNoOiBhbnk7XG4gIHJlZHJhd0dyb3VwOiBhbnk7XG4gIGZpbHRlcjogYW55O1xuICByb3VuZDogYW55O1xuICBsYWJlbDogYW55O1xuICB0aXRsZTogYW55O1xuICBzdmc6IGFueTtcbiAgZGF0YTogYW55O1xuICBncm91cDogYW55O1xuICB3aWR0aDogYW55O1xuICBvbkNsaWNrOiBhbnk7XG4gIGdldENvbG9yOiBhbnk7XG4gIHNlbGVjdEFsbDogYW55O1xuICB4QXhpc0xlbmd0aDogYW55O1xuICBjaGFydEJvZHlHOiBhbnk7XG4gIHhVbml0Q291bnQ6IGFueTtcbiAgcmVuZGVyTGFiZWw6IGFueTtcbiAgeUF4aXNIZWlnaHQ6IGFueTtcbiAgbWFyZ2luczogYW55O1xuICBpc09yZGluYWw6IGFueTtcbiAgX2dyb3VwTmFtZTogYW55O1xuICBfZ3JvdXBTY2FsZTogYW55O1xuICBrZXlBY2Nlc3NvcjogYW55O1xuICB2YWx1ZUFjY2Vzc29yOiBhbnk7XG4gIGNvbG9yQWNjZXNzb3I6IGFueTtcbiAgeU9yaWdpbmFsRG9tYWluOiBhbnk7XG4gIHRyYW5zaXRpb25EdXJhdGlvbjogYW55O1xuICB0cmFuc2l0aW9uRGVsYXk6IGFueTtcblxuICBjb25zdHJ1Y3RvcihlbGVtZW50PzogYW55LCBvcHRpb24/OiBhbnkpIHtcbiAgICBzdXBlcigpO1xuICAgIHRoaXMubXVsdGlPcHRpb24gPSBvcHRpb247XG4gICAgdGhpcy5vcmlnaW5hbEtleUFjY2Vzc29yID0gdGhpcy5rZXlBY2Nlc3NvcigpO1xuXG4gICAgdGhpcy5rZXlBY2Nlc3NvcigoZDogYW55KSA9PiB0aGlzLm9yaWdpbmFsS2V5QWNjZXNzb3IoZClbMF0pO1xuICAgIHRoaXMudmFsdWVBY2Nlc3NvcigoZDogYW55KSA9PiB0aGlzLm9yaWdpbmFsS2V5QWNjZXNzb3IoZClbMV0pO1xuICAgIHRoaXMuY29sb3JBY2Nlc3NvcigoKSA9PiB0aGlzLl9ncm91cE5hbWUpO1xuICAgIHRoaXMubGluZXMgPSAoKSA9PiB0aGlzO1xuICAgIHRoaXMuX2V4aXN0ZW5jZUFjY2Vzc29yID0gKGQ6IGFueSkgPT4ge1xuICAgICAgcmV0dXJuIGQudmFsdWUgPyBkLnZhbHVlIDogZC55O1xuICAgIH07XG5cbiAgICB0aGlzLl9zeW1ib2wuc2l6ZSgoZDogYW55LCBpOiBudW1iZXIpID0+IHtcbiAgICAgIGlmICghdGhpcy5fZXhpc3RlbmNlQWNjZXNzb3IoZCkpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2VtcHR5U2l6ZTtcbiAgICAgIH0gZWxzZSBpZiAodGhpcy5fZmlsdGVyZWRbaV0pIHtcbiAgICAgICAgcmV0dXJuIE1hdGgucG93KHRoaXMuX3N5bWJvbFNpemUsIDIpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIE1hdGgucG93KHRoaXMuX2V4Y2x1ZGVkU2l6ZSwgMik7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBfZmlsdGVyKGZpbHRlcj86IGFueSkge1xuICAgIGlmICghZmlsdGVyKSB7XG4gICAgICByZXR1cm4gdGhpcy5fX2ZpbHRlcigpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5fX2ZpbHRlcihmaWx0ZXJzLlJhbmdlZFR3b0RpbWVuc2lvbmFsRmlsdGVyKGZpbHRlcikpO1xuICB9XG5cbiAgcGxvdERhdGEoem9vbVg/OiBhbnksIHpvb21ZPzogYW55KSB7XG4gICAgY29uc3QgY2hhcnRMaXN0OiBhbnlbXSA9IFtdO1xuICAgIGxldCB0eXBlO1xuICAgIGxldCBheGlzTGFiZWw7XG4gICAgbGV0IHlBeGlzTGFiZWw7XG4gICAgbGV0IGVycm9yQmFyO1xuICAgIGxldCBjaGFydE9wdGlvbjogYW55O1xuICAgIGxldCBheGlzV2lkdGg6IGFueTtcbiAgICBsZXQgY2xpcFBhdGg7XG4gICAgaWYgKHRoaXMuc3ZnKCkpIHtcbiAgICAgIGNsaXBQYXRoID0gdGhpcy5zdmcoKS5zZWxlY3QoJy5jaGFydC1ib2R5JykuYXR0cignY2xpcC1wYXRoJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNsaXBQYXRoID0gdGhpcy5nKCkuc2VsZWN0KCcuY2hhcnQtYm9keScpLmF0dHIoJ2NsaXAtcGF0aCcpO1xuICAgIH1cbiAgICB0aGlzLmNoYXJ0Qm9keUcoKS5hdHRyKCdjbGlwLXBhdGgnLCBjbGlwUGF0aCk7XG5cbiAgICB0aGlzLm11bHRpT3B0aW9uLmF4aXNPcHRpb24uZm9yRWFjaCgodjogYW55KSA9PiB7XG4gICAgICBpZiAodi5zZXJpZXMpIHtcbiAgICAgICAgY2hhcnRMaXN0LnB1c2godi5zZXJpZXMpO1xuICAgICAgICBpZiAodGhpcy5kYXRhKClbMF0ua2V5WzBdLnRvU3RyaW5nKCkgPT09IHYuc2VyaWVzLnRvU3RyaW5nKCkpIHtcbiAgICAgICAgICB0eXBlID0gdi50eXBlO1xuICAgICAgICAgIGF4aXNMYWJlbCA9IHYuYXhpc0xhYmVsO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLl9ncm91cE5hbWUgPT09IHYuc2VyaWVzKSB7XG4gICAgICAgICAgeUF4aXNMYWJlbCA9IHYuYXhpc0xhYmVsO1xuICAgICAgICAgIGVycm9yQmFyID0gdi5lcnJvckJhcjtcbiAgICAgICAgICBjaGFydE9wdGlvbiA9IHY7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcblxuICAgIGlmIChjaGFydE9wdGlvbikge1xuICAgICAgLy8gc3RhY2tzIOqwgCDsnojsnLzrqbQgc3RhY2sg7ISk7KCVXG4gICAgICBpZiAoY2hhcnRPcHRpb24uc3RhY2tzKSB7XG4gICAgICAgIGNvbnN0IF9zdGFja3M6IGFueSA9IFtdO1xuICAgICAgICBjb25zdCBzZWxfc3RhY2sgPSAoKGtleTogYW55KSA9PiAoZDogYW55KSA9PiBkLnZhbHVlW2tleV0pO1xuICAgICAgICBjaGFydE9wdGlvbi5zdGFja3MuZm9yRWFjaCgoZDogYW55KSA9PiB7XG4gICAgICAgICAgY29uc3QgbGF5ZXIgPSB7Z3JvdXA6IHRoaXMuZ3JvdXAoKSwgbmFtZTogZCwgYWNjZXNzb3I6IHNlbF9zdGFja307XG4gICAgICAgICAgX3N0YWNrcy5wdXNoKGxheWVyKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuZGF0YSA9ICgpID0+IHtcbiAgICAgICAgICBjb25zdCBsYXllcnMgPSBfc3RhY2tzLmZpbHRlcigobDogYW55KSA9PiAhbC5oaWRkZW4pO1xuICAgICAgICAgIGlmICghbGF5ZXJzLmxlbmd0aCkge1xuICAgICAgICAgICAgcmV0dXJuIFtdO1xuICAgICAgICAgIH1cbiAgICAgICAgICBsYXllcnMuZm9yRWFjaCgobGF5ZXI6IGFueSwgbGF5ZXJJZHg6IGFueSkgPT4ge1xuICAgICAgICAgICAgbGF5ZXIubmFtZSA9IFN0cmluZyhsYXllci5uYW1lIHx8IGxheWVySWR4KTtcbiAgICAgICAgICAgIGNvbnN0IGFsbFZhbHVlcyA9IGxheWVyLmdyb3VwLmFsbCgpLm1hcCgoZDogYW55LCBpOiBudW1iZXIpID0+IHtcbiAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICB4OiB0aGlzLmtleUFjY2Vzc29yKCkoZCwgaSksXG4gICAgICAgICAgICAgICAgeTogbGF5ZXIuaGlkZGVuID8gbnVsbCA6IHNlbF9zdGFjayhsYXllci5uYW1lKShkKSxcbiAgICAgICAgICAgICAgICBkYXRhOiBkLFxuICAgICAgICAgICAgICAgIGxheWVyOiBsYXllci5uYW1lLFxuICAgICAgICAgICAgICAgIGhpZGRlbjogbGF5ZXIuaGlkZGVuXG4gICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGxheWVyLmRvbWFpblZhbHVlcyA9IGFsbFZhbHVlcztcbiAgICAgICAgICAgIGxheWVyLnZhbHVlcyA9IGFsbFZhbHVlcztcbiAgICAgICAgICAgIGxheWVyWydrZXknXSA9IGxheWVyLmdyb3VwLmFsbCgpWzBdLmtleTtcbiAgICAgICAgICB9KTtcblxuICAgICAgICAgIGNvbnN0IHY0ZGF0YSA9IGxheWVyc1swXS52YWx1ZXMubWFwKCh2OiBhbnksIGk6IG51bWJlcikgPT4ge1xuICAgICAgICAgICAgY29uc3QgY29sID0ge3g6IHYueH07XG4gICAgICAgICAgICBsYXllcnMuZm9yRWFjaCgobGF5ZXI6IGFueSkgPT4ge1xuICAgICAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICAgIGNvbFtsYXllci5uYW1lXSA9IGxheWVyLnZhbHVlc1tpXS55O1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm4gY29sO1xuICAgICAgICAgIH0pO1xuICAgICAgICAgIGNvbnN0IGtleXMgPSBsYXllcnMubWFwKChsYXllcjogYW55KSA9PiBsYXllci5uYW1lKTtcbiAgICAgICAgICBjb25zdCB2NHJlc3VsdCA9IGQzLnN0YWNrKCkua2V5cyhrZXlzKSh2NGRhdGEpO1xuICAgICAgICAgIHY0cmVzdWx0LmZvckVhY2goKHNlcmllcywgaSkgPT4ge1xuICAgICAgICAgICAgc2VyaWVzLmZvckVhY2goKHlzLCBqKSA9PiB7XG4gICAgICAgICAgICAgIGxheWVyc1tpXS52YWx1ZXNbal0ueTAgPSB5c1swXTtcbiAgICAgICAgICAgICAgbGF5ZXJzW2ldLnZhbHVlc1tqXS55MSA9IHlzWzFdO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSk7XG4gICAgICAgICAgcmV0dXJuIGxheWVycztcbiAgICAgICAgfTtcbiAgICAgIH1cblxuICAgICAgLy8gYm9vbGVhbiDsnbzrlYwg7ISk7KCVXG4gICAgICBpZiAodHlwZSA9PT0gJ2Jvb2xlYW4nKSB7XG4gICAgICAgIGlmICghY2hhcnRPcHRpb24uc3ltYm9sKSB7XG4gICAgICAgICAgY2hhcnRPcHRpb24uc3ltYm9sID0gJ3NxdWFyZSc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFjaGFydE9wdGlvbi5zeW1ib2wpIHtcbiAgICAgICAgICBjaGFydE9wdGlvbi5zeW1ib2wgPSAnc3F1YXJlJztcbiAgICAgICAgfVxuICAgICAgICBpZiAoIWNoYXJ0T3B0aW9uLmdhcCkge1xuICAgICAgICAgIGNoYXJ0T3B0aW9uLmdhcCA9IDU7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFjaGFydE9wdGlvbi5zaXplKSB7XG4gICAgICAgICAgY2hhcnRPcHRpb24uc2l6ZSA9IDc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFjaGFydE9wdGlvbi5saW5lV2lkdGgpIHtcbiAgICAgICAgICBjaGFydE9wdGlvbi5saW5lV2lkdGggPSAxLjU7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgY29uc3QgeSA9IGQzLnNjYWxlTGluZWFyKCkucmFuZ2UoW3RoaXMueUF4aXNIZWlnaHQoKSwgMF0pO1xuICAgICAgY29uc3QgeUF4aXMgPSBkMy5heGlzUmlnaHQoeSkudGlja3MoMTApO1xuICAgICAgaWYgKGNoYXJ0T3B0aW9uLnRpY2tGb3JtYXQpIHtcbiAgICAgICAgeUF4aXMudGlja0Zvcm1hdChjaGFydE9wdGlvbi50aWNrRm9ybWF0KTtcbiAgICAgIH1cbiAgICAgIGlmIChjaGFydE9wdGlvbi50aWNrcykge1xuICAgICAgICB5QXhpcy50aWNrcyhjaGFydE9wdGlvbi50aWNrcyk7XG4gICAgICB9XG5cbiAgICAgIC8vIHggZG9tYWluIOyEpOyglVxuICAgICAgaWYgKHpvb21YKSB7XG4gICAgICAgIHRoaXMueCgpLmRvbWFpbih6b29tWCk7XG4gICAgICB9XG5cbiAgICAgIC8vIOuPhOuplOyduOyXkCDtlbTri7ntlZjripQg642w7J207YSw66eMIOywvuq4sOq4sFxuICAgICAgY29uc3QgZGF0YTogYW55ID0gW107XG4gICAgICBsZXQgZG9tYWluID0gdGhpcy54KCkuZG9tYWluKCk7XG4gICAgICB0aGlzLmRhdGEoKS5mb3JFYWNoKCh2OiBhbnkpID0+IHtcbiAgICAgICAgY29uc3QgeCA9IHYua2V5WzBdO1xuICAgICAgICBpZiAoZG9tYWluWzBdIDw9IHggJiYgZG9tYWluWzFdID49IHgpIHtcbiAgICAgICAgICBkYXRhLnB1c2godik7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgICAvLyB5IGRvbWFpbiDshKTsoJVcbiAgICAgIGxldCB5RG9tYWluO1xuICAgICAgaWYgKHpvb21ZKSB7IC8vIHpvb20gaW4g7J2865WMXG4gICAgICAgIGRvbWFpbiA9IHRoaXMuX2dyb3VwU2NhbGVbdGhpcy5fZ3JvdXBOYW1lXTtcbiAgICAgICAgY29uc3QgYXJlYSA9IChkb21haW5bMF0gLSBkb21haW5bMF0pICsgKGRvbWFpblsxXSAtIGRvbWFpblswXSk7XG5cbiAgICAgICAgaWYgKHR5cGUgPT09ICdib29sZWFuJykge1xuICAgICAgICAgIHkuZG9tYWluKFstMC41LCAxLjVdKTtcbiAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgeUF4aXMudGlja3MoMikudGlja0Zvcm1hdCgoZDogYW55KSA9PiB7XG4gICAgICAgICAgICBpZiAoIWQpIHtcbiAgICAgICAgICAgICAgcmV0dXJuICdGQUlMJztcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZCA9PT0gMSkge1xuICAgICAgICAgICAgICByZXR1cm4gJ1BBU1MnO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSBpZiAoYXhpc0xhYmVsID09PSAnRVZFTlQnKSB7XG4gICAgICAgICAgeS5kb21haW4oZG9tYWluKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB5RG9tYWluID0gW1xuICAgICAgICAgICAgKGFyZWEgLyB6b29tWVswXSkgKyBkb21haW5bMF0gKyAoY2hhcnRPcHRpb24uZ2FwID8gLWNoYXJ0T3B0aW9uLmdhcCA6IDApLFxuICAgICAgICAgICAgKGFyZWEgLyB6b29tWVsxXSkgKyBkb21haW5bMF0gKyAoY2hhcnRPcHRpb24uZ2FwID8gY2hhcnRPcHRpb24uZ2FwIDogMClcbiAgICAgICAgICBdO1xuICAgICAgICAgIHkuZG9tYWluKFtcbiAgICAgICAgICAgIChhcmVhIC8gem9vbVlbMF0pICsgZG9tYWluWzBdICsgKGNoYXJ0T3B0aW9uLmdhcCA/IC1jaGFydE9wdGlvbi5nYXAgOiAwKSxcbiAgICAgICAgICAgIChhcmVhIC8gem9vbVlbMV0pICsgZG9tYWluWzBdICsgKGNoYXJ0T3B0aW9uLmdhcCA/IGNoYXJ0T3B0aW9uLmdhcCA6IDApXG4gICAgICAgICAgXSk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgZG9tID0geS5kb21haW4oKTtcbiAgICAgIH0gZWxzZSBpZiAoIXpvb21YICYmICF6b29tWSAmJiB0aGlzLnlPcmlnaW5hbERvbWFpbiAmJiB0aGlzLnlPcmlnaW5hbERvbWFpbigpKSB7XG4gICAgICAgIHkuZG9tYWluKHRoaXMueU9yaWdpbmFsRG9tYWluKCkpO1xuICAgICAgfSBlbHNlIHsgLy8gem9vbSBvdXQg7J2865WMXG4gICAgICAgIGlmICh0aGlzLm11bHRpT3B0aW9uLmF4aXNPcHRpb24pIHtcbiAgICAgICAgICB0aGlzLm11bHRpT3B0aW9uLmF4aXNPcHRpb24uZm9yRWFjaCgodjogYW55KSA9PiB7XG4gICAgICAgICAgICBpZiAodGhpcy5fZ3JvdXBOYW1lID09PSB2LnNlcmllcykge1xuICAgICAgICAgICAgICBkb21haW4gPSB2LmRvbWFpbjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodHlwZSA9PT0gJ2Jvb2xlYW4nKSB7XG4gICAgICAgICAgeS5kb21haW4oWy0wLjUsIDEuNV0pO1xuICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICB5QXhpcy50aWNrcygyKS50aWNrRm9ybWF0KChkOiBhbnkpID0+IHtcbiAgICAgICAgICAgIGlmICghZCkge1xuICAgICAgICAgICAgICByZXR1cm4gJ0ZBSUwnO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChkID09PSAxKSB7XG4gICAgICAgICAgICAgIHJldHVybiAnUEFTUyc7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIGlmIChheGlzTGFiZWwgPT09ICdFVkVOVCcpIHtcbiAgICAgICAgICB5LmRvbWFpbihkb21haW4pO1xuICAgICAgICB9IGVsc2UgaWYgKGRvbWFpbikge1xuICAgICAgICAgIGNvbnN0IGRvbSA9IFtkb21haW5bMF0gKyAoY2hhcnRPcHRpb24uZ2FwID8gLWNoYXJ0T3B0aW9uLmdhcCA6IDApLCBkb21haW5bMV0gKyAoY2hhcnRPcHRpb24uZ2FwID8gY2hhcnRPcHRpb24uZ2FwIDogMCldO1xuICAgICAgICAgIHkuZG9tYWluKGRvbSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgY29uc3QgZG9tID0gW1xuICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgZDMubWluKGRhdGEsIChkOiBhbnkpID0+ICB0eXBlb2YgZC52YWx1ZSA9PT0gJ29iamVjdCcgPyBkLnZhbHVlLnZhbHVlIDogZC52YWx1ZSkgKyAoY2hhcnRPcHRpb24uZ2FwID8gLWNoYXJ0T3B0aW9uLmdhcCA6IDApLFxuICAgICAgICAgICAgZDMubWF4KGRhdGEsIChkOiBhbnkpID0+IHR5cGVvZiBkLnZhbHVlID09PSAnb2JqZWN0JyA/IGQudmFsdWUudmFsdWUgOiBkLnZhbHVlKSArIChjaGFydE9wdGlvbi5nYXAgPyBjaGFydE9wdGlvbi5nYXAgOiAwKVxuICAgICAgICAgIF07XG4gICAgICAgICAgeS5kb21haW4oZG9tKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICB0aGlzLl9sb2NhdG9yID0gKGQ6IGFueSkgPT4ge1xuICAgICAgICBsZXQgcm90YXRlID0gJyc7XG4gICAgICAgIGlmIChjaGFydE9wdGlvbi5zeW1ib2xSb3RhdGUpIHtcbiAgICAgICAgICByb3RhdGUgPSAnIHJvdGF0ZSgnICsgY2hhcnRPcHRpb24uc3ltYm9sUm90YXRlICsgJyknO1xuICAgICAgICB9XG4gICAgICAgIGxldCBiYW5kd2lkdGggPSAwO1xuICAgICAgICBpZiAodGhpcy54KCkuYmFuZHdpZHRoKSB7XG4gICAgICAgICAgYmFuZHdpZHRoID0gdGhpcy54KCkuYmFuZHdpZHRoKCkgLyAyO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGQua2V5KSB7XG4gICAgICAgICAgbGV0IGNoZWNrID0gdGhpcy55KCkodGhpcy52YWx1ZUFjY2Vzc29yKCkoZCkpO1xuICAgICAgICAgIGlmIChpc05hTihjaGVjaykpIHtcbiAgICAgICAgICAgIGNoZWNrID0gMDtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuICd0cmFuc2xhdGUoJyArICh0aGlzLngoKSh0aGlzLmtleUFjY2Vzc29yKCkoZCkpICsgYmFuZHdpZHRoKSArICcsJyArIGNoZWNrICsgJyknICsgcm90YXRlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGxldCBjaGVjayA9IHkoZC55KTtcbiAgICAgICAgICBpZiAoaXNOYU4oY2hlY2spKSB7XG4gICAgICAgICAgICBjaGVjayA9IDA7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiAndHJhbnNsYXRlKCcgKyAodGhpcy54KCkoZC54KSArIGJhbmR3aWR0aCkgKyAnLCcgKyBjaGVjayArICcpJyArIHJvdGF0ZTtcbiAgICAgICAgfVxuICAgICAgfTtcblxuICAgICAgdGhpcy5fYW5ub3RhdGVMb2NhdGlvbiA9IChkOiBhbnkpID0+IHtcbiAgICAgICAgbGV0IHJvdGF0ZSA9ICcnO1xuICAgICAgICBpZiAoY2hhcnRPcHRpb24uc3ltYm9sUm90YXRlKSB7XG4gICAgICAgICAgcm90YXRlID0gJyByb3RhdGUoJyArIGNoYXJ0T3B0aW9uLnN5bWJvbFJvdGF0ZSArICcpJztcbiAgICAgICAgfVxuICAgICAgICBpZiAoZC5rZXkpIHtcbiAgICAgICAgICBsZXQgY2hlY2sgPSB0aGlzLnkoKSh0aGlzLnZhbHVlQWNjZXNzb3IoKShkKSk7XG4gICAgICAgICAgaWYgKGlzTmFOKGNoZWNrKSkge1xuICAgICAgICAgICAgY2hlY2sgPSAwO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gJ3RyYW5zbGF0ZSgnICsgdGhpcy54KCkodGhpcy5rZXlBY2Nlc3NvcigpKGQpKSArICcsJyArIGNoZWNrICsgJyknICsgcm90YXRlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGxldCBjaGVjayA9IHkoZC55KTtcbiAgICAgICAgICBpZiAoaXNOYU4oY2hlY2spKSB7XG4gICAgICAgICAgICBjaGVjayA9IDA7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiAndHJhbnNsYXRlKCcgKyAodGhpcy54KCkoZC54KSAtIDcpICsgJywnICsgKGNoZWNrIC0gMTApICsgJyknICsgcm90YXRlO1xuICAgICAgICB9XG4gICAgICB9O1xuXG4gICAgICBpZiAoIXRoaXMuX2dyb3VwU2NhbGUpIHtcbiAgICAgICAgdGhpcy5fZ3JvdXBTY2FsZSA9IHt9O1xuICAgICAgfVxuICAgICAgdGhpcy5fZ3JvdXBTY2FsZVt0aGlzLl9ncm91cE5hbWVdID0geS5kb21haW4oKTtcblxuICAgICAgLy8gWSBBeGlzIOq3uOumrOq4sFxuICAgICAgbGV0IGF4aXNQYWRkaW5nID0gMDtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY2hhcnRMaXN0LmluZGV4T2YodGhpcy5fZ3JvdXBOYW1lKTsgaSsrKSB7XG4gICAgICAgIGlmIChpKSB7XG4gICAgICAgICAgYXhpc1BhZGRpbmcgKz0gdGhpcy5tdWx0aU9wdGlvbi5heGlzT3B0aW9uW2ldLndpZHRoID8gdGhpcy5tdWx0aU9wdGlvbi5heGlzT3B0aW9uW2ldLndpZHRoICsgMzUgOiAwO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIGNoYXJ0IOq3uOumrOq4sFxuICAgICAgY29uc3QgdmFsQWNjZXNzb3IgPSB0aGlzLnZhbHVlQWNjZXNzb3IoKTtcbiAgICAgIGxldCBkcmF3RGF0YSA9IHRoaXMuZGF0YSgpO1xuICAgICAgaWYgKCFjaGFydE9wdGlvbi5zdGFja3MpIHtcbiAgICAgICAgZHJhd0RhdGEgPSBbe1xuICAgICAgICAgIGdyb3VwOiB7XG4gICAgICAgICAgICBhbGw6ICgpID0+IHRoaXMuZGF0YSgpXG4gICAgICAgICAgfSxcbiAgICAgICAgICBuYW1lOiB0aGlzLmRhdGEoKVswXS5rZXlbMV0udG9TdHJpbmcoKSxcbiAgICAgICAgICB2YWx1ZXM6IHRoaXMuZGF0YSgpLm1hcCgoZDogYW55LCBpOiBudW1iZXIpID0+IHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgIHg6IHRoaXMua2V5QWNjZXNzb3IoKShkLCBpKSxcbiAgICAgICAgICAgICAgeTogdmFsQWNjZXNzb3IoZCwgaSksXG4gICAgICAgICAgICAgIHo6IGQudmFsdWUueixcbiAgICAgICAgICAgICAgZGF0YTogZCxcbiAgICAgICAgICAgICAgbGF5ZXI6IGQua2V5WzFdLFxuICAgICAgICAgICAgICBoaWRkZW46IHVuZGVmaW5lZFxuICAgICAgICAgICAgfTtcbiAgICAgICAgICB9KVxuICAgICAgICB9XTtcbiAgICAgIH1cblxuICAgICAgdGhpcy5kcmF3Q2hhcnQodHlwZSwgeSwgZHJhd0RhdGEsIGNoYXJ0T3B0aW9uLCB6b29tWCwgeURvbWFpbik7XG5cbiAgICAgIGlmICghY2hhcnRPcHRpb24uaGlkZSkge1xuICAgICAgICBjb25zdCBheGlzID0gY2hhcnRMaXN0LmluZGV4T2YodGhpcy5fZ3JvdXBOYW1lKSA/IHlBeGlzIDogZDMuYXhpc0xlZnQoeSkudGlja3MoMTApO1xuICAgICAgICBpZiAoY2hhcnRPcHRpb24udGlja0Zvcm1hdCkge1xuICAgICAgICAgIGF4aXMudGlja0Zvcm1hdChjaGFydE9wdGlvbi50aWNrRm9ybWF0KTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoY2hhcnRPcHRpb24udGlja3MpIHtcbiAgICAgICAgICBheGlzLnRpY2tzKGNoYXJ0T3B0aW9uLnRpY2tzKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBheGlzQ2xhc3MgPSB0aGlzLm11bHRpT3B0aW9uLmF4aXNPcHRpb24uZmlsdGVyKChkOiBhbnkpID0+ICFkLmhpZGUpLm1hcCgoZDogYW55KSA9PiBkLnNlcmllcykuaW5kZXhPZih0aGlzLl9ncm91cE5hbWUpO1xuXG4gICAgICAgIGNvbnN0IGNoYXJ0V2l0aCA9IHRoaXMucmVuZGVyWUF4aXNBdChheGlzQ2xhc3NcbiAgICAgICAgICAsIGF4aXNcbiAgICAgICAgICAsIHRoaXMud2lkdGgoKSAtIHRoaXMubWFyZ2lucygpLnJpZ2h0ICsgYXhpc1BhZGRpbmcpO1xuXG5cbiAgICAgICAgYXhpc1dpZHRoID0gdGhpcy5yZW5kZXJZQXhpc0F0KGF4aXNDbGFzc1xuICAgICAgICAgICwgYXhpc1xuICAgICAgICAgICwgdGhpcy53aWR0aCgpIC0gdGhpcy5tYXJnaW5zKCkucmlnaHQgKyBheGlzUGFkZGluZykgfHwgMDtcblxuICAgICAgICAvLyBsYWJlbFxuICAgICAgICB0aGlzLnJlbmRlcllBeGlzTGFiZWwoYXhpc0NsYXNzXG4gICAgICAgICAgLCB5QXhpc0xhYmVsXG4gICAgICAgICAgLCA5MFxuICAgICAgICAgICwgdGhpcy53aWR0aCgpIC0gdGhpcy5tYXJnaW5zKCkucmlnaHQgKyBheGlzV2lkdGggKyA1ICsgYXhpc1BhZGRpbmcpO1xuICAgICAgfVxuXG4gICAgICAvLyBzZXQgeSByaWdodCBheGlzIHdpZHRoXG4gICAgICB0aGlzLm11bHRpT3B0aW9uLmF4aXNPcHRpb24uZm9yRWFjaCgodjogYW55KSA9PiB7XG4gICAgICAgIGlmICh0aGlzLl9ncm91cE5hbWUgPT09IHYuc2VyaWVzKSB7XG4gICAgICAgICAgdi53aWR0aCA9IGF4aXNXaWR0aDtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgaWYgKCF0aGlzLnlPcmlnaW5hbERvbWFpbikge1xuICAgICAgdGhpcy55T3JpZ2luYWxEb21haW4gPSAoKSA9PiB7XG4gICAgICAgIGxldCBkb21haW47XG4gICAgICAgIHRoaXMubXVsdGlPcHRpb24uYXhpc09wdGlvbi5mb3JFYWNoKCh2OiBhbnkpID0+IHtcbiAgICAgICAgICBpZiAodGhpcy5fZ3JvdXBOYW1lID09PSB2LnNlcmllcykge1xuICAgICAgICAgICAgZG9tYWluID0gdi5kb21haW47XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIGRvbWFpbjtcbiAgICAgIH07XG4gICAgfVxuICB9XG5cbiAgY2xpY2soY2xpY2s/OiBhbnkpIHtcbiAgICBpZiAoIWNsaWNrKSB7XG4gICAgICByZXR1cm4gdGhpcy5fY2xpY2s7XG4gICAgfVxuICAgIHRoaXMuX2NsaWNrID0gY2xpY2s7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBkZWZpbmVkKGRlZmluZWQ/OiBhbnkpIHtcbiAgICBpZiAoIWRlZmluZWQpIHtcbiAgICAgIHJldHVybiB0aGlzLl9kZWZpbmVkO1xuICAgIH1cbiAgICB0aGlzLl9kZWZpbmVkID0gZGVmaW5lZDtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIGRhc2hTdHlsZShkYXNoU3R5bGU/OiBhbnkpIHtcbiAgICBpZiAoIWRhc2hTdHlsZSkge1xuICAgICAgcmV0dXJuIHRoaXMuX2Rhc2hTdHlsZTtcbiAgICB9XG4gICAgdGhpcy5fZGFzaFN0eWxlID0gZGFzaFN0eWxlO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgcmVuZGVyWUF4aXNMYWJlbChheGlzQ2xhc3M/OiBhbnksIHRleHQ/OiBhbnksIHJvdGF0aW9uPzogYW55LCBsYWJlbFhQb3NpdGlvbj86IGFueSkge1xuICAgIGxhYmVsWFBvc2l0aW9uID0gbGFiZWxYUG9zaXRpb24gfHwgMDtcbiAgICBpZiAoYXhpc0NsYXNzICYmIHRoaXMuc3ZnKCkpIHtcbiAgICAgIGxldCBheGlzWUxhYiA9IHRoaXMuc3ZnKCkuc2VsZWN0QWxsKCd0ZXh0LicgKyAneS1heGlzLWxhYmVsJyArICcueScgKyBheGlzQ2xhc3MgKyAnLWxhYmVsJyk7XG4gICAgICBjb25zdCBsYWJlbFlQb3NpdGlvbiA9ICgodGhpcy5tYXJnaW5zKCkudG9wICsgdGhpcy55QXhpc0hlaWdodCgpKSAvIDIpO1xuICAgICAgaWYgKGF4aXNZTGFiLmVtcHR5KCkgJiYgdGV4dCkge1xuICAgICAgICBheGlzWUxhYiA9IGQzLnNlbGVjdCh0aGlzLmcoKS5fZ3JvdXBzWzBdWzBdLnBhcmVudE5vZGUpLmFwcGVuZCgndGV4dCcpXG4gICAgICAgICAgLmF0dHIoJ3RyYW5zZm9ybScsICd0cmFuc2xhdGUoJyArIGxhYmVsWFBvc2l0aW9uICsgJywnICsgbGFiZWxZUG9zaXRpb24gKyAnKSxyb3RhdGUoJyArIHJvdGF0aW9uICsgJyknKVxuICAgICAgICAgIC5hdHRyKCdjbGFzcycsICd5LWF4aXMtbGFiZWwnICsgJyB5JyArIGF4aXNDbGFzcyArICctbGFiZWwnKVxuICAgICAgICAgIC5hdHRyKCd0ZXh0LWFuY2hvcicsICdtaWRkbGUnKVxuICAgICAgICAgIC50ZXh0KHRleHQpO1xuICAgICAgfVxuICAgICAgaWYgKHRleHQgJiYgYXhpc1lMYWIudGV4dCgpICE9PSB0ZXh0KSB7XG4gICAgICAgIGF4aXNZTGFiLnRleHQodGV4dCk7XG4gICAgICB9XG4gICAgICB0cmFuc2l0aW9uKGF4aXNZTGFiLCB0aGlzLnRyYW5zaXRpb25EdXJhdGlvbigpLCB0aGlzLnRyYW5zaXRpb25EZWxheSgpKVxuICAgICAgICAuYXR0cigndHJhbnNmb3JtJywgJ3RyYW5zbGF0ZSgnICsgbGFiZWxYUG9zaXRpb24gKyAnLCcgKyBsYWJlbFlQb3NpdGlvbiArICcpLHJvdGF0ZSgnICsgcm90YXRpb24gKyAnKScpO1xuICAgIH1cbiAgfVxuXG4gIHJlbmRlcllBeGlzQXQoYXhpc0NsYXNzOiBhbnksIGF4aXM6IGFueSwgcG9zaXRpb246IGFueSkge1xuICAgIGxldCBheGlzWUc7XG4gICAgaWYgKGF4aXNDbGFzcyAmJiB0aGlzLnN2ZygpKSB7XG4gICAgICBheGlzWUcgPSB0aGlzLnN2ZygpLnNlbGVjdEFsbCgnZy4nICsgJ3knICsgYXhpc0NsYXNzKTtcbiAgICAgIGlmIChheGlzWUcuZW1wdHkoKSkge1xuICAgICAgICBheGlzWUcgPSBkMy5zZWxlY3QodGhpcy5nKCkuX2dyb3Vwc1swXVswXS5wYXJlbnROb2RlKS5hcHBlbmQoJ2cnKVxuICAgICAgICAgIC5hdHRyKCdjbGFzcycsICdheGlzIHktYXhpcy1hdCAnICsgJ3knICsgYXhpc0NsYXNzKVxuICAgICAgICAgIC5hdHRyKCd0cmFuc2Zvcm0nLCAndHJhbnNsYXRlKCcgKyBwb3NpdGlvbiArICcsJyArIHRoaXMubWFyZ2lucygpLnRvcCArICcpJyk7XG4gICAgICB9XG5cbiAgICAgIHRyYW5zaXRpb24oYXhpc1lHLCB0aGlzLnRyYW5zaXRpb25EdXJhdGlvbigpLCB0aGlzLnRyYW5zaXRpb25EZWxheSgpKVxuICAgICAgICAuYXR0cigndHJhbnNmb3JtJywgJ3RyYW5zbGF0ZSgnICsgcG9zaXRpb24gKyAnLCcgKyB0aGlzLm1hcmdpbnMoKS50b3AgKyAnKScpXG4gICAgICAgIC5jYWxsKGF4aXMpO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAodGhpcy5zdmcoKSkge1xuICAgICAgICBheGlzWUcgPSB0aGlzLnN2ZygpLnNlbGVjdCgnZy4nICsgJ3knKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGF4aXNZRyA9IGQzLnNlbGVjdCh0aGlzLmcoKS5fZ3JvdXBzWzBdWzBdLnBhcmVudE5vZGUpLnNlbGVjdCgnZy4nICsgJ3knKTtcbiAgICAgIH1cblxuICAgICAgdHJhbnNpdGlvbihheGlzWUcsIHRoaXMudHJhbnNpdGlvbkR1cmF0aW9uKCksIHRoaXMudHJhbnNpdGlvbkRlbGF5KCkpLmNhbGwoYXhpcyk7XG4gICAgfVxuXG4gICAgaWYgKGF4aXNZRyAmJiBheGlzWUcuX2dyb3Vwc1swXVswXSkge1xuICAgICAgcmV0dXJuIGF4aXNZRy5fZ3JvdXBzWzBdWzBdLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLndpZHRoO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gMDtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGRyYXdDaGFydChjaGFydDogYW55LCB5OiBhbnksIGRhdGE6IGFueSwgb3B0aW9uOiBhbnksIHpvb21YOiBhbnksIHpvb21ZOiBhbnkpIHtcbiAgICBpZiAoY2hhcnQgPT09ICdsaW5lU3ltYm9sJykge1xuICAgICAgLyotLS0tLS0tLS0gbGluZSBTdGFydC0tLS0tLS0tLS0qL1xuICAgICAgY29uc3QgY2hhcnRCb2R5ID0gdGhpcy5jaGFydEJvZHlHKCk7XG4gICAgICBsZXQgbGF5ZXJzTGlzdCA9IGNoYXJ0Qm9keS5zZWxlY3RBbGwoJ2cuc3RhY2stbGlzdCcpO1xuICAgICAgaWYgKGxheWVyc0xpc3QuZW1wdHkoKSkge1xuICAgICAgICBsYXllcnNMaXN0ID0gY2hhcnRCb2R5LmFwcGVuZCgnZycpLmF0dHIoJ2NsYXNzJywgJ3N0YWNrLWxpc3QnKTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IGxheWVycyA9IGxheWVyc0xpc3Quc2VsZWN0QWxsKCdnLnN0YWNrJykuZGF0YShkYXRhKTtcbiAgICAgIGNvbnN0IGxheWVyc0VudGVyID0gbGF5ZXJzLmVudGVyKCkuYXBwZW5kKCdnJykuYXR0cignY2xhc3MnLCAoZDogYW55LCBpOiBudW1iZXIpID0+ICdzdGFjayAnICsgJ18nICsgaSk7XG4gICAgICB0aGlzLmRyYXdMaW5lKGxheWVyc0VudGVyLCBsYXllcnMsIHksIG9wdGlvbiwgb3B0aW9uLnNtb290aCk7XG4gICAgICAvKi0tLS0tLS0tLSBsaW5lIEVuZC0tLS0tLS0tLS0qL1xuXG4gICAgICAvKi0tLS0tLS0tLSBzeW1ib2wgU3RhcnQtLS0tLS0tLS0tKi9cbiAgICAgIGNvbnN0IGxheWVyczIgPSB0aGlzLmNoYXJ0Qm9keUcoKS5zZWxlY3RBbGwoJ3BhdGguc3ltYm9sJykuZGF0YShkYXRhKTtcbiAgICAgIGxheWVyczIuZW50ZXIoKVxuICAgICAgICAuYXBwZW5kKCdnJylcbiAgICAgICAgLmF0dHIoJ2NsYXNzJywgKGQ6IGFueSwgaTogbnVtYmVyKSA9PiB7XG4gICAgICAgICAgcmV0dXJuICdzdGFjayAnICsgJ18nICsgaTtcbiAgICAgICAgfSk7XG5cbiAgICAgIGRhdGEuZm9yRWFjaCgoZDogYW55LCBpOiBudW1iZXIpID0+IHtcbiAgICAgICAgdGhpcy5yZW5kZXJTeW1ib2woZCwgb3B0aW9uKTtcbiAgICAgIH0pO1xuXG4gICAgICAvLyDstpTqsIDrkJwg642w7J207YSw6rCAIOyeiOycvOuptCDri6Tsi5wg66CM642UXG4gICAgICBpZiAoZGF0YS5sZW5ndGggIT09IGxheWVycy5zaXplKCkpIHtcbiAgICAgICAgdGhpcy5wbG90RGF0YSgpO1xuICAgICAgfVxuICAgICAgLyotLS0tLS0tLS0gc3ltYm9sIEVuZC0tLS0tLS0tLS0qL1xuXG4gICAgICAvLyByZW5kZXJBcmVhIOy2lOqwgFxuICAgICAgaWYgKG9wdGlvbi5yZW5kZXJBcmVhKSB7XG4gICAgICAgIHRoaXMuZHJhd0FyZWEobGF5ZXJzRW50ZXIsIGxheWVycywgeSwgb3B0aW9uLCBvcHRpb24uc21vb3RoID8gIGQzLmN1cnZlTW9ub3RvbmVYIDogZDMuY3VydmVDYXJkaW5hbC50ZW5zaW9uKDEpKTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKGNoYXJ0ID09PSAnc21vb3RoTGluZScpIHtcbiAgICAgIC8qLS0tLS0tLS0tIGxpbmUgU3RhcnQtLS0tLS0tLS0tKi9cbiAgICAgIGNvbnN0IGNoYXJ0Qm9keSA9IHRoaXMuY2hhcnRCb2R5RygpO1xuICAgICAgbGV0IGxheWVyc0xpc3QgPSBjaGFydEJvZHkuc2VsZWN0QWxsKCdnLnN0YWNrLWxpc3QnKTtcbiAgICAgIGlmIChsYXllcnNMaXN0LmVtcHR5KCkpIHtcbiAgICAgICAgbGF5ZXJzTGlzdCA9IGNoYXJ0Qm9keS5hcHBlbmQoJ2cnKS5hdHRyKCdjbGFzcycsICdzdGFjay1saXN0Jyk7XG4gICAgICB9XG4gICAgICBjb25zdCBsYXllcnMgPSBsYXllcnNMaXN0LnNlbGVjdEFsbCgnZy5zdGFjaycpLmRhdGEoZGF0YSk7XG4gICAgICBjb25zdCBsYXllcnNFbnRlciA9IGxheWVycy5lbnRlcigpLmFwcGVuZCgnZycpLmF0dHIoJ2NsYXNzJywgKGQ6IGFueSwgaTogbnVtYmVyKSA9PiAnc3RhY2sgJyArICdfJyArIGkpO1xuICAgICAgdGhpcy5kcmF3TGluZShsYXllcnNFbnRlciwgbGF5ZXJzLCB5LCBvcHRpb24sIHRydWUpO1xuICAgICAgLyotLS0tLS0tLS0gbGluZSBFbmQtLS0tLS0tLS0tKi9cblxuICAgICAgLyotLS0tLS0tLS0gc3ltYm9sIFN0YXJ0LS0tLS0tLS0tLSovXG4gICAgICBjb25zdCBsYXllcnMyID0gdGhpcy5jaGFydEJvZHlHKCkuc2VsZWN0QWxsKCdwYXRoLnN5bWJvbCcpLmRhdGEoZGF0YSk7XG4gICAgICBsYXllcnMyLmVudGVyKClcbiAgICAgICAgLmFwcGVuZCgnZycpXG4gICAgICAgIC5hdHRyKCdjbGFzcycsIChkOiBhbnksIGk6IG51bWJlcikgPT4ge1xuICAgICAgICAgIHJldHVybiAnc3RhY2sgJyArICdfJyArIGk7XG4gICAgICAgIH0pO1xuXG4gICAgICBkYXRhLmZvckVhY2goKGQ6IGFueSwgaTogbnVtYmVyKSA9PiB7XG4gICAgICAgIHRoaXMucmVuZGVyU3ltYm9sKGQsIG9wdGlvbik7XG4gICAgICB9KTtcblxuICAgICAgLy8g7LaU6rCA65CcIOuNsOydtO2EsOqwgCDsnojsnLzrqbQg64uk7IucIOugjOuNlFxuICAgICAgaWYgKGRhdGEubGVuZ3RoICE9PSBsYXllcnMuc2l6ZSgpKSB7XG4gICAgICAgIHRoaXMucGxvdERhdGEoKTtcbiAgICAgIH1cblxuICAgICAgLy8gcmVuZGVyQXJlYSDstpTqsIBcbiAgICAgIGlmIChvcHRpb24ucmVuZGVyQXJlYSkge1xuICAgICAgICB0aGlzLmRyYXdBcmVhKGxheWVyc0VudGVyLCBsYXllcnMsIHksIG9wdGlvbiwgZDMuY3VydmVNb25vdG9uZVgpO1xuICAgICAgfVxuICAgICAgLyotLS0tLS0tLS0gc3ltYm9sIEVuZC0tLS0tLS0tLS0qL1xuICAgIH0gZWxzZSBpZiAoY2hhcnQgPT09ICdsaW5lJykge1xuICAgICAgY29uc3QgY2hhcnRCb2R5ID0gdGhpcy5jaGFydEJvZHlHKCk7XG4gICAgICBsZXQgbGF5ZXJzTGlzdCA9IGNoYXJ0Qm9keS5zZWxlY3RBbGwoJ2cuc3RhY2stbGlzdCcpO1xuICAgICAgaWYgKGxheWVyc0xpc3QuZW1wdHkoKSkge1xuICAgICAgICBsYXllcnNMaXN0ID0gY2hhcnRCb2R5LmFwcGVuZCgnZycpLmF0dHIoJ2NsYXNzJywgJ3N0YWNrLWxpc3QnKTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IGxheWVycyA9IGxheWVyc0xpc3Quc2VsZWN0QWxsKCdnLnN0YWNrJykuZGF0YShkYXRhKTtcbiAgICAgIGNvbnN0IGxheWVyc0VudGVyID0gbGF5ZXJzLmVudGVyKCkuYXBwZW5kKCdnJykuYXR0cignY2xhc3MnLCAoZDogYW55LCBpOiBudW1iZXIpID0+ICdzdGFjayAnICsgJ18nICsgaSk7XG4gICAgICB0aGlzLmRyYXdMaW5lKGxheWVyc0VudGVyLCBsYXllcnMsIHksIG9wdGlvbiwgb3B0aW9uLnNtb290aCk7XG5cbiAgICAgIC8vIOy2lOqwgOuQnCDrjbDsnbTthLDqsIAg7J6I7Jy866m0IOuLpOyLnCDroIzrjZRcbiAgICAgIGlmIChkYXRhLmxlbmd0aCAhPT0gbGF5ZXJzLnNpemUoKSkge1xuICAgICAgICB0aGlzLnBsb3REYXRhKCk7XG4gICAgICB9XG5cbiAgICAgIGlmIChvcHRpb24ucmVuZGVyQXJlYSkge1xuICAgICAgICB0aGlzLmRyYXdBcmVhKGxheWVyc0VudGVyLCBsYXllcnMsIHksIG9wdGlvbiwgb3B0aW9uLnNtb290aCA/ICBkMy5jdXJ2ZU1vbm90b25lWCA6IGQzLmN1cnZlQ2FyZGluYWwudGVuc2lvbigxKSk7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChjaGFydCA9PT0gJ3N0ZXBMaW5lJykge1xuICAgICAgY29uc3QgY2hhcnRCb2R5ID0gdGhpcy5jaGFydEJvZHlHKCk7XG4gICAgICBsZXQgbGF5ZXJzTGlzdCA9IGNoYXJ0Qm9keS5zZWxlY3RBbGwoJ2cuc3RhY2stbGlzdCcpO1xuICAgICAgaWYgKGxheWVyc0xpc3QuZW1wdHkoKSkge1xuICAgICAgICBsYXllcnNMaXN0ID0gY2hhcnRCb2R5LmFwcGVuZCgnZycpLmF0dHIoJ2NsYXNzJywgJ3N0YWNrLWxpc3QnKTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IGxheWVycyA9IGxheWVyc0xpc3Quc2VsZWN0QWxsKCdnLnN0YWNrJykuZGF0YShkYXRhKTtcbiAgICAgIGNvbnN0IGxheWVyc0VudGVyID0gbGF5ZXJzLmVudGVyKCkuYXBwZW5kKCdnJykuYXR0cignY2xhc3MnLCAoZDogYW55LCBpOiBudW1iZXIpID0+ICdzdGFjayAnICsgJ18nICsgaSk7XG4gICAgICB0aGlzLnN0ZXBMaW5lKGxheWVyc0VudGVyLCBsYXllcnMsIHksIG9wdGlvbik7XG4gICAgICBpZiAob3B0aW9uLnJlbmRlckFyZWEpIHtcbiAgICAgICAgdGhpcy5kcmF3QXJlYShsYXllcnNFbnRlciwgbGF5ZXJzLCB5LCBvcHRpb24sIGQzLmN1cnZlU3RlcEFmdGVyKTtcbiAgICAgIH1cblxuICAgICAgLy8g7LaU6rCA65CcIOuNsOydtO2EsOqwgCDsnojsnLzrqbQg64uk7IucIOugjOuNlFxuICAgICAgaWYgKGRhdGEubGVuZ3RoICE9PSBsYXllcnMuc2l6ZSgpKSB7XG4gICAgICAgIHRoaXMucGxvdERhdGEoKTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKGNoYXJ0ID09PSAnc3ltYm9sJyB8fCBjaGFydCA9PT0gJ2Jvb2xlYW4nKSB7XG4gICAgICBpZiAodGhpcy5jaGFydEJvZHlHKCkuc2VsZWN0QWxsKCdwYXRoLnN5bWJvbCcpLmVtcHR5KCkpIHtcbiAgICAgICAgdGhpcy5jaGFydEJvZHlHKCkuYXBwZW5kKCdwYXRoJykuYXR0cignY2xhc3MnLCAnc3ltYm9sJyk7XG4gICAgICB9XG4gICAgICBjb25zdCBsYXllcnMgPSB0aGlzLmNoYXJ0Qm9keUcoKS5zZWxlY3RBbGwoJ3BhdGguc3ltYm9sJykuZGF0YShkYXRhKTtcbiAgICAgIGxheWVycy5lbnRlcigpXG4gICAgICAgIC5hcHBlbmQoJ2cnKVxuICAgICAgICAuYXR0cignY2xhc3MnLCAoZDogYW55LCBpOiBudW1iZXIpID0+ICdzdGFjayAnICsgJ18nICsgaSk7XG5cbiAgICAgIGRhdGEuZm9yRWFjaCgoZDogYW55LCBpOiBudW1iZXIpID0+IHRoaXMucmVuZGVyU3ltYm9sKGQsIG9wdGlvbikpO1xuICAgIH0gZWxzZSBpZiAoY2hhcnQgPT09ICdiYXInKSB7XG4gICAgICBjb25zdCBiYXJzID0gdGhpcy5tdWx0aU9wdGlvbi5heGlzT3B0aW9uLmZpbHRlcigoZDogYW55KSA9PiBkLnR5cGUgPT09ICdiYXInKTtcbiAgICAgIGNvbnN0IGJhckluZGV4ID0gYmFycy5tYXAoKGQ6IGFueSkgPT4gZC5zZXJpZXMpLmluZGV4T2YodGhpcy5fZ3JvdXBOYW1lKTtcbiAgICAgIGlmICh0aGlzLmNoYXJ0Qm9keUcoKS5zZWxlY3RBbGwoJ2cuc3RhY2snKS5lbXB0eSgpKSB7XG4gICAgICAgIHRoaXMuY2hhcnRCb2R5RygpLmFwcGVuZCgnZycpLmF0dHIoJ2NsYXNzJywgJ3N0YWNrIF8wJyk7XG4gICAgICB9XG4gICAgICBjb25zdCBsYXllcnMgPSB0aGlzLmNoYXJ0Qm9keUcoKS5zZWxlY3RBbGwoJ2cuc3RhY2snKS5kYXRhKGRhdGEpO1xuICAgICAgdGhpcy5jYWxjdWxhdGVCYXJXaWR0aCgpO1xuICAgICAgbGF5ZXJzLmVudGVyKClcbiAgICAgICAgLmFwcGVuZCgnZycpXG4gICAgICAgIC5hdHRyKCdjbGFzcycsIChkOiBhbnksIGk6IG51bWJlcikgPT4ge1xuICAgICAgICAgIHJldHVybiAnc3RhY2sgJyArICdfJyArIGk7XG4gICAgICAgIH0pXG4gICAgICAgIC5tZXJnZShsYXllcnMpO1xuXG4gICAgICBjb25zdCBsYXN0ID0gbGF5ZXJzLnNpemUoKSAtIDE7XG4gICAgICBsYXllcnMuZWFjaCgoZDogYW55LCBpOiBudW1iZXIpID0+IHtcbiAgICAgICAgY29uc3QgbGF5ZXIgPSBkMy5zZWxlY3QoZCk7XG4gICAgICAgIHRoaXMucmVuZGVyQmFycyhsYXllcnMsIGksIGQsIHksIG9wdGlvbiwgYmFycywgYmFySW5kZXgpO1xuXG4gICAgICAgIGlmICh0aGlzLnJlbmRlckxhYmVsKCkgJiYgbGFzdCA9PT0gaSkge1xuICAgICAgICAgIHRoaXMucmVuZGVyTGFiZWxzKGxheWVyLCBpLCBkKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSBlbHNlIGlmIChjaGFydCA9PT0gJ3RoZXJtYWwnKSB7XG4gICAgICBjb25zdCB4U3RlcCA9IG9wdGlvbi5nYXAsIHlTdGVwID0gMTtcbiAgICAgIGlmICh6b29tWCAmJiB6b29tWSkge1xuICAgICAgICB0aGlzLngoKS5kb21haW4oW3pvb21YWzBdLCArem9vbVhbMV1dKTtcbiAgICAgICAgeS5kb21haW4oW3pvb21ZWzBdLCB6b29tWVsxXSArIHlTdGVwXSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLngoKS5kb21haW4oW3RoaXMubXVsdGlPcHRpb24ueFJhbmdlWzBdIC0gKHhTdGVwIC8gMiksICt0aGlzLm11bHRpT3B0aW9uLnhSYW5nZVsxXSArICh4U3RlcCAvIDIpXSk7XG4gICAgICAgIHkuZG9tYWluKFtvcHRpb24uZG9tYWluWzBdLCBvcHRpb24uZG9tYWluWzFdICsgeVN0ZXBdKTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgbGF5ZXJzID0gdGhpcy5jaGFydEJvZHlHKCkuc2VsZWN0QWxsKCdyZWN0LnRoZXJtYWwnKS5kYXRhKGRhdGEpO1xuICAgICAgbGF5ZXJzLmVudGVyKClcbiAgICAgICAgLmFwcGVuZCgnZycpXG4gICAgICAgIC5hdHRyKCdjbGFzcycsIChkOiBhbnksIGk6IG51bWJlcikgPT4gJ3N0YWNrICcgKyAnXycgKyBpKTtcblxuICAgICAgZGF0YS5mb3JFYWNoKChkOiBhbnksIGk6IG51bWJlcikgPT4gdGhpcy5yZW5kZXJUaGVybWFsKGQsIG9wdGlvbiwgeFN0ZXAsIHlTdGVwLCB5KSk7XG4gICAgfVxuICB9XG5cbiAgYmFyUGFkZGluZyhiYXJQYWRkaW5nPzogYW55KSB7XG4gICAgaWYgKCFiYXJQYWRkaW5nKSB7XG4gICAgICByZXR1cm4gdGhpcy5fcmFuZ2VCYW5kUGFkZGluZygpO1xuICAgIH1cbiAgICB0aGlzLl9yYW5nZUJhbmRQYWRkaW5nKGJhclBhZGRpbmcpO1xuICAgIHRoaXMuX2dhcCA9IHVuZGVmaW5lZDtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHByaXZhdGUgY2FsY3VsYXRlQmFyV2lkdGgoKSB7XG4gICAgaWYgKHRoaXMuX2JhcldpZHRoID09PSB1bmRlZmluZWQpIHtcbiAgICAgIGNvbnN0IG51bWJlck9mQmFycyA9IHRoaXMueFVuaXRDb3VudCgpO1xuICAgICAgaWYgKHRoaXMuaXNPcmRpbmFsKCkgJiYgdGhpcy5fZ2FwID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgdGhpcy5fYmFyV2lkdGggPSBNYXRoLmZsb29yKHRoaXMueCgpLmJhbmR3aWR0aCgpKTtcbiAgICAgIH0gZWxzZSBpZiAodGhpcy5fZ2FwKSB7XG4gICAgICAgIHRoaXMuX2JhcldpZHRoID0gTWF0aC5mbG9vcigodGhpcy54QXhpc0xlbmd0aCgpIC0gKG51bWJlck9mQmFycyAtIDEpICogdGhpcy5fZ2FwKSAvIG51bWJlck9mQmFycyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLl9iYXJXaWR0aCA9IE1hdGguZmxvb3IodGhpcy54QXhpc0xlbmd0aCgpIC8gKDEgKyB0aGlzLmJhclBhZGRpbmcoKSkgLyBudW1iZXJPZkJhcnMpO1xuICAgICAgfVxuXG4gICAgICBpZiAodGhpcy5fYmFyV2lkdGggPT09IEluZmluaXR5IHx8IGlzTmFOKHRoaXMuX2JhcldpZHRoKSB8fCB0aGlzLl9iYXJXaWR0aCA8IHRoaXMuTUlOX0JBUl9XSURUSCkge1xuICAgICAgICB0aGlzLl9iYXJXaWR0aCA9IHRoaXMuTUlOX0JBUl9XSURUSDtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGRyYXdMaW5lKGxheWVyc0VudGVyOiBhbnksIGxheWVyczogYW55LCB5OiBhbnksIG9wdGlvbjogYW55LCBzbW9vdGg/OiBhbnkpIHtcbiAgICBsZXQgYmFuZHdpZHRoID0gMDtcbiAgICBpZiAodGhpcy54KCkuYmFuZHdpZHRoKSB7XG4gICAgICBiYW5kd2lkdGggPSB0aGlzLngoKS5iYW5kd2lkdGgoKSAvIDI7XG4gICAgfVxuXG4gICAgY29uc3QgbGluZSA9IGQzLmxpbmUoKVxuICAgICAgLngoKGQ6IGFueSkgPT4gdGhpcy54KCkoZC54KSArIGJhbmR3aWR0aClcbiAgICAgIC55KChkOiBhbnkpID0+IHkgPyB5KGQueSkgOiB0aGlzLnkoKShkLnkpKVxuICAgICAgLmN1cnZlKHNtb290aCA/IGQzLmN1cnZlTW9ub3RvbmVYIDogZDMuY3VydmVDYXJkaW5hbC50ZW5zaW9uKDEpKTtcblxuICAgIGlmICh0aGlzLl9kZWZpbmVkKSB7XG4gICAgICBsaW5lLmRlZmluZWQodGhpcy5fZGVmaW5lZCk7XG4gICAgfVxuXG4gICAgY29uc3QgcGF0aCA9IGxheWVyc0VudGVyLmFwcGVuZCgncGF0aCcpLmF0dHIoJ2NsYXNzJywgJ2xpbmUnKS5hdHRyKCdzdHJva2UnLCBvcHRpb24uY29sb3IgPyBvcHRpb24uY29sb3IgOiB0aGlzLmNvbG9yczIuYmluZCh0aGlzKSlcbiAgICAgIC5hdHRyKCdzdHJva2UnLCBvcHRpb24uY29sb3IgPyBvcHRpb24uY29sb3IgOiB0aGlzLmNvbG9yczIuYmluZCh0aGlzKSlcbiAgICAgIC5hdHRyKCdkJywgKGQ6IGFueSkgPT4gdGhpcy5zYWZlRChsaW5lKGQudmFsdWVzKSkpXG4gICAgICAuYXR0cignY2hhcnRLZXknLCAoZDogYW55KSA9PiBkLmtleSlcbiAgICAgIC5zdHlsZSgnc3Ryb2tlLXdpZHRoJywgb3B0aW9uLmxpbmVXaWR0aCArICdweCcpO1xuICAgIGlmIChvcHRpb24uZGFzaFN0eWxlKSB7XG4gICAgICBwYXRoLmF0dHIoJ3N0cm9rZS1kYXNoYXJyYXknLCBvcHRpb24uZGFzaFN0eWxlKTtcbiAgICB9XG5cbiAgICB0cmFuc2l0aW9uKGxheWVycy5zZWxlY3QoJ3BhdGgubGluZScpLCB0aGlzLnRyYW5zaXRpb25EdXJhdGlvbigpLCB0aGlzLnRyYW5zaXRpb25EZWxheSgpKVxuICAgICAgLmF0dHIoJ3N0cm9rZScsIG9wdGlvbi5jb2xvciA/IG9wdGlvbi5jb2xvciA6IHRoaXMuY29sb3JzMi5iaW5kKHRoaXMpKVxuICAgICAgLmF0dHIoJ2QnLCBkID0+IHRoaXMuc2FmZUQobGluZShkLnZhbHVlcykpKVxuICAgICAgLmF0dHIoJ3Nlcmllc0tleScsIGQgPT4gZC52YWx1ZXNbMF0uZGF0YS5rZXlbMF0pXG4gICAgICAuc3R5bGUoJ3N0cm9rZS13aWR0aCcsIG9wdGlvbi5saW5lV2lkdGggKyAncHgnKTtcbiAgfVxuXG4gIHByaXZhdGUgY29sb3JzMihkOiBhbnksIGk6IG51bWJlcikge1xuICAgIHJldHVybiB0aGlzLmdldENvbG9yLmNhbGwoZCwgZC52YWx1ZXMsIGkpO1xuICB9XG5cbiAgcHJpdmF0ZSBzYWZlRChkOiBhbnkpIHtcbiAgICByZXR1cm4gKCFkIHx8IGQuaW5kZXhPZignTmFOJykgPj0gMCkgPyAnTTAsMCcgOiBkO1xuICB9XG5cbiAgcHJpdmF0ZSByZW5kZXJTeW1ib2woZDogYW55LCBvcHRpb246IGFueSkge1xuICAgIGNvbnN0IGdldFN5bWJvbCA9ICgpID0+IHtcbiAgICAgIGlmIChvcHRpb24uc3ltYm9sKSB7XG4gICAgICAgIGlmIChvcHRpb24uc3ltYm9sID09PSAnY3Jvc3MnKSB7XG4gICAgICAgICAgcmV0dXJuIGQzLnN5bWJvbENyb3NzO1xuICAgICAgICB9IGVsc2UgaWYgKG9wdGlvbi5zeW1ib2wgPT09ICdkaWFtb25kJykge1xuICAgICAgICAgIHJldHVybiBkMy5zeW1ib2xEaWFtb25kO1xuICAgICAgICB9IGVsc2UgaWYgKG9wdGlvbi5zeW1ib2wgPT09ICdzcXVhcmUnKSB7XG4gICAgICAgICAgcmV0dXJuIGQzLnN5bWJvbFNxdWFyZTtcbiAgICAgICAgfSBlbHNlIGlmIChvcHRpb24uc3ltYm9sID09PSAnc3RhcicpIHtcbiAgICAgICAgICByZXR1cm4gZDMuc3ltYm9sU3RhcjtcbiAgICAgICAgfSBlbHNlIGlmIChvcHRpb24uc3ltYm9sID09PSAndHJpYW5nbGUnKSB7XG4gICAgICAgICAgcmV0dXJuIGQzLnN5bWJvbFRyaWFuZ2xlO1xuICAgICAgICB9IGVsc2UgaWYgKG9wdGlvbi5zeW1ib2wgPT09ICd3eWUnKSB7XG4gICAgICAgICAgcmV0dXJuIGQzLnN5bWJvbFd5ZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gZDMuc3ltYm9sQ2lyY2xlO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gZDMuc3ltYm9sQ2lyY2xlO1xuICAgICAgfVxuICAgIH07XG5cbiAgICBjb25zdCBzeW1ib2xTaXplID0gKCkgPT4ge1xuICAgICAgaWYgKG9wdGlvbi5zaXplKSB7XG4gICAgICAgIHJldHVybiBvcHRpb24uc2l6ZSAqIG9wdGlvbi5zaXplO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIDcgKiA3O1xuICAgICAgfVxuICAgIH07XG5cbiAgICBjb25zdCBjb2xvciA9IG9wdGlvbi5jb2xvck9wdGlvbiA/IG9wdGlvbi5jb2xvck9wdGlvbiA6IChvcHRpb24uY29sb3IgfHwgdGhpcy5nZXRDb2xvcik7XG5cbiAgICBjb25zdCBzeW1ib2xzID0gdGhpcy5jaGFydEJvZHlHKCkuc2VsZWN0QWxsKCdwYXRoLnN5bWJvbCcpLmRhdGEoZC52YWx1ZXMpO1xuICAgIHN5bWJvbHMuZW50ZXIoKVxuICAgICAgLmFwcGVuZCgncGF0aCcpLmF0dHIoJ2NsYXNzJywgJ3N5bWJvbCcpXG4gICAgICAuYXR0cignb3BhY2l0eScsIDApXG4gICAgICAuYXR0cignZmlsbCcsIG9wdGlvbi5jb2xvciA/IG9wdGlvbi5jb2xvciA6IHRoaXMuZ2V0Q29sb3IpXG4gICAgICAuYXR0cigndHJhbnNmb3JtJywgdGhpcy5fbG9jYXRvcilcbiAgICAgIC5hdHRyKCdkJywgZDMuc3ltYm9sKCkudHlwZShnZXRTeW1ib2woKSkuc2l6ZShzeW1ib2xTaXplKCkpKVxuICAgICAgLm9uKCdjbGljaycsIChkYXRhOiBhbnkpID0+IHtcbiAgICAgICAgaWYgKHRoaXMuX2NsaWNrKSB7XG4gICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgIHJldHVybiB0aGlzLl9jbGljayhkKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICBpZiAodGhpcy5tdWx0aU9wdGlvbi50b29sdGlwKSB7XG4gICAgICBjb25zdCB0b29sdGlwID0gdGhpcy5nZXRUb29sdGlwRWxlbSgpO1xuICAgICAgc3ltYm9sc1xuICAgICAgICAub24oJ21vdXNlbW92ZScsIChkYXRhOiBhbnkpID0+IHtcbiAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgY29uc3QgcGFnZVggPSBldmVudC5wYWdlWDtcbiAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgY29uc3QgcGFnZVkgPSBldmVudC5wYWdlWTtcbiAgICAgICAgICBsZXQgbGVmdCA9IDAsIHRvcCA9IDA7XG5cbiAgICAgICAgICB0b29sdGlwLnRyYW5zaXRpb24oKVxuICAgICAgICAgICAgLmR1cmF0aW9uKDEwMClcbiAgICAgICAgICAgIC5zdHlsZSgnb3BhY2l0eScsIC45KVxuICAgICAgICAgICAgLnN0eWxlKCdiYWNrZ3JvdW5kJywgY29sb3IpXG4gICAgICAgICAgICAuc3R5bGUoJ2JvcmRlci1jb2xvcicsIGNvbG9yKVxuICAgICAgICAgICAgLnN0eWxlKCd6LWluZGV4JywgMTAwMDApO1xuICAgICAgICAgIHRvb2x0aXAuaHRtbCh0aGlzLm11bHRpT3B0aW9uLnRvb2x0aXAoZGF0YSkpO1xuXG4gICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICBjb25zdCB0b29sWCA9IHRvb2x0aXAubm9kZSgpLmNsaWVudFdpZHRoO1xuICAgICAgICAgICAgY29uc3QgdG9vbFkgPSB0b29sdGlwLm5vZGUoKS5jbGllbnRIZWlnaHQ7XG4gICAgICAgICAgICB0b3AgPSBwYWdlWSAtIHRvb2xZIC0gMTU7XG4gICAgICAgICAgICBsZWZ0ID0gcGFnZVggLSAodG9vbFggLyAyKTtcblxuICAgICAgICAgICAgdG9vbHRpcFxuICAgICAgICAgICAgICAuc3R5bGUoJ3RvcCcsIHRvcCArICdweCcpXG4gICAgICAgICAgICAgIC5zdHlsZSgnbGVmdCcsIGxlZnQgKyAncHgnKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSlcbiAgICAgICAgLm9uKCdtb3VzZW91dCcsIChkYXRhOiBhbnkpID0+IHtcbiAgICAgICAgICB0b29sdGlwIC50cmFuc2l0aW9uKClcbiAgICAgICAgICAgIC5kdXJhdGlvbigyMDApXG4gICAgICAgICAgICAuc3R5bGUoJ29wYWNpdHknLCAwKVxuICAgICAgICAgICAgLnN0eWxlKCd6LWluZGV4JywgLTEpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5tdWx0aU9wdGlvbi5vbkNsaWNrKSB7XG4gICAgICAvLyBAdHMtaWdub3JlXG4gICAgICBzeW1ib2xzLm9uKCdjbGljaycsIChkYXRhOiBhbnkpID0+IHRoaXMubXVsdGlPcHRpb24ub25DbGljayhkYXRhLCBldmVudCkpO1xuICAgIH1cblxuICAgIC8vIEB0cy1pZ25vcmVcbiAgICB0cmFuc2l0aW9uKHN5bWJvbHMsIHRoaXMudHJhbnNpdGlvbkR1cmF0aW9uKCksIHRoaXMudHJhbnNpdGlvbkRlbGF5KCkpXG4gICAgICAuYXR0cignb3BhY2l0eScsIChkYXRhLCBpKSA9PiBpc05hTih0aGlzLl9leGlzdGVuY2VBY2Nlc3NvcihkYXRhKSkgPyAwIDogdGhpcy5fZmlsdGVyZWRbaV0gPyAxIDogdGhpcy5leGNsdWRlZE9wYWNpdHkoKSlcbiAgICAgIC5hdHRyKCdzdHJva2UnLCAoZGF0YSwgaSkgPT4ge1xuICAgICAgICBpZiAodGhpcy5leGNsdWRlZENvbG9yKCkgJiYgIXRoaXMuX2ZpbHRlcmVkW2ldKSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMuZXhjbHVkZWRDb2xvcigpO1xuICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiBjb2xvciA9PT0gJ2Z1bmN0aW9uJyApIHtcbiAgICAgICAgICByZXR1cm4gY29sb3IoZGF0YS5kYXRhLnZhbHVlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gY29sb3I7XG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgICAuYXR0cignc2VyaWVzS2V5JywgZGF0YSA9PiBkYXRhLmRhdGEua2V5WzBdKVxuICAgICAgLmF0dHIoJ2ZpbGwnLCAnI2ZmZicpXG4gICAgICAuYXR0cigndHJhbnNmb3JtJywgdGhpcy5fbG9jYXRvcilcbiAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgIC5hdHRyKCdkJywgZDMuc3ltYm9sKCkudHlwZShnZXRTeW1ib2woKSkuc2l6ZShzeW1ib2xTaXplKCkpKTtcblxuICAgIHRyYW5zaXRpb24oc3ltYm9scy5leGl0KCksIHRoaXMudHJhbnNpdGlvbkR1cmF0aW9uKCksIHRoaXMudHJhbnNpdGlvbkRlbGF5KCkpLmF0dHIoJ29wYWNpdHknLCAwKS5yZW1vdmUoKTtcblxuICAgIC8vIOy2lOqwgOuQnCDrjbDsnbTthLDqsIAg7J6I7Jy866m0IOuLpOyLnCDroIzrjZRcbiAgICBpZiAoZC52YWx1ZXMgJiYgZC52YWx1ZXMubGVuZ3RoICE9PSBzeW1ib2xzLnNpemUoKSkge1xuICAgICAgdGhpcy5yZW5kZXJTeW1ib2woZCwgb3B0aW9uKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGJhckhlaWdodCh5OiBhbnksIGQ6IGFueSkge1xuICAgIGNvbnN0IHJ0biA9ICsodGhpcy55QXhpc0hlaWdodCgpIC0geShkLnkpKSA8IDAgPyAwIDogdXRpbHMuc2FmZU51bWJlcigrKHRoaXMueUF4aXNIZWlnaHQoKSAtIHkoZC55KSkpO1xuICAgIGlmIChkLnkwICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybiAoeShkLnkwKSAtIHkoZC55ICsgZC55MCkpO1xuICAgIH1cblxuICAgIHJldHVybiBydG47XG4gIH1cblxuICBwcml2YXRlIGRyYXdBcmVhKGxheWVyc0VudGVyOiBhbnksIGxheWVyczogYW55LCB5OiBhbnksIG9wdGlvbjogYW55LCBjdXJ2ZTogYW55KSB7XG4gICAgY29uc3QgYXJlYSA9IGQzLmFyZWEoKVxuICAgICAgLngoKGQ6IGFueSkgPT4gdGhpcy54KCkoZC54KSlcbiAgICAgIC55MSgoZDogYW55KSA9PiAgeSA/IHkoZC55KSA6IHRoaXMueSgpKGQueSkpXG4gICAgICAueTAoKGQ6IGFueSkgPT4ge1xuICAgICAgICBpZiAob3B0aW9uLnJlbmRlckFyZWFSYW5nZSkge1xuICAgICAgICAgIHJldHVybiB5ID8geShvcHRpb24ucmVuZGVyQXJlYVJhbmdlKSA6IHRoaXMueSgpKG9wdGlvbi5yZW5kZXJBcmVhUmFuZ2UpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiB0aGlzLnlBeGlzSGVpZ2h0KCk7XG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgICAuY3VydmUoY3VydmUpO1xuICAgIGlmICh0aGlzLl9kZWZpbmVkKSB7XG4gICAgICBhcmVhLmRlZmluZWQodGhpcy5fZGVmaW5lZCk7XG4gICAgfVxuXG4gICAgbGF5ZXJzRW50ZXIuYXBwZW5kKCdwYXRoJylcbiAgICAgIC5hdHRyKCdjbGFzcycsICdhcmVhJylcbiAgICAgIC5hdHRyKCdmaWxsJywgb3B0aW9uLmNvbG9yID8gb3B0aW9uLmNvbG9yIDogdGhpcy5jb2xvcnMyLmJpbmQodGhpcykpXG4gICAgICAuYXR0cignZCcsIChkOiBhbnkpID0+IHRoaXMuc2FmZUQoYXJlYShkLnZhbHVlcykpKTtcblxuICAgIHRyYW5zaXRpb24obGF5ZXJzLnNlbGVjdCgncGF0aC5hcmVhJyksIHRoaXMudHJhbnNpdGlvbkR1cmF0aW9uKCksIHRoaXMudHJhbnNpdGlvbkRlbGF5KCkpXG4gICAgICAuYXR0cignc3Ryb2tlJywgb3B0aW9uLmNvbG9yID8gb3B0aW9uLmNvbG9yIDogdGhpcy5jb2xvcnMyLmJpbmQodGhpcykpLmF0dHIoJ2QnLCBkID0+IHRoaXMuc2FmZUQoYXJlYShkLnZhbHVlcykpKTtcbiAgfVxuXG4gIHByaXZhdGUgcmVuZGVyTGFiZWxzKGxheWVyOiBhbnksIGxheWVySW5kZXg6IGFueSwgZDogYW55KSB7XG4gICAgY29uc3QgbGFiZWxzID0gbGF5ZXIuc2VsZWN0QWxsKCd0ZXh0LmJhckxhYmVsJylcbiAgICAgIC5kYXRhKGQudmFsdWVzLCBwbHVjaygneCcpKTtcblxuICAgIGxhYmVscy5lbnRlcigpXG4gICAgICAuYXBwZW5kKCd0ZXh0JylcbiAgICAgIC5hdHRyKCdjbGFzcycsICdiYXJMYWJlbCcpXG4gICAgICAuYXR0cigndGV4dC1hbmNob3InLCAnbWlkZGxlJyk7XG5cbiAgICBpZiAodGhpcy5pc09yZGluYWwoKSkge1xuICAgICAgbGFiZWxzLmF0dHIoJ2N1cnNvcicsICdwb2ludGVyJyk7XG4gICAgfVxuXG4gICAgdHJhbnNpdGlvbihsYWJlbHMsIHRoaXMudHJhbnNpdGlvbkR1cmF0aW9uKCksIHRoaXMudHJhbnNpdGlvbkRlbGF5KCkpXG4gICAgICAuYXR0cigneCcsIGRhdGEgPT4ge1xuICAgICAgICBsZXQgeCA9IHRoaXMueCgpKGRhdGEueCk7XG4gICAgICAgIGlmICghdGhpcy5fY2VudGVyQmFyKSB7XG4gICAgICAgICAgeCArPSB0aGlzLl9iYXJXaWR0aCAvIDI7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHV0aWxzLnNhZmVOdW1iZXIoeCk7XG4gICAgICB9KVxuICAgICAgLmF0dHIoJ3knLCBkYXRhID0+IHtcbiAgICAgICAgbGV0IHkgPSB0aGlzLnkoKShkYXRhLnkgKyBkYXRhLnkwKTtcblxuICAgICAgICBpZiAoZGF0YS55IDwgMCkge1xuICAgICAgICAgIHkgLT0gdGhpcy5iYXJIZWlnaHQoeSwgZGF0YSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdXRpbHMuc2FmZU51bWJlcih5IC0gMyk7XG4gICAgICB9KVxuICAgICAgLnRleHQoZGF0YSA9PiAgdGhpcy5sYWJlbCgpKGRhdGEpKTtcblxuICAgIHRyYW5zaXRpb24obGFiZWxzLmV4aXQoKSwgdGhpcy50cmFuc2l0aW9uRHVyYXRpb24oKSwgdGhpcy50cmFuc2l0aW9uRGVsYXkoKSlcbiAgICAgIC5hdHRyKCdoZWlnaHQnLCAwKVxuICAgICAgLnJlbW92ZSgpO1xuICB9XG5cbiAgcHJpdmF0ZSByZW5kZXJUaGVybWFsKGRhdGE6IGFueSwgb3B0aW9uOiBhbnksIHhTdGVwOiBhbnksIHlTdGVwOiBhbnksIHk6IGFueSkge1xuICAgIGNvbnN0IHN5bWJvbHMgPSB0aGlzLmNoYXJ0Qm9keUcoKS5zZWxlY3RBbGwoJ3JlY3QudGhlcm1hbCcpLmRhdGEoZGF0YS52YWx1ZXMpO1xuICAgIHN5bWJvbHMuZW50ZXIoKS5hcHBlbmQoJ3JlY3QnKS5hdHRyKCdjbGFzcycsICd0aGVybWFsJyk7XG4gICAgdHJhbnNpdGlvbihzeW1ib2xzLCB0aGlzLnRyYW5zaXRpb25EdXJhdGlvbigpLCB0aGlzLnRyYW5zaXRpb25EZWxheSgpKVxuICAgICAgLmF0dHIoJ3gnLCBkID0+IHRoaXMueCgpKCgrZC54IC0geFN0ZXAgLyAyKSkpXG4gICAgICAuYXR0cigneScsIGQgPT4geSgrZC55ICsgeVN0ZXApKVxuICAgICAgLmF0dHIoJ3dpZHRoJywgdGhpcy54KCkodGhpcy54KCkuZG9tYWluKClbMF0gKyB4U3RlcCkgLSB0aGlzLngoKSh0aGlzLngoKS5kb21haW4oKVswXSkpXG4gICAgICAuYXR0cignaGVpZ2h0JywgeSh5LmRvbWFpbigpWzBdKSAtIHkoeS5kb21haW4oKVswXSArIHlTdGVwKSlcbiAgICAgIC5hdHRyKCdvcGFjaXR5JywgZCA9PiBpc05hTihkLnopID8gMCA6IDEpXG4gICAgICAuc3R5bGUoJ2ZpbGwnLCBkID0+IG9wdGlvbi5jb2xvclNjYWxlKG9wdGlvbi5jb2xvckFjY2Vzc29yKGQuZGF0YSkpKTtcbiAgICB0cmFuc2l0aW9uKHN5bWJvbHMuZXhpdCgpLCB0aGlzLnRyYW5zaXRpb25EdXJhdGlvbigpLCB0aGlzLnRyYW5zaXRpb25EZWxheSgpKS5hdHRyKCdvcGFjaXR5JywgMCkucmVtb3ZlKCk7XG4gIH1cblxuICBwcml2YXRlIHJlbmRlckJhcnMobGF5ZXI6IGFueSwgbGF5ZXJJbmRleDogYW55LCBkYXRhOiBhbnksIHk6IGFueSwgb3B0aW9uOiBhbnksIGJhcmxpc3Q6IGFueSwgYmFySW5kZXg6IGFueSkge1xuICAgIGNvbnN0IGJhcnMgPSBsYXllci5zZWxlY3RBbGwoJ3JlY3QuYmFyJykuZGF0YShkYXRhLnZhbHVlcywgcGx1Y2soJ3gnKSk7XG4gICAgbGV0IG9yZGluYWxUeXBlID0gZmFsc2U7XG4gICAgaWYgKG9wdGlvbi5iYXJXaWR0aCkge1xuICAgICAgdGhpcy5fYmFyV2lkdGggPSBvcHRpb24uYmFyV2lkdGg7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuX3guYmFuZHdpZHRoKSB7XG4gICAgICBvcmRpbmFsVHlwZSA9IHRydWU7XG4gICAgICB0aGlzLl9iYXJXaWR0aCA9IHRoaXMuX3guYmFuZHdpZHRoKCk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMubXVsdGlPcHRpb24ueEF4aXNPcHRpb24gJiYgdGhpcy5tdWx0aU9wdGlvbi54QXhpc09wdGlvbi50eXBlID09PSAnZGF0ZScpIHtcbiAgICAgIGNvbnN0IHtsZWZ0LCByaWdodH0gPSB0aGlzLm1hcmdpbnMoKTtcbiAgICAgIGNvbnN0IHhBeGlzV2lkdGggPSB0aGlzLl93aWR0aENhbGMoKSAtIGxlZnQgLSByaWdodDtcbiAgICAgIGNvbnN0IHVuaXFLZXlzID0gXy51bmlxKHRoaXMuZGF0YSgpLm1hcCgoZDogYW55KSA9PiBkLmtleVsxXSkpO1xuXG4gICAgICB0aGlzLl9iYXJXaWR0aCA9IHhBeGlzV2lkdGggLyB1bmlxS2V5cy5sZW5ndGg7XG4gICAgfVxuXG4gICAgdHJhbnNpdGlvbihiYXJzLmV4aXQoKSwgdGhpcy50cmFuc2l0aW9uRHVyYXRpb24oKSwgdGhpcy50cmFuc2l0aW9uRGVsYXkoKSlcbiAgICAgIC5hdHRyKCd4JywgZCA9PiB0aGlzLngoKShkLngpKVxuICAgICAgLmF0dHIoJ3dpZHRoJywgdGhpcy5fYmFyV2lkdGggKiAwLjkpXG4gICAgICAucmVtb3ZlKCk7XG5cbiAgICBiYXJzLmVudGVyKClcbiAgICAgIC5hcHBlbmQoJ3JlY3QnKVxuICAgICAgLmF0dHIoJ2NsYXNzJywgJ2JhcicpXG4gICAgICAuYXR0cigneCcsIChkOiBhbnkpID0+IHtcbiAgICAgICAgbGV0IHggPSB0aGlzLngoKShkLngpO1xuICAgICAgICBpZiAodGhpcy5fY2VudGVyQmFyICYmICF0aGlzLmlzT3JkaW5hbCgpKSB7XG4gICAgICAgICAgeCAtPSB0aGlzLl9iYXJXaWR0aCAvIDI7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuaXNPcmRpbmFsKCkgJiYgdGhpcy5fZ2FwICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICB4ICs9IHRoaXMuX2dhcCAvIDI7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgcG9zaXRpb24gPSAodGhpcy5fYmFyV2lkdGggLyBiYXJsaXN0Lmxlbmd0aCkgKiBiYXJJbmRleDtcbiAgICAgICAgcmV0dXJuIHV0aWxzLnNhZmVOdW1iZXIoeCArIHBvc2l0aW9uKTtcbiAgICAgIH0pXG4gICAgICAuYXR0cigneScsIChkOiBhbnkpID0+IHtcbiAgICAgICAgbGV0IHlWYWw7XG4gICAgICAgIGlmIChkLnkwICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICB5VmFsID0geShkLnkgKyBkLnkwKTtcbiAgICAgICAgICBpZiAoZC55IDwgMCkge1xuICAgICAgICAgICAgeVZhbCAtPSB0aGlzLmJhckhlaWdodCh5LCBkKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgeVZhbCA9IHkoZC55KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdXRpbHMuc2FmZU51bWJlcih5VmFsKTtcbiAgICAgIH0pXG4gICAgICAuYXR0cignd2lkdGgnLCB0aGlzLl9iYXJXaWR0aCAvIGJhcmxpc3QubGVuZ3RoKVxuICAgICAgLmF0dHIoJ2hlaWdodCcsIChkOiBhbnkpID0+IHRoaXMuYmFySGVpZ2h0KHksIGQpKVxuICAgICAgLmF0dHIoJ2ZpbGwnLCBwbHVjaygnbGF5ZXInLCBvcHRpb24uY29sb3IgPyAoZDogYW55LCBpOiBudW1iZXIpID0+IHtcbiAgICAgICAgaWYgKG9wdGlvbi5zdGFja3MpIHtcbiAgICAgICAgICBjb25zdCBpbmRleCA9IG9wdGlvbi5zdGFja3MuaW5kZXhPZihkKTtcbiAgICAgICAgICByZXR1cm4gb3B0aW9uLmNvbG9yW2luZGV4XTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gb3B0aW9uLmNvbG9yO1xuICAgICAgICB9XG4gICAgICB9IDogdGhpcy5nZXRDb2xvcikpXG4gICAgICAuc2VsZWN0KCd0aXRsZScpLnRleHQocGx1Y2soJ2RhdGEnLCB0aGlzLnRpdGxlKGRhdGEubmFtZSkpKTtcblxuICAgIGlmICh0aGlzLm11bHRpT3B0aW9uLm9uQ2xpY2spIHtcbiAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgIGJhcnMub24oJ2NsaWNrJywgKGQ6IGFueSkgPT4gdGhpcy5tdWx0aU9wdGlvbi5vbkNsaWNrKGQsIGV2ZW50KSk7XG4gICAgfVxuXG4gICAgdHJhbnNpdGlvbihiYXJzLCB0aGlzLnRyYW5zaXRpb25EdXJhdGlvbigpLCB0aGlzLnRyYW5zaXRpb25EZWxheSgpKVxuICAgICAgLmF0dHIoJ3gnLCBkID0+IHtcbiAgICAgICAgbGV0IHggPSB0aGlzLngoKShkLngpO1xuICAgICAgICBpZiAodGhpcy5fY2VudGVyQmFyICYmICF0aGlzLmlzT3JkaW5hbCgpKSB7XG4gICAgICAgICAgeCAtPSB0aGlzLl9iYXJXaWR0aCAvIDI7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuaXNPcmRpbmFsKCkgJiYgdGhpcy5fZ2FwICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICB4ICs9IHRoaXMuX2dhcCAvIDI7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgcG9zaXRpb24gPSAodGhpcy5fYmFyV2lkdGggLyBiYXJsaXN0Lmxlbmd0aCkgKiBiYXJJbmRleDtcbiAgICAgICAgcmV0dXJuIHV0aWxzLnNhZmVOdW1iZXIoeCArIHBvc2l0aW9uKTtcbiAgICAgIH0pXG4gICAgICAuYXR0cigneScsIGQgPT4ge1xuICAgICAgICBsZXQgeVZhbDtcbiAgICAgICAgaWYgKGQueTAgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgIHlWYWwgPSB5KGQueSArIGQueTApO1xuICAgICAgICAgIGlmIChkLnkgPCAwKSB7XG4gICAgICAgICAgICB5VmFsIC09IHRoaXMuYmFySGVpZ2h0KHksIGQpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB5VmFsID0geShkLnkpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB1dGlscy5zYWZlTnVtYmVyKHlWYWwpO1xuICAgICAgfSlcbiAgICAgIC5hdHRyKCd3aWR0aCcsIHRoaXMuX2JhcldpZHRoIC8gYmFybGlzdC5sZW5ndGgpXG4gICAgICAuYXR0cignaGVpZ2h0JywgZCA9PiB0aGlzLmJhckhlaWdodCh5LCBkKSlcbiAgICAgIC5hdHRyKCdmaWxsJywgcGx1Y2soJ2xheWVyJywgb3B0aW9uLmNvbG9yID8gKGQ6IGFueSwgaTogbnVtYmVyKSA9PiB7XG4gICAgICAgIGlmIChvcHRpb24uc3RhY2tzKSB7XG4gICAgICAgICAgY29uc3QgaW5kZXggPSBvcHRpb24uc3RhY2tzLmluZGV4T2YoZCk7XG4gICAgICAgICAgcmV0dXJuIG9wdGlvbi5jb2xvcltpbmRleF07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIG9wdGlvbi5jb2xvcjtcbiAgICAgICAgfVxuICAgICAgfSA6IHRoaXMuZ2V0Q29sb3IpKVxuICAgICAgLnNlbGVjdCgndGl0bGUnKS50ZXh0KHBsdWNrKCdkYXRhJywgdGhpcy50aXRsZShkYXRhLm5hbWUpKSk7XG4gIH1cblxuICBwcml2YXRlIHN0ZXBMaW5lKGxheWVyc0VudGVyOiBhbnksIGxheWVyczogYW55LCB5OiBhbnksIG9wdGlvbjogYW55KSB7XG4gICAgbGV0IGJhbmR3aWR0aCA9IDA7XG4gICAgaWYgKHRoaXMueCgpLmJhbmR3aWR0aCkge1xuICAgICAgYmFuZHdpZHRoID0gdGhpcy54KCkuYmFuZHdpZHRoKCkgLyAyO1xuICAgIH1cblxuICAgIGNvbnN0IGxpbmUgPSBkMy5saW5lKClcbiAgICAgIC54KChkOiBhbnkpID0+ICh0aGlzLngoKShkLngpICsgYmFuZHdpZHRoKSlcbiAgICAgIC55KChkOiBhbnkpID0+IHkgPyB5KGQueSkgOiB0aGlzLnkoKShkLnkpKVxuICAgICAgLmN1cnZlKGQzLmN1cnZlU3RlcEFmdGVyKTtcblxuICAgIGlmICh0aGlzLl9kZWZpbmVkKSB7XG4gICAgICBsaW5lLmRlZmluZWQodGhpcy5fZGVmaW5lZCk7XG4gICAgfVxuXG4gICAgY29uc3QgcGF0aCA9IGxheWVyc0VudGVyLmFwcGVuZCgncGF0aCcpLmF0dHIoJ2NsYXNzJywgJ2xpbmUnKS5hdHRyKCdzdHJva2UnLCBvcHRpb24uY29sb3IgPyBvcHRpb24uY29sb3IgOiB0aGlzLmNvbG9yczIuYmluZCh0aGlzKSk7XG5cbiAgICBpZiAob3B0aW9uLmRhc2hTdHlsZSkge1xuICAgICAgcGF0aC5hdHRyKCdzdHJva2UtZGFzaGFycmF5Jywgb3B0aW9uLmRhc2hTdHlsZSk7XG4gICAgfVxuICAgIHRyYW5zaXRpb24obGF5ZXJzLnNlbGVjdCgncGF0aC5saW5lJyksIHRoaXMudHJhbnNpdGlvbkR1cmF0aW9uKCksIHRoaXMudHJhbnNpdGlvbkRlbGF5KCkpXG4gICAgICAuYXR0cignc3Ryb2tlJywgb3B0aW9uLmNvbG9yID8gb3B0aW9uLmNvbG9yIDogdGhpcy5jb2xvcnMyLmJpbmQodGhpcykpXG4gICAgICAuYXR0cignZCcsIGQgPT4gdGhpcy5zYWZlRChsaW5lKGQudmFsdWVzKSkpXG4gICAgICAuc3R5bGUoJ3N0cm9rZS13aWR0aCcsIG9wdGlvbi5saW5lV2lkdGggKyAncHgnKTtcbiAgfVxuXG4gIHN5bWJvbCh0eXBlPzogYW55KSB7XG4gICAgaWYgKCF0eXBlKSB7XG4gICAgICByZXR1cm4gdGhpcy5fc3ltYm9sLnR5cGUoKTtcbiAgICB9XG4gICAgdGhpcy5fc3ltYm9sLnR5cGUodHlwZSk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBleGNsdWRlZENvbG9yKGV4Y2x1ZGVkQ29sb3I/OiBhbnkpIHtcbiAgICBpZiAoIWV4Y2x1ZGVkQ29sb3IpIHtcbiAgICAgIHJldHVybiB0aGlzLl9leGNsdWRlZENvbG9yO1xuICAgIH1cbiAgICB0aGlzLl9leGNsdWRlZENvbG9yID0gZXhjbHVkZWRDb2xvcjtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIGV4Y2x1ZGVkT3BhY2l0eShleGNsdWRlZE9wYWNpdHk/OiBhbnkpIHtcbiAgICBpZiAoIWV4Y2x1ZGVkT3BhY2l0eSkge1xuICAgICAgcmV0dXJuIHRoaXMuX2V4Y2x1ZGVkT3BhY2l0eTtcbiAgICB9XG4gICAgdGhpcy5fZXhjbHVkZWRPcGFjaXR5ID0gZXhjbHVkZWRPcGFjaXR5O1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgcHJpdmF0ZSByZXNpemVTeW1ib2xzV2hlcmUoY29uZGl0aW9uOiBhbnksIHNpemU6IGFueSkge1xuICAgIC8vIEB0cy1pZ25vcmVcbiAgICBjb25zdCBzeW1ib2xzID0gdGhpcy5zZWxlY3RBbGwoJy5jaGFydC1ib2R5IHBhdGguc3ltYm9sJykuZmlsdGVyKCgpID0+IGNvbmRpdGlvbihkMy5zZWxlY3QodGhpcykpKTtcbiAgICBjb25zdCBvbGRTaXplID0gdGhpcy5fc3ltYm9sLnNpemUoKTtcbiAgICB0aGlzLl9zeW1ib2wuc2l6ZShNYXRoLnBvdyhzaXplLCAyKSk7XG5cbiAgICAvLyBAdHMtaWdub3JlXG4gICAgdHJhbnNpdGlvbihzeW1ib2xzLCB0aGlzLnRyYW5zaXRpb25EdXJhdGlvbigpLCB0aGlzLnRyYW5zaXRpb25EZWxheSgpKS5hdHRyKCdkJywgdGhpcy5fc3ltYm9sKTtcbiAgICB0aGlzLl9zeW1ib2wuc2l6ZShvbGRTaXplKTtcbiAgfVxuXG4gIGV4dGVuZEJydXNoKCkge1xuICAgIGNvbnN0IGV4dGVudCA9IHRoaXMuYnJ1c2goKS5leHRlbnQoKTtcbiAgICBpZiAodGhpcy5yb3VuZCgpKSB7XG4gICAgICBleHRlbnRbMF0gPSBleHRlbnRbMF0ubWFwKHRoaXMucm91bmQoKSk7XG4gICAgICBleHRlbnRbMV0gPSBleHRlbnRbMV0ubWFwKHRoaXMucm91bmQoKSk7XG4gICAgICB0aGlzLmcoKS5zZWxlY3QoJy5icnVzaCcpLmNhbGwodGhpcy5icnVzaCgpLmV4dGVudChleHRlbnQpKTtcbiAgICB9XG4gICAgcmV0dXJuIGV4dGVudDtcbiAgfVxuXG4gIGJydXNoSXNFbXB0eShleHRlbnQ6IGFueSkge1xuICAgIHJldHVybiB0aGlzLmJydXNoKCkuZW1wdHkoKSB8fCAhZXh0ZW50IHx8IGV4dGVudFswXVswXSA+PSBleHRlbnRbMV1bMF0gfHwgZXh0ZW50WzBdWzFdID49IGV4dGVudFsxXVsxXTtcbiAgfVxuXG4gIF9icnVzaGluZygpIHtcbiAgICBjb25zdCBleHRlbnQgPSB0aGlzLmV4dGVuZEJydXNoKCk7XG4gICAgdGhpcy5yZWRyYXdCcnVzaCh0aGlzLmcoKSk7XG4gICAgaWYgKHRoaXMuYnJ1c2hJc0VtcHR5KGV4dGVudCkpIHtcbiAgICAgIGV2ZW50cy50cmlnZ2VyKCgpID0+IHtcbiAgICAgICAgdGhpcy5maWx0ZXIobnVsbCk7XG4gICAgICAgIHRoaXMucmVkcmF3R3JvdXAoKTtcbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCByYW5nZWQyREZpbHRlciA9IGZpbHRlcnMuUmFuZ2VkVHdvRGltZW5zaW9uYWxGaWx0ZXIoZXh0ZW50KTtcbiAgICAgIGV2ZW50cy50cmlnZ2VyKCgpID0+IHtcbiAgICAgICAgdGhpcy5maWx0ZXIobnVsbCk7XG4gICAgICAgIHRoaXMuZmlsdGVyKHJhbmdlZDJERmlsdGVyKTtcbiAgICAgICAgdGhpcy5yZWRyYXdHcm91cCgpO1xuICAgICAgfSwgY29uc3RhbnRzLkVWRU5UX0RFTEFZKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGdldFRvb2x0aXBFbGVtKCkge1xuICAgIGlmICghdGhpcy5fdG9vbHRpcCB8fCB0aGlzLl90b29sdGlwLmVtcHR5KCkpIHtcbiAgICAgIHRoaXMuX3Rvb2x0aXAgID0gZDMuc2VsZWN0KCdib2R5JylcbiAgICAgICAgLmFwcGVuZCgnZGl2JylcbiAgICAgICAgLmF0dHIoJ2NsYXNzJywgJ3dpc2UtY2hhcnQtdG9vbHRpcCcpXG4gICAgICAgIC5odG1sKCcnKVxuICAgICAgICAuc3R5bGUoJ29wYWNpdHknLCAwKVxuICAgICAgICAuc3R5bGUoJ3Bvc2l0aW9uJywgJ2Fic29sdXRlJylcbiAgICAgICAgLnN0eWxlKCd6LWluZGV4JywgLTEpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5fdG9vbHRpcDtcbiAgfVxufVxuIl19