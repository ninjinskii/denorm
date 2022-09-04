# DenORM
Depedency-limited Deno ORM for PostgreSQL. Allow you to build relativly simple queries.
Well-suited for REST apis.

Low chance to let you down in production because of unavailable depedencies.

Only 2 deps:
* https://deno.land/x/postgres/mod.ts
* https://deno.land/std@0.137.0/testing/asserts.ts;


## ORM
<b>What you will need for the ORM</b>
* Add decorators to your model class
* Create DAOs
* Call `initTable()` before instanting any of the model classes (or referencing their types)

### Add decorators to your model class

```ts
import { Entity... } from "https://raw.githubusercontent.com/ninjinskii/denorm/master/mod.ts"

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

```ts
@Entity(tableName: string) // Will mark your class to be mapped in your DB, bearing the provided name.
@PrimaryKey(type: string, as?: string) // Will mark the property as your primary key with the provided type. If set, `as` your field will take that name in the database.
@Field(type: string, nullable?: NULLABLE, as?: string) // Will mark the property as a standard field, with the provided type.
@SizedField(type: string, size?: int, nullable?: NULLABLE, as?: string) // Will mark the property as a standard field, with the provided type and size (e.g; VARCHAR(255)).
```

### Create DAOs

Daos will be your entry point for querying data.
You need to pass an instance of PostgresClient to the DAO constructor.
See: https://deno-postgres.com/#/?id=connecting-to-your-db for more details on that.

```ts
import { Dao, Client, Select } from "https://raw.githubusercontent.com/ninjinskii/denorm/master/mod.ts"

export class WineDao extends Dao {
  @Select("wine") // Pass the table name as argument
  function getAllWines(): Promise<Wine[]> { // Set the return type that coresponds to the fetched data
    throw new Error(""); // The error will never be trigerred, but we throw it to avoid linter complaints.
  }
}

const client = new Client(databaseUrl);
const dao = new WineDao();

```

### Call `initTables()` 

> __IMPORTANT NOTE:__
Run `initTables()` before trying to instantiate any of your model objects or even referencing the type, as it will break the annotation system.
```ts
import { initTables } from "https://raw.githubusercontent.com/ninjinskii/denorm/master/mod.ts"

await initTables(databaseUrl, [Wine, MyOtherModel])
```

## Query the database
If you're building a REST api, take a look at the dedicated section below.
To do basic queries you can use annotations shorthands:

### Shorthands
Shorthands allows you to make the base CRUD queries as easy as an annotation.
All shorthands will ask you for a table name as first parameter.
Some of them can take an optionnal where parameter, which can only check single or multiple fields equality.
For more complex queries, use `@Query` described below.

> For the sake of brevity, Dao class is not represented in the next examples. But remember that shorthands decorator needs to be called inside a Dao.

#### SELECT

```ts
// Select all wines
@Select("wine") // Pass the table name as argument
getAllWines(): Promise<Wine[]> { // Set the return type that coresponds to the fetched data
  throw new Error(""); // The error will never be trigerred, but we throw it to avoid linter complaints.
}
```

You can make some slightly more complex select using the where parameter (allows only the "=" operator):
```ts
// Select object by id
@Select("wine", new Where({ id: 1, name: "Riesling" })) // Pass where as argument.
getWineById(_id: number, _name: string): Promise<Wine[]> {
}
```

Dynamic parameters binding can be done by setting the value `"°<one-based index of parameter in function>"` to your condition.
For instance:

```ts
@Select("wine", new Where({ isOrganic: true, name: "°1" })) 
getOrganicWinesForName(_name: string): Promise<Wine[]> {
}
```

#### INSERT

```ts
@Insert("wine")
insertWines(_wines: Wine[]): Promise<number> { // Returns number of inserted rows
  throw new Error(""); // The error will never be trigerred, but we throw it to avoid linter complaints.
}
```

#### UPDATE

```ts
@Update("wine")
updateWines(_wines: Wine[]): Promise<number> { // Returns number of rows affected
  throw new Error("");
}
```

#### DELETE

```ts
@Delete("wine", new Where({ id: 1 })) // Returns number of deleted rows. Where is mandatory for Delete shorthand.
delete(): Promise<number> {
  throw new Error("");
}
```

### @Query()
For more complex queries, see `@Query`:
```ts
@Query("SELECT id, name, SUBSTR(naming, 0, $2) AS naming FROM wine WHERE id = $1")
  getWineById(
    _id: number,  // $1
    _max: number, // $2
  ): Promise<{ id: number; name: string; naming: string }[]> {
    throw new Error();
  }
```

> Note that whatever query you will write inside @Query(), the function will always return an Array.
> This array will be filled with resutlts in case of a SELECT statement.

> Also, note that the parameters will automatically be binded. Parameters naming in WHERE is not necessary here.

## Transactions
To begin a transaction, call `transaction()` passing the list of DAOs needed, and a function.
```ts
import { transaction } from "https://raw.githubusercontent.com/ninjinskii/denorm/master/mod.ts"


const success: boolean = await transaction([dao], async () => {
  // Place all your queries here, e.g. dao.getAllWines(); dao2.getAllThing();
});
```

## Advices for REST apis
Make an interface that allows you to treat all DAOs as the same entity:

```ts
export interface RestDao<T> {
  get(): Promise<T[]>
  getOne(id: number): Promise<T[]>
  put(objects: T[]): Promise<number>
  patch(objects: T[]): Promise<number>
  delete(objects: T[]): Promise<number>
  ...
}
```
Create one DAO per collection, implementing RestDao.

```ts
export class WineDao extends Dao implements RestDao<Wine> {
  @Select("wine")
  get(): Promise<Wine[]> {
    throw new Error("");
  }

  @Select("wine", new Where({ id: "°1" }))
  getOne(id: number): Promise<Wine[]> {
    throw new Error("");
  }

  @Insert("wine")
  put(): Promise<number> {
    throw new Error("");
  }
  ...
}
```

Then you can create a mapping between your routes and your DAOs, and have a single function to execute all collections actions.

## Run the project locally
```bash
docker-compose up -d
```

## Run tests
```bash
docker-compose up -d
docker-compose exec web deno test --allow-env --allow-net --allow-read tests
```
