import {Injectable} from '@angular/core';

import {PolicyHolder} from '../model/policy-holder';
import {TandapayState} from '../model/tandapay-state';

declare var jStat: any;
declare var randomWeightedSampleNoReplacement: any;

@Injectable()
export class TandapaySimulationService {

  policyholders: PolicyHolder[];
  state: TandapayState;

  constructor() {
  }

  generateSimulation(periodCount: number) {
    for (let i = 0; i < periodCount; i++) {
      this.simulateNewPeriod();
    }
  }

  simulateNewPeriod() {
    const nextPeriod = new Period();
    this.state.periods.push(nextPeriod);
    const arrPh = [];
    for (const ph of this.policyholders) {
      if (this.state.blacklistedPolicyholders.indexOf(ph.id) === -1) {
        arrPh.push(ph);
      }
    }

    this.state.premiumVoteHistory[this.state.currentPeriod] = Array(this.policyholders.length).fill(0);
    this.state.purchasedCoverageHistory[this.state.currentPeriod] = Array(this.policyholders.length).fill(0);
    this.state.premiumCommittedHistory[this.state.currentPeriod] = Array(this.policyholders.length).fill(0);
    this.state.overpaymentCommittedHistory[this.state.currentPeriod] = Array(this.policyholders.length).fill(0);
    this.state.claimSubmittedHistory[this.state.currentPeriod] = Array(this.policyholders.length).fill(0);
    this.state.defectHistory[this.state.currentPeriod] = Array(this.policyholders.length).fill(false);
    this.state.rebateReceivedHistory[this.state.currentPeriod] = Array(this.policyholders.length).fill(0);
    this.state.overpaymentReturnedHistory[this.state.currentPeriod] = Array(this.policyholders.length).fill(0);
    this.state.claimAwardHistory[this.state.currentPeriod] = Array(this.policyholders.length).fill(0);

    // Step 1: Secretary determines premium by taking an average of all policyholders' votes

    // A decision was made to simplify. The following features are commented out:
    // -Throwing out the highest and lowest deciles of premium votes
    // -Random selection from three types of vote-averages, one of which gave a 10% bump
    // -10% premium bump if we underpaid the previous period
    //
    // let arrPremiums = [];
    // for (const ph of arrPh) {
    //   const premiumVote = this.simulateDecision_PremiumVote(ph);
    //   this.state.premiumVoteHistory[this.state.currentPeriod][ph.id] = premiumVote;
    //   arrPremiums.push(premiumVote);
    // }
    // arrPremiums.sort(function (a, b) { return a - b; });
    // arrPremiums = arrPremiums.slice(Math.floor(arrPremiums.length * .1), Math.floor(arrPremiums.length * .9));
    // const premiumMean = jStat.mean(arrPremiums);
    // const premiumMedian = jStat.median(arrPremiums);
    // const arrPremiumAverages = [premiumMean, premiumMedian, (premiumMean + premiumMedian) * .55];
    // let chosenPremium = arrPremiumAverages[Math.floor(Math.random() * 3)];
    // if (this.state.currentPeriod !== 0 && this.state.periods[this.state.currentPeriod - 1].claimPaymentRatio < 1) {
    //   chosenPremium *= 1.1;
    // }
    // nextPeriod.chosenPremium = chosenPremium;
    const arrPremiums = [];
    for (const ph of arrPh) {
      const premiumVote = ph.choosePremiumVote();
      this.state.premiumVoteHistory[this.state.currentPeriod][ph.id] = premiumVote;
      arrPremiums.push(premiumVote);
    }
    const chosenPremium = jStat.mean(arrPremiums);
    nextPeriod.chosenPremium = chosenPremium;

    // Step 2: Offer chosen premium, accept premium commitments, and note participants who opt-out
    for (const ph of arrPh) {
      if (ph.chooseParticipation()) {
        const purchasedCoverage = ph.chooseCoverage();
        this.state.purchasedCoverageHistory[this.state.currentPeriod][ph.id] = purchasedCoverage;
        this.state.premiumCommittedHistory[this.state.currentPeriod][ph.id] = purchasedCoverage * chosenPremium;
        nextPeriod.totalCoverageUnits += purchasedCoverage;
        nextPeriod.totalPremiumPayment += purchasedCoverage * chosenPremium;
      } else {
        this.state.purchasedCoverageHistory[this.state.currentPeriod][ph.id] = 0;
      }
    }

    // Step 3: Commit overpayments
    for (const subgroup of this.state.subgroups) {
      let participantCount = 0;
      for (const phId of subgroup) {
        if (this.state.purchasedCoverageHistory[this.state.currentPeriod][phId] > 0) {
          participantCount++;
        }
      }
      for (const phId of subgroup) {
        if (this.state.purchasedCoverageHistory[this.state.currentPeriod][phId] > 0) {
          const overpayment = this.state.purchasedCoverageHistory[this.state.currentPeriod][phId] * (1 / (participantCount - 1)) * nextPeriod.chosenPremium;
          nextPeriod.totalOverpayments += overpayment;
          this.state.overpaymentCommittedHistory[this.state.currentPeriod][phId] = overpayment * this.state.premiumCommittedHistory[this.state.currentPeriod][phId];
        }
      }
    }

    // Step 4: Aggregate claims of participating policyholders during the policy period
    for (const ph of arrPh) {
      const ph_cu = this.state.purchasedCoverageHistory[this.state.currentPeriod][ph.id];
      if (ph_cu > 0) {
        let accumulatedDamages = 0;
        for (let d = 0; d < this.state.policyPeriodLength; d++) {
          this.state.currentDay = this.state.currentPeriod * this.state.policyPeriodLength + d;
          accumulatedDamages += ph.chooseDamageValue();
        }
        const claimValue = Math.min(accumulatedDamages, ph_cu);
        this.state.claimSubmittedHistory[this.state.currentPeriod][ph.id] = claimValue;
        if (claimValue > 0) {
          nextPeriod.tol += claimValue;
          nextPeriod.claimantCount++;
        }
      } else {
        this.state.claimSubmittedHistory[this.state.currentPeriod][ph.id] = 0;
      }
    }

    // Step 5: Determine loyalists and defectors
    for (const ph of arrPh) {
      const ph_cu = this.state.purchasedCoverageHistory[this.state.currentPeriod][ph.id];
      if (ph_cu > 0) {
        const defectChosen = ph.chooseDefect();
        if (defectChosen) {
          nextPeriod.numDefectors++;
          this.state.blacklistedPolicyholders.push(ph.id);
        } else {
          nextPeriod.loyalistCoverageUnits += ph_cu;
        }
        this.state.defectHistory[this.state.currentPeriod][ph.id] = defectChosen;
      } else {
        this.state.defectHistory[this.state.currentPeriod][ph.id] = false;
        this.state.blacklistedPolicyholders.push(ph.id);
      }
    }

    nextPeriod.totalPremiumsAfterDefect = jStat.sum(this.state.premiumCommittedHistory[this.state.currentPeriod]);
    // Subtract premiums paid by defectors
    for (const ph of arrPh) {
      const defectChosen = (this.state.defectHistory[this.state.currentPeriod][ph.id]);
      if (defectChosen) {
        nextPeriod.totalPremiumsAfterDefect -= this.state.premiumCommittedHistory[this.state.currentPeriod][ph.id];
      }
    }
    // Add confiscated overpayments from loyalists in a subgroup with at least one defector
    for (const subgroup of this.state.subgroups) {
      let defectCount = 0;
      for (const phId of subgroup) {
        if (this.state.defectHistory[this.state.currentPeriod][phId]) {
          defectCount++;
        }
        this.state.overpaymentReturnedHistory[this.state.currentPeriod][phId] = this.state.overpaymentCommittedHistory[this.state.currentPeriod][phId];
      }
      if (defectCount > 0) {
        for (const phId of subgroup) {
          if (!this.state.defectHistory[this.state.currentPeriod][phId]) {
            nextPeriod.totalPremiumsAfterDefect += this.state.overpaymentCommittedHistory[this.state.currentPeriod][phId];
            nextPeriod.confiscatedOverpayments += this.state.overpaymentCommittedHistory[this.state.currentPeriod][phId];
            this.state.overpaymentReturnedHistory[this.state.currentPeriod][phId] = 0;
          }
        }
      }
    }

    // Nullify claim values of (defectors) and (loyalists in a subgroup with at least two defectors)
    nextPeriod.totalEligibleClaims = nextPeriod.tol;
    for (const subgroup of this.state.subgroups) {
      let defectCount = 0;
      for (const phId of subgroup) {
        if (this.state.defectHistory[this.state.currentPeriod][phId]) {
          defectCount++;
          nextPeriod.totalEligibleClaims -= this.state.claimSubmittedHistory[this.state.currentPeriod][phId];
          nextPeriod.claimantCount--;
        }
      }
      if (defectCount > 1) {
        for (const phId of subgroup) {
          if (!this.state.defectHistory[this.state.currentPeriod][phId]) {
            nextPeriod.totalEligibleClaims -= this.state.claimSubmittedHistory[this.state.currentPeriod][phId];
          }
        }
      }
    }
    nextPeriod.claimPaymentRatio = Math.min(nextPeriod.totalPremiumsAfterDefect / nextPeriod.totalEligibleClaims, 1);
    if (nextPeriod.claimPaymentRatio > (1 - (1 / (2 * this.state.coverageUnitValue * this.state.coverageUnitValue * nextPeriod.totalPremiumsAfterDefect)))) {
      // If the claim payment ratio is close enough that the dollar values of premiums and claims appear equal, bump the ratio up to 1.
      nextPeriod.claimPaymentRatio = 1;
    }
    nextPeriod.totalRebates = Math.max(nextPeriod.totalPremiumsAfterDefect - nextPeriod.totalEligibleClaims, 0);
    // Award the Claims. In this code, all non-defectors are awarded their claims, and then the punished subgroups have their awards set to zero
    for (const subgroup of this.state.subgroups) {
      let defectCount = 0;
      for (const phId of subgroup) {
        if (this.state.defectHistory[this.state.currentPeriod][phId]) {
          defectCount++;
        } else {
          this.state.claimAwardHistory[this.state.currentPeriod][phId] = this.state.claimSubmittedHistory[this.state.currentPeriod][phId] * nextPeriod.claimPaymentRatio;
        }
      }
      if (defectCount > 1) {
        for (const phId of subgroup) {
          this.state.claimAwardHistory[this.state.currentPeriod][phId] = 0;
        }
      }
    }

    if (nextPeriod.totalRebates > 0) {
      // Only Policyholders with the following qualities are eligible for a rebate:
      // -Non-claimant
      // -Loyalist
      // -In a subgroup with fewer than 2 defectors
      nextPeriod.totalRebateCoverageUnits = 0;
      for (const subgroup of this.state.subgroups) {
        let defectCount = 0;
        for (const phId of subgroup) {
          if (this.state.defectHistory[this.state.currentPeriod][phId]) {
            defectCount++;
          }
        }
        if (defectCount < 2) {
          for (const phId of subgroup) {
            if (!this.state.defectHistory[this.state.currentPeriod][phId] && this.state.claimSubmittedHistory[this.state.currentPeriod][phId] === 0) {
              nextPeriod.totalRebateCoverageUnits += this.state.purchasedCoverageHistory[this.state.currentPeriod][phId];
            }
          }
        }
      }
      nextPeriod.rebateRatio = (nextPeriod.totalRebates) / nextPeriod.totalRebateCoverageUnits;
      // Return the rebates to eligible policyholders
      for (const subgroup of this.state.subgroups) {
        let defectCount = 0;
        for (const phId of subgroup) {
          if (this.state.defectHistory[this.state.currentPeriod][phId]) {
            defectCount++;
          }
        }
        if (defectCount < 2) {
          for (const phId of subgroup) {
            if (!this.state.defectHistory[this.state.currentPeriod][phId] && this.state.claimSubmittedHistory[this.state.currentPeriod][phId] === 0) {
              this.state.rebateReceivedHistory[this.state.currentPeriod][phId] = this.state.purchasedCoverageHistory[this.state.currentPeriod][phId] * nextPeriod.rebateRatio;
            }
          }
        }
      }
    }
    nextPeriod.effectivePremium = (nextPeriod.totalPremiumPayment - nextPeriod.totalRebates) / nextPeriod.loyalistCoverageUnits;
    nextPeriod.effectiveCost = (nextPeriod.totalPremiumPayment + nextPeriod.confiscatedOverpayments - nextPeriod.totalRebates) / (arrPh.length - nextPeriod.numDefectors);
    nextPeriod.averageClaimPayment = nextPeriod.claimantCount === 0 ? 0 : (nextPeriod.totalEligibleClaims * nextPeriod.claimPaymentRatio / nextPeriod.claimantCount);
    this.state.currentPeriod++;
  }

