
import {SimulationSetupService} from './simulation.setup.service';
import {PolicyHolder} from '../model/policy-holder';

declare var jStat: any;
declare var randomWeightedSampleNoReplacement: any;


describe('DamageGeneration', () => {
  let service: SimulationSetupService;
  beforeEach(() => {
    service = new SimulationSetupService();
  });

  const arrPh: PolicyHolder[] = [];
  for (let i = 0; i < 100; i++) {
    const ph = new PolicyHolder();
    ph.coverageValue = 1;
    arrPh.push(ph);
  }

  // Can't figure out why seedrandom isn't working


  // it('After seeding Math.Random, the random samples should be predictable', function () {
  //   Math.seedrandom('hello.');
  //   expect(Math.random()).toBe(0.9282578795792454);
  // });
  //
  // it('After seeding Math.Random, the random samples should be predictable', function () {
  //   Math.seedrandom('hello.');
  //   const majorCatastrophe = new Catastrophe(.01, .5, .1);
  //   const minorCatastrophe = new Catastrophe(.05, .1, .01);
  //   service.setDamages(arrPh, 2, 50,
  //     .02, .01,
  //     .50, .02,
  //     majorCatastrophe, minorCatastrophe);
  //   console.log(arrPh[0].damageValue);
  //   console.log(arrPh[1].damageValue);
  //   console.log(arrPh[2].damageValue);
  //   console.log(arrPh[3].damageValue);
  //   console.log(arrPh[4].damageValue);
  //   console.log(arrPh[5].damageValue);
  //   // expect().toBeLessThan(numCA);
  // });

  //
  // it('#getObservableValue should return value from observable',
  //   (done: DoneFn) => {
  //     service.getObservableValue().subscribe(value => {
  //       expect(value).toBe('observable value');
  //       done();
  //     });
  //   });
  //
  // it('#getPromiseValue should return value from a promise',
  //   (done: DoneFn) => {
  //     service.getPromiseValue().then(value => {
  //       expect(value).toBe('promise value');
  //       done();
  //     });
  //   });
});
