import {Component, EventEmitter, Input, Output} from '@angular/core';
import {UserInput} from '../../model/user-input';
declare var Highcharts: any;

@Component({
  selector: 'app-input',
  templateUrl: './input.component.html',
  styleUrls: ['./input.component.css']
})
export class InputComponent {
  @Input() userInput: UserInput;
  @Output() userInputChanged = new EventEmitter<boolean>();

  updateProjections() {
    this.userInput.numDefectors = Math.round(this.userInput.numPH * this.userInput.percentageToDefect);
    this.userInput.numCu = this.userInput.tul / this.userInput.cuValue;
    this.userInput.totalPremiums = this.userInput.numCu * this.userInput.desiredPremiumMean;
    this.userInput.overpaymentIncrease = 1 / (this.userInput.avgGroupSize - 1);
    this.userInput.tol = this.userInput.tul * this.userInput.ratio_Claims2TUL;
    this.userInput.totalClaimCount = this.userInput.numPH * this.userInput.mean_claimLikelihood;
    this.userInput.averageClaimValue = this.userInput.cuValue * this.userInput.tol / this.userInput.totalClaimCount;
    if (this.userInput.ratio_Claims2TUL > this.userInput.mean_claimLikelihood) {
      this.userInput.mean_claimLikelihood = this.userInput.ratio_Claims2TUL;
    }
    let graphMean = this.userInput.desiredPremiumMean;
    let graphStdev = this.userInput.desiredPremiumStdev;3
    let premiumAxisMax = this.userInput.cuValue / 4;
    if (premiumAxisMax < graphMean + 2 * graphStdev) {
      premiumAxisMax *= this.userInput.cuValue;
    }
    this.drawChart('premiumgraph', graphMean, this.userInput.desiredPremiumStdev, 0, premiumAxisMax);
    graphMean = this.userInput.mean_claimLikelihood;
    graphStdev = this.userInput.stdev_claimLikelihood;
    premiumAxisMax = this.userInput.numPH / 4;
    if (premiumAxisMax < graphMean + 2 * graphStdev) {
      premiumAxisMax *= this.userInput.numPH;
    }
    this.drawChart('claimantcountgraph', graphMean, this.userInput.desiredPremiumStdev, 0, premiumAxisMax);
  }

  drawChart(divId, mean, stdev, xAxisMin, xAxisMax) {
    const stdDeviation3 = stdev * 3;
    const lowerBound = Math.max(mean - stdDeviation3, xAxisMin);
    const upperBound = Math.min(mean + stdDeviation3, xAxisMax);
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
    const seriesData = points.map(x => ({ x, y: this.normalDistributionY(x, mean, stdev)}));

    Highcharts.chart(divId, {
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
        min: xAxisMin,
        max: xAxisMax,
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
    if (stdDev === 0) {
      return 0;
    }
    return Math.exp((-0.5) * Math.pow((x - mean) / stdDev, 2));
  }

}
