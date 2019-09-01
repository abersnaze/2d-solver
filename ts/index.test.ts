import test from "ava";

import sayHello from "./index";

test("index", (t) => {
  t.is(sayHello("world"), "Hello world");
});
