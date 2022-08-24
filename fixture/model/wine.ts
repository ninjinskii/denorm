import {
Entity,
  Field,
  Nullable,
  PrimaryKey,
  SizedField,
} from "../../src/orm/annotations.ts";

@Entity("wine")
export class Wine {
  constructor(
    @PrimaryKey("SERIAL") public id: number,
    @Field("VARCHAR") public naming: string,
    @Field("VARCHAR", Nullable.YES) public name: string | null,
    @SizedField("VARCHAR", 255) public comment: string,
    @Field("INT", Nullable.NO, "bottle_id") public bottleId: number,
    @Field("BIGINT") public date: number,
    @Field("BOOL", Nullable.NO, "taste_good") public tasteGood: boolean,
  ) {
  }
}
