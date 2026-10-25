import React from 'react';
import RobotAvatar from './RobotAvatar';

/**
 * TalentTrail AI — AvatarInterviewer Adapter
 * Wraps the animated RobotAvatar component for Ismav,
 * ensuring backwards compatibility while providing the exact requested animations.
 */
export default function AvatarInterviewer({
  state = 'idle',
  size = 260,
  name = "Ismav",
  role = "Senior AI Interviewer",
  language = "en-US",
  headGesture,
  handGesture,
  isSpeaking,
  showVisualizer = true
}) {
  return (
    <RobotAvatar
      state={state}
      size={size}
      name={name}
      role={role}
      language={language}
      headGesture={headGesture}
      handGesture={handGesture}
      isSpeaking={isSpeaking}
      showVisualizer={showVisualizer}
    />
  );
}

export { RobotAvatar };
