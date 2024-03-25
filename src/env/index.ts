import { z } from 'zod'

const envSchema = z.object({
  DATABASE_URL: z.string().url().min(1),
  API_BASE_URL: z.coerce.string().url(),
  AUTH_REDIRECT_URL: z.string().url().min(1),
  JWT_PRIVATE_KEY: z.string().min(1),
  JWT_PUBLIC_KEY: z.string().min(1),
})

export const env = envSchema.parse(process.env)