  generateSimulationSummary() {
    const periods = this.state.periods;
    let numClaims = 0;
    let numUnderpaidClaims = 0;
    for (const period of periods) {
      numClaims += period.claimantCount;
      if (period.claimPaymentRatio < 1) {
        numUnderpaidClaims += period.claimantCount;
      }
    }
    this.state.claimUnderpaidFrequency = numUnderpaidClaims / numClaims;
    let totalEligibleClaimsSum = 0;
    let claimAwardsSum = 0;
    for (const period of periods) {
      totalEligibleClaimsSum += period.totalEligibleClaims;
      claimAwardsSum += period.claimPaymentRatio * period.totalEligibleClaims;
    }
    this.state.totalEligibleClaimsSum = totalEligibleClaimsSum;
    this.state.claimAwardRatio = claimAwardsSum / totalEligibleClaimsSum;
    let totalElligibleUnderpaidClaimsSum = 0;
    let underpaidClaimAwardsSum = 0;
    for (const period of periods) {
      if (period.claimPaymentRatio < 1) {
        totalElligibleUnderpaidClaimsSum += period.totalEligibleClaims;
        underpaidClaimAwardsSum += period.claimPaymentRatio * period.totalEligibleClaims;
      }
    }
    if (totalElligibleUnderpaidClaimsSum > 0) {
      this.state.underpaidClaimAwardRatio = underpaidClaimAwardsSum / totalElligibleUnderpaidClaimsSum;
    } else {
     this.state.underpaidClaimAwardRatio = -1;
    }
    let effectivePremiumsSum = 0;
    for (const period of periods) {
      effectivePremiumsSum += period.effectiveCost;
    }
    this.state.effectivePremiumAvg = effectivePremiumsSum / periods.length * this.state.coverageUnitValue;
    let effectiveClaimsSum = 0;
    let numClaimants = 0;
    for (const period of periods) {
      effectiveClaimsSum += period.totalEligibleClaims * period.claimPaymentRatio;
      numClaimants += period.claimantCount;
    }
    this.state.effectiveClaimAvg = effectiveClaimsSum / numClaimants * this.state.coverageUnitValue;
  }

