// Generates ADMIN_PASS_HASH for .env — run: node scripts/make-admin-hash.mjs <username> <password>
// Prints lines to paste into .env / hosting env vars.
import { scryptSync, randomBytes } from "node:crypto";

const [, , username, password] = process.argv;
if (!username || !password) {
  console.error("Usage: node scripts/make-admin-hash.mjs <username> <password>");
  process.exit(1);
}
const salt = randomBytes(16).toString("hex");
const hash = scryptSync(password, salt, 64).toString("hex");
console.log(`ADMIN_USERNAME=${username.toLowerCase()}`);
console.log(`ADMIN_PASS_HASH=${salt}:${hash}`);
console.log("IRON_SECRET=<run: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\">");
