import { Elysia, t } from 'elysia'
import { database } from '../../database/connection'
import { user } from '../../database/schema/user'
import { restaurants } from '../../database/schema/restaurants'

export const registerRestaurant = new Elysia().post(
  '/restaurants',
  async ({ body, set }) => {
    const { restaurantName, managerName, email, phone } = body

    const [manager] = await database
      .insert(user)
      .values({
        name: managerName,
        email,
        phone,
        role: 'manager',
      })
      .returning({
        id: user.id,
      })

    await database.insert(restaurants).values({
      name: restaurantName,
      managerId: manager.id,
    })

    set.status = 204
  },
  {
    body: t.Object({
      restaurantName: t.String(),
      managerName: t.String(),
      email: t.String({ format: 'email' }),
      phone: t.String(),
    }),
  },
)
