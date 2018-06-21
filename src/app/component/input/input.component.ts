import {Component, EventEmitter, Input, Output} from '@angular/core';
import {UserInput} from '../../model/user-input';

@Component({
  selector: 'app-input',
  templateUrl: './input.component.html',
  styleUrls: ['./input.component.css']
})
export class InputComponent {
  @Input() userInput: UserInput;
  @Output() userInputChanged = new EventEmitter<boolean>();
}
