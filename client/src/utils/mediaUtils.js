/**
 * Shared media stream utility for TalentTrail AI
 * Ensures all video and audio tracks are safely registered and stopped on component exit, unmount, or interview completion.
 */

const activeStreams = new Set();
const activeTracks = new Set();

/**
 * Register an active MediaStream so it is tracked globally across views
 * @param {MediaStream} stream
 * @returns {MediaStream}
 */
export function registerMediaStream(stream) {
  if (!stream || typeof stream.getTracks !== 'function') return stream;
  try {
    activeStreams.add(stream);
    const tracks = stream.getTracks();
    tracks.forEach(track => {
      activeTracks.add(track);
      track.addEventListener('ended', () => {
        activeTracks.delete(track);
        const hasLiveTracks = stream.getTracks().some(t => t.readyState === 'live');
        if (!hasLiveTracks) {
          activeStreams.delete(stream);
        }
      });
    });
  } catch (err) {
    console.warn('registerMediaStream note:', err);
  }
  return stream;
}

/**
 * Stop a specific MediaStream cleanly, disabling and terminating all tracks
 * @param {MediaStream} stream
 */
export function stopMediaStream(stream) {
  if (!stream) return;
  activeStreams.delete(stream);
  try {
    const tracks = typeof stream.getTracks === 'function' ? stream.getTracks() : [];
    tracks.forEach(track => {
      try {
        track.enabled = false;
        track.stop();
        activeTracks.delete(track);
      } catch (err) {
        console.warn('Track stop note:', err);
      }
    });
  } catch (err) {
    console.warn('Stream cleanup note:', err);
  }
}

/**
 * Stop ALL active media streams across the entire application immediately.
 * Guaranteed to turn off camera & microphone hardware indicator LEDs.
 */
export function stopAllMediaStreams() {
  activeStreams.forEach(stream => {
    try {
      const tracks = typeof stream.getTracks === 'function' ? stream.getTracks() : [];
      tracks.forEach(track => {
        try {
          track.enabled = false;
          track.stop();
        } catch {}
      });
    } catch {}
  });
  activeTracks.forEach(track => {
    try {
      track.enabled = false;
      track.stop();
    } catch {}
  });
  activeStreams.clear();
  activeTracks.clear();
}

// Global safety net on tab close/unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', stopAllMediaStreams);
  window.addEventListener('pagehide', stopAllMediaStreams);
  window.__taletrail_stop_all_media = stopAllMediaStreams;
}
