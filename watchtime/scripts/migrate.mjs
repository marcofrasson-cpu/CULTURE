// Roda `prisma migrate deploy` com tentativas. Em deploy de preview (Vercel)
// pula: preview compartilha o banco de produção e não deve migrá-lo.
import { spawnSync } from "node:child_process";

if (process.env.VERCEL_ENV === "preview") {
  console.log("migrate: preview, pulando migração");
  process.exit(0);
}

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
