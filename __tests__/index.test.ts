import expression from "2d-algebra";
import { SystemSolver } from "../src";

test("foo", () => {
  const e = expression(4);
  const s = new SystemSolver();
//   // empty
});

// function isAlmost(actual: number | undefined, expected: number) {
//   if (Math.abs(actual! - expected) < Number.EPSILON) {
//     throw new Error("Not close enought " + actual + " <> " + expected);
//   }
// }

// test("empty", (t) => {
//   t.pass();
// });

// test("fixed point (3,2)", (t) => {
//   const solver = new SystemSolver();
//   const a = solver.addPoint();

//   solver.addConstraint(Expression.of(a.x).eq(3));
//   solver.addConstraint(Expression.of(a.y).eq(2));

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

//   solver.addConstraint(Expression.of(a.x).squared().push(a.y).squared().plus().eq(1));

//   const x = new Map([[a.x, 1], [a.y, 1]]);
//   const solutions = solver.startAt(x);

//   t.is(solutions.length, 1);
//   const solution = solutions[0];
//   isAlmost(solution.def.get(a.x), 1 / Math.sqrt(2));
//   isAlmost(solution.def.get(a.y), 1 / Math.sqrt(2));
//   t.is(solution.pointStatus.get(a), Status.UNDER);
// });

// test("over", () => {
//   const solver = new SystemSolver();
//   const a = solver.addPoint();

//   solver.addConstraint(Expression.of(a.y).eq(2));
//   solver.addConstraint(Expression.of(a.x).eq(3));
//   solver.addConstraint(Expression.of(a.x).squared().push(a.y).squared().plus().eq(1));

//   const x = new Map([[a.x, 1], [a.y, 1]]);
//   const solutions = solver.startAt(x);

//   expect(solutions.length).toBe(1);

//   const solution = solutions[0];
//   expect(solution.def.get(a.x)).toBeCloseTo(1 / Math.sqrt(2));
//   expect(solution.def.get(a.y)).toBeCloseTo(1 / Math.sqrt(2));
//   // t.is(solution.pointStatus.get(a), Status.UNDER);
// });
