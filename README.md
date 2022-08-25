# DenORM
Depedency-limited Deno ORM for PostgreSQL
Allow you to build relativly simple queries.

Low chance to let you down in production because of unavailable depedencies.

Only 2 deps:
* https://deno.land/x/postgres/mod.ts
* https://deno.land/std@0.137.0/testing/asserts.ts;

## Usage
### ORM
If you want to do an automatic mapping between you're model objects and your database fields, you'll have to annotate your classes.
You are not forced to do this if you already have a running production database and your server doesn't need to modify objects
a lot when coming out of the databse (e.g. in a REST api).

Here is an example:

```ts
@Entity("my_model")
export class MyModel {
  constructor(
    @PrimaryKey("SERIAL") public myPrimaryKey: number,
    @Field("VARCHAR") public name: string,
    @SizedField("VARCHAR", 255) public comment: string,
    @Field("VARCHAR", NULLABLE.YES) public nullableProperty: string | null,
    @Field("BOOL", NULLABLE.NO, "my_field") public alias: string | null,
  ) {}
}
```

```ts
* @Entity(tableName: string) - Will mark your class to be mapped in your DB, bearing the provided name.
* @PrimaryKey(type: string, as?: string) - Will mark the property as your primary key with the provided type. If set, `as` your field will take that name in the database.
* @Field(type: string, nullable?: NULLABLE, as?: string) - Will mark the property as a standard field, with the provided type.
* @SizedField(type: string, size?: int, nullable?: NULLABLE, as?: string) - Will mark the property as a standard field, with the provided type and size (e.g; VARCHAR(255)).
```

### SELECT clause
soon

### FROM clause
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

## Run tests
```bash
docker-compose up -d
docker-compose exec web deno test --allow-env --allow-net --allow-read /tests
```
