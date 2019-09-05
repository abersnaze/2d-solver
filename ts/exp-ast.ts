import { deepEqual } from "fast-equals";
import { Variable } from "./Variable";

export type Assignments = Map<Variable, number>;

export interface IExpression {
  eval(assign: Assignments): number;
  derivative(withRespectTo: Variable): IExpression;
  collectVariables(variables: Set<Variable>): void;
}

// tslint:disable-next-line: max-classes-per-file
class Constant implements IExpression {
  constructor(readonly n: number) { }
  public eval(assign: Map<Variable, number>): number {
    return this.n;
  }
  public derivative(withRespectTo: Variable): IExpression {
    return zero;
  }
  public collectVariables(variables: Set<Variable>): void {
    // no op
  }
  public toString(): string {
    return this.n.toString();
  }
}

// tslint:disable-next-line: max-classes-per-file
class Add implements IExpression {
  constructor(readonly a: IExpression, readonly b: IExpression) { }
  public eval(assign: Assignments): number {
    return this.a.eval(assign) + this.b.eval(assign);
  }
  public derivative(withRespectTo: Variable): IExpression {
    const da = this.a.derivative(withRespectTo);
    const db = this.b.derivative(withRespectTo);

    return add(da, db);
  }
  public collectVariables(variables: Set<Variable>): void {
    this.a.collectVariables(variables);
    this.b.collectVariables(variables);
  }
  public toString(): string {
    return this.a.toString() + " + " + this.b.toString();
  }
}

// tslint:disable-next-line: max-classes-per-file
class Sub implements IExpression {
  constructor(readonly a: IExpression, readonly b: IExpression) { }
  public eval(assign: Assignments): number {
    return this.a.eval(assign) - this.b.eval(assign);
  }
  public derivative(withRespectTo: Variable): IExpression {
    const da = this.a.derivative(withRespectTo);
    const db = this.b.derivative(withRespectTo);

    return sub(da, db);
  }
  public collectVariables(variables: Set<Variable>): void {
    this.a.collectVariables(variables);
    this.b.collectVariables(variables);
  }
  public toString(): string {
    return this.a.toString() + " - " + this.b.toString();
  }
}

// tslint:disable-next-line: max-classes-per-file
class Mult implements IExpression {
  constructor(readonly a: IExpression, readonly b: IExpression) { }
  public eval(assign: Map<Variable, number>): number {
    return this.a.eval(assign) * this.b.eval(assign);
  }
  public derivative(withRespectTo: Variable): IExpression {
    const da = this.a.derivative(withRespectTo);
    const db = this.b.derivative(withRespectTo);

    return add(mult(da, this.b), mult(db, this.a));
  }
  public collectVariables(variables: Set<Variable>): void {
    this.a.collectVariables(variables);
    this.b.collectVariables(variables);
  }
  public toString(): string {
    return this.a.toString() + "*" + this.b.toString();
  }
}

// tslint:disable-next-line: max-classes-per-file
class Div implements IExpression {
  constructor(readonly a: IExpression, readonly b: IExpression) { }
  public eval(assign: Map<Variable, number>): number {
    return this.a.eval(assign) / this.b.eval(assign);
  }
  public derivative(withRespectTo: Variable): IExpression {
    const da = this.a.derivative(withRespectTo);
    const db = this.b.derivative(withRespectTo);

    return div(add(mult(da, this.b), mult(db, this.a)), mult(this.b, this.b));
  }
  public collectVariables(variables: Set<Variable>): void {
    this.a.collectVariables(variables);
    this.b.collectVariables(variables);
  }
  public toString(): string {
    return this.a.toString() + "/" + this.b.toString();
  }
}

// tslint:disable-next-line: max-classes-per-file
class Sin implements IExpression {
  constructor(readonly a: IExpression) { }
  public eval(assign: Map<Variable, number>): number {
    return Math.sin(this.a.eval(assign));
  }
  public derivative(withRespectTo: Variable): IExpression {
    return new Cos(this.a);
  }
  public collectVariables(variables: Set<Variable>): void {
    this.a.collectVariables(variables);
  }
  public toString(): string {
    return "sin(" + this.a + ")";
  }
}

// tslint:disable-next-line: max-classes-per-file
class Cos implements IExpression {
  constructor(readonly a: IExpression) { }
  public eval(assign: Map<Variable, number>): number {
    return Math.cos(this.a.eval(assign));
  }
  public derivative(withRespectTo: Variable): IExpression {
    return mult(negOne, new Sin(this.a));
  }
  public collectVariables(variables: Set<Variable>): void {
    this.a.collectVariables(variables);
  }
  public toString(): string {
    return "cos(" + this.a + ")";
  }
}

export function value(a: number): Constant {
  if (a === 0) {
    return zero;
  }
  if (a === -1) {
    return negOne;
  }
  if (a === 1) {
    return one;
  }
  return new Constant(a);
}

export function variable() {
  return new Variable();
}

export function add(a: IExpression, b: IExpression): IExpression {
  if (a === zero) {
    return b;
  }
  if (b === zero) {
    return a;
  }
  if (a instanceof Constant) {
    if (b instanceof Constant) {
      return value(a.n + b.n);
    }
    [a, b] = [b, a];
  }
  if (deepEqual(a, b)) {
    return mult(two, b);
  }
  return new Add(a, b);
}

export function sub(a: IExpression, b: IExpression): IExpression {
  if (a === zero) {
    return mult(negOne, b);
  }
  if (b === zero) {
    return a;
  }
  if (deepEqual(a, b)) {
    return zero;
  }
  return new Sub(a, b);
}

const zero = new Constant(0);
const one = new Constant(1);
const negOne = new Constant(-1);
const two = new Constant(2);

export function mult(a: IExpression, b: IExpression): IExpression {
  if (a === zero) {
    return zero;
  }
  if (a === one) {
    return b;
  }
  if (b === zero) {
    return zero;
  }
  if (b === one) {
    return a;
  }
  if (a instanceof Add) {
    return add(mult(a.a, b), mult(a.b, b));
  }
  if (b instanceof Add) {
    return add(mult(a, b.a), mult(a, b.b));
  }
  if (b instanceof Constant) {
    if (a instanceof Constant) {
      return value(a.n * b.n);
    }
    [a, b] = [b, a];
  }
  if (a instanceof Constant && b instanceof Mult && b.a instanceof Constant) {
    [a, b] = [value(b.a.n * a.n), b.b];
  }
  return new Mult(a, b);
}

export function div(a: IExpression, b: IExpression): IExpression {
  if (a === zero) {
    return zero;
  }
  if (b === one) {
    return a;
  }
  if (b === negOne) {
    return mult(negOne, a);
  }
  return new Div(a, b);
}

export function sin(a: IExpression) {
  return new Sin(a);
}

export function cox(a: IExpression) {
  return new Cos(a);
}

export function eq(a: IExpression, b: IExpression): IExpression {
  const eqZero = sub(a, b);
  return mult(eqZero, eqZero);
}

// tslint:disable-next-line: max-classes-per-file
export class Equation {
  public static of(a: number | Variable): Equation {
    return new Equation(a instanceof Variable ? a : value(a));
  }

  private constructor(readonly curr: IExpression) { }

  public plus(b: number | Variable): Equation {
    return new Equation(add(this.curr, b instanceof Variable ? b : value(b)));
  }

  public sqaured(): Equation {
    return new Equation(mult(this.curr, this.curr));
  }

  public equals(b: number | Variable): Equation {
    return new Equation(eq(this.curr, b instanceof Variable ? b : value(b)));
  }
}
