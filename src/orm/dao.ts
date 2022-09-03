// deno-lint-ignore-file no-unused-vars
import { Client } from "../../deps.ts";
import { Where } from "../query/where.ts";
import { Entity, Field, Nullable, PrimaryKey } from "./annotations.ts";
import { Delete, Insert, Query, Select, Update } from "./dao-annotations.ts";

export class Dao {
  public constructor(public client: Client) {
  }
}

export class TestDao extends Dao {
  @Select("wine")
  getAll(): Promise<Wine[]> {
    throw new Error();
  }

  @Insert("wine")
  insert(_wines: Wine[]): Promise<number> {
    throw new Error();
  }

  @Update("wine")
  update(_wines: Wine[]): Promise<number> {
    throw new Error();
  }

  @Delete("wine")
  delete(_where: Where): Promise<number> {
    throw new Error();
  }

  @Query(
    "SELECT id, name, SUBSTR(naming, 0, $2) AS naming FROM wine WHERE id = $1",
  )
  getWineById(
    _id: number,
    _max: number,
  ): Promise<{ id: number; name: string; naming: string }[]> {
    throw new Error();
  }
}

@Entity("wine")
export class Wine {
  constructor(
    @PrimaryKey("SERIAL") public id: number,
    @Field("VARCHAR") public name: string,
    @Field("VARCHAR") public naming: string,
    @Field("BOOL", Nullable.NO, "is_organic") public isOrganic: boolean,
  ) {
  }
}

@Entity("bottle")
export class Bottle {
  constructor(
    @PrimaryKey("SERIAL") public id: number,
    @Field("VARCHAR") public comment: string,
  ) {
  }
}
