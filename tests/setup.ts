process.env.DATABASE_URL = "file:./test.db";
process.env.AUTH_DEV_LOGIN = "true";
process.env.AUTH_COOKIE_SECRET = "change-me-local-only";
Reflect.set(process.env, "NODE_ENV", "test");
