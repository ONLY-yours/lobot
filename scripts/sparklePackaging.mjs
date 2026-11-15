const SPARKLE_RELEASE_CHANNELS = new Set(['stable', 'canary', 'beta']);

export const isSparkleReleaseChannel = (channel) =>
  !channel || SPARKLE_RELEASE_CHANNELS.has(channel);

export const resolveSparklePackaging = ({
  channel,
  hasAppleCertificate,
  platform,
  sparklePublicKey,
  updateServerUrl,
}) => {
  const hasSparkleSettings = Boolean(updateServerUrl && sparklePublicKey);
  const sparkleRelease = platform === 'darwin' && isSparkleReleaseChannel(channel);

  if (sparkleRelease && hasAppleCertificate && !hasSparkleSettings) {
    // Lobot ships without a Sparkle appcast host: keep the signed/notarized
    // build and let electron-updater read GitHub Releases instead. Upstream
    // requires the pair here, so warn loudly rather than failing the build.
    console.warn(
      '⚠️ 未配置 UPDATE_SERVER_URL / SPARKLE_ED_PUBLIC_KEY，macOS 更新改用 GitHub Releases',
    );
  }

  return { useSparkle: sparkleRelease && hasSparkleSettings };
};
