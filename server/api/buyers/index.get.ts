import { defineEventHandler, getQuery } from 'h3'
import { faker } from '@faker-js/faker'

function createRandomBuyer(): any {
    return {
        id: faker.string.uuid(),
        name: faker.person.fullName(),
        email: faker.internet.email(),
        phone: faker.phone.number(),
        address: faker.location.streetAddress(),
        city: faker.location.city(),
        country: faker.location.country(),
        postalCode: faker.location.zipCode(),
        notes: faker.lorem.sentence(),
    }
}

export default defineEventHandler(async (event) => {
    const query = getQuery(event)
    const page = parseInt(query.page as string || '1', 10)
    const limit = parseInt(query.limit as string || '10', 10)

    const buyers = Array.from({ length: limit }, createRandomBuyer)

    const total = 100 // Mock total for pagination

    return {
        data: buyers,
        total,
        page,
        limit
    }
}) 