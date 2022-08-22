# `processElements(delta, handlerFunctions)`

The `processElements` utility function can process individual `MapDelta` elements.

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

- `add`: the function is called for every element in the `mapDelta.created` set.
- `delete`: the function is called for every element in the `mapDelta.deleted` set.
- `modify`: the function is called for every element in the `mapDelta.updated` set.
- `before`: the function is called only once, before all `add`, `delete` and `modify` calls.
- `after`: the function is called only once, after all `add`, `delete` and `modify` calls.

The order in which the methods are handled is:

- `before` once
- `delete` once for every `deleted` element
- `modify` once fore every `created` element
- `add` once for every `created` element
- `after` once