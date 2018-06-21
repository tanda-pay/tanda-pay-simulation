import {Component, OnInit} from '@angular/core';
import {PolicyHolderGenerationService} from './service/policy-holder-generation.service';
import {SimulationService} from './service/simulation.service';
import {UserInput} from './model/user-input';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {

  userInput = new UserInput();

  constructor(private policyHolderGeneratorService: PolicyHolderGenerationService,
              private simulationService: SimulationService) {
  }

  ngOnInit() {
    this.startSimulation();
  }

  startSimulation() {
    const subgroups = this.policyHolderGeneratorService.generatePolicyholders(100, 50, 5.5, 1, 7, 100000, .05, .01, .03);
    const period = this.simulationService.doPolicyPeriod(subgroups, null);
    console.log(period);
  }
}
