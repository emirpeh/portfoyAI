import { z } from 'zod'

export const userSchema = z.object({
    id: z.string(),
    name: z.string(),
    email: z.string().email(),
    avatar: z.object({
        src: z.string().url(),
    }).optional(),
    role: z.enum(['Admin', 'Editor', 'User']).optional(),
    status: z.enum(['active', 'inactive', 'pending']).optional(),
})

export const buyerSchema = z.object({
    id: z.string(),
    name: z.string(),
    email: z.string().email(),
    phone: z.string(),
    address: z.string(),
    city: z.string(),
    country: z.string(),
    postalCode: z.string(),
    notes: z.string().optional(),
}) 