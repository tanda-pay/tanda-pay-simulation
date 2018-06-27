export class UserInput {
  numPH: number;
  percentageToDefect: number;
  avgGroupSize: number;
  tul: number;
  cuValue: number;
  desiredPremiumMean: number;
  desiredPremiumStdev: number;
  percentageOfTUL2Claims: number;
  percentageOpenClaimMean: number;
  percentageOpenClaimStdev: number;
  

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
    this.percentageToDefect = 3;
    this.avgGroupSize = 7;
    this.tul = 10000;
    this.cuValue = 100;
    this.desiredPremiumMean = 5;
    this.desiredPremiumStdev = 1;
    this.percentageOfTUL2Claims = 2;
    this.percentageOpenClaimMean = 6;
    this.percentageOpenClaimStdev = 1;
    
    this.calculateDerivedValues()
  }

  calculateDerivedValues() {
    this.numDefectors = Math.round(this.numPH * this.percentageToDefect * .01);
    this.numCu = Math.round(this.tul/this.cuValue);
    this.totalPremiums = Math.round(100 * this.numPH * this.desiredPremiumMean)/100;
    this.overpaymentIncrease = Math.round(100 * 100/(this.avgGroupSize-1))/100;
    this.tol = Math.round(100 * this.tul * this.percentageOfTUL2Claims * .01)/100;
    this.totalClaimCount = Math.round(100 * this.numPH * this.percentageOpenClaimMean * .01)/100;
    this.averageClaimValue = Math.round(100 * this.tol/this.totalClaimCount)/100;
  }
}
