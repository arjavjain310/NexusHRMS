import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { transform } from "sucrase";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".next") continue;
      walk(full, files);
    } else if (/\.(tsx?|mts)$/.test(entry.name)) {
      files.push(full);
    }
  }
  return files;
}

const roots = [
  path.join(ROOT, "src"),
  path.join(ROOT, "prisma", "seed.ts"),
  path.join(ROOT, "next.config.ts"),
  path.join(ROOT, "tailwind.config.ts"),
].flatMap((r) => (r.endsWith(".ts") ? [r] : walk(r)));

const toRemove = [];

for (const filePath of roots) {
  if (!fs.existsSync(filePath)) continue;

  const isTsx = filePath.endsWith(".tsx");
  const isConfig = filePath.includes("next.config") || filePath.includes("tailwind.config");

  let code = fs.readFileSync(filePath, "utf8");

  // Drop type-only imports
  code = code.replace(/^import\s+type\s+[^;]+;\s*\n/gm, "");
  code = code.replace(/,\s*type\s+[A-Za-z0-9_<>,\s]+(?=\s*from)/g, "");
  code = code.replace(/\{\s*type\s+/g, "{ ");

  const transforms = isTsx ? ["typescript", "jsx"] : ["typescript"];
  const { code: out } = transform(code, {
    transforms,
    jsxRuntime: "preserve",
    production: false,
    disableESTransforms: true,
  });

  let newPath;
  if (filePath.endsWith("next.config.ts")) {
    newPath = path.join(ROOT, "next.config.mjs");
  } else if (filePath.endsWith("tailwind.config.ts")) {
    newPath = path.join(ROOT, "tailwind.config.js");
  } else if (filePath.endsWith(".tsx")) {
    newPath = filePath.replace(/\.tsx$/, ".jsx");
  } else if (filePath.endsWith(".ts")) {
    newPath = filePath.replace(/\.ts$/, ".js");
  } else {
    continue;
  }

  // Fix ESM imports in config
  let final = out;
  if (isConfig && newPath.endsWith(".mjs")) {
    final = final.replace(/export default config;/, "export default config;\n");
  }

  fs.mkdirSync(path.dirname(newPath), { recursive: true });
  fs.writeFileSync(newPath, final, "utf8");
  toRemove.push(filePath);

  console.log(`${path.relative(ROOT, filePath)} -> ${path.relative(ROOT, newPath)}`);
}

// Remove .d.ts and types folder
const typesDir = path.join(ROOT, "src", "types");
if (fs.existsSync(typesDir)) {
  fs.rmSync(typesDir, { recursive: true, force: true });
  console.log("Removed src/types");
}

for (const f of toRemove) {
  fs.unlinkSync(f);
}

// Remove ts configs
for (const f of ["tsconfig.json", "next-env.d.ts", "next.config.ts", "tailwind.config.ts"]) {
  const p = path.join(ROOT, f);
  if (fs.existsSync(p)) {
    fs.unlinkSync(p);
    console.log("Removed", f);
  }
}

console.log(`Converted ${toRemove.length} files.`);
