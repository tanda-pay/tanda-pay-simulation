export class UserInput {
  numPH: number;
  percentageToDefect: number;
  avgGroupSize: number;
  tul: number;
  cuValue: number;
  desiredPremiumMean: number;
  desiredPremiumStdev: number;
  ratio_Claims2TUL: number;
  mean_claimLikelihood: number;
  stdev_claimLikelihood: number;

  numDefectors: number;
  numCu: number;
  totalPremiums: number;
  overpaymentIncrease: number;
  tol: number;
  totalClaimCount: number;
  averageClaimValue: number;


  constructor() {
    // set default inputs for user
    this.numPH = 100;
    this.percentageToDefect = .03;
    this.avgGroupSize = 7;
    this.tul = 10000;
    this.cuValue = 100;
    this.desiredPremiumMean = 5;
    this.desiredPremiumStdev = 1;
    this.ratio_Claims2TUL = .02;
    this.mean_claimLikelihood = .06;
    this.stdev_claimLikelihood = .01;

    this.numDefectors = Math.round(this.numPH * this.percentageToDefect);
    this.numCu = this.tul / this.cuValue;
    this.totalPremiums = this.numPH * this.desiredPremiumMean;
    this.overpaymentIncrease = 1 / (this.avgGroupSize - 1);
    this.tol = this.tul * this.ratio_Claims2TUL;
    this.totalClaimCount = this.numPH * this.mean_claimLikelihood;
    this.averageClaimValue = this.cuValue * this.tol / this.totalClaimCount;

  }
}
