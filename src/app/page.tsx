import { createClient } from "@/utils/supabase/server";

export default async function Home() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const isConfigured =
    Boolean(url) &&
    Boolean(anonKey) &&
    !url!.includes("xyzcompany") &&
    anonKey !== "paste-anon-key-here";

  let dbStatus = "Not checked - add Supabase keys first";
  if (isConfigured) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.getSession();
      dbStatus = error ? `Connected, but error: ${error.message}` : "Connected to Supabase";
    } catch (e) {
      dbStatus = `Connection failed: ${e instanceof Error ? e.message : "unknown error"}`;
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-3xl font-bold">Next.js + Supabase + Vercel</h1>
      <div className="rounded border p-4">
        <p>Supabase URL: {isConfigured ? "Set" : "Missing"}</p>
        <p>Supabase anon key: {isConfigured ? "Set" : "Missing"}</p>
        <p>Status: {dbStatus}</p>
      </div>
      {!isConfigured && (
        <ol className="list-decimal space-y-2 text-sm">
          <li>Go to supabase.com, create free project</li>
          <li>Copy Project URL + anon key from Settings - API</li>
          <li>Create file .env.local in my-app folder with those 2 values</li>
          <li>Restart with npm.cmd run dev</li>
        </ol>
      )}
      <p className="text-sm opacity-70">
        Deploy: push to GitHub, then vercel.com - Import - add same 2 env vars
      </p>
    </main>
  );
}
