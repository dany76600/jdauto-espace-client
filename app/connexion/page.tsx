"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "@/lib/client/clientAuthStore";

const fieldClass = "w-full rounded-[4px] border border-[#333b44] bg-[#070b10] p-3 text-sm text-white placeholder:text-[#8a929a]";

export default function ConnexionPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error: err } = await signIn(email, password);
    setLoading(false);
    if (err) { setError(err); return; }
    router.push("/");
  }

  return (
    <main className="mx-auto max-w-[480px] px-7 py-16">
      <h1 className="text-center text-[32px] font-black uppercase leading-[1.05]">
        Espace <span className="text-red">client</span>
      </h1>
      <p className="mt-3 text-center text-sm text-gray">Accédez à vos rendez-vous, devis et factures.</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4 rounded-[6px] border border-[#242c34] bg-[#0a0f14] p-6">
        {error && <p className="rounded-[4px] border border-red/40 bg-red/10 p-3 text-sm font-bold text-red">{error}</p>}
        <div>
          <label className="mb-1 block text-xs font-bold">Email</label>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={fieldClass} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-bold">Mot de passe</label>
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className={fieldClass} />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-[4px] border border-[#e10000] bg-gradient-to-b from-[#e40000] to-[#b90000] py-3 text-sm font-black text-white disabled:opacity-50"
        >
          {loading ? "Connexion…" : "Se connecter"}
        </button>
        <div className="flex items-center justify-between text-xs">
          <Link href="/mot-de-passe-oublie" className="text-gray hover:text-red">Mot de passe oublié ?</Link>
          <Link href="/inscription" className="text-gray hover:text-red">Créer un compte</Link>
        </div>
      </form>
    </main>
  );
}
