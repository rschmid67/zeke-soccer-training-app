import "./globals.css";

export const metadata = {
  title: "EliteFC Training",
  description: "Youth soccer training tracker with AI coaching",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
