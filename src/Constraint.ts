import { Expression } from "2d-algebra";
import { Point } from "./Point";

export class Constraint {
    constructor(
        readonly syms: Set<symbol>,
        readonly fx: Expression,
        readonly dfdx: Map<symbol, Expression>,
        readonly dfdxx: Map<symbol, Expression>,
        readonly dfdxy: Map<Point, Expression>) {
    }

    public toString(): string {
        return "{\n" +
            "  fx: " + this.fx.toString(" ".repeat(6)) + "\n" +
            "  dfdx:\n" + Array
                .from(this.dfdx.entries())
                .map(([k, v]) => "    " + k.toString() + " -> " + v.toString(" ".repeat(10)) + "\n")
                .reduce((a, b) => a + b, "") +
            "  dfdxx:\n" + Array
                .from(this.dfdxx.entries())
                .map(([k, v]) => "    " + k.toString() + " -> " + v.toString(" ".repeat(10)) + "\n")
                .reduce((a, b) => a + b, "") +
            "  dfdxy:\n" + Array
                .from(this.dfdxy.entries())
                .map(([k, v]) => "    " + k.toString() + " -> " + v.toString(" ".repeat(13)) + "\n")
                .reduce((a, b) => a + b, "") +
            "\n}";
    }
}
