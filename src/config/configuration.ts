export default () => ({
  database: {
    mssql: {
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      server: process.env.DB_SERVER,
    },
    sqlite: {
      filename: process.env.SQLITE_FILE,
    },
  },
});
