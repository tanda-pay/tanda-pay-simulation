export class Period {
  chosenPremium: number;
  tul: number;
  tol: number;
  totalPremiumPayment: number;
  totalOverpayments: number;
  totalEligibleClaims: number;
  
  totalPremiumsAfterDefect: number;
  totalRebateCoverageUnits: number;
  rebateRatio: number; //

  totalRebates: number;
  claimPaymentRatio: number;
  effectiveCost: number;
  averageClaimPayment: number;

  constructor() {
    this.chosenPremium = null;

    this.tul = null;
    this.tol = null;
    this.totalPremiumPayment = null;
    this.totalEligibleClaims = null;
    
    this.totalPremiumsAfterDefect = null;
    this.totalRebateCoverageUnits = null;
    this.rebateRatio = null;
    
    this.totalRebates = null
    this.claimPaymentRatio = null;
    this.effectiveCost = null;
    this.averageClaimPayment = null;
  }
}
