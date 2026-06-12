import { SupabaseClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();
export const supabase = new SupabaseClient(
  process.env.DB_URL,
  process.env.DB_KEY,
);
