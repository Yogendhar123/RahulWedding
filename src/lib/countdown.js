export function getCountdown(target, now = Date.now()) {
  const distance = Math.max(0, new Date(target).getTime() - now);
  return { days: Math.floor(distance / 86400000), hours: Math.floor(distance / 3600000) % 24, minutes: Math.floor(distance / 60000) % 60, seconds: Math.floor(distance / 1000) % 60, complete: distance === 0 };
}