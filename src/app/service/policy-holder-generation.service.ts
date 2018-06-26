import { Injectable } from '@angular/core';
import { UtilService } from './util.service';
import { PolicyHolder } from '../model/policy-holder';
import { PolicyHolderDB } from '../model/policy-holder-database';
import { ClaimType } from '../model/enum/ClaimType';
import { CoverageType } from '../model/enum/CoverageType';
import { DefectType } from '../model/enum/DefectType';
import { ParticipationType } from '../model/enum/ParticipationType';
import { PremiumVoteType } from '../model/enum/PremiumVoteType';

declare var jStat: any;

@Injectable()
export class PolicyHolderGenerationService {

  constructor( private utilService: UtilService ) {
  }

  generatePolicyHolders( numPH, AvgGroupSize ): PolicyHolderDB {
    PolicyHolder.reset()
    var numGroups = ( AvgGroupSize < 8 ? Math.floor( numPH / AvgGroupSize ) : Math.ceil( numPH / AvgGroupSize ) )
    var subgroups = []
    for ( var i = 0; i < numGroups; i++ ) {
      subgroups.push( [] )
    }
    for ( let i = 0; i < numPH; i++ ) {
      var ph = new PolicyHolder();
      if ( i < numGroups * 4 ) {
        subgroups[i % subgroups.length].push( ph )
      } else {
        let randomGroup = Math.floor( Math.random() * subgroups.length )
        while ( subgroups[randomGroup].length > 10 ) {
          randomGroup = ( randomGroup + 1 ) % numGroups
        }
        subgroups[randomGroup].push( ph )
      }
    }
    return new PolicyHolderDB( subgroups );
  }

  setDefect( db: PolicyHolderDB, defectPercentage ): void {
    var count = db.policyHolders.length
    var numDefectors = Math.floor( count * defectPercentage )
    var chosenDefectors = []
    while ( numDefectors > 0 ) {
      let random_ph = Math.floor( Math.random() * count )
      while ( chosenDefectors.indexOf( random_ph ) != -1 ) {
        random_ph = ( random_ph + 1 ) % count
      }
      chosenDefectors.push( random_ph )
      numDefectors -= 1
    }
    for ( let i = 0; i < db.policyHolders.length; i++ ) {
      db.policyHolders[i].defectType = DefectType.Random
      db.policyHolders[i].defectValue = 0
    }
    for ( let i = 0; i < chosenDefectors.length; i++ ) {
      let chosenDefector = chosenDefectors[i]
      db.policyHolders[chosenDefector].defectType = DefectType.Random
      db.policyHolders[chosenDefector].defectValue = .5
    }
  }

  setClaim( db: PolicyHolderDB, claimPercentage: number, claimPercentageStdev: number, tul: number, coverageUnitValue: number, percentageTUL2Claims: number ): void {
    var count = db.policyHolders.length

    var arrClaimFrequency = []
    for ( let i = 0; i < count; i++ ) {
      let cf_sample = jStat.normal.sample( claimPercentage, claimPercentageStdev )
      cf_sample = Math.max( cf_sample, 0 )
      arrClaimFrequency[i] = cf_sample
    }

    var totalClaimFrequency = jStat.sum( arrClaimFrequency )

    var coverageUnitsTotal = tul / coverageUnitValue
    var tolmean = coverageUnitsTotal * percentageTUL2Claims

    for ( let i = 0; i < count; i++ ) {
      let claimFreqRatio = arrClaimFrequency[i] / totalClaimFrequency
      let coverageUnitRatio = db.policyHolders[i].coverageValue / coverageUnitsTotal
      let tol_contribution = ( claimFreqRatio + coverageUnitRatio ) / 2

      let cv = tolmean * tol_contribution / arrClaimFrequency[i]
      var cv_ratio = 1
      if ( cv <= db.policyHolders[i].coverageValue ) {
        cv_ratio = cv / db.policyHolders[i].coverageValue
      }
      db.policyHolders[i].claimType = ClaimType.LikelihoodAndClaimAmount
      db.policyHolders[i].claimValue = [arrClaimFrequency[i], cv_ratio]
    }
  }

  setParticipation( db: PolicyHolderDB ): void {
    for ( let i = 0; i < db.policyHolders.length; i++ ) {
      db.policyHolders[i].participationType = ParticipationType.Random
      db.policyHolders[i].participationValue = 1
    }
  }

  setPremiumVote( db: PolicyHolderDB, coverageUnitCostMean: number, CoverageUnitCostStdev: number ): void {
    for ( let i = 0; i < db.policyHolders.length; i++ ) {
      db.policyHolders[i].premiumVoteType = PremiumVoteType.Constant
      db.policyHolders[i].premiumVoteValue = jStat.normal.sample( coverageUnitCostMean, CoverageUnitCostStdev )
    }
  }

  setCoverageUnitsBought( db: PolicyHolderDB, tul: number, coverageUnitValue: number ): void {
    var totalCoverageUnits = tul / coverageUnitValue
    var arrCoverageUnits = []
    for ( let i = 0; i < db.policyHolders.length; i++ ) {
      var cu_sample = jStat.normal.sample( 5, 1 )
      cu_sample = Math.max( Math.min( 10, cu_sample ), 1 )
      arrCoverageUnits[i] = cu_sample
    }
    arrCoverageUnits = jStat.multiply( arrCoverageUnits, totalCoverageUnits / jStat.sum( arrCoverageUnits ) )

    for ( let i = 0; i < db.policyHolders.length; i++ ) {
      db.policyHolders[i].coverageType = CoverageType.Constant
      db.policyHolders[i].coverageValue = arrCoverageUnits[i]
    }
  }

}
