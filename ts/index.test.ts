import test from "ava";
import { add, eq, Equation, mult, value } from "./exp-ast";
import { SystemSolver } from "./index";

test("circle", (t) => {
  const solver = new SystemSolver();
  const a = solver.addPoint();
  const constraint = Equation.of(a.x).sqaured().plus(a.y).sqaured().equals(1);

  solver.addConstraint(constraint);

  const x = new Map([[a.x, 1], [a.y, 1]]);
  const altY = solver.startAt(x);

  t.is(altY.size, 1);
  const result = Array.from(altY.values())[0];
  isAlmost(result.get(a.x), 1 / Math.sqrt(2));
  isAlmost(result.get(a.y), 1 / Math.sqrt(2));
});

function isAlmost(actual: number | undefined, expected: number) {
  if (Math.abs(actual! - expected) < Number.EPSILON) {
    throw new Error("Not close enought " + actual + " <> " + expected);
  }
}
