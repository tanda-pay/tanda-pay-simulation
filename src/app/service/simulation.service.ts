import {Injectable} from '@angular/core';
import {Period} from '../model/period';
import {PolicyHolder} from '../model/policy-holder';
import {SimulationDatabase} from '../model/simulation-database';

import {ClaimType} from '../model/enum/ClaimType';
import {CoverageType} from '../model/enum/CoverageType';
import {DefectType} from '../model/enum/DefectType';
import {ParticipationType} from '../model/enum/ParticipationType';
import {PremiumVoteType} from '../model/enum/PremiumVoteType';

declare var jStat: any;
declare var randomWeightedSampleNoReplacement: any;

@Injectable()
export class SimulationService {

  constructor() {
  }

  simulateNextPolicyPeriod(db: SimulationDatabase) {
    const nextPeriod = new Period();
    db.periods.push(nextPeriod);
    const periodIndex = db.numCompletedPeriods;
    let ph_arr = db.policyHolders;
    if (periodIndex !== 0) {
      ph_arr = db.periods[periodIndex - 1].loyalists;
    }
    const ph_subgroups_arr = db.policyHolderSubgroups;
    db.premiumVoteHistory[periodIndex] = Array(db.policyHolders.length).fill(0);
    db.purchasedCoverageHistory[periodIndex] = Array(db.policyHolders.length).fill(0);
    db.premiumCommittedHistory[periodIndex] = Array(db.policyHolders.length).fill(0);
    db.overpaymentCommittedHistory[periodIndex] = Array(db.policyHolders.length).fill(0);
    db.claimSubmittedHistory[periodIndex] = Array(db.policyHolders.length).fill(0);
    db.defectHistory[periodIndex] = Array(db.policyHolders.length).fill(false);
    db.rebateReceivedHistory[periodIndex] = Array(db.policyHolders.length).fill(0);
    db.overpaymentReturnedHistory[periodIndex] = Array(db.policyHolders.length).fill(0);
    db.claimAwardHistory[periodIndex] = Array(db.policyHolders.length).fill(0);

    // Step 1: Secretary determines premium by taking an average of all policyholders' votes
    let arrPremiums = [];

    for (const ph of ph_arr) {
      const premiumVote = this.simulateDecision_PremiumVote(ph);
      db.premiumVoteHistory[periodIndex][ph.id] = premiumVote;
      arrPremiums[ph.id] = premiumVote;
    }
    arrPremiums.sort(function (a, b) { return a - b; });
    arrPremiums = arrPremiums.slice(Math.floor(arrPremiums.length * .1), Math.floor(arrPremiums.length * .9));
    const premiumMean = jStat.mean(arrPremiums);  // TODO: Fix bug where non-participants mess up calculations of average
    const premiumMedian = jStat.median(arrPremiums);
    const arrPremiumAverages = [premiumMean, premiumMedian, (premiumMean + premiumMedian) * .55];
    let chosenPremium = arrPremiumAverages[Math.floor(Math.random() * 3)];
    if (periodIndex !== 0 && db.periods[periodIndex - 1].claimPaymentRatio < 1) {
      chosenPremium *= 1.1;
    }
    nextPeriod.chosenPremium = chosenPremium;

    // Step 2: Offer chosen premium, accept premium commitments, and note participants who opt-out
    // var arrCollectedPremiums = [];
    for (const ph of ph_arr) {
      if (this.simulateDecision_Participation(ph)) {
        const purchasedCoverage = this.simulateDecision_CoveragePurchase(ph);
        db.purchasedCoverageHistory[periodIndex][ph.id] = purchasedCoverage;
        db.premiumCommittedHistory[periodIndex][ph.id] = purchasedCoverage * chosenPremium;
        nextPeriod.totalCoverageUnits += purchasedCoverage;
        nextPeriod.totalPremiumPayment += purchasedCoverage * chosenPremium;
      } else {
        db.purchasedCoverageHistory[periodIndex][ph.id] = 0;
      }
    }

    // Step 3: Commit overpayments
    for (const iter_ph_arr of ph_subgroups_arr) {
      let participantCount = 0;
      for (const ph of iter_ph_arr) {
        if (db.purchasedCoverageHistory[periodIndex][ph.id] > 0) {
          participantCount++;
        }
      }
      for (const ph of iter_ph_arr) {
        if (db.purchasedCoverageHistory[periodIndex][ph.id] > 0) {
          const overpayment = db.purchasedCoverageHistory[periodIndex][ph.id] * (1 / (participantCount - 1)) * nextPeriod.chosenPremium;
          nextPeriod.totalOverpayments += overpayment;
          db.overpaymentCommittedHistory[periodIndex][ph.id] = overpayment * db.premiumCommittedHistory[periodIndex][ph.id];
        }
      }
    }

    // Step 4: Aggregate claims of participating policyholders during the policy period
    // To faithfully match user input, we use an awful hack here that messes with the policyholder's decisionmaking
    const zScore = jStat.normal.sample(0, 1);
    const predestinedClaimantCount = Math.round((db.mean_ClaimantProportion + (zScore * db.stdev_ClaimantProportion)) * ph_arr.length);
    const weightMap = {};
    for (const ph of ph_arr) {
      weightMap[ph.id] = ph.claimValue[0];
    }
    const predestinedClaimants = randomWeightedSampleNoReplacement(weightMap, predestinedClaimantCount);
    let chosenClaimantsCoverage = 0;
    for (const ph_id of predestinedClaimants) {
      chosenClaimantsCoverage += db.purchasedCoverageHistory[periodIndex][parseInt(ph_id, 10)];
    }
    const predestinedValueOfAllClaims = (db.mean_Claims2TUL + (zScore * db.stdev_Claims2TUL)) * nextPeriod.totalCoverageUnits;
    for (const ph of ph_arr) {
      ph.claimType = ClaimType.LikelihoodAndClaimAmountButPredestination;
      if (predestinedClaimants.indexOf(ph.id.toString()) < 0) {
        ph.claimValue[2] = 0;
      } else {
        const coverageBought = db.purchasedCoverageHistory[periodIndex][ph.id];
        ph.claimValue[2] = Math.min((coverageBought / chosenClaimantsCoverage * predestinedValueOfAllClaims) / coverageBought, 1);
      }
    }
    for (const ph of ph_arr) {
      const ph_cu = db.purchasedCoverageHistory[periodIndex][ph.id];
      if (ph_cu > 0) {
        const claimValue = this.simulateDecision_SubmitClaim(ph) * ph_cu;
        db.claimSubmittedHistory[periodIndex][ph.id] = claimValue;
        if (claimValue > 0) {
          nextPeriod.tol += claimValue;
          nextPeriod.claimantCount++;
        }
      } else {
        db.claimSubmittedHistory[periodIndex][ph.id] = 0;
      }
    }

    // Step 5: Determine loyalists and defectors
    for (const ph of ph_arr) {
      const ph_cu = db.purchasedCoverageHistory[periodIndex][ph.id];
      if (ph_cu > 0) {
        const defectChosen = this.simulateDecision_Defect(ph, db);
        if (defectChosen) {
          nextPeriod.numDefectors++;
        } else {
          nextPeriod.loyalistCoverageUnits += ph_cu;
          nextPeriod.loyalists.push(ph);
        }
        db.defectHistory[periodIndex][ph.id] = defectChosen;
      } else {
        db.defectHistory[periodIndex][ph.id] = false;
      }
    }

    nextPeriod.totalPremiumsAfterDefect = jStat.sum(db.premiumCommittedHistory[periodIndex]);
    // Subtract premiums paid by defectors
    for (const ph of ph_arr) {
      const defectChosen = (db.defectHistory[periodIndex][ph.id]);
      if (defectChosen) {
        nextPeriod.totalPremiumsAfterDefect -= db.premiumCommittedHistory[periodIndex][ph.id];
      }
    }
    // Add confiscated overpayments from loyalists in a subgroup with at least one defector
    for (const iter_ph_arr of ph_subgroups_arr) {
      let defectCount = 0;
      for (const ph of iter_ph_arr) {
        if (db.defectHistory[periodIndex][ph.id]) {
          defectCount++;
        }
        db.overpaymentReturnedHistory[periodIndex][ph.id] = db.overpaymentCommittedHistory[periodIndex][ph.id];
      }
      if (defectCount > 0) {
        for (const ph of iter_ph_arr) {
          if (!db.defectHistory[periodIndex][ph.id]) {
            nextPeriod.totalPremiumsAfterDefect += db.overpaymentCommittedHistory[periodIndex][ph.id];
            nextPeriod.confiscatedOverpayments += db.overpaymentCommittedHistory[periodIndex][ph.id];
            db.overpaymentReturnedHistory[periodIndex][ph.id] = 0;
          }
        }
      }
    }

    // Nullify claim values of (defectors) and (loyalists in a subgroup with at least two defectors)
    nextPeriod.totalEligibleClaims = nextPeriod.tol;
    for (const iter_ph_arr of ph_subgroups_arr) {
      let defectCount = 0;
      for (const ph of iter_ph_arr) {
        if (db.defectHistory[periodIndex][ph.id]) {
          defectCount++;
          nextPeriod.totalEligibleClaims -= db.claimSubmittedHistory[periodIndex][ph.id];
          nextPeriod.claimantCount--;
        }
      }
      if (defectCount > 1) {
        for (const ph of iter_ph_arr) {
          if (!db.defectHistory[periodIndex][ph.id]) {
            nextPeriod.totalEligibleClaims -= db.claimSubmittedHistory[periodIndex][ph.id];
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
        if (db.defectHistory[periodIndex][ph.id]) {
          defectCount++;
        } else {
          db.claimAwardHistory[periodIndex][ph.id] = db.claimSubmittedHistory[periodIndex][ph.id] * nextPeriod.claimPaymentRatio;
        }
      }
      if (defectCount > 1) {
        for (const ph of iter_ph_arr) {
          db.claimAwardHistory[periodIndex][ph.id] = 0;
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
          if (db.defectHistory[periodIndex][ph.id]) {
            defectCount++;
          }
        }
        if (defectCount < 2) {
          for (const ph of iter_ph_arr) {
            if (!db.defectHistory[periodIndex][ph.id] && db.claimSubmittedHistory[periodIndex][ph.id] === 0) {
              nextPeriod.totalRebateCoverageUnits += db.purchasedCoverageHistory[periodIndex][ph.id];
            }
          }
        }
      }
      nextPeriod.rebateRatio = (nextPeriod.totalRebates) / nextPeriod.totalRebateCoverageUnits;
      // Return the rebates to eligible policyholders
      for (const iter_ph_arr of ph_subgroups_arr) {
        let defectCount = 0;
        for (const ph of iter_ph_arr) {
          if (db.defectHistory[periodIndex][ph.id]) {
            defectCount++;
          }
        }
        if (defectCount < 2) {
          for (const ph of iter_ph_arr) {
            if (!db.defectHistory[periodIndex][ph.id] && db.claimSubmittedHistory[periodIndex][ph.id] === 0) {
              db.rebateReceivedHistory[periodIndex][ph.id] = db.purchasedCoverageHistory[periodIndex][ph.id] * nextPeriod.rebateRatio;
            }
          }
        }
      }
    }
    nextPeriod.effectivePremium = (nextPeriod.totalPremiumPayment - nextPeriod.totalRebates) / nextPeriod.loyalistCoverageUnits;
    nextPeriod.effectiveCost = (nextPeriod.totalPremiumPayment + nextPeriod.confiscatedOverpayments - nextPeriod.totalRebates) / (ph_arr.length - nextPeriod.numDefectors);
    nextPeriod.averageClaimPayment = nextPeriod.claimantCount === 0 ? -1 : (nextPeriod.totalEligibleClaims * nextPeriod.claimPaymentRatio / nextPeriod.claimantCount);
    db.numCompletedPeriods++;
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
    } else if (p.claimType === ClaimType.LikelihoodAndClaimAmountButPredestination) {
      return p.claimValue[2];
    } else if (p.claimType === ClaimType.Eval) {
      return eval(p.claimValue);
    }
    return 0;
  }

  simulateDecision_Defect(p: PolicyHolder, db: SimulationDatabase): boolean {
    if (p.defectType === DefectType.Random) {
      return Math.random() < p.defectValue;
    } else if (p.defectType === DefectType.Function) {
      return p.defectValue(db);
    }
    return false;
  }

  generateSimulationSummary(db: SimulationDatabase) {
    const periods = db.periods;
    let numClaims = 0;
    let numUnderpaidClaims = 0;
    for (const period of periods) {
      numClaims += period.claimantCount;
      if (period.claimPaymentRatio < 1) {
        numUnderpaidClaims += period.claimantCount;
      }
    }
    db.claimUnderpaidFrequency = numUnderpaidClaims / numClaims;
    let totalEligibleClaimsSum = 0;
    let claimAwardsSum = 0;
    for (const period of periods) {
      totalEligibleClaimsSum += period.totalEligibleClaims;
      claimAwardsSum += period.claimPaymentRatio * period.totalEligibleClaims;
    }
    db.claimAwardRatio = claimAwardsSum / totalEligibleClaimsSum;
    let totalElligibleUnderpaidClaimsSum = 0;
    let underpaidClaimAwardsSum = 0;
    for (const period of periods) {
      if (period.claimPaymentRatio < 1) {
        totalElligibleUnderpaidClaimsSum += period.totalEligibleClaims;
        underpaidClaimAwardsSum += period.claimPaymentRatio * period.totalEligibleClaims;
      }
    }
    if (totalElligibleUnderpaidClaimsSum > 0) {
      db.underpaidClaimAwardRatio = underpaidClaimAwardsSum / totalElligibleUnderpaidClaimsSum;
    } else {
     db.underpaidClaimAwardRatio = -1;
    }
    let effectivePremiumsSum = 0;
    for (const period of periods) {
      effectivePremiumsSum += period.effectiveCost;
    }
    db.effectivePremiumAvg = effectivePremiumsSum / periods.length * db.cuValue;
    let effectiveClaimsSum = 0;
    let numClaimants = 0;
    for (const period of periods) {
      effectiveClaimsSum += period.totalEligibleClaims * period.claimPaymentRatio;
      numClaimants += period.claimantCount;
    }
    db.effectiveClaimAvg = effectiveClaimsSum / numClaimants * db.cuValue;
  }

}
