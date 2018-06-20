import { Injectable } from '@angular/core';
import {Period} from '../model/period';
import {PolicyHolder} from '../model/policy-holder';
import {UtilService} from './util.service';

declare var jStat: any;

@Injectable()
export class SimulationService {

  constructor(private utilService: UtilService) { }

  doPolicyPeriod(subgroups: PolicyHolder[][], prevPeriod: Period) {
    const curPeriod = new Period(subgroups, prevPeriod);

    // Step 1: Secretary determines premium by taking an average of all policyholders' votes
    let arrPremiums = [];
    for (let i = 0; i < curPeriod.subgroups.length; i++) {
      const currentGroupSize = curPeriod.subgroups[i].length;
      for (let j = 0; j < currentGroupSize; j++) {
        arrPremiums.push(curPeriod.subgroups[i][j].choosePremium(curPeriod));
      }
    }
    arrPremiums.sort(function(a, b) { return a - b; });
    arrPremiums = arrPremiums.slice(Math.floor(arrPremiums.length * .1), Math.floor(arrPremiums.length * .9));
    const premiumMean = jStat.mean(arrPremiums);
    const premiumMedian = jStat.median(arrPremiums);
    const arrPremiumAverages = [premiumMean, premiumMedian, (premiumMean + premiumMedian) * .55];
    curPeriod.chosenPremium = arrPremiumAverages[Math.floor(Math.random() * 3)];
    if (curPeriod.prevPeriod !== null && curPeriod.prevPeriod.claimPayoutRatio < 1) {
      curPeriod.chosenPremium *= 1.1;
    }

    // Step 2: Offer chosen premium, accept premium commitments, and note participants who opt-out
    const arrSubgroupCollectedPremiums = [];
    for (let i = 0; i < curPeriod.subgroups.length; i++) {
      const iterSubgroupPremiums = [];
      const iterGroupSize = curPeriod.subgroups[i].length;
      for (let j = 0; j < iterGroupSize; j++) {
        if (curPeriod.subgroups[i][j].chooseParticipation(curPeriod) && !(this.hasPolicyholderDefectedBefore(i, j, prevPeriod))) {
          const payment = curPeriod.subgroups[i][j].coverage * curPeriod.chosenPremium;
          iterSubgroupPremiums.push(payment);
        } else {
          iterSubgroupPremiums.push(0);
        }
      }
      arrSubgroupCollectedPremiums.push(iterSubgroupPremiums);
    }
    curPeriod.committedPremiums = arrSubgroupCollectedPremiums;

    // Step 3: Commit overpayments
    const arrSubgroupOverpayments = [];
    for (let i = 0; i < curPeriod.subgroups.length; i++) {
      const iterSubgroupOverpayments = [];
      const iterGroupSize = curPeriod.subgroups[i].length;
      let participantCount = 0;
      for (let j = 0; j < iterGroupSize; j++) {
        if (curPeriod.committedPremiums[i][j] !== 0) {
          participantCount++;
        }
      }
      for (let j = 0; j < iterGroupSize; j++) {
        if (participantCount < 2) {
          iterSubgroupOverpayments.push(0);
        } else {
          iterSubgroupOverpayments.push(curPeriod.committedPremiums[i][j] * (1 / (participantCount - 1)));
        }
      }
      arrSubgroupOverpayments.push(iterSubgroupOverpayments);
    }
    curPeriod.committedOverpayments = arrSubgroupOverpayments;

    // Step 4: Aggregate claims of participating policyholders during the policy period.ts
    const arrSubgroupClaims = [];
    for (let i = 0; i < curPeriod.subgroups.length; i++) {
      const currentGroupSize = curPeriod.subgroups[i].length;
      const iterSubgroupClaims = [];
      for (let j = 0; j < currentGroupSize; j++) {
        if (curPeriod.committedPremiums[i][j] !== 0) {
          iterSubgroupClaims.push(curPeriod.subgroups[i][j].chooseClaim(this));
        } else {
          iterSubgroupClaims.push(0);
        }
      }
      arrSubgroupClaims.push(iterSubgroupClaims);
    }
    curPeriod.claims = arrSubgroupClaims;
    curPeriod.totalOutstandingLiability = jStat.sum(this.utilService.flatten(curPeriod.claims));

    // Step 5: Determine loyalists and defectors
    const arrSubgroupDefectorStatus = [];
    for (let i = 0; i < curPeriod.subgroups.length; i++) {
      const currentGroupSize = curPeriod.subgroups[i].length;
      const iterSubgroupDefectorStatus = [];
      for (let j = 0; j < currentGroupSize; j++) {
        if (curPeriod.committedPremiums[i][j] > 0) {
          iterSubgroupDefectorStatus.push(curPeriod.subgroups[i][j].chooseDefect(this));
        } else {
          iterSubgroupDefectorStatus.push(false);
        }
      }
      arrSubgroupDefectorStatus.push(iterSubgroupDefectorStatus);
    }
    curPeriod.defectorStatuses = arrSubgroupDefectorStatus;

    // Step 6: All policyholders have made the choices they can make within a policy period.ts, the only thing left is to crunch numbers

    // Figure out the claim payout ratio, defined as the ratio of a claim's value to its payout
    // We take the overpayment and premium money of the loyalists who are in a subgroup with at least one defector
    // We even throw out claims of loyalists who are in a subgroup with more than one defector
    for (let i = 0; i < curPeriod.subgroups.length; i++) {
      let subgroupDefectorCount = 0;
      curPeriod.overpaymentReturns.push([]);
      for (let j = 0; j < curPeriod.subgroups[i].length; j++) {
        curPeriod.overpaymentReturns[i].push(0);
        if (curPeriod.defectorStatuses[i][j]) {
          subgroupDefectorCount++;
        }
      }

      for (let j = 0; j < curPeriod.subgroups[i].length; j++) {
        if (!curPeriod.defectorStatuses[i][j] && curPeriod.committedPremiums[i][j] > 0) {
          curPeriod.totalPremiumPayments += curPeriod.committedPremiums[i][j];
          if (subgroupDefectorCount > 0) {
            curPeriod.totalPremiumPayments += curPeriod.committedOverpayments[i][j];
          } else {
            curPeriod.overpaymentReturns[i][j] += curPeriod.committedOverpayments[i][j];
          }

          if (subgroupDefectorCount < 2) {
            if (curPeriod.claims[i][j] > 0) {
              curPeriod.totalEligibleClaims += curPeriod.claims[i][j];
            } else {
              curPeriod.totalRebateCoverageUnits += curPeriod.subgroups[i][j].coverage;
            }
          }
        }
      }
    }

    curPeriod.claimPayoutRatio = curPeriod.totalEligibleClaims > 0 ? curPeriod.totalPremiumPayments / curPeriod.totalEligibleClaims : 1;

    curPeriod.rebateRatio = 0;
    if (curPeriod.claimPayoutRatio >= 1) {
      curPeriod.claimPayoutRatio = 1;
      curPeriod.rebateRatio = (curPeriod.totalPremiumPayments - curPeriod.totalEligibleClaims) / curPeriod.totalRebateCoverageUnits;
    }

    // Use the rebate/claimpayout ratio to calculate the money that is given back to the policyholders
    curPeriod.rebates = [];
    curPeriod.claimPayouts = [];
    for (let i = 0; i < curPeriod.subgroups.length; i++) {
      let subgroupDefectorCount = 0;
      const iterSubgroupPayouts = [];
      const iterSubgroupRebates = [];
      for (let j = 0; j < curPeriod.subgroups[i].length; j++) {
        iterSubgroupPayouts.push(0);
        iterSubgroupRebates.push(0);
        if (curPeriod.defectorStatuses[i][j]) {
          subgroupDefectorCount++;
        }
      }
      curPeriod.rebates.push(iterSubgroupRebates);
      curPeriod.claimPayouts.push(iterSubgroupPayouts);
      for (let j = 0; j < curPeriod.subgroups[i].length; j++) {
        if (!curPeriod.defectorStatuses[i][j] && curPeriod.committedPremiums[i][j] > 0) {
          // if (subgroupDefectorCount == 0) {
          //   this.rebates[i][j] += this.committedOverpayments[i][j]
          // }
          if (subgroupDefectorCount < 2) {
            if (curPeriod.claims[i][j] === 0) { // Only give rebate to non-claimants. Not sure if this is a good aspect of the protocol
              curPeriod.rebates[i][j] += curPeriod.subgroups[i][j].coverage * curPeriod.rebateRatio;
            }
            curPeriod.claimPayouts[i][j] += curPeriod.claims[i][j] * curPeriod.claimPayoutRatio;
          }
        }
      }
    }

    // Step 6:

    // var arrSubgroupClaims = []
    // for (var j = 0; j < arrPolicyholders.length; j++) {
    //   let currentGroupSize = arrPolicyholders[j].length
    //   let subgroupClaims = []
    //   for (var k = 0; k < currentGroupSize; j++) {
    //     subgroupClaims.push(this.subgroups[j][k].chooseClaim())
    //   }
    //   arrSubgroupClaims.push(subgroupClaims)
    // }
    // var curPeriod
    // if (i == 0) {
    //   curPeriod = new PeriodRecord(null, premium, arrPolicyholders, arrSubgroupClaims)
    // } else {
    //   curPeriod = new PeriodRecord(arrPeriods[i-1], premium, arrPolicyholders, arrSubgroupClaims)
    // }
    // arrPeriods.push(curPeriod)
  }

