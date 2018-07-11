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
  function test_solveEtherSupply_fromExchangeRatio(b: BancorContract, exchangeRatio: number) {
    const targetEth = b.solveEtherSupply_fromExchangeRatio(exchangeRatio);
    it('A BXC with CA and weight (' + [b.CA, b.weight] + ') needs ' + targetEth + ' ETH to have a payout ratio of ' + exchangeRatio, function () {
      expect(targetEth).toBeGreaterThan(exchangeRatio);
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
  for (let i = 3; i <= 400; i++) {
    bxc.CA = i;
    test_solveEtherSupply_fromExchangeRatio(bxc, 1);
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
