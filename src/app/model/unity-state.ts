import {BancorContract} from '../service/unity.simulation.service';

export class UnityState {
  daysPerPeriod: number;
  premium: number;
  redemptionWindowTiers: number[] = [];

  currentDay: number;
  currentPeriod: number;

  arrCoveragePerPH: number[] = [];
  arrDamagesPerPH: number[] = [];
  arrCATokensPerPH: number[] = [];
  arrRedemptionWindows: number[] = [];

  numCA_MPC: number;

  bxc: BancorContract;
  numCA_CAT: number;

  numCA_TUL: number;
  numCA_TOL: number;

  premiumsEscrow: number;

  constructor(daysPerPeriod, premium, redemptionWindowTiers) {
    this.currentDay = 0;
    this.currentPeriod = 0;

    this.daysPerPeriod = daysPerPeriod;
    this.premium = premium;
    this.redemptionWindowTiers = redemptionWindowTiers;
  }
}
