import {Injectable} from '@angular/core';
import {Period} from '../model/period';
import {PolicyHolder} from '../model/policy-holder';
import {PolicyHolderDB} from '../model/policy-holder-database';

import {ClaimType} from '../model/enum/ClaimType';
import {CoverageType} from '../model/enum/CoverageType';
import {DefectType} from '../model/enum/DefectType';
import {ParticipationType} from '../model/enum/ParticipationType';
import {PremiumVoteType} from '../model/enum/PremiumVoteType';

declare var jStat: any;

@Injectable()
export class SimulationService {

  constructor() {
  }

  simulateNextPolicyPeriod(phDB: PolicyHolderDB, periods: Period[]): Period {
    const nextPeriod = new Period();
    const periodIndex = periods.length;

    const ph_arr = phDB.policyHolders;
    const ph_subgroups_arr = phDB.policyHolderSubgroups;
    phDB.premiumVoteHistory[periodIndex] = [];
    phDB.purchasedCoverageHistory[periodIndex] = [];
    phDB.premiumCommittedHistory[periodIndex] = [];
    phDB.overpaymentCommittedHistory[periodIndex] = [];
    phDB.claimSubmittedHistory[periodIndex] = [];
    phDB.defectHistory[periodIndex] = [];
    phDB.rebateReceivedHistory[periodIndex] = [];
    phDB.overpaymentReturnedHistory[periodIndex] = [];
    phDB.claimAwardHistory[periodIndex] = [];

    // Step 1: Secretary determines premium by taking an average of all policyholders' votes
    let arrPremiums = [];

    for (const ph of ph_arr) {
      const premiumVote = this.simulateDecision_PremiumVote(ph);
      phDB.premiumVoteHistory[periodIndex][ph.id] = premiumVote;
      arrPremiums[ph.id] = premiumVote;
    }
    arrPremiums.sort(function (a, b) { return a - b; });
    arrPremiums = arrPremiums.slice(Math.floor(arrPremiums.length * .1), Math.floor(arrPremiums.length * .9));
    const premiumMean = jStat.mean(arrPremiums);
    const premiumMedian = jStat.median(arrPremiums);
    const arrPremiumAverages = [premiumMean, premiumMedian, (premiumMean + premiumMedian) * .55];
    const chosenPremium = arrPremiumAverages[Math.floor(Math.random() * 3)];
//    if (periodIndex != 0 && phDB.chosenPremiumHistory[periodIndex-1] < 1) {
//      chosenPremium *= 1.1;
//    }
    phDB.chosenPremiumHistory[periodIndex] = chosenPremium;
    nextPeriod.chosenPremium = chosenPremium;

    // Step 2: Offer chosen premium, accept premium commitments, and note participants who opt-out
    // var arrCollectedPremiums = [];
    for (const ph of ph_arr) {
      if (this.simulateDecision_Participation(ph)) {
        const purchasedCoverage = this.simulateDecision_CoveragePurchase(ph);
        phDB.purchasedCoverageHistory[periodIndex][ph.id] = purchasedCoverage;
        phDB.premiumCommittedHistory[periodIndex][ph.id] = purchasedCoverage * chosenPremium;
        nextPeriod.totalCoverageUnits += purchasedCoverage;
        nextPeriod.totalPremiumPayment += purchasedCoverage * chosenPremium;
      } else {
        phDB.purchasedCoverageHistory[periodIndex][ph.id] = 0;
      }
    }

    // Step 3: Commit overpayments
    for (const iter_ph_arr of ph_subgroups_arr) {
      let participantCount = 0;
      for (const ph of iter_ph_arr) {
        if (phDB.purchasedCoverageHistory[periodIndex][ph.id] > 0) {
          participantCount++;
        }
      }
      for (const ph of iter_ph_arr) {
        if (phDB.purchasedCoverageHistory[periodIndex][ph.id] > 0) {
          const overpayment = phDB.purchasedCoverageHistory[periodIndex][ph.id] * (1 / (participantCount - 1)) * nextPeriod.chosenPremium;
          nextPeriod.totalOverpayments += overpayment;
          phDB.overpaymentCommittedHistory[periodIndex][ph.id] = overpayment * phDB.premiumCommittedHistory[periodIndex][ph.id];
        }
      }
    }

    // Step 4: Aggregate claims of participating policyholders during the policy period
    for (const ph of ph_arr) {
      const ph_cu = phDB.purchasedCoverageHistory[periodIndex][ph.id];
      if (ph_cu > 0) {
        const claimValue = this.simulateDecision_SubmitClaim(ph) * ph_cu;
        phDB.claimSubmittedHistory[periodIndex][ph.id] = claimValue;
        nextPeriod.tol += claimValue;
        nextPeriod.claimantCount++;
      } else {
        phDB.claimSubmittedHistory[periodIndex][ph.id] = 0;
      }
    }

    // Step 5: Determine loyalists and defectors
    for (const ph of ph_arr) {
      const ph_cu = phDB.purchasedCoverageHistory[periodIndex][ph.id];
      if (ph_cu > 0) {
        const defectChosen = this.simulateDecision_Defect(ph);
        if (defectChosen) {
          nextPeriod.numDefectors++;
        } else {
          nextPeriod.loyalistCoverageUnits += ph_cu;
        }
        phDB.defectHistory[periodIndex][ph.id] = defectChosen;
      } else {
        phDB.defectHistory[periodIndex][ph.id] = false;
      }
    }

    nextPeriod.totalPremiumsAfterDefect = jStat.sum(phDB.premiumCommittedHistory[periodIndex]);
    // Subtract premiums paid by defectors
    for (const ph of ph_arr) {
      const defectChosen = (phDB.defectHistory[periodIndex][ph.id]);
      if (defectChosen) {
        nextPeriod.totalPremiumsAfterDefect -= phDB.premiumCommittedHistory[periodIndex][ph.id];
      }
    }
    // Add confiscated overpayments from loyalists in a subgroup with at least one defector
    for (const iter_ph_arr of ph_subgroups_arr) {
      let defectCount = 0;
      for (const ph of iter_ph_arr) {
        if (phDB.defectHistory[periodIndex][ph.id]) {
          defectCount++;
        }
        phDB.overpaymentReturnedHistory[periodIndex][ph.id] = phDB.overpaymentCommittedHistory[periodIndex][ph.id];
      }
      if (defectCount > 0) {
        for (const ph of iter_ph_arr) {
          if (!phDB.defectHistory[periodIndex][ph.id]) {
            nextPeriod.totalPremiumsAfterDefect += phDB.overpaymentCommittedHistory[periodIndex][ph.id];
            nextPeriod.confiscatedOverpayments += phDB.overpaymentCommittedHistory[periodIndex][ph.id];
            phDB.overpaymentReturnedHistory[periodIndex][ph.id] = 0;
          }
        }
      }
    }

    // Nullify claim values of (defectors) and (loyalists in a subgroup with at least two defectors)
    nextPeriod.totalEligibleClaims = nextPeriod.tol;
    for (const iter_ph_arr of ph_subgroups_arr) {
      let defectCount = 0;
      for (const ph of iter_ph_arr) {
        if (phDB.defectHistory[periodIndex][ph.id]) {
          defectCount++;
          nextPeriod.totalEligibleClaims -= phDB.claimSubmittedHistory[periodIndex][ph.id];
        }
      }
      if (defectCount > 1) {
        for (const ph of iter_ph_arr) {
          if (!phDB.defectHistory[periodIndex][ph.id]) {
            nextPeriod.totalEligibleClaims -= phDB.claimSubmittedHistory[periodIndex][ph.id];
          }
        }
      }
    }
    nextPeriod.claimPaymentRatio = Math.min(nextPeriod.totalPremiumsAfterDefect / nextPeriod.totalEligibleClaims, 1);
    nextPeriod.totalRebates = Math.max(nextPeriod.totalPremiumsAfterDefect - nextPeriod.totalEligibleClaims, 0);
    // Award the Claims. In this code, all non-defectors are awarded their claims, and then the punished subgroups have their awards set to zero
    for (const iter_ph_arr of ph_subgroups_arr) {
      let defectCount = 0;
      for (const ph of iter_ph_arr) {
        if (phDB.defectHistory[periodIndex][ph.id]) {
          defectCount++;
        } else {
          phDB.claimAwardHistory[periodIndex][ph.id] = phDB.claimSubmittedHistory[periodIndex][ph.id] * nextPeriod.claimPaymentRatio;
        }
      }
      if (defectCount > 1) {
        for (const ph of iter_ph_arr) {
          phDB.claimAwardHistory[periodIndex][ph.id] = 0;
        }
      }
    }

    if (nextPeriod.totalRebates > 0) {
      // Only Policyholders with the following qualities are eligible for a rebate:
      // -Non-claimant
      // -Loyalist
      // -In a subgroup with fewer than 2 defectors
      nextPeriod.totalRebateCoverageUnits = 0;
      for (const iter_ph_arr of ph_subgroups_arr) {
        let defectCount = 0;
        for (const ph of iter_ph_arr) {
          if (phDB.defectHistory[periodIndex][ph.id]) {
            defectCount++;
          }
        }
        if (defectCount < 2) {
          for (const ph of iter_ph_arr) {
            if (!phDB.defectHistory[periodIndex][ph.id] && phDB.claimSubmittedHistory[periodIndex][ph.id] === 0) {
              nextPeriod.totalRebateCoverageUnits += phDB.purchasedCoverageHistory[periodIndex][ph.id];
            }
          }
        }
      }
      nextPeriod.rebateRatio = (nextPeriod.totalRebates) / nextPeriod.totalRebateCoverageUnits;
      // Return the rebates to eligible policyholders
      for (const iter_ph_arr of ph_subgroups_arr) {
        let defectCount = 0;
        for (const ph of iter_ph_arr) {
          if (phDB.defectHistory[periodIndex][ph.id]) {
            defectCount++;
          }
        }
        if (defectCount < 2) {
          for (const ph of iter_ph_arr) {
            if (!phDB.defectHistory[periodIndex][ph.id] && phDB.claimSubmittedHistory[periodIndex][ph.id] === 0) {
              phDB.rebateReceivedHistory[periodIndex][ph.id] = phDB.purchasedCoverageHistory[periodIndex][ph.id] * nextPeriod.rebateRatio;
            }
          }
        }
      }
    }
    nextPeriod.effectivePremium = (nextPeriod.totalPremiumPayment - nextPeriod.totalRebates) / nextPeriod.loyalistCoverageUnits;
    nextPeriod.effectiveCost = (nextPeriod.totalPremiumPayment - nextPeriod.confiscatedOverpayments - nextPeriod.totalRebates) / (ph_arr.length - nextPeriod.numDefectors);
    nextPeriod.averageClaimPayment = (nextPeriod.totalEligibleClaims / nextPeriod.claimantCount);
    return nextPeriod;
  }

