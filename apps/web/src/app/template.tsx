// Re-mounts on every navigation; a very short fade so the new page is visible almost immediately.
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-in">{children}</div>;
}
