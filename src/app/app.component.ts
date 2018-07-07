import {Component, OnInit} from '@angular/core';
import {SimulationSetupService} from './service/simulation.setup.service';
import {SimulationService} from './service/simulation.service';
import {UserInput} from './model/user-input';
import {UnitySimulationService} from './service/unity.simulation.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {

  userInput: UserInput;

  constructor(private simulationSetupService: SimulationSetupService,
              private simulationService: SimulationService,
              private unitySimulationService: UnitySimulationService) {
  }

  ngOnInit() {
    this.userInput = new UserInput();
    this.updateInput();
    // this.renderPolicyHolders();
  }

  updateInput() {
    // this.userInput.calculateDerivedValues();
    // const period = this.simulationService.doPolicyPeriod(subgroups, null);
  }
}
