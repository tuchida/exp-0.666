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
  constructor(token) {
    this.token = token;
  }

  toString(indent = 0) {
    throw new Error("must override");
  }
}

class LiteralNode extends ExpressionNode {
  constructor(token, value) {
    super(token);
    this.value = value;
  }

  toString(indent = 0) {
    return `${" ".repeat(indent * 2)}${this.token}: ${this.value}`;
  }
}

class IdentifierNode extends ExpressionNode {
  constructor(token, name) {
    super(token);
    this.name = name;
  }

  toString(indent = 0) {
    return `${" ".repeat(indent * 2)}${this.token}: ${this.name}`;
  }
}

class BinaryOperatorNode extends ExpressionNode {
  constructor(token, expr1, expr2) {
    super(token);
    this.expr1 = expr1;
    this.expr2 = expr2;
  }

  toString(indent = 0) {
    return `${" ".repeat(indent * 2)}${this.token}:
${this.expr1.toString(indent + 1)}
${this.expr2.toString(indent + 1)}`;
  }
}

class EmptyNode extends ExpressionNode {
  constructor(token, value) {
    super(token);
  }

  toString(indent = 0) {
    return `${" ".repeat(indent * 2)}${this.token}`;
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
