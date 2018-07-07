import {BancorContract} from '../service/unity.simulation.service';

export class UnityState {
  policyPeriodLength: number;
  premium: number;
  redemptionWindowTiers: number[] = [];

  coverageUnitValue: number;

  currentDay: number;
  currentPeriod: number;

  arrCoveragePerPH: number[] = [];
  accumulatedDamagesPerPH: number[] = [];
  arrCATokensPerPH: number[] = [];
  arrRedemptionWindows: number[] = [];

  numCA_MPC: number = 400;

  bxcStartingEth: number;
  bxcStartingCA: number;
  bxcTargetWeight: number;
  bxc: BancorContract;
  numCA_CAT: number = 0;

  numCA_TUL: number;
  numCA_TOL: number;

  premiumsEscrow: number = 0;
  catastrophicPremiumsEscrow: number = 0;

  purchasedCoverageHistory: number[][] = [];
  paidPremiumsHistory: number[][] = [];
  claimableDamageHistory: number[][] = [];
  CATokenRedemptionHistory: number[][] = [];
  ethPayoutHistory: number[][] = [];

  totalDamagesReported: number;
  totalEthPaidOut: number;
  totalCARedeemed: number;
  totalEthPaidIn: number;

  constructor(policyPeriodLength, coverageUnitValue, redemptionWindowTiers) {
    this.currentDay = 0;
    this.currentPeriod = 0;

    this.policyPeriodLength = policyPeriodLength;
    this.coverageUnitValue = coverageUnitValue;
    this.redemptionWindowTiers = redemptionWindowTiers;
  }
}
