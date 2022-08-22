import { DeltaMap } from '../../delta-map/delta-map';
import { IdObject } from '../../types';

import {tapDelta} from './tap-delta';

const element1 = { id: 'element1' };
const element2 = { id: 'element2' };
const element3 = { id: 'element3' };

describe('tapDelta', () => {
  it('should call the handler functions in the correct order if they are defined', () => {
    let results: string[] = [];
    const test = new DeltaMap<string, IdObject>();

    const subscription = test.delta$.pipe(tapDelta({
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