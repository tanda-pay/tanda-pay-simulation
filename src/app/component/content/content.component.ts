import {Component} from '@angular/core';

@Component({
  selector: 'app-content',
  templateUrl: './content.component.html',
  styleUrls: ['./content.component.css']
})
export class ContentComponent {
  periods: number[];

  constructor() {
    this.periods = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  }
}
