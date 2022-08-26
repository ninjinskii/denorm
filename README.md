# DenORM
Depedency-limited Deno ORM for PostgreSQL. Allow you to build relativly simple queries.

Low chance to let you down in production because of unavailable depedencies.

Only 2 deps:
* https://deno.land/x/postgres/mod.ts
* https://deno.land/std@0.137.0/testing/asserts.ts;

## Usage
You can use this library as an ORM or simply as a query builder if you don't need to do a lot of data objects manipulation.

### ORM
If you want to do an automatic mapping between your model objects and your database fields, you'll have to annotate your classes.
You are not forced to do this if you already have a running production database and your server doesn't need to modify objects
a lot when coming out of the databse (e.g. in a REST api). You wouldn't event need to create the model objects.

<b>What you will need for the ORM</b>
* Add decorators to your model class
* Call `initTable()` before instanting any of the model classes (or referencing their types)

Here is an example:

```ts
@Entity("my_model")
export class MyModel {
  constructor(
    @PrimaryKey("SERIAL") public myPrimaryKey: number,
    @Field("VARCHAR") public name: string,
    @SizedField("VARCHAR", 255) public comment: string,
    @Field("VARCHAR", NULLABLE.YES) public nullableProperty: string | null,
    @Field("BOOL", NULLABLE.NO, "my_field") public alias: string,
  ) {}
}
```

```
@Entity(tableName: string) - Will mark your class to be mapped in your DB, bearing the provided name.
@PrimaryKey(type: string, as?: string) - Will mark the property as your primary key with the provided type. If set, `as` your field will take that name in the database.
@Field(type: string, nullable?: NULLABLE, as?: string) - Will mark the property as a standard field, with the provided type.
@SizedField(type: string, size?: int, nullable?: NULLABLE, as?: string) - Will mark the property as a standard field, with the provided type and size (e.g; VARCHAR(255)).
```


Then you'll need to init the tables like so:  

__IMPORTANT NOTE:__
Run `initTables()` before trying to instantiate any of your model objects or even referencing the type, as it will break the annotation system.
```ts
await initTables(databaseUrl, [MyModel, MyOtherModel])
```

### Query the database
Otherwise, you can use only the query builder part.
You don't need to setup the decorators and call `initTables()` if your database already exists.

```ts
// Select
const builder = new QueryBuilder(databaseUrl);
const select = await builder
      .select("*") // .select("field1", "field2") - .select("table1.field1", "table_2.field2")
      .from("table1") // .from("table1", "table2")
      .where({ field: "comment", equals: "Hi mom!" }) // { field: "comment", equals: "whatever", chain: true } - Chain will couple the next AND & OR operator
      .or({ field: "count", sup: 5})
      .execute()
      
// Insert
// Note that you can reuse the same builder instance after calling execute()
await builder
      .insert("table1", [
        { id: 1, comment: "" },
        { id: 2, comment: "" },
      ])
      .execute();
      
      
// Update
await builder
      .update("table1", { field: "id", value: 3 })
      .where({ field: "id", equals: 1 })
      .execute();
```

To simulate parenthesis around some AND or OR clause, you can pass nothing to the `where()` function
and use `and()` & `or()` using arrays. An array of `and()` will be placed inside parenthese

```ts
  // WHERE (hello = hi AND age < 5)
  ...
  where().and([{ field: "hello", equals: "hi"}, { field: "age", inf: 5}])
  // WHERE (hello = hi AND age < 5) OR age > 30 OR age = 32
  where().and([{ field: "hello", equals: "hi"}, { field: "age", inf: 5}])
      .or({field: "age", sup: 30})
      .or({field: "age", equals: 32})
```

## Run the project locally
```bash
docker-compose up -d
```

## Run tests
```bash
docker-compose up -d
docker-compose exec web deno test --allow-env --allow-net --allow-read /tests
```
