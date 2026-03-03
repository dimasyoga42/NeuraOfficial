import { createClient } from "@supabase/supabase-js";

export const supabase = new createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_API_KEY,
);
