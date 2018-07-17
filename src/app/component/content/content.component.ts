import {Component, Input, OnInit} from '@angular/core';
import {TandapaySimulationService} from '../../service/tandapay.simulation.service';
import {SimulationSetupService} from '../../service/simulation.setup.service';
import {UserInput} from '../../model/user-input';
import {BancorContract, UnitySimulationService} from '../../service/unity.simulation.service';
import {TandapayState} from '../../model/tandapay-state';
import {UnityState} from '../../model/unity-state';

// import * as truncatedNormalDistribution from 'distributions-truncated-normal-pdf';
declare var pdf: any;
declare var Highcharts: any;

@Component({
  selector: 'app-content',
  templateUrl: './content.component.html',
  styleUrls: ['./content.component.css'],
})

export class ContentComponent implements OnInit {
  // @Input() currentDB: SimulationDatabase;
  @Input() userInput: UserInput;
  simulations: TandapayState[];
  unitySimulations: UnityState[];

  highchart;

  constructor(
    private simulationSetupService: SimulationSetupService,
    private simulationService: TandapaySimulationService,
    private unitySimulationService: UnitySimulationService
  ) {
    this.simulations = [];
    this.unitySimulations = [];

  }

  ngOnInit() {

  }

  onSimulationTabChanged(tabIndex) {
    console.log('detected tab change');
    const collectedPremiums = this.simulations[0].periods[tabIndex].totalPremiumsAfterDefect * this.simulations[0].coverageUnitValue;
    const claims = this.simulations[0].periods[tabIndex].totalEligibleClaims * this.simulations[0].coverageUnitValue;
    this.updateGraph(collectedPremiums, claims);
  }

  updateGraph(premiums, tol) {
    this.highchart.xAxis[0].removePlotLine('plot-line-1');
    this.highchart.xAxis[0].addPlotLine({
      id: 'plot-line-1',
      label: {
        text: '-Premiums-<br>-$' + Math.round(premiums) + '-', // Content of the label.
        style: {
          color: 'green'
        },
        align: (premiums > tol ? 'left' : 'right'), // Positioning of the label.
        rotation: 0,
        x: +0,
        y: +15
      },
      color: 'rgb(30, 150, 30)',
      width: 2,
      value: premiums,
      zIndex: 6
    });
    this.highchart.xAxis[0].removePlotLine('plot-line-2');
    this.highchart.xAxis[0].addPlotLine({
      id: 'plot-line-2',
      label: {
        text: '-Claims-<br>-$' + Math.round(tol) + '-', // Content of the label.
        style: {
          color: 'red'
        },
        align: (premiums <= tol ? 'left' : 'right'), // Positioning of the label.
        rotation: 0,
        x: +0,
        y: +30
      },
      color: 'rgb(150, 30, 30)',
      width: 2,
      value: tol,
      zIndex: 7
    });
    this.highchart.update({
      xAxis: {
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
          color: {linearGradient: { x1: 0, y1: 0, x2: 1, y2: 0},
            stops: [
              [0, 'rgb(255, 130, 130)'],
              [1, 'rgb(100, 0, 0)']
            ]
          },
          from: premiums,
          to: this.highchart.xAxis[0].max
        }]}
    });
  }

  initGraph(divId, mean, stdev, premiums) {
    const xAxisMin = 0;
    const xAxisMax = this.userInput.tul;
    const yAxisMax = .004;
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
    const seriesData = points.map(x => ({ x, y: pdf( x, {
        'a': 0,
        'b': this.userInput.tul,
        'mu': mean,
        'sigma': stdev,
      }) }));

    return Highcharts.chart(divId, {
      chart: {
        alignTicks: false,
        type: 'areaspline',
        marginLeft: 50
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
        title: {text: 'Total value of claims ($)'},
        plotLines: [{
          id: 'plot-line-1',
          label: {
            text: 'Initial Premiums', // Content of the label.
            style: {
              color: 'green'
            },
            align: 'left', // Positioning of the label.
            rotation: 0,
            x: +5, // Amount of pixels the label will be repositioned according to the alignment.
            y: -15
          },
          color: 'rgb(0, 0, 0)',
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
          color: {linearGradient: { x1: 0, y1: 0, x2: this.userInput.tul / xAxisMax, y2: 0},
            stops: [
              [0, 'rgb(255, 130, 130)'],
              [1, 'rgb(100, 0, 0)']
            ]
          },
          from: premiums, // Start of the plot band
          to: this.userInput.tul // End of the plot band
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

  runSimulation(): void {

    const graphMean = this.userInput.mean_Claims2TUL * this.userInput.tul;
    const graphStdev = this.userInput.stdev_Claims2TUL * this.userInput.tul;
    this.highchart = this.initGraph('claimsgraph', graphMean, graphStdev, this.userInput.totalPremiums);

    // const currentDB = this.simulationSetupService.userInputToDB(this.userInput);
    const policyholders = this.simulationSetupService.userInputToPolicyholders(this.userInput);
    this.simulationService.policyholders = policyholders;
    this.simulationService.state = new TandapayState(this.userInput.policyPeriodLength, this.userInput.cuValue, this.userInput.mean_Claims2TUL, this.userInput.stdev_Claims2TUL, this.userInput.totalClaimCount);
    this.simulationService.state.subgroups = this.simulationSetupService.generateSubgroups(policyholders, this.userInput.avgGroupSize);
    this.simulationService.generateSimulation(this.userInput.numPolicyPeriods);
    this.simulationService.generateSimulationSummary();
    // this.simulations.push(this.simulationService.state);
    this.simulations[0] = this.simulationService.state;

    this.unitySimulationService.policyholders = policyholders;
    this.unitySimulationService.state = new UnityState(this.userInput.policyPeriodLength, this.userInput.cuValue, [10, 20, 30]);
    this.unitySimulationService.state.arrCATokensPerPH =  Array(policyholders.length).fill(0);
    this.unitySimulationService.state.arrRedemptionWindows = Array(policyholders.length).fill(0);
    const e = this.unitySimulationService.state.bxcStartingEth = this.userInput.unityBxcInitialEth;
    const w = this.unitySimulationService.state.bxcTargetWeight = this.userInput.unityBxcInitialWeight;
    this.unitySimulationService.state.bxc = new BancorContract(e, e / w, w);
    this.unitySimulationService.state.numCA_MPC = e / w;

    // for (let i = 0; i < this.userInput.numPolicyPeriods; i++) {
    //   const period = this.simulationService.state.periods[i];
    //   const premiums = period.totalPremiumsAfterDefect * this.userInput.cuValue;
    //   const claims = period.totalEligibleClaims * this.userInput.cuValue;
    //   const callback = this.updateGraph;
    //   setTimeout(function() { callback(highchart, premiums, claims); }, 2000 * i);
    // }

    // this.unitySimulationService.generateSimulation(this.userInput.numPolicyPeriods);
    // this.unitySimulationService.generateSimulationSummary();
    // this.unitySimulations.push(this.unitySimulationService.state);
  }
}
