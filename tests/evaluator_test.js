import {
  assertEquals,
  assertThrows,
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
  assertThrows(() => {
    execute("foo", { bar: 123 });
  }, ReferenceError);
  assertThrows(() => {
    execute("toString", {});
  }, ReferenceError);
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

  assertEquals(true, execute("123 == abc", { abc: 123 }));
  assertEquals(false, execute("123 == abc", { abc: 1234 }));
  assertEquals(false, execute("123 == abc", { abc: "123" }));
  assertEquals(false, execute("123 != abc", { abc: 123 }));
  assertEquals(true, execute("123 != abc", { abc: 1234 }));
  assertEquals(true, execute("123 != abc", { abc: "123" }));

  assertEquals(false, execute(`true == "abc" == "abc"`, {}));
  assertEquals(true, execute(`"abc" == "abc" == true`, {}));
});
