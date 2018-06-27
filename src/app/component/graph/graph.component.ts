import {Component, OnInit} from '@angular/core';
import * as _ from 'underscore';

declare var Highcharts: any;

@Component({
  selector: 'app-graph',
  templateUrl: './graph.component.html',
  styleUrls: ['./graph.component.css'],
})
export class GraphComponent implements OnInit {

  constructor() {
    const lowerBound2 = 3;
    const upperBound2 = 10;
    const mean = this.getMean(lowerBound2, upperBound2);
    const stdDev = this.getStdDeviation(lowerBound2, upperBound2);
    const points = this.generatePoints(lowerBound2, upperBound2);
    const seriesData = points.map(x => ({x, y: this.normalY(x, mean, stdDev)}));
  }

  ngOnInit() {
    const myChart = Highcharts.chart('container', {
      chart: {
        type: 'bar'
      },
      title: {
        text: 'Fruit Consumption'
      },
      xAxis: {
        categories: ['Apples', 'Bananas', 'Oranges']
      },
      yAxis: {
        title: {
          text: 'Fruit eaten'
        }
      },
      series: [{
        name: 'Jane',
        data: [1, 0, 4]
      }, {
        name: 'John',
        data: [5, 7, 3]
      }]
    });
  }

  normalY(x, mean, stdDev) {
    return Math.exp((-0.5) * Math.pow((x - mean) / stdDev, 2));
  }

  getMean(lowerBound, upperBound) {
    return (upperBound + lowerBound) / 2;
  }

  // distance between mean and each bound of a 95% confidence interval
  // is 2 stdDeviation, so distance between the bounds is 4
  getStdDeviation(lowerBound, upperBound) {
    return (upperBound - lowerBound) / 4;
  }

  generatePoints(lowerBound, upperBound) {
    const stdDev = this.getStdDeviation(lowerBound, upperBound);
    const min = lowerBound - 2 * stdDev;
    const max = upperBound + 2 * stdDev;
    const unit = max - min / 100;
    return _.range(min, max, unit);
  }
}
