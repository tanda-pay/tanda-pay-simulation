import { PolicyHolder } from './policy-holder';

export class PolicyHolderDB {

    policyHolders: PolicyHolder[];
    policyHolderSubgroups: PolicyHolder[][];

    policyHoldersCoverageUnits: number[];
    // premiumVoteHistory: number[][];
    premiumCommittedHistory: number[][];
    overpaymentCommittedHistory: number[][];
    claimSubmittedHistory: number[][];
    defectHistory: Boolean[][];
    rebateReceivedHistory: number[][];


    constructor( policyHolders: PolicyHolder[][] ) {
        this.policyHolderSubgroups = policyHolders;
        this.policyHolders = [];
        for ( let i = 0; i < policyHolders.length; i++ ) {
            for ( let j = 0; j < policyHolders[i].length; j++ ) {
                this.policyHolders.push( policyHolders[i][j] )
            }
        }
    }
}
