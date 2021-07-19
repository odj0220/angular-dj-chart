import { BaseMixin } from './base-mixin';
export declare class MarginMixin extends BaseMixin {
    _margin: {
        top: number;
        right: number;
        bottom: number;
        left: number;
    };
    constructor();
    margins(margins?: any): this | {
        top: number;
        right: number;
        bottom: number;
        left: number;
    };
    effectiveWidth(): number;
    effectiveHeight(): number;
}
