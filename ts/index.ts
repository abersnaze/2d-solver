import { Constraint } from "./Constraint";
import { Point } from "./Point";

type Definitions = Map<Variable, number>;
type Points = Map<Variable, Point>;

interface ISolution {
    def: Definitions;
    pointStatus: Map<Point, Status>;
    excluded: Constraint[];
    condition: StoppedBecause;
}

export enum Status { UNDER, STABLE, OVER }

export class SystemSolver {
    public points = new Map() as Points;
    private constraints = [] as Constraint[];

    public startAt(initDef: Definitions): ISolution[] {
        const finDef = solvePermute(initDef, this.constraints, [], this.points);
        return finDef;
    }

    public addPoint(): Point {
        const p = new Point(new Variable(), new Variable());
        this.points.set(p.x, p);
        this.points.set(p.y, p);
        return p;
    }

    public addConstraint(exp: IExpression): object {
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
    initDef: Definitions,
    constraints: Constraint[],
    exclude: Constraint[],
    points: Points): ISolution[] {

    if (exclude.length > 1) {
        return [];
    }

    const combinedConstraints = constraints.filter((constraint) => exclude.indexOf(constraint)).reduce((a, b) => {
        return new Constraint(
            add(a.fx, b.fx),
            addMaps(a.dfdx, b.dfdx),
            addMaps(a.dfdxx, b.dfdxx),
            addMaps(a.dfdxy, b.dfdxy),
        );
    });

    const solution = findLocalMinimum(initDef, combinedConstraints, Array.from(points.values()));

    return [solution];
}

function addMaps<K>(as: Map<K, IExpression>, bs: Map<K, IExpression>): Map<K, IExpression> {
    const cs = new Map(as);
    for (const [key, b] of bs) {
        const a = cs.get(key);
        if (a === undefined) {
            cs.set(key, b);
        } else {
            cs.set(key, add(a, b));
        }
    }
    return cs;
}

/**
 * compute cost function, first derivative for each variable, and second derivative for each point.
 * @param constraints
 * @param points
 */
export function makeConstraint(exp: IExpression, points: Points): Constraint {
    const variables = new Set<Variable>();
    exp.variables(variables);
    const expDx = new Map<Variable, IExpression>();
    const expDxx = new Map<Variable, IExpression>();
    const expDxy = new Map<Point, IExpression>();

    // get the first derivative for all variables.
    variables.forEach((x) => {
        const dx = exp.derivative(x);
        expDx.set(x, dx);
        expDxx.set(x, dx.derivative(x));
    });

    // get the second derivatives for each point
    for (const x of variables) {
        const p = points.get(x);
        // x is not part of a point or we've already computed it from y
        if (p === undefined || expDxy.has(p)) {
            continue;
        }
        // get the variable that isn't x
        const y = p.x === x ? p.y : p.x;

        // derivative the 2nd from the 1st
        const dx = expDx.get(x)!;
        const dxy = dx.derivative(y);

        expDxy.set(p, dxy);
    }

    return new Constraint(exp, expDx, expDxx, expDxy);
}

/**
 * how close is close enough
 */
const epsilon = Number.EPSILON;

interface IResult {
    fx: number;
    dfdx: Map<Variable, number>;
    dfdxx: Map<Variable, number>;
    dfdxy: Map<Point, number>;
}

function evaluate(def: Definitions, constraint: Constraint): IResult {
    const fx = constraint.fx.eval(def);

    const dfdx = new Map(Array.from(constraint.dfdx).map(([variable, constraintDfDx]) => {
        return [variable, constraintDfDx.eval(def)];
    }));

    const dfdxx = new Map(Array.from(constraint.dfdxx).map(([variable, constraintDfDxx]) => {
        return [variable, constraintDfDxx.eval(def)];
    }));

    const dfdxy = new Map(Array.from(constraint.dfdxy).map(([variable, constraintDfDxy]) => {
        return [variable, constraintDfDxy.eval(def)];
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
function findLocalMinimum(initDefs: Definitions, constraint: Constraint, points: Point[]): ISolution {
    console.log("constraint", constraint.toString());

    let def = initDefs;
    let res = evaluate(def, constraint);

    // we don't have a difference so start with near infinite to get through the first step
    let diff = Number.MAX_VALUE;
    let condition = isTermial(res, diff);

    // while not not close enough
    while (condition === undefined) {
        console.log(def);

        // use the magnitude of the slope as a threshold for the amount of change that
        // we expect to see in the change of the cost after we step
        const threshold = Math.sqrt(Array.from(res.dfdx.values()).reduce((sum, slope) => sum + slope * slope, 0));

        let stepSize = 1.0;
        let nextDef;
        let nextRes;
        let done = false;
        do {
            // for each variable:value
            nextDef = new Map(Array.from(def).map(([variable, value]) => {
                // get the slope from the constraint
                const slope = res.dfdx.get(variable);
                // nudge value by step size
                const nudge = (slope ? -stepSize * (res.fx / slope) : 0);
                return [variable, value + nudge];
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

        const h = dfdxx * dfdyy - dfdxy * dfdxy;
        const status = h < 1e-10 ? Status.UNDER : Status.STABLE;

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
