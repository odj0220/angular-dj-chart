
import {DcChart} from '../base/dc-chart';
import {DjChartOption} from '../class/dj-chart-option';
import {CloudChart} from './cloud-chart';
import {MultiChart} from './multi-chart';

export class DjChart extends DcChart {
  private option:DjChartOption;

  constructor(option: DjChartOption) {
    super();
    this.option = option;
  }

  cloudChart(element: Element) {
    return new CloudChart(element, this.option);
  }

  multiChart(element: Element) {
    const chart = new MultiChart(element, this.option);
    return chart['anchor'](element);
  }

}
