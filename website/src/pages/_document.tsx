import { Head, Html, Main, NextScript } from "next/document";
import { JSX } from "react";

export default function Document(): JSX.Element {
    return (
        <Html lang="en">
            <Head>
                <meta charSet="UTF-8" />
                <link rel="shortcut icon" href="favicon.ico" />
            </Head>

            <body>
                <Main />

                <NextScript />
            </body>
        </Html>
    );
}
