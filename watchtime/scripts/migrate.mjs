// Roda `prisma migrate deploy` só quando há migração pendente, com tentativas.
// Em deploy de preview (Vercel) pula: preview compartilha o banco de produção.
import { spawnSync } from "node:child_process";

if (process.env.VERCEL_ENV === "preview") {
  console.log("migrate: preview, pulando migração");
  process.exit(0);
}

const run = (args) => spawnSync("npx", ["prisma", ...args], { encoding: "utf8", shell: process.platform === "win32" });

// `migrate status` não pega o lock de migração; evita travar quando outro build segura o lock.
const status = run(["migrate", "status"]);
const out = (status.stdout ?? "") + (status.stderr ?? "");
if (/Database schema is up to date/i.test(out)) {
  console.log("migrate: banco já está na versão atual, nada a aplicar");
  process.exit(0);
}
console.log(out.trim().split("\n").slice(-4).join("\n"));

const tries = 3;
for (let i = 1; i <= tries; i++) {
  const r = spawnSync("npx", ["prisma", "migrate", "deploy"], { stdio: "inherit", shell: process.platform === "win32" });
  if (r.status === 0) process.exit(0);
  console.log(`migrate: tentativa ${i}/${tries} falhou`);
  if (i < tries) {
    const wait = 15_000 * i;
    console.log(`migrate: aguardando ${wait / 1000}s`);
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, wait);
  }
}
process.exit(1);
