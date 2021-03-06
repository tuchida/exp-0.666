import {
  BinaryOperatorNode,
  EmptyNode,
  IdentifierNode,
  LiteralNode,
  ParenthesizedNode,
  Token,
} from "./types.js";

class Input {
  constructor(text) {
    this.text = text;
    this.pos = 0;
  }

  getChar() {
    return this.text[this.pos++];
  }

  ungetChar(/* unused */ c) {
    this.pos--;
  }

  peekChar() {
    return this.text[this.pos];
  }

  eof() {
    return this.pos >= this.text.length;
  }

  expect(s) {
    const len = s.length;
    for (let i = 0; i < len; i++) {
      if (s[i] !== this.text[this.pos + i]) {
        return false;
      }
    }
    this.pos += len;
    return true;
  }
}

function printChar(c) {
  if (c < "\u0020") { // control charactor
    return `\\u${("000" + c.charCodeAt(0).toString(16)).slice(-4)}`;
  }
  return c;
}

function error(message, input, offset, ErrorClass = SyntaxError) {
  // TODO: 改行を考慮したエラーの位置
  const pos = input.pos + offset;
  return Object.assign(
    new ErrorClass(`exp-0.666:${pos}: ${message}
${input.text}
${" ".repeat(pos)}^`),
    { pos },
  );
}

function parseString(input) {
  const pos = input.pos - 1;
  let result = "";
  while (!input.eof()) {
    const c = input.getChar();
    if (c === '"') {
      return new LiteralNode(Token.STRING, pos, result);
    } else if (c === "\\") {
      switch (input.getChar()) {
        case '"': // quotation mark U+0022
          result += '"';
          break;
        case "\\": // reverse solidus U+005C
          result += "\\";
          break;
        case "/": // solidus U+002F
          result += "/";
          break;
        case "b": // backspace U+0008
          result += "\u0008";
          break;
        case "f": // form feed U+000C
          result += "\u000C";
          break;
        case "n": // line feed U+000A
          result += "\u000A";
          break;
        case "r": // carriage return U+000D
          result += "\u000D";
          break;
        case "t": // tab U+0009
          result += "\u0009";
          break;
        case "u": // 4HEXDIG
          let digits = "";
          for (let i = 0; i < 4; i++) {
            const c = input.getChar();
            if (
              !("0" <= c && c <= "9") &&
              !("A" <= c && c <= "F") &&
              !("a" <= c && c <= "f")
            ) {
              throw error(
                `The charactor '${
                  printChar(c)
                }' cannot be used in Unicode Escape Sequence.`,
                input,
                -1,
              );
            }
            digits += c;
          }
          result += String.fromCharCode(parseInt(digits, 16));
      }
      // TODO: line break
    } else if (c < "\u0020") { // control charactor
      throw error(
        `The control charactor '${printChar(c)}' cannot be used in a string.`,
        input,
        -1,
      );
    } else {
      result += c;
    }
  }
  throw error("The string could not be closed.", input, 0);
}

function parseNumber(input, c) {
  const { pos } = input;
  let str = c;
  let decimal = false;

  if (c === "-") {
    c = input.getChar();
    if (!("0" <= c && c <= "9")) {
      throw error(
        `The charactor '${printChar(c)}' cannot be used in a number.`,
        input,
        -1,
      );
    }
    str += c;
  }
  if (c === "0" && input.peekChar() !== ".") {
    throw error(`The number cannot start from 0.`, input, -1);
  }

  while (!input.eof()) {
    const c = input.getChar();
    if ("0" <= c && c <= "9") {
      str += c;
    } else if (c === ".") {
      str += c;
      decimal = true;
      break;
    } else {
      input.ungetChar(c);
      break;
    }
  }

  if (decimal) {
    let isExponent = false;
    while (!input.eof()) {
      const c = input.getChar();
      if ("0" <= c && c <= "9") {
        str += c;
      } else if (c === "e" || c === "E") {
        str += c;
        isExponent = true;
        break;
      } else {
        input.ungetChar(c);
        break;
      }
    }

    if (isExponent) {
      let c = input.peekChar();
      if (c === "+" || c === "-") {
        str += input.getChar();
      }
      c = input.getChar();
      if (!("0" <= c && c <= "9")) {
        throw error(
          `The charactor '${printChar(c)}' cannot be used in a number.`,
          input,
          -1,
        );
      }
      str += c;
      while (!input.eof()) {
        const c = input.getChar();
        if ("0" <= c && c <= "9") {
          str += c;
        } else {
          input.ungetChar(c);
          break;
        }
      }
    }
  }

  const result = Number(str);
  if (isNaN(result) || result === Infinity || result === -Infinity) {
    throw error(
      "This is outside the range of what can be expressed in IEEE 754-2019.",
      input,
      pos - input.pos - 1,
      RangeError,
    );
  }
  return new LiteralNode(Token.NUMBER, pos, result);
}

