import { Elysia, t } from 'elysia'
import { database } from '../../database/connection'
import { createId } from '@paralleldrive/cuid2'
import { authLinks } from '../../database/schema'
import { env } from '../../env'
import { mail } from '../../lib/mail'
import nodemailer from 'nodemailer'

export const SendAuthLink = new Elysia().post(
  '/authenticate',
  async ({ body }) => {
    const { email } = body

    // Query mais baixo nivel

    /*
    
      const [userFromEmail] = await database
      .select()
      .from(user)
      .where(eq(user.email, email)) 
      
      */

    const userFromEmail = await database.query.user.findFirst({
      where(fields, { eq }) {
        return eq(fields.email, email)
      },
    })

    if (!userFromEmail) {
      throw new Error('User not exists')
    }

    const authLinkCode = createId()

    await database.insert(authLinks).values({
      userId: userFromEmail.id,
      code: authLinkCode,
    })

    const authLink = new URL('/auth-link/authenticate', env.API_BASE_URL)

    authLink.searchParams.set('code', authLinkCode) // http://localhost:3333/auth-link/authenticate?code=CODE
    authLink.searchParams.set('redirect', 'http://localhost:5173')

    // Envio de e-mail

    const info = await mail.sendMail({
      from: {
        name: 'Pizza Shop',
        address: 'Hi@pizzahop.com',
      },
      to: email,
      subject: 'Authenticate link to PizzaShop',
      text: `Use the link to authenticate on Pizza Shop: ${authLink.toString()}`,
    })

    console.log(nodemailer.getTestMessageUrl(info))
  },
  {
    body: t.Object({
      email: t.String({ format: 'email' }),
    }),
  },
)
