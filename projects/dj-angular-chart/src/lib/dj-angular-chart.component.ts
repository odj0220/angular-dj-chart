import {Component, ElementRef, EventEmitter, Input, NgZone, OnInit, Output} from '@angular/core';
import {DjChart} from './chart/dj-chart';
import {DjChartOption} from './class/dj-chart-option';
import * as d3 from 'd3';
import moment from 'moment';
import {transition} from 'dc';
import {isArray} from 'rxjs/internal-compatibility';

@Component({
  selector: 'dj-chart',
  template: ``,
  styleUrls: ['./dj-angular-chart.component.scss']
})
export class DjAngularChartComponent implements OnInit {

  djChart?: DjChart;

  observer: ResizeObserver | undefined;
  domWidth: number | undefined;
  resizeDelay = 300;
  resizeTimer: any;

  chart: any;
  axisOption?: any;
  wiseChart?: any;
  width?: any;
  height?: any;
  _tooltip?: any;

  _option?: DjChartOption;
  @Input('option')
  set option(option:DjChartOption) {
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

  @Output() changFilter: EventEmitter<any> = new EventEmitter<any>();
  @Output() rendered: EventEmitter<any> = new EventEmitter<any>();


  constructor(
    private elRef: ElementRef,
    private zone: NgZone
  ) {}

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
              } else {
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
      this.chart.children().forEach((chart: any) => {
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
      this.chart.group({all: () => this.option.data, size: () => this.option.data.length});
    } else {
      this.chart.dimension(this.option.dimension);
      this.chart.group(this.option.group);
    }

    const overrideFields = ['onClick'];
    overrideFields.forEach(key => {
      // @ts-ignore
      if (this.option[key] !== undefined) {
        if (key === 'onClick') {
          // @ts-ignore
          this.chart[key] = (d: any) => this.option.onClick(d, event);
        } else {
          // @ts-ignore
          this.chart[key] = this.option[key];
        }
      }
    });

    if (this.option.onClickEvent) {
      this.chart['_onClickEvent'] = this.chart.onClick;
      this.chart['onClick'] = (d: any) => {
        this.chart._onClickEvent(d);
        this.option.onClickEvent(d);
      };
    }

    if (this.option.onFilterChanged) {
      // @ts-ignore
      this.chart.on('filtered', (d: any) => this.option.onFilterChanged(d));
    }

    this.option['chart'] = this.chart;
  }

  private setPieChart() {
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
      data = data.sort((a: any, b: any) => b.value - a.value);
      let sum = 0;
      let index = 0;
      data.forEach((d: any) => sum += d.value);
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
      this.chart.colors((d: any) => {
        const key = isArray(d) ? d[0] : d;
        // @ts-ignore
        return this.option.colors[key] || '#ccc';
      });
    }

    this.chart.on('pretransition', (chart: any) => {
      chart.selectAll('text.pie-slice').text((d: any) => {
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
          .on('mousemove', (data: any) => {
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
          .on('mouseout', (data: any) => {
            tooltip .transition()
              .duration(300)
              .style('opacity', 0)
              .style('z-index', -1);
          });

        /*symbols
          */

      }
    });
  }

  private setDcChart() {
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

  private setCloudChart() {
    this.create();
    this.chart.padding(this.option.padding);
    this.chart.legends(this.option.legends);
  }

  private setMargins() {
    if (this.option.margins) {
      this.chart.margins().left = this.option.margins.left !== undefined ? +this.option.margins.left : 30;
      this.chart.margins().right = this.option.margins.right !== undefined ? +this.option.margins.right : 50;
      this.chart.margins().bottom = this.option.margins.bottom !== undefined ? +this.option.margins.bottom : 30;
      this.chart.margins().top = this.option.margins.top !== undefined ? +this.option.margins.top : 10;
    }
  }

  private setMultiSeries() {
    this.create();

    let min = d3.min(this.chart.group().all(), (d: any) => +d.key[1]) || 0;
    let max = d3.max(this.chart.group().all(), (d: any) => +d.key[1]);
    const subChart = (c: any) => {
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
      .seriesAccessor((d: any) => d.key[0])
      .seriesSort((a: any, b: any) => {
        const orderList = this.option.axisOption.map((d: any) => d.series);
        return orderList.indexOf(a) - orderList.indexOf(b);
      })
      .keyAccessor((d: any) => {
        return d.key ? isNaN(d.key[1]) ? d.key[1] : +d.key[1] : null;
      })
      .valueAccessor((d: any) => d.value);

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
            this.chart.xAxis().tickFormat((d: any) => moment(d).format(this.option.xAxisOption.dateTickFormat));
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
      this.chart.seriesSort((a: string, b: string) => {
        const order = this.option.order;
        const before = order.indexOf(a);
        const after = order.indexOf(b);
        return before - after;
      });
    }

    // renderlet
    this.chart['renderOn'] = (chart: any) => {
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
        this.option.axisOption.forEach((v: any, i: any) => {
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
        } else {
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

  private setLeftYAxis() {
    const axisOption = this.option.axisOption;
    if (axisOption && axisOption[0]) {
      let domain;
      const leftOption = axisOption[0];
      // domain
      if (axisOption && axisOption.length && leftOption.domain) {
        domain = leftOption.domain;
      } else {
        if (this.chart.group().all().length) {

          domain = [
            // @ts-ignore
            d3.min(this.chart.group().all(),
              (d: any) => typeof d.value === 'object' ? d.value.value : d.value) + (this.option.gap ? - this.option.gap : 0
            ),
            d3.max(this.chart.group().all(),
              (d: any) => typeof d.value === 'object' ? d.value.value : d.value) + (this.option.gap ? this.option.gap : 0
            )
          ];
        } else {
          domain = [0, 100];
        }
      }
      this.chart.y(d3.scaleLinear().domain(domain ? domain : [0, 100]));

      // tickformat
      if (leftOption.tickFormat) {
        this.chart.yAxis().tickFormat(leftOption.tickFormat);
      } else if (leftOption.prevTickText || leftOption.nextTickText) {
        const tickFormat = (d: any) => {
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
      } else {
        this.chart.yAxis().tickFormat((d: any) => this.commaSeparateNumber(d) || 0);
      }

      // label
      if (leftOption.axisLabel) {
        this.chart.yAxisLabel(leftOption.axisLabel);
      }
    } else {
      this.chart.y(d3.scaleLinear().domain([0, 100]));
    }
  }

  private setWidthHeight() {
    this.width = this.option.width ? this.option.width : this.elRef.nativeElement.clientWidth || 200;
    this.height = this.option.height ? this.option.height : this.elRef.nativeElement.clientHeight || 400;

    this.chart
      .width(this.width)
      .height(this.height);
  }

  private filter() {
    if (!this.option.filters) {
      this.option['filters'] = [];
    }

    return {
      filter: (d: any) => {
        this.option.filters = this.getFilters();
        this.changFilter.emit();
      },
      filterExact: (d: any) => {
        this.option.filters = this.getFilters();
        this.changFilter.emit();
      },
      filterFunction: (d: any, e: any) => {
        this.option.filters = this.getFilters();
        this.changFilter.emit();
      }
    };
  }

  private getFilters() {
    const filters =  this.chart.filters().map((d: any) => {
      if (Array.isArray(d)) {
        return d[0];
      } else {
        return d;
      }
    });
    return filters;
  }

  private getTooltipElem() {
    if (!this._tooltip || this._tooltip.empty()) {
      this._tooltip  = d3.select('body')
        .append('div')
        .attr('class', 'wise-chart-tooltip')
        .html('')
        .style('opacity', 0)
        .style('position', 'absolute')
        .style('z-index', 10000);
    }
    return this._tooltip;
  }

  private renderHighlight (chart: any) {
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
      .attr('class', (d: any, i: number) => `section _${i}`)
      .attr('fill', (d: any) => d.color || 'blue')
      .attr('fill-opacity', (d: any) => d.opacity || .3)
      .attr('stroke', '#fff')
      .attr('x', (d: any) => {
        const domain = d.domain;
        let x0;
        // @ts-ignore
        if (this.option.xAxisOption.type === 'date') {
          // @ts-ignore
          const dateFormat = this.option.xAxisOption.dateFormat;
          if (domain[0].valueOf) {
            x0 = domain[0].valueOf();
          } else {
            x0 = moment(domain[0], dateFormat).valueOf();
          }
        } else {
          x0 = domain[0];
        }
        return this.chart.x()(x0);
      })
      .attr('y', 0)
      .attr('height', this.chart.yAxisHeight())
      .attr('width', (d: any) => {
        const domain = d.domain;
        let x0, x1;

        // @ts-ignore
        if (this.option.xAxisOption.type === 'date') {
          // @ts-ignore
          const dateFormat = this.option.xAxisOption.dateFormat;
          x0 = moment(domain[0], dateFormat).valueOf();
          x1 = moment(domain[1], dateFormat).valueOf();
        } else {
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
        } else {
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
        } else {
          x0 = domain[0];
          x1 = domain[1];
        }
        const x = this.chart.x()(x0);
        return this.chart.x()(x1) - x;
      });

    transition(sections.exit(), this.chart.transitionDuration(), this.chart.transitionDelay()).attr('opacity', 0).remove();
  }

  private commaSeparateNumber (value?: any) {
    if (!value) {
      return '';
    }
    while (/(\d+)(\d{3})/.test(value.toString())) {
      value = value.toString().replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1,');
    }
    return value;
  }

}
