import fs from "fs";
import path from "path";

const ROOT = path.resolve(import.meta.dirname, "..");
const HELPER_OPT =
  /^ ?function _optionalChain\(ops\) \{[\s\S]*?\} ?/;
const HELPER_NULL =
  /^ ?function _nullishCoalesce\(lhs, rhsFn\) \{[\s\S]*?\} ?/;

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

function extractHelpers(content) {
  let helpers = "";
  let rest = content;
  let changed = true;
  while (changed) {
    changed = false;
    const mNull = rest.match(HELPER_NULL);
    if (mNull) {
      helpers += mNull[0].trim() + "\n\n";
      rest = rest.slice(mNull[0].length);
      changed = true;
    }
    const mOpt = rest.match(HELPER_OPT);
    if (mOpt) {
      helpers += mOpt[0].trim() + "\n\n";
      rest = rest.slice(mOpt[0].length);
      changed = true;
    }
  }
  return { helpers: helpers.trim(), rest: rest.trimStart() };
}

function extractDirectives(content) {
  const directives = [];
  let rest = content;

  const glued = rest.match(/^("use (?:client|server)";)/);
  if (glued) {
    directives.push(glued[1]);
    rest = rest.slice(glued[1].length).trimStart();
  }

  const atStart = rest.match(/^("use (?:client|server)";\s*\n)/);
  if (atStart) {
    directives.push(atStart[1].trim());
    rest = rest.slice(atStart[0].length);
  }

  return { directives: [...new Set(directives)], rest };
}

for (const filePath of walk(path.join(ROOT, "src"))) {
  let content = fs.readFileSync(filePath, "utf8");
  if (!content.includes("_optionalChain") && !content.includes("_nullishCoalesce")) {
    if (content.match(/^function _optionalChain|^\}import/)) {
      // no-op
    } else {
      continue;
    }
  }

  const { helpers, rest: afterHelpers } = extractHelpers(content);
  const { directives, rest } = extractDirectives(afterHelpers);

  const parts = [];
  if (directives.length) parts.push(directives.join("\n"), "");
  if (helpers) parts.push(helpers, "");
  parts.push(rest.replace(/^\}import/, "}\nimport"));

  const next = parts.join("\n");
  if (next !== content) {
    fs.writeFileSync(filePath, next, "utf8");
    console.log("Fixed", path.relative(ROOT, filePath));
  }
}
