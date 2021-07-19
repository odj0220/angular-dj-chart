import { Component } from '@angular/core';
import moment from 'moment';
import {DjChartOption} from 'angular-dj-chart';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'dj-angular-libraries';

  chart = new DjChartOption({
    data: [
      {
        key: [
          'sale',
          '20200601'
        ],
        value: 701.0
      },
      {
        key: [
          'sale',
          '20200608'
        ],
        value: 534.0
      },
      {
        key: [
          'sale',
          '20200615'
        ],
        value: 236.0
      },
      {
        key: [
          'sale',
          '20200622'
        ],
        value: 53.0
      },
      {
        key: [
          'sale',
          '20200629'
        ],
        value: 127.0
      },
      {
        key: [
          'sale',
          '20200706'
        ],
        value: 130.0
      },
      {
        key: [
          'sale',
          '20200713'
        ],
        value: 95.0
      },
      {
        key: [
          'sale',
          '20200720'
        ],
        value: 2338.0
      },
      {
        key: [
          'sale',
          '20200727'
        ],
        value: 12072.0
      },
      {
        key: [
          'sale',
          '20200803'
        ],
        value: 3693.0
      },
      {
        key: [
          'sale',
          '20200817'
        ],
        value: 6090.0
      },
      {
        key: [
          'gross',
          '20200601'
        ],
        value: 2453500.0
      },
      {
        key: [
          'gross',
          '20200608'
        ],
        value: 1869000.0
      },
      {
        key: [
          'gross',
          '20200615'
        ],
        value: 826000.0
      },
      {
        key: [
          'gross',
          '20200622'
        ],
        value: 185500.0
      },
      {
        key: [
          'gross',
          '20200629'
        ],
        value: 444500.0
      },
      {
        key: [
          'gross',
          '20200706'
        ],
        value: 455000.0
      },
      {
        key: [
          'gross',
          '20200713'
        ],
        value: 332500.0
      },
      {
        key: [
          'gross',
          '20200720'
        ],
        value: 8183000.0
      },
      {
        key: [
          'gross',
          '20200727'
        ],
        value: 4.2252E7
      },
      {
        key: [
          'gross',
          '20200803'
        ],
        value: 1.29255E7
      },
      {
        key: [
          'gross',
          '20200817'
        ],
        value: 2.1315E7
      }
    ],
    type: 'composite',
    colors: {
      sale: '#304ffe',
      gross: '#c51162'
    },
    legends: {
      sale: '총 주문량',
      gross: '총 주문 금액'
    },
    seriesTypes: {
      sale: 'line',
      gross: 'line'
    },
    seriesOptions: {
      sale: {
        smooth: true,
        renderArea: true,
      },
      gross: {}
    },
    xAxisOption: {
      'axisLabel': '날짜 (월/일)',
      'type': 'date',
      'dateFormat': 'YYYYMMDD',
      'dateTickFormat': 'MM/DD',
    },
    yAxisOptions: [
      {
        axisLabel: '총 주문량',
        domain: [
          0.0,
          12673.0
        ],
        keys: ['sale']
      },
      {
        'axisLabel': '총 주문 금액',
        'domain': [
          0.0,
          4.4355325E7
        ],
        nextTickText: '원',
        keys: [
          'gross'
        ]
      }
    ],
    tooltip: (d: any) => {
      const html = `<dl><dt>${moment(d.data.key[1], 'YYYYMMDD')
        .format('MM/DD')}</dt><dd>${d.data.value}</dd>`;
      return html;
    },
    renderArea: false,
    smooth: true
  });


}
