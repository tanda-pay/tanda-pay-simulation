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
  @Input() simulations: TandapayState[];
  @Input() unitySimulations: UnityState[];
  tabSelections = [];
  unityDayTabSelections = [];
}
