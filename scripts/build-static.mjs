import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const appApiDir = path.join(process.cwd(), "src", "app", "api");
const tempApiDir = path.join(process.cwd(), "src", "_temp_api");

let moved = false;
try {
  if (fs.existsSync(appApiDir)) {
    fs.renameSync(appApiDir, tempApiDir);
    moved = true;
  }

  console.log("Building static Next.js export for GitHub Pages...");
  execSync("npx next build", {
    stdio: "inherit",
    env: {
      ...process.env,
      NEXT_EXPORT: "true",
    },
  });
  console.log("Static export successfully written to out/");
} finally {
  if (moved && fs.existsSync(tempApiDir)) {
    fs.renameSync(tempApiDir, appApiDir);
  }
}
