import * as d3 from 'd3';

export class AxisOption {

  axisLabel?: string;
  color?: string;
  domain?: number[];
  hide?: boolean;
  series?: any;
  errorBar?: any;
  type?: any;
  size?: any;
  tickFormat?: any;
  ticks?: any;
  renderArea?: any;
  smooth?: any;
  dashStyle?: any;
  lineWidth?: any;

  constructor(fields?: any) {
    const fieldList = ['axisLabel', 'color', 'domain', 'hide', 'series', 'errorBar', 'type', 'size', 'tickFormat',
      'ticks', 'renderArea', 'smooth', 'dashStyle', 'lineWidth'];
    fieldList.forEach(key => {
      if (fields[key] !== undefined) {
        // @ts-ignore
        this[key] = fields[key];
      }
    });
  }

  setDomain(data: Array<any>) {
    // @ts-ignore
    this.domain = [d3.min(data, d => d.value), d3.max(data, d => d.value)];
  }

  setAxisLabel(axisLabel: string) {
    this.axisLabel = axisLabel;
  }
}
