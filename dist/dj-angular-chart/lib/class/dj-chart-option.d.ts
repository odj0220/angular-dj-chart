import { DcChart } from '../base/dc-chart';
declare enum DjChartType {
    PIE_CHART = "pieChart",
    CLOUD_CHART = "cloudChart",
    COMPOSITE = "composite",
    HEATMAP = "heatmap",
    DC_CHART = "dcChart",
    STACKED_BAR = "stackedBar"
}
declare enum AxisOptionType {
    DATE = "date",
    LINEAR = "linear",
    ORDINAL = "ordinal"
}
interface BasicAxisOption {
    axisLabel: string;
    domain: Array<number>;
    prevTickText: string;
    nextTickText: string;
    tickFormat: (value: any, index?: any, size?: any) => string;
    ticks: number;
}
interface XAxisOption extends BasicAxisOption {
    type: AxisOptionType;
    dateFormat: string;
    dateTickFormat: string;
}
interface YAxisOption extends BasicAxisOption {
    keys: Array<string>;
    size: number;
    divideFactor: number;
}
export declare class DjChartOption {
    data: any;
    type?: DjChartType;
    dcChart?: DcChart;
    legends?: {
        [key: string]: string;
    };
    colors?: {
        [key: string]: string;
    };
    slicesCap?: number;
    slicesPercent?: number;
    radius?: number;
    externalLabels?: number;
    innerRadius?: number;
    padding?: any;
    seriesTypes?: {
        [key: string]: string;
    };
    seriesOptions?: {
        [key: string]: {
            renderArea: boolean;
            smooth: boolean;
            lineWidth: number;
            dashStyle: string;
        };
    };
    yAxisOptions?: Array<YAxisOption>;
    yAxisLabel?: string;
    xAxisOption?: XAxisOption;
    xAxisLabel?: string;
    onClick?: (data: any, event: any) => void;
    onFilterChanged?: (chart: any) => void;
    onClickEvent?: any;
    dimension?: any;
    group?: any;
    tooltip?: any;
    highlight?: Array<{
        domain: Array<any>;
        color: string;
        label: string;
        opacity: number;
    }>;
    elasticLeftMargin: boolean;
    elasticRightMargin: boolean;
    chart: any;
    gap: any;
    order: any;
    height: any;
    width: any;
    margins: any;
    axisOption: any;
    filters: any;
    private _legendObj?;
    constructor(chartOption?: any);
    setData(data?: Array<any>): void;
    setAxisOption(): any[];
    getKeys(): unknown[];
    getLegends(): any;
    setFilters(filters?: any): void;
    filterAll(): void;
    private setLegendObj;
    private commaSeparateNumber;
}
export {};
