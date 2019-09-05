import { Assignments, IExpression, value } from "./exp-ast";

export let idSeq = 1;
export class Variable implements IExpression {
  private id: number;
  constructor() {
    this.id = idSeq++;
  }
  public eval(assign: Assignments): number {
    const r = assign.get(this);
    if (r) {
      return r;
    }
    throw new Error("variable undefined");
  }
  public derivative(withRespectTo: Variable): IExpression {
    if (withRespectTo === this) {
      return value(1);
    }
    return value(0);
  }
  public collectVariables(variables: Set<Variable>): void {
    variables.add(this);
  }
  public toString(): string {
    return "x" + this.id;
  }
}
