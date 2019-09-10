export class Point {
    private static idSequence = 1;

    public readonly x: symbol;
    public readonly y: symbol;

    constructor(n: symbol) {
        const description = (n as any).description || ("p" + Point.idSequence++);

        this.x = Symbol(description + "x");
        this.y = Symbol(description + "y");
    }

    public toString() {
        return "(" + (this.x as any).description + "," + (this.y as any).description + ")";
    }
}
