import {PolicyHolder} from './policy-holder';

export class Timeline {
  dayCount: number;
  arrClaimInfluncesByDay: number[];
  rngSeed: number;

  constructor() {
    this.dayCount = 90;
  }
}
