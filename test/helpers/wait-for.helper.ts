/**
 * Belirli bir koşul 'truthy' bir değer döndürene kadar veya zaman aşımına uğrayana kadar
 * periyodik olarak bir 'checker' fonksiyonunu çalıştırır.
 * E2E testlerinde asenkron olarak oluşturulan bir kaynağın (örneğin bir veritabanı kaydının)
 * varlığını beklemek için idealdir.
 *
 * @param checker Kontrol edilecek koşulu içeren ve T veya falsy bir değer döndüren fonksiyon.
 * @param options Zaman aşımı ve kontrol aralığı gibi ayarlar.
 * @returns Koşul zamanında sağlanırsa T değerini, aksi takdirde hata fırlatır.
 */
export async function waitFor<T>(
    checker: () => Promise<T | null | undefined | false> | T | null | undefined | false,
    options: {
        timeout?: number; interval?: number;
        description?: string;
    } = {},
): Promise<T> {
    const { timeout = 10000, interval = 500, description = 'koşul' } = options;
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
        const result = await checker();
        if (result) {
            return result;
        }
        await new Promise(resolve => setTimeout(resolve, interval));
    }

    throw new Error(`waitFor: '${description}' ${timeout}ms içinde gerçekleşmedi.`);
} 