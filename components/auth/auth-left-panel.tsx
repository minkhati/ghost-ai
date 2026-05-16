import { Ghost, BrainCircuit, Users, FileText } from "lucide-react";

const features = [
  {
    icon: BrainCircuit,
    title: "AI Architecture Generation",
    description:
      "Describe your system, AI maps it to nodes and edges on a live canvas.",
  },
  {
    icon: Users,
    title: "Real-time Collaboration",
    description:
      "Live cursors, presence indicators, and shared node editing across your team.",
  },
  {
    icon: FileText,
    title: "Instant Spec Generation",
    description:
      "Export a complete Markdown technical spec directly from the canvas graph.",
  },
];

export function AuthLeftPanel() {
  return (
    <div className="hidden lg:flex lg:w-1/2 flex-col justify-between px-16 py-12 bg-surface border-r border-surface-border">
      <div>
        <div className="flex items-center gap-2.5 mb-14">
          <div className="h-8 w-8 rounded-xl bg-brand flex items-center justify-center shrink-0">
            <Ghost className="h-4 w-4 text-[#080809]" />
          </div>
          <span className="text-copy-primary font-semibold text-base tracking-tight">
            Ghost AI
          </span>
        </div>
        <h1 className="text-copy-primary text-[2rem] font-bold leading-tight mb-4">
          Design systems at the
          <br />
          speed of thought.
        </h1>
        <p className="text-copy-muted text-sm leading-relaxed mb-12 max-w-xs">
          Describe your architecture in plain English. Ghost AI maps it to a
          shared canvas your whole team can refine in real time.
        </p>
        <ul className="space-y-6">
          {features.map(({ icon: Icon, title, description }) => (
            <li key={title} className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-xl bg-elevated border border-surface-border flex items-center justify-center shrink-0 mt-0.5">
                <Icon className="h-4 w-4 text-brand" />
              </div>
              <div>
                <p className="text-copy-primary text-sm font-medium">{title}</p>
                <p className="text-copy-muted text-xs mt-0.5 leading-relaxed">
                  {description}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <p className="text-copy-faint text-xs">
        © 2026 Ghost AI. All rights reserved.
      </p>
    </div>
  );
}
