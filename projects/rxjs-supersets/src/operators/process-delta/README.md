# `processDelta(handlerFunctions?)`

The `processDelta` RxJS operator processes `MapDelta` updates.
It makes sure that the first result always contains all map entries in the `created` field.

[back to main](../../README.md)

The optional `handlerFunctions` parameter has the following structure:

``` typescript
handlerFunctions?: {
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


[back to top](#processdeltahandlerfunctions)