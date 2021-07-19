import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DjAngularChartComponent } from './dj-angular-chart.component';

describe('DjAngularChartComponent', () => {
  let component: DjAngularChartComponent;
  let fixture: ComponentFixture<DjAngularChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DjAngularChartComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DjAngularChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
