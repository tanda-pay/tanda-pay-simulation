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
  @Input() set range(range: [number, number]) {
    this._range = range;
    console.log(range);
    this.updateChart();
  }

  constructor() {
    this._mean = 5;
    this._stdDeviation = 3.3;
    this._range = [0, 100];
  }

  _stdDeviation: number;
  _mean: number;
  _range: [number, number];

  updateChart() {
    const stdDeviation3 = this._stdDeviation * 3;
    const xAxisMin = this._range[0];
    const lowerBound = this._mean - stdDeviation3;
    const upperBound = this._mean + stdDeviation3;
    const xAxisMax = this._range[1];
    const points = [];
    let xIterator = xAxisMin;
    const stepVals = [(lowerBound - xAxisMin + xAxisMax - upperBound) / 20, (upperBound - lowerBound) / 100];
    while (xIterator < xAxisMax) {
      points.push(xIterator);
      if (xIterator >= upperBound) {
        xIterator += stepVals[0];
      } else if (xIterator >= lowerBound) {
        xIterator = Math.min(xIterator + stepVals[1], upperBound);
      } else {
        xIterator = Math.min(xIterator + stepVals[0], lowerBound);
      }
    }
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
      xAxis: {
        min: this._range[0],
        max: this._range[1],
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
