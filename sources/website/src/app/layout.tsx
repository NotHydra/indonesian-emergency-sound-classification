import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { NextFont } from "next/dist/compiled/@next/font";

import "bulma/css/bulma.css";
import "@fortawesome/fontawesome-free/css/all.css";
import "./../public/css/main.css";

const inter: NextFont = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "Indonesian Emergency Sound Classification",
    description: "Emergency sound classification for Indonesia",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>): JSX.Element {
    return (
        <html lang="en">
            <body className={inter.className}>{children}</body>
        </html>
    );
}
