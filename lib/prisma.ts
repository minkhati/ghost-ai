import { PrismaClient } from "../app/generated/prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";
import { PrismaPg } from "@prisma/adapter-pg";

// Cache key includes the engine version so the cached instance is invalidated
// whenever `prisma generate` regenerates class.ts with a new engineVersion.
const ENGINE_VERSION = "3c6e192761c0362d496ed980de936e2f3cebcd3a";

const globalForPrisma = globalThis as unknown as {
  prismaCache: { client: ReturnType<typeof createClient>; engineVersion: string } | undefined;
};

function createClient(): PrismaClient {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL environment variable is not set");
  if (url.startsWith("prisma+postgres://")) {
    return new PrismaClient({ accelerateUrl: url }).$extends(
      withAccelerate()
    ) as unknown as PrismaClient;
  }
  return new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });
}

function getOrCreateClient() {
  if (process.env.NODE_ENV === "production") return createClient();
  const cached = globalForPrisma.prismaCache;
  if (cached?.engineVersion === ENGINE_VERSION) return cached.client;
  const client = createClient();
  globalForPrisma.prismaCache = { client, engineVersion: ENGINE_VERSION };
  return client;
}

export const prisma = getOrCreateClient();
