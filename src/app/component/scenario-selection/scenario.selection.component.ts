import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {UserInput} from '../../model/user-input';

@Component({
  selector: 'app-scenario-selection',
  templateUrl: './scenario.selection.component.html',
  styleUrls: ['./scenario.selection.component.css']
})

export class ScenarioSelectionComponent implements OnInit {

  @Output() scenarioSelected = new EventEmitter<UserInput>();
  @Output() simulationKickoffRequested = new EventEmitter();

  selectedScenario: string;
  scenarios: string[] = ['Cheap premiums', 'Reasonable premiums', 'Good Coverage and Rebates'];
  userInput: UserInput;

  ngOnInit() {
    this.selectedScenario = this.scenarios[1];
    this.scenarioSelected.emit(this.getScenario2());
  }

  updateUserInput() {
    if (this.selectedScenario === 'Cheap premiums') {
      this.userInput = this.getScenario1();
    } else if (this.selectedScenario === 'Reasonable premiums') {
      this.userInput = this.getScenario2();
    } else if (this.selectedScenario === 'Good Coverage and Rebates') {
      this.userInput = this.getScenario3();
    }
    this.userInput.updateDerivedValues();
    this.userInput.unityBxcInitialEth = this.userInput.numCu * .1;
    this.userInput.unityBxcInitialWeight = .5;
  }

  getScenario1() {
    const userInput = new UserInput();
    userInput.numPh = 100;
    userInput.percentageToDefect = 0;
    userInput.defectorCapPerPeriod = 3;
    userInput.avgGroupSize = 7;
    userInput.tul = 10000;
    userInput.cuValue = 100;
    userInput.desiredPremiumMean = 4;
    userInput.desiredPremiumStdev = 0;
    userInput.mean_Claims2TUL = .05;
    userInput.stdev_Claims2TUL = .01;
    userInput.mean_claimProportion = .08;
    userInput.stdev_claimProportion = .01;

    userInput.majorCatastropheLikelihood = 0;
    userInput.majorCatastropheMeanDamage = .5;
    userInput.majorCatastropheStdevDamage = .1;

    userInput.minorCatastropheLikelihood = 0;
    userInput.minorCatastropheMeanDamage = .1;
    userInput.minorCatastropheStdevDamage = .01;


    userInput.numPolicyPeriods = 36;
    userInput.policyPeriodLength = 30;
    return userInput;
  }
  getScenario2() {
    const userInput = new UserInput();
    userInput.numPh = 100;
    userInput.percentageToDefect = 0;
    userInput.defectorCapPerPeriod = 3;
    userInput.avgGroupSize = 7;
    userInput.tul = 10000;
    userInput.cuValue = 100;
    userInput.desiredPremiumMean = 5;
    userInput.desiredPremiumStdev = 0;
    userInput.mean_Claims2TUL = .05;
    userInput.stdev_Claims2TUL = .01;
    userInput.mean_claimProportion = .08;
    userInput.stdev_claimProportion = .01;

    userInput.majorCatastropheLikelihood = 0;
    userInput.majorCatastropheMeanDamage = .5;
    userInput.majorCatastropheStdevDamage = .1;

    userInput.minorCatastropheLikelihood = 0;
    userInput.minorCatastropheMeanDamage = .1;
    userInput.minorCatastropheStdevDamage = .01;

    userInput.numPolicyPeriods = 36;
    userInput.policyPeriodLength = 30;

    return userInput;
  }
  getScenario3() {
    const userInput = new UserInput();
    userInput.numPh = 100;
    userInput.percentageToDefect = 0;
    userInput.defectorCapPerPeriod = 3;
    userInput.avgGroupSize = 7;
    userInput.tul = 10000;
    userInput.cuValue = 100;
    userInput.desiredPremiumMean = 6;
    userInput.desiredPremiumStdev = 0;
    userInput.mean_Claims2TUL = .05;
    userInput.stdev_Claims2TUL = .01;
    userInput.mean_claimProportion = .08;
    userInput.stdev_claimProportion = .01;

    userInput.majorCatastropheLikelihood = 0;
    userInput.majorCatastropheMeanDamage = .5;
    userInput.majorCatastropheStdevDamage = .1;

    userInput.minorCatastropheLikelihood = 0;
    userInput.minorCatastropheMeanDamage = .1;
    userInput.minorCatastropheStdevDamage = .01;

    userInput.numPolicyPeriods = 36;
    userInput.policyPeriodLength = 30;

    return userInput;
  }
}
