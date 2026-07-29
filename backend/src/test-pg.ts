import { Client } from "pg";

const combinations = [
  "postgresql://postgres:postgres@localhost:7777/postgres",
  "postgresql://postgres@localhost:7777/postgres",
  "postgresql://postgres:root@localhost:7777/postgres",
  "postgresql://postgres:password@localhost:7777/postgres",
  "postgresql://postgres:123456@localhost:7777/postgres",
  "postgresql://postgres:admin@localhost:7777/postgres",
  "postgresql://postgres:aryan@localhost:7777/postgres",
  "postgresql://postgres:Aryan@localhost:7777/postgres",
  "postgresql://postgres:AryanUbale7@localhost:7777/postgres",
  "postgresql://postgres:Aryan@123@localhost:7777/postgres",
  "postgresql://postgres:aryan@123@localhost:7777/postgres",
  "postgresql://postgres:123@localhost:7777/postgres",
  "postgresql://aryan@localhost:7777/postgres",
  "postgresql://aryan:aryan@localhost:7777/postgres",
  "postgresql://aryan:Aryan@localhost:7777/postgres",
  "postgresql://aryan:123456@localhost:7777/postgres",
  "postgresql://postgres:postgres@localhost:7777/frontendarena",
  "postgresql://postgres:Aryanubale7@localhost:7777/postgres",
  "postgresql://postgres:aryanubale7@localhost:7777/postgres"
];

async function scan() {
  for (const url of combinations) {
    try {
      const client = new Client({ connectionString: url });
      await client.connect();
      console.log("SUCCESS:", url);
      await client.end();
      process.exit(0);
    } catch (e: any) {
      console.log("FAILED:", url, "-", e.message);
    }
  }
  console.log("No working postgres database found.");
  process.exit(1);
}

scan();
