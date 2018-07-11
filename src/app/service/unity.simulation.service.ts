import {Injectable} from '@angular/core';
import {PolicyHolder} from '../model/policy-holder';

import {ParticipationType} from '../model/enum/ParticipationType';
import {UnityState} from '../model/unity-state';
import {DamageType} from '../model/enum/DamageType';
import {PremiumVoteType} from '../model/enum/PremiumVoteType';
import {ClaimType} from '../model/enum/ClaimType';

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
      if (this.state.arrCoveragePerPH[ph.id] > 0) {
        const willSubmitClaim = this.simulateDecision_SubmitClaim(ph);
        if (willSubmitClaim) {
          const damages = Math.min(this.state.accumulatedDamagesPerPH[ph.id], this.state.arrCoveragePerPH[ph.id]);
          this.state.arrCoveragePerPH[ph.id] = 0;
          this.state.arrCATokensPerPH[ph.id] += damages;
          this.state.numCA_MPC -= damages;
          this.state.arrRedemptionWindows[ph.id] = this.state.arrCATokensPerPH[ph.id] / this.state.redemptionWindowTiers[0];
        }
      }
    }

    // Step 4: Check for "Catastrophic Event" condition, where there is not enough CA in the BXC to match all CA in policyholders' hands
    // TODO: Implement a condition to end catastrophic events
    this.checkCatastrophe();

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
    if (this.state.bxc.weight !== this.state.bxcTargetWeight || this.state.bxc.CA !== this.state.bxcStartingEth / this.state.bxcTargetWeight) {
      this.checkCatastropheOver();
    }
    this.restoreBXC();

    this.state.bxcHistory.push(new BancorContract(this.state.bxc.ETH, this.state.bxc.CA, this.state.bxc.weight));
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

  restoreBXC() {
    const bxc = this.state.bxc;
    let targetEth = bxc.solveEtherSupply_fromExchangeRatio(1);
    if (targetEth > this.state.premiumsEscrow + bxc.ETH) {
      targetEth = this.state.premiumsEscrow + bxc.ETH;
    }
    const requiredEth = targetEth - bxc.ETH;
    this.state.premiumsEscrow -= requiredEth;
    bxc.addEth(requiredEth);
    console.assert(this.checkDoubleEntryBookkeeping(), 'Double-entry bookkeeping failed after restoreBXC()');
  }

  checkCatastrophe() {
    const bxc = this.state.bxc;
    const totalPolicyHolderCA = jStat.sum(this.state.arrCATokensPerPH)
    const requiredCA = totalPolicyHolderCA - bxc.CA;
    console.log('CA awarded total: ' + totalPolicyHolderCA + ' - CA in BXC: ' + bxc.CA);
    const currentPrice = bxc.ETH * (1 - Math.pow((1 - 1 / bxc.CA), (1 / bxc.weight)));
    if (requiredCA > 0) {
      console.log('CATASTROPHE on day ' + this.state.currentDay)
      this.state.numCA_CAT -= requiredCA;
      bxc.CA += requiredCA;
      let neededEth = bxc.solveEtherSupply_fromExchangeRatio(currentPrice) - bxc.ETH;
      if (neededEth > this.state.catastrophicReserveEth) {
        neededEth = this.state.catastrophicReserveEth;
        this.state.catastrophicReserveEth -= neededEth;
        bxc.ETH += neededEth;
        const targetWeight = bxc.solveWeight_fromExchangeRatio(currentPrice);
        bxc.weight = targetWeight;
      } else {
        this.state.catastrophicReserveEth -= neededEth;
        bxc.ETH += neededEth;
        const escrowRefill = Math.min(neededEth, this.state.catastrophicReserveEth);
        this.state.premiumsEscrow += escrowRefill;
        this.state.catastrophicReserveEth -= escrowRefill;
      }
    }
    console.assert(this.checkDoubleEntryBookkeeping(), 'Double-entry bookkeeping failed after checkCatastrophe()');
  }

  checkCatastropheOver() {
    const bxc = this.state.bxc;
    if (this.state.premiumsEscrow >= jStat.sum(this.state.arrCATokensPerPH)) {
      console.log('CATASTROPHE over on day ' + this.state.currentDay)
      bxc.weight = this.state.bxcTargetWeight;
      this.state.numCA_CAT += (bxc.CA - this.state.bxcStartingEth / this.state.bxcTargetWeight);
      bxc.CA = this.state.bxcStartingEth / this.state.bxcTargetWeight;
    }
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
      return Math.max(ph.damageValue[this.state.currentDay], 0);
    } else if (ph.damageType === DamageType.Eval) {
      return eval(ph.damageValue);
    }
    return 0;
  }

  simulateDecision_SubmitClaim(p: PolicyHolder): boolean {
    if (p.claimType === ClaimType.Function) {
      return p.claimValue(this);
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
    for (const _ of this.state.claimableDamageHistory) {
      this.state.damagesPerDay.push(jStat.sum(_));
    }
    this.state.CARedemptionPerDay = [];
    for (const _ of this.state.CATokenRedemptionHistory) {
      this.state.CARedemptionPerDay.push(jStat.sum(_));
    }
    this.state.ethPayoutPerDay = [];
    for (const _ of this.state.ethPayoutHistory) {
      this.state.ethPayoutPerDay.push(jStat.sum(_));
    }
    for (let i = 0; i < this.state.currentPeriod; i++) {
      this.state.noteworthyDays.push(i * this.state.policyPeriodLength);
      this.state.noteworthyDays.push((i + 1) * this.state.policyPeriodLength - 1);
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
    // const etherSupply = exchangeRatio / (1 - Math.pow((1 - 1 / this.CA), (1 / this.weight)));
    const etherSupply = exchangeRatio * this.weight * this.CA;
    return etherSupply;
  }

  solveWeight_fromExchangeRatio(exchangeRatio: number) {
    // const weight = Math.log(1 - (1 / this.CA)) / Math.log(1 - (exchangeRatio / this.ETH));
    const weight = this.ETH / (exchangeRatio * this.CA);
    return weight;
  }

  addEth(ethIn: number) {
    this.ETH += ethIn;
  }
}


