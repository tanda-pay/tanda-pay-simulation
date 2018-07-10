import {Injectable} from '@angular/core';
import {PolicyHolder} from '../model/policy-holder';

import {ParticipationType} from '../model/enum/ParticipationType';
import {UnityState} from '../model/unity-state';
import {DamageType} from '../model/enum/DamageType';
import {PremiumVoteType} from '../model/enum/PremiumVoteType';

declare var jStat: any;

@Injectable()
export class UnitySimulationService {

  policyholders: PolicyHolder[];
  state: UnityState;

  constructor() {
  }

  generateSimulation(periodCount: number) {
    for (let i = 0; i < periodCount * this.state.policyPeriodLength; i++) {
      this.simulateNewDay();
    }
  }

  simulateNewDay() {
    // If the day marks a new policy period, policyholders buy coverage.
    if (this.state.currentDay % this.state.policyPeriodLength === 0) {

      let arrPremiums = [];

      for (const ph of this.policyholders) {
        const premiumVote = this.simulateDecision_PremiumVote(ph);
        arrPremiums[ph.id] = premiumVote;
      }
      arrPremiums.sort(function (a, b) { return a - b; });
      arrPremiums = arrPremiums.slice(arrPremiums.length - this.policyholders.length); // Make sure to not include defectors
      arrPremiums = arrPremiums.slice(Math.floor(arrPremiums.length * .1), Math.floor(arrPremiums.length * .9));
      const premiumMean = jStat.mean(arrPremiums);
      const premiumMedian = jStat.median(arrPremiums);
      const arrPremiumAverages = [premiumMean, premiumMedian, (premiumMean + premiumMedian) * .55];
      const chosenPremium = arrPremiumAverages[Math.floor(Math.random() * 3)];

      this.state.purchasedCoverageHistory.push([]);
      this.state.paidPremiumsHistory.push([]);

      this.state.accumulatedDamagesPerPH = Array(this.policyholders.length).fill(0);
      this.state.arrCoveragePerPH = Array(this.policyholders.length).fill(0);

      for (const ph of this.policyholders) {
        if (this.simulateDecision_Participation(ph)) {
          const num_cu = ph.coverageValue;
          this.state.purchasedCoverageHistory[this.state.currentPeriod][ph.id] = num_cu;
          this.state.paidPremiumsHistory[this.state.currentPeriod][ph.id] = num_cu * chosenPremium;
          this.state.premiumsEscrow += num_cu * chosenPremium;
          this.issuePolicy(ph, num_cu);
        } else {
          this.state.purchasedCoverageHistory[this.state.currentPeriod][ph.id] = 0;
          this.state.paidPremiumsHistory[this.state.currentPeriod][ph.id] = 0;
        }
      }
    }

    this.state.claimableDamageHistory.push([]);
    this.state.CATokenRedemptionHistory.push([]);
    this.state.ethPayoutHistory.push([]);

    // Step 1: Policyholders have accidents/claim-worthy events
    for (const ph of this.policyholders) {
      const damages = this.simulateDecision_DamageValue(ph);
      this.state.claimableDamageHistory[this.state.currentDay][ph.id] = damages;
      this.state.accumulatedDamagesPerPH[ph.id] += damages;
    }

    // Step 2: Policyholders can submit their claim for the month, nullifying the rest of their coverage
    // Step 3: Give Claim-Award Tokens to policyholders who submitted a claim, and update their daily CA redemption limit
    for (const ph of this.policyholders) {
      const willSubmitClaim = this.simulateDecision_SubmitClaim(ph);
      if (willSubmitClaim) {
        const damages = Math.min(this.state.accumulatedDamagesPerPH[ph.id], this.state.arrCoveragePerPH[ph.id]);
        this.state.arrCoveragePerPH[ph.id] = 0;
        this.state.arrCATokensPerPH[ph.id] += damages;
        this.state.numCA_MPC -= damages;
        this.state.arrRedemptionWindows[ph.id] = this.state.arrCATokensPerPH[ph.id] / this.state.redemptionWindowTiers[0];
      }
    }

    // Step 4: Check for "Catastrophic Event" condition, where there is not enough CA in the BXC to match all CA in policyholders' hands
    // TODO: Implement a condition to end catastrophic events
    this.checkCatastrophe(this.state.bxc);

    // Step 5: Policyholders can choose the amount of CA tokens they redeem, up to a maximum amount dictated by the claim window
    let totalCATokenRedemption = 0;
    let redemptionLimitMultiplier = 1;
    if (this.state.premiumsEscrow === 0) {
      redemptionLimitMultiplier = this.state.redemptionWindowTiers[0] / this.state.redemptionWindowTiers[2];
    } else if (this.state.premiumsEscrow < jStat.sum(this.state.arrCATokensPerPH)) {
      redemptionLimitMultiplier = this.state.redemptionWindowTiers[0] / this.state.redemptionWindowTiers[1];
    }
    for (const ph of this.policyholders) {
      const numCA = Math.min(this.simulateDecision_RedeemCA(ph), this.state.arrCATokensPerPH[ph.id] * redemptionLimitMultiplier);
      this.state.CATokenRedemptionHistory[this.state.currentDay][ph.id] = numCA;
      this.state.arrCATokensPerPH[ph.id] -= numCA;
      totalCATokenRedemption += numCA;
    }

    // Step 6: Policyholders' redeemed claim award tokens are simultaneously converted into ETH through the BXC
    const redeemedEth = this.state.bxc.solveEtherOut_fromTokensIn(totalCATokenRedemption);
    this.state.bxc.ETH -= redeemedEth;
    this.state.bxc.CA -= totalCATokenRedemption;
    for (const ph of this.policyholders) {
      if (totalCATokenRedemption > 0) {
        this.state.ethPayoutHistory[this.state.currentDay][ph.id] = redeemedEth * this.state.CATokenRedemptionHistory[this.state.currentDay][ph.id] / totalCATokenRedemption;
      } else {
        this.state.ethPayoutHistory[this.state.currentDay][ph.id] = 0;
      }
    }

    // Step 7: BXC gets ETH replenished from the premium escrow, and CA replenished from the CAT
    this.state.bxc.CA += totalCATokenRedemption;
    this.state.numCA_CAT -= totalCATokenRedemption;
    console.assert(this.checkDoubleEntryBookkeeping(), 'Double-entry bookkeeping failed after redeeming CA');
    this.restoreBXC(this.state.bxc, 1, false);

    // If the day marks the end policy period, update records
    if ((this.state.currentDay + 1) % this.state.policyPeriodLength === 0) {
      this.state.currentPeriod++;
      this.state.catastrophicReserveEth += this.state.premiumsEscrow;
      this.state.premiumsEscrow = 0;
    }
    this.state.currentDay++;
  }

