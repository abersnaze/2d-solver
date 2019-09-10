import { Variable } from "./exp/Variable";

export class Point {
    constructor(readonly x: Variable, readonly y: Variable) { }

    public toString() {
        return "(" + this.x + "," + this.y + ")";
    }
}