  simulateDecision_CoveragePurchase(p: PolicyHolder): number {
    if (p.coverageType === CoverageType.Constant) {
      return p.coverageValue;
    } else if (p.coverageType === CoverageType.Eval) {
      return eval(p.coverageValue);
    }
    return 0;
  }

  simulateDecision_PremiumVote(p: PolicyHolder): number {
    if (p.premiumVoteType === PremiumVoteType.Constant) {
      return p.premiumVoteValue;
    } else if (p.premiumVoteType === PremiumVoteType.Eval) {
      return eval(p.premiumVoteValue);
    }
    return 0;
  }

  simulateDecision_Participation(p: PolicyHolder): boolean {
    if (p.participationType === ParticipationType.Random) {
      return Math.random() < p.participationValue;
    } else if (p.participationType === ParticipationType.Eval) {
      return eval(p.participationValue);
    }
    return true;
  }

  simulateDecision_SubmitClaim(p: PolicyHolder): number {
    if (p.claimType === ClaimType.LikelihoodAndClaimAmount) {
      if (Math.random() < p.claimValue[0]) {
        return p.claimValue[1];
      } else {
        return 0;
      }
    } else if (p.claimType === ClaimType.Eval) {
      return eval(p.claimValue);
    }
    return 0;
  }

  simulateDecision_Defect(p: PolicyHolder): boolean {
    if (p.defectType === DefectType.Random) {
      return Math.random() < p.defectValue;
    } else if (p.defectType === DefectType.Eval) {
      return eval(p.defectValue);
    }
    return false;
  }

