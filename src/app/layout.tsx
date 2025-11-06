import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AuthProvider from "../components/providers/auth-provider";
import Navigation from "../components/Navigation";
import Footer from "../components/Footer";
import { NotificationProvider } from "../components/providers/notification-provider";
import Sidebar from "../components/Sidebar";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Bracket - Plateforme de gestion de tournois",
  description: "Organisez et participez à des tournois de jeux vidéo. Simple, rapide et professionnel.",
  keywords: "tournoi, jeux vidéo, compétition, esport",
  authors: [{ name: "Bracket" }],
  openGraph: {
    title: "Bracket - Plateforme de gestion de tournois",
    description: "Organisez et participez à des tournois de jeux vidéo.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className={inter.variable}>
        <AuthProvider>
          <NotificationProvider>
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
          </NotificationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
