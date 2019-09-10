import expression from "2d-algebra";
import { Status, SystemSolver } from "../src";

describe("basic", () => {
  it("stable", () => {
    const solver = new SystemSolver();
    const a = solver.addPoint();

    solver.addConstraint(expression(a.x).eq(3));
    solver.addConstraint(expression(a.y).eq(2));

    const x = new Map([[a.x, 1], [a.y, 1]]);
    const solutions = solver.startAt(x);

    expect(solutions.length).toBe(1);
    const solution = solutions[0];
    expect(solution.def.get(a.x)).toBeCloseTo(3);
    expect(solution.def.get(a.y)).toBeCloseTo(2);
    expect(solution.pointStatus.get(a)).toBe(Status.STABLE);
  }, 1000);

  it("under", () => {
    const solver = new SystemSolver();
    const a = solver.addPoint();

    solver.addConstraint(expression(a.x).squared().push(a.y).squared().plus().eq(1));

    const x = new Map([[a.x, 1], [a.y, 1]]);
    const solutions = solver.startAt(x);

    expect(solutions.length).toBe(1);
    const solution = solutions[0];
    expect(solution.def.get(a.x)).toBeCloseTo(1 / Math.sqrt(2));
    expect(solution.def.get(a.y)).toBeCloseTo(1 / Math.sqrt(2));
    expect(solution.pointStatus.get(a)).toBe(Status.UNDER);
  }, 1000);

  it("over", () => {
    const solver = new SystemSolver();
    const a = solver.addPoint();

    solver.addConstraint(expression(a.x).eq(3));
    solver.addConstraint(expression(a.y).eq(2));
    solver.addConstraint(expression(a.x).squared().push(a.y).squared().plus().eq(1));

    const start = new Map([[a.x, 1], [a.y, 1]]);
    const solutions = solver.startAt(start);

    expect(solutions.length).toBe(1);
    const solution = solutions[0];
    // expect(solution.def.get(a.x)).toBeCloseTo(1 / Math.sqrt(2));
    // expect(solution.def.get(a.y)).toBeCloseTo(1 / Math.sqrt(2));
    expect(solution.pointStatus.get(a)).toBe(Status.OVER);
  }, 1000);
})

// b'\x00\x00\x01u\x04\t$M\x00\x00\x00\x02\x00\x00\x00d'
// b'\000\000\001t\372\254\270)\000\000\000\022\000\000\000d'