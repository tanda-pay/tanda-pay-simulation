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

  state: any;
  knowledge: any;


  static reset() {
    PolicyHolder.numPolicyHolder = 0;
  }

  constructor() {
    this.id = PolicyHolder.numPolicyHolder;
    PolicyHolder.numPolicyHolder++;

    this.knowledge = {};
  }

  chooseCoverage(): number {
    if (this.coverageType === CoverageType.Constant) {
      return this.coverageValue;
    } else if (this.coverageType === CoverageType.Function) {
      return eval(this.coverageValue);
    }
    return 0;
  }

  choosePremiumVote(): number {
    if (this.premiumVoteType === PremiumVoteType.Constant) {
      return this.premiumVoteValue;
    } else if (this.premiumVoteType === PremiumVoteType.Function) {
      return this.premiumVoteValue();
    }
    return 0;
  }

  chooseParticipation(): boolean {
    if (this.participationType === ParticipationType.Random) {
      return Math.random() < this.participationValue;
    } else if (this.participationType === ParticipationType.Function) {
      return eval(this.participationValue);
    }
    return true;
  }

  chooseDamageValue(): number {
    if (this.damageType === DamageType.PredeterminedDamages) {
      if (!('damageIndex' in this.knowledge)) {
        this.knowledge['damageIndex'] = 0;
      }
      return this.damageValue[this.knowledge['damageIndex']++];
    } else if (this.damageType === DamageType.PredeterminedDamagesPerDay) {
      return this.damageValue[this.state.currentDay];
    } else if (this.damageType === DamageType.PredeterminedDamagesPerPeriod) {
      return this.damageValue[this.state.currentPeriod];
    } else if (this.damageType === DamageType.Function) {
      return this.damageValue();
    }
    return 0;
  }

  chooseSubmitClaim(): boolean {
    if (this.claimType === ClaimType.Function) {
      return this.claimValue();
    } else if (this.claimType === ClaimType.Strategy) {
      // Strategy: Submit claim if damages exceed 50% of coverage OR if it is the last day of the policy period
      let willSubmit = false;
      const myCurrentDamage = this.state.accumulatedDamagesPerPH[this.id];
      const myCoverage = this.state.arrCoveragePerPH[this.id];
      const policyPeriodLength = this.state.policyPeriodLength;
      const currentDay = this.state.currentDay - this.state.currentPeriod * policyPeriodLength;
      if (myCurrentDamage > myCoverage * .5) {
        willSubmit = true;
      } else if (currentDay + 1 === policyPeriodLength) {
        willSubmit = true;
      }
      return willSubmit;
    }
    return false;
  }

  chooseRedeemCA(): number {
    if (this.redemptionType === RedemptionType.Random) {
      return Math.random();
    } else if (this.redemptionType === RedemptionType.Strategy) {
      let willRedeem = true;
      const current_bxc_rate = this.state.bxc.solveCurrentExchangeRate();
      const policyPeriodLength = this.state.policyPeriodLength;
      const currentDay = this.state.currentDay - this.state.currentPeriod * policyPeriodLength;
      if (current_bxc_rate < 1 - (.55 / policyPeriodLength * currentDay)) {
        // If the exchange rate falls below the line where payments reach a 45% rate by the end of the policy period claimants always accept a payment due to lack of confidence premiums will restore the exchange rate sufficiently enough to forgo payment (loss of confidence scenario)
        willRedeem = true;
      } else if (currentDay >= policyPeriodLength * .9 && current_bxc_rate < .9) {
        // When policy period is 90% finished, claimants will not accept an exchange rate payment of less than 90%
        willRedeem = false;
      } else if (currentDay >= policyPeriodLength * .8 && current_bxc_rate < .55) {
        // When policy period is 80% finished, claimants will not accept an exchange rate payment of less than 55%
        willRedeem = false;
      }
      if (willRedeem) {
        return this.state.arrCATokensPerPH[this.id]; // Rely on the UnitySimulationService to enforce the CA redemption limit
      } else {
        return 0;
      }
    } else if (this.redemptionType === RedemptionType.Function) {
      return this.redemptionValue();
    }
  }

  chooseDefect(): boolean {
    if (this.defectType === DefectType.Random) {
      return Math.random() < this.defectValue;
    } else if (this.defectType === DefectType.DefectAfterTimeElapsed) {
      if (this.defectValue < 1) {
        return true;
      }
      this.defectValue--;
    } else if (this.defectType === DefectType.Function) {
      return this.defectValue();
    }
    return false;
  }

}

export enum ClaimType {
  Random,
  Strategy,
  Function
}

export enum CoverageType {
  Constant,
  Function
}

export enum DefectType {
  Random,
  DefectAfterTimeElapsed, // defectValue field is the number of periods until the policyholder chooses to defect
  Function
}

export enum ParticipationType {
  Random,
  Function
}

export enum PremiumVoteType {
  Constant,
  Function
}

export enum DamageType {
  PredeterminedDamages,
  PredeterminedDamagesPerDay, // damageValue field is an array that maps each day to a damage value
  PredeterminedDamagesPerPeriod, // damageValue field is an array that maps each period to a damage value
  Function
}

export enum RedemptionType {
  Random,
  Strategy,
  Function
}

