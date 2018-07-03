import {Component, EventEmitter, Input, Output} from '@angular/core';
import {FormControl} from '@angular/forms';
import {SimulationDatabase} from '../../model/simulation-database';

/**
 * @title Tag group with dynamically changing tabs
 */
@Component({
  selector: 'app-simulation-viewer',
  templateUrl: 'simulation-viewer-component.html',
  styleUrls: ['simulation-viewer-component.css'],
})
export class SimulationViewerComponent {
  @Input() simulations: SimulationDatabase[];
  tabs = ['First', 'Second', 'Third'];
  selected = new FormControl(0);
  tabSelections = [];
  arrHideSimulations = [];

  addTab(selectAfterAdding: boolean) {
    this.tabs.push('New');

    if (selectAfterAdding) {
      this.selected.setValue(this.tabs.length - 1);
    }
  }

  removeTab(index: number) {
    this.tabs.splice(index, 1);
  }
}
