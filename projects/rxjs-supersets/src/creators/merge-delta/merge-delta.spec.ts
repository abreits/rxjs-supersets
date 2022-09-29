
import { Observable, Subject } from 'rxjs';
import { createDelta } from '../../public-api';
import { IdObject, MapDelta } from '../../types';
import { mergeDelta } from './merge-delta';

const element1 = { id: '1' };
const element2 = { id: '2' };
const element3 = { id: '3' };
const element4 = { id: '4' };

describe('mergeDelta', () => {
  it('should not subscribe to its sources if it has no subscribtions itself', () => {
    const source1$ = new Subject<MapDelta<string, IdObject>>();
    const source2$ = new Subject<MapDelta<string, IdObject>>();

    const mergeResults$ = mergeDelta(source1$, source2$);

    expect(mergeResults$).toBeInstanceOf(Observable);

    expect(source1$.observed).toBeFalse();
    expect(source2$.observed).toBeFalse();
  });

  it('should subscribe to its sources if it has subscribtions itself', () => {
    const source1$ = new Subject<MapDelta<string, IdObject>>();
    const source2$ = new Subject<MapDelta<string, IdObject>>();

    const mergeResults$ = mergeDelta(source1$, source2$);

    const subscription = mergeResults$.subscribe();

    expect(source1$.observed).toBeTrue();
    expect(source2$.observed).toBeTrue();

    subscription.unsubscribe();
  });

  it('should unsubscribe from its sources after it no longer has subscribtions itself', () => {
    const source1$ = new Subject<MapDelta<string, IdObject>>();
    const source2$ = new Subject<MapDelta<string, IdObject>>();

    const mergeResults$ = mergeDelta(source1$, source2$);

    const subscription = mergeResults$.subscribe();
    subscription.unsubscribe();

    expect(source1$.observed).toBeFalse();
    expect(source2$.observed).toBeFalse();
  });

  it('should combine its source updates into a single MapDelta', () => {
    const results: MapDelta<string, IdObject>[] = [];

    const source1$ = new Subject<MapDelta<string, IdObject>>();
    const source2$ = new Subject<MapDelta<string, IdObject>>();

    const mergeResults$ = mergeDelta(source1$, source2$);

    const subscription = mergeResults$.subscribe(result => results.push(result));

    source1$.next(createDelta({ all: element1 }));

    expect(results[0].added.size).toBe(1);
    expect(results[0].added.get('1')).toBe(element1);
    expect(results[0].all.size).toBe(1);

    source2$.next(createDelta({ all: element2 }));

    expect(results[1].added.size).toBe(1);
    expect(results[1].added.get('2')).toBe(element2);
    expect(results[1].all.size).toBe(2);

    subscription.unsubscribe();
  });

  it('should process later updates of the sources', () => {
    const results: MapDelta<string, IdObject>[] = [];

    const source1$ = new Subject<MapDelta<string, IdObject>>();
    const source2$ = new Subject<MapDelta<string, IdObject>>();

    const mergeResults$ = mergeDelta(source1$, source2$);

    const subscription = mergeResults$.subscribe(result => results.push(result));

    source1$.next(createDelta({ all: element1 }));
    source2$.next(createDelta({ all: element2 }));
    source1$.next(createDelta({ all: [element1, element3], added: element3 }));
    source2$.next(createDelta({ all: [element2, element4], added: element4, modified: element2 }));


    expect(results.length).toBe(4);
    expect(results[3].added.size).toBe(1);
    expect(results[3].added.get('4')).toBe(element4);
    expect(results[3].modified.size).toBe(1);
    expect(results[3].modified.get('2')).toBe(element2);
    expect(results[3].all.size).toBe(4);

    subscription.unsubscribe();
  });

  it('should delete elements that are no longer present in any source MapDelta', () => {
    const results: MapDelta<string, IdObject>[] = [];

    const source1$ = new Subject<MapDelta<string, IdObject>>();
    const source2$ = new Subject<MapDelta<string, IdObject>>();

    const mergeResults$ = mergeDelta(source1$, source2$);

    const subscription = mergeResults$.subscribe(result => results.push(result));

    source1$.next(createDelta({ all: element1 }));
    source2$.next(createDelta({ all: element2 }));

    expect(results[1].all.size).toBe(2);

    source2$.next(createDelta({ deleted: element2 }));

    expect(results[1].all.size).toBe(1);

    subscription.unsubscribe();
  });

  it('should not delete elements that stil present in other source MapDelta', () => {
    const results: MapDelta<string, IdObject>[] = [];

    const source1$ = new Subject<MapDelta<string, IdObject>>();
    const source2$ = new Subject<MapDelta<string, IdObject>>();

    const mergeResults$ = mergeDelta(source1$, source2$);

    const subscription = mergeResults$.subscribe(result => results.push(result));

    source1$.next(createDelta({ all: [element1, element2] }));
    source2$.next(createDelta({ all: element2 }));

    expect(results[1].all.size).toBe(2);

    source2$.next(createDelta({ deleted: element2 }));

    expect(results[1].all.size).toBe(2);

    subscription.unsubscribe();
  });
});
