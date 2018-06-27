import {PolicyHolder} from './policy-holder';

export class PolicyHolderDB {

  policyHolders: PolicyHolder[];
  policyHolderSubgroups: PolicyHolder[][];

  premiumVoteHistory: number[][];
  chosenPremiumHistory: number[];
  purchasedCoverageHistory: number[][];
  premiumCommittedHistory: number[][];
  overpaymentCommittedHistory: number[][];
  claimSubmittedHistory: number[][];
  defectHistory: Boolean[][];
  rebateReceivedHistory: number[][];
  overpaymentReturnedHistory: number[][];
  claimAwardHistory: number[][];

  constructor(policyHolders: PolicyHolder[][]) {
    this.policyHolderSubgroups = policyHolders;
    this.policyHolders = [];
    for (let i = 0; i < policyHolders.length; i++) {
      for (let j = 0; j < policyHolders[i].length; j++) {
        this.policyHolders.push(policyHolders[i][j]);
      }
    }
    this.premiumVoteHistory = [];
    this.chosenPremiumHistory = [];
    this.purchasedCoverageHistory = [];
    this.premiumCommittedHistory = [];
    this.overpaymentCommittedHistory = [];
    this.claimSubmittedHistory = [];
    this.defectHistory = [];
    this.rebateReceivedHistory = [];
    this.overpaymentReturnedHistory = [];
    this.claimAwardHistory = [];
  }
}
