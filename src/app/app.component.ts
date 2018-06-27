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
  phDB: PolicyHolderDB;

  constructor(private policyHolderGeneratorService: PolicyHolderGenerationService,
              private simulationService: SimulationService) {
  }

  ngOnInit() {
    this.userInput = new UserInput();
    this.updateInput();
    this.renderPolicyHolders();
  }

  updateInput() {
    this.userInput.calculateDerivedValues()
    // const period = this.simulationService.doPolicyPeriod(subgroups, null);
  }

  renderPolicyHolders() {
    this.phDB = this.policyHolderGeneratorService.userInputToDB(this.userInput);
  }
}
