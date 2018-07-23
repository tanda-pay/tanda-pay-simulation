export class UserInput {
  numPh: number;

  numPolicyPeriods: number;
  policyPeriodLength: number;

  tul: number;
  cuValue: number;

  mean_Claims2TUL: number; stdev_Claims2TUL: number;

  mean_claimProportion: number; stdev_claimProportion: number;
  dailyAccidentLikelihood: number;

  // TandaPay settings
  desiredPremiumMean: number; desiredPremiumStdev: number;
  avgGroupSize: number;
  percentageToDefect: number; defectorCapPerPeriod: number;

  // Unity settings
  unityBxcInitialEth: number;
  unityBxcInitialWeight: number;
  majorCatastropheLikelihood: number; majorCatastropheMeanDamage: number; majorCatastropheStdevDamage: number;
  minorCatastropheLikelihood: number; minorCatastropheMeanDamage: number; minorCatastropheStdevDamage: number;

  // Derived values
  numCu: number;
  totalPremiums: number;
  estimatedTOL: number;
  estimatedClaimCount: number;
  estimatedClaimValue: number;
  overpaymentIncrease: number;
  numDefectors: number;
  catastropheEV: number;

  constructor() {
    // set default inputs for user
    this.numPh = 100;
    this.percentageToDefect = .1;
    this.defectorCapPerPeriod = 3;
    this.avgGroupSize = 7;
    this.tul = 10000;
    this.cuValue = 100;
    this.desiredPremiumMean = 5;
    this.desiredPremiumStdev = 0;
    this.mean_Claims2TUL = .5;
    this.stdev_Claims2TUL = .02;
    this.mean_claimProportion = .2;
    this.stdev_claimProportion = .01;
    this.dailyAccidentLikelihood = null; // .0033;

    this.majorCatastropheLikelihood = 0;
    this.majorCatastropheMeanDamage = .5;
    this.majorCatastropheStdevDamage = .1;

    this.minorCatastropheLikelihood = 0;
    this.minorCatastropheMeanDamage = .1;
    this.minorCatastropheStdevDamage = .01;

    this.numPolicyPeriods = 50;
    this.policyPeriodLength = 45;

    this.unityBxcInitialEth = this.numCu * .1;
    this.unityBxcInitialWeight = .5;

  }

  updateDerivedValues() {
    this.numDefectors = Math.round(this.numPh * this.percentageToDefect);
    this.numCu = this.tul / this.cuValue;
    this.totalPremiums = this.numPh * this.desiredPremiumMean;
    this.overpaymentIncrease = 1 / (this.avgGroupSize - 1);
    this.estimatedTOL = this.tul * this.mean_Claims2TUL;
    if (this.dailyAccidentLikelihood) {
      this.estimatedClaimCount = this.numPh * this.dailyAccidentLikelihood * this.policyPeriodLength;
    } else {
      this.estimatedClaimCount = this.numPh * this.mean_claimProportion;
    }
    this.estimatedClaimValue = this.estimatedTOL / this.estimatedClaimCount;
    this.catastropheEV = this.policyPeriodLength * (this.majorCatastropheLikelihood * this.majorCatastropheMeanDamage + this.minorCatastropheLikelihood * this.minorCatastropheMeanDamage) * this.tul;
  }
}
