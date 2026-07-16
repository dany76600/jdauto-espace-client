"use client";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export function isUsingRealDatabase(): boolean {
  return isSupabaseConfigured();
}

export async function signUp(input: {
  email: string;
  password: string;
  firstname: string;
  lastname: string;
  phone: string;
}): Promise<{ error?: string }> {
  if (!isSupabaseConfigured() || !supabase) return { error: "Supabase non configuré." };

  const { error: signUpError } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
  });
  if (signUpError) return { error: friendlyAuthError(signUpError.message) };

  // La liaison (retrouver ou créer la fiche client) se fait au premier
  // login réel, pas ici : tant que l'email n'est pas confirmé, il n'y a
  // pas de session active pour appeler la fonction sécurisée.
  return {};
}

export async function signIn(email: string, password: string): Promise<{ error?: string }> {
  if (!isSupabaseConfigured() || !supabase) return { error: "Supabase non configuré." };
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: friendlyAuthError(error.message) };
  return {};
}

export async function signOut(): Promise<void> {
  if (!isSupabaseConfigured() || !supabase) return;
  await supabase.auth.signOut();
}

export async function requestPasswordReset(email: string): Promise<{ error?: string }> {
  if (!isSupabaseConfigured() || !supabase) return { error: "Supabase non configuré." };
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reinitialiser`,
  });
  if (error) return { error: friendlyAuthError(error.message) };
  return {};
}

export async function updatePassword(newPassword: string): Promise<{ error?: string }> {
  if (!isSupabaseConfigured() || !supabase) return { error: "Supabase non configuré." };
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) return { error: friendlyAuthError(error.message) };
  return {};
}

/**
 * Retrouve ou crée la fiche client liée au compte connecté — appelée une
 * fois après connexion (idempotente, sans effet si déjà liée). Nécessaire
 * ici plutôt qu'à l'inscription car Supabase exige une session active
 * (email confirmé) pour appeler une fonction RPC authentifiée.
 */
export async function ensureClientLinked(firstname: string, lastname: string, phone: string): Promise<{ clientId?: string; error?: string }> {
  if (!isSupabaseConfigured() || !supabase) return { error: "Supabase non configuré." };
  const { data: userData } = await supabase.auth.getUser();
  const email = userData.user?.email;
  if (!email) return { error: "Session invalide." };

  const { data, error } = await supabase.rpc("link_or_create_client_account", {
    p_email: email,
    p_firstname: firstname,
    p_lastname: lastname,
    p_phone: phone,
  });
  if (error) return { error: friendlyAuthError(error.message) };
  return { clientId: data as string };
}

const REPAIR_STATUS_LABELS: Record<string, string> = {
  attente: "En attente de prise en charge",
  "en-cours": "En cours de réparation",
  controle: "Contrôle qualité",
  termine: "Terminé",
  livre: "Livré",
  annule: "Annulé",
};

export function repairStatusLabel(status: string): string {
  return REPAIR_STATUS_LABELS[status] ?? status;
}

export type MyClientData = {
  client: { id: string; firstname: string; lastname: string; email: string; phone: string } | null;
  vehicles: Array<{ id: string; plate: string; brand: string; model: string }>;
  appointments: Array<{ id: string; appointment_date: string; appointment_time: string | null; service: string; status: string }>;
  quotes: Array<{ id: string; number: string | null; status: string; total: number; created_at: string }>;
  invoices: Array<{ id: string; number: string | null; status: string; total: number; paid_amount: number; created_at: string }>;
  repairOrders: Array<{ id: string; vehicle_id: string | null; title: string | null; status: string; updated_at: string }>;
};

/**
 * Ajoute un véhicule à SA PROPRE fiche client — la policy RLS
 * (client_self_insert_vehicle, 084) refuse toute tentative avec un
 * client_id différent du sien, donc même une valeur falsifiée côté
 * navigateur serait rejetée par la base, pas juste par ce code.
 */
export async function addMyVehicle(input: {
  plate: string;
  brand: string;
  model: string;
  year?: number | null;
  km?: number | null;
}): Promise<{ error?: string }> {
  if (!isSupabaseConfigured() || !supabase) return { error: "Supabase non configuré." };
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { error: "Session invalide." };

  const { data: link } = await supabase.from("client_web_accounts").select("client_id").eq("auth_user_id", userData.user.id).maybeSingle();
  if (!link) return { error: "Ta fiche client n'a pas encore été trouvée — recharge la page et réessaie." };

  const { error } = await supabase.from("client_vehicles").insert({
    client_id: link.client_id,
    plate: input.plate.toUpperCase().trim(),
    brand: input.brand.trim(),
    model: input.model.trim(),
    year: input.year ?? null,
    km: input.km ?? null,
  });
  if (error) return { error: friendlyAuthError(error.message) };
  return {};
}

/** Toutes les données visibles par le client connecté — la RLS garantit qu'il ne voit que les siennes, ce code ne filtre rien lui-même. */
export async function loadMyClientData(): Promise<MyClientData> {
  const empty: MyClientData = { client: null, vehicles: [], appointments: [], quotes: [], invoices: [], repairOrders: [] };
  if (!isSupabaseConfigured() || !supabase) return empty;

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return empty;

  const { data: link } = await supabase.from("client_web_accounts").select("client_id").eq("auth_user_id", userData.user.id).maybeSingle();
  if (!link) return empty;

  const [clientRes, vehiclesRes, apptRes, quotesRes, invoicesRes, repairRes] = await Promise.all([
    supabase.from("clients").select("id, firstname, lastname, email, phone").eq("id", link.client_id).maybeSingle(),
    supabase.from("client_vehicles").select("id, plate, brand, model").eq("client_id", link.client_id),
    supabase.from("appointments").select("id, appointment_date, appointment_time, service, status").eq("client_id", link.client_id).order("appointment_date", { ascending: false }),
    supabase.from("quotes").select("id, number, status, total, created_at").eq("client_id", link.client_id).order("created_at", { ascending: false }),
    supabase.from("invoices").select("id, number, status, total, paid_amount, created_at").eq("client_id", link.client_id).order("created_at", { ascending: false }),
    supabase.from("repair_orders").select("id, vehicle_id, title, status, updated_at").eq("client_id", link.client_id).order("updated_at", { ascending: false }),
  ]);

  return {
    client: clientRes.data ?? null,
    vehicles: vehiclesRes.data ?? [],
    appointments: apptRes.data ?? [],
    quotes: quotesRes.data ?? [],
    invoices: invoicesRes.data ?? [],
    repairOrders: repairRes.data ?? [],
  };
}

export async function updateMyPhone(phone: string): Promise<{ error?: string }> {
  if (!isSupabaseConfigured() || !supabase) return { error: "Supabase non configuré." };
  const { error } = await supabase.rpc("update_my_phone", { p_phone: phone });
  if (error) return { error: friendlyAuthError(error.message) };
  return {};
}

/** Télécharge le PDF d'une facture — la route serveur ne renvoie que les factures qui appartiennent au client connecté (RLS), jamais les autres. */
export async function downloadInvoicePdf(invoiceId: string, filename: string): Promise<{ error?: string }> {
  try {
    const res = await fetch("/api/documents/invoice-pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ invoiceId }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      return { error: body?.error || "Échec du téléchargement." };
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    return {};
  } catch {
    return { error: "Erreur réseau lors du téléchargement." };
  }
}

function friendlyAuthError(raw: string): string {
  if (raw.includes("Invalid login credentials")) return "Email ou mot de passe incorrect.";
  if (raw.includes("User already registered")) return "Un compte existe déjà avec cet email — connecte-toi plutôt.";
  if (raw.includes("Password should be at least")) return "Le mot de passe doit faire au moins 6 caractères.";
  if (raw.includes("Email not confirmed")) return "Confirme d'abord ton email (lien envoyé à l'inscription) avant de te connecter.";
  return raw;
}
