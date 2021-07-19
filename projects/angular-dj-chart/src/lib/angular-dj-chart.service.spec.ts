import { TestBed } from '@angular/core/testing';

import { AngularDjChartService } from './angular-dj-chart.service';

describe('AngularDjChartService', () => {
  let service: AngularDjChartService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AngularDjChartService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
