import {BancorContract} from '../service/unity.simulation.service';

export class UnityState {
  policyPeriodLength: number;
  redemptionWindowTiers: number[] = [];

  coverageUnitValue: number;

  currentDay: number;
  currentPeriod: number;

  arrCoveragePerPH: number[] = [];
  accumulatedDamagesPerPH: number[] = [];
  arrCATokensPerPH: number[] = [];
  arrRedemptionWindows: number[] = [];

  numCA_MPC: number;

  bxcStartingEth: number;
  bxcTargetWeight: number;
  bxc: BancorContract;
  numCA_CAT;

  premiumsEscrow: number;
  catastrophicReserveEth: number;

  purchasedCoverageHistory: number[][] = [];
  paidPremiumsHistory: number[][] = [];
  claimableDamageHistory: number[][] = [];
  CATokenRedemptionHistory: number[][] = [];
  ethPayoutHistory: number[][] = [];

  // Data for presentation purposes only
  noteworthyDays: number[] = [];
  damagesPerDay: number[] = [];
  CARedemptionPerDay: number[] = [];
  ethPayoutPerDay: number[] = [];
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

    this.premiumsEscrow = 0;
    this.catastrophicReserveEth = 0;
    this.numCA_CAT = 0;
  }
}
