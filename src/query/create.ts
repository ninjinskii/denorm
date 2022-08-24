import { FieldTransformer } from "./query-builder.ts";
import { PreparedQuery, QueryPart } from "./query-part.ts";

export interface FieldDescription {
  type: string;
  fieldName: string;
  nullable: boolean;
  primaryKey?: { serial: boolean };
}

export class Create extends QueryPart {
  private transformer: FieldTransformer | null;
  private tableName: string;
  private fieldDescriptors: FieldDescription[];

  constructor(
    transformer: FieldTransformer | null,
    tableName: string,
    descriptors: FieldDescription[],
  ) {
    super();
    this.transformer = transformer;
    this.tableName = tableName;
    this.fieldDescriptors = descriptors;

    if (this.fieldDescriptors.length === 0) {
      throw new Error("Create table cannot be empty");
    }
  }

  toPreparedQuery(): PreparedQuery {

  }
}
