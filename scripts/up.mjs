import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
function docker(args, capture = false) {
  return execFileSync("docker", args, {
    cwd: root, stdio: capture ? ["ignore", "pipe", "pipe"] : "inherit", encoding: "utf8",
  });
}
try {
  docker(["info"], true);
  let imageAvailable = true;
  try { docker(["image", "inspect", "orders-mock:3"], true); } catch { imageAvailable = false; }
  if (!imageAvailable) {
    const architecture = docker(["info", "--format", "{{.Architecture}}"], true).trim();
    const suffix = /arm|aarch64/i.test(architecture) ? "arm64" : "amd64";
    const name = "orders-mock-" + suffix + ".tar.gz";
    const archive = [join(root, name), join(root, "..", name)].find(existsSync);
    if (!archive) throw new Error("Поместите " + name + " из задания в корень проекта или рядом с папкой проекта.");
    docker(["load", "-i", archive]);
  }
  docker(["compose", "up", "-d", "--build", "--wait", "--wait-timeout", "180"]);
  console.log("\nИнтерфейс http://localhost:3000\nAPI http://localhost:3001");
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
