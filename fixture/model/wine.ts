import {
  _,
  BigInt,
  Boolean,
  PrimaryKey,
  Varchar,
} from "../../src/orm/annotations.ts";

export class Wine {
  constructor(
    @PrimaryKey() public id: number,
    public naming: string,
    @Varchar(null, _.NULLABLE) public name: string | null,
    @Varchar(255) public comment: string,
    public bottle_id: number,
    @BigInt() public date: number,
    @Boolean() public isMidday: boolean,
  ) {
  }
}
