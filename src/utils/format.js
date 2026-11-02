function formatDuration(totalSeconds) {
  if (totalSeconds == null || Number.isNaN(Number(totalSeconds))) return '--:--';
  const s = Math.floor(Number(totalSeconds));
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, '0')}`;
}

module.exports = { formatDuration };
