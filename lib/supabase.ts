import { createClient } from "@supabase/supabase-js";

const DEFAULT_URL = "https://kgbxsotbxlsrohfgzyik.supabase.co";
const DEFAULT_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtnYnhzb3RieGxzcm9oZmd6eWlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMyMjc5MTcsImV4cCI6MjEwODgwMzkxN30.xcZ4IgOE42u6lIRah1Ktv-Lte1vY6e7xgsmEYfGZt_o";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_URL;
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  DEFAULT_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
