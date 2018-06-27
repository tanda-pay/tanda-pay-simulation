import { Injectable } from '@angular/core';
import { Period } from '../model/period';
import { PolicyHolder } from '../model/policy-holder';
import { PolicyHolderDB } from '../model/policy-holder-database';

import { ClaimType } from '../model/enum/ClaimType';
import { CoverageType } from '../model/enum/CoverageType';
import { DefectType } from '../model/enum/DefectType';
import { ParticipationType } from '../model/enum/ParticipationType';
import { PremiumVoteType } from '../model/enum/PremiumVoteType';

declare var jStat: any;

@Injectable()
export class SimulationService {

  constructor() {
  }

  simulateNextPolicyPeriod( ph_db: PolicyHolderDB, periods: Period[] ): Period {
    const nextPeriod = new Period();
    
    var ph_arr = ph_db.policyHolders;
    
    //Step 1: Secretary determines premium by taking an average of all policyholders' votes
    for (let ph of ph_arr) {
      this.simulateDecision_PremiumVote(ph)
    }
    
    //this.simulateDefectSubGroups( subGroups, periods, nextPeriod );
    // TODO other methods

    return nextPeriod;
  }

  simulateDecision_CoveragePurchase(p: PolicyHolder): number {
    if (p.coverageType === CoverageType.Constant) {
      return p.coverageValue
    } else if (p.coverageType === CoverageType.Eval) {
      return eval(p.coverageValue)
    }
    return 0
  }
  
  simulateDecision_PremiumVote(p: PolicyHolder): number {
    if (p.premiumVoteType === PremiumVoteType.Constant) {
      return p.premiumVoteValue
    } else if (p.premiumVoteType === PremiumVoteType.Eval) {
      return eval(p.premiumVoteValue)
    }
    return 0
  }
  
  simulateDecision_Participation(p: PolicyHolder): boolean {
    if (p.participationType === ParticipationType.Random) {
      return Math.random() < p.participationValue
    } else if (p.participationType === ParticipationType.Eval) {
      return eval(p.participationValue)
    }
    return true
  }
  
  simulateDecision_SubmitClaim(p: PolicyHolder): number {
    if (p.claimType === ClaimType.LikelihoodAndClaimAmount) {
      if (Math.random() < p.claimValue[0]) {
        return p.claimValue[1]
      } else {
        return 0
      }
    } else if (p.claimType === ClaimType.Eval) {
      return eval(p.claimValue)
    }
    return 0
  }
  
  simulateDecision_Defect(p: PolicyHolder): boolean {
    if (p.defectType === DefectType.Random) {
      return Math.random() < p.defectValue
    } else if (p.defectType === DefectType.Eval) {
      return eval(p.defectValue)
    }
    return false
  }

  simulateDefectSubGroups( subGroups: PolicyHolderDB, periods: Period[], nextPeriod: Period ) {
    //Maw comment: this should be low priority
    let curSubGroup: Number;
    let curPolicyHolder: PolicyHolder;

    //    for (let i = 0; i < subGroups.length; i++) {
    //      curSubGroup = subGroups[i];
    //      curSubGroupStuff = nextPeriod.subGroupStuffs[i];
    //
    //      for (let j = 0; j < curSubGroup.policyHolders.length; j++) {
    //        curPolicyHolder = curSubGroup.policyHolders[j];
    //        curPolicyHolderStuff = curSubGroupStuff.policyHolderStuffs[j];
    //
    //        const choseToDefect = this.simulateDefectPolicyHolder(curPolicyHolder, periods);
    //        // TODO maybe have also call simulateClaim... here? if so prob move all this into simulateNextPolicyPeriod()
    //      }

    // do post logic
    //}

    // do post logic
  }

  simulateDefectPolicyHolder( policyHolder: PolicyHolder, periods: Period[] ): boolean {
    return false;
  }

  // TODO add other methods
}
