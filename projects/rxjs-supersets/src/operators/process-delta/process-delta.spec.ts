import { DeltaMap } from '../../delta-map/delta-map';
import { IdObject, MapDelta } from '../../types';

import {processDelta} from './process-delta';

const element1 = { id: 'element1' };
const element2 = { id: 'element2' };
const element3 = { id: 'element3' };

describe('processDelta', () => {
  it('should change the mapDelta.created property to the whole set for the first mapDelta', () => {
    let results: MapDelta<string, IdObject>[] = [];
    const test = new DeltaMap<string, IdObject>();

    test.set(element1.id, element1);
    test.set(element2.id, element2);

    const subscription = test.delta$.pipe(processDelta()).subscribe(result => results.push(result));

    expect(results.length).toBe(1);
    expect(results[0].created.size).toBe(2);

    results = [];
    test.set(element3.id, element3);

    expect(results.length).toBe(1);
    expect(results[0].created.size).toBe(1);

    subscription.unsubscribe();
  });

  it('should call the handler functions in the correct order if they are defined', () => {
    let results: string[] = [];
    const test = new DeltaMap<string, IdObject>();

    const subscription = test.delta$.pipe(processDelta({
      create: element => results.push(`add:${element.id}`),
      delete: element => results.push(`delete:${element.id}`),
      update: element => results.push(`modify:${element.id}`),
      before: () => results.push('before'),
      after: () => results.push('after')
    })).subscribe();

    test.set(element1.id, element1);
    test.set(element2.id, element2);
    results = [];

    test.pauseDelta();
    test.set(element2.id, element2);
    test.set(element3.id, element3);
    test.delete(element1.id);
    test.resumeDelta();

    expect(results).toEqual(['before','delete:element1','modify:element2','add:element3', 'after']);

    subscription.unsubscribe();
  });
});