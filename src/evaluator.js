import {
  BinaryOperatorNode,
  EmptyNode,
  IdentifierNode,
  LiteralNode,
  Token,
} from "./types.js";

function error(message, ErrorClass) {
  return new ErrorClass(`exp-0.666: ${message}`);
}

export function evaluate(node, scope) {
  if (node instanceof BinaryOperatorNode) {
    switch (node.token) {
      case Token.EQ:
        return evaluate(node.expr1, scope) === evaluate(node.expr2, scope);
      case Token.NE:
        return evaluate(node.expr1, scope) !== evaluate(node.expr2, scope);
      case Token.AND:
        return evaluate(node.expr1, scope) && evaluate(node.expr2, scope);
      case Token.OR:
        return evaluate(node.expr1, scope) || evaluate(node.expr2, scope);
    }
    throw error(`unknown AST '${node.token}'.`, TypeError);
  } else if (node instanceof LiteralNode) {
    return node.value;
  } else if (node instanceof IdentifierNode) {
    const name = node.name;
    if (!(name in scope)) {
      throw error(`'${name}' is not found.`, ReferenceError);
    }
    return scope[name];
  } else if (node instanceof EmptyNode) {
    return undefined;
  }
  throw error(`unknown AST '${node.token}'.`, TypeError);
}
