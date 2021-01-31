import { parse } from "./parser.js";
import { evaluate } from "./evaluator.js";

export function execute(source, scope) {
  return evaluate(parse(source), scope);
}
