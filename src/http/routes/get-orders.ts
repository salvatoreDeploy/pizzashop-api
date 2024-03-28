import { Elysia, t } from 'elysia'
import { auth } from '../auth'
import { database } from '../../database/connection'
import { UnauthorizedError } from '../errors/unauthorized-error'
import { createSelectSchema } from 'drizzle-typebox'
import { orders, user } from '../../database/schema'
import { and, count, desc, eq, ilike, sql } from 'drizzle-orm'

export const getOrders = new Elysia().use(auth).get(
  '/orders',
  async ({ getCurrentUser, query }) => {
    const { restaurantId } = await getCurrentUser()
    const { customerName, orderId, status, pageIndex } = query

    if (!restaurantId) {
      throw new UnauthorizedError()
    }

    /* const orderTableColumns = getTableColumns(orders) */

    const baseQuery = database
      .select({
        orderId: orders.id,
        createdAt: orders.createdAt,
        status: orders.status,
        total: orders.totalInCents,
        customerName: user.name,
      })
      .from(orders)
      .innerJoin(user, eq(user.id, orders.customerId))
      .where(
        and(
          eq(orders.restaurantId, restaurantId),
          orderId ? ilike(orders.id, `%${orderId}%`) : undefined,
          status ? eq(orders.status, status) : undefined,
          customerName ? ilike(orders.id, `%${customerName}%`) : undefined,
        ),
      )

    const [[{ count: amountOfOrders }], allOrders] = await Promise.all([
      database.select({ count: count() }).from(baseQuery.as('baseQuery')),
      database
        .select()
        .from(baseQuery.as('baseQuery'))
        .offset(pageIndex * 10)
        .limit(10)
        .orderBy((fields) => {
          return [
            sql`CASE ${fields.status}
              WHEN 'pending' THEN 1
              WHEN 'processing' THEN 2
              WHEN 'delivering' THEN 3
              WHEN 'delivered' THEN 4
              WHEN 'canceled' THEN 99
            END`,
            desc(fields.createdAt),
          ]
        }),
    ])

    return {
      orders: allOrders,
      meta: {
        pageIndex,
        perPage: 10,
        totalCount: amountOfOrders,
      },
    }
  },
  {
    query: t.Object({
      customerName: t.Optional(t.String()),
      orderId: t.Optional(t.String()),
      status: t.Optional(createSelectSchema(orders).properties.status),
      pageIndex: t.Numeric({ minimum: 0 }),
    }),
  },
)
