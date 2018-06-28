import {Component, Input} from '@angular/core';
import {SimulationService} from '../../service/simulation.service';
import {Period} from '../../model/period';
import {PolicyHolderDB} from '../../model/policy-holder-database';
import {PolicyHolderGenerationService} from '../../service/policy-holder-generation.service';
import {UserInput} from '../../model/user-input';

@Component({
  selector: 'app-content',
  templateUrl: './content.component.html',
  styleUrls: ['./content.component.css'],
})
export class ContentComponent {
  @Input() phDB: PolicyHolderDB;
  @Input() userInput: UserInput;
  periods: Period[];
  iterations: number;
  summary: number[];

  constructor(
    private policyHolderGeneratorService: PolicyHolderGenerationService,
    private simulationService: SimulationService
  ) {
    this.iterations = 3;
  }

  runSimulation(): void {
    this.phDB = this.policyHolderGeneratorService.userInputToDB(this.userInput);
    this.periods = [];
    for (let i = 0; i < this.iterations; i++) {
      this.periods.push(this.simulationService.simulateNextPolicyPeriod(this.phDB, this.periods));
    }
    this.summary = this.simulationService.generateSimulationSummary(this.periods);
  }
}
