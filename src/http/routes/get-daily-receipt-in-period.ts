import { Elysia, t } from 'elysia'
import { auth } from '../auth'
import { UnauthorizedError } from '../errors/unauthorized-error'
import dayjs from 'dayjs'
import { database } from '../../database/connection'
import { orders } from '../../database/schema'
import { and, eq, gte, lte, sql, sum } from 'drizzle-orm'

export const getDailyReceipInPeriod = new Elysia().use(auth).get(
  '/metrics/daily-receipt-in-period',
  async ({ getCurrentUser, query, set }) => {
    const { restaurantId } = await getCurrentUser()

    if (!restaurantId) {
      throw new UnauthorizedError()
    }

    const { from, to } = query

    const startDate = from ? dayjs(from) : dayjs().subtract(6, 'days')
    const endDate = to ? dayjs(to) : from ? startDate.add(6, 'days') : dayjs()

    if (endDate.diff(startDate, 'days') > 7) {
      set.status = 400
      return {
        message: 'You cannot list receipt in a larger period then 7 days',
      }
    }

    const receiptPerDay = await database
      .select({
        date: sql<string>`TO_CHAR(${orders.createdAt}, 'DD/MM')`,
        receipt: sum(orders.totalInCents).mapWith(Number),
      })
      .from(orders)
      .where(
        and(
          eq(orders.restaurantId, restaurantId),
          gte(
            orders.createdAt,
            startDate
              .startOf('day')
              .add(startDate.utcOffset(), 'minutes')
              .toDate(),
          ),
          lte(
            orders.createdAt,
            endDate
              .endOf('days')
              .add(startDate.utcOffset(), 'minutes')
              .toDate(),
          ),
        ),
      )
      .groupBy(sql`TO_CHAR(${orders.createdAt}, 'DD/MM')`)

    const orderedReceiptPerPay = receiptPerDay.sort((a, b) => {
      const [dayA, monthA] = a.date.split('/').map(Number)
      const [dayB, monthB] = b.date.split('/').map(Number)

      if (monthA === monthB) {
        return dayA - dayB
      } else {
        const dateA = new Date(2024, monthA - 1)
        const dateB = new Date(2024, monthB - 1)

        return dateA.getTime() - dateB.getTime()
      }
    })

    return orderedReceiptPerPay
  },
  {
    query: t.Object({
      from: t.Optional(t.String()),
      to: t.Optional(t.String()),
    }),
  },
)
