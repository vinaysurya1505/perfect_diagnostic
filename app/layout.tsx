export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-gradient-to-br from-teal-100 to-white font-sans min-h-screen">{children}</body>
    </html>
  );
}
