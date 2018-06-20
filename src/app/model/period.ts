export class Period {
  subgroups: any; // All policyholders are represented in a 2d array,
  prevPeriod: Period;

  chosenPremium: any;
  // The following variables are data structures parallel to the subgroups array
  // For example, this.committedPremiums[i][j] corresponds to the user at this.subgroups[i][j]
  committedPremiums;
  committedOverpayments;
  claims;
  defectorStatuses;

  overpaymentReturns;
  claimPayouts;
  rebates;

  totalUnderwrittenLiability;
  totalOutstandingLiability;

  totalPremiumPayments;
  totalEligibleClaims;
  claimPayoutRatio;

  totalRebateCoverageUnits;
  rebateRatio;

  constructor(subgroups, prevPeriod) {
    this.subgroups = subgroups; // All policyholders are represented in a 2d array,
    this.prevPeriod = prevPeriod;

    this.chosenPremium = null;
    // The following variables are data structures parallel to the subgroups array
    // For example, this.committedPremiums[i][j] corresponds to the user at this.subgroups[i][j]
    this.committedPremiums = null;
    this.committedOverpayments = null;
    this.claims = null;
    this.defectorStatuses = null;

    this.overpaymentReturns = [];
    this.claimPayouts = null;
    this.rebates = null;

    this.totalUnderwrittenLiability = null;
    this.totalOutstandingLiability = null;

    this.totalPremiumPayments = 0;
    this.totalEligibleClaims = 0;
    this.claimPayoutRatio = null;

    this.totalRebateCoverageUnits = null;
    this.rebateRatio = null;
  }
}