  generateSimulationSummary(periods: Period[]) {
    let numClaims = 0;
    let numUnderpaidClaims = 0;
    for (const period of periods) {
      numClaims += period.claimantCount;
      if (period.claimPaymentRatio < 1) {
        numUnderpaidClaims += period.claimantCount;
      }
    }
    const claimUnderpaidFrequency = numUnderpaidClaims / numClaims;
    let totalEligibleClaimsSum = 0;
    let claimAwardsSum = 0;
    for (const period of periods) {
      totalEligibleClaimsSum += period.totalEligibleClaims;
      claimAwardsSum += period.claimPaymentRatio * period.totalEligibleClaims;
    }
    const claimAwardRatio = claimAwardsSum / totalEligibleClaimsSum;
    let totalElligibleUnderpaidClaimsSum = 0;
    let underpaidClaimAwardsSum = 0;
    for (const period of periods) {
      if (period.claimPaymentRatio < 1) {
        totalElligibleUnderpaidClaimsSum += period.totalEligibleClaims;
        underpaidClaimAwardsSum += period.claimPaymentRatio * period.totalEligibleClaims;
      }
    }
    const underpaidClaimAwardRatio = underpaidClaimAwardsSum / totalElligibleUnderpaidClaimsSum;
    let effectivePremiumAvg = 0;
    for (const period of periods) {
      effectivePremiumAvg += period.effectiveCost;
    }
    effectivePremiumAvg /= periods.length;
    let effectiveClaimAvg = 0;
    for (const period of periods) {
      effectiveClaimAvg += period.averageClaimPayment;
    }
    effectiveClaimAvg /= periods.length;
    return [claimUnderpaidFrequency, claimAwardRatio, underpaidClaimAwardRatio, effectivePremiumAvg, effectiveClaimAvg];
  }
}
