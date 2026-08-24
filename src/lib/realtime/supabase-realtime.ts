import { createClient, SupabaseClient } from "@supabase/supabase-js";

let supabaseClient: SupabaseClient | null = null;

export function getSupabaseBrowserClient(): SupabaseClient | null {
  if (typeof window === "undefined") {
    return null;
  }

  if (supabaseClient) {
    return supabaseClient;
  }

  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    "https://vlwkethxhavwqmgqjrxq.supabase.co";
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZsd2tldGh4aGF2d3FtZ3FqcnhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY4NzUyOTAsImV4cCI6MjEwMjQ1MTI5MH0.zaEtdas9KfNCDzJHcAAsE2sMJAO7sPqnlzsUPSQUK1c";

  supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    realtime: {
      params: {
        eventsPerSecond: 20,
      },
    },
  });

  return supabaseClient;
}
