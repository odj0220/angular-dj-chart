import {scaleLinear, scaleOrdinal, scaleQuantize} from 'd3-scale';
import {interpolateHcl} from 'd3-interpolate';
import {max, min} from 'd3-array';

import * as dc from 'dc';
const config = dc['config'];
const utils = dc['utils'];

export const ColorMixin = (Base: any) => class extends Base {
  constructor () {
    super();

    // @ts-ignore
    this._colors = scaleOrdinal(config.defaultColors());

    this._colorAccessor = (d: any) => this.keyAccessor()(d);
    this._colorCalculator = undefined;

    {
      const chart = this;
      chart.getColor = function (d: any, i: any) {
        return chart._colorCalculator ?
          chart._colorCalculator.call(this, d, i) :
          chart._colors(chart._colorAccessor.call(this, d, i));
      };
    }
  }

  calculateColorDomain () {
    const newDomain = [min(this.data(), this.colorAccessor()),
      max(this.data(), this.colorAccessor())];
    this._colors.domain(newDomain);
    return this;
  }

  colors (colorScale: any) {
    if (!arguments.length) {
      return this._colors;
    }
    if (colorScale instanceof Array) {
      this._colors = scaleQuantize().range(colorScale); // deprecated legacy support, note: this fails for ordinal domains
    } else {
      this._colors = typeof colorScale === 'function' ? colorScale : utils.constant(colorScale);
    }
    return this;
  }

  ordinalColors (r: any) {
    return this.colors(scaleOrdinal().range(r));
  }

  linearColors (r: any) {
    // @ts-ignore
    const scaleLinear = scaleLinear().range(r);
    scaleLinear.interpolate(interpolateHcl);
    const colors = this.colors(scaleLinear);
    return colors
  }

  colorAccessor (colorAccessor?: any) {
    if (!colorAccessor) {
      return this._colorAccessor;
    }
    this._colorAccessor = colorAccessor;
    return this;
  }

  colorDomain (domain?: any) {
    if (!domain) {
      return this._colors.domain();
    }
    this._colors.domain(domain);
    return this;
  }

  colorCalculator (colorCalculator?: any) {
    if (!colorCalculator) {
      return this._colorCalculator || this.getColor;
    }
    this._colorCalculator = colorCalculator;
    return this;
  }
};
