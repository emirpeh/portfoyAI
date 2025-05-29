# Deployment Talimatları

## Gereksinimler

- Node.js (v16 veya üzeri)
- npm veya pnpm
- Git
- SQL Server
- Windows veya macOS

## Mac'te Build Alma

1. Bağımlılıkları yükleyin:

```bash
npm install
# veya
pnpm install
```

2. Prisma client'ı oluşturun:

```bash
npx prisma generate
```

3. Production build alın:

```bash
npm run build
# veya
pnpm run build
```

4. Gerekli dosyaları kopyalayın:

```bash
npm run copy:files
# veya
pnpm run copy:files
```

## Windows'ta Çalıştırma

1. Mac'te oluşturulan dist klasörünü Windows sunucusuna kopyalayın

2. Windows sunucusunda Node.js ve npm'i yükleyin

3. Dist klasörüne gidin:

```cmd
cd dist
```

4. Bağımlılıkları yükleyin:

```cmd
npm install --production
# veya
pnpm install --production
```

5. Prisma client'ı oluşturun:

```cmd
npx prisma generate
```

6. Uygulamayı başlatın:

```cmd
npm run start:prod
# veya
pnpm run start:prod
```

## Önemli Dosyalar ve Klasörler

- `dist/`: Derlenmiş uygulama dosyaları
- `dist/prisma/`: Veritabanı şemaları ve migration'lar
- `dist/certs/`: SSL sertifikaları
- `dist/.env`: Ortam değişkenleri

## Ortam Değişkenleri

Aşağıdaki ortam değişkenlerinin doğru ayarlandığından emin olun:

```env
# Node Environment
NODE_ENV=production

# MSSQL Config
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=your_db_name
DB_SERVER=your_db_server

# JWT Config
JWT_SECRET=your_jwt_secret

# Mail Settings
MAIL_USER=your_mail_user
MAIL_PASSWORD=your_mail_password
```

## SSL Sertifikaları

SSL sertifikalarının `dist/certs/` klasöründe olduğundan emin olun:

- `cert.pem`
- `key.pem`

## Veritabanı

1. SQL Server'ın çalıştığından emin olun
2. Veritabanı bağlantı bilgilerinin `.env` dosyasında doğru olduğunu kontrol edin
3. Migration'ları çalıştırın:

```cmd
npx prisma migrate deploy
```

## Hata Ayıklama

Eğer uygulama başlatılırken hata alırsanız:

1. Log dosyalarını kontrol edin
2. Ortam değişkenlerinin doğru ayarlandığından emin olun
3. Veritabanı bağlantısını test edin
4. Port çakışması olmadığından emin olun
5. Windows Güvenlik Duvarı ayarlarını kontrol edin

## Güvenlik Kontrolleri

- JWT secret key'in güvenli olduğundan emin olun
- SSL sertifikalarının geçerli olduğunu kontrol edin
- Veritabanı kullanıcısının minimum gerekli yetkilere sahip olduğundan emin olun
- Windows Defender ve antivirüs yazılımlarının gerekli portlara izin verdiğini kontrol edin

## Performans İyileştirmeleri

- `NODE_ENV=production` ayarının doğru olduğundan emin olun
- PM2 veya Windows Service olarak çalıştırmayı düşünün
- Veritabanı indekslerinin oluşturulduğundan emin olun
- Gerekli Windows optimizasyonlarını yapın
