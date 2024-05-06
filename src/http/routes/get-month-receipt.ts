import { Elysia } from 'elysia'
import { auth } from '../auth'
import { UnauthorizedError } from '../errors/unauthorized-error'
import dayjs from 'dayjs'
import { orders } from '../../database/schema'
import { database } from '../../database/connection'
import { and, eq, gte, sql, sum } from 'drizzle-orm'

export const getMonthReceipt = new Elysia()
  .use(auth)
  .get('/metrics/month-receipt', async ({ getCurrentUser }) => {
    const { restaurantId } = await getCurrentUser()

    if (!restaurantId) {
      throw new UnauthorizedError()
    }

    const currentDay = dayjs() // Dia atual
    const lastMonth = currentDay.subtract(1, 'month') // Mes anterior
    const startOfLastMonth = lastMonth.startOf('month') // Inicio do mes anterior

    const monthsReceipts = await database
      .select({
        monthWithYear: sql<string>`TO_CHAR(${orders.createdAt}, 'YYYY-MM')`,
        receipt: sum(orders.totalInCents).mapWith(Number),
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

    const currentMonthReceipt = monthsReceipts.find((monthReceipt) => {
      return monthReceipt.monthWithYear === currentMonthWithYear
    })

    const lastMonthReceipt = monthsReceipts.find((monthReceipt) => {
      return monthReceipt.monthWithYear === lastMonthWithYear
    })

    const differenceFromLastMonth =
      currentMonthReceipt && lastMonthReceipt
        ? (currentMonthReceipt.receipt * 100) / lastMonthReceipt.receipt
        : null

    return {
      receipt: currentMonthReceipt?.receipt ?? 0,
      previousReceipt: lastMonthReceipt?.receipt ?? 0,
      differenceFromLastMonth: differenceFromLastMonth
        ? Number((differenceFromLastMonth - 100).toFixed(2))
        : 0,
    }
  })
