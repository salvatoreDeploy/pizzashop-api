/* eslint-disable drizzle/enforce-delete-with-where */

import { faker } from '@faker-js/faker'
import { user, restaurants } from './schema'
import { database } from './connection'
import chalk from 'chalk'

/*
 * Reset database
 */

await database.delete(user)
await database.delete(restaurants)

console.log(chalk.redBright('✔ Database reset!'))

/*
 * Create Customers
 */

await database.insert(user).values([
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

await database.insert(restaurants).values([
  {
    name: faker.company.name(),
    description: faker.lorem.paragraph(),
    managerId: manager.id,
  },
])

console.log(chalk.greenBright('✔ Created restaurant!'))

console.log(chalk.green('✔ Database seeded successfully!'))

process.exit()
