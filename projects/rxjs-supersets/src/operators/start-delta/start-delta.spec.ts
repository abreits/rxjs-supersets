import { DeltaMap } from '../../delta-map/delta-map';
import { IdObject, MapDelta } from '../../types';

import {startDelta} from './start-delta';

const element1 = { id: 'element1' };
const element2 = { id: 'element2' };
const element3 = { id: 'element3' };

describe('startDelta', () => {
  it('should change the mapDelta.created property to the whole set for the first mapDelta', () => {
    let results: MapDelta<string, IdObject>[] = [];
    const test = new DeltaMap<string, IdObject>();

    test.set(element1.id, element1);
    test.set(element2.id, element2);

    const subscription = test.delta$.pipe(startDelta()).subscribe(result => results.push(result));

    expect(results.length).toBe(1);
    expect(results[0].created.size).toBe(2);

    results = [];
    test.set(element3.id, element3);

    expect(results.length).toBe(1);
    expect(results[0].created.size).toBe(1);

    subscription.unsubscribe();
  });
});