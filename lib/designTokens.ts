/**
 * Design System V13 — copie intégrée directement dans ce projet.
 *
 * Auparavant partagée via un paquet externe (@jdauto/design-tokens, lien
 * local file:../jdauto-design-tokens) — ce lien fonctionne en local mais
 * casse tout déploiement Vercel, qui ne clone que ce seul dépôt, jamais
 * un dossier voisin. Ces valeurs sont donc dupliquées ici volontairement,
 * pour la fiabilité du déploiement — au prix, assumé, de devoir répercuter
 * manuellement tout futur changement de couleur dans les deux projets
 * (jdauto-site et jdauto-espace-client) plutôt qu'à un seul endroit.
 */
export const colors = {
  black: "#030609",
  panel: "#080d12",
  card: "#0b1117",
  border: "#1c2730",
  gray: "#bcc4cc",
  red: "#e00000",
  redDark: "#b00000",
  success: "#16a34a",
  warning: "#e0a023",
  info: "#4f8fd1",
};

export const fontFamily = {
  sans: ["Inter", "Montserrat", "Arial", "sans-serif"],
};

export const borderRadius = {
  button: "4px",
  card: "6px",
};

export const tailwindPreset = {
  theme: {
    extend: {
      colors: {
        black: colors.black,
        panel: colors.panel,
        card: colors.card,
        border: colors.border,
        gray: colors.gray,
        red: { DEFAULT: colors.red, dark: colors.redDark },
        success: colors.success,
        warning: colors.warning,
        info: colors.info,
      },
      fontFamily: { sans: fontFamily.sans },
      borderRadius: { button: borderRadius.button, card: borderRadius.card },
    },
  },
};
