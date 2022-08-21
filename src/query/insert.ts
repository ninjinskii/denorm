import { clientMapper } from "../mock/mock-mapper.ts";
import { ClientFieldMapper } from "./query-builder.ts";
import { QueryPart } from "./query-part.ts";

export class Insert extends QueryPart {
  private readonly mapper: ClientFieldMapper = clientMapper;

  // TODO : pass client mapper as constructor argument
  constructor() {
    super();
    //this.mapper = mapper;
  }

  toText(): string {
    
  }


  escapeFinalUserData() {

  }
}