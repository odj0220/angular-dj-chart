# AngularDjChart

D3, Crossfilter, DC library를 이용하여 Angular 모듈로 만든 차트

## 설치

`npm install angular-dj-chart` 
 

## 사용
#### app.module.ts
````ts
import ...
import {AngularDjChartModule} from 'angular-dj-chart';

@NgModule({
  declarations: [
    AppComponent,
    ...
  ],
  imports: [
   ...
   AngularDjChartModule
  ],
  entryComponents: [],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
````


#### component.ts
````ts
import {DjChartOption} from 'angular-dj-chart';

compositeChart = new DjChartOption({
    type: 'composite',
    data: [
        { "key": ["티셔츠", "20200201"], "value": 860},
        { "key": ["팬츠", "20200201"], "value": 635},
        { "key": ["풀오버", "20200201"], "value": 462},
        { "key": ["원피스", "20200201"], "value": 454},
        { "key": ["베스트", "20200201"], "value": 63},
        { "key": ["티셔츠", "20200203"], "value": 3547},
        { "key": ["팬츠", "20200203"], "value": 3228},
        { "key": ["원피스", "20200203"], "value": 2184},
        ...
    ],
    seriesTypes: {
        '티셔츠': 'lineSymbol',
        '원피스': 'stepLine',
        '팬츠': 'line',
        '풀오버': 'symbol',
        '스커트': 'line',
        '가디건': 'line',
        '블라우스': 'symbol'
    },
    yAxisOptions: [
        {
            axisLabel: '판매량',
            keys: ['티셔츠', '원피스'],
            domain: [200, 5000]
        },
        {
            axisLabel: '판매량2',
            keys: ['팬츠', '가디건', '스커트'],
            domain: [0, 5000]
        },
        {
            axisLabel: '판매량3',
            keys: ['풀오버', '블라우스'],
            domain: [0, 2000]
        }
    ],
    xAxisOption: {
        axisLabel: '날짜 (일)',
        type: 'date',
        dateFormat: 'YYYYMMDD',
        dateTickFormat: 'YYYY-MM-DD',
    }
})
````

#### component.html
```angular2html
<wise-chart [option]="compositeChart"></wise-chart>
```
