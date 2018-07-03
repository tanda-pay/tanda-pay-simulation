import {Component, Input} from '@angular/core';
import {SimulationService} from '../../service/simulation.service';
import {Period} from '../../model/period';
import {SimulationDatabase} from '../../model/simulation-database';
import {SimulationSetupService} from '../../service/simulation-setup-service';
import {UserInput} from '../../model/user-input';

@Component({
  selector: 'app-content',
  templateUrl: './content.component.html',
  styleUrls: ['./content.component.css'],
})
export class ContentComponent {
  // @Input() currentDB: SimulationDatabase;
  @Input() userInput: UserInput;
  simulations: SimulationDatabase[];
  iterations = 50;
  policyPeriodLength = 45;

  constructor(
    private simulationSetupService: SimulationSetupService,
    private simulationService: SimulationService
  ) {
    this.simulations = [];
  }

  runSimulation(): void {
    const currentDB = this.simulationSetupService.userInputToDB(this.userInput);
    currentDB.policyPeriodLength = this.policyPeriodLength;
    for (let i = 0; i < this.iterations; i++) {
      this.simulationService.simulateNextPolicyPeriod(currentDB);
    }
    this.simulationService.generateSimulationSummary(currentDB);
    this.simulations.push(currentDB);
  }
}
