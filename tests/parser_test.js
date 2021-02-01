import {
  assertEquals,
  assertThrows,
} from "https://deno.land/std@0.85.0/testing/asserts.ts";
import { parse } from "../src/parser.js";
import { Token } from "../src/types.js";

Deno.test("parse boolean", () => {
  {
    const node = parse("true");
    assertEquals(node.token, Token.BOOLEAN);
    assertEquals(node.value, true);
  }

  {
    const node = parse("false");
    assertEquals(node.token, Token.BOOLEAN);
    assertEquals(node.value, false);
  }
});

Deno.test("parse null", () => {
  const node = parse("null");
  assertEquals(node.token, Token.NULL);
  assertEquals(node.value, null);
});

Deno.test("parse string", () => {
  {
    const node = parse(`"abc"`);
    assertEquals(node.token, Token.STRING);
    assertEquals(node.value, "abc");
  }

  {
    const node = parse(`"\\u0069\\u006a\\u006B"`);
    assertEquals(node.token, Token.STRING);
    assertEquals(node.value, "ijk");
  }

  {
    const node = parse(`"\\n"`);
    assertEquals(node.token, Token.STRING);
    assertEquals(node.value, "\n");
  }

  assertThrows(() => {
    parse('"abc');
  }, SyntaxError);

  assertThrows(() => {
    parse('"\\u00"');
  }, SyntaxError);

  assertThrows(() => {
    parse('"\\u00r0"');
  }, SyntaxError);

  assertThrows(() => {
    parse('"\n"');
  }, SyntaxError);
});

Deno.test("parse number", () => {
  {
    const node = parse(`123`);
    assertEquals(node.token, Token.NUMBER);
    assertEquals(node.value, 123);
  }

  {
    const node = parse(`-123`);
    assertEquals(node.token, Token.NUMBER);
    assertEquals(node.value, -123);
  }

  {
    const node = parse(`0.1`);
    assertEquals(node.token, Token.NUMBER);
    assertEquals(node.value, 0.1);
  }

  {
    const node = parse(`-0.12`);
    assertEquals(node.token, Token.NUMBER);
    assertEquals(node.value, -0.12);
  }

  {
    const node = parse(`1.e4`);
    assertEquals(node.token, Token.NUMBER);
    assertEquals(node.value, 1.e4);
  }

  {
    const node = parse(`10.E-10`);
    assertEquals(node.token, Token.NUMBER);
    assertEquals(node.value, 10.E-10);
  }

  {
    const node = parse(`1.1e4`);
    assertEquals(node.token, Token.NUMBER);
    assertEquals(node.value, 1.1e4);
  }

  assertThrows(() => {
    parse("0123");
  }, SyntaxError);

  assertThrows(() => {
    parse("9".repeat(99999));
  }, RangeError);

  assertThrows(() => {
    parse(".12");
  }, SyntaxError);

  assertThrows(() => {
    parse("-.12");
  }, SyntaxError);

  assertThrows(() => {
    parse("1e4");
  }, SyntaxError);

  assertThrows(() => {
    parse("1.ee4");
  }, SyntaxError);
});

Deno.test("parse empty", () => {
  {
    const node = parse(``);
    assertEquals(node.token, Token.EMPTY);
  }

  {
    const node = parse(`   `);
    assertEquals(node.token, Token.EMPTY);
  }
});

Deno.test("parse invalid source", () => {
  assertThrows(() => {
    parse("&");
  }, SyntaxError);

  assertThrows(() => {
    parse('123 === "abc"');
  }, SyntaxError);
});

Deno.test("parse equal", () => {
  {
    const node = parse(`123 == "abc"`);
    assertEquals(node.token, Token.EQ);
    assertEquals(node.expr1.token, Token.NUMBER);
    assertEquals(node.expr2.token, Token.STRING);
  }

  {
    const node = parse(`123 != "abc"`);
    assertEquals(node.token, Token.NE);
    assertEquals(node.expr1.token, Token.NUMBER);
    assertEquals(node.expr2.token, Token.STRING);
  }

  {
    const node = parse(`123 == "abc" == true`);
    assertEquals(node.token, Token.EQ);
    assertEquals(node.expr1.token, Token.EQ);
    assertEquals(node.expr1.expr1.token, Token.NUMBER);
    assertEquals(node.expr1.expr2.token, Token.STRING);
    assertEquals(node.expr2.token, Token.BOOLEAN);
  }
});

Deno.test("parse priority", () => {
  {
    const node = parse(`123 == "abc" && 234 == "bcd" || 345 == "cde"`);
    assertEquals(node.token, Token.OR);
    assertEquals(node.expr1.token, Token.AND);
    assertEquals(node.expr1.expr1.token, Token.EQ);
    assertEquals(node.expr1.expr2.token, Token.EQ);
    assertEquals(node.expr2.token, Token.EQ);
  }

  {
    const node = parse(`123 == "abc" || 234 == "bcd" && 345 == "cde"`);
    assertEquals(node.token, Token.OR);
    assertEquals(node.expr1.token, Token.EQ);
    assertEquals(node.expr2.token, Token.AND);
    assertEquals(node.expr2.expr1.token, Token.EQ);
    assertEquals(node.expr2.expr2.token, Token.EQ);
  }
});

Deno.test("parse paren", () => {
  {
    const node = parse("(123)");
    assertEquals(node.token, Token.PAREN);
    assertEquals(node.expr.token, Token.NUMBER);
  }

  {
    const node = parse('(123 && "abc") || true');
    assertEquals(node.token, Token.OR);
    assertEquals(node.expr1.token, Token.PAREN);
    assertEquals(node.expr1.expr.token, Token.AND);
    assertEquals(node.expr1.expr.expr1.token, Token.NUMBER);
    assertEquals(node.expr1.expr.expr2.token, Token.STRING);
    assertEquals(node.expr2.token, Token.BOOLEAN);
  }

  {
    const node = parse('123 && ("abc" || true)');
    assertEquals(node.token, Token.AND);
    assertEquals(node.expr1.token, Token.NUMBER);
    assertEquals(node.expr2.token, Token.PAREN);
    assertEquals(node.expr2.expr.token, Token.OR);
    assertEquals(node.expr2.expr.expr1.token, Token.STRING);
    assertEquals(node.expr2.expr.expr2.token, Token.BOOLEAN);
  }

  assertThrows(() => {
    parse("()");
  }, SyntaxError);

  assertThrows(() => {
    parse("()");
  }, SyntaxError);
});
