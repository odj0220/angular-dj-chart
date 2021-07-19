import { ElementRef, EventEmitter, NgZone, OnInit } from '@angular/core';
import { DjChart } from './chart/dj-chart';
import { DjChartOption } from './class/dj-chart-option';
import * as i0 from "@angular/core";
export declare class DjAngularChartComponent implements OnInit {
    private elRef;
    private zone;
    djChart?: DjChart;
    observer: ResizeObserver | undefined;
    domWidth: number | undefined;
    resizeDelay: number;
    resizeTimer: any;
    chart: any;
    axisOption?: any;
    wiseChart?: any;
    width?: any;
    height?: any;
    _tooltip?: any;
    _option?: DjChartOption;
    set option(option: DjChartOption);
    get option(): DjChartOption;
    changFilter: EventEmitter<any>;
    rendered: EventEmitter<any>;
    constructor(elRef: ElementRef, zone: NgZone);
    ngOnInit(): void;
    ngOnDestroy(): void;
    create(): void;
    private setPieChart;
    private setDcChart;
    private setCloudChart;
    private setMargins;
    private setMultiSeries;
    private setLeftYAxis;
    private setWidthHeight;
    private filter;
    private getFilters;
    private getTooltipElem;
    private renderHighlight;
    private commaSeparateNumber;
    static ɵfac: i0.ɵɵFactoryDeclaration<DjAngularChartComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<DjAngularChartComponent, "dj-chart", never, { "option": "option"; }, { "changFilter": "changFilter"; "rendered": "rendered"; }, never, never>;
}