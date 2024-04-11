import Elysia from 'elysia'
import { auth } from '../auth'
import { database } from '../../database/connection'
import { UnauthorizedError } from '../errors/unauthorized-error'

export const getManagedRestaurant = new Elysia()
  .use(auth)
  .get('/managed-restaurant', async ({ getCurrentUser }) => {
    const { restaurantId } = await getCurrentUser()

    if (!restaurantId) {
      throw new UnauthorizedError()
    }

    const restaurant = await database.query.restaurants.findFirst({
      where(fields, { eq }) {
        return eq(fields.id, restaurantId)
      },
    })

    if (!restaurant) {
      throw new Error('Restaurant not found.')
    }

    return restaurant
  })
