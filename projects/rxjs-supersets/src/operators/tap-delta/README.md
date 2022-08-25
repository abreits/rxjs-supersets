# `tapDelta(handlerFunctions)`

The `tapDelta` RxJS operator operates on `MapDelta` structures.
It allows to generate side effects for individual `MapDelta` entries. 

[back to main](../../README.md)

The `handlerFunctions` parameter has the following structure:

``` typescript
handlerFunctions: {
  add?: (value: V) => void,
  delete?: (Value: V) => void,
  modify?: (value: V) => void,
  before?: () => void,
  after?: () => void
}
```

Function of the handler structure members:

- `add`: the function is called for every entry in the `mapDelta.created` set.
- `delete`: the function is called for every entry in the `mapDelta.deleted` set.
- `modify`: the function is called for every entry in the `mapDelta.updated` set.
- `before`: the function is called only once, before all `add`, `delete` and `modify` calls.
- `after`: the function is called only once, after all `add`, `delete` and `modify` calls.

The order in which the methods are handled is:

- `before` once
- `delete` once for every `deleted` entry
- `modify` once fore every `created` entry
- `add` once for every `created` entry
- `after` once

## Examples

``` typescript
observable.pipe(
  startDelta(),
  tapDelta({
    add: element => addElement(element),
    modify: element => modifyElement(element)
  })
).subscribe()
  
observable.pipe(
  startDelta(),
  tapDelta({
    before: () => initialize(),
    add: element => addElement(element),
    delete: element => deleteElement(element),
    after: () => cleanup()
  })
).subscribe()
```

[back to top](#tapdeltahandlerfunctions)