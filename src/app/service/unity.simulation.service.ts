import {Injectable} from '@angular/core';
import {Timeline} from '../model/timeline';
import {PolicyHolder} from '../model/policy-holder';

import {ClaimType} from '../model/enum/ClaimType';
import {CoverageType} from '../model/enum/CoverageType';
import {ParticipationType} from '../model/enum/ParticipationType';
import {UnityState} from '../model/unity-state';

declare var jStat: any;
declare var randomWeightedSampleNoReplacement: any;

@Injectable()
export class UnitySimulationService {

  policyHolders: PolicyHolder[];
  timeline: Timeline;
  state: UnityState;

  // currentDay = 0;
  // currentPeriod = 0;

  purchasedCoverageHistory: number[][] = [];
  paidPremiumsHistory: number[][] = [];
  claimableDamageHistory: number[][] = [];
  CATokenRedemptionHistory: number[][] = [];
  ethPayoutHistory: number[][] = [];

  constructor() {
  }

  generateSimulation() {
    for (let i = 0; i < this.timeline.dayCount; i++) {
      this.simulateNewDay();
    }
  }

  simulateNewDay() {
    // If the day marks a new policy period, policyholders buy coverage again.
    if (this.state.currentDay % this.state.daysPerPeriod === 0) {
      this.purchasedCoverageHistory.push([]);
      this.paidPremiumsHistory.push([]);

      this.state.arrDamagesPerPH = [];
      this.state.arrCoveragePerPH = [];

      // Step 1: Policyholders purchase policies with a certain amount of coverage
      for (const ph of this.policyHolders) {
        if (this.simulateDecision_Participation(ph)) {
          const num_cu = this.simulateDecision_CoveragePurchase(ph);
          this.purchasedCoverageHistory[this.state.currentPeriod][ph.id] = num_cu;
          this.paidPremiumsHistory[this.state.currentPeriod][ph.id] = num_cu * this.state.premium;
          this.issuePolicy(ph, num_cu);
        } else {
          this.purchasedCoverageHistory[this.state.currentPeriod][ph.id] = 0;
          this.paidPremiumsHistory[this.state.currentPeriod][ph.id] = 0;
        }
      }
      this.state.currentPeriod++;
    }
    this.claimableDamageHistory.push([]);
    this.CATokenRedemptionHistory.push([]);
    this.ethPayoutHistory.push([]);

    // Step 1: Policyholders have accidents/claim-worthy events
    for (const ph of this.policyHolders) {
      const damages = this.simulateDecision_ClaimValue(ph);
      this.claimableDamageHistory[this.state.currentDay][ph.id] = damages;
      this.state.arrDamagesPerPH[ph.id] += damages;
    }

    // Step 2: Policyholders can submit their claim for the month, nullifying the rest of their coverage
    // Step 3: Give Claim-Award Tokens to policyholders who submitted a claim, and update their daily CA redemption limit
    for (const ph of this.policyHolders) {
      const willSubmitClaim = this.simulateDecision_SubmitClaim(ph);
      if (willSubmitClaim) {
        const damages = Math.min(this.state.arrDamagesPerPH[ph.id], this.state.arrCoveragePerPH[ph.id]);
        this.state.arrCoveragePerPH[ph.id] = 0;
        this.state.arrCATokensPerPH[ph.id] += damages;
        this.state.numCA_MPC -= damages;
        this.state.arrRedemptionWindows[ph.id] = damages / this.state.redemptionWindowTiers[0];
      }
    }

    // Step 4: Check for "Catastrophic Event" condition, where there is not enough CA in the BXC to match all CA in policyholders' hands
    this.checkCatastrophe(this.state.bxc);

    // Step 5: Policyholders' claim award tokens are simultaneously converted into ETH through the BXC
    let totalCATokenRedemption = 0;
    for (const ph of this.policyHolders) {
      const numCA = Math.min(this.simulateDecision_RedeemCA(ph), this.state.arrCATokensPerPH[ph.id]);
      this.CATokenRedemptionHistory[this.state.currentDay][ph.id] = numCA;
      totalCATokenRedemption += numCA;
    }
    const totalEth = this.state.bxc.getEth(totalCATokenRedemption);
    for (const ph of this.policyHolders) {
      this.ethPayoutHistory[this.state.currentDay][ph.id] = totalEth * this.CATokenRedemptionHistory[this.state.currentDay][ph.id] / totalCATokenRedemption;
    }

    // Step 6: BXC gets ETH replenished from the premium escrow
    this.restoreBXC(this.state.bxc);

    this.state.currentDay++;
  }

