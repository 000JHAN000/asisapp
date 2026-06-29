const bcrypt = require("bcrypt");
const { Client } = require("pg");

async function main() {
  const hash = await bcrypt.hash("22222", 10);
  const client = new Client({ host: "db", port: 5432, user: "postgres", password: "alejo.v02", database: "sena_db" });
  await client.connect();
  await client.query("UPDATE cg_usuarios SET password = $1 WHERE correo IN ($2, $3)", [hash, "aprendiz@palmira.com", "instructor@palmira.com"]);
  await client.end();
  console.log("HASH", hash);
  console.log("OK");
}
main().catch(e => { console.error(e); process.exit(1); });
