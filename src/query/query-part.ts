export interface FieldTransformer {
  toDbField: (clientName: string) => string;
  fromDbField: (fieldName: string) => string;
}

const defaultTransformer = {
  toDbField: (clientName: string) => clientName,
  fromDbField: (fieldName: string) => fieldName,
};

export abstract class QueryPart {
  protected transformer: FieldTransformer = defaultTransformer;

  abstract toText(): string;

  setTransformer(transformer: FieldTransformer) {
    this.transformer = transformer;
  }
}
