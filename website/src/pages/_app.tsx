"use client";

import { NextFont } from "next/dist/compiled/@next/font";
import { Inter } from "next/font/google";

import "@/styles/css/main.css";
import "@fortawesome/fontawesome-free/css/all.css";
import "bulma/css/bulma.css";
import { AppProps } from "next/app";

const inter: NextFont = Inter({ display: "swap", subsets: ["latin"], preload: true });

export default function App({ Component, pageProps }: AppProps): JSX.Element {
    return (
        <>
            <Component {...pageProps} />
        </>
    );
}
