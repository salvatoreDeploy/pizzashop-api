import { Elysia, t } from 'elysia'
import { database } from '../../database/connection'
import dayjs from 'dayjs'
import { auth } from '../auth'
import { authLinks } from '../../database/schema'
import { eq } from 'drizzle-orm'
import { LinkNotFoundError } from '../errors/link-not-found'
import { LinkExpiredError } from '../errors/link-expired'

export const authneticateFromLink = new Elysia().use(auth).get(
  '/auth-link/authenticate',
  async ({ query, signIn, set }) => {
    const { code, redirect } = query

    const authLinkFromCode = await database.query.authLinks.findFirst({
      where(fields, { eq }) {
        return eq(fields.code, code)
      },
    })

    if (!authLinkFromCode) {
      throw new LinkNotFoundError()
    }

    const daysSinceAuthLinkWasCreated = dayjs().diff(
      authLinkFromCode.createdAt,
      'days',
    )

    if (daysSinceAuthLinkWasCreated > 7) {
      throw new LinkExpiredError()
    }

    const managerRestaurant = await database.query.restaurants.findFirst({
      where(fields, { eq }) {
        return eq(fields.managerId, authLinkFromCode.userId)
      },
    })

    await signIn({
      sub: authLinkFromCode.userId,
      restaurantId: managerRestaurant?.id,
    })

    await database.delete(authLinks).where(eq(authLinks.code, code))

    set.redirect = redirect
  },
  {
    query: t.Object({
      code: t.String(),
      redirect: t.String(),
    }),
  },
)
