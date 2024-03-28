import { Elysia } from 'elysia'
import { auth } from '../auth'
import { database } from '../../database/connection'
import { UnauthorizedError } from '../errors/unauthorized-error'
import { orders, ordersItems, products } from '../../database/schema'
import { desc, eq, sum } from 'drizzle-orm'

export const getPopularProduct = new Elysia()
  .use(auth)
  .get('/metrics/popular-products', async ({ getCurrentUser }) => {
    const { restaurantId } = await getCurrentUser()

    if (!restaurantId) {
      throw new UnauthorizedError()
    }

    const popularProducts = await database
      .select({
        product: products.name,
        amount: sum(ordersItems.quantity).mapWith(Number),
      })
      .from(ordersItems)
      .leftJoin(orders, eq(orders.id, ordersItems.orderId))
      .leftJoin(products, eq(products.id, ordersItems.productId))
      .where(eq(orders.restaurantId, restaurantId))
      .groupBy(products.name)
      .orderBy((fields) => {
        return desc(fields.amount)
      })
      .limit(5)

    return popularProducts
  })
