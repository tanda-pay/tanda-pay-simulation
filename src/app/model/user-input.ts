export class UserInput {
  numPH: number;
  avgGroupSize: number;
  tul: number;
  cuValue: number;
  desiredPremiumMean: number;
  desiredPremiumStdev: number;
  percentageOfTUL2Claims: number;
  likelihoodOpenClaimMean: number;
  likelihoodOpenClaimStdev: number;
  likelihoodToDefect: number;

  numDefectors: number
  numCu: number
  totalPremiums: number
  overpaymentIncrease: number
  tol: number
  


  constructor() {
    // set default inputs for user
    this.numPH = 100;
    this.avgGroupSize = 7;
    this.tul = 10000;
    this.cuValue = 100;
    this.desiredPremiumMean = 5;
    this.desiredPremiumStdev = 1;
    this.percentageOfTUL2Claims = .02;
    this.likelihoodOpenClaimMean = .06;
    this.likelihoodOpenClaimStdev = 1;
    this.likelihoodToDefect = .03;
    this.calculateDerivedValues()
  }

  calculateDerivedValues() {
    this.numDefectors = this.numPH * this.likelihoodToDefect;
    this.numCu = this.tul/this.cuValue;
    this.totalPremiums = this.numPH * this.desiredPremiumMean;
    this.overpaymentIncrease = 1/(this.avgGroupSize-1);
    this.tol = this.tul * this.percentageOfTUL2Claims
  }
}