  issuePolicy(ph: PolicyHolder, numCoverageUnits: number) {
    this.state.arrCoveragePerPH[ph.id] = numCoverageUnits;
    this.state.numCA_MPC += numCoverageUnits;
    this.state.numCA_CAT += numCoverageUnits;
    console.assert(this.checkDoubleEntryBookkeeping(), 'Double-entry bookkeeping failed after issuePolicy()');
  }

  restoreBXC(bxc: BancorContract, targetRatio: number, changeWeight: boolean) {
    let targetEth = targetRatio / (1 - Math.pow((1 - 1 / bxc.CA), (1 / bxc.weight)));
    if (targetEth > this.state.premiumsEscrow + bxc.ETH) {
      targetEth = this.state.premiumsEscrow + bxc.ETH;
      if (changeWeight) {
        const targetWeight = Math.log(1 - (1 / bxc.CA)) / Math.log(1 - (1 / targetEth));
        bxc.weight = targetWeight;
      }
    }
    const requiredEth = targetEth - bxc.ETH;
    this.state.premiumsEscrow -= requiredEth;
    bxc.addEth(requiredEth);
    console.assert(this.checkDoubleEntryBookkeeping(), 'Double-entry bookkeeping failed after restoreBXC()');
  }

  checkCatastrophe(bxc: BancorContract) {
    const requiredCA = jStat.sum(this.state.arrCATokensPerPH) - bxc.CA;
    const currentPrice = bxc.ETH * (1 - Math.pow((1 - 1 / bxc.CA), (1 / bxc.weight)));
    if (requiredCA > 0) {
      this.state.numCA_CAT -= requiredCA;
      bxc.CA += requiredCA;
      this.restoreBXC(bxc, currentPrice, true);
    }
    console.assert(this.checkDoubleEntryBookkeeping(), 'Double-entry bookkeeping failed after checkCatastrophe()');
  }

