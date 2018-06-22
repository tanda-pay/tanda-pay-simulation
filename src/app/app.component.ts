import {Component, OnInit} from '@angular/core';
import {PolicyHolderGenerationService} from './service/policy-holder-generation.service';
import {SimulationService} from './service/simulation.service';
import {UserInput} from './model/user-input';
import {PolicyHolder} from './model/policy-holder';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {

  userInput: UserInput;
  subGroups: PolicyHolder[][];

  constructor(private policyHolderGeneratorService: PolicyHolderGenerationService,
              private simulationService: SimulationService) {
  }

  ngOnInit() {
    this.userInput = new UserInput();
    this.startSimulation();
  }

  startSimulation() {
    this.subGroups = this.renderPolicyHolders();
    // const period = this.simulationService.doPolicyPeriod(subgroups, null);
  }

  renderPolicyHolders() {
    const numPH = this.userInput.numPH;
    const avgSubGroupSize = this.userInput.avgGroupSize;
    const coverageUnits = this.userInput.tul / this.userInput.cuValue;
    const premeiumMean = this.userInput.desiredPremiumMean / this.userInput.cuValue;
    const premiumstdev = this.userInput.desiredPremiumStdev / this.userInput.cuValue;
    const tolMean = this.userInput.percentageOfTUL2Claims * coverageUnits;
    const claimfreqmean = this.userInput.likelihoodOpenClaimMean;
    const claimStdev = this.userInput.likelihoodOpenClaimStdev / 100;
    const defectpercent = this.userInput.likelihoodToDefect;

    return null;
  }
}
