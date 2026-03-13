import "@/app/create-agents/agent-builder.css";

export default function CreateAgentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="agent-builder-theme">
      {children}
    </div>
  );
}
