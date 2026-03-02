import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://qrqbkefzntfsdnbkxqag.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFycWJrZWZ6bnRmc2RuYmt4cWFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2MjMzMTgsImV4cCI6MjA4NTE5OTMxOH0.2zyFzxoZnjicjc82s55fNK0OtJn2P5M4Om4nPGCkII8";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
