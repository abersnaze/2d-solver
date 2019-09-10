import test from "ava";
import { eq, value, pow, add } from "./exp/Expression";
import { makeConstraint, SystemSolver, Status } from "./index";

function isAlmost(actual: number | undefined, expected: number) {
  if (Math.abs(actual! - expected) < Number.EPSILON) {
    throw new Error("Not close enought " + actual + " <> " + expected);
  }
}

test("empty", (t) => {
  t.pass();
});

// test("fixed point (3,2)", (t) => {
//   const solver = new SystemSolver();
//   const a = solver.addPoint();

//   solver.addConstraint(eq(a.x, value(3)));
//   solver.addConstraint(eq(a.y, value(2)));

//   const x = new Map([[a.x, 1], [a.y, 1]]);
//   const solutions = solver.startAt(x);

//   t.is(solutions.length, 1);
//   const solution = solutions[0];
//   isAlmost(solution.def.get(a.x), 0);
//   isAlmost(solution.def.get(a.y), 0);
//   t.is(solution.pointStatus.get(a), Status.STABLE);
// });

// test("circle", (t) => {
//   const solver = new SystemSolver();
//   const a = solver.addPoint();
//   const constraint = eq(add(pow(a.x, value(2)), pow(a.y, value(2))), value(1));

//   const foo = makeConstraint(constraint, solver.points);

//   solver.addConstraint(constraint);

//   const x = new Map([[a.x, 1], [a.y, 1]]);
//   const solutions = solver.startAt(x);

//   t.is(solutions.length, 1);
//   const solution = solutions[0];
//   isAlmost(solution.def.get(a.x), 1 / Math.sqrt(2));
//   isAlmost(solution.def.get(a.y), 1 / Math.sqrt(2));
//   t.is(solution.pointStatus.get(a), Status.UNDER);
// });
