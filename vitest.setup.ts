import { beforeAll } from "vitest";

beforeAll(() => {
  // Set up test environment variables
  process.env.SUPABASE_URL = "http://127.0.0.1:54321";
  process.env.SUPABASE_ANON_KEY = "test-key";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-key";
});
