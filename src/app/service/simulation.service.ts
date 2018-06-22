import {Injectable} from '@angular/core';
import {Period} from '../model/period';
import {PolicyHolder} from '../model/policy-holder';
import {UtilService} from './util.service';
import {SubGroup} from '../model/sub-group';
import {SubGroupStuff} from '../model/sub-group-stuff';
import {PolicyHolderStuff} from '../model/policy-holder-stuff';

declare var jStat: any;

@Injectable()
export class SimulationService {

  constructor(private utilService: UtilService) {
  }

  simulateNextPolicyPeriod(subGroups: SubGroup[], periods: Period[]): Period {
    const nextPeriod = new Period();
    nextPeriod.subGroupStuffs = this.initializeSubGroupStuff(subGroups);

    this.simulateDefectSubGroups(subGroups, periods, nextPeriod);
    // TODO other methods

    return nextPeriod;
  }

  initializeSubGroupStuff(subGroups: SubGroup[]): SubGroupStuff[] {
    // copy same structure
    return null;
  }

  simulateDefectSubGroups(subGroups: SubGroup[], periods: Period[], nextPeriod: Period) {
    let curSubGroup: SubGroup;
    let curPolicyHolder: PolicyHolder;
    let curSubGroupStuff: SubGroupStuff;
    let curPolicyHolderStuff: PolicyHolderStuff;

    for (let i = 0; i < subGroups.length; i++) {
      curSubGroup = subGroups[i];
      curSubGroupStuff = nextPeriod.subGroupStuffs[i];

      for (let j = 0; j < curSubGroup.policyHolders.length; j++) {
        curPolicyHolder = curSubGroup.policyHolders[j];
        curPolicyHolderStuff = curSubGroupStuff.policyHolderStuffs[j];

        const choseToDefect = this.simulateDefectPolicyHolder(curPolicyHolder, periods);
      }

      // do post logic
    }
  }

  simulateDefectPolicyHolder(policyHolder: PolicyHolder, periods: Period[]): boolean {
    return false;
  }

  // TODO add other methods
}
