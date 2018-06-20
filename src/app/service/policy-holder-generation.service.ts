import {Injectable} from '@angular/core';
import {PolicyHolder} from '../model/policy-holder';
import {UtilService} from './util.service';

declare var jStat: any;

@Injectable()
export class PolicyHolderGenerationService {

  constructor(private utilService: UtilService) { }

  generatePolicyholders(count, coverageUnitsTotal, premiumMean, premiumStdev, groupSize, tolMean, claimPercent, claimPercentStdev, defectRate) {
    const numGroups = (groupSize < 8 ? Math.floor(count / groupSize) : Math.ceil(count / groupSize));
    const subgroups = [];
    for (let i = 0; i < numGroups; i++) {
      subgroups.push([]);
    }

    // Sample from an arbitrary normal distribution to get coverage units purchased for all policyholders.
    // Force all coverage unit values to be within an order of magnitude within each other
    // Scale it to match the TUL
    let arrCoverageUnits = [];
    for (let i = 0; i < count; i++) {
      let cu_sample = jStat.normal.sample(5, 1);
      cu_sample = Math.max(Math.min(10, cu_sample), 1);
      arrCoverageUnits[i] = cu_sample;
    }
    arrCoverageUnits = jStat.multiply(arrCoverageUnits, coverageUnitsTotal / jStat.sum(arrCoverageUnits));

    const arrClaimFrequency = [];
    for (let i = 0; i < count; i++) {
      let cf_sample = jStat.normal.sample(claimPercent, claimPercentStdev);
      cf_sample = Math.max(cf_sample, 0);
      arrClaimFrequency[i] = cf_sample;
    }

    // Use tol and claim frequency to determine what % of coverage a policyholder need during the policy periods that they have a claim. Currently, a single policyholder will always have the same claim value for every policy period.ts they need a claim.
    const arrClaimValues = [];
    const totalClaimFrequency = jStat.sum(arrClaimFrequency);
    for (let i = 0; i < count; i++) {
      const claimFreqRatio = arrClaimFrequency[i] / totalClaimFrequency;
      const coverageUnitRatio = arrCoverageUnits[i] / coverageUnitsTotal;
      const tol_contribution = (claimFreqRatio + coverageUnitRatio) / 2;
      const cv = tolMean * tol_contribution / arrClaimFrequency[i];
      arrClaimValues[i] = cv > arrCoverageUnits[i] ? 1 : cv / arrCoverageUnits[i];
    }

    for (let i = 0; i < count; i++) {

      const a = arrCoverageUnits[i];
      const b = jStat.normal.sample(premiumMean, premiumStdev);
      const c = arrClaimFrequency[i];
      const d = arrClaimValues[i];
      // let e = this.jStat.normal.sample(participateDistribution.mean, participateDistribution.stdev)
      // let f = this.jStat.normal.sample(defectDistribution.mean, defectDistribution.stdev)
      const ph = new PolicyHolder(a, b, c, d, 1, 0);

      if (i < numGroups * 4) {
        subgroups[i % subgroups.length].push(ph);
      } else {
        let randomGroup = Math.floor(Math.random() * subgroups.length);
        while (subgroups[randomGroup].length > 10) {
          randomGroup = (randomGroup + 1) % numGroups;
        }
        subgroups[randomGroup].push(ph);
      }
    }

    let numDefectors = Math.floor(count * defectRate);
    const arr_ph_flat = this.utilService.flatten(subgroups); // TODO not used, and iono why
    const chosenDefectors = [];
    while (numDefectors > 0) {
      let random_ph = Math.floor(Math.random() * count);
      while (chosenDefectors.indexOf(random_ph) !== -1) {
        random_ph = (random_ph + 1) % count;
      }
      chosenDefectors.push(random_ph);
      numDefectors -= 1;
    }
    for (let i = 0; i < chosenDefectors.length; i++) {
      let iterSubgroupIndex = 0;
      let chosenDefector = chosenDefectors[i];
      while (chosenDefector >= subgroups[iterSubgroupIndex].length) {
        chosenDefector -= subgroups[iterSubgroupIndex].length;
        iterSubgroupIndex++;
      }
      subgroups[iterSubgroupIndex][chosenDefector].defectRate = .5;
    }

    return subgroups;
  }
}
