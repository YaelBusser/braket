import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AuthProvider from "../components/providers/auth-provider";
import Navigation from "../components/Navigation";
import { CategoryProvider } from "../components/providers/category-provider";
import { NotificationProvider } from "../components/providers/notification-provider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "LeTournoi - Plateforme de gestion de tournois",
  description: "Organisez et participez à des tournois de jeux vidéo, sport et jeux de société. Simple, rapide et professionnel.",
  keywords: "tournoi, jeux vidéo, sport, jeux de société, compétition, esport",
  authors: [{ name: "LeTournoi" }],
  openGraph: {
    title: "LeTournoi - Plateforme de gestion de tournois",
    description: "Organisez et participez à des tournois de jeux vidéo, sport et jeux de société.",
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
            <CategoryProvider>
              <Navigation />
              {children}
            </CategoryProvider>
          </NotificationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