function parseIdentifier(input, c) {
  const pos = input.pos - 1;
  let name = c;

  while (!input.eof()) {
    const c = input.getChar();
    if (
      ("a" <= c && c <= "z") ||
      ("A" <= c && c <= "Z") ||
      ("0" <= c && c <= "9") ||
      c === "$" || c === "_"
    ) {
      name += c;
    } else {
      input.ungetChar(c);
      break;
    }
  }

  switch (name) {
    case "true":
      return new LiteralNode(Token.BOOLEAN, pos, true);
    case "false":
      return new LiteralNode(Token.BOOLEAN, pos, false);

    case "null":
      return new LiteralNode(Token.NULL, pos, null);

    default:
      return new IdentifierNode(Token.NAME, pos, name);
  }
}

function skipComment(input) {
  if (input.peekChar() === "/") {
    const c = input.getChar();
    switch (input.peekChar()) {
      case "/": // single line comment
        input.getChar();
        while (!input.eof()) {
          const c = input.getChar();
          // TODO line break
          if (c === "\u000A" || c === "\u000D") {
            break;
          }
        }
        return true;

      case "*": // multi line comment
        input.getChar();
        while (!input.eof()) {
          const c = input.getChar();
          if (c === "*") {
            if (input.peekChar() === "/") {
              input.getChar();
              return true;
            }
          }
        }
        throw error("The comment could not be closed.", input, 0);

      default:
        input.ungetChar(c);
    }
  }
  return false;
}

function skipWhiteSpace(input) {
  // TODO unicode
  switch (input.peekChar()) {
    case "\u0020": // Space
    case "\u0009": // Horizontal tab
    case "\u000A": // Line feed or New line
    case "\u000D": // Carriage return
      input.getChar();
      return true;
    default:
      return false;
  }
}

function skip(input) {
  while (skipWhiteSpace(input) || skipComment(input)) {}
}

function parseUnary(input) {
  const c = input.getChar();
  // String
  if (c === '"') {
    return parseString(input);
  }
  // Number
  if (("0" <= c && c <= "9") || c === "-") {
    return parseNumber(input, c);
  }
  // Identifier
  if (
    ("a" <= c && c <= "z") ||
    ("A" <= c && c <= "Z") ||
    c === "$" || c === "_"
  ) {
    return parseIdentifier(input, c);
  }
  throw error("missing expression.", input, -1);
}

function parseParenExpr(input) {
  if (input.peekChar() !== "(") {
    return parseUnary(input);
  }
  const { pos } = input;
  input.getChar();

  skip(input);
  const expr = parseExpr(input);
  skip(input);

  if (input.peekChar() !== ")") {
    throw error("The paren could not be closed.", input, 0);
  }
  input.getChar();

  return new ParenthesizedNode(Token.PAREN, pos, expr);
}

function parseBinaryExpr(input, nextParse, expect) {
  let expr = nextParse(input);
  skip(input);

  while (!input.eof()) {
    const { pos } = input;
    const token = expect(input);
    if (token === null) {
      return expr;
    }

    skip(input);
    const expr2 = nextParse(input);
    skip(input);

    expr = new BinaryOperatorNode(token, pos, expr, expr2);
  }

  return expr;
}

function parseEqual(input) {
  return parseBinaryExpr(input, parseParenExpr, (input) => {
    if (input.expect("==")) {
      return Token.EQ;
    } else if (input.expect("!=")) {
      return Token.NE;
    }
    return null;
  });
}

function parseAnd(input) {
  return parseBinaryExpr(input, parseEqual, (input) => {
    if (input.expect("&&")) {
      return Token.AND;
    }
    return null;
  });
}

function parseOr(input) {
  return parseBinaryExpr(input, parseAnd, (input) => {
    if (input.expect("||")) {
      return Token.OR;
    }
    return null;
  });
}

function parseExpr(input) {
  return parseOr(input);
}

export function parse(text) {
  const input = new Input(text);

  skip(input);
  // empty script
  if (input.eof()) {
    return new EmptyNode(Token.EMPTY, 0);
  }
  const result = parseExpr(input);
  skip(input);

  if (!input.eof()) {
    throw error(
      `'${printChar(input.peekChar())}' is a character that is not expected.`,
      input,
      0,
    );
  }

  return result;
}
