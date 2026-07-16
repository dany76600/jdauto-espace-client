"use client";

/**
 * En-tête dédié à l'Espace client — volontairement différent du Header du
 * Site internet (9 liens de menu marketing). Un tableau de bord client n'a
 * pas besoin du menu Services/Mécanique/Carrosserie — seulement de son
 * propre nom et d'un moyen de revenir au site principal. Les couleurs et
 * la police restent exactement le Design V13 (voir @jdauto/design-tokens).
 */
export default function EspaceClientHeader() {
  return (
    <header className="h-[78px] border-b border-[#161b20] bg-[#05080c]">
      <div className="mx-auto flex h-full max-w-[1320px] items-center justify-between px-7">
        <div className="whitespace-nowrap text-[28px] font-black">
          <span className="text-red">JD</span> AUTO
          <span className="ml-3 text-sm font-bold uppercase tracking-wide text-gray">Espace client</span>
        </div>
        <a href="https://jdauto76.fr" className="text-xs font-extrabold text-white hover:text-red">
          ← Retour au site
        </a>
      </div>
    </header>
  );
}
