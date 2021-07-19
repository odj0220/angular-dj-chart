import { TestBed } from '@angular/core/testing';

import { DjAngularChartService } from './dj-angular-chart.service';

describe('DjAngularChartService', () => {
  let service: DjAngularChartService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DjAngularChartService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
