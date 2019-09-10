import * as math from "mathjs";
import { Point } from "./Point";
require("mathjs/src/expression/node/")

math.parse("(x - 3)^2 + (y - 2)^2");

export class Constraint {
    constructor(
        readonly fx: IExpression,
        readonly dfdx: Map<Variable, IExpression>,
        readonly dfdxx: Map<Variable, IExpression>,
        readonly dfdxy: Map<Point, IExpression>) { }

    public toString(): string {
        return "{\n" +
            "  fx: " + this.fx.toString(" ".repeat(6)) + "\n" +
            "  dfdx:\n" + Array
                .from(this.dfdx.entries())
                .map(([k, v]) => "    " + k + " -> " + v.toString(" ".repeat(10)) + "\n")
                .reduce((a, b) => a + b) +
            "  dfdxx:\n" + Array
                .from(this.dfdxx.entries())
                .map(([k, v]) => "    " + k + " -> " + v.toString(" ".repeat(10)) + "\n")
                .reduce((a, b) => a + b) +
            "  dfdxy:\n" + Array
                .from(this.dfdxy.entries())
                .map(([k, v]) => "    " + k.toString() + " -> " + v.toString(" ".repeat(13)) + "\n")
                .reduce((a, b) => a + b) +
            "\n}";
    }
}
