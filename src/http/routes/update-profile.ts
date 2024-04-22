import Elysia, { t } from 'elysia'
import { auth } from '../auth'
import { database } from '../../database/connection'
import { restaurants } from '../../database/schema'
import { eq } from 'drizzle-orm'

export const updateProfile = new Elysia().use(auth).put(
  '/profile',
  async ({ getCurrentUser, set, body }) => {
    const { restaurantId } = await getCurrentUser()
    const { name, description } = body

    await database
      .update(restaurants)
      .set({
        name,
        description,
      })
      .where(eq(restaurants.id, restaurantId ?? ''))

    set.status = 204
  },
  {
    body: t.Object({
      name: t.String(),
      description: t.Optional(t.String()),
    }),
  },
)
