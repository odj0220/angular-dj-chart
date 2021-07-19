import * as dc from 'dc';

export class DcChart {

  constructor() {
    Object.keys(dc).forEach(key => {
      // @ts-ignore
      this[key] = dc[key];
    });
  }
}
