import type { Metadata } from "next";
import type { ReactNode } from "react";
import "@fontsource/nunito/latin-400.css";
import "@fontsource/nunito/latin-600.css";
import "@fontsource/nunito/latin-700.css";
import "@fontsource/nunito/latin-800.css";
import "@fontsource/nunito/latin-900.css";
import "@fontsource/lilita-one/latin-400.css";
import "./globals.css";
export const metadata: Metadata = {
  title: "Number Jump Adventure · Kartu Berburu Poin",
  description:
    "Petualangan matematika 3D untuk kelas 2 SD. Ambil kartu fisik, pecahkan soal, dan jelajahi lima dunia bersama Number Bot. Created by: Widodo Guru SD.",
  icons: { icon: "/icon.svg" },
};
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
