import * as d3 from 'd3';
import * as _d3Cloud from 'd3-cloud';
import * as _ from 'lodash';
import {BaseMixin} from '../base/base-mixin';
const d3Cloud = _d3Cloud;


export class CloudChart extends BaseMixin {

  private _scale = [15, 70];
  private _color = d3.schemeCategory10;
  private _customColor: any;
  private _padding = 2;
  private _legends: any;
  private _tooltip: any;

  constructor(private element?: any, private option?: any) {
    super();

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

  width(width?: number) {
    if (!width) {
      this._width = this.option.width ? this.option.width : this.element.clientWidth;
      return this._width;
    }

    this._width = width;
    return this;
  }

  height(height?: number) {
    if (!height) {
      this._height = this.option.height ? this.option.height : this.element.clientHeight;
      return this._height;
    }
    this._height = height;
    return this;
  }

  legends(object?: any) {
    if (!object) {
      return this._legends;
    }
    this._legends = object;
    return this;
  }

  padding(padding?: any) {
    if (!padding) {
      return this._padding;
    }
    this._padding = padding;
    return this;
  }

  color(color?: any) {
    if (!color) {
      return this._customColor ? this._customColor : this._color;
    }
    this._customColor = color;
    return this;
  }

  dimension(dimension: any) {
    if (!dimension) {
      return this._dimension;
    }
    this._dimension = dimension;
    return this;
  }

  group(object: any) {
    if (!object) {
      return this._group;
    }
    this._group = object;
    return this;
  }



  private chartRender() {
    // @ts-ignore
    const data = this._group.all();
    const fontScale = d3.scaleLinear().range(this._scale);
    const domain = [d3.min(data, (d: any) => d.value), d3.max(data, (d: any) => d.value)];
    // @ts-ignore
    fontScale.domain(domain);

    // @ts-ignore
    d3Cloud()
      .size([this._width, this._height])
      .words(data)
      .padding(this._padding)
      .rotate(0)
      .font('sans-serif')
      .text((d: any) => {
        let key = d.key || d.keys;
        key = typeof key === 'string' ? key : key[0];
        if (this._legends && this._legends[key]) {
          key = this._legends[key];
        }
        return key;
      })
      .fontSize((d: any) => fontScale(d.value))
      .on('end', this.draw.bind(this))
      .start();
  }

  svg() {
    // @ts-ignore
    if (!d3.select(this.element).select('svg')._groups[0][0]) {
      return ;
    }
    return d3.select(this.element).select('svg');
  }

  private draw(words: any) {
    const cloud = d3.select(this.element).append('svg')
      .attr('class', 'wise-chart-cloud')
      .attr('width', this._width)
      .attr('height', this._height)
      .append('g')
      .attr('transform', 'translate(' + this._width / 2 + ',' + this._height / 2 + ')')
      .selectAll('text')
      .data(words)
      .enter().append('text')
      .style('font-size', (d: any) => d.size + 'px')
      .style('font-family', 'sans-serif')
      .style('fill', (d: any, i: number) => {
        return this._customColor ? this._customColor[d.key[0]] : this._color[ i % this._color.length];
      })
      .style('opacity', (d: any, i) => {
        if (this['filters']().length) {
          const filters = this['filters']().map(dd => dd.toString());
          if (_.includes(filters, d.key.toString())) {
            return 1;
          } else {
            return .1;
          }
        } else {
          return null;
        }
      })
      .attr('text-anchor', 'middle')
      .attr('transform', (d: any) => 'translate(' + [d.x, d.y] + ')rotate(' + d.rotate + ')')
      .text((d: any) => d.text);

    // @ts-ignore
    cloud.on('click', (d: any, i: number) => {
      const {key, value} = d;
      this['onClick']({key, value}, i);
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
            } else {
              left = pageX + 12;
              tooltip.classed('right', false);
              tooltip.classed('left', true);
            }

            if ((screenY - pageY) < tooltip.node().clientHeight) {
              top = pageY - toolY + 10;
              tooltip.classed('bottom', true);
              tooltip.classed('top', false);
            } else {
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
          tooltip .transition()
            .duration(500)
            .style('opacity', 0);
        });
    }
  }


  private getTooltipElem() {
    if (!this._tooltip || this._tooltip.empty()) {
      this._tooltip  = d3.select('body')
        .append('div')
        .attr('class', 'wise-chart-tooltip')
        .html('')
        .style('opacity', 0)
        .style('position', 'absolute');
    }
    return this._tooltip;
  }

}
