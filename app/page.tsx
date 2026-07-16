"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { signOut, ensureClientLinked, loadMyClientData, addMyVehicle, downloadInvoicePdf, repairStatusLabel, type MyClientData } from "@/lib/client/clientAuthStore";
import Link from "next/link";

function statusColor(status: string) {
  if (["payee", "confirme", "termine", "accepte", "livre"].includes(status)) return "border-success/40 bg-success/10 text-success";
  if (["attente", "nouvelle", "envoye", "en-cours", "controle"].includes(status)) return "border-warning/40 bg-warning/10 text-warning";
  return "border-[#333b44] bg-[#0a0f14] text-gray";
}

export default function EspaceClientDashboard() {
  const router = useRouter();
  const [data, setData] = useState<MyClientData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showVehicleForm, setShowVehicleForm] = useState(false);
  const [vehicleForm, setVehicleForm] = useState({ plate: "", brand: "", model: "", year: "", km: "" });
  const [savingVehicle, setSavingVehicle] = useState(false);
  const [vehicleError, setVehicleError] = useState<string | null>(null);

  async function load() {
    if (!supabase) { setLoading(false); return; }
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      router.replace("/connexion");
      return;
    }

    // Rattrape la liaison compte↔fiche client si ce n'est pas encore
    // fait (premier login après inscription).
    const name = (userData.user.user_metadata?.firstname as string) || "";
    await ensureClientLinked(name, "", "").catch(() => {});

    const myData = await loadMyClientData();
    if (!myData.client) {
      setError("Impossible de retrouver ta fiche client. Contacte le garage si le problème persiste.");
      setLoading(false);
      return;
    }
    setData(myData);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  async function handleAddVehicle(e: React.FormEvent) {
    e.preventDefault();
    setSavingVehicle(true);
    setVehicleError(null);
    const { error: err } = await addMyVehicle({
      plate: vehicleForm.plate,
      brand: vehicleForm.brand,
      model: vehicleForm.model,
      year: vehicleForm.year ? Number(vehicleForm.year) : null,
      km: vehicleForm.km ? Number(vehicleForm.km) : null,
    });
    setSavingVehicle(false);
    if (err) { setVehicleError(err); return; }
    setVehicleForm({ plate: "", brand: "", model: "", year: "", km: "" });
    setShowVehicleForm(false);
    await load();
  }

  async function handleLogout() {
    await signOut();
    router.push("/connexion");
  }

  if (loading) {
    return <main className="mx-auto max-w-[900px] px-7 py-16 text-center text-sm text-gray">Chargement…</main>;
  }

  if (error || !data) {
    return (
      <main className="mx-auto max-w-[600px] px-7 py-16 text-center">
        <p className="rounded-[4px] border border-red/40 bg-red/10 p-4 text-sm font-bold text-red">{error}</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-[900px] px-7 py-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-black uppercase leading-[1.05]">
            Bonjour {data.client?.firstname || ""}
          </h1>
          <p className="mt-1 text-sm text-gray">{data.client?.email}</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/parametres" className="rounded-[4px] border border-[#333b44] px-4 py-2 text-xs font-bold hover:bg-white/5">
            Paramètres
          </Link>
          <button type="button" onClick={handleLogout} className="rounded-[4px] border border-[#333b44] px-4 py-2 text-xs font-bold hover:bg-white/5">
            Se déconnecter
          </button>
        </div>
      </div>

      <section className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase text-gray">Mes véhicules</h2>
          <button
            type="button"
            onClick={() => setShowVehicleForm((v) => !v)}
            className="rounded-[4px] border border-[#333b44] px-3 py-1.5 text-xs font-bold hover:bg-white/5"
          >
            {showVehicleForm ? "Annuler" : "+ Ajouter un véhicule"}
          </button>
        </div>

        {showVehicleForm && (
          <form onSubmit={handleAddVehicle} className="mt-3 grid gap-3 rounded-[4px] border border-[#242c34] bg-[#0a0f14] p-4 sm:grid-cols-2">
            {vehicleError && <p className="rounded-[4px] border border-red/40 bg-red/10 p-2 text-xs font-bold text-red sm:col-span-2">{vehicleError}</p>}
            <input
              required
              placeholder="Immatriculation (ex: AA-123-AA)"
              value={vehicleForm.plate}
              onChange={(e) => setVehicleForm((v) => ({ ...v, plate: e.target.value }))}
              className="rounded-[4px] border border-[#333b44] bg-[#070b10] p-2.5 text-sm text-white placeholder:text-[#8a929a]"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                required
                placeholder="Marque"
                value={vehicleForm.brand}
                onChange={(e) => setVehicleForm((v) => ({ ...v, brand: e.target.value }))}
                className="rounded-[4px] border border-[#333b44] bg-[#070b10] p-2.5 text-sm text-white placeholder:text-[#8a929a]"
              />
              <input
                required
                placeholder="Modèle"
                value={vehicleForm.model}
                onChange={(e) => setVehicleForm((v) => ({ ...v, model: e.target.value }))}
                className="rounded-[4px] border border-[#333b44] bg-[#070b10] p-2.5 text-sm text-white placeholder:text-[#8a929a]"
              />
            </div>
            <input
              type="number"
              placeholder="Année (optionnel)"
              value={vehicleForm.year}
              onChange={(e) => setVehicleForm((v) => ({ ...v, year: e.target.value }))}
              className="rounded-[4px] border border-[#333b44] bg-[#070b10] p-2.5 text-sm text-white placeholder:text-[#8a929a]"
            />
            <input
              type="number"
              placeholder="Kilométrage (optionnel)"
              value={vehicleForm.km}
              onChange={(e) => setVehicleForm((v) => ({ ...v, km: e.target.value }))}
              className="rounded-[4px] border border-[#333b44] bg-[#070b10] p-2.5 text-sm text-white placeholder:text-[#8a929a]"
            />
            <button
              type="submit"
              disabled={savingVehicle}
              className="rounded-[4px] border border-[#e10000] bg-gradient-to-b from-[#e40000] to-[#b90000] py-2.5 text-sm font-black text-white disabled:opacity-50 sm:col-span-2"
            >
              {savingVehicle ? "Enregistrement…" : "Enregistrer ce véhicule"}
            </button>
          </form>
        )}

        {data.vehicles.length === 0 ? (
          <p className="mt-3 text-sm text-gray">Aucun véhicule enregistré pour le moment.</p>
        ) : (
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {data.vehicles.map((v) => {
              const activeOrder = data.repairOrders.find((r) => r.vehicle_id === v.id);
              return (
                <div key={v.id} className="rounded-[4px] border border-[#242c34] bg-[#0a0f14] p-3 text-sm">
                  <p className="font-bold">{v.brand} {v.model}</p>
                  <p className="text-xs text-gray">{v.plate}</p>
                  {activeOrder && (
                    <p className="mt-2">
                      <span className={`rounded-full border px-3 py-1 text-xs font-bold ${statusColor(activeOrder.status)}`}>
                        {repairStatusLabel(activeOrder.status)}
                      </span>
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="mt-8">
        <h2 className="text-xs font-bold uppercase text-gray">Rendez-vous</h2>
        {data.appointments.length === 0 ? (
          <p className="mt-2 text-sm text-gray">Aucun rendez-vous pour le moment.</p>
        ) : (
          <div className="mt-3 space-y-2">
            {data.appointments.map((a) => (
              <div key={a.id} className="flex items-center justify-between rounded-[4px] border border-[#242c34] bg-[#0a0f14] p-3 text-sm">
                <div>
                  <p className="font-bold">{a.service}</p>
                  <p className="text-xs text-gray">{a.appointment_date}{a.appointment_time ? ` · ${a.appointment_time.slice(0, 5)}` : ""}</p>
                </div>
                <span className={`rounded-full border px-3 py-1 text-xs font-bold ${statusColor(a.status)}`}>{a.status}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mt-8">
        <h2 className="text-xs font-bold uppercase text-gray">Devis</h2>
        {data.quotes.length === 0 ? (
          <p className="mt-2 text-sm text-gray">Aucun devis pour le moment.</p>
        ) : (
          <div className="mt-3 space-y-2">
            {data.quotes.map((q) => (
              <div key={q.id} className="flex items-center justify-between rounded-[4px] border border-[#242c34] bg-[#0a0f14] p-3 text-sm">
                <p className="font-bold">{q.number || "Devis"}</p>
                <div className="flex items-center gap-3">
                  <span>{q.total.toFixed(2)} €</span>
                  <span className={`rounded-full border px-3 py-1 text-xs font-bold ${statusColor(q.status)}`}>{q.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mt-8">
        <h2 className="text-xs font-bold uppercase text-gray">Factures</h2>
        {data.invoices.length === 0 ? (
          <p className="mt-2 text-sm text-gray">Aucune facture pour le moment.</p>
        ) : (
          <div className="mt-3 space-y-2">
            {data.invoices.map((i) => (
              <div key={i.id} className="flex flex-wrap items-center justify-between gap-2 rounded-[4px] border border-[#242c34] bg-[#0a0f14] p-3 text-sm">
                <p className="font-bold">{i.number || "Facture"}</p>
                <div className="flex items-center gap-3">
                  <span>{i.paid_amount.toFixed(2)} € / {i.total.toFixed(2)} €</span>
                  <span className={`rounded-full border px-3 py-1 text-xs font-bold ${statusColor(i.status)}`}>{i.status}</span>
                  <button
                    type="button"
                    onClick={() => downloadInvoicePdf(i.id, i.number || "facture")}
                    className="rounded-[4px] border border-[#333b44] px-3 py-1.5 text-xs font-bold hover:bg-white/5"
                  >
                    PDF
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
