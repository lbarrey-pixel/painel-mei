"use client";

import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const handleGoogleLogin = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-neutral-50 px-4">
      <div className="w-full max-w-sm rounded-xl border border-neutral-200 bg-white p-8 shadow-sm">
        <h1 className="text-lg font-semibold text-neutral-900">
          Painel MEI
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Automação de guias DAS-MEI
        </p>
        <button
          onClick={handleGoogleLogin}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
        >
          Entrar com Google
        </button>
        <p className="mt-4 text-xs text-neutral-400">
          Acesso restrito aos e-mails autorizados pelo escritório.
        </p>
      </div>
    </div>
  );
}