  checkDoubleEntryBookkeeping(): boolean {
    const a = this.state.numCA_MPC + jStat.sum(this.state.arrCATokensPerPH);
    const b = this.state.bxc.CA + this.state.numCA_CAT;
    const c = a; // const c = this.state.numCA_TUL + this.state.numCA_TOL;
    return Math.abs(a - b) < .01;
  }

  simulateDecision_PremiumVote(ph: PolicyHolder): number {
    if (ph.premiumVoteType === PremiumVoteType.Constant) {
      return ph.premiumVoteValue;
    } else if (ph.premiumVoteType === PremiumVoteType.Eval) {
      return eval(ph.premiumVoteValue);
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

  simulateDecision_DamageValue(ph: PolicyHolder): number {
    if (ph.damageType === DamageType.PredeterminedDamagesPerDay) {
      return ph.damageValue[this.state.currentDay];
    } else if (ph.damageType === DamageType.Eval) {
      return eval(ph.damageValue);
    }
    return 0;
  }

  simulateDecision_SubmitClaim(p: PolicyHolder): boolean {
    if (this.state.accumulatedDamagesPerPH[p.id] > 0 && this.state.arrCoveragePerPH[p.id] > 0) {
      return true;
    }
    return false;
  }

  simulateDecision_RedeemCA(p: PolicyHolder): number {
    return p.redemptionValue(this);
  }

  generateSimulationSummary() {
    this.state.totalEthPaidIn = 0;
    for (const day of this.state.paidPremiumsHistory) {
      this.state.totalEthPaidIn += jStat.sum(day);
    }

    this.state.totalDamagesReported = 0;
    for (const day of this.state.claimableDamageHistory) {
      this.state.totalDamagesReported += jStat.sum(day);
    }

    this.state.totalCARedeemed = 0;
    for (const day of this.state.CATokenRedemptionHistory) {
      this.state.totalCARedeemed += jStat.sum(day);
    }

    this.state.totalEthPaidOut = 0;
    for (const day of this.state.ethPayoutHistory) {
      this.state.totalEthPaidOut += jStat.sum(day);
    }

    this.state.damagesPerDay = [];
    for (let _ of this.state.claimableDamageHistory) {
      this.state.damagesPerDay.push(jStat.sum(_));
    }
    this.state.CARedemptionPerDay = [];
    for (let _ of this.state.CATokenRedemptionHistory) {
      this.state.CARedemptionPerDay.push(jStat.sum(_));
    }
    this.state.ethPayoutPerDay = [];
    for (let _ of this.state.ethPayoutHistory) {
      this.state.ethPayoutPerDay.push(jStat.sum(_));
    }
  }

}

export class BancorContract {
  ETH: number;
  CA: number;
  weight: number;

  // EtherOut = EtherSupply * (1 - (1 - (TokensIn / TokenSupply)) ^ (1 / Weight))

  constructor(ethAmount: number, tokenAmount: number, weight: number) {
    this.ETH = ethAmount;
    this.CA = tokenAmount;
    this.weight = weight;
  }

  solveEtherOut_fromTokensIn(tokensIn: number) {
    const etherOut = this.ETH * (1 - Math.pow((1 - (tokensIn / this.CA)), (1 / this.weight)));
    return etherOut;
  }

  solveEtherSupply_fromExchangeRatio(exchangeRatio: number) {
    const etherSupply = exchangeRatio / (1 - Math.pow((1 - 1 / this.CA), (1 / this.weight)));
    return etherSupply;
  }

  solveWeight_fromExchangeRatio(exchangeRatio: number) {
    const weight = Math.log(1 - (1 / this.CA)) / Math.log(1 - (exchangeRatio / this.ETH));
  }

  addEth(ethIn: number) {
    this.ETH += ethIn;
  }
}


