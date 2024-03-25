/* eslint-disable drizzle/enforce-delete-with-where */

import { faker } from '@faker-js/faker'
import {
  user,
  restaurants,
  orders,
  ordersItems,
  products,
  authLinks,
} from './schema'
import { database } from './connection'
import chalk from 'chalk'
import { createId } from '@paralleldrive/cuid2'

/*
 * Reset database
 */

await database.delete(user)
await database.delete(restaurants)
await database.delete(restaurants)
await database.delete(orders)
await database.delete(ordersItems)
await database.delete(products)
await database.delete(authLinks)

console.log(chalk.redBright('✔ Database reset!'))

/*
 * Create Customers
 */

const [customer1, customer2] = await database
  .insert(user)
  .values([
    {
      name: faker.person.fullName(),
      email: faker.internet.email(),
      role: 'customer',
    },
    {
      name: faker.person.fullName(),
      email: faker.internet.email(),
      role: 'customer',
    },
  ])
  .returning()

console.log(chalk.greenBright('✔ Created customers!'))

/*
 * Create Manager
 */

const [manager] = await database
  .insert(user)
  .values([
    {
      name: faker.person.fullName(),
      email: 'admin@admin.com',
      role: 'manager',
    },
  ])
  .returning({
    id: user.id,
  })

console.log(chalk.greenBright('✔ Created manager!'))

/*
 * Create restaurant
 */

const [restaurant] = await database
  .insert(restaurants)
  .values([
    {
      name: faker.company.name(),
      description: faker.lorem.paragraph(),
      managerId: manager.id,
    },
  ])
  .returning()

console.log(chalk.greenBright('✔ Created restaurant!'))

/*
 * Create Products
 */

function generateProducts() {
  return {
    name: faker.commerce.productName(),
    restaurantId: restaurant.id,
    description: faker.commerce.productDescription(),
    priceInCents: Number(faker.commerce.price({ min: 190, max: 490, dec: 0 })),
  }
}

const availableProduct = await database
  .insert(products)
  .values([
    generateProducts(),
    generateProducts(),
    generateProducts(),
    generateProducts(),
    generateProducts(),
    generateProducts(),
  ])
  .returning()

console.log(chalk.greenBright('✔ Created Products!'))

/*
 * Create Orders e OrderItems
 */

type OrderItemsToInsert = typeof ordersItems.$inferInsert
type OrderInsert = typeof orders.$inferInsert

const orderItemsToPush: OrderItemsToInsert[] = []
const ordersToInsert: OrderInsert[] = []

for (let index = 0; index < 200; index++) {
  const orderId = createId()

  const orderProducts = faker.helpers.arrayElements(availableProduct, {
    min: 1,
    max: 3,
  })

  let totalInCents = 0

  orderProducts.forEach((orderProduct) => {
    const quantity = faker.number.int({ min: 1, max: 3 })

    totalInCents += orderProduct.priceInCents * quantity

    orderItemsToPush.push({
      orderId,
      productId: orderProduct.id,
      quantity,
      priceInInCents: orderProduct.priceInCents,
    })
  })

  ordersToInsert.push({
    id: orderId,
    customerId: faker.helpers.arrayElement([customer1.id, customer2.id]),
    restaurantId: restaurant.id,
    totalInCents,
    status: faker.helpers.arrayElement([
      'pending',
      'processing',
      'delivering',
      'delivered',
      'canceled',
    ]),
    createdAt: faker.date.recent({ days: 40 }),
  })
}

await database.insert(orders).values(ordersToInsert)
await database.insert(ordersItems).values(orderItemsToPush)

console.log(chalk.greenBright('✔ Created Orders!'))

console.log(chalk.green('✔ Database seeded successfully!'))

process.exit()
