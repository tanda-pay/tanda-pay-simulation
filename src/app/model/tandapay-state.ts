import {Period} from '../service/simulation.service';

export class TandapayState {
  policyPeriodLength: number;

  currentPeriod: number;

  coverageUnitValue: number;

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

  claimUnderpaidFrequency: number;
  claimAwardRatio: number;
  underpaidClaimAwardRatio: number;
  effectivePremiumAvg: number;
  effectiveClaimAvg: number;

  constructor(policyPeriodLength, coverageUnitValue) {
    this.currentPeriod = 0;

    this.policyPeriodLength = policyPeriodLength;
    this.coverageUnitValue = coverageUnitValue;
  }
}
