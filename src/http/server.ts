/* eslint-disable prettier/prettier */
import { Elysia } from 'elysia'
import { registerRestaurant } from './routes/register-restaurant'
import { SendAuthLink } from './routes/send-auth-link'
import { authneticateFromLink } from './routes/authneticate-from-link'
import { signOut } from './routes/sign-out'
import { getProfile } from './routes/get-profile'
import { getOrderDetails } from './routes/get-order-details'

const app = new Elysia()
  .use(registerRestaurant)
  .use(SendAuthLink)
  .use(authneticateFromLink)
  .use(signOut)
  .use(getProfile)
  .use(getOrderDetails)
  .onError(({ code, error, set }) => {
    switch (code) {
      case 'VALIDATION': {
        set.status = 400
        return error.toResponse()
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
