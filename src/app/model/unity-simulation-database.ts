import {PolicyHolder} from './policy-holder';
import {Period} from './period';

export class UnitySimulationDatabase {

  policyHolders: PolicyHolder[];

  cuValue: number;
  policyPeriodLength: number;

  currentPolicyholderCAT: number[];

  // The following history data is accessed by arr[periodIndex][Policyholder.Id]
  premiumVoteHistory: number[][];
  purchasedCoverageHistory: number[][];
  premiumCommittedHistory: number[][];
  overpaymentCommittedHistory: number[][];
  claimSubmittedHistory: number[][];
  defectHistory: Boolean[][];
  rebateReceivedHistory: number[][];
  overpaymentReturnedHistory: number[][];
  claimAwardHistory: number[][];

  days;
  periods: Period[];
  numCompletedPeriods: number;
  mean_Claims2TUL: number;
  stdev_Claims2TUL: number;
  mean_ClaimantProportion: number;
  stdev_ClaimantProportion: number;

  claimUnderpaidFrequency: number;
  claimAwardRatio: number;
  underpaidClaimAwardRatio: number;
  effectivePremiumAvg: number;
  effectiveClaimAvg: number;


  constructor(policyHolders: PolicyHolder[][]) {
    this.policyHolders = [];
    for (let i = 0; i < policyHolders.length; i++) {
      for (let j = 0; j < policyHolders[i].length; j++) {
        this.policyHolders.push(policyHolders[i][j]);
      }
    }
    this.premiumVoteHistory = [];
    this.purchasedCoverageHistory = [];
    this.premiumCommittedHistory = [];
    this.overpaymentCommittedHistory = [];
    this.claimSubmittedHistory = [];
    this.defectHistory = [];
    this.rebateReceivedHistory = [];
    this.overpaymentReturnedHistory = [];
    this.claimAwardHistory = [];
    this.periods = [];
    this.numCompletedPeriods = 0;

    this.policyPeriodLength = 30;
  }
}
