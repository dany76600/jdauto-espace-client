"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { updatePassword } from "@/lib/client/clientAuthStore";

const fieldClass = "w-full rounded-[4px] border border-[#333b44] bg-[#070b10] p-3 text-sm text-white placeholder:text-[#8a929a]";

export default function ReinitialiserPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    // Le lien reçu par email contient un jeton dans l'URL — la librairie
    // Supabase l'échange automatiquement contre une session temporaire au
    // chargement de la page. On attend cet événement avant d'autoriser la
    // saisie, plutôt que d'afficher un formulaire qui échouerait si le
    // lien est expiré ou déjà utilisé.
    if (!supabase) return;
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError("Les deux mots de passe ne correspondent pas.");
      return;
    }
    setLoading(true);
    setError(null);
    const { error: err } = await updatePassword(password);
    setLoading(false);
    if (err) { setError(err); return; }
    setDone(true);
    setTimeout(() => router.push("/"), 1500);
  }

  if (done) {
    return (
      <main className="mx-auto max-w-[480px] px-7 py-16 text-center">
        <h1 className="text-[28px] font-black uppercase text-red">Mot de passe mis à jour</h1>
        <p className="mt-4 text-sm text-gray">Redirection vers ton espace…</p>
      </main>
    );
  }

  if (!ready) {
    return (
      <main className="mx-auto max-w-[480px] px-7 py-16 text-center">
        <p className="text-sm text-gray">Vérification du lien…</p>
        <p className="mt-4 text-xs text-gray">
          Si rien ne se passe après quelques secondes, ce lien a peut-être expiré — redemande-en un nouveau depuis la page « Mot de passe oublié ».
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-[480px] px-7 py-16">
      <h1 className="text-center text-[28px] font-black uppercase leading-[1.05]">Nouveau mot de passe</h1>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4 rounded-[6px] border border-[#242c34] bg-[#0a0f14] p-6">
        {error && <p className="rounded-[4px] border border-red/40 bg-red/10 p-3 text-sm font-bold text-red">{error}</p>}
        <input required type="password" minLength={6} placeholder="Nouveau mot de passe" value={password} onChange={(e) => setPassword(e.target.value)} className={fieldClass} />
        <input required type="password" minLength={6} placeholder="Confirme le mot de passe" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={fieldClass} />
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-[4px] border border-[#e10000] bg-gradient-to-b from-[#e40000] to-[#b90000] py-3 text-sm font-black text-white disabled:opacity-50"
        >
          {loading ? "Enregistrement…" : "Enregistrer"}
        </button>
      </form>
    </main>
  );
}
