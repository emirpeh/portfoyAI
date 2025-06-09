import { defineEventHandler, readBody, createError } from 'h3'

export default defineEventHandler(async (event) => {
    try {
        const body = await readBody(event)

        // TODO: Gelen veriyi (body) veritabanına kaydet
        // Örnek: await db.request.create({ data: body })

        console.log('Yeni talep geldi:', body)

        return {
            success: true,
            message: 'Talebiniz başarıyla alındı!',
            data: body,
        }
    }
    catch (error: any) {
        console.error('Talep işlenirken hata:', error)
        throw createError({
            statusCode: 500,
            statusMessage: 'Sunucu hatası: Talep işlenemedi.',
            message: error.message,
        })
    }
}) 