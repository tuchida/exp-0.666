import {
  BinaryOperatorNode,
  EmptyNode,
  IdentifierNode,
  LiteralNode,
  ParenthesizedNode,
  Token,
} from "./types.js";

function error(message, node, source, ErrorClass) {
  const { pos } = node;
  let posMessage = "";
  if (source != null) {
    posMessage = `
${source}
${" ".repeat(pos)}^`;
  }
  return Object.assign(
    new ErrorClass(`exp-0.666:${pos}: ${message}${posMessage}`),
    { pos },
  );
}

export function evaluate(node, scope, source = null) {
  if (node instanceof BinaryOperatorNode) {
    switch (node.token) {
      case Token.EQ:
        return evaluate(node.expr1, scope, source) ===
          evaluate(node.expr2, scope, source);
      case Token.NE:
        return evaluate(node.expr1, scope, source) !==
          evaluate(node.expr2, scope, source);
      case Token.AND:
        return evaluate(node.expr1, scope, source) &&
          evaluate(node.expr2, scope, source);
      case Token.OR:
        return evaluate(node.expr1, scope, source) ||
          evaluate(node.expr2, scope, source);
    }
    throw error(`unknown AST '${node.token}'.`, node, source, TypeError);
  } else if (node instanceof ParenthesizedNode) {
    return evaluate(node, scope, source);
  } else if (node instanceof LiteralNode) {
    return node.value;
  } else if (node instanceof IdentifierNode) {
    const name = node.name;
    if (!Object.prototype.hasOwnProperty.call(scope, name)) {
      throw error(`'${name}' is not found.`, node, source, ReferenceError);
    }
    return scope[name];
  } else if (node instanceof EmptyNode) {
    return undefined;
  }
  throw error(`unknown AST '${node.token}'.`, node, source, TypeError);
}
