import {Injectable} from '@angular/core';
import {UtilService} from './util.service';
import {SubGroup} from '../model/sub-group';

declare var jStat: any;

@Injectable()
export class PolicyHolderGenerationService {

  constructor(private utilService: UtilService) {
  }

  generatePolicyHolders(numPH, AvgGroupSize): SubGroup[] {
    return null;
  }

  setDefect(subgroups: SubGroup[], defectPercentage): void {
  }

  setClaim(subgroups: SubGroup[], claimPercentage: number, percentageTUL2Claims: number): void {
  }

  setParticipation(subgroups: SubGroup[]): void {
  }

  setPremiumVote(subgroups: SubGroup[], coverageUnitCostMean: number, CoverageUnitCostStdev: number): void {
  }

  setCoverageUnitsBought(subgroups: SubGroup[], tul: number, coverageUnitValue: number): void {
  }
}
