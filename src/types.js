const Token = Object.freeze({
  STRING: "string",
  NUMBER: "number",
  BOOLEAN: "boolean",
  NULL: "null",
  NAME: "name",
  EMPTY: "empty",
  EQ: "eq",
  NE: "ne",
  AND: "and",
  OR: "or",
});

class ExpressionNode {
  constructor(token, pos) {
    this.token = token;
    this.pos = pos;
  }

  toString(indent = 0) {
    throw new Error("must override");
  }
}

class LiteralNode extends ExpressionNode {
  constructor(token, pos, value) {
    super(token, pos);
    this.value = value;
  }

  toString(indent = 0) {
    return `${" ".repeat(indent * 2)}${this.token}:${this.pos}: ${this.value}`;
  }
}

class IdentifierNode extends ExpressionNode {
  constructor(token, pos, name) {
    super(token, pos);
    this.name = name;
  }

  toString(indent = 0) {
    return `${" ".repeat(indent * 2)}${this.token}:${this.pos}: ${this.name}`;
  }
}

class BinaryOperatorNode extends ExpressionNode {
  constructor(token, pos, expr1, expr2) {
    super(token, pos);
    this.expr1 = expr1;
    this.expr2 = expr2;
  }

  toString(indent = 0) {
    return `${" ".repeat(indent * 2)}${this.token}:${this.pos}:
${this.expr1.toString(indent + 1)}
${this.expr2.toString(indent + 1)}`;
  }
}

class EmptyNode extends ExpressionNode {
  constructor(token, pos) {
    super(token, pos);
  }

  toString(indent = 0) {
    return `${" ".repeat(indent * 2)}${this.token}:${this.pos}`;
  }
}

export {
  BinaryOperatorNode,
  EmptyNode,
  ExpressionNode,
  IdentifierNode,
  LiteralNode,
  Token,
};
