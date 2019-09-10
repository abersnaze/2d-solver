import { Assignments, Expression } from "2d-algebra";
import { Identifier } from "2d-algebra/lib/node";
import { Constraint } from "./Constraint";
import { Point } from "./Point";

type Points = Map<symbol, Point>;

interface ISolution {
    def: Assignments;
    pointStatus: Map<Point, Status>;
    excluded: Constraint[];
    condition: StoppedBecause;
}

export enum Status { UNDER, STABLE, OVER }

export class SystemSolver {
    public points = new Map() as Points;
    private constraints = [] as Constraint[];

    public startAt(initDef: Assignments): ISolution[] {
        const finDef = solvePermute(initDef, this.constraints, [], this.points);
        return finDef;
    }

    public addPoint(): Point {
        const p = new Point(Symbol());
        this.points.set(p.x, p);
        this.points.set(p.y, p);
        return p;
    }

    public addConstraint(exp: Expression): object {
        const constraint = makeConstraint(exp, this.points);
        this.constraints.push(constraint);
        return constraint;
    }

    public removeConstraint(constraint: object): boolean {
        const index = this.constraints.indexOf(constraint as Constraint);
        if (index > -1) {
            this.constraints.splice(index, 1);
            return true;
        }
        return false;
    }
}

function solvePermute(
    initDef: Assignments,
    constraints: Constraint[],
    exclude: Constraint[],
    points: Points): ISolution[] {

    if (exclude.length > 1) {
        return [];
    }

    const combinedConstraints = constraints
        .filter((constraint) => exclude.indexOf(constraint))
        .reduce((a, b) => {
            // find unique symbols from all constraints
            const abSyms = new Set<Identifier>();
            a.syms.forEach(abSyms.add.bind(abSyms));
            b.syms.forEach(abSyms.add.bind(abSyms));

            const abFx = a.fx.plus(b.fx);
            const abFdx = addMaps(a.dfdx, b.dfdx);
            const abFdxx = addMaps(a.dfdx, b.dfdx);
            const abFdxy = addMaps(a.dfdxy, b.dfdxy);
            return new Constraint(
                abSyms,
                abFx,
                abFdx,
                abFdxx,
                abFdxy,
            );
        });

    const solution = findLocalMinimum(initDef, combinedConstraints, Array.from(points.values()));

    return [solution];
}

function addMaps<K>(as: Map<K, Expression>, bs: Map<K, Expression>): Map<K, Expression> {
    const cs = new Map(as);
    for (const [key, b] of bs) {
        const a = cs.get(key);
        if (a === undefined) {
            cs.set(key, b);
        } else {
            cs.set(key, a.plus(b));
        }
    }
    return cs;
}

/**
 * compute cost function, first derivative for each symbol, and second derivative for each point.
 * @param constraints
 * @param points
 */
export function makeConstraint(exp: Expression, points: Points): Constraint {
    const syms = new Set<symbol>();
    points.forEach((point) => {
        syms.add(point.x);
        syms.add(point.y);
    });
    const expDx = new Map<symbol, Expression>();
    const expDxx = new Map<symbol, Expression>();
    const expDxy = new Map<Point, Expression>();

    // get the first derivative for all symbols.
    syms.forEach((sym) => {
        const dx = exp.derivative(sym);
        expDx.set(sym, dx);
        expDxx.set(sym, dx.derivative(sym));
    });

    // get the second derivatives for each point
    for (const sym of syms) {
        const p = points.get(sym);
        // x is not part of a point or we've already computed it from y
        if (p === undefined || expDxy.has(p)) {
            continue;
        }
        // get the symbol that isn't x
        const y = p.x === sym ? p.y : p.x;

        // derivative the 2nd from the 1st
        const dx = expDx.get(sym)!;
        const dxy = dx.derivative(y);

        expDxy.set(p, dxy);
    }

    return new Constraint(syms, exp, expDx, expDxx, expDxy);
}

/**
 * how close is close enough
 */
const epsilon = Number.EPSILON;

