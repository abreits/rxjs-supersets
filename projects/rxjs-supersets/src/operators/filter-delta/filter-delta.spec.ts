import { tap } from 'rxjs/operators';

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
    let received = false;
    let updated = false;
    const test = new DeltaMap<string, IdValue>();

    const subscription = test.delta$.pipe(
      tap(() => received = true),
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
    expect(results.added.size).toBe(1);
    expect(results.added.get('element2')).toBeDefined();
    expect(results.modified.size).toBe(0);
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
    expect(results.added.size).toBe(1);
    expect(results.added.get('element4')).toBeDefined();
    expect(results.modified.size).toBe(0);
    expect(results.deleted.size).toBe(0);
    expect(results.all.size).toBe(2);

    // test updating element (and removing it, because of the filter)
    updated = false;
    test.set(element2b.id, element2b);

    expect(updated).toBe(true);
    expect(results.added.size).toBe(0);
    expect(results.modified.size).toBe(0);
    expect(results.deleted.size).toBe(1);
    expect(results.deleted.get('element2')).toEqual({ id: 'element2', value: 2 });
    expect(results.all.size).toBe(1);

    // test updating
    test.set(element2.id, element2); // adding again
    updated = false;
    test.set(element2.id, element2); // updating

    expect(updated).toBe(true);
    expect(results.added.size).toBe(0);
    expect(results.modified.size).toBe(1);
    expect(results.modified.get('element2')).toBeDefined();
    expect(results.deleted.size).toBe(0);
    expect(results.all.size).toBe(2);

    // test deleting element and adding it again
    updated = false;
    test.delete(element4.id);

    expect(updated).toBe(true);
    expect(results.added.size).toBe(0);
    expect(results.modified.size).toBe(0);
    expect(results.deleted.size).toBe(1);
    expect(results.deleted.get('element4')).toBeDefined();
    expect(results.all.size).toBe(1);

    updated = false;
    test.set(element4.id, element4);

    expect(updated).toBe(true);
    expect(results.added.size).toBe(1);
    expect(results.added.get('element4')).toBeDefined();
    expect(results.modified.size).toBe(0);
    expect(results.deleted.size).toBe(0);
    expect(results.all.size).toBe(2);

    // test clearing all entries
    received = false;
    updated = false;
    test.clear();

    expect(received).toBe(true);
    expect(updated).toBe(false);
    expect(results.all.size).toBe(0);

    subscription.unsubscribe();
  });
});