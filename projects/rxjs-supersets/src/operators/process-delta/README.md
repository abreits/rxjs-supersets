# `processDelta(handlerFunctions?)`

**DEPRECATED** use a combination of [startDelta()](../start-delta/README.md) and [tapDelta(...)](../tap-delta/README.md) or [processElements(...)](../../support/process-elements/README.md) instead.

The `processDelta` RxJS operator processes `MapDelta` updates.
It makes sure that the first result always contains all map entries in the `added` field.

[back to main](../../README.md)

The optional `handlerFunctions` parameter has the following structure:

``` typescript
handlerFunctions?: {
  add?: (value: V) => void,
  delete?: (Value: V) => void,
  modify?: (value: V) => void,
  before?: (delta?: DeltaObservable<K, V>) => void,
  after?: (delta?: DeltaObservable<K, V>) => void
}
```

Function of the handler structure members:

- `add`: the function is called for every entry in the `mapDelta.added` set.
- `delete`: the function is called for every entry in the `mapDelta.deleted` set.
- `modify`: the function is called for every entry in the `mapDelta.modified` set.
- `before`: the function is called only once, before all `add`, `delete` and `modify` calls.
- `after`: the function is called only once, after all `add`, `delete` and `modify` calls.

The order in which the methods are handled is:

- `before` once
- `delete` once for every `deleted` entry
- `modify` once fore every `added` entry
- `add` once for every `added` entry
- `after` once

## Examples

``` typescript
observable.pipe(
  processDelta({
    add: element => addElement(element),
    modify: element => modifyElement(element)
  })
).subscribe()
  
observable.pipe(
  processDelta({
    add: element => addElement(element),
    delete: element => deleteElement(element)
  })
).subscribe()
```

[back to top](#processdeltahandlerfunctions)