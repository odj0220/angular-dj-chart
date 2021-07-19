import { BaseMixin } from './base-mixin';
export class MarginMixin extends BaseMixin {
    constructor() {
        super();
        this._margin = {
            top: 10,
            right: 50,
            bottom: 30,
            left: 30
        };
    }
    margins(margins) {
        if (!margins) {
            return this._margin;
        }
        this._margin = margins;
        return this;
    }
    effectiveWidth() {
        // @ts-ignore
        return this.width() - this.margins().left - this.margins().right;
    }
    effectiveHeight() {
        // @ts-ignore
        return this.height() - this.margins().top - this.margins().bottom;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFyZ2luLW1peGluLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vcHJvamVjdHMvYW5ndWxhci1kai1jaGFydC9zcmMvbGliL2Jhc2UvbWFyZ2luLW1peGluLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBQyxTQUFTLEVBQUMsTUFBTSxjQUFjLENBQUM7QUFFdkMsTUFBTSxPQUFPLFdBQVksU0FBUSxTQUFTO0lBUXhDO1FBQ0UsS0FBSyxFQUFFLENBQUM7UUFSVixZQUFPLEdBQUc7WUFDUixHQUFHLEVBQUUsRUFBRTtZQUNQLEtBQUssRUFBRSxFQUFFO1lBQ1QsTUFBTSxFQUFFLEVBQUU7WUFDVixJQUFJLEVBQUUsRUFBRTtTQUNULENBQUM7SUFJRixDQUFDO0lBRUQsT0FBTyxDQUFFLE9BQWE7UUFDcEIsSUFBSSxDQUFDLE9BQU8sRUFBRTtZQUNaLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQztTQUNyQjtRQUNELElBQUksQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDO1FBQ3ZCLE9BQU8sSUFBSSxDQUFDO0lBQ2QsQ0FBQztJQUVELGNBQWM7UUFDWixhQUFhO1FBQ2IsT0FBTyxJQUFJLENBQUMsS0FBSyxFQUFFLEdBQUcsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUMsS0FBSyxDQUFDO0lBQ25FLENBQUM7SUFFRCxlQUFlO1FBQ2IsYUFBYTtRQUNiLE9BQU8sSUFBSSxDQUFDLE1BQU0sRUFBRSxHQUFHLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQyxHQUFHLEdBQUcsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDLE1BQU0sQ0FBQztJQUNwRSxDQUFDO0NBQ0YiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge0Jhc2VNaXhpbn0gZnJvbSAnLi9iYXNlLW1peGluJztcblxuZXhwb3J0IGNsYXNzIE1hcmdpbk1peGluIGV4dGVuZHMgQmFzZU1peGluIHtcbiAgX21hcmdpbiA9IHtcbiAgICB0b3A6IDEwLFxuICAgIHJpZ2h0OiA1MCxcbiAgICBib3R0b206IDMwLFxuICAgIGxlZnQ6IDMwXG4gIH07XG5cbiAgY29uc3RydWN0b3IgKCkge1xuICAgIHN1cGVyKCk7XG4gIH1cblxuICBtYXJnaW5zIChtYXJnaW5zPzogYW55KSB7XG4gICAgaWYgKCFtYXJnaW5zKSB7XG4gICAgICByZXR1cm4gdGhpcy5fbWFyZ2luO1xuICAgIH1cbiAgICB0aGlzLl9tYXJnaW4gPSBtYXJnaW5zO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgZWZmZWN0aXZlV2lkdGggKCkge1xuICAgIC8vIEB0cy1pZ25vcmVcbiAgICByZXR1cm4gdGhpcy53aWR0aCgpIC0gdGhpcy5tYXJnaW5zKCkubGVmdCAtIHRoaXMubWFyZ2lucygpLnJpZ2h0O1xuICB9XG5cbiAgZWZmZWN0aXZlSGVpZ2h0ICgpIHtcbiAgICAvLyBAdHMtaWdub3JlXG4gICAgcmV0dXJuIHRoaXMuaGVpZ2h0KCkgLSB0aGlzLm1hcmdpbnMoKS50b3AgLSB0aGlzLm1hcmdpbnMoKS5ib3R0b207XG4gIH1cbn1cbiJdfQ==