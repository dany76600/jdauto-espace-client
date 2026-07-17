# ESPACE CLIENT JD AUTO — Carnet de suivi

Ce fichier vit dans le projet, pas dans une conversation — reprend
exactement ici où on s'arrête, même méthode que AUDIT_LEDGER.md côté
Garage OS.

## Contraintes de la feuille de route (rappel, ne jamais dévier sans le dire)
- Architecture figée. Retirer : Carnet d'entretien, Suivi atelier (déjà absents du code actuel — rien à faire).
- Toutes les fonctions activables/désactivables depuis JDOS.
- Profils Basique / Premium / Complet.
- Une seule base Supabase. CMS intégré à Garage OS. Site et Espace Client indépendants. Design V13 inchangé.

## État réel au 17/07/2026

| Module | Statut |
|---|---|
| Authentification (compte, connexion, mot de passe oublié) | ✅ Déjà existant avant ce soir |
| **Système d'activation/désactivation (fondation)** | ✅ Construit |
| Tableau de bord | ✅ Toutes les sections existantes câblées sur leur drapeau |
| Mes véhicules | ✅ Contenu existant, drapeau câblé |
| Rendez-vous | ✅ Contenu existant, drapeau câblé |
| Devis | ✅ Affichage câblé sur son drapeau (correction : existait déjà, mal noté "non construit" plus tôt) |
| Factures | ✅ Câblé, PDF sur son propre drapeau distinct (plus fin que la section elle-même) |
| **Documents** | ✅ Module réellement construit ce round — table, sécurité, lecture, affichage, téléchargement |
| **Messagerie** | ✅ Module réellement construit ce round — bidirectionnel, sécurisé, les deux côtés |
| **Notifications** | ✅ Construit — compteur réel de messages non lus (pastille sur le tableau de bord). Email/SMS non inclus (demanderait un service externe, Twilio/SendGrid, non configuré). |
| **Fidélité** | ✅ Construit — dernier module de la liste. Attribution manuelle par le personnel (choix assumé, pas de règle automatique inventée), solde et historique réels des deux côtés. |
| Mon compte | ✅ Page Paramètres déjà existante |
| Profils Basique/Premium/Complet (bundles de drapeaux) | ⬜ Structure prévue, aucune logique de bundle construite |
| Déploiement Vercel réel | ⬜ Jamais fait |
| **Panneau Garage OS pour gérer les documents partagés** | ✅ Construit — envoi, liste, suppression, directement depuis la fiche client |

## Ce qui a été construit ce soir, précisément

### 1. Fondation — système d'activation/désactivation
- **SQL** (`093_ESPACE_CLIENT_TOGGLES.sql`) : 14 fonctionnalités dans `site_settings` (réutilise la table déjà éprouvée pour les modules IA, pas un système parallèle), lecture publique limitée aux seules clés `espace_client_%` (le reste de site_settings reste réservé au personnel), nouvelle section RBAC `espace_client` pour le panneau de gestion.
- **Côté Espace Client** (`lib/featureFlags.ts`) : lecture réelle des drapeaux, fail-closed (tout désactivé si Supabase indisponible ou erreur), mise en cache pour éviter une requête par page.
- **Côté Garage OS** (`/admin/espace-client`) : vrais interrupteurs, écriture réelle en base, optimiste avec annulation propre en cas d'échec. Ajouté au menu.

### 2. Bug réel trouvé et corrigé au passage
Le script `sync-middleware-sections.js` (censé régénérer `middleware.ts` à chaque nouvelle section) était lui-même cassé — son motif de recherche ne correspondait plus au texte réel du commentaire dans le fichier cible, probablement depuis une modification antérieure du commentaire jamais répercutée sur le script. Corrigé, revérifié fonctionnel en le faisant vraiment tourner.

### 3. Preuve de fonctionnement
La section "Mes véhicules" du tableau de bord existant respecte maintenant réellement le drapeau `vehicules` — masquée tant que le chargement n'a pas confirmé qu'elle est activée (fail-closed, cohérent avec le reste du système), visible sinon.

## Prochaine action

**Les 10 modules de la feuille de route ont maintenant tous été traités** (construits ou honnêtement câblés). Reste, pour un vrai lancement :
- Les 3 profils Basique/Premium/Complet (bundles de drapeaux) — ✅ Construits. Bascule réelle des 14 interrupteurs en un clic, avec confirmation avant d'appliquer. Une modification manuelle d'un interrupteur individuel efface l'affichage du profil actif plutôt que de mentir sur un état qui ne correspond plus exactement.
- Déploiement Vercel réel — jamais fait, projet encore en sandbox.
- Un point de dette technique assumé : lib/admin/clientDocumentsStore.ts (Garage OS) gère maintenant documents + messagerie + fidélité — le nom ne reflète plus son vrai contenu, à renommer un jour sans urgence fonctionnelle.

## Bug de production trouvé et corrigé — 17/07/2026

**Aucun style ne se chargeait sur le déploiement Vercel réel.** Cause trouvée par inspection directe du HTML envoyé par le vrai déploiement (pas une supposition) : le middleware interceptait absolument toutes les requêtes, y compris les fichiers CSS/JS internes de Next.js (`/_next/static/...`). Chaque demande du fichier CSS se faisait rediriger vers `/connexion` comme n'importe quelle autre page pour un visiteur non authentifié — le navigateur recevait du HTML à la place du CSS, ne pouvait pas l'appliquer. Corrigé avec le motif d'exclusion standard Next.js (matcher). Confirmé au passage : Garage OS n'a pas ce même défaut (motif de middleware différent, limité à /admin et /espace-client, ne touche jamais _next/static).
