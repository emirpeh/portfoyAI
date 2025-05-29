import { config } from 'mssql';
import { ConfigService } from './config.service';

export const getDatabaseConfig = (configService: ConfigService): config => {
  return {
    user: configService.get('DB_USER'),
    password: configService.get('DB_PASSWORD'),
    database: configService.get('DB_NAME'),
    server: configService.get('DB_SERVER'),
    options: {
      encrypt: false,
      trustServerCertificate: true,
    },
  };
};
