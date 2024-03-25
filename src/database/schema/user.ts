import { text, timestamp, pgTable, pgEnum } from 'drizzle-orm/pg-core'
import { createId } from '@paralleldrive/cuid2'
import { relations } from 'drizzle-orm'
import { orders, restaurants } from '.'

export const userRoleEnum = pgEnum('user_role', ['manager', 'customer'])

export const user = pgTable('users', {
  id: text('id')
    .$defaultFn(() => createId())
    .primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  phone: text('phone'),
  role: userRoleEnum('role').default('customer').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const usersRelations = relations(user, ({ one, many }) => {
  return {
    managedRestaurant: one(restaurants, {
      fields: [user.id],
      references: [restaurants.managerId],
      relationName: 'managed_restaurant',
    }),

    orders: many(orders),
  }
})