  // This has the problem of slowing down as iterations go up.
  // Can solve by memoization
  hasPolicyholderDefectedBefore(subgroup_index, member_index, prevPeriod: Period) {
    let iterPeriod = prevPeriod;
    while (iterPeriod !== null) {
      if (iterPeriod.defectorStatuses[subgroup_index][member_index]) {
        return true;
      }
      iterPeriod = iterPeriod.prevPeriod;
    }
    return false;
  }

  calculateEffectivePremiumsPerPeriod(periods: Period[]) {
    const aggregateCosts = [];
    const aggregateParticipations = [];
    const effectivePremiumsPerPeriod = [];
    for (let i = 0; i < periods[0].subgroups.length; i++) {
      const iterSubgroupCosts = [];
      const iterSubgroupParticipations = [];
      const iterSubgroupEffectivePremiums = [];
      for (let j = 0; j < periods[0].subgroups[i].length; j++) {
        iterSubgroupCosts.push(0);
        iterSubgroupParticipations.push(0);
        iterSubgroupEffectivePremiums.push(0);
      }
      aggregateCosts.push(iterSubgroupCosts);
      aggregateParticipations.push(iterSubgroupParticipations);
      effectivePremiumsPerPeriod.push(iterSubgroupEffectivePremiums);
    }

    for (let i = 0; i < periods.length; i++) {
      for (let j = 0; j < periods[i].subgroups.length; j++) {
        for (let k = 0; k < periods[i].subgroups[j].length; k++) {
          if (periods[i].committedPremiums[j][k] > 0 && !periods[i].defectorStatuses[j][k]) {
            aggregateCosts[j][k] += periods[i].committedPremiums[j][k];
            aggregateCosts[j][k] += periods[i].committedOverpayments[j][k];
            aggregateCosts[j][k] -= periods[i].rebates[j][k];
            aggregateCosts[j][k] -= periods[i].overpaymentReturns[j][k];
            aggregateParticipations[j][k] += 1;
          }
        }
      }
    }

    for (let i = 0; i < aggregateCosts.length; i++) {
      for (let j = 0; j < aggregateCosts[i].length; j++) {
        effectivePremiumsPerPeriod[i][j] = aggregateCosts[i][j] / aggregateParticipations[i][j];

        if (isNaN(effectivePremiumsPerPeriod[i][j])) {
          effectivePremiumsPerPeriod[i][j] = 0;
        }
      }
    }

    return effectivePremiumsPerPeriod;
  }
}
