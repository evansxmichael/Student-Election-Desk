// Mobile Haptic Feedback API
export function triggerHaptic(type: 'vote' | 'undo' | 'error' = 'vote') {
  if (typeof window !== 'undefined' && 'navigator' in window && navigator.vibrate) {
    try {
      if (type === 'vote') {
        navigator.vibrate([40, 30, 60]); // energetic confirmation
      } else if (type === 'undo') {
        navigator.vibrate(30); // light tick
      } else {
        navigator.vibrate([50, 50, 50]);
      }
    } catch {
      // Ignore vibration error
    }
  }
}
