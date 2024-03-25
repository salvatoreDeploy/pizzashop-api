import { text, timestamp, pgTable, integer, pgEnum } from 'drizzle-orm/pg-core'
import { createId } from '@paralleldrive/cuid2'
import { ordersItems, restaurants, user } from '.'
import { relations } from 'drizzle-orm'

export const orderStatusEnum = pgEnum('order_status', [
  'pending',
  'processing',
  'delivering',
  'delivered',
  'canceled',
])

export const orders = pgTable('orders', {
  id: text('id')
    .$defaultFn(() => createId())
    .primaryKey(),
  customerId: text('customer_id').references(() => user.id, {
    onDelete: 'set null',
  }),
  restaurantId: text('restaurant_id')
    .notNull()
    .references(() => restaurants.id, {
      onDelete: 'cascade',
    }),
  status: orderStatusEnum('status').default('pending').notNull(),
  totalInCents: integer('total_in_cents').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const ordersRelations = relations(orders, ({ one, many }) => {
  return {
    customer: one(user, {
      fields: [orders.customerId],
      references: [user.id],
      relationName: 'order_customer',
    }),
    restaurant: one(restaurants, {
      fields: [orders.restaurantId],
      references: [restaurants.id],
      relationName: 'order_restaurant',
    }),
    ordersItems: many(ordersItems),
  }
})
