import {BaseMixin} from './base-mixin';

export class MarginMixin extends BaseMixin {
  _margin = {
    top: 10,
    right: 50,
    bottom: 30,
    left: 30
  };

  constructor () {
    super();
  }

  margins (margins?: any) {
    if (!margins) {
      return this._margin;
    }
    this._margin = margins;
    return this;
  }

  effectiveWidth () {
    // @ts-ignore
    return this.width() - this.margins().left - this.margins().right;
  }

  effectiveHeight () {
    // @ts-ignore
    return this.height() - this.margins().top - this.margins().bottom;
  }
}
