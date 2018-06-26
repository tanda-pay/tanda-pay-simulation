import { ClaimType } from './enum/ClaimType';
import { CoverageType } from './enum/CoverageType';
import { DefectType } from './enum/DefectType';
import { ParticipationType } from './enum/ParticipationType';
import { PremiumVoteType } from './enum/PremiumVoteType';

export class PolicyHolder {
  static numPolicyHolder = 0;

  id: number;

  coverageType: CoverageType;
  coverageValue: any;

  defectType: DefectType;
  defectValue: any;

  claimType: ClaimType;
  claimValue: any;

  participationType: ParticipationType;
  participationValue: any;

  premiumVoteType: PremiumVoteType;
  premiumVoteValue: any;

  // coverageUnitsBought: number;

  constructor() {
    this.id = PolicyHolder.numPolicyHolder;
    PolicyHolder.numPolicyHolder++;

    //    this.defectType = defectType;
    //    this.defectValue = defectValue;
    //
    //    this.claimType = claimType;
    //    this.claimValue = claimValue;
    //
    //    this.participationType = participationType;
    //    this.participationValue = participationValue;
    //
    //    this.premiumVoteType = premiumVoteType;
    //    this.premiumVoteValue = premiumVoteValue;
    //
    //    this.coverageUnitsBought = coverageUnitsBought;
  }

  static reset() {
    PolicyHolder.numPolicyHolder = 0;
  }
}
