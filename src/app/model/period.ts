export class Period {
  chosenPremium: number;
  tul: number;
  tol: number;
  claimantCount: number;
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
    this.claimantCount = null;
    this.totalPremiumPayment = null;
    this.totalOverpayments = null;
    this.totalEligibleClaims = null;

    this.totalPremiumsAfterDefect = null;
    this.totalRebateCoverageUnits = null;
    this.rebateRatio = null;

    this.totalRebates = null;
    this.claimPaymentRatio = null;
    this.effectiveCost = null;
    this.averageClaimPayment = null;
  }
}
