import { Elysia, t } from 'elysia'
import { auth } from '../auth'
import { UnauthorizedError } from '../errors/unauthorized-error'
import { database } from '../../database/connection'
import { orders } from '../../database/schema'
import { eq } from 'drizzle-orm'

export const dispatchOrder = new Elysia().use(auth).patch(
  'orders/:orderId/dispatch',
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

    if (order.status !== 'processing') {
      set.status = 400

      return { message: 'You can only approve "processing" orders' }
    }

    await database
      .update(orders)
      .set({ status: 'delivering' })
      .where(eq(orders.id, orderId))
  },
  {
    params: t.Object({
      orderId: t.String(),
    }),
  },
)
