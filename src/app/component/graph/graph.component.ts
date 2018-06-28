import {Component, Input} from '@angular/core';
import * as _ from 'underscore';
declare var Highcharts: any;

@Component({
  selector: 'app-graph',
  templateUrl: './graph.component.html',
  styleUrls: ['./graph.component.css'],
})
export class GraphComponent {

  @Input() set stdDeviation(stdDeviation: number) {
    this._stdDeviation = stdDeviation;
    this.updateChart();
  }
  @Input() set mean(mean: number) {
    this._mean = mean;
    this.updateChart();
  }

  constructor() {
    this._mean = 5;
    this._stdDeviation = 1;
  }

  _stdDeviation: number;
  _mean: number;

  updateChart() {
    const stdDeviation2 = this._stdDeviation * 2;
    const lowerBound = this._mean - stdDeviation2;
    const upperBound = this._mean + stdDeviation2;

    const step = ((upperBound + 1) - (lowerBound - 1)) / 100;
    const points = _.range((lowerBound - 1), (upperBound + 1), step);
    const seriesData = points.map(x => ({ x, y: this.normalDistributionY(x, this._mean, this._stdDeviation)}));

    Highcharts.chart('container', {
      chart: {
        type: 'area'
      },
      title: {
        text: ''
      },
      yAxis: {
        labels: {
          enabled: true,
        },
        gridLineWidth: 0,
        title: ''
      },
      tooltip: {
        enabled: true,
      },
      legend: {
        enabled: false,
      },
      series: [{
        data: seriesData,
      }],
      plotOptions: {
        area: {
          enableMouseTracking: true,
          color: 'rgb(226, 119, 122)',
          fillColor: 'rgba(226, 119, 122, 0.5)',
          zoneAxis: 'x',
          zones: [{
            // fillColor gets the inside of the graph, color would change the lines
            fillColor: 'white',
            // everything below this value has this style applied to it
            value: lowerBound,
          }, {
            value: upperBound,
          }, {
            fillColor: 'white',
          }]
        }
      }
    });
  }

  normalDistributionY(x, mean, stdDev) {
    return Math.exp((-0.5) * Math.pow((x - mean) / stdDev, 2));
  }
}
