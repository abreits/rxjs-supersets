# `processElements(delta, handlerFunctions)`

The `processElements` utility function can process individual `MapDelta` elements.

[back to main](../../README.md)

The `handlerFunctions` parameter has the following structure:

``` typescript
handlerFunctions: {
  add?: (value: V) => void,
  delete?: (Value: V) => void,
  modify?: (value: V) => void
}
```

Function of the handler structure members:

- `delete`: the function is called for every element in the `mapDelta.deleted` set.
- `modify`: the function is called for every element in the `mapDelta.modified` set.
- `before`: the function is called only once, before all `add`, `delete` and `modify` calls.

The order in which the methods are handled is:

- `delete` once for every `deleted` element
- `modify` once fore every `added` element
- `add` once for every `added` element

``` typescript
observable.pipe(startDelta()).subscribe(delta => {
  processElements({
    add: element => addElement(element),
    modify: element => modifyElement(element)
  });
});

observable.pipe(startDelta()).subscribe(delta => {
  processElements({
    add: element => addElement(element),
    delete: element => deleteElement(element)
  });
});
```
[back to top](#processelementsdelta-handlerfunctions)