import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Without this, tablets/phones render the page at a fake desktop width
            and shrink it to fit, so everything (sliders, buttons, text) ends up
            tiny and needs pinch-zoom. This tells the browser to use the device's
            real width at 1:1 scale, which is what makes touch targets and text
            actually usable on a tablet. */}
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        {/* Tells the browser both themes exist, so form controls, scrollbars
            and the address bar follow the page instead of staying light. */}
        <meta name="color-scheme" content="light dark" />
        <meta name="theme-color" content="#f2f2f7" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#000000" media="(prefers-color-scheme: dark)" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