  wasGoalReached_AverageClaim(goal = .9): boolean {
    const periods = this.state.periods;
    let totalEligibleClaimsSum = 0;
    let claimAwardsSum = 0;
    for (const period of periods) {
      totalEligibleClaimsSum += period.totalEligibleClaims;
      claimAwardsSum += period.claimPaymentRatio * period.totalEligibleClaims;
    }
    return (claimAwardsSum / totalEligibleClaimsSum) >= goal;
  }

  wasGoalReached_NeverUnderpaySeverely(goal = .75): boolean {
    const periods = this.state.periods;
    for (const period of periods) {
      if (period.claimPaymentRatio < goal) {
        return false;
      }
    }
    return true;
  }

}

export class Period {
  chosenPremium: number;
  totalCoverageUnits: number;
  tol: number;
  claimantCount: number;
  totalPremiumPayment: number;
  totalOverpayments: number;
  confiscatedOverpayments: number;
  totalEligibleClaims: number;

  numDefectors: number;
  loyalistCoverageUnits: number;
  totalPremiumsAfterDefect: number;
  totalRebateCoverageUnits: number;
  rebateRatio: number;

  totalRebates: number;
  claimPaymentRatio: number;
  effectivePremium: number;
  effectiveCost: number;
  averageClaimPayment: number;

  constructor() {
    this.numDefectors = 0;
    this.loyalistCoverageUnits = 0;
    this.chosenPremium = null;

    this.totalCoverageUnits = null;
    this.tol = 0;
    this.claimantCount = 0;
    this.totalPremiumPayment = 0;
    this.totalOverpayments = 0;
    this.confiscatedOverpayments = 0;
    this.totalEligibleClaims = null;

    this.totalPremiumsAfterDefect = null;
    this.totalRebateCoverageUnits = null;
    this.rebateRatio = null;

    this.totalRebates = null;
    this.claimPaymentRatio = null;
    this.effectivePremium = null;
    this.effectiveCost = null;
    this.averageClaimPayment = null;
  }
}
