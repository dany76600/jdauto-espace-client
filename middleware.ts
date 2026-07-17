import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

/**
 * Extrait de middleware.ts (Garage OS) le 14/07/2026 — logique espace
 * client uniquement, adaptée au routage racine puisque ce projet est
 * maintenant son propre site (ex: /espace-client/connexion devient /connexion).
 * La logique elle-même (pages publiques vs session requise) est inchangée,
 * caractère pour caractère, par rapport à l'original.
 */
const PUBLIC_PATHS = ["/connexion", "/inscription", "/mot-de-passe-oublie", "/reinitialiser"];

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const { pathname } = req.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) return res;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.redirect(new URL("/connexion", req.url));
  }

  const supabaseClient = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return req.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value, options }) => {
          res.cookies.set(name, value, options);
        });
      },
    },
  });

  try {
    const { data } = await supabaseClient.auth.getUser();
    if (!data.user) return NextResponse.redirect(new URL("/connexion", req.url));
  } catch {
    return NextResponse.redirect(new URL("/connexion", req.url));
  }
  return res;
}

export const config = {
  // Corrigé le 17/07/2026 : le motif précédent ("/", "/:path*") interceptait
  // absolument tout, y compris les fichiers CSS/JS internes de Next.js
  // (/_next/static/...) — chaque demande de fichier CSS se faisait rediriger
  // vers /connexion comme n'importe quelle autre page pour un visiteur non
  // connecté, expliquant l'absence totale de style en production (le
  // navigateur recevait du HTML à la place du CSS demandé). Motif standard
  // Next.js : exclut les fichiers internes et les assets statiques courants.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|css|js)$).*)"],
};
