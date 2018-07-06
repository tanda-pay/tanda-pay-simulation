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
  tabSelections = [];
}
