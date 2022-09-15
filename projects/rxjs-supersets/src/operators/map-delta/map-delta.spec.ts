import { DeltaMap } from '../../delta-map/delta-map';
import { MapDelta } from '../../types';
import { mapDelta } from './map-delta';

type IdValue = { id: string, value: number };

const element1 = { id: 'element1', value: 1 };
const element2 = { id: 'element2', value: 2 };
const element3 = { id: 'element3', value: 3 };
const element2b = { id: 'element2', value: 4 };

describe('mapDelta', () => {
  it('should map all entries', () => {
    let results!: MapDelta<string, IdValue>;
    const test = new DeltaMap<string, IdValue>();

    const subscription = test.delta$.pipe(
      mapDelta(element => ({ id: element.id + 'm', value: element.value + 1 }))
    ).subscribe(result => results = result);

    // test adding element
    test.set(element1.id, element1);

    expect(results.added.size).toBe(1);
    expect(results.added.get('element1m')).toEqual({ id: 'element1m', value: 2 });
    expect(results.modified.size).toBe(0);
    expect(results.deleted.size).toBe(0);
    expect(results.all.size).toBe(1);

    // test adding element
    test.set(element2.id, element2);

    expect(results.added.size).toBe(1);
    expect(results.added.get('element2m')).toEqual({ id: 'element2m', value: 3 });
    expect(results.modified.size).toBe(0);
    expect(results.deleted.size).toBe(0);
    expect(results.all.size).toBe(2);

    // test adding element
    test.set(element3.id, element3);

    expect(results.added.size).toBe(1);
    expect(results.added.get('element3m')).toEqual({ id: 'element3m', value: 4 });
    expect(results.modified.size).toBe(0);
    expect(results.deleted.size).toBe(0);
    expect(results.all.size).toBe(3);

    // test updating element
    test.set(element2b.id, element2b);

    expect(results.added.size).toBe(0);
    expect(results.modified.size).toBe(1);
    expect(results.modified.get('element2m')).toEqual({ id: 'element2m', value: 5 });
    expect(results.deleted.size).toBe(0);
    expect(results.all.size).toBe(3);

    // test deleting element and adding it again
    test.delete(element1.id);

    expect(results.added.size).toBe(0);
    expect(results.modified.size).toBe(0);
    expect(results.deleted.size).toBe(1);
    expect(results.deleted.get('element1m')).toEqual({ id: 'element1m', value: 2 });
    expect(results.all.size).toBe(2);

    test.set(element1.id, element1);

    expect(results.added.size).toBe(1);
    expect(results.added.get('element1m')).toEqual({ id: 'element1m', value: 2 });
    expect(results.modified.size).toBe(0);
    expect(results.deleted.size).toBe(0);
    expect(results.all.size).toBe(3);

    // checking all results
    expect(results.all.get('element1m')).toEqual({ id: 'element1m', value: 2 });
    expect(results.all.get('element2m')).toEqual({ id: 'element2m', value: 5 });
    expect(results.all.get('element3m')).toEqual({ id: 'element3m', value: 4 });

    // test clearing all entries
    test.clear();
    expect(results.all.size).toBe(0);

    subscription.unsubscribe();
  });
});