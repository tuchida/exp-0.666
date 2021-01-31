import {
  BinaryOperatorNode,
  EmptyNode,
  IdentifierNode,
  LiteralNode,
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
}

function printChar(c) {
  if (c < "\u0020") { // control charactor
    return ("\\u000" + c.charCodeAt(0).toString(16)).slice(-6);
  }
  return c;
}

function error(message, input, offset, ErrorClass = SyntaxError) {
  return new ErrorClass(`exp-0.666 error:${input.pos + offset}: ${message}`);
}

function parseString(input) {
  let result = "";
  while (!input.eof()) {
    const c = input.getChar();
    if (c === '"') {
      return new LiteralNode(Token.STRING, result);
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
                `'${
                  printChar(c)
                }' is the character that cannot be used in Unicode Escape Sequence.`,
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
  let str = c;
  let decimal = false;

  if (c === "0" || (c === "-" && input.peekChar() === "0")) {
    throw error(`The number cannot start from 0.`, input, c === "-" ? 0 : -1);
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
      -1,
      RangeError,
    );
  }
  return new LiteralNode(Token.NUMBER, result);
}

function parseIdentifier(input, c) {
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
      return new LiteralNode(Token.BOOLEAN, true);
    case "false":
      return new LiteralNode(Token.BOOLEAN, false);

    case "null":
      return new LiteralNode(Token.NULL, null);

    default:
      return new IdentifierNode(Token.NAME, name);
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

  input.ungetChar(c);
  return null;
}

function parseBinaryExpr(input, nextParse, expect) {
  let expr = nextParse(input);
  skip(input);

  if (expr === null || input.eof()) {
    return expr;
  }

  while (!input.eof()) {
    const token = expect(input);
    if (token === null) {
      return expr;
    }

    skip(input);
    const expr2 = nextParse(input);
    if (expr2 === null) {
      throw error("missing expression.", input, 0);
    }
    skip(input);

    expr = new BinaryOperatorNode(token, expr, expr2);
  }

  return expr;
}

function parseEqual(input) {
  return parseBinaryExpr(input, parseUnary, (input) => {
    switch (input.peekChar()) {
      case "=":
        {
          const c = input.getChar();
          if (input.peekChar() === "=") {
            input.getChar();
            return Token.EQ;
          }
          input.ungetChar(c);
        }
        break;

      case "!":
        {
          const c = input.getChar();
          if (input.peekChar() === "=") {
            input.getChar();
            return Token.NE;
          }
          input.ungetChar(c);
        }
        break;
    }
    return null;
  });
}

function parseAnd(input) {
  return parseBinaryExpr(input, parseEqual, (input) => {
    if (input.peekChar() === "&") {
      const c = input.getChar();
      if (input.peekChar() === "&") {
        input.getChar();
        return Token.AND;
      }
      input.ungetChar(c);
    }
    return null;
  });
}

function parseOr(input) {
  return parseBinaryExpr(input, parseAnd, (input) => {
    if (input.peekChar() === "|") {
      const c = input.getChar();
      if (input.peekChar() === "|") {
        input.getChar();
        return Token.OR;
      }
      input.ungetChar(c);
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
  let result = parseExpr(input);
  skip(input);

  if (!input.eof()) {
    throw error(
      `'${printChar(input.peekChar())}' is a character that is not expected.`,
      input,
      0,
    );
  }

  // empty script
  if (result === null) {
    result = new EmptyNode(Token.EMPTY, null);
  }

  return result;
}
