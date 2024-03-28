import { Elysia, t } from 'elysia'
import { auth } from '../auth'
import { UnauthorizedError } from '../errors/unauthorized-error'
import { database } from '../../database/connection'
import { orders } from '../../database/schema'
import { eq } from 'drizzle-orm'

export const cancelOrder = new Elysia().use(auth).patch(
  'order/:orderId/cancel',
  async ({ getCurrentUser, set, params }) => {
    const { orderId } = params
    const { restaurantId } = await getCurrentUser()

    if (!restaurantId) {
      throw new UnauthorizedError()
    }

    const order = await database.query.orders.findFirst({
      where(fields, { eq, and }) {
        return and(
          eq(fields.id, orderId),
          eq(fields.restaurantId, restaurantId),
        )
      },
    })

    if (!order) {
      set.status = 400

      return { message: 'Order not found' }
    }

    if (!['pending', 'processing'].includes(order.status)) {
      set.status = 400

      return { message: 'You cannot cancel orders after dispatch' }
    }

    await database
      .update(orders)
      .set({ status: 'canceled' })
      .where(eq(orders.id, orderId))
  },
  {
    params: t.Object({
      orderId: t.String(),
    }),
  },
)
