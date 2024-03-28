/* eslint-disable prettier/prettier */
import { Elysia } from 'elysia'
import { registerRestaurant } from './routes/register-restaurant'
import { SendAuthLink } from './routes/send-auth-link'
import { authneticateFromLink } from './routes/authneticate-from-link'
import { signOut } from './routes/sign-out'
import { getProfile } from './routes/get-profile'
import { getOrderDetails } from './routes/get-order-details'
import { aprovedOrder } from './routes/aproved-order'
import { cancelOrder } from './routes/cancel-order'
import { deliverOrder } from './routes/deliver-order'
import { dispatchOrder } from './routes/dispatch-oder'
import { getOrders } from './routes/get-orders'
import { getMonthReceipt } from './routes/get-month-receipt'
import { getOrdersDayAmount } from './routes/get-day-orders-amount'
import { getMonthOrdersAmount } from './routes/get-month-orders.amount'
import { getCanceledMonthOrdersAmount } from './routes/get-canceled-month-amount'
import { getPopularProduct } from './routes/get-popular-products'
import { getDailyReceipInPeriod } from './routes/get-daily-receipt-in-period'

const app = new Elysia()
  .use(registerRestaurant)
  .use(SendAuthLink)
  .use(authneticateFromLink)
  .use(signOut)
  .use(getProfile)
  .use(getOrderDetails)
  .use(aprovedOrder)
  .use(cancelOrder)
  .use(deliverOrder)
  .use(dispatchOrder)
  .use(getOrders)
  .use(getMonthReceipt)
  .use(getOrdersDayAmount)
  .use(getMonthOrdersAmount)
  .use(getCanceledMonthOrdersAmount)
  .use(getPopularProduct)
  .use(getDailyReceipInPeriod)
  .onError(({ code, error, set }) => {
    switch (code) {
      case 'VALIDATION': {
        set.status = 400
        return error.toResponse()
      }
      case 'NOT_FOUND': {
        set.status = 400
        return new Response(null, { status: 404 })
      }
      default: {
        console.log(error)

        return new Response(null, { status: 500 })
      }
    }
  })

app.listen(3333, () => {
  console.log('🔥 HTTP server running 🔥')
})
