"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { loadMyClientData, updateMyPhone, updatePassword } from "@/lib/client/clientAuthStore";

const fieldClass = "w-full rounded-[4px] border border-[#333b44] bg-[#070b10] p-3 text-sm text-white placeholder:text-[#8a929a]";

export default function ParametresEspaceClientPage() {
  const [loaded, setLoaded] = useState(false);
  const [phone, setPhone] = useState("");
  const [phoneSaving, setPhoneSaving] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [phoneSaved, setPhoneSaved] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSaved, setPasswordSaved] = useState(false);

  useEffect(() => {
    if (!supabase) { setLoaded(true); return; }
    loadMyClientData().then((data) => {
      setPhone(data.client?.phone || "");
      setLoaded(true);
    });
  }, []);

  async function handlePhoneSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPhoneSaving(true);
    setPhoneError(null);
    setPhoneSaved(false);
    const { error } = await updateMyPhone(phone);
    setPhoneSaving(false);
    if (error) { setPhoneError(error); return; }
    setPhoneSaved(true);
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordError("Les deux mots de passe ne correspondent pas.");
      return;
    }
    setPasswordSaving(true);
    setPasswordError(null);
    setPasswordSaved(false);
    const { error } = await updatePassword(newPassword);
    setPasswordSaving(false);
    if (error) { setPasswordError(error); return; }
    setNewPassword("");
    setConfirmPassword("");
    setPasswordSaved(true);
  }

  if (!loaded) {
    return <main className="mx-auto max-w-[600px] px-7 py-16 text-center text-sm text-gray">Chargement…</main>;
  }

  return (
    <main className="mx-auto max-w-[600px] px-7 py-12">
      <Link href="/" className="text-sm text-gray hover:text-red">← Retour à mon espace</Link>
      <h1 className="mt-4 text-[28px] font-black uppercase leading-[1.05]">Paramètres</h1>

      <form onSubmit={handlePhoneSubmit} className="mt-8 space-y-3 rounded-[6px] border border-[#242c34] bg-[#0a0f14] p-6">
        <h2 className="text-xs font-bold uppercase text-gray">Téléphone</h2>
        {phoneError && <p className="rounded-[4px] border border-red/40 bg-red/10 p-2 text-xs font-bold text-red">{phoneError}</p>}
        {phoneSaved && <p className="text-xs font-bold text-success">Téléphone mis à jour.</p>}
        <input value={phone} onChange={(e) => { setPhone(e.target.value); setPhoneSaved(false); }} className={fieldClass} />
        <button
          type="submit"
          disabled={phoneSaving}
          className="rounded-[4px] border border-[#e10000] bg-gradient-to-b from-[#e40000] to-[#b90000] px-6 py-2.5 text-sm font-black text-white disabled:opacity-50"
        >
          {phoneSaving ? "Enregistrement…" : "Enregistrer"}
        </button>
      </form>

      <form onSubmit={handlePasswordSubmit} className="mt-6 space-y-3 rounded-[6px] border border-[#242c34] bg-[#0a0f14] p-6">
        <h2 className="text-xs font-bold uppercase text-gray">Mot de passe</h2>
        {passwordError && <p className="rounded-[4px] border border-red/40 bg-red/10 p-2 text-xs font-bold text-red">{passwordError}</p>}
        {passwordSaved && <p className="text-xs font-bold text-success">Mot de passe mis à jour.</p>}
        <input type="password" minLength={6} placeholder="Nouveau mot de passe" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={fieldClass} />
        <input type="password" minLength={6} placeholder="Confirme le nouveau mot de passe" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={fieldClass} />
        <button
          type="submit"
          disabled={passwordSaving || !newPassword}
          className="rounded-[4px] border border-[#e10000] bg-gradient-to-b from-[#e40000] to-[#b90000] px-6 py-2.5 text-sm font-black text-white disabled:opacity-50"
        >
          {passwordSaving ? "Enregistrement…" : "Changer le mot de passe"}
        </button>
      </form>
    </main>
  );
}
