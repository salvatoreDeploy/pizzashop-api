import cookie from '@elysiajs/cookie'
import jwt from '@elysiajs/jwt'
import { Elysia, t, type Static } from 'elysia'
import { env } from '../../env'
import { UnauthorizedError } from '../errors/unauthorized-error'

const jwtPayload = t.Object({
  sub: t.String(),
  restaurantId: t.Optional(t.String()),
})

export const auth = new Elysia()
  .error({ UNAUTHORIZED: UnauthorizedError })
  .onError(({ error, code, set }) => {
    switch (code) {
      case 'UNAUTHORIZED': {
        set.status = 401
        return {
          code,
          message: error.message,
        }
      }
    }
  })
  .use(
    jwt({
      secret: env.JWT_PRIVATE_KEY,
      schema: t.Object({
        sub: t.String(),
        restaurantId: t.Optional(t.String()),
      }),
    }),
  )
  .use(cookie())
  .derive(({ jwt, setCookie, removeCookie, cookie }) => {
    return {
      signIn: async (payload: Static<typeof jwtPayload>) => {
        const tokenJwt = await jwt.sign(payload)

        setCookie('auth', tokenJwt, {
          httpOnly: true,
          maxAge: 60 * 60 * 24 * 7, // 7 days
          path: '/',
        })
      },

      signOut: () => {
        removeCookie('auth')
      },

      getCurrentUser: async () => {
        const authCookies = cookie.auth

        const payload = await jwt.verify(authCookies)

        if (!payload) {
          throw new UnauthorizedError()
        }

        return { userId: payload.sub, restaurantId: payload.restaurantId }
      },
    }
  })
