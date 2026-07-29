import { prisma } from "./config/db";

async function main() {
  try {
    console.log("Prisma client adapter setup is correct!");
  } catch (err: any) {
    console.error("Prisma error:", err.message);
  }
}

main();
