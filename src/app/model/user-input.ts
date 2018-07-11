export class UserInput {
  numPh: number;
  percentageToDefect: number;
  avgGroupSize: number;
  tul: number;
  cuValue: number;
  desiredPremiumMean: number;
  desiredPremiumStdev: number;
  mean_Claims2TUL: number;
  stdev_Claims2TUL: number;
  mean_claimProportion: number;
  stdev_claimProportion: number;

  majorCatastropheLikelihood: number;
  majorCatastropheMeanDamage: number;
  majorCatastropheStdevDamage: number;
  minorCatastropheLikelihood: number;
  minorCatastropheMeanDamage: number;
  minorCatastropheStdevDamage: number;
  catastropheEV: number;

  numDefectors: number;
  numCu: number;
  totalPremiums: number;
  overpaymentIncrease: number;
  tol: number;
  totalClaimCount: number;
  averageClaimValue: number;

  numPolicyPeriods: number;
  policyPeriodLength: number;

  unityBxcInitialEth: number;
  unityBxcInitialWeight: number;


  constructor() {
    // set default inputs for user
    this.numPh = 100;
    this.percentageToDefect = .1;
    this.avgGroupSize = 7;
    this.tul = 10000;
    this.cuValue = 100;
    this.desiredPremiumMean = 5;
    this.desiredPremiumStdev = 1;
    this.mean_Claims2TUL = .02;
    this.stdev_Claims2TUL = .01;
    this.mean_claimProportion = .06;
    this.stdev_claimProportion = .01;

    this.majorCatastropheLikelihood = 0;
    this.majorCatastropheMeanDamage = .5;
    this.majorCatastropheStdevDamage = .1;

    this.minorCatastropheLikelihood = 0;
    this.minorCatastropheMeanDamage = .1;
    this.minorCatastropheStdevDamage = .01;


    this.numPolicyPeriods = 50;
    this.policyPeriodLength = 45;

    this.numDefectors = Math.round(this.numPh * this.percentageToDefect);
    this.numCu = this.tul / this.cuValue;
    this.totalPremiums = this.numPh * this.desiredPremiumMean;
    this.overpaymentIncrease = 1 / (this.avgGroupSize - 1);
    this.tol = this.tul * this.mean_Claims2TUL;
    this.totalClaimCount = this.numPh * this.mean_claimProportion;
    this.averageClaimValue = this.tol / this.totalClaimCount;

    this.catastropheEV = this.policyPeriodLength * (this.majorCatastropheLikelihood * this.majorCatastropheMeanDamage + this.minorCatastropheLikelihood * this.minorCatastropheMeanDamage) * this.tul;

    this.unityBxcInitialEth = this.numCu * .1;
    this.unityBxcInitialWeight = .5;


  }
}
