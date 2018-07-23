import {Period} from '../service/tandapay.simulation.service';

export class TandapayState {
  policyPeriodLength: number;

  currentPeriod: number;
  currentDay: number;

  coverageUnitValue: number;
  averageTol: number;
  stdevTol: number;
  averageClaimants: number;

  subgroups: number[][] = [];
  blacklistedPolicyholders: number[] = [];

  periods: Period[] = [];

  premiumVoteHistory: number[][] = [];
  purchasedCoverageHistory: number[][] = [];
  premiumCommittedHistory: number[][] = [];
  overpaymentCommittedHistory: number[][] = [];
  claimSubmittedHistory: number[][] = [];
  defectHistory: boolean[][] = [];
  rebateReceivedHistory: number[][] = [];
  overpaymentReturnedHistory: number[][] = [];
  claimAwardHistory: number[][] = [];

  totalEligibleClaimsSum: number;
  claimUnderpaidFrequency: number;
  claimAwardRatio: number;
  underpaidClaimAwardRatio: number;
  effectivePremiumAvg: number;
  effectiveClaimAvg: number;

  constructor(policyPeriodLength, coverageUnitValue, averageTol, stdevTol, averageClaimants) {
    this.currentPeriod = 0;
    this.currentDay = 0;

    this.policyPeriodLength = policyPeriodLength;
    this.coverageUnitValue = coverageUnitValue;
    this.averageTol = averageTol;
    this.stdevTol = stdevTol;
    this.averageClaimants = averageClaimants;
  }
}