interface IResult {
    fx: number;
    dfdx: Map<Identifier, number>;
    dfdxx: Map<Identifier, number>;
    dfdxy: Map<Point, number>;
}

function evaluate(def: Assignments, constraint: Constraint): IResult {
    const fx = constraint.fx.eval(def);

    const dfdx = new Map(Array.from(constraint.dfdx).map(([symbol, constraintDfDx]) => {
        return [symbol, constraintDfDx.eval(def)];
    }));

    const dfdxx = new Map(Array.from(constraint.dfdxx).map(([symbol, constraintDfDxx]) => {
        return [symbol, constraintDfDxx.eval(def)];
    }));

    const dfdxy = new Map(Array.from(constraint.dfdxy).map(([symbol, constraintDfDxy]) => {
        return [symbol, constraintDfDxy.eval(def)];
    }));

    return { fx, dfdx, dfdxx, dfdxy } as IResult;
}

/**
 * Attempts to find a solution for one equation. The method returns where it
 * landed and why it stopped.
 *
 * @param exp the system of equations all added together. The expresion should never be negative
 * @param initDefs the initial start point for the search
 */
function findLocalMinimum(initDefs: Assignments, constraint: Constraint, points: Point[]): ISolution {
    let def = initDefs;
    let res = evaluate(def, constraint);

    // we don't have a difference so start with near infinite to get through the first step
    let diff = Number.MAX_VALUE;
    let condition = isTermial(res, diff);

    // while not not close enough
    while (condition === undefined) {
        // use the magnitude of the slope as a threshold for the amount of change that
        // we expect to see in the change of the cost after we step
        const threshold = Math.sqrt(Array.from(res.dfdx.values()).reduce((sum, slope) => sum + slope * slope, 0));

        let stepSize = 1.0;
        let nextDef;
        let nextRes;
        let done = false;
        do {
            // for each symbol:value
            nextDef = new Map(Array.from(def).map(([symbol, value]) => {
                // get the slope from the constraint
                const slope = res.dfdx.get(symbol);
                // nudge value by step size
                const nudge = (slope ? -stepSize * (res.fx / slope) : 0);
                return [symbol, value + nudge];
            }));

            nextRes = evaluate(nextDef, constraint);
            diff = Math.abs(res.fx - nextRes.fx);

            // if the difference in cost was too large
            // halve the step size and recompute.
            stepSize /= 2;
            done = diff <= stepSize * threshold;
        } while (!done);

        def = nextDef;
        res = nextRes;
        condition = isTermial(res, diff);
    }

    const pointStatus = new Map(points.map((p) => {
        const dfdxx = res.dfdxx.get(p.x)!;
        const dfdyy = res.dfdxx.get(p.y)!;
        const dfdxy = res.dfdxy.get(p)!;

        const h = dfdxx * dfdyy - 4 * dfdxy * dfdxy;

        const status = Math.abs(h) < 1e-10 ? Status.UNDER : Status.STABLE;

        return [p, status];
    }));

    return {
        condition,
        def,
        excluded: [],
        pointStatus,
    } as ISolution;
}

enum StoppedBecause {
    Solved, Local, NoProgress,
}

/**
 * Computes if we should continue trying to probing for a solution
 *
 * @param res the results (with the cost and slope) so far
 * @param costDiff the absolute difference between the current result cost and the previous cost
 */
function isTermial(res: IResult, costDiff: number): StoppedBecause | undefined {

    // we've very close to zero
    const totalCost = Math.abs(res.fx);
    if (totalCost < epsilon) {
        return StoppedBecause.Solved;
    }

    // we're stuck in local minimum that isn't a solution
    const inLocalMinimum = Array.from(res.dfdx.values()).reduce((seed, slope) => {
        return seed && Math.abs(slope) < epsilon;
    }, true);
    if (inLocalMinimum) {
        return StoppedBecause.Local;
    }

    // the cost diff
    if (costDiff < epsilon) {
        return StoppedBecause.NoProgress;
    }

    return undefined;
}
