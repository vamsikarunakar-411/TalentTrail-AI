/**
 * TalentTrail AI — Anti-Malpractice & Face Presence Security Configuration
 * 
 * Centralized, clearly documented thresholds governing candidate face-presence
 * monitoring, grace periods, and interview termination rules.
 */

export const SECURITY_CONFIG = {
  /**
   * Polling cadence in milliseconds for real-time video frame inspection.
   * Default: 500ms (evaluates ~2 frames per second to minimize CPU usage while maintaining responsive tracking).
   */
  DETECTION_INTERVAL_MS: 500,

  /**
   * Minimum consecutive negative detection frames (~1000ms at 500ms intervals)
   * required before initializing the face absence countdown.
   * 
   * Tolerates brief detection failures caused by natural blinking, momentary head turns,
   * normal facial movements, or minor lighting variations without triggering false alarms.
   */
  WARNING_CONSECUTIVE_TICKS: 2,

  /**
   * Grace period in milliseconds before continuous absence is considered a security warning event.
   * Default: 1000ms (~1 second).
   */
  WARNING_GRACE_PERIOD_MS: 1000,

  /**
   * Termination threshold in milliseconds of continuous face absence.
   * Default: 30000ms (30 continuous seconds of absence).
   * Conservative default ensures transient interruptions do not terminate an interview.
   */
  TERMINATION_THRESHOLD_MS: 30000,

  /**
   * Total countdown seconds displayed in the warning banner.
   */
  TERMINATION_COUNTDOWN_SECONDS: 30,

  /**
   * Maximum number of security log entries retained in session state to prevent memory growth.
   */
  MAX_SECURITY_EVENTS: 50
};