  issuePolicy(ph: PolicyHolder, numCoverageUnits: number) {
    this.state.arrCoveragePerPH[ph.id] = numCoverageUnits;
    this.state.numCA_MPC += numCoverageUnits;
    this.state.numCA_CAT += numCoverageUnits;
    this.state.numCA_TUL += numCoverageUnits;
    console.assert(this.checkTripleBookkeeping(), 'Triple-entry bookkeeping failed after issuePolicy()');
  }

  restoreBXC(bxc: BancorContract) {
    let targetEth = 1 / (1 - Math.pow((1 - 1 / bxc.tokenAmount), (1 / bxc.weight)));
    if (targetEth > this.state.premiumsEscrow + bxc.ethAmount) {
      targetEth = this.state.premiumsEscrow + bxc.ethAmount;
      const targetWeight = Math.log(1 - (1 / bxc.tokenAmount)) / Math.log(1 - (1 / targetEth));
      bxc.weight = targetWeight;
    }
    const requiredEth = targetEth - bxc.ethAmount;
    this.state.premiumsEscrow -= requiredEth;
    bxc.addEth(requiredEth);
    console.assert(this.checkTripleBookkeeping(), 'Triple-entry bookkeeping failed after restoreBXC()');
  }

  checkCatastrophe(bxc: BancorContract) {
    const requiredCA = jStat.sum(this.state.arrCATokensPerPH) - bxc.tokenAmount;
    if (requiredCA > 0) {
      this.state.numCA_CAT -= requiredCA;
      bxc.tokenAmount += requiredCA;
      this.restoreBXC(bxc);
    }
    console.assert(this.checkTripleBookkeeping(), 'Triple-entry bookkeeping failed after checkCatastrophe()');
  }

  checkTripleBookkeeping(): boolean {
    const a = this.state.numCA_MPC + jStat.sum(this.state.arrCATokensPerPH);
    const b = this.state.bxc.tokenAmount + this.state.numCA_CAT;
    const c = a; // const c = this.state.numCA_TUL + this.state.numCA_TOL;
    return a === b && b === c;
  }

  simulateDecision_Participation(p: PolicyHolder): boolean {
    if (p.participationType === ParticipationType.Random) {
      return Math.random() < p.participationValue;
    } else if (p.participationType === ParticipationType.Eval) {
      return eval(p.participationValue);
    }
    return true;
  }

  simulateDecision_CoveragePurchase(p: PolicyHolder): number {
    if (p.coverageType === CoverageType.Constant) {
      return p.coverageValue;
    } else if (p.coverageType === CoverageType.Eval) {
      return eval(p.coverageValue);
    }
    return 0;
  }

  simulateDecision_ClaimValue(p: PolicyHolder): number {
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

  simulateDecision_SubmitClaim(p: PolicyHolder): boolean {
    if (this.state.arrDamagesPerPH[p.id] > 0) {
      return true;
    }
    return false;
  }

  simulateDecision_RedeemCA(p: PolicyHolder): number {
    return Math.min(this.state.arrCATokensPerPH[p.id], this.state.arrRedemptionWindows[p.id]);
  }

}

export class BancorContract {
  ethAmount: number;
  tokenAmount: number;
  weight: number;

  constructor(ethAmount: number, tokenAmount: number) {
    this.ethAmount = ethAmount;
    this.tokenAmount = tokenAmount;
  }

  getEth(tokensIn: number) {
    const etherOut = this.ethAmount * Math.pow((1 - (1 - tokensIn / this.tokenAmount)), (1 / this.weight));
    this.tokenAmount += tokensIn;
    this.ethAmount -= etherOut;
    return etherOut;
  }

  addEth(ethIn: number) {
    this.ethAmount += ethIn;
  }
}


