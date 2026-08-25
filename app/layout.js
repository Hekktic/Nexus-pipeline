import "./globals.css";

export const metadata = {
  title: "Nexus Pipeline",
  description: "Shared contact log & deal tracker",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 text-slate-100">
        <main className="px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
