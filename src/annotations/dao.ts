import { Client, Transaction } from "../../deps.ts";
import { Where } from "../query/where.ts";
import { Entity, Field, Nullable, PrimaryKey } from "./fields.ts";
import { Delete, Insert, Query, Select, Update } from "./shorthands.ts";

export class Dao {
  public transaction: Transaction | null = null;

  public constructor(public client: Client | Transaction) {
  }

  onTransaction(t: Transaction) {
    this.transaction = t;
  }

  onTransactionEnd() {
    this.transaction = null;
  }
}

export class TestDao extends Dao {
  @Select("wine")
  getAll(): Promise<Wine[]> {
    throw new Error();
  }

  @Select("wine", new Where({ id: "°1" }))
  getWineByDynamicId(_id: number): Promise<Wine[]> {
    throw new Error();
  }

  @Select(
    "wine",
    new Where({ id: "°1", is_organic: false, name: "°2", naming: "°3" }),
  )
  complexWhereQuery(
    _id: number,
    _name: string,
    _naming: string,
  ): Promise<Wine[]> {
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

  @Delete("wine", new Where({ id: 1 }))
  delete(): Promise<number> {
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

export class OtherDao extends Dao {
  @Select("wine")
  getAll(): Promise<Wine[]> {
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
