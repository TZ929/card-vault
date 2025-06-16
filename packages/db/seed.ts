import { PrismaClient, Role, ListingStatus } from '@prisma/client'
import { faker } from '@faker-js/faker'

const prisma = new PrismaClient()

async function main() {
  // 5 dummy users
  for (let i = 0; i < 5; i++) {
    await prisma.user.create({
      data: {
        email: faker.internet.email().toLowerCase(),
        role: i === 0 ? Role.ADMIN : Role.BUYER
      }
    })
  }

  // 20 dummy cards
  const users = await prisma.user.findMany()
  for (let i = 0; i < 20; i++) {
    await prisma.card.create({
      data: {
        title: `${faker.person.fullName()} RC`,
        year: faker.number.int({ min: 1980, max: 2024 }),
        player: faker.person.fullName(),
        team: faker.company.name(),
        grade: faker.helpers.arrayElement(['PSA 10', 'BGS 9.5', null]),
        ownerId: faker.helpers.arrayElement(users).id
      }
    })
  }
}

main().then(() => prisma.$disconnect())
