import {Injectable} from '@angular/core';
import {UtilService} from './util.service';
import {PolicyHolder} from '../model/policy-holder';
import {SimulationDatabase} from '../model/simulation-database';
import {UserInput} from '../model/user-input';
import {ClaimType} from '../model/enum/ClaimType';
import {CoverageType} from '../model/enum/CoverageType';
import {DefectType} from '../model/enum/DefectType';
import {ParticipationType} from '../model/enum/ParticipationType';
import {PremiumVoteType} from '../model/enum/PremiumVoteType';

declare var jStat: any;

@Injectable()
export class SimulationSetupService {

  constructor(private utilService: UtilService) {
  }

  userInputToDB(userInput: UserInput): SimulationDatabase {
    const numPH = userInput.numPH;
    const avgGroupSize = userInput.avgGroupSize;
    const cuValue = userInput.cuValue;
    const tul = userInput.tul / cuValue;
    const desiredPremiumMean = userInput.desiredPremiumMean / cuValue;
    const desiredPremiumStdev = userInput.desiredPremiumStdev / cuValue;

    const probabilityToDefect = userInput.percentageToDefect;
    const mean_Claims2TUL = userInput.mean_Claims2TUL;
    const stdev_Claims2TUL = userInput.stdev_Claims2TUL;
    const probabilityOpenClaimMean = userInput.mean_claimProportion;
    const probabilityOpenClaimStdev = userInput.stdev_claimProportion;

    const db = this.initializeDB(numPH, avgGroupSize);
    db.cuValue = userInput.cuValue;
    this.setParticipation(db);
    this.setPremiumVote(db, desiredPremiumMean, desiredPremiumStdev);
    this.setCoverageUnitsBought(db, tul);
    this.setClaim(db, probabilityOpenClaimMean, probabilityOpenClaimStdev, tul, cuValue, userInput.mean_Claims2TUL);
    this.setDefect(db, probabilityToDefect);
    db.mean_Claims2TUL = userInput.mean_Claims2TUL;
    db.stdev_Claims2TUL = userInput.stdev_Claims2TUL;
    db.mean_ClaimantProportion = userInput.mean_claimProportion;
    db.stdev_ClaimantProportion = userInput.stdev_claimProportion;
    return db;
  }

  initializeDB(numPH, AvgGroupSize): SimulationDatabase {
    PolicyHolder.reset();
    const numGroups = (AvgGroupSize < 8 ? Math.floor(numPH / AvgGroupSize) : Math.ceil(numPH / AvgGroupSize));
    const subgroups = [];
    for (let i = 0; i < numGroups; i++) {
      subgroups.push([]);
    }
    for (let i = 0; i < numPH; i++) {
      const ph = new PolicyHolder();
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
    return new SimulationDatabase(subgroups);
  }

  setDefect(db: SimulationDatabase, defectRate): void {
    const count = db.policyHolders.length;
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
    for (let i = 0; i < db.policyHolders.length; i++) {
      db.policyHolders[i].defectType = DefectType.Random;
      db.policyHolders[i].defectValue = 0;
    }
    for (let i = 0; i < chosenDefectors.length; i++) {
      const chosenDefector = chosenDefectors[i];
      db.policyHolders[chosenDefector].defectType = DefectType.Function;
      db.policyHolders[chosenDefector].defectValue = function (db_in) {
        const periodIndex = db_in.numCompletedPeriods;
        const currentPeriod = db_in.periods[periodIndex];
        if (db_in.claimSubmittedHistory[periodIndex][this.id] > 0) {
          return false;
        }
        if (currentPeriod.tol / currentPeriod.totalPremiumPayment > Math.random() * .8 + .2) {
          return true;
        }
        return false;
      };
    }
  }

  setClaim(db: SimulationDatabase, claimRate: number, claimProbabilityStdev: number, tul: number, coverageUnitValue: number, ratioTUL2Claims: number): void {
    const count = db.policyHolders.length;

    const arrClaimFrequency = [];
    for (let i = 0; i < count; i++) {
      let cf_sample = jStat.normal.sample(claimRate, claimProbabilityStdev);
      cf_sample = Math.max(cf_sample, 0);
      arrClaimFrequency[i] = cf_sample;
    }

    const totalClaimFrequency = jStat.sum(arrClaimFrequency);

    const coverageUnitsTotal = tul / coverageUnitValue;
    const tolmean = coverageUnitsTotal * ratioTUL2Claims;

    for (let i = 0; i < count; i++) {
      const claimFreqRatio = arrClaimFrequency[i] / totalClaimFrequency;
      const coverageUnitRatio = db.policyHolders[i].coverageValue / coverageUnitsTotal;
      const tol_contribution = coverageUnitRatio;

      const cv = tolmean * tol_contribution / arrClaimFrequency[i];
      let cv_ratio = 1;
      if (cv <= db.policyHolders[i].coverageValue) {
        cv_ratio = cv / db.policyHolders[i].coverageValue;
      }
      db.policyHolders[i].claimType = ClaimType.LikelihoodAndClaimAmount;
      db.policyHolders[i].claimValue = [arrClaimFrequency[i], cv_ratio];
    }
  }

  setParticipation(db: SimulationDatabase): void {
    for (let i = 0; i < db.policyHolders.length; i++) {
      db.policyHolders[i].participationType = ParticipationType.Random;
      db.policyHolders[i].participationValue = 1;
    }
  }

  setPremiumVote(db: SimulationDatabase, coverageUnitCostMean: number, CoverageUnitCostStdev: number): void {
    for (let i = 0; i < db.policyHolders.length; i++) {
      db.policyHolders[i].premiumVoteType = PremiumVoteType.Constant;
      db.policyHolders[i].premiumVoteValue = jStat.normal.sample(coverageUnitCostMean, CoverageUnitCostStdev);
    }
  }

  setCoverageUnitsBought(db: SimulationDatabase, tul: number): void {
    const totalCoverageUnits = tul;
    let arrCoverageUnits = [];
    for (let i = 0; i < db.policyHolders.length; i++) {
      let cu_sample = jStat.normal.sample(5, .5);
      cu_sample = Math.max(Math.min(10, cu_sample), 1);
      arrCoverageUnits[i] = cu_sample;
    }
    arrCoverageUnits = jStat.multiply(arrCoverageUnits, totalCoverageUnits / jStat.sum(arrCoverageUnits));

    for (let i = 0; i < db.policyHolders.length; i++) {
      db.policyHolders[i].coverageType = CoverageType.Constant;
      db.policyHolders[i].coverageValue = arrCoverageUnits[i];
    }
  }

}
