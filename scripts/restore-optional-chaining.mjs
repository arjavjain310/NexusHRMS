import fs from "fs";
import path from "path";
import * as parser from "@babel/parser";
import _traverse from "@babel/traverse";
import _generate from "@babel/generator";
import t from "@babel/types";

const traverse = _traverse.default || _traverse;
const generate = _generate.default || _generate;
import { fileURLToPath } from "url";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".next") continue;
      walk(full, files);
    } else if (/\.(js|jsx)$/.test(entry.name)) {
      files.push(full);
    }
  }
  return files;
}

function applyChainOp(expr, op, arrow) {
  const optional = op === "optionalAccess" || op === "optionalCall";
  const body = arrow.body;
  const param = arrow.params[0];
  const paramName = t.isIdentifier(param) ? param.name : null;

  if (op === "access" || op === "optionalAccess") {
    if (!t.isMemberExpression(body)) return null;
    if (paramName && !t.isIdentifier(body.object, { name: paramName })) return null;
    const prop = body.computed ? body.property : t.identifier(body.property.name);
    return t.memberExpression(expr, prop, body.computed, optional);
  }

  if (op === "call" || op === "optionalCall") {
    if (!t.isCallExpression(body)) return null;
    const { callee, arguments: args } = body;

    if (t.isMemberExpression(callee) && paramName && t.isIdentifier(callee.object, { name: paramName })) {
      const member = t.memberExpression(expr, callee.property, callee.computed);
      if (optional) {
        return t.optionalCallExpression(member, args, false);
      }
      return t.callExpression(member, args);
    }

    if (t.isIdentifier(callee, { name: paramName })) {
      if (optional) {
        return t.optionalCallExpression(expr, args, false);
      }
      return t.callExpression(expr, args);
    }
  }

  return null;
}

function decodeOptionalChain(callExpr) {
  const arg = callExpr.arguments[0];
  if (!t.isArrayExpression(arg) || !arg.elements.length) return null;

  let expr = arg.elements[0];
  if (!expr) return null;

  for (let i = 1; i < arg.elements.length; i += 2) {
    const opNode = arg.elements[i];
    const fnNode = arg.elements[i + 1];
    if (!t.isStringLiteral(opNode) || !t.isArrowFunctionExpression(fnNode)) return null;
    const next = applyChainOp(expr, opNode.value, fnNode);
    if (!next) return null;
    expr = next;
  }

  return expr;
}

function decodeNullishCoalesce(callExpr) {
  const [lhs, rhsFn] = callExpr.arguments;
  if (!t.isArrowFunctionExpression(rhsFn)) return null;
  return t.logicalExpression("??", lhs, rhsFn.body);
}

function fixFile(filePath) {
  let code = fs.readFileSync(filePath, "utf8");
  if (!code.includes("_optionalChain") && !code.includes("_nullishCoalesce")) {
    return false;
  }

  code = code.replace(/\}\s*("use (?:client|server)";)/g, "}\n\n$1");
  code = code.replace(/("use (?:client|server)";)\s*import/g, "$1\n\nimport");
  code = code.replace(/^if \(op === 'access'[\s\S]*?return value; \}\s*/m, "");

  let ast;
  try {
    ast = parser.parse(code, {
      sourceType: "module",
      plugins: ["jsx"],
    });
  } catch (e) {
    console.error("Parse failed:", filePath, e.message);
    return false;
  }

  const directives = [];

  traverse(ast, {
    Program(path) {
      path.node.body = path.node.body.filter((node) => {
        if (t.isFunctionDeclaration(node) && node.id) {
          return !["_optionalChain", "_nullishCoalesce"].includes(node.id.name);
        }
        if (t.isExpressionStatement(node) && t.isStringLiteral(node.expression)) {
          const v = node.expression.value;
          if (v === "use client" || v === "use server") {
            directives.push(v);
            return false;
          }
        }
        return true;
      });
    },
    CallExpression(path) {
      if (t.isIdentifier(path.node.callee, { name: "_optionalChain" })) {
        const decoded = decodeOptionalChain(path.node);
        if (decoded) path.replaceWith(decoded);
      }
      if (t.isIdentifier(path.node.callee, { name: "_nullishCoalesce" })) {
        const decoded = decodeNullishCoalesce(path.node);
        if (decoded) path.replaceWith(decoded);
      }
    },
  });

  let output = generate(ast, { retainLines: false }).code;
  const uniqueDirectives = [...new Set(directives)];
  if (uniqueDirectives.length) {
    output = `${uniqueDirectives.map((d) => `"${d}";`).join("\n")}\n\n${output}`;
  }

  fs.writeFileSync(filePath, output, "utf8");
  return true;
}

let count = 0;
for (const file of walk(path.join(ROOT, "src"))) {
  if (fixFile(file)) {
    console.log("Restored", path.relative(ROOT, file));
    count++;
  }
}

console.log(`Done: ${count} files`);
