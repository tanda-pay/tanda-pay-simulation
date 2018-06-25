import {Component, OnInit} from '@angular/core';
import {PolicyHolderGenerationService} from './service/policy-holder-generation.service';
import {SimulationService} from './service/simulation.service';
import {UserInput} from './model/user-input';
import {PolicyHolder} from './model/policy-holder';
import {PolicyHolderDB} from './model/policy-holder-database';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {

  userInput: UserInput;
  ph_db: PolicyHolderDB;

  constructor(private policyHolderGeneratorService: PolicyHolderGenerationService,
              private simulationService: SimulationService) {
  }

  ngOnInit() {
    this.userInput = new UserInput();
    this.startSimulation();
  }

  startSimulation() {
    this.renderPolicyHolders();
    // const period = this.simulationService.doPolicyPeriod(subgroups, null);
  }

  renderPolicyHolders() {
    const numPH = this.userInput.numPH;
    const avgSubGroupSize = this.userInput.avgGroupSize;
    const coverageUnits = this.userInput.tul / this.userInput.cuValue;
    const premiumMean = this.userInput.desiredPremiumMean / this.userInput.cuValue;
    const premiumStdev = this.userInput.desiredPremiumStdev / this.userInput.cuValue;
    const claimfreqmean = this.userInput.likelihoodOpenClaimMean;
    const claimStdev = this.userInput.likelihoodOpenClaimStdev / 100;
    const defectpercent = this.userInput.likelihoodToDefect;
    
    this.ph_db = this.policyHolderGeneratorService.generatePolicyHolders(numPH, avgSubGroupSize);
    this.policyHolderGeneratorService.setCoverageUnitsBought(this.ph_db, this.userInput.tul, this.userInput.cuValue)
    this.policyHolderGeneratorService.setDefect(this.ph_db, defectpercent);
    this.policyHolderGeneratorService.setClaim(this.ph_db, claimfreqmean, claimStdev, this.userInput.tul, this.userInput.cuValue, this.userInput.percentageOfTUL2Claims);
    this.policyHolderGeneratorService.setParticipation(this.ph_db);
    this.policyHolderGeneratorService.setPremiumVote(this.ph_db, premiumMean, premiumStdev)
  }
}
