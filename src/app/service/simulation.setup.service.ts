import {Injectable} from '@angular/core';
import {PolicyHolder} from '../model/policy-holder';
import {UserInput} from '../model/user-input';
import {ClaimType} from '../model/enum/ClaimType';
import {CoverageType} from '../model/enum/CoverageType';
import {DamageType} from '../model/enum/DamageType';
import {DefectType} from '../model/enum/DefectType';
import {ParticipationType} from '../model/enum/ParticipationType';
import {PremiumVoteType} from '../model/enum/PremiumVoteType';
import {RedemptionType} from '../model/enum/RedemptionType';
import {UnitySimulationService} from './unity.simulation.service';

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
      arrPh[chosenDefector].defectType = DefectType.Function;
      arrPh[chosenDefector].defectValue = function (simulation_service) {
        if (this.memory.defectDelay > 0) {
          this.memory.defectDelay--;
          return false;
        } else {
          return true;
        }
        // const periodLength = simulation_service.state.policyPeriodLength;
        // const periodIndex = simulation_service.state.currentPeriod;
        // const currentPeriod = simulation_service.state.periods[periodIndex];
        // if (this.damageType === DamageType.PredeterminedDamagesPerDay) {
        //   if (jStat.sum(this.damageValue.slice(periodIndex * periodLength, (periodIndex + 1) * periodLength - 1)) > 0) {
        //     return false;
        //   }
        // }
        // if (currentPeriod.tol / currentPeriod.totalPremiumPayment > Math.random() * .8 + .2) {
        //   return true;
        // }
        // return false;
      };
      arrPh[chosenDefector].memory.defectDelay = chosenDefectorsDelay[i];

    }
  }

  setDamages(arrPh: PolicyHolder[],
             periodCount: number,
             dayCount: number,
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


      for (let j = 0; j < dayCount; j++) {
        for (const ph of arrPh) {
          ph.damageValue[i * dayCount + j] = 0;
        }
        if (Math.random() < majorCatastrophe.dailyLikelihood) {
          const catastropheDamage = jStat.normal.sample(majorCatastrophe.meanDamage, majorCatastrophe.stdevDamage) * totalCoverageUnits;
          for (const ph of arrPh) {
            ph.damageValue[i * dayCount + j] += ph.coverageValue / totalCoverageUnits * catastropheDamage;
          }
        } else if (Math.random() < minorCatastrophe.dailyLikelihood) {
          const catastropheDamage = jStat.normal.sample(minorCatastrophe.meanDamage, minorCatastrophe.stdevDamage) * totalCoverageUnits;
          for (const ph of arrPh) {
            ph.damageValue[i * dayCount + j] += ph.coverageValue / totalCoverageUnits * catastropheDamage;
          }
        }
      }

      for (const ph of claimants) {
        const randomDay = Math.floor(Math.random() * dayCount);
        ph.damageValue[i * dayCount + randomDay] += ph.coverageValue / chosenClaimantsCoverage * valueOfAllClaims;
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
      ph.claimType = ClaimType.Function;
      ph.claimValue = function (simulationService: UnitySimulationService): boolean {
        let willSubmit = false;
        const myCurrentDamage = simulationService.state.accumulatedDamagesPerPH[this.id];
        const myCoverage = simulationService.state.arrCoveragePerPH[this.id];
        const policyPeriodLength = simulationService.state.policyPeriodLength;
        const currentDay = simulationService.state.currentDay - simulationService.state.currentPeriod * policyPeriodLength;
        if (myCurrentDamage > myCoverage * .5) {
          console.log(myCoverage + ' ' + myCurrentDamage);
          willSubmit = true;
        } else if (currentDay + 1 === policyPeriodLength) {
          // console.log(simulationService.state.currentDay + ' ' + simulationService.state.currentPeriod)
          willSubmit = true;
        }
        return willSubmit;
      };
    }
  }

  setRedemption(arrPh: PolicyHolder[]): void {
    for (const ph of arrPh) {
      ph.redemptionType = RedemptionType.Function;
      ph.redemptionValue = function (simulationService: UnitySimulationService): number {
        let willRedeem = true;
        const current_bxc_rate = simulationService.state.bxc.solveEtherOut_fromTokensIn(1);
        const policyPeriodLength = simulationService.state.policyPeriodLength;
        const currentDay = simulationService.state.currentDay - simulationService.state.currentPeriod * policyPeriodLength;
        if (current_bxc_rate < 1 - (.55 / policyPeriodLength * currentDay)) {
          // If the exchange rate falls below the line where payments reach a 45% rate by the end of the policy period claimants always accept a payment due to lack of confidence premiums will restore the exchange rate sufficiently enough to forgo payment (loss of confidence scenario)
          willRedeem = true;
        } else if (currentDay >= policyPeriodLength * .9 && current_bxc_rate < .9) {
          // When policy period is 90% finished, claimants will not accept an exchange rate payment of less than 90%
          willRedeem = false;
        } else if (currentDay >= policyPeriodLength * .8 && current_bxc_rate < .55) {
          // When policy period is 80% finished, claimants will not accept an exchange rate payment of less than 55%
          willRedeem = false;
        }
        if (willRedeem) {
          return simulationService.state.arrCATokensPerPH[this.id]; // Rely on the UnitySimulationService to enforce the CA redemption limit
        } else {
          return 0;
        }
      };
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

export class Catastrophe {
  dailyLikelihood: number;
  meanDamage: number;
  stdevDamage: number;

  constructor(a, b, c) {
    this.dailyLikelihood = a;
    this.meanDamage = b;
    this.stdevDamage = c;
  }
}
