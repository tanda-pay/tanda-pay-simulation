import {SubGroupStuff} from './sub-group-stuff';

export class Period {
  chosenPremium: number;
  subGroupStuffs: SubGroupStuff[];
  tul: number;
  tol: number;
  totalPremiumPayment: number; // includes confiscated overpayments
  totalEligibleClaims: number;
  claimPaymentRatio: number; // TPP / TEC
  totalRebateCoverageUnits: number;
  rebateRatio: number; //

  constructor() {
    this.chosenPremium = null;
    this.subGroupStuffs = null;

    this.tul = null;
    this.tol = null;
    this.totalPremiumPayment = null;
    this.totalEligibleClaims = null;
    this.claimPaymentRatio = null;

    this.totalRebateCoverageUnits = null;
    this.rebateRatio = null;
  }
}
