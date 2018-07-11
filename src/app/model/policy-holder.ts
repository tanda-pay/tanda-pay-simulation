import {ClaimType} from './enum/ClaimType';
import {CoverageType} from './enum/CoverageType';
import {DefectType} from './enum/DefectType';
import {ParticipationType} from './enum/ParticipationType';
import {PremiumVoteType} from './enum/PremiumVoteType';
import {DamageType} from './enum/DamageType';
import {RedemptionType} from './enum/RedemptionType';

export class PolicyHolder {
  static numPolicyHolder = 0;

  id: number;

  coverageType: CoverageType;
  coverageValue: any;

  defectType: DefectType;
  defectValue: any;

  damageType: DamageType;
  damageValue: any;

  claimType: ClaimType;
  claimValue: any;

  redemptionType: RedemptionType;
  redemptionValue: any;

  participationType: ParticipationType;
  participationValue: any;

  premiumVoteType: PremiumVoteType;
  premiumVoteValue: any;

  memory: any;

  // coverageUnitsBought: number;

  constructor() {
    this.id = PolicyHolder.numPolicyHolder;
    PolicyHolder.numPolicyHolder++;

    this.memory = {};

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
