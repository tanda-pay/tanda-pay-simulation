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
    this.userInput.numDefectors = Math.round(this.userInput.numPh * this.userInput.percentageToDefect);
    this.userInput.numCu = this.userInput.tul / this.userInput.cuValue;
    this.userInput.totalPremiums = this.userInput.numCu * this.userInput.desiredPremiumMean;
    this.userInput.overpaymentIncrease = 1 / (this.userInput.avgGroupSize - 1);
    this.userInput.tol = this.userInput.tul * this.userInput.mean_Claims2TUL;
    this.userInput.totalClaimCount = this.userInput.numPh * this.userInput.mean_claimProportion;
    this.userInput.averageClaimValue = this.userInput.tol / this.userInput.totalClaimCount;
    if (this.userInput.mean_Claims2TUL > this.userInput.mean_claimProportion) {
      this.userInput.mean_claimProportion = this.userInput.mean_Claims2TUL;
    }
    this.userInput.catastropheEV = this.userInput.majorCatastropheMeanDamage * this.userInput.majorCatastropheLikelihood * this.userInput.policyPeriodLength;
    this.userInput.catastropheEV += this.userInput.minorCatastropheMeanDamage * this.userInput.minorCatastropheLikelihood * this.userInput.policyPeriodLength;
    this.userInput.catastropheEV *= this.userInput.policyPeriodLength * this.userInput.cuValue;
    let graphMean = this.userInput.desiredPremiumMean;
    let graphStdev = this.userInput.desiredPremiumStdev;
    let premiumAxisMax = this.userInput.cuValue / 4;
    if (premiumAxisMax < graphMean + 2 * graphStdev) {
      premiumAxisMax = this.userInput.cuValue;
    }
    this.drawChart('premiumgraph', graphMean, graphStdev, 0, premiumAxisMax);
    graphMean = this.userInput.mean_Claims2TUL * this.userInput.tul;
    graphStdev = this.userInput.stdev_Claims2TUL * this.userInput.tul;
    let claimValueAxisMax = this.userInput.tul / 2;
    if (claimValueAxisMax < graphMean + 2 * graphStdev) {
      claimValueAxisMax = this.userInput.tul;
    }
    this.drawChart('tolgraph', graphMean, graphStdev, 0, claimValueAxisMax);
    graphMean = this.userInput.mean_claimProportion * this.userInput.numPh;
    graphStdev = this.userInput.stdev_claimProportion * this.userInput.numPh;
    let claimLikelihoodAxisMax = this.userInput.numPh / 4;
    if (claimLikelihoodAxisMax < graphMean + 2 * graphStdev) {
      claimLikelihoodAxisMax = this.userInput.numPh;
    }
    this.drawChart('claimantcountgraph', graphMean, graphStdev, 0, claimLikelihoodAxisMax);
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
      credits: {
        enabled: false
      },
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
