import {Component, EventEmitter, Input, Output} from '@angular/core';
import {FormControl} from '@angular/forms';
import {TandapayState} from '../../model/tandapay-state';
import {UnityState} from '../../model/unity-state';

/**
 * @title Tag group with dynamically changing tabs
 */
@Component({
  selector: 'app-simulation-viewer',
  templateUrl: 'simulation-viewer-component.html',
  styleUrls: ['simulation-viewer-component.css'],
})
export class SimulationViewerComponent {
  @Input() tandapaySimulations: TandapayState[];
  @Input() unitySimulations: UnityState[];
  @Output() simulationTabChanged = new EventEmitter<number>();
  tabSelections = [];
  unityDayTabSelections = [];

  changeTab(sim_index: number, tabIndex: number) {
    this.tabSelections[sim_index] = tabIndex;
    this.simulationTabChanged.emit(tabIndex);
  }
}
