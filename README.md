# DenORM
Depedency-limited Deno ORM for PostgreSQL
Allow you to build relativly simple queries.

Low chance to let you down in production because of unavailable depedencies.

Only 2 deps:
  https://deno.land/x/postgres/mod.ts
  https://deno.land/std@0.137.0/testing/asserts.ts;

## Usage
### SELECT clause
soon

### FROM clause
soon

### WHERE clause
For a simple where, you can do as follow:

```ts
  new Where({ field: "hello", equals: "hi"})
  new Where({ field: "hello", equals: "hi"}).and({ field: "age", inf: 5})
  new Where({ field: "hello", equals: "hi"}).or({ field: "age", inf: 5})
```

To simulate parenthesis around some AND 'or clause, you can pass nothing to the Where constructor
and use .and() & .or() using arrays. An array of and() will be placed inside parenthese

```ts
  // WHERE (hello = hi AND age < 5)
  new Where().and([{ field: "hello", equals: "hi"}, { field: "age", inf: 5}])
  // WHERE (hello = hi AND age < 5) OR age > 30 OR age = 32
  new Where().and([{ field: "hello", equals: "hi"}, { field: "age", inf: 5}])
      .or({field: "age", sup: 30})
      .or({field: "age", equals: 32})
```