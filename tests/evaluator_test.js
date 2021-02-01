import {
  assertEquals,
  fail,
} from "https://deno.land/std@0.85.0/testing/asserts.ts";
import { execute } from "../src/index.js";

Deno.test("execute literal", () => {
  assertEquals(true, execute("true", {}));
  assertEquals(false, execute("false", {}));
  assertEquals(null, execute("null", {}));
  assertEquals("abc", execute(`"abc"`, {}));
  assertEquals(123, execute("123", {}));
});

Deno.test("execute identifier", () => {
  assertEquals(123, execute("foo", { foo: 123 }));
});

Deno.test("execute binary expression", () => {
  assertEquals(
    2,
    execute("foo && bar", {
      foo: 1,
      bar: 2,
    }),
  );
  assertEquals(
    0,
    execute("foo && bar", {
      foo: 0,
      get bar() {
        fail();
      },
    }),
  );
  assertEquals(
    1,
    execute("foo || bar", {
      foo: 1,
      get bar() {
        fail();
      },
    }),
  );
  assertEquals(
    2,
    execute("foo || bar", {
      foo: 0,
      bar: 2,
    }),
  );
});
