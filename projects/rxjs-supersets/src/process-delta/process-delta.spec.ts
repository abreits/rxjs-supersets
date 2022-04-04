import { DeltaMap } from '../delta-map/delta-map';
import { IdObject, MapDelta } from '../types';

import {processDelta} from './process-delta';

const entry1 = { id: 'entry1' };
const entry2 = { id: 'entry2' };
const entry3 = { id: 'entry3' };

describe('processDelta', () => {
  it('should change the mapDelta.created property to the whole set for the first mapDelta', () => {
    let results: MapDelta<string, IdObject>[] = [];
    const test = new DeltaMap<string, IdObject>();

    test.set(entry1.id, entry1);
    test.set(entry2.id, entry2);

    const subscription = test.delta$.pipe(processDelta()).subscribe(result => results.push(result));

    expect(results.length).toBe(1);
    expect(results[0].created.size).toBe(2);

    results = [];
    test.set(entry3.id, entry3);

    expect(results.length).toBe(1);
    expect(results[0].created.size).toBe(1);

    subscription.unsubscribe();
  });

  it('should call the handler functions in the correct order if they are defined', () => {
    let results: string[] = [];
    const test = new DeltaMap<string, IdObject>();

    const subscription = test.delta$.pipe(processDelta({
      create: entry => results.push(`add:${entry.id}`),
      delete: entry => results.push(`delete:${entry.id}`),
      update: entry => results.push(`modify:${entry.id}`),
      before: () => results.push('before'),
      after: () => results.push('after')
    })).subscribe();

    test.set(entry1.id, entry1);
    test.set(entry2.id, entry2);
    results = [];

    test.pauseDelta();
    test.set(entry2.id, entry2);
    test.set(entry3.id, entry3);
    test.delete(entry1.id);
    test.resumeDelta();

    expect(results).toEqual(['before','delete:entry1','modify:entry2','add:entry3', 'after']);

    subscription.unsubscribe();
  });
});