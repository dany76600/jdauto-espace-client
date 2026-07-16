"use client";
import { useState } from "react";
import Link from "next/link";
import { signUp } from "@/lib/client/clientAuthStore";

const fieldClass = "w-full rounded-[4px] border border-[#333b44] bg-[#070b10] p-3 text-sm text-white placeholder:text-[#8a929a]";

export default function InscriptionPage() {
  const [form, setForm] = useState({ firstname: "", lastname: "", email: "", phone: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  function update(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error: err } = await signUp(form);
    setLoading(false);
    if (err) { setError(err); return; }
    setDone(true);
  }

  if (done) {
    return (
      <main className="mx-auto max-w-[480px] px-7 py-16 text-center">
        <h1 className="text-[28px] font-black uppercase">Compte créé</h1>
        <p className="mt-4 text-sm text-gray">
          Un email de confirmation a été envoyé à <strong className="text-white">{form.email}</strong>. Clique sur le lien qu&apos;il contient, puis connecte-toi.
        </p>
        <Link href="/connexion" className="mt-6 inline-block rounded-[4px] border border-[#e10000] bg-gradient-to-b from-[#e40000] to-[#b90000] px-6 py-3 text-sm font-black text-white">
          Aller à la connexion
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-[480px] px-7 py-16">
      <h1 className="text-center text-[32px] font-black uppercase leading-[1.05]">
        Créer un <span className="text-red">compte</span>
      </h1>
      <p className="mt-3 text-center text-sm text-gray">Si tu es déjà venu au garage, ton historique sera automatiquement retrouvé grâce à ton email.</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4 rounded-[6px] border border-[#242c34] bg-[#0a0f14] p-6">
        {error && <p className="rounded-[4px] border border-red/40 bg-red/10 p-3 text-sm font-bold text-red">{error}</p>}
        <div className="grid grid-cols-2 gap-3">
          <input required placeholder="Prénom" value={form.firstname} onChange={(e) => update("firstname", e.target.value)} className={fieldClass} />
          <input required placeholder="Nom" value={form.lastname} onChange={(e) => update("lastname", e.target.value)} className={fieldClass} />
        </div>
        <input required type="email" placeholder="Email" value={form.email} onChange={(e) => update("email", e.target.value)} className={fieldClass} />
        <input required placeholder="Téléphone" value={form.phone} onChange={(e) => update("phone", e.target.value)} className={fieldClass} />
        <input required type="password" minLength={6} placeholder="Mot de passe (6 caractères min.)" value={form.password} onChange={(e) => update("password", e.target.value)} className={fieldClass} />
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-[4px] border border-[#e10000] bg-gradient-to-b from-[#e40000] to-[#b90000] py-3 text-sm font-black text-white disabled:opacity-50"
        >
          {loading ? "Création…" : "Créer mon compte"}
        </button>
        <p className="text-center text-xs text-gray">
          Déjà un compte ? <Link href="/connexion" className="text-white hover:text-red">Se connecter</Link>
        </p>
      </form>
    </main>
  );
}
