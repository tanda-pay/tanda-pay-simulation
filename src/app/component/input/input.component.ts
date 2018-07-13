import {Component, EventEmitter, Input, Output} from '@angular/core';
import {UserInput} from '../../model/user-input';
import * as truncatedNormalDistribution from 'distributions-truncated-normal-pdf';
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
    // let graphMean = this.userInput.desiredPremiumMean;
    // let graphStdev = this.userInput.desiredPremiumStdev;
    // let premiumAxisMax = this.userInput.cuValue / 4;
    // if (premiumAxisMax < graphMean + 2 * graphStdev) {
    //   premiumAxisMax = this.userInput.cuValue;
    // }
    // this.initGraph('premiumgraph', graphMean, graphStdev, 0, premiumAxisMax);
    const graphMean = this.userInput.mean_Claims2TUL * this.userInput.tul;
    const graphStdev = this.userInput.stdev_Claims2TUL * this.userInput.tul;
    let claimValueAxisMax = this.userInput.tul;
    // if (claimValueAxisMax < graphMean + 2 * graphStdev) {
    //   claimValueAxisMax = this.userInput.tul;
    // }
    this.drawBellCurveForTOL('tolgraph', graphMean, graphStdev, claimValueAxisMax, this.userInput.totalPremiums);
    // graphMean = this.userInput.mean_claimProportion * this.userInput.numPh;
    // graphStdev = this.userInput.stdev_claimProportion * this.userInput.numPh;
    // let claimLikelihoodAxisMax = this.userInput.numPh / 4;
    // if (claimLikelihoodAxisMax < graphMean + 2 * graphStdev) {
    //   claimLikelihoodAxisMax = this.userInput.numPh;
    // }
    // this.initGraph('claimantcountgraph', graphMean, graphStdev, 0, claimLikelihoodAxisMax);
  }

  drawBellCurveForTOL(divId, mean, stdev, tul, premiums) {
    const xAxisMin = 0;
    const xAxisMax = tul;
    const yAxisMax = .002;
    const stdDeviation3 = stdev * 3;

    const points = [];
    const lowerBound = Math.max(mean - stdDeviation3, xAxisMin);
    const upperBound = Math.min(mean + stdDeviation3, xAxisMax);
    let xIterator = xAxisMin;
    const stepVals = [(lowerBound - xAxisMin + xAxisMax - upperBound) / 100, (upperBound - lowerBound) / 200];
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
    points.push(xIterator);
    const seriesData = points.map(x => ({ x, y: truncatedNormalDistribution( x, {
        'a': 0,
        'b': tul,
        'mu': mean,
        'sigma': stdev,
      }) }));

    const underpaymentLikelihood = Math.round(GetZPercent((mean - premiums) / stdev) * 100);

    return Highcharts.chart(divId, {
      chart: {
        alignTicks: false,
        type: 'areaspline'
      },
      title: {
        text: 'Projected Costs of Claims per Policy Period'
      },
      yAxis: {
        labels: {
          enabled: false,
        },
        gridLineWidth: 0,
        min: 0,
        max: yAxisMax,
        maxPadding: 0,
        minPadding: 0,
        title: ''
      },
      xAxis: {
        min: xAxisMin,
        max: xAxisMax,
        labels: {
          enabled: true,
        },
        gridLineWidth: 0,
        title: 'Total value of claims ($)',
        plotLines: [{
          label: {
            text: 'Funds (' + underpaymentLikelihood + '% likely to underpay)', // Content of the label.
            style: {
              color: 'green'
            },
            align: 'left', // Positioning of the label.
            rotation: 0,
            x: +0, // Amount of pixels the label will be repositioned according to the alignment.
            y: -5
          },
          color: 'rgb(30, 150, 30)',
          width: 2,
          value: premiums,
          zIndex: 5
        }],
        plotBands: [{
          color: {linearGradient: { x1: 0, y1: 0, x2: 1, y2: 0},
            stops: [
              [0, 'rgb(0, 100, 0)'],
              [1, 'rgb(130, 255, 130)']
            ]
          },
          from: 0,
          to: premiums
        }, {
          color: {linearGradient: { x1: 0, y1: 0, x2: tul / xAxisMax, y2: 0},
            stops: [
              [0, 'rgb(255, 130, 130)'],
              [1, 'rgb(100, 0, 0)']
            ]
          },
          from: premiums, // Start of the plot band
          to: tul // End of the plot band
        }],
      },
      tooltip: {
        enabled: true,
      },
      legend: {
        enabled: false,
      },
      series: [{
        data: seriesData,
        fillColor: 'rgba(255,255,255,1)',
      }],
      credits: {
        enabled: false
      },
      plotOptions: {
        areaspline: {
          animation: false,
          threshold: yAxisMax,
          enableMouseTracking: true,
          marker: {
            enabled: false
          },
        }
      }
    });
  }

  updateBellCurve_VerticalThreshold(chart, xVal) {
    chart.update({

    });
  }

  normalDistributionY(x, mean, stdDev) {
    if (stdDev === 0) {
      return 0;
    }
    return Math.exp((-0.5) * Math.pow((x - mean) / stdDev, 2));
  }

}

function GetZPercent(z) {

  // z == number of standard deviations from the mean

  // if z is greater than 6.5 standard deviations from the mean the
  // number of significant digits will be outside of a reasonable range

  if (z < -6.5) {
    return 0.0;
  }

  if (z > 6.5) {
    return 1.0;
  }

  let factK = 1;
  let sum = 0;
  let term = 1;
  let k = 0;
  const loopStop = Math.exp(-23);

  while (Math.abs(term) > loopStop) {
    term = .3989422804 * Math.pow(-1, k) * Math.pow(z, k) / (2 * k + 1) / Math.pow(2, k) * Math.pow(z, k + 1) / factK;
    sum += term;
    k++;
    factK *= k;
  }

  sum += 0.5;

  return sum;
}
