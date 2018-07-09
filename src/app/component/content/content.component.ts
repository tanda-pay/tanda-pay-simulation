import {Component, Input} from '@angular/core';
import {TandapaySimulationService} from '../../service/tandapay.simulation.service';
import {SimulationSetupService} from '../../service/simulation.setup.service';
import {UserInput} from '../../model/user-input';
import {BancorContract, UnitySimulationService} from '../../service/unity.simulation.service';
import {TandapayState} from '../../model/tandapay-state';
import {UnityState} from '../../model/unity-state';

@Component({
  selector: 'app-content',
  templateUrl: './content.component.html',
  styleUrls: ['./content.component.css'],
})
export class ContentComponent {
  // @Input() currentDB: SimulationDatabase;
  @Input() userInput: UserInput;
  simulations: TandapayState[];
  unitySimulations: UnityState[];

  constructor(
    private simulationSetupService: SimulationSetupService,
    private simulationService: TandapaySimulationService,
    private unitySimulationService: UnitySimulationService
  ) {
    this.simulations = [];
    this.unitySimulations = [];
  }

  runSimulation(): void {
    // const currentDB = this.simulationSetupService.userInputToDB(this.userInput);
    const policyholders = this.simulationSetupService.userInputToPolicyholders(this.userInput);
    this.simulationService.policyholders = policyholders;
    this.simulationService.state = new TandapayState(this.userInput.policyPeriodLength, this.userInput.cuValue);
    this.simulationService.state.subgroups = this.simulationSetupService.generateSubgroups(policyholders, this.userInput.avgGroupSize);
    this.simulationService.generateSimulation(this.userInput.numPolicyPeriods);
    this.simulationService.generateSimulationSummary();
    this.simulations.push(this.simulationService.state);

    this.unitySimulationService.policyholders = policyholders;
    this.unitySimulationService.state = new UnityState(this.userInput.policyPeriodLength, this.userInput.cuValue, [10, 20, 30]);
    this.unitySimulationService.state.arrCATokensPerPH =  Array(policyholders.length).fill(0);
    this.unitySimulationService.state.arrRedemptionWindows = Array(policyholders.length).fill(0);
    const e = this.unitySimulationService.state.bxcStartingEth = this.userInput.unityBxcInitialEth;
    const w = this.unitySimulationService.state.bxcTargetWeight = this.userInput.unityBxcInitialWeight;
    this.unitySimulationService.state.bxc = new BancorContract(e, e / w, w);
    this.unitySimulationService.state.numCA_MPC = e / w;


    // this.simulationService.timeline.arrDamagesPerDayPerPH = this.simulationSetupService.generateDamagesPerDay(currentDB.policyholders, this.policyPeriodLength, this.iterations, currentDB.mean_ClaimantProportion, currentDB.stdev_ClaimantProportion, currentDB.mean_Claims2TUL, currentDB.stdev_Claims2TUL)

    // for (let i = 0; i < this.userInput.numPolicyPeriods; i++) {
    //   this.simulationService.simulateNextPolicyPeriod(currentDB);
    // }
    this.unitySimulationService.generateSimulation(this.userInput.numPolicyPeriods);
    this.unitySimulationService.generateSimulationSummary();
    this.unitySimulations.push(this.unitySimulationService.state);
  }
}
