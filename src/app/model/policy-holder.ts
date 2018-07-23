
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
      const policyPeriodLength = this.knowledge.state.policyPeriodLength;
      let claimValue = 0;
      for (let i = 0; i < policyPeriodLength; i++) {
        claimValue += this.damageValue[(this.knowledge.state.currentPeriod * policyPeriodLength) + i];
      }
      return claimValue * this.coverageValue;
    } else if (this.damageType === DamageType.PredeterminedDamagesPerPeriod) {
      return this.damageValue[this.knowledge.state.currentPeriod];
    } else if (this.damageType === DamageType.Function) {
      return this.damageValue();
    }
    return 0;
  }

  chooseSubmitClaim(): boolean {
    if (this.claimType === ClaimType.Function) {
      return this.claimValue();
    }
    return false;
  }

  chooseRedeemCA(): number {
    if (this.redemptionType === RedemptionType.Random) {
      return Math.random();
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
  Function
}

