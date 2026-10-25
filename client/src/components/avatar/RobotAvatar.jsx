import React, { useState, useEffect, useId } from 'react';
import { Volume2, Sparkles, Mic, CheckCircle2, Shield } from 'lucide-react';

/**
 * TalentTrail AI — Ismav: Virtual AI Interviewer Robot Avatar
 *
 * Integrated exact SVG robot geometry, kinematics, and animations:
 * - White metallic helmet & aerospace teal/lavender armor
 * - Thruster flame (pulseThruster) & floating energy rings (energyRingDrift)
 * - Natural blinking eyes & interactive cursor tracking
 * - Animated lipsync mouth while Ismav speaks
 * - Head gestures: nod, shake, tilt, look left, look right
 * - Hand gestures: wave, explain, thumbsUp, welcome
 * - Visual states: idle, speaking, listening, thinking, approved, completed
 * - Audio wave equalizer synchronized with real TTS activity
 * - Respects prefers-reduced-motion
 */
export default function RobotAvatar({
  state = 'idle', // 'idle' | 'speaking' | 'listening' | 'thinking' | 'approved' | 'completed' | 'acknowledging'
  headGesture: propHeadGesture,
  handGesture: propHandGesture,
  isSpeaking: propIsSpeaking,
  size = 280,
  name = "Ismav",
  role = "Senior AI Interviewer",
  language = "en-US",
  showVisualizer = true,
  showTelemetry = false
}) {
  const uniqueId = useId().replace(/:/g, '_');
  const isSpeaking = propIsSpeaking !== undefined ? propIsSpeaking : (state === 'speaking');

  // Automatic gestures derived from real interview states if not manually overridden
  let headGesture = propHeadGesture || 'idle';
  let handGesture = propHandGesture || 'idle';

  if (!propHeadGesture) {
    if (state === 'acknowledging' || state === 'approved') {
      headGesture = 'nod';
    } else if (state === 'thinking') {
      headGesture = 'tilt';
    } else {
      headGesture = 'idle';
    }
  }

  if (!propHandGesture) {
    if (state === 'approved') {
      handGesture = 'thumbsUp';
    } else if (state === 'speaking') {
      handGesture = 'explain';
    } else if (state === 'completed') {
      handGesture = 'welcome';
    } else {
      handGesture = 'idle';
    }
  }

  // Blinking effect
  const [isBlinking, setIsBlinking] = useState(false);
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 160);
    }, 3800);
    return () => clearInterval(blinkInterval);
  }, []);

  // Pupil / Eye tracking based on cursor movement
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  useEffect(() => {
    const handleMouseMove = (e) => {
      const { innerWidth, innerHeight } = window;
      const x = Math.max(-3, Math.min(3, ((e.clientX / innerWidth) - 0.5) * 6));
      const y = Math.max(-2, Math.min(2, ((e.clientY / innerHeight) - 0.5) * 4));
      setMousePos({ x, y });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const isApproved = state === 'approved' || state === 'completed';
  const isThinking = state === 'thinking';
  const isListening = state === 'listening';

  return (
    <div 
      className="robot-avatar-wrapper"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative',
        userSelect: 'none',
        width: `${size}px`
      }}
    >
      {/* Top Indicators: Audio Activity Visualizer & Telemetry */}
      {showVisualizer && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          padding: '0 0.5rem',
          marginBottom: '0.35rem',
          fontSize: '0.72rem',
          flexWrap: 'wrap',
          gap: '0.35rem'
        }}>
          {/* Status Badge */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '0.2rem 0.55rem',
            borderRadius: '9999px',
            backgroundColor: isSpeaking ? 'rgba(16, 185, 129, 0.12)' : isListening ? 'rgba(14, 165, 233, 0.12)' : isThinking ? 'rgba(245, 158, 11, 0.12)' : 'var(--lavender-100, #F3E8FF)',
            border: `1px solid ${isSpeaking ? '#10B981' : isListening ? '#0284C7' : isThinking ? '#F59E0B' : 'var(--lavender-300, #D8B4FE)'}`,
            color: isSpeaking ? '#047857' : isListening ? '#0369A1' : isThinking ? '#B45309' : 'var(--lavender-900, #581C87)',
            fontWeight: 600
          }}>
            <span style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: isSpeaking ? '#10B981' : isListening ? '#0284C7' : isThinking ? '#F59E0B' : 'var(--lavender-500, #8B5CF6)'
            }} />
            <span style={{ textTransform: 'capitalize' }}>
              {isSpeaking ? 'Speaking' : isListening ? 'Listening' : isThinking ? 'Thinking' : isApproved ? 'Affirming' : 'Ready'}
            </span>
          </div>

          {/* Audio Wave Visualizer */}
          <div 
            title={isSpeaking ? "Ismav audio stream active" : "Audio idle"}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem',
              backgroundColor: 'var(--bg-surface, #FFFFFF)',
              border: '1px solid var(--border-subtle, #E2E8F0)',
              padding: '0.2rem 0.55rem',
              borderRadius: 'var(--radius-md, 8px)',
              boxShadow: 'var(--shadow-sm, 0 1px 2px rgba(0,0,0,0.05))'
            }}
          >
            <Volume2 size={13} color={isSpeaking ? '#0D9488' : '#94A3B8'} />
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: '14px', width: '38px' }}>
              {[0.4, 0.9, 0.6, 1.0, 0.5, 0.8].map((h, i) => (
                <span
                  key={i}
                  style={{
                    width: '3.5px',
                    borderRadius: '2px',
                    backgroundColor: isSpeaking ? '#0D9488' : '#CBD5E1',
                    height: isSpeaking ? `${Math.round(h * 100)}%` : '25%',
                    transition: 'height 0.15s ease'
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Robot SVG Stage */}
      <div 
        style={{
          position: 'relative',
          width: `${size}px`,
          height: `${Math.round(size * 1.15)}px`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <svg
          viewBox="0 0 320 400"
          className="robot-svg"
          style={{
            width: '100%',
            height: '100%',
            filter: 'drop-shadow(0 14px 28px rgba(13, 148, 136, 0.22))',
            transition: 'transform 0.45s ease',
            transform: isThinking ? 'rotate(-3deg)' : 'none',
            animation: (state === 'idle' || state === 'listening') ? 'ismavFloatBob 4s ease-in-out infinite' : 'none'
          }}
        >
          <defs>
            {/* White Metallic Helmet & Shell Gradient */}
            <linearGradient id={`${uniqueId}_bodyWhiteGrad`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="45%" stopColor="#F8FAFC" />
              <stop offset="100%" stopColor="#CBD5E1" />
            </linearGradient>

            {/* Teal/Lavender Armor Gradient */}
            <linearGradient id={`${uniqueId}_tealArmorGrad`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#0D9488" />
              <stop offset="40%" stopColor="#0F766E" />
              <stop offset="100%" stopColor="#042F2E" />
            </linearGradient>

            {/* Dark Visor High-Tech Faceplate */}
            <linearGradient id={`${uniqueId}_darkFaceVisor`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#022C2A" />
              <stop offset="50%" stopColor="#042F2E" />
              <stop offset="100%" stopColor="#011B19" />
            </linearGradient>

            {/* Jet Thruster Plasma Beam */}
            <linearGradient id={`${uniqueId}_jetThrusterBeam`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#5EEAD4" stopOpacity="0.95" />
              <stop offset="45%" stopColor="#14B8A6" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#0F766E" stopOpacity="0" />
            </linearGradient>

            {/* Neon Glow Filter */}
            <filter id={`${uniqueId}_neonGlow`} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Keyframe Styles */}
          <style>{`
            @keyframes ismavFloatBob {
              0%, 100% { transform: translateY(0px); }
              50% { transform: translateY(-9px); }
            }
            @keyframes ismavPulseThruster {
              0%, 100% { transform: scaleY(1) scaleX(1); opacity: 0.9; }
              50% { transform: scaleY(1.22) scaleX(0.92); opacity: 1; }
            }
            @keyframes ismavEnergyRingDrift {
              0% { transform: translateY(0px) scale(0.9); opacity: 0.7; }
              100% { transform: translateY(22px) scale(1.15); opacity: 0.05; }
            }
            @keyframes ismavMouthSpeech {
              0%, 100% { transform: scaleY(0.4); }
              50% { transform: scaleY(1.4); }
            }
            @keyframes ismavArmWave {
              0%, 100% { transform: rotate(-25deg); }
              50% { transform: rotate(18deg); }
            }
            @keyframes ismavArmExplain {
              0%, 100% { transform: rotate(10deg); }
              50% { transform: rotate(-12deg); }
            }
            @keyframes ismavHeadNod {
              0%, 100% { transform: translateY(0) rotate(0deg); }
              40% { transform: translateY(8px) rotate(2deg); }
            }
            @keyframes ismavHeadShake {
              0%, 100% { transform: translateX(0) rotate(0deg); }
              25% { transform: translateX(-6px) rotate(-3deg); }
              75% { transform: translateX(6px) rotate(3deg); }
            }
            .ismav-head-group {
              transform-origin: 160px 170px;
              transition: transform 0.35s ease;
            }
            .head-nod { animation: ismavHeadNod 0.8s ease-in-out infinite; }
            .head-shake { animation: ismavHeadShake 0.6s ease-in-out infinite; }
            .head-tilt { transform: rotate(-8deg) translateY(-2px); }
            .head-look-left { transform: rotate(-6deg) translateX(-4px); }
            .head-look-right { transform: rotate(6deg) translateX(4px); }
            .arm-left-group, .arm-right-group {
              transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
            }
            @media (prefers-reduced-motion: reduce) {
              .robot-svg, .jet-exhaust-group path, .jet-exhaust-group ellipse, .ismav-head-group {
                animation: none !important;
                transition: none !important;
              }
            }
          `}</style>

          {/* 1. THRUSTER FLAME & ENERGY RINGS */}
          <g className="jet-exhaust-group" transform="translate(160, 310)">
            {/* Plasma Jet Exhaust */}
            <path
              d="M -15,0 Q 0,85 0,85 Q 0,85 15,0 Z"
              fill={`url(#${uniqueId}_jetThrusterBeam)`}
              style={{
                transformOrigin: '0px 0px',
                animation: 'ismavPulseThruster 0.45s ease-in-out infinite alternate'
              }}
            />

            {/* Floating Energy Rings Under Exhaust */}
            <ellipse cx="0" cy="40" rx="26" ry="6" fill="none" stroke="#2DD4BF" strokeWidth="1.5" style={{ animation: 'ismavEnergyRingDrift 1.6s ease-out infinite' }} />
            <ellipse cx="0" cy="62" rx="22" ry="5" fill="none" stroke="#14B8A6" strokeWidth="1.2" style={{ animation: 'ismavEnergyRingDrift 1.6s ease-out infinite 0.5s' }} />
            <ellipse cx="0" cy="84" rx="18" ry="4" fill="none" stroke="#0D9488" strokeWidth="1.0" style={{ animation: 'ismavEnergyRingDrift 1.6s ease-out infinite 1.0s' }} />
          </g>

          {/* 2. ROBOT BODY & TORSO */}
          <g id="robot-torso">
            {/* Jet Ring Mount */}
            <ellipse cx="160" cy="308" rx="22" ry="8" fill="#1E293B" stroke="#38BDF8" strokeWidth="1" />
            <path d="M 144,308 L 176,308 L 171,320 L 149,320 Z" fill="#0F172A" />

            {/* Torso Shell */}
            <path
              d="M 112,210 C 112,185 208,185 208,210 C 208,255 186,304 160,305 C 134,304 112,255 112,210 Z"
              fill={`url(#${uniqueId}_tealArmorGrad)`}
              stroke="#2DD4BF"
              strokeWidth="1.8"
            />

            {/* White Chest Belt/Plate Banner */}
            <path
              d="M 116,218 C 130,223 190,223 204,218 L 201,234 C 185,238 135,238 119,234 Z"
              fill={`url(#${uniqueId}_bodyWhiteGrad)`}
              stroke="#94A3B8"
              strokeWidth="0.8"
            />

            {/* Center Chest Medallion / Core Gauge */}
            <circle cx="160" cy="226" r="16" fill={`url(#${uniqueId}_bodyWhiteGrad)`} stroke="#38BDF8" strokeWidth="1.2" />
            <circle cx="160" cy="226" r="11" fill="#0D9488" />

            {/* Mini Bot Core Icon in Chest */}
            <ellipse cx="160" cy="226" rx="7" ry="5.5" fill="#F8FAFC" />
            <circle cx="157" cy="225" r="1.3" fill="#042F2E" />
            <circle cx="163" cy="225" r="1.3" fill="#042F2E" />
            <path d="M 158.5,228 Q 160,230 161.5,228" stroke="#042F2E" strokeWidth="0.8" fill="none" strokeLinecap="round" />
          </g>

          {/* 3. ARTICULATED ARMS & HANDS */}

          {/* LEFT ARM */}
          <g
            className="arm-left-group"
            style={{
              transformOrigin: '120px 200px',
              transform: handGesture === 'wave'
                ? 'rotate(-10deg)'
                : handGesture === 'explain'
                ? 'rotate(-14deg)'
                : handGesture === 'welcome'
                ? 'rotate(-28deg) translateY(-8px)'
                : 'rotate(0deg)'
            }}
          >
            {/* Left Shoulder Joint */}
            <circle cx="120" cy="202" r="11" fill={`url(#${uniqueId}_bodyWhiteGrad)`} stroke="#64748B" strokeWidth="1" />
            {/* Left Arm Segment */}
            <path d="M 116,206 Q 106,242 101,262" stroke={`url(#${uniqueId}_bodyWhiteGrad)`} strokeWidth="14" strokeLinecap="round" />
            {/* Left Wrist Band */}
            <ellipse cx="100" cy="264" rx="7" ry="4" fill="#0D9488" stroke="#5EEAD4" strokeWidth="1" />
            {/* Left Hand Glove */}
            <path d="M 96,267 C 92,274 92,284 99,285 C 104,285 106,276 106,269 Z" fill="#2DD4BF" stroke="#0F766E" strokeWidth="1" />
          </g>

          {/* RIGHT ARM */}
          <g
            className="arm-right-group"
            style={{
              transformOrigin: '200px 200px',
              transform: handGesture === 'wave'
                ? 'rotate(-65deg) translateY(-14px)'
                : handGesture === 'thumbsUp'
                ? 'rotate(-48deg) translateX(-4px) translateY(-12px)'
                : handGesture === 'explain'
                ? 'rotate(24deg) translateY(-6px)'
                : handGesture === 'welcome'
                ? 'rotate(28deg) translateY(-8px)'
                : 'rotate(0deg)',
              animation: handGesture === 'wave' ? 'ismavArmWave 0.6s ease-in-out infinite' : handGesture === 'explain' ? 'ismavArmExplain 1s ease-in-out infinite alternate' : 'none'
            }}
          >
            {/* Right Shoulder Joint */}
            <circle cx="200" cy="202" r="11" fill={`url(#${uniqueId}_bodyWhiteGrad)`} stroke="#64748B" strokeWidth="1" />
            {/* Right Arm Segment */}
            <path d="M 204,206 Q 214,242 219,262" stroke={`url(#${uniqueId}_bodyWhiteGrad)`} strokeWidth="14" strokeLinecap="round" />
            {/* Right Wrist Band */}
            <ellipse cx="220" cy="264" rx="7" ry="4" fill="#0D9488" stroke="#5EEAD4" strokeWidth="1" />

            {/* Right Hand Glove with dynamic gesture postures */}
            {handGesture === 'thumbsUp' ? (
              <g transform="translate(216, 260) rotate(-30)">
                <rect x="0" y="0" width="12" height="14" rx="4" fill="#2DD4BF" stroke="#0F766E" strokeWidth="1" />
                <path d="M 4,0 L 4,-8 C 4,-11 8,-11 8,-8 L 8,0 Z" fill="#5EEAD4" stroke="#0F766E" strokeWidth="1" />
              </g>
            ) : (
              <path d="M 224,267 C 228,274 228,284 221,285 C 216,285 214,276 214,269 Z" fill="#2DD4BF" stroke="#0F766E" strokeWidth="1" />
            )}
          </g>

          {/* 4. ARTICULATED ROBOT HEAD & HELMET */}
          <g
            className={`ismav-head-group ${
              headGesture === 'nod' ? 'head-nod' :
              headGesture === 'shake' ? 'head-shake' :
              headGesture === 'tilt' ? 'head-tilt' :
              headGesture === 'lookLeft' ? 'head-look-left' :
              headGesture === 'lookRight' ? 'head-look-right' : ''
            }`}
          >
            {/* Top Spherical Antenna */}
            <ellipse cx="160" cy="38" rx="8" ry="7" fill={`url(#${uniqueId}_bodyWhiteGrad)`} stroke="#0D9488" strokeWidth="1.5" />
            <path d="M 160,45 L 160,56" stroke={`url(#${uniqueId}_bodyWhiteGrad)`} strokeWidth="4.5" strokeLinecap="round" />

            {/* Antenna Mini Glow Signal */}
            <circle cx="160" cy="38" r="3" fill="#2DD4BF" filter={`url(#${uniqueId}_neonGlow)`} />

            {/* Outer Helmet Head Shell */}
            <ellipse cx="160" cy="116" rx="78" ry="66" fill={`url(#${uniqueId}_bodyWhiteGrad)`} stroke="#0D9488" strokeWidth="2.5" />

            {/* Helmet Frontal Visor Bezel */}
            <ellipse cx="160" cy="120" rx="66" ry="53" fill="none" stroke="#0F766E" strokeWidth="5.5" />

            {/* Dark Visor Faceplate */}
            <ellipse cx="160" cy="120" rx="63" ry="50" fill={`url(#${uniqueId}_darkFaceVisor)`} />

            {/* Glass Gloss Visor Reflection Curve */}
            <path
              d="M 112,96 C 130,82 188,82 208,96 C 190,88 132,88 112,96 Z"
              fill="#FFFFFF"
              opacity="0.32"
            />

            {/* EYES CONTAINER (Blinking & Pupil Tracking) */}
            <g
              id="robot-eyes-group"
              transform={`translate(${mousePos.x}, ${mousePos.y})`}
              style={{ transition: 'transform 0.15s ease-out' }}
            >
              {isBlinking ? (
                <>
                  <line x1="124" y1="116" x2="146" y2="116" stroke="#5EEAD4" strokeWidth="3.5" strokeLinecap="round" />
                  <line x1="174" y1="116" x2="196" y2="116" stroke="#5EEAD4" strokeWidth="3.5" strokeLinecap="round" />
                </>
              ) : isApproved ? (
                // Happy Joyful Upward Arched Eyes (^ ^)
                <>
                  <path d="M 124,120 Q 135,104 146,120" stroke="#A7F3D0" strokeWidth="4.5" fill="none" strokeLinecap="round" filter={`url(#${uniqueId}_neonGlow)`} />
                  <path d="M 174,120 Q 185,104 196,120" stroke="#A7F3D0" strokeWidth="4.5" fill="none" strokeLinecap="round" filter={`url(#${uniqueId}_neonGlow)`} />
                </>
              ) : (
                // Glowing White/Teal Luminous Eyes
                <>
                  <ellipse cx="135" cy="116" rx="10" ry="15" fill="#F8FAFC" filter={`url(#${uniqueId}_neonGlow)`} />
                  <ellipse cx="137" cy="113" rx="3.5" ry="5" fill="#FFFFFF" />
                  <circle cx="133" cy="122" r="2" fill="#5EEAD4" />

                  <ellipse cx="185" cy="116" rx="10" ry="15" fill="#F8FAFC" filter={`url(#${uniqueId}_neonGlow)`} />
                  <ellipse cx="187" cy="113" rx="3.5" ry="5" fill="#FFFFFF" />
                  <circle cx="183" cy="122" r="2" fill="#5EEAD4" />
                </>
              )}
            </g>

            {/* MOUTH (Interactive Lip-Sync & Emotion States) */}
            <g id="robot-mouth-group">
              {isSpeaking ? (
                <ellipse
                  cx="160"
                  cy="144"
                  rx="9"
                  ry="8"
                  fill="#FFFFFF"
                  filter={`url(#${uniqueId}_neonGlow)`}
                  style={{
                    transformOrigin: '160px 144px',
                    animation: 'ismavMouthSpeech 0.22s ease-in-out infinite alternate'
                  }}
                />
              ) : isApproved ? (
                <path
                  d="M 148,138 Q 160,154 172,138 Z"
                  fill="#FFFFFF"
                  stroke="#5EEAD4"
                  strokeWidth="1.2"
                  filter={`url(#${uniqueId}_neonGlow)`}
                />
              ) : isThinking ? (
                <line x1="152" y1="145" x2="168" y2="143" stroke="#F8FAFC" strokeWidth="2.5" strokeLinecap="round" />
              ) : (
                <path
                  d="M 151,140 Q 160,150 169,140 Z"
                  fill="#FFFFFF"
                  filter={`url(#${uniqueId}_neonGlow)`}
                />
              )}
            </g>
          </g>
        </svg>
      </div>

      {/* Identity Label Under Robot */}
      <div style={{
        marginTop: '0.4rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.4rem',
        backgroundColor: 'var(--lavender-50, #FAF5FF)',
        border: '1px solid var(--border-lavender, #E9D5FF)',
        borderRadius: '9999px',
        padding: '0.2rem 0.75rem',
        fontSize: '0.75rem',
        fontWeight: 600,
        color: 'var(--lavender-900, #581C87)',
        boxShadow: 'var(--shadow-sm, 0 1px 2px rgba(0,0,0,0.05))'
      }}>
        <Sparkles size={13} color="var(--lavender-600, #9333EA)" />
        <span>{name} • {role}</span>
      </div>
    </div>
  );
}
