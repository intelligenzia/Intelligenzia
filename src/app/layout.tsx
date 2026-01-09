// Root layout - locale layouts handle the HTML structure
// This is needed for Next.js but the actual layout is in [locale]/layout.tsx
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
