import "./globals.css";

export const metadata = {
  title: "Nexus Pipeline",
  description: "Shared contact log & deal tracker",
};

const THEME_KEY = "nexus:theme";

// Runs before paint so the picked theme applies immediately, instead of a
// flash of the default (white accent) theme while React hydrates.
const setThemeBeforePaint = `
(function () {
  try {
    var theme = localStorage.getItem(${JSON.stringify(THEME_KEY)});
    if (theme && theme !== "mono") document.documentElement.setAttribute("data-theme", theme);
  } catch (e) {}
})();
`;

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: setThemeBeforePaint }} />
      </head>
      <body className="min-h-screen bg-neutral-950 text-neutral-100">
        <main>{children}</main>
      </body>
    </html>
  );
}
