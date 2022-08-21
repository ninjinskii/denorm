export type ModelSchema = typeof Model;

export class Model {
  static select<T extends ModelSchema>(this: T, ...fields: string[]) {
    // prepare the query
    return this;
  }
}
