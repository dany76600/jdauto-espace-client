"use client";
import { useState } from "react";
import Link from "next/link";
import { requestPasswordReset } from "@/lib/client/clientAuthStore";

const fieldClass = "w-full rounded-[4px] border border-[#333b44] bg-[#070b10] p-3 text-sm text-white placeholder:text-[#8a929a]";

export default function MotDePasseOubliePage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error: err } = await requestPasswordReset(email);
    setLoading(false);
    if (err) { setError(err); return; }
    setSent(true);
  }

  if (sent) {
    return (
      <main className="mx-auto max-w-[480px] px-7 py-16 text-center">
        <h1 className="text-[28px] font-black uppercase">Email envoyé</h1>
        <p className="mt-4 text-sm text-gray">
          Si un compte existe avec l&apos;adresse <strong className="text-white">{email}</strong>, un lien de réinitialisation vient d&apos;être envoyé.
        </p>
        <Link href="/connexion" className="mt-6 inline-block text-sm text-red hover:underline">← Retour à la connexion</Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-[480px] px-7 py-16">
      <h1 className="text-center text-[28px] font-black uppercase leading-[1.05]">Mot de passe oublié</h1>
      <p className="mt-3 text-center text-sm text-gray">Indique ton email, on t&apos;envoie un lien pour en choisir un nouveau.</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4 rounded-[6px] border border-[#242c34] bg-[#0a0f14] p-6">
        {error && <p className="rounded-[4px] border border-red/40 bg-red/10 p-3 text-sm font-bold text-red">{error}</p>}
        <input required type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className={fieldClass} />
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-[4px] border border-[#e10000] bg-gradient-to-b from-[#e40000] to-[#b90000] py-3 text-sm font-black text-white disabled:opacity-50"
        >
          {loading ? "Envoi…" : "Envoyer le lien"}
        </button>
        <p className="text-center text-xs text-gray">
          <Link href="/connexion" className="text-white hover:text-red">← Retour à la connexion</Link>
        </p>
      </form>
    </main>
  );
}
