import { Injectable } from '@angular/core';
import { Period } from '../model/period';
import { PolicyHolder } from '../model/policy-holder';
import { PolicyHolderDB } from '../model/policy-holder-database';

declare var jStat: any;

@Injectable()
export class SimulationService {

    constructor() {
    }

    simulateNextPolicyPeriod( subGroups: PolicyHolderDB, periods: Period[] ): Period {
        const nextPeriod = new Period();
        this.simulateDefectSubGroups( subGroups, periods, nextPeriod );
        // TODO other methods

        return nextPeriod;
    }



    simulateDefectSubGroups( subGroups: PolicyHolderDB, periods: Period[], nextPeriod: Period ) {
        //Maw comment: this should be low priority
        let curSubGroup: Number;
        let curPolicyHolder: PolicyHolder;

        //    for (let i = 0; i < subGroups.length; i++) {
        //      curSubGroup = subGroups[i];
        //      curSubGroupStuff = nextPeriod.subGroupStuffs[i];
        //
        //      for (let j = 0; j < curSubGroup.policyHolders.length; j++) {
        //        curPolicyHolder = curSubGroup.policyHolders[j];
        //        curPolicyHolderStuff = curSubGroupStuff.policyHolderStuffs[j];
        //
        //        const choseToDefect = this.simulateDefectPolicyHolder(curPolicyHolder, periods);
        //        // TODO maybe have also call simulateClaim... here? if so prob move all this into simulateNextPolicyPeriod()
        //      }

        // do post logic
        //}

        // do post logic
    }

    simulateDefectPolicyHolder( policyHolder: PolicyHolder, periods: Period[] ): boolean {
        return false;
    }

    // TODO add other methods
}
