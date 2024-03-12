import type { Config } from "drizzle-kit";
export default {
  schema: "./src/database/schema/index.ts",
  out: "./drizzle",
  driver: 'pg',
} satisfies Config;
