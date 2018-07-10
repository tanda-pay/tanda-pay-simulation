import {BancorContract, UnitySimulationService} from './unity.simulation.service';

describe('BancorContract', () => {
  let service: UnitySimulationService;
  let bxc: BancorContract;
  beforeEach(() => { service = new UnitySimulationService(); });

  function test_solveEtherOut_fromTokensIn(b: BancorContract, numCA: number) {
    const ethOut = b.solveEtherOut_fromTokensIn(numCA);
    it('A BXC with ETH, CA, and weight (' + [b.ETH, b.CA, b.weight] + ') returns ' + ethOut + ' ETH when ' + numCA + ' claim award tokens are redeemed', function () {
        expect(ethOut).toBeLessThan(numCA);
    });
  }
  const initialEth = 200;
  const initialCA = 400;
  const initialWeight = .5;
  bxc = new BancorContract(initialEth, initialCA, initialWeight);
  test_solveEtherOut_fromTokensIn(bxc, .5);
  for (let i = 1; i <= 400; i++) {
    test_solveEtherOut_fromTokensIn(bxc, i);
  }
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
