import { DeltaMap } from '../../delta-map/delta-map';
import { MapDelta } from '../../types';

import { filterDelta } from './filter-delta';

type IdValue = { id: string, value: number };

const element1 = { id: 'element1', value: 1 };
const element2 = { id: 'element2', value: 2 };
const element2b = { id: 'element2', value: 1 };
const element3 = { id: 'element3', value: 3 };
const element4 = { id: 'element4', value: 4 };

describe('filterDelta', () => {
  it('should filter all entries', () => {
    let results!: MapDelta<string, IdValue>;
    let updated = false;
    const test = new DeltaMap<string, IdValue>();

    const subscription = test.delta$.pipe(
      filterDelta(element => element.value % 2 === 0)
    ).subscribe(result => {
      results = result;
      updated = true;
    });

    // test adding element
    test.set(element1.id, element1);

    expect(updated).toBe(false); // filter fails

    // test adding element
    updated = false;
    test.set(element2.id, element2);

    expect(updated).toBe(true);
    expect(results.created.size).toBe(1);
    expect(results.created.get('element2')).toBeDefined();
    expect(results.updated.size).toBe(0);
    expect(results.deleted.size).toBe(0);
    expect(results.all.size).toBe(1);

    // test adding element
    updated = false;
    test.set(element3.id, element3);

    expect(updated).toBe(false); // filter fails

    // test adding element
    updated = false;
    test.set(element4.id, element4);

    expect(updated).toBe(true);
    expect(results.created.size).toBe(1);
    expect(results.created.get('element4')).toBeDefined();
    expect(results.updated.size).toBe(0);
    expect(results.deleted.size).toBe(0);
    expect(results.all.size).toBe(2);

    // test updating element (and removing it, because of the filter)
    updated = false;
    test.set(element2b.id, element2b);

    expect(updated).toBe(true);
    expect(results.created.size).toBe(0);
    expect(results.updated.size).toBe(0);
    expect(results.deleted.size).toBe(1);
    expect(results.deleted.get('element2')).toEqual({ id: 'element2', value: 2 });
    expect(results.all.size).toBe(1);

    // test updating
    test.set(element2.id, element2); // adding again
    updated = false;
    test.set(element2.id, element2); // updating

    expect(updated).toBe(true);
    expect(results.created.size).toBe(0);
    expect(results.updated.size).toBe(1);
    expect(results.updated.get('element2')).toBeDefined();
    expect(results.deleted.size).toBe(0);
    expect(results.all.size).toBe(2);

    // test deleting element and adding it again
    updated = false;
    test.delete(element4.id);

    expect(updated).toBe(true);
    expect(results.created.size).toBe(0);
    expect(results.updated.size).toBe(0);
    expect(results.deleted.size).toBe(1);
    expect(results.deleted.get('element4')).toBeDefined();
    expect(results.all.size).toBe(1);

    updated = false;
    test.set(element4.id, element4);

    expect(updated).toBe(true);
    expect(results.created.size).toBe(1);
    expect(results.created.get('element4')).toBeDefined();
    expect(results.updated.size).toBe(0);
    expect(results.deleted.size).toBe(0);
    expect(results.all.size).toBe(2);

    // test clearing all entries
    updated = false;
    test.clear();

    expect(updated).toBe(true);
    expect(results.all.size).toBe(0);

    subscription.unsubscribe();
  });
});