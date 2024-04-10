import type { Config } from 'drizzle-kit'

export default {
  schema: './src/database/schema/index.ts',
  out: './drizzle',
  driver: 'pg',
  dbCredentials: {
    connectionString: 'postgresql://postgres:docker@localhost:5432/feastflow',
  },
} satisfies Config
