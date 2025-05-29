import { join } from 'path';

export const sqliteConfig = {
  filename: join(__dirname, '..', '..', 'data', 'app.db'),
  options: {
    verbose: console.log,
    fileMustExist: false,
  },
};
