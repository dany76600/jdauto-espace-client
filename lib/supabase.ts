import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Client Supabase "soft" : si les variables d'environnement ne sont pas
 * renseignées (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY),
 * `supabase` vaut `null` au lieu de lever une exception. Tout le code
 * appelant doit gérer ce cas (voir isSupabaseConfigured()).
 *
 * IMPORTANT : createBrowserClient (et non createClient) — stocke la session
 * dans les cookies, pas le localStorage, pour rester synchronisé avec
 * middleware.ts (createServerClient, qui lit les cookies). Avec le simple
 * createClient précédent, la session côté navigateur (localStorage) et
 * celle vue par le middleware (cookies) pouvaient diverger, causant des
 * échecs d'écriture RLS intermittents malgré une connexion apparemment active.
 *
 * Objectif : permettre au site de fonctionner dès aujourd'hui (Supabase non
 * configuré) sans jamais bloquer l'utilisateur, tout en étant prêt à
 * enregistrer réellement les données dès que les clés seront fournies.
 */
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * fetch résilient — trouvé lors du chantier de résilience (12/07/2026) :
 * une vraie coupure réseau pendant un appel Supabase (createDevis,
 * createClient, etc. — 28 fonctions au total, systémique) fait planter
 * `fetch()` avec une exception JS brute (`TypeError: Failed to fetch`),
 * jamais interceptée par aucune des 28 fonctions, jamais passée par
 * `friendlyError()` (qui pourtant gère déjà ce cas précis) — confirmé
 * par test réel (page.route().abort()) : l'utilisateur voyait le texte
 * technique brut affiché directement.
 *
 * Plutôt que corriger 28 fonctions individuellement, ce fetch personnalisé
 * intercepte l'échec réseau à la source et renvoie une fausse réponse
 * HTTP 503 avec un corps JSON au format d'erreur Supabase standard — le
 * code appelant (data, error) la traite alors normalement, et
 * friendlyError() produit enfin le message clair déjà prévu pour ce cas.
 */
async function resilientFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(input, init);
  } catch (err) {
    // On conserve l'UX (fausse 503 → friendlyError produit un message clair),
    // mais on TRACE distinctement la vraie cause : sans cela, timeout, DNS,
    // CORS et abandon devenaient un « 503 » indistinct, masquant un incident
    // réseau persistant. Le nom/type d'erreur est journalisé pour la télémétrie.
    const cause = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
    const target = typeof input === "string" ? input : input instanceof URL ? input.toString() : "requête Supabase";
    console.warn(`[resilientFetch] échec réseau (${cause}) sur ${target} — réponse 503 synthétique renvoyée à l'appelant.`);
    return new Response(
      JSON.stringify({ message: "Failed to fetch — connexion réseau perdue", cause }),
      { status: 503, statusText: "Network Error", headers: { "Content-Type": "application/json" } },
    );
  }
}

export const supabase: SupabaseClient | null = url && anonKey ? createBrowserClient(url, anonKey, { global: { fetch: resilientFetch } }) : null;

export function isSupabaseConfigured(): boolean {
  return supabase !== null;
}
