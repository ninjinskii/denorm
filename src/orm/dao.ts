// deno-lint-ignore-file no-unused-vars
import { Client } from "../../deps.ts";
import { Entity, Field, Nullable, PrimaryKey } from "./annotations.ts";
import { Insert, Query, Select } from "./dao-annotations.ts";

export class Dao {
  public constructor(public client: Client) {
  }
}

export class TestDao extends Dao {
  @Select("wine")
  getAllWines(...projection: string[]): Promise<Wine[]> {
    throw new Error();
  }

  @Insert("wine")
  insertWines(wines: Wine[]): Promise<number> {
    throw new Error();
  }

  @Query("SELECT * FROM wine WHERE id = $1")
  getWineById(id: number): Promise<Wine | null> { // test null case
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