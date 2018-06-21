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

  constructor() {
    // set default inputs for user
    this.numPH = 100;
    this.avgGroupSize = 7;
    this.tul = 20000;
    this.cuValue = 1000;
    this.desiredPremiumMean = 5;
    this.desiredPremiumStdev = 1;
    this.percentageOfTUL2Claims = 2;
    this.likelihoodOpenClaimMean = .06;
    this.likelihoodOpenClaimStdev = 1;
    this.likelihoodToDefect = .03;
  }
}
