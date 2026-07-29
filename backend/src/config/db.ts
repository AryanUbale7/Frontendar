import { PrismaClient } from "@prisma/client";

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/frontendarena";

export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: connectionString
    }
  }
});

export { connectionString };
