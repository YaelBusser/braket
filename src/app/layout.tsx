import type { Metadata } from "next";
import "./globals.css";
import AuthProvider from "../components/providers/auth-provider";
import Navigation from "../components/Navigation";
import Footer from "../components/Footer";
import { NotificationProvider } from "../components/providers/notification-provider";
import { AuthModalProvider } from "../components/AuthModalContext";
import Sidebar from "../components/Sidebar";

export const metadata: Metadata = {
  title: "Braket - Plateforme de gestion de tournois",
  description: "Organisez et participez à des tournois de jeux vidéo. Simple, rapide et professionnel.",
  keywords: "tournoi, jeux vidéo, compétition, esport",
  authors: [{ name: "Braket" }],
  openGraph: {
    title: "Braket - Plateforme de gestion de tournois",
    description: "Organisez et participez à des tournois de jeux vidéo.",
    type: "website",
  },
  icons: {
    icon: '/icons/icon_dark.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body>
        <AuthProvider>
          <NotificationProvider>
            <AuthModalProvider>
              <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
                <Sidebar />
                <Navigation />
                <div className="mainContentWrapper">
                  <main style={{ flex: 1 }}>
                    {children}
                  </main>
                  <Footer />
                </div>
              </div>
            </AuthModalProvider>
          </NotificationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
