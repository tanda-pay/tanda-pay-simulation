import {PolicyHolder} from './policy-holder';

export class SubGroup {
  static numSubGroup = 0;

  id: number;
  policyHolders: PolicyHolder[];

  constructor(policyHolders: PolicyHolder[]) {
    this.id = SubGroup.numSubGroup;
    SubGroup.numSubGroup++;

    this.policyHolders = policyHolders;
  }
}
