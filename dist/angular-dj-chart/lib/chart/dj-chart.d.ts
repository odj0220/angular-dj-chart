import { DcChart } from '../base/dc-chart';
import { DjChartOption } from '../class/dj-chart-option';
import { CloudChart } from './cloud-chart';
export declare class DjChart extends DcChart {
    private option;
    constructor(option: DjChartOption);
    cloudChart(element: Element): CloudChart;
    multiChart(element: Element): any;
}
