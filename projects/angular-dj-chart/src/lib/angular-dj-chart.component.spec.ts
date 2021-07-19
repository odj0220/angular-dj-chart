import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AngularDjChartComponent } from './angular-dj-chart.component';

describe('AngularDjChartComponent', () => {
  let component: AngularDjChartComponent;
  let fixture: ComponentFixture<AngularDjChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AngularDjChartComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AngularDjChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
