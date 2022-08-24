import { Field, Nullable, PrimaryKey } from "../../src/orm/annotations.ts";

export class Bottle {
  constructor(
    @PrimaryKey("SERIAL", "bottle_id") public bottleId: number,
    @Field("VARCHAR", Nullable.NO, "bottle_size") public bottleSize: string,
  ) {
  }
}
