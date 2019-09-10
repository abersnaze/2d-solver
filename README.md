# 2D Algebra Typescript Module

A library for programatically building up large systems of equations for numerical analysis.

[![NPM Version][npm-image]][npm-url]
[![Downloads Stats][npm-downloads]][npm-url]

## Technologies
Project is created with:
* Typescript version: 3.6.2
* Node version: 12.10.0
* no external dependencies

## Setup
To use this library

`npm install 2d-algebra`

Then in your code you can import and use the `Expression.of(...)` static method to fluently build expressions.

```js
import { Expression } from "2d-algebra";

const m = 3; // slope
const b = 4; // point
const x = Symbol("x");
const y = Symbol(); // naming your symbols is optional
const line = Expression.of(y).eq(m).times(x).plus(b);
```

## API

Creating a new `Expression` is a easy as starting it off with the first `symbol` or `number`.

```
const expression = Expression.of(1);
```

From there you can use the following methods to additional complexity. All methods do not change the existing Expression but return a new Expression (AKA immutable). The `b` argument must be either a `symbol`, `number` or `Expression`.

| Method       | Description                                   |
|--------------|-----------------------------------------------|
| plus(b)      | add the top term to `b` and simplifies        |
| minus(b)     | equivalent to `plus(-b)`                      |
| times(b)     | multiplies the top term with b and simplifies |
| dividedBy(b) | equivalent to `times(b^-1)`                   |
| toThe(n)     | raises the top term by the `number` n.        |
| squared()    | equivalent to `toThe(2)`                      |
| sin()        | replaces the top term with the sin(a)         |
| cos()        | replaces the top term with the cos(a)         |
| tan()        | equivalent to `sin(a).dividedBy(cos(a))`      |
| eq(b)        | equivalent to `minus(b).squared()`            |

Once the expression is complete you can use the following methods

| Method                    | Description                                   |
|---------------------------|-----------------------------------------------|
| eval(Map<symbol, number>) | fully evaluate the expression. throw error if not all of the symbols are defined. |
| derivative(symbol)        | compute the partial derivative with respect to one symbol. |
| toString()                | makes a ASCII art tree diagram of the expression tree. |

### Why no parentheses? `(` or `)`

At this point you've probably run into an expression where you only want to apply the next `times` or `squared` to only part of what comes before. For example the unit (of radius 1) circle one might mistakenly define it as:

```js
const r = 1;
const x = Symbol();
const y = Symbol();

// EXAMPLE OF HOW TO DO IT WRONG
const circle = Expression
  .of(x)      //   x
  .squared()  //   x^2
  .plus(y)    //   x^2 + y
  .squared()  //  (x^2 + y)^2
  .eq(r)      //  (x^2 + y)^2 - r)^2
  .squared(); // ((x^2 + y)^2 - r)^2)^2
```

Would produce `((x^2 + y)^2 - r)^2)^2`. When I would have expected `(x^2 + y^2 - r^2)^2`. Notice how in the wrong expression each application of the `squared()` applied to the whole of expression defined up to that point. To fix this I'll introduce the `push(b)` method that starts a new mini expression separate from what has been defined so far. When `push` is used new zero argument versions of `plus()`, `minus()`, `times()`, `divide()`, and `eq()` are available to cause the two mini expressions to be merged into one again.

The corrected code now looks like:

```js
const circle = Expression
  .of(x)      //  x
  .squared()  //  x^2
  .push(y)    //  x^2 | y   <---- y here is separate from x^2
  .squared()  //  x^2 | y^2 <---- now that y is squared on its own
  .plus()     //  x^2 + y^2 <---- merge y^2 by adding it to x^2
  .push(r)    //  x^2 + y^2 | r
  .squared()  //  x^2 + y^2 | r^2
  .eq();      // (x^2 + y^2 - r^2)^2
```

## Contributing

To submit changes to the project

1. fork and clone the git repository
2. make changes to the tests and source.
   * If making changes to the `Expression` class make sure matching changes are made to `ExpressionStack`.
   * Changes to simplification logic can be quite tricky with all the symbiotic recursion.
3. run `npm test`. if they fail goto step 2
4. push changes to your fork
5. submit pull request

### Other ussful  commands

* `npm run clean`: clean the output folders `./dist`.
* `npm run lint`: lint the ts files
* `npm run compile`: compile the typescript code to POJS
* `npm run test`: run unit tests once.
* `npm run watch`: continuously run unit tests.

<!-- Markdown link & img dfn's -->
[npm-image]: https://img.shields.io/npm/v/2d-algebra.svg?style=flat-square
[npm-url]: https://npmjs.org/package/2d-algebra
[npm-downloads]: https://img.shields.io/npm/dm/2d-algebra.svg?style=flat-square
[wiki]: https://github.com/abersnaze/2d-algebra/wiki
