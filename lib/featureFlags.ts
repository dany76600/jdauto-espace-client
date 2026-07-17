import { supabase, isSupabaseConfigured } from "./supabase";

/**
 * Système d'activation/désactivation des fonctionnalités, piloté depuis
 * Garage OS (feuille de route Espace Client, 17/07/2026). Une seule
 * requête pour toutes les fonctionnalités à la fois — jamais une par
 * écran, pour éviter un effet de bord N+1 sur chaque page.
 *
 * Volontairement fail-closed : si Supabase n'est pas configuré, ou si
 * la requête échoue, TOUT est considéré désactivé plutôt que d'afficher
 * une fonctionnalité potentiellement absente ou mal câblée.
 */
export type FeatureKey =
  | "creation_compte" | "validation_email" | "deux_fa" | "vehicules"
  | "rendez_vous" | "devis" | "factures" | "pdf" | "documents"
  | "messagerie" | "notifications" | "fidelite" | "paiement" | "historique";

/**
 * Répartition des 14 fonctionnalités par profil (17/07/2026) — une
 * proposition raisonnable, pas une règle imposée : Basique = l'essentiel
 * en lecture, Premium ajoute l'interactif (devis, documents,
 * notifications), Complet ajoute la sécurité et les échanges avancés
 * (2FA, messagerie, fidélité, paiement). Modifiable individuellement à
 * tout moment depuis Garage OS, un profil n'est qu'un raccourci de
 * préréglage — jamais la seule source de vérité que le code vérifie.
 */
export const PROFILE_BUNDLES: Record<"basique" | "premium" | "complet", FeatureKey[]> = {
  basique: ["creation_compte", "validation_email", "vehicules", "rendez_vous", "factures", "pdf", "historique"],
  premium: ["creation_compte", "validation_email", "vehicules", "rendez_vous", "devis", "factures", "pdf", "documents", "notifications", "historique"],
  complet: ["creation_compte", "validation_email", "deux_fa", "vehicules", "rendez_vous", "devis", "factures", "pdf", "documents", "messagerie", "notifications", "fidelite", "paiement", "historique"],
};

let cache: Record<string, boolean> | null = null;
let cachePromise: Promise<Record<string, boolean>> | null = null;

async function loadFeatures(): Promise<Record<string, boolean>> {
  if (cache) return cache;
  if (cachePromise) return cachePromise;

  cachePromise = (async () => {
    if (!isSupabaseConfigured() || !supabase) return {};
    const { data, error } = await supabase
      .from("site_settings")
      .select("key, value")
      .like("key", "espace_client_feature:%");
    if (error || !data) return {};

    const result: Record<string, boolean> = {};
    for (const row of data) {
      const featureKey = (row.key as string).replace("espace_client_feature:", "");
      const value = row.value as { enabled?: boolean } | null;
      result[featureKey] = !!value?.enabled;
    }
    cache = result;
    return result;
  })();

  return cachePromise;
}

/** Réinitialise le cache — à appeler après un changement de réglage côté Garage OS, si jamais rechargé sans rafraîchir la page. */
export function resetFeatureCache(): void {
  cache = null;
  cachePromise = null;
}

export async function isFeatureEnabled(key: FeatureKey): Promise<boolean> {
  const features = await loadFeatures();
  return features[key] ?? false;
}

/** Version groupée — pour un layout ou une page ayant besoin de plusieurs drapeaux à la fois, une seule requête réseau au lieu de N. */
export async function loadAllFeatures(): Promise<Record<FeatureKey, boolean>> {
  const features = await loadFeatures();
  const keys: FeatureKey[] = [
    "creation_compte", "validation_email", "deux_fa", "vehicules", "rendez_vous",
    "devis", "factures", "pdf", "documents", "messagerie", "notifications",
    "fidelite", "paiement", "historique",
  ];
  return Object.fromEntries(keys.map((k) => [k, features[k] ?? false])) as Record<FeatureKey, boolean>;
}
