import test from "ava";
import { add, mult, value, variable } from "./exp-ast";

test("(5+x)(x+y)", (t) => {
  const x1 = variable();
  const x2 = variable();

  const q = mult(add(value(5), x1), add(x1, x2));
  t.is(q.toString(), "x1*x1 + x1*x2 + 5*x1 + 5*x2");

  const dqdx1 = q.derivative(x1);
  t.is(dqdx1.toString(), "2*x1 + x2 + 5");

  const dqdx2 = q.derivative(x2);
  t.is(dqdx2.toString(), "x1 + 5");

  const dqdx1dx2 = dqdx1.derivative(x2);
  t.is(dqdx1dx2.toString(), "1");

  const dqdx2dx1 = dqdx2.derivative(x1);
  t.is(dqdx2dx1.toString(), "1");
});
