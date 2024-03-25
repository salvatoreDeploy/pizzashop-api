import { text, timestamp, pgTable } from 'drizzle-orm/pg-core'
import { createId } from '@paralleldrive/cuid2'
import { orders, products, user } from '.'
import { relations } from 'drizzle-orm'

export const restaurants = pgTable('restaurants', {
  id: text('id')
    .$defaultFn(() => createId())
    .primaryKey(),
  name: text('name').notNull(),
  managerId: text('manager_id').references(() => user.id, {
    onDelete: 'set null',
  }),
  description: text('description'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const restaurantsRelations = relations(restaurants, ({ one, many }) => {
  return {
    manager: one(user, {
      fields: [restaurants.managerId],
      references: [user.id],
      relationName: 'restaurant_manager',
    }),
    orders: many(orders),
    products: many(products),
  }
})
