import {Injectable} from '@angular/core';
import {PolicyHolder} from '../model/policy-holder';
import {UserInput} from '../model/user-input';
import {ClaimType} from '../model/enum/ClaimType';
import {CoverageType} from '../model/enum/CoverageType';
import {DamageType} from '../model/enum/DamageType';
import {DefectType} from '../model/enum/DefectType';
import {ParticipationType} from '../model/enum/ParticipationType';
import {PremiumVoteType} from '../model/enum/PremiumVoteType';

declare var jStat: any;
declare var randomWeightedSampleNoReplacement: any;

@Injectable()
export class SimulationSetupService {

  constructor() {
  }

  userInputToPolicyholders(input: UserInput): PolicyHolder[] {
    const arrPh = [];

    PolicyHolder.reset();
    const numPh = input.numPh;
    for (let i = 0; i < numPh; i++) {
      arrPh.push(new PolicyHolder());
    }

    const cuValue = input.cuValue;
    const tul = input.tul / cuValue;
    const desiredPremiumMean = input.desiredPremiumMean / cuValue;
    const desiredPremiumStdev = input.desiredPremiumStdev / cuValue;

    this.setParticipation(arrPh);
    this.setPremiumVote(arrPh, desiredPremiumMean, desiredPremiumStdev);
    this.setCoverageUnitsBought(arrPh, tul);
    this.setDamages(arrPh,
      input.numPolicyPeriods, input.policyPeriodLength,
      input.mean_Claims2TUL, input.stdev_Claims2TUL,
      input.mean_claimProportion, input.stdev_claimProportion);
    this.setDefect(arrPh, input.percentageToDefect);

    return arrPh;
  }

  setDefect(arrPh: PolicyHolder[], defectRate: number): void {
    const count = arrPh.length;
    let numDefectors = Math.floor(count * defectRate);
    const chosenDefectors = [];
    while (numDefectors > 0) {
      let random_ph = Math.floor(Math.random() * count);
      while (chosenDefectors.indexOf(random_ph) !== -1) {
        random_ph = (random_ph + 1) % count;
      }
      chosenDefectors.push(random_ph);
      numDefectors -= 1;
    }
    for (const ph of arrPh) {
      ph.defectType = DefectType.Random;
      ph.defectValue = 0;
    }
    for (let i = 0; i < chosenDefectors.length; i++) {
      const chosenDefector = chosenDefectors[i];
      arrPh[chosenDefector].defectType = DefectType.Function;
      arrPh[chosenDefector].defectValue = function (simulation_service) {
        const periodIndex = simulation_service.state.currentPeriod;
        const currentPeriod = simulation_service.state.periods[periodIndex];
        if (this.damageType === DamageType.PredeterminedDamagesPerDay) {
          if (jStat.sum(this.damageValue) > 0) {
            return false;
          }
        } else if (simulation_service.claimSubmittedHistory[periodIndex][this.id] > 0) {
          return false;
        }
        if (currentPeriod.tol / currentPeriod.totalPremiumPayment > Math.random() * .8 + .2) {
          return true;
        }
        return false;
      };
    }
  }

  setDamages(arrPh: PolicyHolder[],
             periodCount: number,
             dayCount: number,
             mean_Claims2Coverage: number, stdev_Claims2Coverage: number,
             mean_ClaimantProportion: number, stdev_ClaimantProportion: number) {

    let totalCoverageUnits = 0;
    for (const ph of arrPh) {
      totalCoverageUnits += ph.coverageValue;
      ph.damageType = DamageType.PredeterminedDamagesPerDay;
      ph.damageValue = [];
    }

    for (let i = 0; i < periodCount; i++) {
      const zScore = jStat.normal.sample(0, 1);
      const claimantCount = Math.round((mean_ClaimantProportion + (zScore * stdev_ClaimantProportion)) * arrPh.length);
      const weightMap = {};
      for (const ph of arrPh) {
        weightMap[ph.id] = Math.max(jStat.normal.sample(5, 2), 0);
      }
      const claimantIds = randomWeightedSampleNoReplacement(weightMap, claimantCount);
      const claimants = [];
      for (const id of claimantIds) {
        claimants.push(arrPh[parseInt(id, 10)]);
      }
      let chosenClaimantsCoverage = 0;
      for (const ph of claimants) {
        chosenClaimantsCoverage += ph.coverageValue;
      }
      const valueOfAllClaims = (mean_Claims2Coverage + (zScore * stdev_Claims2Coverage)) * totalCoverageUnits;

      for (let j = 0; j < dayCount; j++) {
        for (const ph of arrPh) {
          ph.damageValue[i * dayCount + j] = 0;
        }
      }
      for (const ph of claimants) {
        const randomDay = Math.floor(Math.random() * dayCount);
        ph.damageValue[i * dayCount + randomDay] = ph.coverageValue / chosenClaimantsCoverage * valueOfAllClaims;
      }
    }
  }

  setParticipation(arrPh: PolicyHolder[]): void {
    for (const ph of arrPh) {
      ph.participationType = ParticipationType.Random;
      ph.participationValue = 1;
    }
  }

  setPremiumVote(arrPh: PolicyHolder[], coverageUnitCostMean: number, CoverageUnitCostStdev: number): void {
    for (const ph of arrPh) {
      ph.premiumVoteType = PremiumVoteType.Constant;
      ph.premiumVoteValue = jStat.normal.sample(coverageUnitCostMean, CoverageUnitCostStdev);
    }
  }

  setCoverageUnitsBought(arrPh: PolicyHolder[], tul: number): void {
    const totalCoverageUnits = tul;
    let arrCoverageUnits = [];
    for (const ph of arrPh) {
      let cu_sample = jStat.normal.sample(5, .5);
      cu_sample = Math.max(Math.min(10, cu_sample), 1);
      arrCoverageUnits[ph.id] = cu_sample;
    }
    arrCoverageUnits = jStat.multiply(arrCoverageUnits, totalCoverageUnits / jStat.sum(arrCoverageUnits));

    for (const ph of arrPh) {
      ph.coverageType = CoverageType.Constant;
      ph.coverageValue = arrCoverageUnits[ph.id];
    }
  }

  generateSubgroups(arrPh: PolicyHolder[], avgGroupSize: number) {
    const numPh = arrPh.length;
    const numGroups = (avgGroupSize < 8 ? Math.floor(numPh / avgGroupSize) : Math.ceil(numPh / avgGroupSize));
    const subgroups = [];
    for (let _ = 0; _ < numGroups; _++) {
      subgroups.push([]);
    }
    let i = 0;
    for (const ph of arrPh) {
      if (i < numGroups * 4) {
        subgroups[i % subgroups.length].push(ph.id);
      } else {
        let randomGroup = Math.floor(Math.random() * subgroups.length);
        while (subgroups[randomGroup].length > 10) {
          randomGroup = (randomGroup + 1) % numGroups;
        }
        subgroups[randomGroup].push(ph.id);
      }
      i++;
    }
    return subgroups;
  }
}
