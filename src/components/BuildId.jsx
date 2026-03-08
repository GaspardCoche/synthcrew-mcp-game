/**
 * Affiche l’identifiant de build pour vérifier qu’on a bien la dernière version après déploiement.
 */
/* global __BUILD_ID__ */
const buildId = typeof __BUILD_ID__ !== "undefined" ? __BUILD_ID__ : `dev-${Date.now()}`;
const shortId = buildId.length > 12 ? buildId.slice(0, 7) : buildId;

export function BuildId({ className = "", showFull = false }) {
  return (
    <span
      className={`font-jetbrains text-[9px] text-gray-600 hover:text-gray-500 ${className}`}
      title={`Build: ${buildId}`}
    >
      {showFull ? buildId : shortId}
    </span>
  );
}

export { buildId };
