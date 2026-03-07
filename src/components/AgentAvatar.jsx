/**
 * Avatar agent : initiales dans un cercle (couleur agent).
 * Remplace les emojis pour un rendu plus pro.
 */
export default function AgentAvatar({ agent, size = "md", className = "" }) {
  const name = agent?.name || "?";
  const initials = name
    .replace(/[^A-Za-z0-9]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?";
  const color = agent?.color || "#00f0ff";
  const sizeClass = size === "sm" ? "w-8 h-8 text-xs" : size === "lg" ? "w-14 h-14 text-lg" : "w-10 h-10 text-sm";

  return (
    <div
      className={`rounded-full flex items-center justify-center font-orbitron font-bold shrink-0 ${sizeClass} ${className}`}
      style={{
        background: `linear-gradient(135deg, ${color}40, ${color}20)`,
        border: `2px solid ${color}60`,
        color,
      }}
      title={name}
    >
      {initials}
    </div>
  );
}
