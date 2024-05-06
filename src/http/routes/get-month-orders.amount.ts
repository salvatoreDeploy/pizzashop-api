import { Elysia } from 'elysia'
import { auth } from '../auth'
import { UnauthorizedError } from '../errors/unauthorized-error'
import dayjs from 'dayjs'
import { orders } from '../../database/schema'
import { database } from '../../database/connection'
import { and, count, eq, gte, sql } from 'drizzle-orm'

export const getMonthOrdersAmount = new Elysia()
  .use(auth)
  .get('/metrics/month-orders-amount', async ({ getCurrentUser }) => {
    const { restaurantId } = await getCurrentUser()

    if (!restaurantId) {
      throw new UnauthorizedError()
    }

    const currentDay = dayjs() // Dia atual
    const lastMonth = currentDay.subtract(1, 'month') // Mes anterior
    const startOfLastMonth = lastMonth.startOf('month') // Inicio do mes anterior

    const orderPerMonth = await database
      .select({
        monthWithYear: sql<string>`TO_CHAR(${orders.createdAt}, 'YYYY-MM')`,
        amount: count(),
      })
      .from(orders)
      .where(
        and(
          eq(orders.restaurantId, restaurantId),
          gte(orders.createdAt, startOfLastMonth.toDate()),
        ),
      )
      .groupBy(sql`TO_CHAR(${orders.createdAt}, 'YYYY-MM')`)

    const lastMonthWithYear = lastMonth.format('YYYY-MM') // 2024-03
    const currentMonthWithYear = currentDay.format('YYYY-MM') // 2024-02

    const currentMonthOrders = orderPerMonth.find((monthReceipt) => {
      return monthReceipt.monthWithYear === currentMonthWithYear
    })

    const lastMonthOrders = orderPerMonth.find((orderPerMonth) => {
      return orderPerMonth.monthWithYear === lastMonthWithYear
    })

    const differenceFromLastMonth =
      currentMonthOrders && lastMonthOrders
        ? (currentMonthOrders.amount * 100) / lastMonthOrders.amount
        : null

    return {
      amount: currentMonthOrders?.amount ?? 0,
      previousAmount: lastMonthOrders?.amount ?? 0,
      differenceFromLastMonth: differenceFromLastMonth
        ? Number((differenceFromLastMonth - 100).toFixed(2))
        : 0,
    }
  })
