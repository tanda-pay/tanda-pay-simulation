import {Injectable} from '@angular/core';
import {Period} from '../model/period';
import {PolicyHolder} from '../model/policy-holder';
import {UtilService} from './util.service';
import {SubGroup} from '../model/sub-group';

declare var jStat: any;

@Injectable()
export class SimulationService {

  constructor(private utilService: UtilService) {
  }

  simulateNextPolicyPeriod(subGroups: SubGroup[], periods: Period[]): Period {
    // call methods defined below
    return null;
  }

  methodSubGroup(subGroups: SubGroup[], periods: Period[]) {
    // foreach PolicyHolder choose whether they would defect
    // do your logic
  }

  methodPolicyHolder(policyHolder: PolicyHolder, periods: Period[]) {
  }

  // TODO add other methods
}
