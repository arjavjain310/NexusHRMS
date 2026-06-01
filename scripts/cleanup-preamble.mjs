import fs from "fs";
import path from "path";

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

for (const filePath of walk(path.join(ROOT, "src"))) {
  let code = fs.readFileSync(filePath, "utf8");
  if (!code.includes("_optionalChain") && !code.includes("_nullishCoalesce")) continue;

  const hadUseClient = /"use client";/.test(code);
  const hadUseServer = /"use server";/.test(code);

  if (hadUseClient) {
    code = code.replace(/^[\s\S]*?"use client";\s*/m, "");
    code = `"use client";\n\n${code}`;
  } else if (hadUseServer) {
    code = code.replace(/^[\s\S]*?"use server";\s*/m, "");
    code = `"use server";\n\n${code}`;
  } else {
    code = code.replace(
      /^function _nullishCoalesce[\s\S]*?(?=import|\/\*\*)/m,
      ""
    );
    code = code.replace(/^function _optionalChain[\s\S]*?(?=import|\/\*\*)/m, "");
  }

  code = code.replace(/\n{3,}/g, "\n\n");
  fs.writeFileSync(filePath, code, "utf8");
  console.log("Cleaned", path.relative(ROOT, filePath));
}
