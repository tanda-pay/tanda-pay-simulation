import {Period} from './period';

export class PolicyHolder {
  coverage: number; // Coverage units purchased per period.ts
  premium: number; // Desired premium per coverage unit
  claim: number; // Probability of submitting a claim, as a number from 0 to 1
  claimVal: number; // When there is a claim, what is its proportional value compared to this.coverage
  partipationRate: number; // Inclination to participate, as a number from 0 to 1
  defectRate: number; // Inclination to defect, as a number from 0 to 1

  period: any;
  subgroup: any;

  constructor(coverage, premium, claim, claimVal, partipationRate, defectRate) {
    this.coverage = coverage;
    this.premium = premium;
    this.claim = claim;
    this.claimVal = claimVal;
    this.partipationRate = partipationRate;
    this.defectRate = defectRate;

    this.period = null;
    this.subgroup = null;
  }

  choosePremium(period: Period) {
    /*
    TODO: PolicyHolder might consider the results of previous policy periods.
    -Maybe vote for a higher premium if claims have been underpaid before
    */
    return this.premium;
  }

  chooseParticipation(period: Period) {
    /*
    TODO: PolicyHolder might consider the results of previous/current policy periods.
    -A high premium selection from the Secretary should lower chance of participation?
    -Maybe we can model a different likelihood to participate per policyholder?
    */
    return Math.random() < this.partipationRate;

  }

  chooseDefect(period: Period) {
    /*
    TODO: PolicyHolder might consider the results of previous/current policy periods.
    -High premium commitment should increase defection
    -Low rebate expectation should increase defection
    -High defection rate from fellow subgroup members should increase defection (may need to restructure code for this)
    -Maybe we can model a different likelihood to defect per policyholder?
    */
    const defect_mulitplier = 1;

    // var anticipated_rebate = Math.max(((period.ts.committedPremiums - period.ts.totalOutstandingLiability) / period.ts.committedPremiums), 0)
    // defect_multiplier *= (1 - anticipated_rebate)

    return Math.random() < (this.defectRate);
  }

  chooseClaim(period: Period) {
    /*
    TODO: PolicyHolder might consider the results of previous/current policy periods.
    -Claims should generally be made if they are likely to be greater than the value of the rebate
    -Claims cannot usefully exceed the coverage purchased by the policyholder, but we may want to model frustration that a coverage amount wasn't enough to cover damages
    -Maybe we can submit very small claims if there is a history of underpaid claims, and therefore no rebates
    -Claim likelihoods per user are not independent variables. Occurrences such as community-wide disasters could make all policyholders submit a claim for one policy period.ts.
    */
    if (Math.random() < this.claim) {
      return this.claimVal * this.coverage;
    } else {
      return 0;
    }
  }
}
