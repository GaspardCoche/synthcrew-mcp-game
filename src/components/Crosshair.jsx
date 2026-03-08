export default function Crosshair({ visible }) {
  if (!visible) return null;
  return (
    <div className="fixed inset-0 z-30 pointer-events-none flex items-center justify-center">
      <div className="relative w-6 h-6">
        <div className="absolute top-1/2 left-0 w-full h-px bg-synth-primary/40" />
        <div className="absolute left-1/2 top-0 h-full w-px bg-synth-primary/40" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-synth-primary/70" />
      </div>
    </div>
  );
}
