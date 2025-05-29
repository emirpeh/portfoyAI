import { Injectable } from '@nestjs/common';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ConfigService {
  private readonly envConfig: { [key: string]: string };

  constructor() {
    const environment = process.env.NODE_ENV || 'development';
    const envFile = environment === 'production' ? '.env.production' : '.env';
    const envFilePath = path.resolve(process.cwd(), envFile);

    // Varsayılan .env dosyasını yükle
    const defaultEnvConfig = dotenv.parse(fs.readFileSync('.env'));

    // Eğer ortam dosyası varsa, onu da yükle ve varsayılan değerlerin üzerine yaz
    let envConfig = { ...defaultEnvConfig };
    if (fs.existsSync(envFilePath)) {
      const environmentEnvConfig = dotenv.parse(fs.readFileSync(envFilePath));
      envConfig = { ...envConfig, ...environmentEnvConfig };
    }

    this.envConfig = envConfig;
  }

  get(key: string): string {
    return this.envConfig[key] || process.env[key];
  }

  isProduction(): boolean {
    return this.get('NODE_ENV') === 'production';
  }

  getDatabaseConfig() {
    return {
      user: this.get('DB_USER'),
      password: this.get('DB_PASSWORD'),
      database: this.get('DB_NAME'),
      server: this.get('DB_SERVER'),
      options: {
        encrypt: false,
        trustServerCertificate: true,
      },
    };
  }
}
