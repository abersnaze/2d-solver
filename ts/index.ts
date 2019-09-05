import { add, Equation, IExpression } from "./exp-ast";
import { Variable } from "./Variable";

interface IPoint {
    x: Variable;
    y: Variable;
}

type Definitions = Map<Variable, number>;
type Points = Map<Variable, IPoint>;

interface IConstraint {
    fx: IExpression;
    dfdx: Map<Variable, IExpression>;
    dfdxy: Map<IPoint, IExpression>;
}

type AltDefinitions = Map<IConstraint[], Definitions>;

export class SystemSolver {
    private constraints = [] as IConstraint[];
    private points = new Map() as Points;

    public startAt(initDef: Definitions): AltDefinitions {
        const finDef = solvePermute(initDef, this.constraints, [], this.points);
        return finDef;
    }

    public addPoint(): IPoint {
        const p = { x: new Variable(), y: new Variable() };
        this.points.set(p.x, p);
        this.points.set(p.y, p);
        return p;
    }

    public addConstraint(exp: Equation): object {
        const constraint = makeConstraint(exp.curr, this.points);
        this.constraints.push(constraint);
        return constraint;
    }

    public removeConstraint(constraint: object): boolean {
        const index = this.constraints.indexOf(constraint as IConstraint);
        if (index > -1) {
            this.constraints.splice(index, 1);
            return true;
        }
        return false;
    }
}

function solvePermute(
    initDef: Definitions,
    constraints: IConstraint[],
    exclude: IConstraint[],
    points: Points): AltDefinitions {

    if (exclude.length > 1) {
        return new Map();
    }

    const combinedConstraints = constraints.filter((constraint) => exclude.indexOf(constraint)).reduce((a, b) => {
        return {
            dfdx: addMaps(a.dfdx, b.dfdx),
            dfdxy: addMaps(a.dfdxy, b.dfdxy),
            fx: add(a.fx, b.fx),
        };
    });

    const [minDef, stopped] = findLocalMinimum(initDef, combinedConstraints);

    return new Map([[[], minDef]]);
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
function makeConstraint(exp: IExpression, points: Points): IConstraint {
    const variables = new Set<Variable>();
    exp.collectVariables(variables);
    const expDx = new Map<Variable, IExpression>();
    const expDxy = new Map<IPoint, IExpression>();

    // get the first derivative for all variables.
    variables.forEach((x) => expDx.set(x, exp.derivative(x)));

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

    return {
        dfdx: expDx,
        dfdxy: expDxy,
        fx: exp,
    };
}

/**
 * how close is close enough
 */
const epsilon = Number.EPSILON;

interface IResult {
    fx: number;
    dfdx: Map<Variable, number>;
    dfdxy: Map<IPoint, number>;
}

function evaluate(def: Definitions, constraint: IConstraint): IResult {
    const fx = constraint.fx.eval(def);

    const dfdx = new Map(Array.from(constraint.dfdx).map(([variable, constraintDfDx]) => {
        return [variable, constraintDfDx.eval(def)];
    }));

    const dfdxy = new Map(Array.from(constraint.dfdxy).map(([variable, constraintDfDxy]) => {
        return [variable, constraintDfDxy.eval(def)];
    }));

    return { fx, dfdx, dfdxy } as IResult;
}

/**
 * Attempts to find a solution for one equation. The method returns where it
 * landed and why it stopped.
 *
 * @param exp the system of equations all added together. The expresion should never be negative
 * @param initDefs the initial start point for the search
 */
function findLocalMinimum(initDefs: Definitions, constraint: IConstraint): [Definitions, StoppedBecause] {

    let def = initDefs;
    let res = evaluate(def, constraint);

    // we don't have a difference so start with near infinite to get through the first step
    let diff = Number.MAX_VALUE;
    let termial = isTermial(res, diff);

    // while not not close enough
    while (termial === undefined) {
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
        termial = isTermial(res, diff);
    }
    return [def, termial];
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
