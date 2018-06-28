export class Period {
  chosenPremium: number;
  totalCoverageUnits: number;
  tol: number;
  claimantCount: number;
  totalPremiumPayment: number;
  totalOverpayments: number;
  confiscatedOverpayments: number;
  totalEligibleClaims: number;

  numDefectors: number;
  loyalistCoverageUnits: number;
  totalPremiumsAfterDefect: number;
  totalRebateCoverageUnits: number;
  rebateRatio: number; //

  totalRebates: number;
  claimPaymentRatio: number;
  effectivePremium: number;
  effectiveCost: number;
  averageClaimPayment: number;

  constructor() {
    this.numDefectors = 0;
    this.loyalistCoverageUnits = 0;
    this.chosenPremium = null;

    this.totalCoverageUnits = null;
    this.tol = null;
    this.claimantCount = null;
    this.totalPremiumPayment = null;
    this.totalOverpayments = null;
    this.confiscatedOverpayments = null;
    this.totalEligibleClaims = null;

    this.totalPremiumsAfterDefect = null;
    this.totalRebateCoverageUnits = null;
    this.rebateRatio = null;

    this.totalRebates = null;
    this.claimPaymentRatio = null;
    this.effectivePremium = null;
    this.effectiveCost = null;
    this.averageClaimPayment = null;
  }
}
