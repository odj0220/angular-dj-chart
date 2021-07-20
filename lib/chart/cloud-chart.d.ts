import * as d3 from 'd3';
import { BaseMixin } from '../base/base-mixin';
export declare class CloudChart extends BaseMixin {
    private element?;
    private option?;
    private _scale;
    private _color;
    private _customColor;
    private _padding;
    private _legends;
    private _tooltip;
    constructor(element?: any, option?: any);
    render(): this;
    redraw(): this;
    width(width?: number): any;
    height(height?: number): any;
    legends(object?: any): any;
    padding(padding?: any): number | this;
    color(color?: any): any;
    dimension(dimension: any): this | undefined;
    group(object: any): this | undefined;
    private chartRender;
    svg(): d3.Selection<d3.BaseType, unknown, null, undefined> | undefined;
    private draw;
    private getTooltipElem;
}
