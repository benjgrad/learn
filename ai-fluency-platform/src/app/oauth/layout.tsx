/**
 * The consent screen deliberately drops the site header and footer.
 *
 * A screen that grants a third party access to someone's data has to be legible
 * as exactly that. Framed by the normal marketing nav it reads as just another
 * page, which is the shape of a phishing problem. AuthProvider sits above this
 * in the tree, so the session is still available.
 */
export default function OAuthLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-dvh flex items-center justify-center px-4 py-12">{children}</div>;
}
