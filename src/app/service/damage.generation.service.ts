import {Injectable} from '@angular/core';
import {PolicyHolder} from '../model/policy-holder';

import {ClaimType} from '../model/enum/ClaimType';
import {CoverageType} from '../model/enum/CoverageType';
import {ParticipationType} from '../model/enum/ParticipationType';
import {UnityState} from '../model/unity-state';

declare var jStat: any;
declare var randomWeightedSampleNoReplacement: any;

@Injectable()
export class DamageGenerationService {

  constructor() {
  }


  generateDamagesPerDay(arrPh: PolicyHolder[],
                        arrPhCoverage: number[],
                        dayCount: number,
                        periodCount: number,
                        mean_ClaimantProportion: number, stdev_ClaimantProportion: number,
                        mean_Claims2Coverage: number, stdev_Claims2Coverage: number) {

    let totalCoverageUnits = 0;
    for (const ph of arrPh) {
      totalCoverageUnits += ph.coverageValue;
    }

    const arrDamagesPerDayPerPH = [];

    for (let i = 0; i < periodCount; i++) {
      const zScore = jStat.normal.sample(0, 1);
      const claimantCount = Math.round((mean_ClaimantProportion + (zScore * stdev_ClaimantProportion)) * arrPh.length);
      const weightMap = {};
      for (const ph of arrPh) {
        weightMap[ph.id] = ph.claimValue[0];
      }
      const claimants = randomWeightedSampleNoReplacement(weightMap, claimantCount);
      let chosenClaimantsCoverage = 0;
      for (const ph_id of claimants) {
        chosenClaimantsCoverage += arrPhCoverage[parseInt(ph_id, 10)];
      }
      const valueOfAllClaims = (mean_Claims2Coverage + (zScore * stdev_Claims2Coverage)) * totalCoverageUnits;

      for (let j = 0; j < dayCount; j++) {
        arrDamagesPerDayPerPH.push([]);
        for (const ph of arrPh) {
          arrDamagesPerDayPerPH[i * dayCount + j][ph.id] = 0;
        }
      }
      for (const ph of arrPh) {
        const randomDay = Math.floor(Math.random() * dayCount);
        arrDamagesPerDayPerPH[i * dayCount + randomDay][ph.id] = Math.min((ph.coverageValue / chosenClaimantsCoverage * valueOfAllClaims), 1);
      }

    }

    return arrDamagesPerDayPerPH;
  }

}
