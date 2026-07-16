import type { Metadata } from "next";
import EspaceClientHeader from "@/components/EspaceClientHeader";
import "./globals.css";

export const metadata: Metadata = {
  title: "Espace client | JD AUTO",
  description: "Accédez à vos rendez-vous, devis et factures JD AUTO.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <EspaceClientHeader />
        {children}
      </body>
    </html>
  );
}
