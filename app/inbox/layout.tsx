import Link from "next/link";
import SignOutButton from "./sign-out-button";

export default function InboxLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ fontFamily: "system-ui" }}>
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0.75rem 1rem",
          borderBottom: "1px solid #eee",
        }}
      >
        <Link href="/inbox" style={{ fontWeight: 600, textDecoration: "none" }}>
          BraZap
        </Link>
        <SignOutButton />
      </header>
      <main style={{ padding: "1rem" }}>{children}</main>
    </div>
  );
}
