import { Elysia } from 'elysia'
import { auth } from '../auth'
import { UnauthorizedError } from '../errors/unauthorized-error'
import dayjs from 'dayjs'
import { database } from '../../database/connection'
import { orders } from '../../database/schema'
import { and, count, eq, gte, sql } from 'drizzle-orm'

export const getOrdersDayAmount = new Elysia()
  .use(auth)
  .get('/metrics/day-orders-amount', async ({ getCurrentUser }) => {
    const { restaurantId } = await getCurrentUser()

    if (!restaurantId) {
      throw new UnauthorizedError()
    }

    const currentDay = dayjs() // Dia atual
    const yesterday = currentDay.subtract(1, 'day') // Dia anterior
    const startOfYesterday = yesterday.startOf('day') // Hora inicial 00:00:00 do dia anterior

    const orderPerDay = await database
      .select({
        dayWithMonthYear: sql<string>`TO_CHAR(${orders.createdAt}, 'YYYY-MM-DD')`,
        amount: count(),
      })
      .from(orders)
      .where(
        and(
          eq(orders.restaurantId, restaurantId),
          gte(orders.createdAt, startOfYesterday.toDate()),
        ),
      )
      .groupBy(sql`TO_CHAR(${orders.createdAt}, 'YYYY-MM-DD')`)

    const currentDayWithMonthYear = currentDay.format('YYYY-MM-DD')
    const yesterdayWithMonthYear = yesterday.format('YYYY-MM-DD')

    const currentDayOrdersAmount = orderPerDay.find((orderPerDay) => {
      return orderPerDay.dayWithMonthYear === currentDayWithMonthYear
    })

    const yesterdayOrdersAmount = orderPerDay.find((orderPerDay) => {
      return orderPerDay.dayWithMonthYear === yesterdayWithMonthYear
    })

    const differenceFromYesterday =
      currentDayOrdersAmount && yesterdayOrdersAmount
        ? (currentDayOrdersAmount.amount * 100) / yesterdayOrdersAmount.amount
        : null

    return {
      amount: currentDayOrdersAmount?.amount,
      previousAmount: yesterdayOrdersAmount?.amount,
      differenceFromYesterday: differenceFromYesterday
        ? Number((differenceFromYesterday - 100).toFixed(2))
        : 0,
    }
  })
