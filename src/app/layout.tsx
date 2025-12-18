import type { Metadata } from "next";
import "../styles/globals.scss";
import AuthProvider from "../components/providers/auth-provider";
import Navigation from "../components/Navigation";
import Footer from "../components/Footer";
import { NotificationProvider } from "../components/providers/notification-provider";
import { AuthModalProvider } from "../components/AuthModal/AuthModalContext";
import { CreateTournamentModalProvider } from "../components/CreateTournamentModal/CreateTournamentModalContext";
import { ThemeProvider } from "../components/providers/theme-provider";
import Sidebar from "../components/Sidebar";
import { Funnel_Display, Red_Hat_Display } from "next/font/google";

const primaryFont = Funnel_Display({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-primary",
});

const secondaryFont = Red_Hat_Display({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-secondary",
});

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
    <html lang="fr" className={`${primaryFont.variable} ${secondaryFont.variable}`}>
      <body className={secondaryFont.className}>
        <ThemeProvider>
          <AuthProvider>
            <NotificationProvider>
              <AuthModalProvider>
                <CreateTournamentModalProvider>
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
                </CreateTournamentModalProvider>
              </AuthModalProvider>
            </NotificationProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
