import * as _moment from 'moment';
import * as d3 from 'd3';
import * as _ from 'lodash';
import { AxisOption } from './axis-option';
const moment = _moment;
var DjChartType;
(function (DjChartType) {
    DjChartType["PIE_CHART"] = "pieChart";
    DjChartType["CLOUD_CHART"] = "cloudChart";
    DjChartType["COMPOSITE"] = "composite";
    DjChartType["HEATMAP"] = "heatmap";
    DjChartType["DC_CHART"] = "dcChart";
    DjChartType["STACKED_BAR"] = "stackedBar";
})(DjChartType || (DjChartType = {}));
var AxisOptionType;
(function (AxisOptionType) {
    AxisOptionType["DATE"] = "date";
    AxisOptionType["LINEAR"] = "linear";
    AxisOptionType["ORDINAL"] = "ordinal"; // x축을 있는 그대로 표기할때 사용
})(AxisOptionType || (AxisOptionType = {}));
export class DjChartOption {
    constructor(chartOption) {
        this.elasticLeftMargin = true;
        this.elasticRightMargin = true;
        this._legendObj = {};
        const defaultOption = {
            cloudChart: ['type', 'onClick', 'onClickEvent', 'onFilterChanged', 'legends', 'colors', 'padding', 'dimension', 'group', 'tooltip'],
            pieChart: ['type', 'onClick', 'onClickEvent', 'onFilterChanged', 'legends', 'colors', 'slicesCap', 'slicesPercent', 'radius',
                'externalLabels', 'innerRadius', 'dimension', 'group', 'tooltip'],
            composite: ['type', 'onClick', 'onClickEvent', 'onFilterChanged', 'legends', 'colors', 'seriesTypes', 'yAxisOptions', 'yAxisLabel',
                'xAxisOption', 'xAxisLabel', 'dimension', 'group', 'tooltip', 'seriesOptions', 'margins', 'highlight', 'elasticLeftMargin',
                'elasticRightMargin']
        };
        if (chartOption && chartOption.type) {
            // @ts-ignore
            if (defaultOption[chartOption.type]) {
                // @ts-ignore
                defaultOption[chartOption.type].forEach(field => {
                    // @ts-ignore
                    if (chartOption[field] !== undefined) {
                        // @ts-ignore
                        this[field] = chartOption[field];
                    }
                });
            }
            if (chartOption.type === DjChartType.DC_CHART) {
                Object.keys(chartOption).forEach(key => {
                    // @ts-ignore
                    this[key] = chartOption[key];
                });
            }
            if (chartOption.data) {
                this.setData(chartOption.data);
            }
        }
    }
    setData(data) {
        if (this.type === DjChartType.COMPOSITE && this.xAxisOption && this.xAxisOption.type === 'date') {
            this.data = data;
            this.data.forEach((d) => {
                // @ts-ignore
                d.key[1] = moment(d.key[1], this.xAxisOption.dateFormat).toDate();
            });
        }
        else {
            this.data = data;
        }
    }
    setAxisOption() {
        if (this.yAxisOptions) {
            let data;
            const seriesTypes = this.seriesTypes || {};
            const axisOption = [];
            if (this.data !== undefined) {
                data = this.data;
            }
            else {
                data = this.group().all();
            }
            this.yAxisOptions.forEach(axis => {
                // @ts-ignore
                const filterData = data.filter((d) => {
                    if (axis.keys.indexOf(d.key[0]) > -1) {
                        return true;
                    }
                });
                const max = d3.max(filterData, d => d.value);
                const min = d3.min(filterData, d => d.value) || 0;
                axis.keys.forEach((key, i) => {
                    const _option = {
                        axisLabel: axis.axisLabel,
                        domain: axis.domain ? axis.domain : [min, max],
                        hide: i,
                        series: key,
                        type: seriesTypes[key] || 'line',
                        size: axis.size || 6,
                    };
                    if (this.seriesOptions && this.seriesOptions[key]) {
                        Object.keys(this.seriesOptions[key]).forEach(op => {
                            // @ts-ignore
                            _option[op] = this.seriesOptions[key][op];
                        });
                    }
                    if (this.colors && this.colors[key]) {
                        _option['color'] = this.colors[key];
                    }
                    if (axis.prevTickText || axis.nextTickText) {
                        _option['tickFormat'] = (d) => {
                            let tick = '';
                            if (axis.prevTickText) {
                                tick += axis.prevTickText;
                            }
                            tick += this.commaSeparateNumber(d) || 0;
                            if (axis.nextTickText) {
                                tick += axis.nextTickText;
                            }
                            return tick;
                        };
                    }
                    if (axis.tickFormat) {
                        _option['tickFormat'] = axis.tickFormat;
                    }
                    axisOption.push(new AxisOption(_option));
                });
            });
            return this.axisOption = axisOption;
        }
        return this.axisOption = [];
    }
    getKeys() {
        const keys = this.data.map((d) => {
            if (Array.isArray(d.key)) {
                return d.key[0];
            }
            return d.key;
        });
        return _.uniq(keys);
    }
    getLegends() {
        if (!this._legendObj) {
            this.setLegendObj();
        }
        return this._legendObj;
    }
    setFilters(filters) {
        this.setLegendObj();
    }
    filterAll() {
        this.chart.filterAll();
    }
    setLegendObj() {
        this._legendObj = [];
        this.getKeys().forEach(key => {
            const legend = {
                key: key,
                // @ts-ignore
                name: this.legends[key] || key,
                filter: () => this.chart.filter(key),
                color: () => {
                    const defaultColor = this.chart.getColor(key);
                    // @ts-ignore
                    return this.colors ? this.colors[key] || defaultColor : defaultColor;
                }
            };
            this._legendObj.push(legend);
        });
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGotY2hhcnQtb3B0aW9uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vcHJvamVjdHMvYW5ndWxhci1kai1jaGFydC9zcmMvbGliL2NsYXNzL2RqLWNoYXJ0LW9wdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEtBQUssT0FBTyxNQUFNLFFBQVEsQ0FBQztBQUNsQyxPQUFPLEtBQUssRUFBRSxNQUFNLElBQUksQ0FBQztBQUN6QixPQUFPLEtBQUssQ0FBQyxNQUFNLFFBQVEsQ0FBQztBQUM1QixPQUFPLEVBQUMsVUFBVSxFQUFDLE1BQU0sZUFBZSxDQUFDO0FBRXpDLE1BQU0sTUFBTSxHQUFHLE9BQU8sQ0FBQztBQUV2QixJQUFLLFdBT0o7QUFQRCxXQUFLLFdBQVc7SUFDZCxxQ0FBc0IsQ0FBQTtJQUN0Qix5Q0FBMEIsQ0FBQTtJQUMxQixzQ0FBdUIsQ0FBQTtJQUN2QixrQ0FBbUIsQ0FBQTtJQUNuQixtQ0FBb0IsQ0FBQTtJQUNwQix5Q0FBMEIsQ0FBQTtBQUM1QixDQUFDLEVBUEksV0FBVyxLQUFYLFdBQVcsUUFPZjtBQUVELElBQUssY0FJSjtBQUpELFdBQUssY0FBYztJQUNqQiwrQkFBYSxDQUFBO0lBQ2IsbUNBQWlCLENBQUE7SUFDakIscUNBQW1CLENBQUEsQ0FBQyxxQkFBcUI7QUFDM0MsQ0FBQyxFQUpJLGNBQWMsS0FBZCxjQUFjLFFBSWxCO0FBb0VELE1BQU0sT0FBTyxhQUFhO0lBc0R4QixZQUFZLFdBQWlCO1FBYjdCLHNCQUFpQixHQUFHLElBQUksQ0FBQztRQUN6Qix1QkFBa0IsR0FBRyxJQUFJLENBQUM7UUFVbEIsZUFBVSxHQUFTLEVBQUUsQ0FBQztRQUc1QixNQUFNLGFBQWEsR0FBRztZQUNwQixVQUFVLEVBQUUsQ0FBQyxNQUFNLEVBQUUsU0FBUyxFQUFFLGNBQWMsRUFBRSxpQkFBaUIsRUFBRSxTQUFTLEVBQUUsUUFBUSxFQUFFLFNBQVMsRUFBRSxXQUFXLEVBQUUsT0FB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LEdBQUc7Z0JBQzlCLE1BQU0sRUFBRSxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUM7Z0JBQ3BDLEtBQUssRUFBRSxHQUFHLEVBQUU7b0JBQ1YsTUFBTSxZQUFZLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUM7b0JBQzlDLGFBQWE7b0JBQ2IsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxJQUFJLFlBQVksQ0FBQyxDQUFDLENBQUMsWUFBWSxDQUFDO2dCQUN2RSxDQUFDO2FBQ0YsQ0FBQztZQUNGLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQy9CLENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztJQUVPLG1CQUFtQixDQUFFLEtBQVU7UUFDckMsSUFBSSxDQUFDLEtBQUssRUFBRTtZQUNWLE9BQU8sRUFBRSxDQUFDO1NBQ1g7UUFDRCxPQUFPLGNBQWMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsRUFBRSxDQUFDLEVBQUU7WUFDNUMsS0FBSyxHQUFHLEtBQUssQ0FBQyxRQUFRLEVBQUUsQ0FBQyxPQUFPLENBQUMsMEJBQTBCLEVBQUUsS0FBSyxDQUFDLENBQUM7U0FDckU7UUFDRCxPQUFPLEtBQUssQ0FBQztJQUNmLENBQUM7Q0FDRiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIF9tb21lbnQgZnJvbSAnbW9tZW50JztcclxuaW1wb3J0ICogYXMgZDMgZnJvbSAnZDMnO1xyXG5pbXBvcnQgKiBhcyBfIGZyb20gJ2xvZGFzaCc7XHJcbmltcG9ydCB7QXhpc09wdGlvbn0gZnJvbSAnLi9heGlzLW9wdGlvbic7XHJcbmltcG9ydCB7RGNDaGFydH0gZnJvbSAnLi4vYmFzZS9kYy1jaGFydCc7XHJcbmNvbnN0IG1vbWVudCA9IF9tb21lbnQ7XHJcblxyXG5lbnVtIERqQ2hhcnRUeXBlIHtcclxuICBQSUVfQ0hBUlQgPSAncGllQ2hhcnQnLFxyXG4gIENMT1VEX0NIQVJUID0gJ2Nsb3VkQ2hhcnQnLFxyXG4gIENPTVBPU0lURSA9ICdjb21wb3NpdGUnLFxyXG4gIEhFQVRNQVAgPSAnaGVhdG1hcCcsXHJcbiAgRENfQ0hBUlQgPSAnZGNDaGFydCcsXHJcbiAgU1RBQ0tFRF9CQVIgPSAnc3RhY2tlZEJhcidcclxufVxyXG5cclxuZW51bSBBeGlzT3B0aW9uVHlwZSB7XHJcbiAgREFURSA9ICdkYXRlJywgLy8geOy2leydtCBkYXRlIO2DgOyeheydvOuVjCDsp4DsoJVcclxuICBMSU5FQVIgPSAnbGluZWFyJywgLy8geOy2leydtCBudW1iZXIg7IaN7ISx7Jy866GcIHJhbmdlIO2RnOq4sOqwgCDtlYTsmpTtlaDrlYwg7KeA7KCVLCBkb21haW4g7Ji17IWYIO2VhOyalFxyXG4gIE9SRElOQUwgPSAnb3JkaW5hbCcgLy8geOy2leydhCDsnojripQg6re464yA66GcIO2RnOq4sO2VoOuVjCDsgqzsmqlcclxufVxyXG5cclxuaW50ZXJmYWNlIEJhc2ljQXhpc09wdGlvbiB7XHJcbiAgYXhpc0xhYmVsOiBzdHJpbmc7IC8vIHjstpXsl5Ag7ZGc6riw65CgIGxhYmVsIOyEpOyglVxyXG4gIGRvbWFpbjogQXJyYXk8bnVtYmVyPjsgLy8g7KCc7Jm4IOqwgOuKpe2VmOupsCDsoJzsmbjsi5wgdmFsdWUg7J2YIG1pbiwgbWF4XHJcbiAgcHJldlRpY2tUZXh0OiBzdHJpbmc7IC8vIHRpY2vsnZgg7JWe7Kq97JeQIOuCmO2DgOuCoCDrrLjsnpDrpbwg7KeA7KCVIHRpY2tGb3JtYXQg7KeA7KCV7IucIHRpY2tGb3JtYXQg7Jqw7ISgXHJcbiAgbmV4dFRpY2tUZXh0OiBzdHJpbmc7IC8vIHRpY2vsnZgg65Kk7Kq97JeQIOuCmO2DgOuCoCDrrLjsnpDrpbwg7KeA7KCVIHRpY2tGb3JtYXQg7KeA7KCV7IucIHRpY2tGb3JtYXQg7Jqw7ISgXHJcbiAgdGlja0Zvcm1hdDogKHZhbHVlOiBhbnksIGluZGV4PzogYW55LCBzaXplPzogYW55KSA9PiBzdHJpbmc7IC8vIHRpY2sg7ZGc6riw66W8IOuzgOqyve2VmOqzoCDsi7bsnYTrlYwg7IKs7JqpIO2VtOuLueyYteyFmCDsoIHsmqnsi5wg7LWc7Jqw7ISg7Jy866GcIOyggeyaqVxyXG4gIHRpY2tzOiBudW1iZXI7IC8vIHjstpXsl5Ag66qH6rCc7J2YIHRpY2vsnYQg7ZGc6riw7ZWg7KeAIOyEpOyglVxyXG59XHJcblxyXG5pbnRlcmZhY2UgWEF4aXNPcHRpb24gZXh0ZW5kcyBCYXNpY0F4aXNPcHRpb24ge1xyXG4gIHR5cGU6IEF4aXNPcHRpb25UeXBlO1xyXG4gIGRhdGVGb3JtYXQ6IHN0cmluZzsgLy8gdHlwZeydtCBkYXRlIOydvOuVjCDtlYTsmpQg7ZWY66mwIGRhdGHsnZggZGF0ZSBmb3JtYXQg7ZiV7IudIGV4KSBZWVlZTU1ERFxyXG4gIGRhdGVUaWNrRm9ybWF0OiBzdHJpbmc7IC8vIHR5cGXsnbQgZGF0ZSDsnbzrlYwg7ZWE7JqUIGNoYXJ07J2YIHjstpXsl5Ag7ZGc6riw65CgIO2YleyLnVxyXG59XHJcblxyXG5pbnRlcmZhY2UgWUF4aXNPcHRpb24gZXh0ZW5kcyBCYXNpY0F4aXNPcHRpb24ge1xyXG4gIGtleXM6IEFycmF5PHN0cmluZz47IC8vIGRhdGHsnZgga2V566W8IGdyb3VwIO2VmOyXrCDstpXsl5Ag7ZGc6riwIFtcIml0ZW1MYXJnZS90b3BcIiwgXCJpdGVtTGFyZ2UvYm90dG9tXCIsIFwiaXRlbUxhcmdlL3Nwb3J0c3dlYXJcIl1cclxuICBzaXplOiBudW1iZXI7IC8vIHNlcmllc1R5cGUg7JeQIHN5bWJvbGXsnbQg7Y+s7ZWo65CY7Ja0IOyeiOydhOuVjCBzeW1ib2xl7J2YIO2BrOq4sFxyXG4gIGRpdmlkZUZhY3RvcjogbnVtYmVyO1xyXG59XHJcblxyXG5pbnRlcmZhY2UgQ2hhcnRPcHRpb24ge1xyXG4gIGRhdGE/OiBBcnJheTxhbnk+O1xyXG4gIHR5cGU/OiBEakNoYXJ0VHlwZTtcclxuICBvbkNsaWNrPzogKGRhdGE6IGFueSwgZXZlbnQ6IGFueSkgPT4gdm9pZDtcclxuICBvbkNsaWNrRXZlbnQ/OiBhbnk7XHJcbiAgb25GaWx0ZXJDaGFuZ2VkPzogKGNoYXJ0OiBhbnkpID0+IHZvaWQ7XHJcbiAgbGVnZW5kcz86IHsgW2tleTogc3RyaW5nXTogc3RyaW5nOyB9O1xyXG4gIGNvbG9ycz86IHsgW2tleTogc3RyaW5nXTogc3RyaW5nOyB9O1xyXG4gIHNlcmllc1R5cGVzPzogeyBba2V5OiBzdHJpbmddOiBzdHJpbmc7IH07XHJcbiAgeUF4aXNPcHRpb25zPzogQXJyYXk8WUF4aXNPcHRpb24+O1xyXG4gIHlBeGlzTGFiZWw/OiBzdHJpbmc7XHJcbiAgeEF4aXNPcHRpb24/OiBYQXhpc09wdGlvbjtcclxuICB4QXhpc0xhYmVsPzogc3RyaW5nO1xyXG4gIGRpbWVuc2lvbj86IGFueTtcclxuICBncm91cD86IGFueTtcclxuICB0b29sdGlwPzogYW55O1xyXG4gIHNlcmllc09wdGlvbnM/OiAge1xyXG4gICAgW2tleTogc3RyaW5nXToge1xyXG4gICAgICByZW5kZXJBcmVhOiBib29sZWFuOyAvLyBkZWZhdWx0OiBmYWxzZVxyXG4gICAgICBzbW9vdGg6IGJvb2xlYW47IC8vIGRlZmF1bHQ6IGZhbHNlXHJcbiAgICAgIGxpbmVXaWR0aDogbnVtYmVyOyAvLyBkZWZhdWx0OiAxLjUsIOyEoCDqtbXquLBcclxuICAgICAgZGFzaFN0eWxlOiBzdHJpbmc7IC8vIGRlZmF1bHQ6IG51bGxcclxuICAgICAgLypcclxuICAgICAgKiAo7ISgLCDqs7XrsLEpIHJlcGVhdFxyXG4gICAgICAqICg1LCAzLCAyLCAzKSDsnbTrn7Dsi53snLzroZwg6rCA64qlXHJcbiAgICAgICovXHJcbiAgICB9O1xyXG4gIH07XHJcbiAgbWFyZ2lucz86IGFueTtcclxuICBoaWdobGlnaHQ/OiBBcnJheTx7XHJcbiAgICBkb21haW46IEFycmF5PGFueT47IC8vIFttaW4sIG1heF1cclxuICAgIGNvbG9yOiBzdHJpbmc7IC8vIGRlZmF1bHQ6IGJsdWVcclxuICAgIGxhYmVsOiBzdHJpbmc7IC8vIGRlZmF1bHQ6ICcnLCAgaGlnaGxpZ2h0IGxhYmVsXHJcbiAgICBvcGFjaXR5OiBudW1iZXI7IC8vICgwfjEsIGRlZmF1bHQ6IC4zKTog7Yis66qF64+EXHJcbiAgfT47XHJcbiAgZWxhc3RpY0xlZnRNYXJnaW46IGJvb2xlYW47XHJcbiAgZWxhc3RpY1JpZ2h0TWFyZ2luOiBib29sZWFuO1xyXG4gIGlubmVyUmFkaXVzPzogbnVtYmVyO1xyXG4gIGV4dGVybmFsTGFiZWxzPzogbnVtYmVyO1xyXG4gIHNsaWNlc0NhcD86IG51bWJlcjtcclxuICBzbGljZXNQZXJjZW50PzogbnVtYmVyO1xyXG4gIHJhZGl1cz86IG51bWJlcjtcclxuICBwYWRkaW5nPzogYW55O1xyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgRGpDaGFydE9wdGlvbiB7XHJcbiAgZGF0YTogYW55O1xyXG4gIHR5cGU/OiBEakNoYXJ0VHlwZTtcclxuICBkY0NoYXJ0PzogRGNDaGFydDtcclxuICBsZWdlbmRzPzogeyBba2V5OiBzdHJpbmddOiBzdHJpbmc7IH07XHJcbiAgY29sb3JzPzogeyBba2V5OiBzdHJpbmddOiBzdHJpbmc7IH07XHJcbiAgc2xpY2VzQ2FwPzogbnVtYmVyO1xyXG4gIHNsaWNlc1BlcmNlbnQ/OiBudW1iZXI7XHJcbiAgcmFkaXVzPzogbnVtYmVyO1xyXG4gIGV4dGVybmFsTGFiZWxzPzogbnVtYmVyO1xyXG4gIGlubmVyUmFkaXVzPzogbnVtYmVyO1xyXG4gIHBhZGRpbmc/OiBhbnk7XHJcbiAgc2VyaWVzVHlwZXM/OiB7IFtrZXk6IHN0cmluZ106IHN0cmluZzsgfTtcclxuICBzZXJpZXNPcHRpb25zPzogIHtcclxuICAgIFtrZXk6IHN0cmluZ106IHtcclxuICAgICAgcmVuZGVyQXJlYTogYm9vbGVhbjsgLy8gZGVmYXVsdDogZmFsc2VcclxuICAgICAgc21vb3RoOiBib29sZWFuOyAvLyBkZWZhdWx0OiBmYWxzZVxyXG4gICAgICBsaW5lV2lkdGg6IG51bWJlcjsgLy8gZGVmYXVsdDogMS41LCDshKAg6rW16riwXHJcbiAgICAgIGRhc2hTdHlsZTogc3RyaW5nOyAvLyBkZWZhdWx0OiBudWxsXHJcbiAgICAgIC8qXHJcbiAgICAgICogKOyEoCwg6rO167CxKSByZXBlYXRcclxuICAgICAgKiAoNSwgMywgMiwgMykg7J2065+w7Iud7Jy866GcIOqwgOuKpVxyXG4gICAgICAqL1xyXG4gICAgfTtcclxuICB9O1xyXG4gIHlBeGlzT3B0aW9ucz86IEFycmF5PFlBeGlzT3B0aW9uPjtcclxuICB5QXhpc0xhYmVsPzogc3RyaW5nO1xyXG4gIHhBeGlzT3B0aW9uPzogWEF4aXNPcHRpb247XHJcbiAgeEF4aXNMYWJlbD86IHN0cmluZztcclxuICBvbkNsaWNrPzogKGRhdGE6IGFueSwgZXZlbnQ6IGFueSkgPT4gdm9pZDtcclxuICBvbkZpbHRlckNoYW5nZWQ/OiAoY2hhcnQ6IGFueSkgPT4gdm9pZDtcclxuICBvbkNsaWNrRXZlbnQ/OiBhbnk7XHJcbiAgZGltZW5zaW9uPzogYW55O1xyXG4gIGdyb3VwPzogYW55O1xyXG4gIHRvb2x0aXA/OiBhbnk7XHJcbiAgaGlnaGxpZ2h0PzogQXJyYXk8e1xyXG4gICAgZG9tYWluOiBBcnJheTxhbnk+OyAvLyBbbWluLCBtYXhdXHJcbiAgICBjb2xvcjogc3RyaW5nOyAvLyBkZWZhdWx0OiBibHVlXHJcbiAgICBsYWJlbDogc3RyaW5nOyAvLyBkZWZhdWx0OiAnJywgIGhpZ2hsaWdodCBsYWJlbFxyXG4gICAgb3BhY2l0eTogbnVtYmVyOyAvLyAoMH4xLCBkZWZhdWx0OiAuMyk6IO2IrOuqheuPhFxyXG4gIH0+O1xyXG4gIGVsYXN0aWNMZWZ0TWFyZ2luID0gdHJ1ZTtcclxuICBlbGFzdGljUmlnaHRNYXJnaW4gPSB0cnVlO1xyXG5cclxuICBjaGFydDogYW55O1xyXG4gIGdhcDogYW55O1xyXG4gIG9yZGVyOiBhbnk7XHJcbiAgaGVpZ2h0OiBhbnk7XHJcbiAgd2lkdGg6IGFueTtcclxuICBtYXJnaW5zOiBhbnk7XHJcbiAgYXhpc09wdGlvbjogYW55O1xyXG4gIGZpbHRlcnM6IGFueTtcclxuICBwcml2YXRlIF9sZWdlbmRPYmo/OiBhbnkgPSB7fTtcclxuXHJcbiAgY29uc3RydWN0b3IoY2hhcnRPcHRpb24/OiBhbnkpIHtcclxuICAgIGNvbnN0IGRlZmF1bHRPcHRpb24gPSB7XHJcbiAgICAgIGNsb3VkQ2hhcnQ6IFsndHlwZScsICdvbkNsaWNrJywgJ29uQ2xpY2tFdmVudCcsICdvbkZpbHRlckNoYW5nZWQnLCAnbGVnZW5kcycsICdjb2xvcnMnLCAncGFkZGluZycsICdkaW1lbnNpb24nLCAnZ3JvdXAnLCAndG9vbHRpcCddLFxyXG4gICAgICBwaWVDaGFydDogWyd0eXBlJywgJ29uQ2xpY2snLCAnb25DbGlja0V2ZW50JywgJ29uRmlsdGVyQ2hhbmdlZCcsICdsZWdlbmRzJywgJ2NvbG9ycycsICdzbGljZXNDYXAnLCAnc2xpY2VzUGVyY2VudCcsICdyYWRpdXMnLFxyXG4gICAgICAgICdleHRlcm5hbExhYmVscycsICdpbm5lclJhZGl1cycsICdkaW1lbnNpb24nLCAnZ3JvdXAnLCAndG9vbHRpcCddLFxyXG4gICAgICBjb21wb3NpdGU6IFsndHlwZScsICdvbkNsaWNrJywgJ29uQ2xpY2tFdmVudCcsICdvbkZpbHRlckNoYW5nZWQnLCAnbGVnZW5kcycsICdjb2xvcnMnLCAnc2VyaWVzVHlwZXMnLCAneUF4aXNPcHRpb25zJywgJ3lBeGlzTGFiZWwnLFxyXG4gICAgICAgICd4QXhpc09wdGlvbicsICd4QXhpc0xhYmVsJywgJ2RpbWVuc2lvbicsICdncm91cCcsICd0b29sdGlwJywgJ3Nlcmllc09wdGlvbnMnLCAnbWFyZ2lucycsICdoaWdobGlnaHQnLCAnZWxhc3RpY0xlZnRNYXJnaW4nLFxyXG4gICAgICAgICdlbGFzdGljUmlnaHRNYXJnaW4nXVxyXG4gICAgfTtcclxuXHJcbiAgICBpZiAoY2hhcnRPcHRpb24gJiYgY2hhcnRPcHRpb24udHlwZSkge1xyXG4gICAgICAvLyBAdHMtaWdub3JlXHJcbiAgICAgIGlmIChkZWZhdWx0T3B0aW9uW2NoYXJ0T3B0aW9uLnR5cGVdKSB7XHJcbiAgICAgICAgLy8gQHRzLWlnbm9yZVxyXG4gICAgICAgIGRlZmF1bHRPcHRpb25bY2hhcnRPcHRpb24udHlwZV0uZm9yRWFjaChmaWVsZCA9PiB7XHJcbiAgICAgICAgICAvLyBAdHMtaWdub3JlXHJcbiAgICAgICAgICBpZiAoY2hhcnRPcHRpb25bZmllbGRdICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxyXG4gICAgICAgICAgICB0aGlzW2ZpZWxkXSA9IGNoYXJ0T3B0aW9uW2ZpZWxkXTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKGNoYXJ0T3B0aW9uLnR5cGUgPT09IERqQ2hhcnRUeXBlLkRDX0NIQVJUKSB7XHJcbiAgICAgICAgT2JqZWN0LmtleXMoY2hhcnRPcHRpb24pLmZvckVhY2goa2V5ID0+IHtcclxuICAgICAgICAgIC8vIEB0cy1pZ25vcmVcclxuICAgICAgICAgIHRoaXNba2V5XSA9IGNoYXJ0T3B0aW9uW2tleV07XHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmIChjaGFydE9wdGlvbi5kYXRhKSB7XHJcbiAgICAgICAgdGhpcy5zZXREYXRhKGNoYXJ0T3B0aW9uLmRhdGEpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBzZXREYXRhKGRhdGE/OiBBcnJheTxhbnk+KSB7XHJcbiAgICBpZiAodGhpcy50eXBlID09PSBEakNoYXJ0VHlwZS5DT01QT1NJVEUgJiYgdGhpcy54QXhpc09wdGlvbiAmJiB0aGlzLnhBeGlzT3B0aW9uLnR5cGUgPT09ICdkYXRlJykge1xyXG4gICAgICB0aGlzLmRhdGEgPSBkYXRhO1xyXG4gICAgICB0aGlzLmRhdGEuZm9yRWFjaCgoZDogYW55KSA9PiB7XHJcbiAgICAgICAgLy8gQHRzLWlnbm9yZVxyXG4gICAgICAgIGQua2V5WzFdID0gbW9tZW50KGQua2V5WzFdLCB0aGlzLnhBeGlzT3B0aW9uLmRhdGVGb3JtYXQpLnRvRGF0ZSgpO1xyXG4gICAgICB9KTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHRoaXMuZGF0YSA9IGRhdGE7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBzZXRBeGlzT3B0aW9uKCkge1xyXG4gICAgaWYgKHRoaXMueUF4aXNPcHRpb25zKSB7XHJcbiAgICAgIGxldCBkYXRhOiBBcnJheTxhbnk+O1xyXG4gICAgICBjb25zdCBzZXJpZXNUeXBlcyA9IHRoaXMuc2VyaWVzVHlwZXMgfHwge307XHJcbiAgICAgIGNvbnN0IGF4aXNPcHRpb246IEFycmF5PGFueT4gPSBbXTtcclxuICAgICAgaWYgKHRoaXMuZGF0YSAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgZGF0YSA9IHRoaXMuZGF0YTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBkYXRhID0gdGhpcy5ncm91cCgpLmFsbCgpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICB0aGlzLnlBeGlzT3B0aW9ucy5mb3JFYWNoKGF4aXMgPT4ge1xyXG4gICAgICAgIC8vIEB0cy1pZ25vcmVcclxuICAgICAgICBjb25zdCBmaWx0ZXJEYXRhID0gZGF0YS5maWx0ZXIoKGQ6IGFueSkgPT4ge1xyXG4gICAgICAgICAgaWYgKGF4aXMua2V5cy5pbmRleE9mKGQua2V5WzBdKSA+IC0xKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIGNvbnN0IG1heCA9IGQzLm1heChmaWx0ZXJEYXRhLCBkID0+IGQudmFsdWUpO1xyXG4gICAgICAgIGNvbnN0IG1pbiA9IGQzLm1pbihmaWx0ZXJEYXRhLCBkID0+IGQudmFsdWUpIHx8IDA7XHJcblxyXG4gICAgICAgIGF4aXMua2V5cy5mb3JFYWNoKChrZXksIGkpID0+IHtcclxuICAgICAgICAgIGNvbnN0IF9vcHRpb24gPSA8QXhpc09wdGlvbj48dW5rbm93bj57XHJcbiAgICAgICAgICAgIGF4aXNMYWJlbDogYXhpcy5heGlzTGFiZWwsXHJcbiAgICAgICAgICAgIGRvbWFpbjogYXhpcy5kb21haW4gPyBheGlzLmRvbWFpbiA6IFttaW4sIG1heF0sXHJcbiAgICAgICAgICAgIGhpZGU6IGksXHJcbiAgICAgICAgICAgIHNlcmllczoga2V5LFxyXG4gICAgICAgICAgICB0eXBlOiBzZXJpZXNUeXBlc1trZXldIHx8ICdsaW5lJyxcclxuICAgICAgICAgICAgc2l6ZTogYXhpcy5zaXplIHx8IDYsXHJcbiAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgIGlmICh0aGlzLnNlcmllc09wdGlvbnMgJiYgdGhpcy5zZXJpZXNPcHRpb25zW2tleV0pIHtcclxuICAgICAgICAgICAgT2JqZWN0LmtleXModGhpcy5zZXJpZXNPcHRpb25zW2tleV0pLmZvckVhY2gob3AgPT4ge1xyXG4gICAgICAgICAgICAgIC8vIEB0cy1pZ25vcmVcclxuICAgICAgICAgICAgICBfb3B0aW9uW29wXSA9IHRoaXMuc2VyaWVzT3B0aW9uc1trZXldW29wXTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgaWYgKHRoaXMuY29sb3JzICYmIHRoaXMuY29sb3JzW2tleV0pIHtcclxuICAgICAgICAgICAgX29wdGlvblsnY29sb3InXSA9IHRoaXMuY29sb3JzW2tleV07XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBpZiAoYXhpcy5wcmV2VGlja1RleHQgfHwgYXhpcy5uZXh0VGlja1RleHQpIHtcclxuICAgICAgICAgICAgX29wdGlvblsndGlja0Zvcm1hdCddID0gKGQ6IGFueSkgPT4ge1xyXG4gICAgICAgICAgICAgIGxldCB0aWNrID0gJyc7XHJcbiAgICAgICAgICAgICAgaWYgKGF4aXMucHJldlRpY2tUZXh0KSB7XHJcbiAgICAgICAgICAgICAgICB0aWNrICs9IGF4aXMucHJldlRpY2tUZXh0O1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICB0aWNrICs9IHRoaXMuY29tbWFTZXBhcmF0ZU51bWJlcihkKSB8fCAwO1xyXG4gICAgICAgICAgICAgIGlmIChheGlzLm5leHRUaWNrVGV4dCkge1xyXG4gICAgICAgICAgICAgICAgdGljayArPSBheGlzLm5leHRUaWNrVGV4dDtcclxuICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgIHJldHVybiB0aWNrO1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgaWYgKGF4aXMudGlja0Zvcm1hdCkge1xyXG4gICAgICAgICAgICBfb3B0aW9uWyd0aWNrRm9ybWF0J10gPSBheGlzLnRpY2tGb3JtYXQ7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBheGlzT3B0aW9uLnB1c2gobmV3IEF4aXNPcHRpb24oX29wdGlvbikpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICB9KTtcclxuXHJcbiAgICAgIHJldHVybiB0aGlzLmF4aXNPcHRpb24gPSBheGlzT3B0aW9uO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRoaXMuYXhpc09wdGlvbiA9IFtdO1xyXG4gIH1cclxuXHJcbiAgZ2V0S2V5cygpIHtcclxuICAgIGNvbnN0IGtleXMgPSB0aGlzLmRhdGEubWFwKChkOiBhbnkpID0+IHtcclxuICAgICAgaWYgKEFycmF5LmlzQXJyYXkoZC5rZXkpKSB7XHJcbiAgICAgICAgcmV0dXJuIGQua2V5WzBdO1xyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiBkLmtleTtcclxuICAgIH0pO1xyXG4gICAgcmV0dXJuIF8udW5pcShrZXlzKTtcclxuICB9XHJcblxyXG4gIGdldExlZ2VuZHMoKSB7XHJcbiAgICBpZiAoIXRoaXMuX2xlZ2VuZE9iaikge1xyXG4gICAgICB0aGlzLnNldExlZ2VuZE9iaigpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRoaXMuX2xlZ2VuZE9iajtcclxuICB9XHJcblxyXG4gIHNldEZpbHRlcnMoZmlsdGVycz86IGFueSkge1xyXG4gICAgdGhpcy5zZXRMZWdlbmRPYmooKTtcclxuICB9XHJcblxyXG4gIGZpbHRlckFsbCgpIHtcclxuICAgIHRoaXMuY2hhcnQuZmlsdGVyQWxsKCk7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIHNldExlZ2VuZE9iaigpIHtcclxuICAgIHRoaXMuX2xlZ2VuZE9iaiA9IFtdO1xyXG4gICAgdGhpcy5nZXRLZXlzKCkuZm9yRWFjaChrZXkgPT4ge1xyXG4gICAgICBjb25zdCBsZWdlbmQgPSB7XHJcbiAgICAgICAga2V5OiBrZXksXHJcbiAgICAgICAgLy8gQHRzLWlnbm9yZVxyXG4gICAgICAgIG5hbWU6IHRoaXMubGVnZW5kc1trZXldIHx8IGtleSxcclxuICAgICAgICBmaWx0ZXI6ICgpID0+IHRoaXMuY2hhcnQuZmlsdGVyKGtleSksXHJcbiAgICAgICAgY29sb3I6ICgpID0+IHtcclxuICAgICAgICAgIGNvbnN0IGRlZmF1bHRDb2xvciA9IHRoaXMuY2hhcnQuZ2V0Q29sb3Ioa2V5KTtcclxuICAgICAgICAgIC8vIEB0cy1pZ25vcmVcclxuICAgICAgICAgIHJldHVybiB0aGlzLmNvbG9ycyA/IHRoaXMuY29sb3JzW2tleV0gfHwgZGVmYXVsdENvbG9yIDogZGVmYXVsdENvbG9yO1xyXG4gICAgICAgIH1cclxuICAgICAgfTtcclxuICAgICAgdGhpcy5fbGVnZW5kT2JqLnB1c2gobGVnZW5kKTtcclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBjb21tYVNlcGFyYXRlTnVtYmVyICh2YWx1ZTogYW55KSB7XHJcbiAgICBpZiAoIXZhbHVlKSB7XHJcbiAgICAgIHJldHVybiAnJztcclxuICAgIH1cclxuICAgIHdoaWxlICgvKFxcZCspKFxcZHszfSkvLnRlc3QodmFsdWUudG9TdHJpbmcoKSkpIHtcclxuICAgICAgdmFsdWUgPSB2YWx1ZS50b1N0cmluZygpLnJlcGxhY2UoLyhcXGQpKD89KFxcZFxcZFxcZCkrKD8hXFxkKSkvZywgJyQxLCcpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHZhbHVlO1xyXG4gIH1cclxufVxyXG4iXX0=