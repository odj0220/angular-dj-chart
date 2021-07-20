import { Component, EventEmitter, Input, Output } from '@angular/core';
import * as d3 from 'd3';
import { isArray } from 'rxjs/internal-compatibility';
import moment from 'moment';
import { transition } from 'dc';
import { DjChart } from './chart/dj-chart';
import * as i0 from "@angular/core";
export class AngularDjChartComponent {
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
                        min = moment(min, this.option.xAxisOption.dateFormat).valueOf();
                        max = moment(max, this.option.xAxisOption.dateFormat).valueOf();
                    }
                    // @ts-ignore
                    this.chart.x(d3.scaleTime().domain([new Date(min), new Date(max)]));
                    if (this.option.xAxisOption.dateTickFormat) {
                        // @ts-ignore
                        this.chart.xAxis().tickFormat((d) => moment(d).format(this.option.xAxisOption.dateTickFormat));
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
                    x0 = moment(domain[0], dateFormat).valueOf();
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
                x0 = moment(domain[0], dateFormat).valueOf();
                x1 = moment(domain[1], dateFormat).valueOf();
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
                x0 = moment(domain[0], dateFormat).valueOf();
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
                x0 = moment(domain[0], dateFormat).valueOf();
                x1 = moment(domain[1], dateFormat).valueOf();
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYW5ndWxhci1kai1jaGFydC5jb21wb25lbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9wcm9qZWN0cy9hbmd1bGFyLWRqLWNoYXJ0L3NyYy9saWIvYW5ndWxhci1kai1jaGFydC5jb21wb25lbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFDLFNBQVMsRUFBYyxZQUFZLEVBQUUsS0FBSyxFQUFrQixNQUFNLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFDakcsT0FBTyxLQUFLLEVBQUUsTUFBTSxJQUFJLENBQUM7QUFDekIsT0FBTyxFQUFDLE9BQU8sRUFBQyxNQUFNLDZCQUE2QixDQUFDO0FBQ3BELE9BQU8sTUFBTSxNQUFNLFFBQVEsQ0FBQztBQUM1QixPQUFPLEVBQUMsVUFBVSxFQUFDLE1BQU0sSUFBSSxDQUFDO0FBQzlCLE9BQU8sRUFBQyxPQUFPLEVBQUMsTUFBTSxrQkFBa0IsQ0FBQzs7QUFRekMsTUFBTSxPQUFPLHVCQUF1QjtJQXdEbEMsWUFDVSxLQUFpQixFQUNqQixJQUFZO1FBRFosVUFBSyxHQUFMLEtBQUssQ0FBWTtRQUNqQixTQUFJLEdBQUosSUFBSSxDQUFRO1FBcER0QixnQkFBVyxHQUFHLEdBQUcsQ0FBQztRQThDUixnQkFBVyxHQUFzQixJQUFJLFlBQVksRUFBTyxDQUFDO1FBQ3pELGFBQVEsR0FBc0IsSUFBSSxZQUFZLEVBQU8sQ0FBQztJQU03RCxDQUFDO0lBMUNKLElBQ0ksTUFBTSxDQUFDLE1BQW9CO1FBQzdCLElBQUksTUFBTSxDQUFDLElBQUksS0FBSyxXQUFXLEVBQUU7WUFDL0IsTUFBTSxDQUFDLGFBQWEsRUFBRSxDQUFDO1NBQ3hCO1FBRUQsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUNyQyxJQUFJLENBQUMsT0FBTyxHQUFHLE1BQU0sQ0FBQztRQUV0QixRQUFRLE1BQU0sQ0FBQyxJQUFJLEVBQUU7WUFDbkIsS0FBSyxVQUFVO2dCQUNiLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsQ0FBQztnQkFDL0QsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO2dCQUNuQixNQUFNO1lBQ1IsS0FBSyxZQUFZO2dCQUNmLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsQ0FBQztnQkFDakUsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO2dCQUNyQixNQUFNO1lBQ1IsS0FBSyxTQUFTO2dCQUNaLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQztnQkFDbEIsTUFBTTtZQUNSO2dCQUNFLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsQ0FBQztnQkFDbEUsSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDO2dCQUN0QixNQUFNO1NBQ1Q7UUFFRCxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUFDO1FBQ3BCLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUNqQyxDQUFDO0lBQ0QsSUFBSSxNQUFNO1FBQ1IsYUFBYTtRQUNiLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQztJQUN0QixDQUFDO0lBV0QsUUFBUTtRQUNOLHNCQUFzQjtRQUN0QixJQUFJLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDLFdBQVcsQ0FBQztRQUNyRCxzQkFBc0I7UUFDdEIsSUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLGNBQWMsQ0FBQyxPQUFPLENBQUMsRUFBRTtZQUMzQyxJQUFJLENBQUMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLEdBQUcsRUFBRTtnQkFDL0Isb0NBQW9DO2dCQUNwQyxNQUFNLEtBQUssR0FBRyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQztnQkFDM0MsWUFBWSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQztnQkFDL0IsSUFBSSxDQUFDLFdBQVcsR0FBRyxVQUFVLENBQUMsR0FBRyxFQUFFO29CQUNqQyxJQUFJLElBQUksQ0FBQyxRQUFRLEtBQUssS0FBSyxFQUFFO3dCQUMzQixJQUFJLENBQUMsUUFBUSxHQUFHLEtBQUssQ0FBQzt3QkFFdEIsU0FBUzt3QkFDVCxJQUFJLElBQUksQ0FBQyxLQUFLLEVBQUU7NEJBQ2QsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUM7NEJBQ3pCLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQyxDQUFDOzRCQUN6QixJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQzs0QkFDcEIsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7NEJBQ3JCLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLEVBQUU7Z0NBQ3RCLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxFQUFFLENBQUM7NkJBQ3RCOzRCQUNELElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLEVBQUU7Z0NBQ3JCLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFFLENBQUM7NkJBQ3JCO2lDQUFNO2dDQUNMLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFFLENBQUM7NkJBQ3JCO3lCQUNGO3FCQUNGO2dCQUNILENBQUMsRUFBRSxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUM7WUFFdkIsQ0FBQyxDQUFDLENBQUM7UUFDTCxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDLENBQUM7SUFDbEQsQ0FBQztJQUdELFdBQVc7UUFDVCxpQkFBaUI7UUFDakIsSUFBSSxJQUFJLENBQUMsUUFBUSxFQUFFO1lBQ2pCLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxFQUFFLENBQUM7U0FDeEI7UUFDRCxJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxFQUFFO1lBQ3ZCLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxFQUFFLENBQUMsT0FBTyxDQUFDLENBQUMsS0FBVSxFQUFFLEVBQUU7Z0JBQzNDLElBQUksS0FBSyxDQUFDLFFBQVEsRUFBRTtvQkFDbEIsS0FBSyxDQUFDLFFBQVEsQ0FBQyxNQUFNLEVBQUUsQ0FBQztpQkFDekI7WUFDSCxDQUFDLENBQUMsQ0FBQztTQUNKO1FBRUQsYUFBYTtRQUNiLElBQUksQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDLENBQUM7SUFDcEQsQ0FBQztJQUdELE1BQU07UUFDSixJQUFJLENBQUMsY0FBYyxFQUFFLENBQUM7UUFDdEIsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO1FBRWxCLHFDQUFxQztRQUNyQyxJQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxLQUFLLFNBQVMsRUFBRTtZQUNsQyxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQztZQUNwQyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxFQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFDLENBQUMsQ0FBQztTQUN0RjthQUFNO1lBQ0wsSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUM1QyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDO1NBQ3JDO1FBRUQsTUFBTSxjQUFjLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUNuQyxjQUFjLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFO1lBQzNCLGFBQWE7WUFDYixJQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLEtBQUssU0FBUyxFQUFFO2dCQUNsQyxJQUFJLEdBQUcsS0FBSyxTQUFTLEVBQUU7b0JBQ3JCLGFBQWE7b0JBQ2IsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQU0sRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO2lCQUM3RDtxQkFBTTtvQkFDTCxhQUFhO29CQUNiLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQztpQkFDcEM7YUFDRjtRQUNILENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLFlBQVksRUFBRTtZQUM1QixJQUFJLENBQUMsS0FBSyxDQUFDLGVBQWUsQ0FBQyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDO1lBQ2pELElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxDQUFNLEVBQUUsRUFBRTtnQkFDakMsSUFBSSxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQzVCLElBQUksQ0FBQyxNQUFNLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzlCLENBQUMsQ0FBQztTQUNIO1FBRUQsSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLGVBQWUsRUFBRTtZQUMvQixhQUFhO1lBQ2IsSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsVUFBVSxFQUFFLENBQUMsQ0FBTSxFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1NBQ3ZFO1FBRUQsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDO0lBQ3BDLENBQUM7SUFFTyxXQUFXO1FBQ2pCLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztRQUNkLE1BQU0sWUFBWSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsV0FBVyxJQUFJLEVBQUUsQ0FBQztRQUNuRCxNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sSUFBSSxFQUFFLENBQUM7UUFDekMsTUFBTSxlQUFlLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxjQUFjLElBQUksQ0FBQyxDQUFDO1FBQ3hELE1BQU0sSUFBSSxHQUFHLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztRQUVqRCxJQUFJLENBQUMsS0FBSztZQUNSLGFBQWE7YUFDWixNQUFNLENBQUMsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxPQUFPLEdBQUcsR0FBRyxDQUFDLENBQUM7WUFDckMsYUFBYTthQUNaLFdBQVcsQ0FBQyxDQUFDLElBQUksR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLFlBQVksR0FBRyxHQUFHLENBQUMsQ0FBQzthQUM5QyxjQUFjLENBQUMsZUFBZSxDQUFDO2FBQy9CLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUVuQixJQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsYUFBYSxFQUFFO1lBQzdCLElBQUksSUFBSSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsR0FBRyxFQUFFLENBQUM7WUFDekUsSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFNLEVBQUUsQ0FBTSxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUN4RCxJQUFJLEdBQUcsR0FBRyxDQUFDLENBQUM7WUFDWixJQUFJLEtBQUssR0FBRyxDQUFDLENBQUM7WUFDZCxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBTSxFQUFFLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ3pDLE9BQU8sS0FBSyxHQUFHLElBQUksQ0FBQyxNQUFNLEVBQUU7Z0JBQzFCLE1BQU0sT0FBTyxHQUFHLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLEtBQUssR0FBRyxHQUFHLENBQUMsR0FBRyxHQUFHLENBQUM7Z0JBQ2hELElBQUksT0FBTyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsYUFBYSxFQUFFO29CQUN2QyxNQUFNO2lCQUNQO2dCQUNELEtBQUssRUFBRSxDQUFDO2FBQ1Q7WUFFRCxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQztTQUM3QjtRQUVELElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLEVBQUU7WUFDekIsSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQztTQUM3QztRQUVELElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUU7WUFDdEIsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFNLEVBQUUsRUFBRTtnQkFDM0IsTUFBTSxHQUFHLEdBQUcsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDbEMsYUFBYTtnQkFDYixPQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxJQUFJLE1BQU0sQ0FBQztZQUMzQyxDQUFDLENBQUMsQ0FBQztTQUNKO1FBRUQsSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsZUFBZSxFQUFFLENBQUMsS0FBVSxFQUFFLEVBQUU7WUFDNUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQU0sRUFBRSxFQUFFO2dCQUNoRCxJQUFJLEdBQUcsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQztnQkFDckIsTUFBTSxLQUFLLEdBQUcsQ0FBQyxDQUFDLFFBQVEsR0FBRyxDQUFDLENBQUMsVUFBVSxDQUFDO2dCQUN4QyxJQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxFQUFFO29CQUN2QixHQUFHLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksR0FBRyxDQUFDO2lCQUN2QztnQkFFRCxJQUFJLEtBQUssR0FBRyxHQUFHLElBQUksQ0FBQyxLQUFLLEdBQUcsR0FBRyxJQUFJLGVBQWUsQ0FBQyxFQUFFO29CQUNuRCxPQUFPLEdBQUcsQ0FBQztpQkFDWjtnQkFDRCxPQUFPLEVBQUUsQ0FBQztZQUNaLENBQUMsQ0FBQyxDQUFDO1lBRUgsSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sRUFBRTtnQkFDdkIsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDO2dCQUN0QyxLQUFLLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUNsQyxLQUFLLENBQUMsU0FBUyxDQUFDLGFBQWEsQ0FBQztxQkFDM0IsRUFBRSxDQUFDLFdBQVcsRUFBRSxDQUFDLElBQVMsRUFBRSxFQUFFO29CQUM3QixNQUFNLEdBQUcsR0FBRyxPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDO29CQUN0RSxNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztvQkFDNUYsYUFBYTtvQkFDYixNQUFNLEtBQUssR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDO29CQUMxQixhQUFhO29CQUNiLE1BQU0sS0FBSyxHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUM7b0JBQzFCLElBQUksSUFBSSxHQUFHLENBQUMsRUFBRSxHQUFHLEdBQUcsQ0FBQyxDQUFDO29CQUV0QixPQUFPLENBQUMsVUFBVSxFQUFFO3lCQUNqQixRQUFRLENBQUMsR0FBRyxDQUFDO3lCQUNiLEtBQUssQ0FBQyxTQUFTLEVBQUUsRUFBRSxDQUFDO3lCQUNwQixLQUFLLENBQUMsWUFBWSxFQUFFLEtBQUssQ0FBQzt5QkFDMUIsS0FBSyxDQUFDLGNBQWMsRUFBRSxLQUFLLENBQUM7eUJBQzVCLEtBQUssQ0FBQyxTQUFTLEVBQUUsS0FBSyxDQUFDLENBQUM7b0JBQzNCLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztvQkFFeEMsVUFBVSxDQUFDLEdBQUcsRUFBRTt3QkFDZCxNQUFNLEtBQUssR0FBRyxPQUFPLENBQUMsSUFBSSxFQUFFLENBQUMsV0FBVyxDQUFDO3dCQUN6QyxNQUFNLEtBQUssR0FBRyxPQUFPLENBQUMsSUFBSSxFQUFFLENBQUMsWUFBWSxDQUFDO3dCQUMxQyxHQUFHLEdBQUcsS0FBSyxHQUFHLEtBQUssR0FBRyxFQUFFLENBQUM7d0JBQ3pCLElBQUksR0FBRyxLQUFLLEdBQUcsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLENBQUM7d0JBRTNCLE9BQU87NkJBQ0osS0FBSyxDQUFDLEtBQUssRUFBRSxHQUFHLEdBQUcsSUFBSSxDQUFDOzZCQUN4QixLQUFLLENBQUMsTUFBTSxFQUFFLElBQUksR0FBRyxJQUFJLENBQUMsQ0FBQztvQkFDaEMsQ0FBQyxDQUFDLENBQUM7Z0JBQ0wsQ0FBQyxDQUFDO3FCQUNELEVBQUUsQ0FBQyxVQUFVLEVBQUUsQ0FBQyxJQUFTLEVBQUUsRUFBRTtvQkFDNUIsT0FBTyxDQUFFLFVBQVUsRUFBRTt5QkFDbEIsUUFBUSxDQUFDLEdBQUcsQ0FBQzt5QkFDYixLQUFLLENBQUMsU0FBUyxFQUFFLENBQUMsQ0FBQzt5QkFDbkIsS0FBSyxDQUFDLFNBQVMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUMxQixDQUFDLENBQUMsQ0FBQztnQkFFTDtvQkFDSTthQUVMO1FBQ0gsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDO0lBRU8sVUFBVTtRQUNoQixhQUFhO1FBQ2IsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsQ0FBQztRQUMzRSxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7UUFFZCxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEVBQUU7WUFDckMsSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxFQUFFO2dCQUNuQixhQUFhO2dCQUNiLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO2FBQ25DO1FBQ0gsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDO0lBRU8sYUFBYTtRQUNuQixJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7UUFDZCxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ3hDLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDMUMsQ0FBQztJQUVPLFVBQVU7UUFDaEIsSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sRUFBRTtZQUN2QixJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEtBQUssU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO1lBQ3BHLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxFQUFFLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLEtBQUssS0FBSyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7WUFDdkcsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsTUFBTSxLQUFLLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztZQUMxRyxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxHQUFHLEtBQUssU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO1NBQ2xHO0lBQ0gsQ0FBQztJQUVPLGNBQWM7UUFDcEIsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO1FBRWQsSUFBSSxHQUFHLEdBQUcsRUFBRSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssRUFBRSxDQUFDLEdBQUcsRUFBRSxFQUFFLENBQUMsQ0FBTSxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDdkUsSUFBSSxHQUFHLEdBQUcsRUFBRSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssRUFBRSxDQUFDLEdBQUcsRUFBRSxFQUFFLENBQUMsQ0FBTSxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNsRSxNQUFNLFFBQVEsR0FBRyxDQUFDLENBQU0sRUFBRSxFQUFFO1lBQzFCLE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDdEMsQ0FBQyxDQUFDO1FBR0YsTUFBTSxlQUFlLEdBQUcsQ0FBQyxDQUFDO1FBQzFCLElBQUksY0FBYyxHQUFHLEVBQUUsQ0FBQztRQUN4QixJQUFJLENBQUMsS0FBSzthQUNQLEtBQUssQ0FBQyxRQUFRLENBQUM7YUFDZix5QkFBeUIsQ0FBQyxJQUFJLENBQUM7YUFDL0IsdUJBQXVCLENBQUMsSUFBSSxDQUFDO1lBQzlCLGFBQWE7YUFDWixDQUFDLENBQUMsRUFBRSxDQUFDLFdBQVcsRUFBRSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDO2FBQ3RDLFVBQVUsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFVBQVUsSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUM7YUFDbEksVUFBVSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDO2FBQ2xDLFdBQVcsQ0FBQyxDQUFDLENBQUM7YUFDZCxRQUFRLENBQUMsS0FBSyxDQUFDO2FBQ2YsYUFBYSxDQUFDLEtBQUssQ0FBQzthQUNwQixPQUFPLENBQUMsS0FBSyxDQUFDO2FBQ2QsY0FBYyxDQUFDLENBQUMsQ0FBTSxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO2FBQ3BDLFVBQVUsQ0FBQyxDQUFDLENBQU0sRUFBRSxDQUFNLEVBQUUsRUFBRTtZQUM3QixNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFNLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUNuRSxPQUFPLFNBQVMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEdBQUcsU0FBUyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNyRCxDQUFDLENBQUM7YUFDRCxXQUFXLENBQUMsQ0FBQyxDQUFNLEVBQUUsRUFBRTtZQUN0QixPQUFPLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO1FBQy9ELENBQUMsQ0FBQzthQUNELGFBQWEsQ0FBQyxDQUFDLENBQU0sRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBRXRDLGlCQUFpQjtRQUNqQixJQUFJLENBQUMsWUFBWSxFQUFFLENBQUM7UUFFcEIsUUFBUTtRQUNSLElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxXQUFXLEVBQUU7WUFDM0IsSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLEVBQUU7Z0JBQ2xDLEdBQUcsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ3hDLEdBQUcsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7YUFDekM7WUFDRCxRQUFRLElBQUksQ0FBQyxNQUFNLENBQUMsV0FBVyxDQUFDLElBQUksRUFBRTtnQkFDcEMsS0FBSyxTQUFTO29CQUNaLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxTQUFTLEVBQUUsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQztvQkFDckYsTUFBTTtnQkFDUixLQUFLLE1BQU07b0JBQ1QsSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLEVBQUU7d0JBQ2xDLEdBQUcsR0FBRyxNQUFNLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsV0FBVyxDQUFDLFVBQVUsQ0FBQyxDQUFDLE9BQU8sRUFBRSxDQUFDO3dCQUNoRSxHQUFHLEdBQUcsTUFBTSxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxVQUFVLENBQUMsQ0FBQyxPQUFPLEVBQUUsQ0FBQztxQkFDakU7b0JBQ0QsYUFBYTtvQkFDYixJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsU0FBUyxFQUFFLENBQUMsTUFBTSxDQUFDLENBQUMsSUFBSSxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsSUFBSSxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQ3BFLElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxXQUFXLENBQUMsY0FBYyxFQUFFO3dCQUMxQyxhQUFhO3dCQUNiLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxFQUFFLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBTSxFQUFFLEVBQUUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsV0FBVyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUM7cUJBQ3JHO29CQUNELE1BQU07Z0JBQ1I7b0JBQ0UsYUFBYTtvQkFDYixJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsV0FBVyxFQUFFLENBQUMsTUFBTSxDQUFDLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFDbEQsTUFBTTthQUNUO1lBRUQsSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLEVBQUU7Z0JBQ2pDLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxFQUFFLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxDQUFDO2FBQ3pEO1lBQ0QsSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxVQUFVLEVBQUU7Z0JBQ3RDLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxFQUFFLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsV0FBVyxDQUFDLFVBQVUsQ0FBQyxDQUFDO2FBQ25FO1lBRUQsSUFBSSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDLENBQUM7U0FDMUQ7UUFFRCxjQUFjO1FBQ2QsSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssRUFBRTtZQUNyQixJQUFJLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQVMsRUFBRSxDQUFTLEVBQUUsRUFBRTtnQkFDN0MsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUM7Z0JBQ2hDLE1BQU0sTUFBTSxHQUFHLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ2hDLE1BQU0sS0FBSyxHQUFHLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQy9CLE9BQU8sTUFBTSxHQUFHLEtBQUssQ0FBQztZQUN4QixDQUFDLENBQUMsQ0FBQztTQUNKO1FBRUQsWUFBWTtRQUNaLElBQUksQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxLQUFVLEVBQUUsRUFBRTtZQUN0QyxJQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxFQUFFO2dCQUN6QixJQUFJLENBQUMsZUFBZSxDQUFDLEtBQUssQ0FBQyxDQUFDO2FBQzdCO1FBQ0gsQ0FBQyxDQUFDO1FBRUYsU0FBUztRQUNULElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLEdBQUcsR0FBRyxFQUFFO1lBQzFCLElBQUksVUFBVSxHQUFHLENBQUMsQ0FBQztZQUNuQixJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUFDO1lBQ3BCLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQztZQUVwQixVQUFVLENBQUMsR0FBRyxFQUFFO2dCQUNkLElBQUksQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQU0sRUFBRSxDQUFNLEVBQUUsRUFBRTtvQkFDaEQsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFFO3dCQUNoQixVQUFVLElBQUksQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztxQkFDdkM7Z0JBQ0gsQ0FBQyxDQUFDLENBQUM7Z0JBQ0gsNkJBQTZCO2dCQUM3QixhQUFhO2dCQUNiLElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxZQUFZLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRTtvQkFDdkMsYUFBYTtvQkFDYixVQUFVLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFlBQVksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDO2lCQUMxRDtnQkFFRCxJQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsa0JBQWtCLEVBQUU7b0JBQ2xDLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxFQUFFLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsV0FBVyxHQUFHLFVBQVUsQ0FBQztpQkFDbEU7cUJBQU07b0JBQ0wsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUM7aUJBQ3JEO2dCQUdELHlCQUF5QjtnQkFDekIsSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLGlCQUFpQixFQUFFO29CQUNqQyxjQUFjLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUUsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLHFCQUFxQixFQUFFLENBQUMsS0FBSyxHQUFHLEVBQUUsQ0FBQztvQkFDeEcsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxJQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxFQUFFLENBQUMsSUFBSSxDQUFDO2lCQUN4STtnQkFFRCwrQkFBK0I7Z0JBQy9CLE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsU0FBUyxDQUFDLGNBQWMsQ0FBQyxDQUFDO2dCQUM1RCxNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLFNBQVMsQ0FBQyxhQUFhLENBQUMsQ0FBQztnQkFDMUQsTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxTQUFTLENBQUMsYUFBYSxDQUFDLENBQUM7Z0JBQzFELFVBQVUsQ0FBQyxVQUFVLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxrQkFBa0IsRUFBRSxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsZUFBZSxFQUFFLENBQUM7cUJBQ2xGLElBQUksQ0FBQyxXQUFXLEVBQUUsYUFBYSxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDLElBQUksS0FBSyxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUM7Z0JBQzdGLFVBQVUsQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxrQkFBa0IsRUFBRSxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsZUFBZSxFQUFFLENBQUM7cUJBQ2pGLElBQUksQ0FBQyxXQUFXLEVBQUUsYUFBYSxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDLElBQUksS0FBSyxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUM7Z0JBQzdGLFVBQVUsQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxrQkFBa0IsRUFBRSxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsZUFBZSxFQUFFLENBQUM7cUJBQ2pGLElBQUksQ0FBQyxXQUFXLEVBQUUsYUFBYSxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDLElBQUksS0FBSyxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUM7Z0JBRzdGLFVBQVUsQ0FBQyxHQUFHLEVBQUU7b0JBQ2QsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQztnQkFDdEIsQ0FBQyxDQUFDLENBQUM7WUFDTCxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUM7UUFDVixDQUFDLENBQUM7UUFFRixnQkFBZ0I7UUFDaEIsSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQztRQUMxQyxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDO1FBQzFDLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLEdBQUcsR0FBRyxFQUFFO1lBQzFCLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDckIsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ2xDLENBQUMsQ0FBQztRQUdGLGdCQUFnQjtRQUNoQixJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDO1FBQzFDLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxHQUFHLEdBQUcsRUFBRTtZQUN2QixJQUFJLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxFQUFFLENBQUMsS0FBSyxDQUFDO1lBQ3ZELElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxFQUFFLENBQUM7WUFFckIsVUFBVSxDQUFDLEdBQUcsRUFBRTtnQkFDZCxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUFDO1lBQ3RCLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQztRQUNWLENBQUMsQ0FBQztJQUNKLENBQUM7SUFFTyxZQUFZO1FBQ2xCLE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDO1FBQzFDLElBQUksVUFBVSxJQUFJLFVBQVUsQ0FBQyxDQUFDLENBQUMsRUFBRTtZQUMvQixJQUFJLE1BQU0sQ0FBQztZQUNYLE1BQU0sVUFBVSxHQUFHLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNqQyxTQUFTO1lBQ1QsSUFBSSxVQUFVLElBQUksVUFBVSxDQUFDLE1BQU0sSUFBSSxVQUFVLENBQUMsTUFBTSxFQUFFO2dCQUN4RCxNQUFNLEdBQUcsVUFBVSxDQUFDLE1BQU0sQ0FBQzthQUM1QjtpQkFBTTtnQkFDTCxJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxFQUFFLENBQUMsR0FBRyxFQUFFLENBQUMsTUFBTSxFQUFFO29CQUVuQyxNQUFNLEdBQUc7d0JBQ1AsYUFBYTt3QkFDYixFQUFFLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxFQUFFLENBQUMsR0FBRyxFQUFFLEVBQzdCLENBQUMsQ0FBTSxFQUFFLEVBQUUsQ0FBQyxPQUFPLENBQUMsQ0FBQyxLQUFLLEtBQUssUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FDOUc7d0JBQ0QsRUFBRSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssRUFBRSxDQUFDLEdBQUcsRUFBRSxFQUM3QixDQUFDLENBQU0sRUFBRSxFQUFFLENBQUMsT0FBTyxDQUFDLENBQUMsS0FBSyxLQUFLLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUM1RztxQkFDRixDQUFDO2lCQUNIO3FCQUFNO29CQUNMLE1BQU0sR0FBRyxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQztpQkFDbkI7YUFDRjtZQUNELElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUVsRSxhQUFhO1lBQ2IsSUFBSSxVQUFVLENBQUMsVUFBVSxFQUFFO2dCQUN6QixJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssRUFBRSxDQUFDLFVBQVUsQ0FBQyxVQUFVLENBQUMsVUFBVSxDQUFDLENBQUM7YUFDdEQ7aUJBQU0sSUFBSSxVQUFVLENBQUMsWUFBWSxJQUFJLFVBQVUsQ0FBQyxZQUFZLEVBQUU7Z0JBQzdELE1BQU0sVUFBVSxHQUFHLENBQUMsQ0FBTSxFQUFFLEVBQUU7b0JBQzVCLElBQUksSUFBSSxHQUFHLEVBQUUsQ0FBQztvQkFDZCxJQUFJLFVBQVUsQ0FBQyxZQUFZLEVBQUU7d0JBQzNCLElBQUksSUFBSSxVQUFVLENBQUMsWUFBWSxDQUFDO3FCQUNqQztvQkFDRCxJQUFJLElBQUksSUFBSSxDQUFDLG1CQUFtQixDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQztvQkFDekMsSUFBSSxVQUFVLENBQUMsWUFBWSxFQUFFO3dCQUMzQixJQUFJLElBQUksVUFBVSxDQUFDLFlBQVksQ0FBQztxQkFDakM7b0JBRUQsT0FBTyxJQUFJLENBQUM7Z0JBQ2QsQ0FBQyxDQUFDO2dCQUNGLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxFQUFFLENBQUMsVUFBVSxDQUFDLFVBQVUsQ0FBQyxDQUFDO2FBQzNDO2lCQUFNO2dCQUNMLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxFQUFFLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBTSxFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsbUJBQW1CLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7YUFDN0U7WUFFRCxRQUFRO1lBQ1IsSUFBSSxVQUFVLENBQUMsU0FBUyxFQUFFO2dCQUN4QixJQUFJLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDLENBQUM7YUFDN0M7U0FDRjthQUFNO1lBQ0wsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLFdBQVcsRUFBRSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7U0FDakQ7SUFDSCxDQUFDO0lBRU8sY0FBYztRQUNwQixJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsV0FBVyxJQUFJLEdBQUcsQ0FBQztRQUNqRyxJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsWUFBWSxJQUFJLEdBQUcsQ0FBQztRQUVyRyxJQUFJLENBQUMsS0FBSzthQUNQLEtBQUssQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO2FBQ2pCLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDekIsQ0FBQztJQUVPLE1BQU07UUFDWixJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLEVBQUU7WUFDeEIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsR0FBRyxFQUFFLENBQUM7U0FDN0I7UUFFRCxPQUFPO1lBQ0wsTUFBTSxFQUFFLENBQUMsQ0FBTSxFQUFFLEVBQUU7Z0JBQ2pCLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQztnQkFDeEMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUMxQixDQUFDO1lBQ0QsV0FBVyxFQUFFLENBQUMsQ0FBTSxFQUFFLEVBQUU7Z0JBQ3RCLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQztnQkFDeEMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUMxQixDQUFDO1lBQ0QsY0FBYyxFQUFFLENBQUMsQ0FBTSxFQUFFLENBQU0sRUFBRSxFQUFFO2dCQUNqQyxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7Z0JBQ3hDLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxFQUFFLENBQUM7WUFDMUIsQ0FBQztTQUNGLENBQUM7SUFDSixDQUFDO0lBRU8sVUFBVTtRQUNoQixNQUFNLE9BQU8sR0FBSSxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQU0sRUFBRSxFQUFFO1lBQ25ELElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRTtnQkFDcEIsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7YUFDYjtpQkFBTTtnQkFDTCxPQUFPLENBQUMsQ0FBQzthQUNWO1FBQ0gsQ0FBQyxDQUFDLENBQUM7UUFDSCxPQUFPLE9BQU8sQ0FBQztJQUNqQixDQUFDO0lBRU8sY0FBYztRQUNwQixJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssRUFBRSxFQUFFO1lBQzNDLElBQUksQ0FBQyxRQUFRLEdBQUksRUFBRSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUM7aUJBQy9CLE1BQU0sQ0FBQyxLQUFLLENBQUM7aUJBQ2IsSUFBSSxDQUFDLE9BQU8sRUFBRSxvQkFBb0IsQ0FBQztpQkFDbkMsSUFBSSxDQUFDLEVBQUUsQ0FBQztpQkFDUixLQUFLLENBQUMsU0FBUyxFQUFFLENBQUMsQ0FBQztpQkFDbkIsS0FBSyxDQUFDLFVBQVUsRUFBRSxVQUFVLENBQUM7aUJBQzdCLEtBQUssQ0FBQyxTQUFTLEVBQUUsS0FBSyxDQUFDLENBQUM7U0FDNUI7UUFDRCxPQUFPLElBQUksQ0FBQyxRQUFRLENBQUM7SUFDdkIsQ0FBQztJQUVPLGVBQWUsQ0FBRSxLQUFVO1FBQ2pDLE1BQU0sQ0FBQyxHQUFHLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQztRQUVwQixJQUFJLFNBQVMsR0FBRyxDQUFDLENBQUMsU0FBUyxDQUFDLGFBQWEsQ0FBQyxDQUFDO1FBQzNDLElBQUksU0FBUyxDQUFDLEtBQUssRUFBRSxFQUFFO1lBQ3JCLFNBQVMsR0FBRyxDQUFDLENBQUMsTUFBTSxDQUFDLEdBQUcsRUFBRSxjQUFjLENBQUM7aUJBQ3RDLElBQUksQ0FBQyxPQUFPLEVBQUUsV0FBVyxDQUFDO2lCQUMxQixJQUFJLENBQUMsV0FBVyxFQUFFLGFBQWEsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQyxJQUFJLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDO1NBQzdGO1FBRUQsTUFBTSxRQUFRLEdBQUcsU0FBUyxDQUFDLFNBQVMsQ0FBQyxjQUFjLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUNqRixRQUFRLENBQUMsS0FBSyxFQUFFO2FBQ2IsTUFBTSxDQUFDLE1BQU0sQ0FBQzthQUNkLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFNLEVBQUUsQ0FBUyxFQUFFLEVBQUUsQ0FBQyxZQUFZLENBQUMsRUFBRSxDQUFDO2FBQ3JELElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFNLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxLQUFLLElBQUksTUFBTSxDQUFDO2FBQzNDLElBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQyxDQUFNLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxPQUFPLElBQUksRUFBRSxDQUFDO2FBQ2pELElBQUksQ0FBQyxRQUFRLEVBQUUsTUFBTSxDQUFDO2FBQ3RCLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFNLEVBQUUsRUFBRTtZQUNwQixNQUFNLE1BQU0sR0FBRyxDQUFDLENBQUMsTUFBTSxDQUFDO1lBQ3hCLElBQUksRUFBRSxDQUFDO1lBQ1AsYUFBYTtZQUNiLElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBSSxLQUFLLE1BQU0sRUFBRTtnQkFDM0MsYUFBYTtnQkFDYixNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxVQUFVLENBQUM7Z0JBQ3RELElBQUksTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sRUFBRTtvQkFDckIsRUFBRSxHQUFHLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLEVBQUUsQ0FBQztpQkFDMUI7cUJBQU07b0JBQ0wsRUFBRSxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsVUFBVSxDQUFDLENBQUMsT0FBTyxFQUFFLENBQUM7aUJBQzlDO2FBQ0Y7aUJBQU07Z0JBQ0wsRUFBRSxHQUFHLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQzthQUNoQjtZQUNELE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUM1QixDQUFDLENBQUM7YUFDRCxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQzthQUNaLElBQUksQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxXQUFXLEVBQUUsQ0FBQzthQUN4QyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBTSxFQUFFLEVBQUU7WUFDeEIsTUFBTSxNQUFNLEdBQUcsQ0FBQyxDQUFDLE1BQU0sQ0FBQztZQUN4QixJQUFJLEVBQUUsRUFBRSxFQUFFLENBQUM7WUFFWCxhQUFhO1lBQ2IsSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFJLEtBQUssTUFBTSxFQUFFO2dCQUMzQyxhQUFhO2dCQUNiLE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsV0FBVyxDQUFDLFVBQVUsQ0FBQztnQkFDdEQsRUFBRSxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsVUFBVSxDQUFDLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQzdDLEVBQUUsR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLFVBQVUsQ0FBQyxDQUFDLE9BQU8sRUFBRSxDQUFDO2FBQzlDO2lCQUFNO2dCQUNMLEVBQUUsR0FBRyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ2YsRUFBRSxHQUFHLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQzthQUNoQjtZQUNELE1BQU0sQ0FBQyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDN0IsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNoQyxDQUFDLENBQUMsQ0FBQztRQUVMLFVBQVUsQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxrQkFBa0IsRUFBRSxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsZUFBZSxFQUFFLENBQUM7YUFDaEYsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxLQUFLLElBQUksTUFBTSxDQUFDO2FBQ3BDLElBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsT0FBTyxJQUFJLEVBQUUsQ0FBQzthQUMxQyxJQUFJLENBQUMsUUFBUSxFQUFFLE1BQU0sQ0FBQzthQUN0QixJQUFJLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxFQUFFO1lBQ2IsTUFBTSxNQUFNLEdBQUcsQ0FBQyxDQUFDLE1BQU0sQ0FBQztZQUN4QixJQUFJLEVBQUUsQ0FBQztZQUNQLGFBQWE7WUFDYixJQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsV0FBVyxDQUFDLElBQUksS0FBSyxNQUFNLEVBQUU7Z0JBQzNDLGFBQWE7Z0JBQ2IsTUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxXQUFXLENBQUMsVUFBVSxDQUFDO2dCQUN0RCxFQUFFLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxVQUFVLENBQUMsQ0FBQyxPQUFPLEVBQUUsQ0FBQzthQUM5QztpQkFBTTtnQkFDTCxFQUFFLEdBQUcsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO2FBQ2hCO1lBQ0QsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQzVCLENBQUMsQ0FBQzthQUNELElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDLEVBQUU7WUFDakIsTUFBTSxNQUFNLEdBQUcsQ0FBQyxDQUFDLE1BQU0sQ0FBQztZQUN4QixJQUFJLEVBQUUsRUFBRSxFQUFFLENBQUM7WUFFWCxhQUFhO1lBQ2IsSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFJLEtBQUssTUFBTSxFQUFFO2dCQUMzQyxhQUFhO2dCQUNiLE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsV0FBVyxDQUFDLFVBQVUsQ0FBQztnQkFDdEQsRUFBRSxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsVUFBVSxDQUFDLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQzdDLEVBQUUsR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLFVBQVUsQ0FBQyxDQUFDLE9BQU8sRUFBRSxDQUFDO2FBQzlDO2lCQUFNO2dCQUNMLEVBQUUsR0FBRyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ2YsRUFBRSxHQUFHLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQzthQUNoQjtZQUNELE1BQU0sQ0FBQyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDN0IsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNoQyxDQUFDLENBQUMsQ0FBQztRQUVMLFVBQVUsQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxrQkFBa0IsRUFBRSxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsZUFBZSxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUMsQ0FBQyxDQUFDLE1BQU0sRUFBRSxDQUFDO0lBQ3pILENBQUM7SUFFTyxtQkFBbUIsQ0FBRSxLQUFXO1FBQ3RDLElBQUksQ0FBQyxLQUFLLEVBQUU7WUFDVixPQUFPLEVBQUUsQ0FBQztTQUNYO1FBQ0QsT0FBTyxjQUFjLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsQ0FBQyxFQUFFO1lBQzVDLEtBQUssR0FBRyxLQUFLLENBQUMsUUFBUSxFQUFFLENBQUMsT0FBTyxDQUFDLDBCQUEwQixFQUFFLEtBQUssQ0FBQyxDQUFDO1NBQ3JFO1FBQ0QsT0FBTyxLQUFLLENBQUM7SUFDZixDQUFDOztvSEF6cEJVLHVCQUF1Qjt3R0FBdkIsdUJBQXVCLDZJQUh4QixFQUFFOzJGQUdELHVCQUF1QjtrQkFMbkMsU0FBUzttQkFBQztvQkFDVCxRQUFRLEVBQUUsVUFBVTtvQkFDcEIsUUFBUSxFQUFFLEVBQUU7b0JBQ1osU0FBUyxFQUFFLENBQUMsbUNBQW1DLENBQUM7aUJBQ2pEO3NIQW1CSyxNQUFNO3NCQURULEtBQUs7dUJBQUMsUUFBUTtnQkFtQ0wsV0FBVztzQkFBcEIsTUFBTTtnQkFDRyxRQUFRO3NCQUFqQixNQUFNIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtDb21wb25lbnQsIEVsZW1lbnRSZWYsIEV2ZW50RW1pdHRlciwgSW5wdXQsIE5nWm9uZSwgT25Jbml0LCBPdXRwdXR9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0ICogYXMgZDMgZnJvbSAnZDMnO1xuaW1wb3J0IHtpc0FycmF5fSBmcm9tICdyeGpzL2ludGVybmFsLWNvbXBhdGliaWxpdHknO1xuaW1wb3J0IG1vbWVudCBmcm9tICdtb21lbnQnO1xuaW1wb3J0IHt0cmFuc2l0aW9ufSBmcm9tICdkYyc7XG5pbXBvcnQge0RqQ2hhcnR9IGZyb20gJy4vY2hhcnQvZGotY2hhcnQnO1xuaW1wb3J0IHtEakNoYXJ0T3B0aW9ufSBmcm9tICcuL2NsYXNzL2RqLWNoYXJ0LW9wdGlvbic7XG5cbkBDb21wb25lbnQoe1xuICBzZWxlY3RvcjogJ2RqLWNoYXJ0JyxcbiAgdGVtcGxhdGU6IGBgLFxuICBzdHlsZVVybHM6IFsnLi9hbmd1bGFyLWRqLWNoYXJ0LmNvbXBvbmVudC5zY3NzJ11cbn0pXG5leHBvcnQgY2xhc3MgQW5ndWxhckRqQ2hhcnRDb21wb25lbnQgaW1wbGVtZW50cyBPbkluaXQge1xuXG4gIGRqQ2hhcnQ/OiBEakNoYXJ0O1xuXG4gIG9ic2VydmVyOiBSZXNpemVPYnNlcnZlciB8IHVuZGVmaW5lZDtcbiAgZG9tV2lkdGg6IG51bWJlciB8IHVuZGVmaW5lZDtcbiAgcmVzaXplRGVsYXkgPSAzMDA7XG4gIHJlc2l6ZVRpbWVyOiBhbnk7XG5cbiAgY2hhcnQ6IGFueTtcbiAgYXhpc09wdGlvbj86IGFueTtcbiAgd2lzZUNoYXJ0PzogYW55O1xuICB3aWR0aD86IGFueTtcbiAgaGVpZ2h0PzogYW55O1xuICBfdG9vbHRpcD86IGFueTtcblxuICBfb3B0aW9uPzogRGpDaGFydE9wdGlvbjtcbiAgQElucHV0KCdvcHRpb24nKVxuICBzZXQgb3B0aW9uKG9wdGlvbjpEakNoYXJ0T3B0aW9uKSB7XG4gICAgaWYgKG9wdGlvbi50eXBlID09PSAnY29tcG9zaXRlJykge1xuICAgICAgb3B0aW9uLnNldEF4aXNPcHRpb24oKTtcbiAgICB9XG5cbiAgICB0aGlzLndpc2VDaGFydCA9IG5ldyBEakNoYXJ0KG9wdGlvbik7XG4gICAgdGhpcy5fb3B0aW9uID0gb3B0aW9uO1xuXG4gICAgc3dpdGNoIChvcHRpb24udHlwZSkge1xuICAgICAgY2FzZSAncGllQ2hhcnQnOlxuICAgICAgICB0aGlzLmNoYXJ0ID0gdGhpcy53aXNlQ2hhcnQucGllQ2hhcnQodGhpcy5lbFJlZi5uYXRpdmVFbGVtZW50KTtcbiAgICAgICAgdGhpcy5zZXRQaWVDaGFydCgpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ2Nsb3VkQ2hhcnQnOlxuICAgICAgICB0aGlzLmNoYXJ0ID0gdGhpcy53aXNlQ2hhcnQuY2xvdWRDaGFydCh0aGlzLmVsUmVmLm5hdGl2ZUVsZW1lbnQpO1xuICAgICAgICB0aGlzLnNldENsb3VkQ2hhcnQoKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdkY0NoYXJ0JzpcbiAgICAgICAgdGhpcy5zZXREY0NoYXJ0KCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgdGhpcy5jaGFydCA9IHRoaXMud2lzZUNoYXJ0LnNlcmllc0NoYXJ0KHRoaXMuZWxSZWYubmF0aXZlRWxlbWVudCk7XG4gICAgICAgIHRoaXMuc2V0TXVsdGlTZXJpZXMoKTtcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuXG4gICAgdGhpcy5jaGFydC5yZW5kZXIoKTtcbiAgICB0aGlzLnJlbmRlcmVkLmVtaXQodGhpcy5jaGFydCk7XG4gIH1cbiAgZ2V0IG9wdGlvbigpIHtcbiAgICAvLyBAdHMtaWdub3JlXG4gICAgcmV0dXJuIHRoaXMuX29wdGlvbjtcbiAgfVxuXG4gIEBPdXRwdXQoKSBjaGFuZ0ZpbHRlcjogRXZlbnRFbWl0dGVyPGFueT4gPSBuZXcgRXZlbnRFbWl0dGVyPGFueT4oKTtcbiAgQE91dHB1dCgpIHJlbmRlcmVkOiBFdmVudEVtaXR0ZXI8YW55PiA9IG5ldyBFdmVudEVtaXR0ZXI8YW55PigpO1xuXG5cbiAgY29uc3RydWN0b3IoXG4gICAgcHJpdmF0ZSBlbFJlZjogRWxlbWVudFJlZixcbiAgICBwcml2YXRlIHpvbmU6IE5nWm9uZVxuICApIHt9XG5cbiAgbmdPbkluaXQoKSB7XG4gICAgLy8gaW5pdCBkb2N1bWVudCB3aWR0aFxuICAgIHRoaXMuZG9tV2lkdGggPSB0aGlzLmVsUmVmLm5hdGl2ZUVsZW1lbnQuY2xpZW50V2lkdGg7XG4gICAgLy8gZWxlbWVudCDsgqzsnbTspojqsIAg67OA6rK965CY7JeI7J2E65WMXG4gICAgdGhpcy5vYnNlcnZlciA9IG5ldyBSZXNpemVPYnNlcnZlcihlbnRyaWVzID0+IHtcbiAgICAgIHRoaXMuem9uZS5ydW5PdXRzaWRlQW5ndWxhcigoKSA9PiB7XG4gICAgICAgIC8vIHJlc2l6ZSBkdXJhdGlvbjogdGhpcy5yZXNpemVEZWxheVxuICAgICAgICBjb25zdCB3aWR0aCA9IGVudHJpZXNbMF0uY29udGVudFJlY3Qud2lkdGg7XG4gICAgICAgIGNsZWFyVGltZW91dCh0aGlzLnJlc2l6ZVRpbWVyKTtcbiAgICAgICAgdGhpcy5yZXNpemVUaW1lciA9IHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgIGlmICh0aGlzLmRvbVdpZHRoICE9PSB3aWR0aCkge1xuICAgICAgICAgICAgdGhpcy5kb21XaWR0aCA9IHdpZHRoO1xuXG4gICAgICAgICAgICAvLyByZWRyYXdcbiAgICAgICAgICAgIGlmICh0aGlzLmNoYXJ0KSB7XG4gICAgICAgICAgICAgIHRoaXMuY2hhcnQubWluV2lkdGgoMTAwKTtcbiAgICAgICAgICAgICAgdGhpcy5jaGFydC5taW5IZWlnaHQoNTApO1xuICAgICAgICAgICAgICB0aGlzLmNoYXJ0LndpZHRoKDApO1xuICAgICAgICAgICAgICB0aGlzLmNoYXJ0LmhlaWdodCgwKTtcbiAgICAgICAgICAgICAgaWYgKHRoaXMuY2hhcnQucmVzY2FsZSkge1xuICAgICAgICAgICAgICAgIHRoaXMuY2hhcnQucmVzY2FsZSgpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGlmICh0aGlzLmNoYXJ0LnVwZGF0ZSkge1xuICAgICAgICAgICAgICAgIHRoaXMuY2hhcnQudXBkYXRlKCk7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jaGFydC5yZWRyYXcoKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSwgdGhpcy5yZXNpemVEZWxheSk7XG5cbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgdGhpcy5vYnNlcnZlci5vYnNlcnZlKHRoaXMuZWxSZWYubmF0aXZlRWxlbWVudCk7XG4gIH1cblxuXG4gIG5nT25EZXN0cm95KCkge1xuICAgIC8vIOyDneyEseuQnCB0b29sdGlwIOygnOqxsFxuICAgIGlmICh0aGlzLl90b29sdGlwKSB7XG4gICAgICB0aGlzLl90b29sdGlwLnJlbW92ZSgpO1xuICAgIH1cbiAgICBpZiAodGhpcy5jaGFydC5jaGlsZHJlbikge1xuICAgICAgdGhpcy5jaGFydC5jaGlsZHJlbigpLmZvckVhY2goKGNoYXJ0OiBhbnkpID0+IHtcbiAgICAgICAgaWYgKGNoYXJ0Ll90b29sdGlwKSB7XG4gICAgICAgICAgY2hhcnQuX3Rvb2x0aXAucmVtb3ZlKCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vIEB0cy1pZ25vcmVcbiAgICB0aGlzLm9ic2VydmVyLnVub2JzZXJ2ZSh0aGlzLmVsUmVmLm5hdGl2ZUVsZW1lbnQpO1xuICB9XG5cblxuICBjcmVhdGUoKSB7XG4gICAgdGhpcy5zZXRXaWR0aEhlaWdodCgpO1xuICAgIHRoaXMuc2V0TWFyZ2lucygpO1xuXG4gICAgLy8gaW5wdXQgdHlwZeydtCBjcm9zc2ZpbHRlcuyZgCBkYXRh7J2865WMIOyymOumrFxuICAgIGlmICh0aGlzLm9wdGlvbi5kYXRhICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHRoaXMuY2hhcnQuZGltZW5zaW9uKHRoaXMuZmlsdGVyKCkpO1xuICAgICAgdGhpcy5jaGFydC5ncm91cCh7YWxsOiAoKSA9PiB0aGlzLm9wdGlvbi5kYXRhLCBzaXplOiAoKSA9PiB0aGlzLm9wdGlvbi5kYXRhLmxlbmd0aH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmNoYXJ0LmRpbWVuc2lvbih0aGlzLm9wdGlvbi5kaW1lbnNpb24pO1xuICAgICAgdGhpcy5jaGFydC5ncm91cCh0aGlzLm9wdGlvbi5ncm91cCk7XG4gICAgfVxuXG4gICAgY29uc3Qgb3ZlcnJpZGVGaWVsZHMgPSBbJ29uQ2xpY2snXTtcbiAgICBvdmVycmlkZUZpZWxkcy5mb3JFYWNoKGtleSA9PiB7XG4gICAgICAvLyBAdHMtaWdub3JlXG4gICAgICBpZiAodGhpcy5vcHRpb25ba2V5XSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGlmIChrZXkgPT09ICdvbkNsaWNrJykge1xuICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICB0aGlzLmNoYXJ0W2tleV0gPSAoZDogYW55KSA9PiB0aGlzLm9wdGlvbi5vbkNsaWNrKGQsIGV2ZW50KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgdGhpcy5jaGFydFtrZXldID0gdGhpcy5vcHRpb25ba2V5XTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuXG4gICAgaWYgKHRoaXMub3B0aW9uLm9uQ2xpY2tFdmVudCkge1xuICAgICAgdGhpcy5jaGFydFsnX29uQ2xpY2tFdmVudCddID0gdGhpcy5jaGFydC5vbkNsaWNrO1xuICAgICAgdGhpcy5jaGFydFsnb25DbGljayddID0gKGQ6IGFueSkgPT4ge1xuICAgICAgICB0aGlzLmNoYXJ0Ll9vbkNsaWNrRXZlbnQoZCk7XG4gICAgICAgIHRoaXMub3B0aW9uLm9uQ2xpY2tFdmVudChkKTtcbiAgICAgIH07XG4gICAgfVxuXG4gICAgaWYgKHRoaXMub3B0aW9uLm9uRmlsdGVyQ2hhbmdlZCkge1xuICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgdGhpcy5jaGFydC5vbignZmlsdGVyZWQnLCAoZDogYW55KSA9PiB0aGlzLm9wdGlvbi5vbkZpbHRlckNoYW5nZWQoZCkpO1xuICAgIH1cblxuICAgIHRoaXMub3B0aW9uWydjaGFydCddID0gdGhpcy5jaGFydDtcbiAgfVxuXG4gIHByaXZhdGUgc2V0UGllQ2hhcnQoKSB7XG4gICAgdGhpcy5jcmVhdGUoKTtcbiAgICBjb25zdCBfaW5uZXJSYWRpdXMgPSB0aGlzLm9wdGlvbi5pbm5lclJhZGl1cyB8fCAzMDtcbiAgICBjb25zdCBfcmFkaXVzID0gdGhpcy5vcHRpb24ucmFkaXVzIHx8IDgwO1xuICAgIGNvbnN0IF9leHRlcm5hbExhYmVscyA9IHRoaXMub3B0aW9uLmV4dGVybmFsTGFiZWxzIHx8IDA7XG4gICAgY29uc3Qgc2l6ZSA9IGQzLm1pbihbK3RoaXMud2lkdGgsICt0aGlzLmhlaWdodF0pO1xuXG4gICAgdGhpcy5jaGFydFxuICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgLnJhZGl1cygoc2l6ZSAvIDIpICogKF9yYWRpdXMgLyAxMDApKVxuICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgLmlubmVyUmFkaXVzKChzaXplIC8gMikgKiAoX2lubmVyUmFkaXVzIC8gMTAwKSlcbiAgICAgIC5leHRlcm5hbExhYmVscyhfZXh0ZXJuYWxMYWJlbHMpXG4gICAgICAuZHJhd1BhdGhzKHRydWUpO1xuXG4gICAgaWYgKHRoaXMub3B0aW9uLnNsaWNlc1BlcmNlbnQpIHtcbiAgICAgIGxldCBkYXRhID0gdGhpcy5vcHRpb24uZGF0YSA/IHRoaXMub3B0aW9uLmRhdGEgOiB0aGlzLm9wdGlvbi5ncm91cC5hbGwoKTtcbiAgICAgIGRhdGEgPSBkYXRhLnNvcnQoKGE6IGFueSwgYjogYW55KSA9PiBiLnZhbHVlIC0gYS52YWx1ZSk7XG4gICAgICBsZXQgc3VtID0gMDtcbiAgICAgIGxldCBpbmRleCA9IDA7XG4gICAgICBkYXRhLmZvckVhY2goKGQ6IGFueSkgPT4gc3VtICs9IGQudmFsdWUpO1xuICAgICAgd2hpbGUgKGluZGV4IDwgZGF0YS5sZW5ndGgpIHtcbiAgICAgICAgY29uc3QgcGVyY2VudCA9IChkYXRhW2luZGV4XS52YWx1ZSAvIHN1bSkgKiAxMDA7XG4gICAgICAgIGlmIChwZXJjZW50IDwgdGhpcy5vcHRpb24uc2xpY2VzUGVyY2VudCkge1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGluZGV4Kys7XG4gICAgICB9XG5cbiAgICAgIHRoaXMuY2hhcnQuc2xpY2VzQ2FwKGluZGV4KTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5vcHRpb24uc2xpY2VzQ2FwKSB7XG4gICAgICB0aGlzLmNoYXJ0LnNsaWNlc0NhcCh0aGlzLm9wdGlvbi5zbGljZXNDYXApO1xuICAgIH1cblxuICAgIGlmICh0aGlzLm9wdGlvbi5jb2xvcnMpIHtcbiAgICAgIHRoaXMuY2hhcnQuY29sb3JzKChkOiBhbnkpID0+IHtcbiAgICAgICAgY29uc3Qga2V5ID0gaXNBcnJheShkKSA/IGRbMF0gOiBkO1xuICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgIHJldHVybiB0aGlzLm9wdGlvbi5jb2xvcnNba2V5XSB8fCAnI2NjYyc7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICB0aGlzLmNoYXJ0Lm9uKCdwcmV0cmFuc2l0aW9uJywgKGNoYXJ0OiBhbnkpID0+IHtcbiAgICAgIGNoYXJ0LnNlbGVjdEFsbCgndGV4dC5waWUtc2xpY2UnKS50ZXh0KChkOiBhbnkpID0+IHtcbiAgICAgICAgbGV0IGtleSA9IGQuZGF0YS5rZXk7XG4gICAgICAgIGNvbnN0IGFuZ2xlID0gZC5lbmRBbmdsZSAtIGQuc3RhcnRBbmdsZTtcbiAgICAgICAgaWYgKHRoaXMub3B0aW9uLmxlZ2VuZHMpIHtcbiAgICAgICAgICBrZXkgPSB0aGlzLm9wdGlvbi5sZWdlbmRzW2tleV0gfHwga2V5O1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGFuZ2xlID4gMC41IHx8IChhbmdsZSA+IDAuNSAmJiBfZXh0ZXJuYWxMYWJlbHMpKSB7XG4gICAgICAgICAgcmV0dXJuIGtleTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gJyc7XG4gICAgICB9KTtcblxuICAgICAgaWYgKHRoaXMub3B0aW9uLnRvb2x0aXApIHtcbiAgICAgICAgY29uc3QgdG9vbHRpcCA9IHRoaXMuZ2V0VG9vbHRpcEVsZW0oKTtcbiAgICAgICAgY2hhcnQuc2VsZWN0QWxsKCd0aXRsZScpLnJlbW92ZSgpO1xuICAgICAgICBjaGFydC5zZWxlY3RBbGwoJ2cucGllLXNsaWNlJylcbiAgICAgICAgICAub24oJ21vdXNlbW92ZScsIChkYXRhOiBhbnkpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGtleSA9IGlzQXJyYXkoZGF0YS5kYXRhLmtleSkgPyBkYXRhLmRhdGEua2V5WzBdIDogZGF0YS5kYXRhLmtleTtcbiAgICAgICAgICAgIGNvbnN0IGNvbG9yID0gdGhpcy5vcHRpb24uY29sb3JzID8gdGhpcy5vcHRpb24uY29sb3JzW2tleV0gOiB0aGlzLmNoYXJ0LmdldENvbG9yKGRhdGEuZGF0YSk7XG4gICAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICBjb25zdCBwYWdlWCA9IGV2ZW50LnBhZ2VYO1xuICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgY29uc3QgcGFnZVkgPSBldmVudC5wYWdlWTtcbiAgICAgICAgICAgIGxldCBsZWZ0ID0gMCwgdG9wID0gMDtcblxuICAgICAgICAgICAgdG9vbHRpcC50cmFuc2l0aW9uKClcbiAgICAgICAgICAgICAgLmR1cmF0aW9uKDEwMClcbiAgICAgICAgICAgICAgLnN0eWxlKCdvcGFjaXR5JywgLjkpXG4gICAgICAgICAgICAgIC5zdHlsZSgnYmFja2dyb3VuZCcsIGNvbG9yKVxuICAgICAgICAgICAgICAuc3R5bGUoJ2JvcmRlci1jb2xvcicsIGNvbG9yKVxuICAgICAgICAgICAgICAuc3R5bGUoJ3otaW5kZXgnLCAxMDAwMCk7XG4gICAgICAgICAgICB0b29sdGlwLmh0bWwodGhpcy5vcHRpb24udG9vbHRpcChkYXRhKSk7XG5cbiAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgICBjb25zdCB0b29sWCA9IHRvb2x0aXAubm9kZSgpLmNsaWVudFdpZHRoO1xuICAgICAgICAgICAgICBjb25zdCB0b29sWSA9IHRvb2x0aXAubm9kZSgpLmNsaWVudEhlaWdodDtcbiAgICAgICAgICAgICAgdG9wID0gcGFnZVkgLSB0b29sWSAtIDIwO1xuICAgICAgICAgICAgICBsZWZ0ID0gcGFnZVggLSAodG9vbFggLyAyKTtcblxuICAgICAgICAgICAgICB0b29sdGlwXG4gICAgICAgICAgICAgICAgLnN0eWxlKCd0b3AnLCB0b3AgKyAncHgnKVxuICAgICAgICAgICAgICAgIC5zdHlsZSgnbGVmdCcsIGxlZnQgKyAncHgnKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0pXG4gICAgICAgICAgLm9uKCdtb3VzZW91dCcsIChkYXRhOiBhbnkpID0+IHtcbiAgICAgICAgICAgIHRvb2x0aXAgLnRyYW5zaXRpb24oKVxuICAgICAgICAgICAgICAuZHVyYXRpb24oMzAwKVxuICAgICAgICAgICAgICAuc3R5bGUoJ29wYWNpdHknLCAwKVxuICAgICAgICAgICAgICAuc3R5bGUoJ3otaW5kZXgnLCAtMSk7XG4gICAgICAgICAgfSk7XG5cbiAgICAgICAgLypzeW1ib2xzXG4gICAgICAgICAgKi9cblxuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgcHJpdmF0ZSBzZXREY0NoYXJ0KCkge1xuICAgIC8vIEB0cy1pZ25vcmVcbiAgICB0aGlzLmNoYXJ0ID0gdGhpcy53aXNlQ2hhcnRbdGhpcy5vcHRpb24uZGNDaGFydF0odGhpcy5lbFJlZi5uYXRpdmVFbGVtZW50KTtcbiAgICB0aGlzLmNyZWF0ZSgpO1xuXG4gICAgT2JqZWN0LmtleXModGhpcy5vcHRpb24pLmZvckVhY2goa2V5ID0+IHtcbiAgICAgIGlmICh0aGlzLmNoYXJ0W2tleV0pIHtcbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICB0aGlzLmNoYXJ0W2tleV0odGhpcy5vcHRpb25ba2V5XSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBwcml2YXRlIHNldENsb3VkQ2hhcnQoKSB7XG4gICAgdGhpcy5jcmVhdGUoKTtcbiAgICB0aGlzLmNoYXJ0LnBhZGRpbmcodGhpcy5vcHRpb24ucGFkZGluZyk7XG4gICAgdGhpcy5jaGFydC5sZWdlbmRzKHRoaXMub3B0aW9uLmxlZ2VuZHMpO1xuICB9XG5cbiAgcHJpdmF0ZSBzZXRNYXJnaW5zKCkge1xuICAgIGlmICh0aGlzLm9wdGlvbi5tYXJnaW5zKSB7XG4gICAgICB0aGlzLmNoYXJ0Lm1hcmdpbnMoKS5sZWZ0ID0gdGhpcy5vcHRpb24ubWFyZ2lucy5sZWZ0ICE9PSB1bmRlZmluZWQgPyArdGhpcy5vcHRpb24ubWFyZ2lucy5sZWZ0IDogMzA7XG4gICAgICB0aGlzLmNoYXJ0Lm1hcmdpbnMoKS5yaWdodCA9IHRoaXMub3B0aW9uLm1hcmdpbnMucmlnaHQgIT09IHVuZGVmaW5lZCA/ICt0aGlzLm9wdGlvbi5tYXJnaW5zLnJpZ2h0IDogNTA7XG4gICAgICB0aGlzLmNoYXJ0Lm1hcmdpbnMoKS5ib3R0b20gPSB0aGlzLm9wdGlvbi5tYXJnaW5zLmJvdHRvbSAhPT0gdW5kZWZpbmVkID8gK3RoaXMub3B0aW9uLm1hcmdpbnMuYm90dG9tIDogMzA7XG4gICAgICB0aGlzLmNoYXJ0Lm1hcmdpbnMoKS50b3AgPSB0aGlzLm9wdGlvbi5tYXJnaW5zLnRvcCAhPT0gdW5kZWZpbmVkID8gK3RoaXMub3B0aW9uLm1hcmdpbnMudG9wIDogMTA7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBzZXRNdWx0aVNlcmllcygpIHtcbiAgICB0aGlzLmNyZWF0ZSgpO1xuXG4gICAgbGV0IG1pbiA9IGQzLm1pbih0aGlzLmNoYXJ0Lmdyb3VwKCkuYWxsKCksIChkOiBhbnkpID0+ICtkLmtleVsxXSkgfHwgMDtcbiAgICBsZXQgbWF4ID0gZDMubWF4KHRoaXMuY2hhcnQuZ3JvdXAoKS5hbGwoKSwgKGQ6IGFueSkgPT4gK2Qua2V5WzFdKTtcbiAgICBjb25zdCBzdWJDaGFydCA9IChjOiBhbnkpID0+IHtcbiAgICAgIHJldHVybiB0aGlzLndpc2VDaGFydC5tdWx0aUNoYXJ0KGMpO1xuICAgIH07XG5cblxuICAgIGNvbnN0IHJpZ2h0WUF4aXNXaWR0aCA9IDA7XG4gICAgbGV0IGxlZnRZQXhpc1dpZHRoID0gMzA7XG4gICAgdGhpcy5jaGFydFxuICAgICAgLmNoYXJ0KHN1YkNoYXJ0KVxuICAgICAgLnJlbmRlckhvcml6b250YWxHcmlkTGluZXModHJ1ZSlcbiAgICAgIC5yZW5kZXJWZXJ0aWNhbEdyaWRMaW5lcyh0cnVlKVxuICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgLngoZDMuc2NhbGVMaW5lYXIoKS5kb21haW4oW21pbiwgbWF4XSkpXG4gICAgICAueUF4aXNMYWJlbCh0aGlzLm9wdGlvbi5heGlzT3B0aW9uICYmIHRoaXMub3B0aW9uLmF4aXNPcHRpb24ubGVuZ3RoID8gdGhpcy5vcHRpb24uYXhpc09wdGlvblswXS5heGlzTGFiZWwgOiB0aGlzLm9wdGlvbi55QXhpc0xhYmVsKVxuICAgICAgLnhBeGlzTGFiZWwodGhpcy5vcHRpb24ueEF4aXNMYWJlbClcbiAgICAgIC5jbGlwUGFkZGluZyg1KVxuICAgICAgLmVsYXN0aWNZKGZhbHNlKVxuICAgICAgLm1vdXNlWm9vbWFibGUoZmFsc2UpXG4gICAgICAuYnJ1c2hPbihmYWxzZSlcbiAgICAgIC5zZXJpZXNBY2Nlc3NvcigoZDogYW55KSA9PiBkLmtleVswXSlcbiAgICAgIC5zZXJpZXNTb3J0KChhOiBhbnksIGI6IGFueSkgPT4ge1xuICAgICAgICBjb25zdCBvcmRlckxpc3QgPSB0aGlzLm9wdGlvbi5heGlzT3B0aW9uLm1hcCgoZDogYW55KSA9PiBkLnNlcmllcyk7XG4gICAgICAgIHJldHVybiBvcmRlckxpc3QuaW5kZXhPZihhKSAtIG9yZGVyTGlzdC5pbmRleE9mKGIpO1xuICAgICAgfSlcbiAgICAgIC5rZXlBY2Nlc3NvcigoZDogYW55KSA9PiB7XG4gICAgICAgIHJldHVybiBkLmtleSA/IGlzTmFOKGQua2V5WzFdKSA/IGQua2V5WzFdIDogK2Qua2V5WzFdIDogbnVsbDtcbiAgICAgIH0pXG4gICAgICAudmFsdWVBY2Nlc3NvcigoZDogYW55KSA9PiBkLnZhbHVlKTtcblxuICAgIC8vIHNldCBsZWYgeSBheGlzXG4gICAgdGhpcy5zZXRMZWZ0WUF4aXMoKTtcblxuICAgIC8vIHhBeGlzXG4gICAgaWYgKHRoaXMub3B0aW9uLnhBeGlzT3B0aW9uKSB7XG4gICAgICBpZiAodGhpcy5vcHRpb24ueEF4aXNPcHRpb24uZG9tYWluKSB7XG4gICAgICAgIG1pbiA9IHRoaXMub3B0aW9uLnhBeGlzT3B0aW9uLmRvbWFpblswXTtcbiAgICAgICAgbWF4ID0gdGhpcy5vcHRpb24ueEF4aXNPcHRpb24uZG9tYWluWzFdO1xuICAgICAgfVxuICAgICAgc3dpdGNoICh0aGlzLm9wdGlvbi54QXhpc09wdGlvbi50eXBlKSB7XG4gICAgICAgIGNhc2UgJ29yZGluYWwnOlxuICAgICAgICAgIHRoaXMuY2hhcnQueChkMy5zY2FsZUJhbmQoKSkueFVuaXRzKHRoaXMud2lzZUNoYXJ0LnVuaXRzLm9yZGluYWwpLmRvbWFpbihbbWluLCBtYXhdKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnZGF0ZSc6XG4gICAgICAgICAgaWYgKHRoaXMub3B0aW9uLnhBeGlzT3B0aW9uLmRvbWFpbikge1xuICAgICAgICAgICAgbWluID0gbW9tZW50KG1pbiwgdGhpcy5vcHRpb24ueEF4aXNPcHRpb24uZGF0ZUZvcm1hdCkudmFsdWVPZigpO1xuICAgICAgICAgICAgbWF4ID0gbW9tZW50KG1heCwgdGhpcy5vcHRpb24ueEF4aXNPcHRpb24uZGF0ZUZvcm1hdCkudmFsdWVPZigpO1xuICAgICAgICAgIH1cbiAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgdGhpcy5jaGFydC54KGQzLnNjYWxlVGltZSgpLmRvbWFpbihbbmV3IERhdGUobWluKSwgbmV3IERhdGUobWF4KV0pKTtcbiAgICAgICAgICBpZiAodGhpcy5vcHRpb24ueEF4aXNPcHRpb24uZGF0ZVRpY2tGb3JtYXQpIHtcbiAgICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICAgIHRoaXMuY2hhcnQueEF4aXMoKS50aWNrRm9ybWF0KChkOiBhbnkpID0+IG1vbWVudChkKS5mb3JtYXQodGhpcy5vcHRpb24ueEF4aXNPcHRpb24uZGF0ZVRpY2tGb3JtYXQpKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgIHRoaXMuY2hhcnQueChkMy5zY2FsZUxpbmVhcigpLmRvbWFpbihbbWluLCBtYXhdKSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICB9XG5cbiAgICAgIGlmICh0aGlzLm9wdGlvbi54QXhpc09wdGlvbi50aWNrcykge1xuICAgICAgICB0aGlzLmNoYXJ0LnhBeGlzKCkudGlja3ModGhpcy5vcHRpb24ueEF4aXNPcHRpb24udGlja3MpO1xuICAgICAgfVxuICAgICAgaWYgKHRoaXMub3B0aW9uLnhBeGlzT3B0aW9uLnRpY2tGb3JtYXQpIHtcbiAgICAgICAgdGhpcy5jaGFydC54QXhpcygpLnRpY2tGb3JtYXQodGhpcy5vcHRpb24ueEF4aXNPcHRpb24udGlja0Zvcm1hdCk7XG4gICAgICB9XG5cbiAgICAgIHRoaXMuY2hhcnQueEF4aXNMYWJlbCh0aGlzLm9wdGlvbi54QXhpc09wdGlvbi5heGlzTGFiZWwpO1xuICAgIH1cblxuICAgIC8vIHNlcmllcyBzb3J0XG4gICAgaWYgKHRoaXMub3B0aW9uLm9yZGVyKSB7XG4gICAgICB0aGlzLmNoYXJ0LnNlcmllc1NvcnQoKGE6IHN0cmluZywgYjogc3RyaW5nKSA9PiB7XG4gICAgICAgIGNvbnN0IG9yZGVyID0gdGhpcy5vcHRpb24ub3JkZXI7XG4gICAgICAgIGNvbnN0IGJlZm9yZSA9IG9yZGVyLmluZGV4T2YoYSk7XG4gICAgICAgIGNvbnN0IGFmdGVyID0gb3JkZXIuaW5kZXhPZihiKTtcbiAgICAgICAgcmV0dXJuIGJlZm9yZSAtIGFmdGVyO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8gcmVuZGVybGV0XG4gICAgdGhpcy5jaGFydFsncmVuZGVyT24nXSA9IChjaGFydDogYW55KSA9PiB7XG4gICAgICBpZiAodGhpcy5vcHRpb24uaGlnaGxpZ2h0KSB7XG4gICAgICAgIHRoaXMucmVuZGVySGlnaGxpZ2h0KGNoYXJ0KTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgLy8gdXBkYXRlXG4gICAgdGhpcy5jaGFydFsndXBkYXRlJ10gPSAoKSA9PiB7XG4gICAgICBsZXQgcmlnaHRXaWR0aCA9IDA7XG4gICAgICB0aGlzLmNoYXJ0LnJlZHJhdygpO1xuICAgICAgdGhpcy5zZXRMZWZ0WUF4aXMoKTtcblxuICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgIHRoaXMub3B0aW9uLmF4aXNPcHRpb24uZm9yRWFjaCgodjogYW55LCBpOiBhbnkpID0+IHtcbiAgICAgICAgICBpZiAoaSAmJiAhdi5oaWRlKSB7XG4gICAgICAgICAgICByaWdodFdpZHRoICs9ICt2LndpZHRoID8gK3Yud2lkdGggOiAwO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIC8vIHJpZ2h0IHlBeGlzIDLqsJwg7J207IOB67aA7YSwIDM17JSpIOy2lOqwgFxuICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgIGlmICh0aGlzLm9wdGlvbi55QXhpc09wdGlvbnMubGVuZ3RoID4gMikge1xuICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICByaWdodFdpZHRoICs9ICh0aGlzLm9wdGlvbi55QXhpc09wdGlvbnMubGVuZ3RoIC0gMikgKiAzNTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLm9wdGlvbi5lbGFzdGljUmlnaHRNYXJnaW4pIHtcbiAgICAgICAgICB0aGlzLmNoYXJ0Lm1hcmdpbnMoKS5yaWdodCA9IHRoaXMuY2hhcnQubWFyZ2luUmlnaHQgKyByaWdodFdpZHRoO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXMuY2hhcnQubWFyZ2lucygpLnJpZ2h0ID0gdGhpcy5jaGFydC5tYXJnaW5SaWdodDtcbiAgICAgICAgfVxuXG5cbiAgICAgICAgLy8gbGVmdCB5QXhpcyDsnZggd2lkdGgg6rWs7ZWY6riwXG4gICAgICAgIGlmICh0aGlzLm9wdGlvbi5lbGFzdGljTGVmdE1hcmdpbikge1xuICAgICAgICAgIGxlZnRZQXhpc1dpZHRoID0gdGhpcy5jaGFydC5zdmcoKS5zZWxlY3RBbGwoJy5heGlzLnknKS5fZ3JvdXBzWzBdWzBdLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLndpZHRoICsgMjA7XG4gICAgICAgICAgdGhpcy5jaGFydC5tYXJnaW5zKCkubGVmdCA9IHRoaXMub3B0aW9uLmF4aXNPcHRpb25bMF0uYXhpc0xhYmVsIHx8IHRoaXMub3B0aW9uLnlBeGlzTGFiZWwgPyBsZWZ0WUF4aXNXaWR0aCA6IHRoaXMuY2hhcnQubWFyZ2lucygpLmxlZnQ7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBsZWZ0IG1hcmdpbiDsmIHsl60g66eM7YG8IGNoYXJ0IGcg7J2064+ZXG4gICAgICAgIGNvbnN0IGNoYXJ0Qm9keXMgPSB0aGlzLmNoYXJ0LmcoKS5zZWxlY3RBbGwoJ2cuY2hhcnQtYm9keScpO1xuICAgICAgICBjb25zdCBncmlkTGluZXMgPSB0aGlzLmNoYXJ0LmcoKS5zZWxlY3RBbGwoJ2cuZ3JpZC1saW5lJyk7XG4gICAgICAgIGNvbnN0IGhpZ2hsaWdodCA9IHRoaXMuY2hhcnQuZygpLnNlbGVjdEFsbCgnZy5oaWdobGlnaHQnKTtcbiAgICAgICAgdHJhbnNpdGlvbihjaGFydEJvZHlzLCB0aGlzLmNoYXJ0LnRyYW5zaXRpb25EdXJhdGlvbigpLCB0aGlzLmNoYXJ0LnRyYW5zaXRpb25EZWxheSgpKVxuICAgICAgICAgIC5hdHRyKCd0cmFuc2Zvcm0nLCBgdHJhbnNsYXRlKCR7dGhpcy5jaGFydC5tYXJnaW5zKCkubGVmdH0sICR7dGhpcy5jaGFydC5tYXJnaW5zKCkudG9wfSlgKTtcbiAgICAgICAgdHJhbnNpdGlvbihncmlkTGluZXMsIHRoaXMuY2hhcnQudHJhbnNpdGlvbkR1cmF0aW9uKCksIHRoaXMuY2hhcnQudHJhbnNpdGlvbkRlbGF5KCkpXG4gICAgICAgICAgLmF0dHIoJ3RyYW5zZm9ybScsIGB0cmFuc2xhdGUoJHt0aGlzLmNoYXJ0Lm1hcmdpbnMoKS5sZWZ0fSwgJHt0aGlzLmNoYXJ0Lm1hcmdpbnMoKS50b3B9KWApO1xuICAgICAgICB0cmFuc2l0aW9uKGhpZ2hsaWdodCwgdGhpcy5jaGFydC50cmFuc2l0aW9uRHVyYXRpb24oKSwgdGhpcy5jaGFydC50cmFuc2l0aW9uRGVsYXkoKSlcbiAgICAgICAgICAuYXR0cigndHJhbnNmb3JtJywgYHRyYW5zbGF0ZSgke3RoaXMuY2hhcnQubWFyZ2lucygpLmxlZnR9LCAke3RoaXMuY2hhcnQubWFyZ2lucygpLnRvcH0pYCk7XG5cblxuICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICB0aGlzLmNoYXJ0LnJlZHJhdygpO1xuICAgICAgICB9KTtcbiAgICAgIH0sIDUwMCk7XG4gICAgfTtcblxuICAgIC8vIHJlZHJhdyBjaGFuZ2VcbiAgICB0aGlzLmNoYXJ0WydfcmVkcmF3J10gPSB0aGlzLmNoYXJ0LnJlZHJhdztcbiAgICB0aGlzLmNoYXJ0WydfcmVkcmF3J10gPSB0aGlzLmNoYXJ0LnJlZHJhdztcbiAgICB0aGlzLmNoYXJ0WydyZWRyYXcnXSA9ICgpID0+IHtcbiAgICAgIHRoaXMuY2hhcnQuX3JlZHJhdygpO1xuICAgICAgdGhpcy5jaGFydC5yZW5kZXJPbih0aGlzLmNoYXJ0KTtcbiAgICB9O1xuXG5cbiAgICAvLyByZW5kZXIgY2hhbmdlXG4gICAgdGhpcy5jaGFydFsnX3JlbmRlciddID0gdGhpcy5jaGFydC5yZW5kZXI7XG4gICAgdGhpcy5jaGFydC5yZW5kZXIgPSAoKSA9PiB7XG4gICAgICB0aGlzLmNoYXJ0WydtYXJnaW5SaWdodCddID0gdGhpcy5jaGFydC5tYXJnaW5zKCkucmlnaHQ7XG4gICAgICB0aGlzLmNoYXJ0Ll9yZW5kZXIoKTtcblxuICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgIHRoaXMuY2hhcnQudXBkYXRlKCk7XG4gICAgICB9LCAzMDApO1xuICAgIH07XG4gIH1cblxuICBwcml2YXRlIHNldExlZnRZQXhpcygpIHtcbiAgICBjb25zdCBheGlzT3B0aW9uID0gdGhpcy5vcHRpb24uYXhpc09wdGlvbjtcbiAgICBpZiAoYXhpc09wdGlvbiAmJiBheGlzT3B0aW9uWzBdKSB7XG4gICAgICBsZXQgZG9tYWluO1xuICAgICAgY29uc3QgbGVmdE9wdGlvbiA9IGF4aXNPcHRpb25bMF07XG4gICAgICAvLyBkb21haW5cbiAgICAgIGlmIChheGlzT3B0aW9uICYmIGF4aXNPcHRpb24ubGVuZ3RoICYmIGxlZnRPcHRpb24uZG9tYWluKSB7XG4gICAgICAgIGRvbWFpbiA9IGxlZnRPcHRpb24uZG9tYWluO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKHRoaXMuY2hhcnQuZ3JvdXAoKS5hbGwoKS5sZW5ndGgpIHtcblxuICAgICAgICAgIGRvbWFpbiA9IFtcbiAgICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICAgIGQzLm1pbih0aGlzLmNoYXJ0Lmdyb3VwKCkuYWxsKCksXG4gICAgICAgICAgICAgIChkOiBhbnkpID0+IHR5cGVvZiBkLnZhbHVlID09PSAnb2JqZWN0JyA/IGQudmFsdWUudmFsdWUgOiBkLnZhbHVlKSArICh0aGlzLm9wdGlvbi5nYXAgPyAtIHRoaXMub3B0aW9uLmdhcCA6IDBcbiAgICAgICAgICAgICksXG4gICAgICAgICAgICBkMy5tYXgodGhpcy5jaGFydC5ncm91cCgpLmFsbCgpLFxuICAgICAgICAgICAgICAoZDogYW55KSA9PiB0eXBlb2YgZC52YWx1ZSA9PT0gJ29iamVjdCcgPyBkLnZhbHVlLnZhbHVlIDogZC52YWx1ZSkgKyAodGhpcy5vcHRpb24uZ2FwID8gdGhpcy5vcHRpb24uZ2FwIDogMFxuICAgICAgICAgICAgKVxuICAgICAgICAgIF07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZG9tYWluID0gWzAsIDEwMF07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHRoaXMuY2hhcnQueShkMy5zY2FsZUxpbmVhcigpLmRvbWFpbihkb21haW4gPyBkb21haW4gOiBbMCwgMTAwXSkpO1xuXG4gICAgICAvLyB0aWNrZm9ybWF0XG4gICAgICBpZiAobGVmdE9wdGlvbi50aWNrRm9ybWF0KSB7XG4gICAgICAgIHRoaXMuY2hhcnQueUF4aXMoKS50aWNrRm9ybWF0KGxlZnRPcHRpb24udGlja0Zvcm1hdCk7XG4gICAgICB9IGVsc2UgaWYgKGxlZnRPcHRpb24ucHJldlRpY2tUZXh0IHx8IGxlZnRPcHRpb24ubmV4dFRpY2tUZXh0KSB7XG4gICAgICAgIGNvbnN0IHRpY2tGb3JtYXQgPSAoZDogYW55KSA9PiB7XG4gICAgICAgICAgbGV0IHRpY2sgPSAnJztcbiAgICAgICAgICBpZiAobGVmdE9wdGlvbi5wcmV2VGlja1RleHQpIHtcbiAgICAgICAgICAgIHRpY2sgKz0gbGVmdE9wdGlvbi5wcmV2VGlja1RleHQ7XG4gICAgICAgICAgfVxuICAgICAgICAgIHRpY2sgKz0gdGhpcy5jb21tYVNlcGFyYXRlTnVtYmVyKGQpIHx8IDA7XG4gICAgICAgICAgaWYgKGxlZnRPcHRpb24ubmV4dFRpY2tUZXh0KSB7XG4gICAgICAgICAgICB0aWNrICs9IGxlZnRPcHRpb24ubmV4dFRpY2tUZXh0O1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHJldHVybiB0aWNrO1xuICAgICAgICB9O1xuICAgICAgICB0aGlzLmNoYXJ0LnlBeGlzKCkudGlja0Zvcm1hdCh0aWNrRm9ybWF0KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuY2hhcnQueUF4aXMoKS50aWNrRm9ybWF0KChkOiBhbnkpID0+IHRoaXMuY29tbWFTZXBhcmF0ZU51bWJlcihkKSB8fCAwKTtcbiAgICAgIH1cblxuICAgICAgLy8gbGFiZWxcbiAgICAgIGlmIChsZWZ0T3B0aW9uLmF4aXNMYWJlbCkge1xuICAgICAgICB0aGlzLmNoYXJ0LnlBeGlzTGFiZWwobGVmdE9wdGlvbi5heGlzTGFiZWwpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmNoYXJ0LnkoZDMuc2NhbGVMaW5lYXIoKS5kb21haW4oWzAsIDEwMF0pKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIHNldFdpZHRoSGVpZ2h0KCkge1xuICAgIHRoaXMud2lkdGggPSB0aGlzLm9wdGlvbi53aWR0aCA/IHRoaXMub3B0aW9uLndpZHRoIDogdGhpcy5lbFJlZi5uYXRpdmVFbGVtZW50LmNsaWVudFdpZHRoIHx8IDIwMDtcbiAgICB0aGlzLmhlaWdodCA9IHRoaXMub3B0aW9uLmhlaWdodCA/IHRoaXMub3B0aW9uLmhlaWdodCA6IHRoaXMuZWxSZWYubmF0aXZlRWxlbWVudC5jbGllbnRIZWlnaHQgfHwgNDAwO1xuXG4gICAgdGhpcy5jaGFydFxuICAgICAgLndpZHRoKHRoaXMud2lkdGgpXG4gICAgICAuaGVpZ2h0KHRoaXMuaGVpZ2h0KTtcbiAgfVxuXG4gIHByaXZhdGUgZmlsdGVyKCkge1xuICAgIGlmICghdGhpcy5vcHRpb24uZmlsdGVycykge1xuICAgICAgdGhpcy5vcHRpb25bJ2ZpbHRlcnMnXSA9IFtdO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICBmaWx0ZXI6IChkOiBhbnkpID0+IHtcbiAgICAgICAgdGhpcy5vcHRpb24uZmlsdGVycyA9IHRoaXMuZ2V0RmlsdGVycygpO1xuICAgICAgICB0aGlzLmNoYW5nRmlsdGVyLmVtaXQoKTtcbiAgICAgIH0sXG4gICAgICBmaWx0ZXJFeGFjdDogKGQ6IGFueSkgPT4ge1xuICAgICAgICB0aGlzLm9wdGlvbi5maWx0ZXJzID0gdGhpcy5nZXRGaWx0ZXJzKCk7XG4gICAgICAgIHRoaXMuY2hhbmdGaWx0ZXIuZW1pdCgpO1xuICAgICAgfSxcbiAgICAgIGZpbHRlckZ1bmN0aW9uOiAoZDogYW55LCBlOiBhbnkpID0+IHtcbiAgICAgICAgdGhpcy5vcHRpb24uZmlsdGVycyA9IHRoaXMuZ2V0RmlsdGVycygpO1xuICAgICAgICB0aGlzLmNoYW5nRmlsdGVyLmVtaXQoKTtcbiAgICAgIH1cbiAgICB9O1xuICB9XG5cbiAgcHJpdmF0ZSBnZXRGaWx0ZXJzKCkge1xuICAgIGNvbnN0IGZpbHRlcnMgPSAgdGhpcy5jaGFydC5maWx0ZXJzKCkubWFwKChkOiBhbnkpID0+IHtcbiAgICAgIGlmIChBcnJheS5pc0FycmF5KGQpKSB7XG4gICAgICAgIHJldHVybiBkWzBdO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGQ7XG4gICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIGZpbHRlcnM7XG4gIH1cblxuICBwcml2YXRlIGdldFRvb2x0aXBFbGVtKCkge1xuICAgIGlmICghdGhpcy5fdG9vbHRpcCB8fCB0aGlzLl90b29sdGlwLmVtcHR5KCkpIHtcbiAgICAgIHRoaXMuX3Rvb2x0aXAgID0gZDMuc2VsZWN0KCdib2R5JylcbiAgICAgICAgLmFwcGVuZCgnZGl2JylcbiAgICAgICAgLmF0dHIoJ2NsYXNzJywgJ3dpc2UtY2hhcnQtdG9vbHRpcCcpXG4gICAgICAgIC5odG1sKCcnKVxuICAgICAgICAuc3R5bGUoJ29wYWNpdHknLCAwKVxuICAgICAgICAuc3R5bGUoJ3Bvc2l0aW9uJywgJ2Fic29sdXRlJylcbiAgICAgICAgLnN0eWxlKCd6LWluZGV4JywgMTAwMDApO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5fdG9vbHRpcDtcbiAgfVxuXG4gIHByaXZhdGUgcmVuZGVySGlnaGxpZ2h0IChjaGFydDogYW55KSB7XG4gICAgY29uc3QgZyA9IGNoYXJ0LmcoKTtcblxuICAgIGxldCBoaWdobGlnaHQgPSBnLnNlbGVjdEFsbCgnZy5oaWdobGlnaHQnKTtcbiAgICBpZiAoaGlnaGxpZ2h0LmVtcHR5KCkpIHtcbiAgICAgIGhpZ2hsaWdodCA9IGcuaW5zZXJ0KCdnJywgJzpmaXJzdC1jaGlsZCcpXG4gICAgICAgIC5hdHRyKCdjbGFzcycsICdoaWdobGlnaHQnKVxuICAgICAgICAuYXR0cigndHJhbnNmb3JtJywgYHRyYW5zbGF0ZSgke3RoaXMuY2hhcnQubWFyZ2lucygpLmxlZnR9LCR7dGhpcy5jaGFydC5tYXJnaW5zKCkudG9wfSlgKTtcbiAgICB9XG5cbiAgICBjb25zdCBzZWN0aW9ucyA9IGhpZ2hsaWdodC5zZWxlY3RBbGwoJ3JlY3Quc2VjdGlvbicpLmRhdGEodGhpcy5vcHRpb24uaGlnaGxpZ2h0KTtcbiAgICBzZWN0aW9ucy5lbnRlcigpXG4gICAgICAuYXBwZW5kKCdyZWN0JylcbiAgICAgIC5hdHRyKCdjbGFzcycsIChkOiBhbnksIGk6IG51bWJlcikgPT4gYHNlY3Rpb24gXyR7aX1gKVxuICAgICAgLmF0dHIoJ2ZpbGwnLCAoZDogYW55KSA9PiBkLmNvbG9yIHx8ICdibHVlJylcbiAgICAgIC5hdHRyKCdmaWxsLW9wYWNpdHknLCAoZDogYW55KSA9PiBkLm9wYWNpdHkgfHwgLjMpXG4gICAgICAuYXR0cignc3Ryb2tlJywgJyNmZmYnKVxuICAgICAgLmF0dHIoJ3gnLCAoZDogYW55KSA9PiB7XG4gICAgICAgIGNvbnN0IGRvbWFpbiA9IGQuZG9tYWluO1xuICAgICAgICBsZXQgeDA7XG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgaWYgKHRoaXMub3B0aW9uLnhBeGlzT3B0aW9uLnR5cGUgPT09ICdkYXRlJykge1xuICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICBjb25zdCBkYXRlRm9ybWF0ID0gdGhpcy5vcHRpb24ueEF4aXNPcHRpb24uZGF0ZUZvcm1hdDtcbiAgICAgICAgICBpZiAoZG9tYWluWzBdLnZhbHVlT2YpIHtcbiAgICAgICAgICAgIHgwID0gZG9tYWluWzBdLnZhbHVlT2YoKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgeDAgPSBtb21lbnQoZG9tYWluWzBdLCBkYXRlRm9ybWF0KS52YWx1ZU9mKCk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHgwID0gZG9tYWluWzBdO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLmNoYXJ0LngoKSh4MCk7XG4gICAgICB9KVxuICAgICAgLmF0dHIoJ3knLCAwKVxuICAgICAgLmF0dHIoJ2hlaWdodCcsIHRoaXMuY2hhcnQueUF4aXNIZWlnaHQoKSlcbiAgICAgIC5hdHRyKCd3aWR0aCcsIChkOiBhbnkpID0+IHtcbiAgICAgICAgY29uc3QgZG9tYWluID0gZC5kb21haW47XG4gICAgICAgIGxldCB4MCwgeDE7XG5cbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICBpZiAodGhpcy5vcHRpb24ueEF4aXNPcHRpb24udHlwZSA9PT0gJ2RhdGUnKSB7XG4gICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgIGNvbnN0IGRhdGVGb3JtYXQgPSB0aGlzLm9wdGlvbi54QXhpc09wdGlvbi5kYXRlRm9ybWF0O1xuICAgICAgICAgIHgwID0gbW9tZW50KGRvbWFpblswXSwgZGF0ZUZvcm1hdCkudmFsdWVPZigpO1xuICAgICAgICAgIHgxID0gbW9tZW50KGRvbWFpblsxXSwgZGF0ZUZvcm1hdCkudmFsdWVPZigpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHgwID0gZG9tYWluWzBdO1xuICAgICAgICAgIHgxID0gZG9tYWluWzFdO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHggPSB0aGlzLmNoYXJ0LngoKSh4MCk7XG4gICAgICAgIHJldHVybiB0aGlzLmNoYXJ0LngoKSh4MSkgLSB4O1xuICAgICAgfSk7XG5cbiAgICB0cmFuc2l0aW9uKHNlY3Rpb25zLCB0aGlzLmNoYXJ0LnRyYW5zaXRpb25EdXJhdGlvbigpLCB0aGlzLmNoYXJ0LnRyYW5zaXRpb25EZWxheSgpKVxuICAgICAgLmF0dHIoJ2ZpbGwnLCBkID0+IGQuY29sb3IgfHwgJ2JsdWUnKVxuICAgICAgLmF0dHIoJ2ZpbGwtb3BhY2l0eScsIGQgPT4gZC5vcGFjaXR5IHx8IC4zKVxuICAgICAgLmF0dHIoJ3N0cm9rZScsICcjZmZmJylcbiAgICAgIC5hdHRyKCd4JywgZCA9PiB7XG4gICAgICAgIGNvbnN0IGRvbWFpbiA9IGQuZG9tYWluO1xuICAgICAgICBsZXQgeDA7XG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgaWYgKHRoaXMub3B0aW9uLnhBeGlzT3B0aW9uLnR5cGUgPT09ICdkYXRlJykge1xuICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICBjb25zdCBkYXRlRm9ybWF0ID0gdGhpcy5vcHRpb24ueEF4aXNPcHRpb24uZGF0ZUZvcm1hdDtcbiAgICAgICAgICB4MCA9IG1vbWVudChkb21haW5bMF0sIGRhdGVGb3JtYXQpLnZhbHVlT2YoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB4MCA9IGRvbWFpblswXTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcy5jaGFydC54KCkoeDApO1xuICAgICAgfSlcbiAgICAgIC5hdHRyKCd3aWR0aCcsIGQgPT4ge1xuICAgICAgICBjb25zdCBkb21haW4gPSBkLmRvbWFpbjtcbiAgICAgICAgbGV0IHgwLCB4MTtcblxuICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgIGlmICh0aGlzLm9wdGlvbi54QXhpc09wdGlvbi50eXBlID09PSAnZGF0ZScpIHtcbiAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgY29uc3QgZGF0ZUZvcm1hdCA9IHRoaXMub3B0aW9uLnhBeGlzT3B0aW9uLmRhdGVGb3JtYXQ7XG4gICAgICAgICAgeDAgPSBtb21lbnQoZG9tYWluWzBdLCBkYXRlRm9ybWF0KS52YWx1ZU9mKCk7XG4gICAgICAgICAgeDEgPSBtb21lbnQoZG9tYWluWzFdLCBkYXRlRm9ybWF0KS52YWx1ZU9mKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgeDAgPSBkb21haW5bMF07XG4gICAgICAgICAgeDEgPSBkb21haW5bMV07XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgeCA9IHRoaXMuY2hhcnQueCgpKHgwKTtcbiAgICAgICAgcmV0dXJuIHRoaXMuY2hhcnQueCgpKHgxKSAtIHg7XG4gICAgICB9KTtcblxuICAgIHRyYW5zaXRpb24oc2VjdGlvbnMuZXhpdCgpLCB0aGlzLmNoYXJ0LnRyYW5zaXRpb25EdXJhdGlvbigpLCB0aGlzLmNoYXJ0LnRyYW5zaXRpb25EZWxheSgpKS5hdHRyKCdvcGFjaXR5JywgMCkucmVtb3ZlKCk7XG4gIH1cblxuICBwcml2YXRlIGNvbW1hU2VwYXJhdGVOdW1iZXIgKHZhbHVlPzogYW55KSB7XG4gICAgaWYgKCF2YWx1ZSkge1xuICAgICAgcmV0dXJuICcnO1xuICAgIH1cbiAgICB3aGlsZSAoLyhcXGQrKShcXGR7M30pLy50ZXN0KHZhbHVlLnRvU3RyaW5nKCkpKSB7XG4gICAgICB2YWx1ZSA9IHZhbHVlLnRvU3RyaW5nKCkucmVwbGFjZSgvKFxcZCkoPz0oXFxkXFxkXFxkKSsoPyFcXGQpKS9nLCAnJDEsJyk7XG4gICAgfVxuICAgIHJldHVybiB2YWx1ZTtcbiAgfVxuXG59XG4iXX0=