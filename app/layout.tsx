export const metadata = {
  title: "BraZap",
  description: "Plataforma de atendimento via WhatsApp Business API",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
