import {Injectable} from '@angular/core';
import {PolicyHolder} from '../model/policy-holder';
import {ClaimType, CoverageType, DamageType, DefectType, ParticipationType, PremiumVoteType, RedemptionType} from '../model/policy-holder';
import {UserInput} from '../model/user-input';
import {UnitySimulationService} from './unity.simulation.service';

declare var jStat: any;
declare var randomWeightedSampleNoReplacement: any;

@Injectable()
export class SimulationSetupService {

  constructor() {
  }

  processUserInput(input: UserInput): PolicyHolder[] {
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

    const majorCatastrophe = new Catastrophe(input.majorCatastropheLikelihood, input.majorCatastropheMeanDamage, input.majorCatastropheStdevDamage);
    const minorCatastrophe = new Catastrophe(input.minorCatastropheLikelihood, input.minorCatastropheMeanDamage, input.minorCatastropheStdevDamage);

    this.setParticipation(arrPh);
    this.setPremiumVote(arrPh, desiredPremiumMean, desiredPremiumStdev);
    this.setCoverageUnitsBought(arrPh, tul);
    this.setClaimSubmission(arrPh);
    this.setDamages(arrPh,
      input.numPolicyPeriods, input.policyPeriodLength,
      input.mean_Claims2TUL, input.stdev_Claims2TUL,
      input.mean_claimProportion, input.stdev_claimProportion,
      majorCatastrophe, minorCatastrophe);
    this.setRedemption(arrPh);
    this.setDefect(arrPh, input.percentageToDefect, input.defectorCapPerPeriod);

    return arrPh;
  }

  setDefect(arrPh: PolicyHolder[], defectRate: number, defectorCapPerPeriod: number): void {
    const count = arrPh.length;
    let numDefectors = Math.floor(count * defectRate);
    const chosenDefectors = [];

    const chosenDefectorsDelay: number[] = [];
    let defectorDelay = 0;
    let defectorDelayAssigned = 0;

    while (numDefectors > 0) {
      if (defectorDelayAssigned >= defectorCapPerPeriod) {
        defectorDelay++;
        defectorDelayAssigned = 0;
      }
      defectorDelayAssigned++;
      let random_ph = Math.floor(Math.random() * count);
      while (chosenDefectors.indexOf(random_ph) !== -1) {
        random_ph = (random_ph + 1) % count;
      }
      chosenDefectors.push(random_ph);
      chosenDefectorsDelay.push(defectorDelay);
      numDefectors -= 1;
    }
    for (const ph of arrPh) {
      ph.defectType = DefectType.Random;
      ph.defectValue = 0;
    }
    for (let i = 0; i < chosenDefectors.length; i++) {
      const chosenDefector = chosenDefectors[i];
      arrPh[chosenDefector].defectType = DefectType.DefectAfterTimeElapsed;
      arrPh[chosenDefector].defectValue = chosenDefectorsDelay[i];
    }
  }

  setDamages(arrPh: PolicyHolder[],
             periodCount: number,
             periodLength: number,
             mean_Claims2Coverage: number, stdev_Claims2Coverage: number,
             mean_ClaimantProportion: number, stdev_ClaimantProportion: number,
             majorCatastrophe: Catastrophe,
             minorCatastrophe: Catastrophe
  ) {

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

      for (let j = 0; j < periodLength; j++) {
        for (const ph of arrPh) {
          ph.damageValue[i * periodLength + j] = 0;
        }
        if (Math.random() < majorCatastrophe.likelihood) {
          const catastropheDamage = jStat.normal.sample(majorCatastrophe.meanDamage, majorCatastrophe.stdevDamage) * totalCoverageUnits;
          for (const ph of arrPh) {
            ph.damageValue[i * periodLength + j] += ph.coverageValue / totalCoverageUnits * catastropheDamage;
          }
        } else if (Math.random() < minorCatastrophe.likelihood) {
          const catastropheDamage = jStat.normal.sample(minorCatastrophe.meanDamage, minorCatastrophe.stdevDamage) * totalCoverageUnits;
          for (const ph of arrPh) {
            ph.damageValue[i * periodLength + j] += ph.coverageValue / totalCoverageUnits * catastropheDamage;
          }
        }
      }

      for (const ph of claimants) {
        const randomDay = Math.floor(Math.random() * periodLength);
        ph.damageValue[i * periodLength + randomDay] += ph.coverageValue / chosenClaimantsCoverage * valueOfAllClaims;
      }

    }
  }

  //
  setDamages_2(arrPh: PolicyHolder[],
               periodCount: number,
               dayCount: number,
               mean_Claims2Coverage: number, stdev_Claims2Coverage: number,
               likelihood_damagePerDay: number,
               majorCatastrophe: Catastrophe,
               minorCatastrophe: Catastrophe
  ) {

    let totalCoverageUnits = 0;
    for (const ph of arrPh) {
      totalCoverageUnits += ph.coverageValue;
      ph.damageType = DamageType.PredeterminedDamagesPerDay;
      ph.damageValue = [];
      for (let i = 0; i < periodCount * dayCount; i++) {
        let damage = 0;
        if (Math.random() < likelihood_damagePerDay) {
          damage = jStat.normal.sample(mean_Claims2Coverage, stdev_Claims2Coverage);
          // Resample if out of bounds, the resulting data can be modeled by a truncated-normal-distribution
          let retries = 5;
          while (damage < 0 || damage > 1) {
            if (retries < 0) {
              damage = Math.max(damage, 0);
              damage = Math.min(damage, 1);
            }
            damage = jStat.normal.sample(mean_Claims2Coverage, stdev_Claims2Coverage);
            retries--;
          }
        }
        ph.damageValue[i] = damage;
      }
    }

    for (let p = 0; p < periodCount; p++) {
      if (Math.random() < majorCatastrophe.likelihood) {
        const catastropheDay = Math.floor(Math.random() * dayCount) + (p * dayCount);
        for (const ph of arrPh) {
          ph.damageValue[catastropheDay] += majorCatastrophe.meanDamage;
        }
      } else if (Math.random() < minorCatastrophe.likelihood) {
        const catastropheDay = Math.floor(Math.random() * dayCount) + (p * dayCount);
        for (const ph of arrPh) {
          ph.damageValue[catastropheDay] += minorCatastrophe.meanDamage;
        }
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

  setClaimSubmission(arrPh: PolicyHolder[]) {
    for (const ph of arrPh) {
      ph.claimType = ClaimType.Strategy;
    }
  }

  setRedemption(arrPh: PolicyHolder[]): void {
    for (const ph of arrPh) {
      ph.redemptionType = RedemptionType.Strategy;
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
      ph.coverageValue = tul / arrPh.length;
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

export class Catastrophe {
  likelihood: number;
  meanDamage: number;
  stdevDamage: number;

  constructor(a, b, c) {
    this.likelihood = a;
    this.meanDamage = b;
    this.stdevDamage = c;
  }
}
