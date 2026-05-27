import React, { Suspense, useCallback, useEffect, useRef, useState, useMemo } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import { TextureLoader, MathUtils, Mesh, Group, Texture, PointLight, AdditiveBlending } from 'three';

// @ts-ignore
import cityBokehUrl from '../../assets/city_bokeh.jpg';
// @ts-ignore
import beachSunsetUrl from '../../assets/beach_sunset.jpg';

import { tracks, type Track } from '../../constants/tracks';
import { usePlayerStore } from '../../store/playerStore';
import { useThemeStore } from '../../store/themeStore';

type TurntableDeckProps = {
  dockingTrack: Track | null;
  onDockComplete: (track: Track) => void;
  onVinylTap: () => void;
};

const TARGET_SPEED = 2.0; // rad/sec (~20 RPM)
const ROOM_FLOOR_Y = -2.55;
const TABLE_LEG_HEIGHT = 2.6;
const TABLE_SURFACE_LOCAL_Y = 1.35;
const TURNTABLE_CHASSIS_HALF_HEIGHT = 0.25;
const TURNTABLE_SCALE_MODIFIER = 0.85;

function getTableBaseY(scale: number) {
  return ROOM_FLOOR_Y + (TABLE_LEG_HEIGHT / 2) * scale;
}

function getTurntableBaseY(scale: number) {
  return getTableBaseY(scale) + (TABLE_SURFACE_LOCAL_Y * scale) + (TURNTABLE_CHASSIS_HALF_HEIGHT * scale * TURNTABLE_SCALE_MODIFIER);
}

// ═══════════════════════════════════════════════════════════════
// 3D SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════

function VinylLabel({ track }: { track: Track }) {
  const texture = useLoader(TextureLoader, track.artwork) as Texture;
  return (
    <meshStandardMaterial map={texture} roughness={0.15} metalness={0.1} />
  );
}

function VinylMesh({ track, isPlaying, isEjecting }: { track: Track | null; isPlaying: boolean; isEjecting: boolean }) {
  const meshRef = useRef<Mesh>(null);
  const velocity = useRef(0);
  const ejectProgress = useRef(0);
  const environmentTheme = useThemeStore(state => state.environmentTheme);

  const metalness = environmentTheme === 'warm_vibe' ? 0.95 : 0.8;
  const roughness = environmentTheme === 'warm_vibe' ? 0.08 : 0.15;

  // Reset eject progress when ejecting starts
  useEffect(() => {
    if (isEjecting) {
      ejectProgress.current = 0;
    }
  }, [isEjecting]);

  useFrame((_, delta) => {
    if (!meshRef.current) return;

    // Rotation physics
    if (isPlaying && !isEjecting) {
      velocity.current = MathUtils.lerp(velocity.current, TARGET_SPEED, delta * 2);
    } else {
      velocity.current = MathUtils.lerp(velocity.current, 0, delta * 3);
    }
    meshRef.current.rotation.y -= velocity.current * delta;

    // Eject animation: slide horizontally from platter surface, slight upward lift then fade
    if (isEjecting) {
      ejectProgress.current = MathUtils.clamp(ejectProgress.current + delta * 2.5, 0, 1);
      const ease = 1 - Math.pow(1 - ejectProgress.current, 2);
      // Slide right from platter center, stay at platter height (0.35)
      meshRef.current.position.x = MathUtils.lerp(0, 8, ease);
      meshRef.current.position.y = 0.35 + MathUtils.lerp(0, 1.5, ease); // lift slightly up and out
      meshRef.current.position.z = MathUtils.lerp(0, 3, ease); // drift forward
      // Scale down as it leaves
      const s = MathUtils.lerp(1, 0.3, ease);
      meshRef.current.scale.set(s, s, s);
    } else {
      // Resting position on platter
      meshRef.current.position.set(0, 0.35, 0);
      meshRef.current.scale.set(1, 1, 1);
    }
  });

  if (!track) return null;

  return (
    <mesh ref={meshRef} position={[0, 0.35, 0]} castShadow>
      <cylinderGeometry args={[1.5, 1.5, 0.04, 64]} />
      <meshStandardMaterial attach="material-0" color="#111114" metalness={metalness} roughness={roughness} />
      <meshStandardMaterial attach="material-1" color="#111114" metalness={metalness} roughness={roughness} />
      <meshStandardMaterial attach="material-2" color="#111114" metalness={metalness} roughness={roughness} />

      {/* Center Label */}
      <mesh position={[0, 0.021, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.45, 64]} />
        {track.artwork ? (
          <Suspense fallback={<meshStandardMaterial color="#111114" metalness={metalness} roughness={roughness} />}>
            <VinylLabel track={track} />
          </Suspense>
        ) : (
          <meshStandardMaterial color="#111114" metalness={metalness} roughness={roughness} />
        )}
      </mesh>

      {/* Groove rings */}
      <mesh position={[0, 0.021, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.45, 1.45, 64]} />
        <meshStandardMaterial color="#000000" opacity={0.35} transparent metalness={0.9} roughness={0.6} />
      </mesh>
    </mesh>
  );
}

function TonearmMesh({ isPlaying }: { isPlaying: boolean }) {
  const groupRef = useRef<Group>(null);
  const armRef = useRef<Group>(null);
  const currentAngle = useRef(-0.6);

  useFrame((_, delta) => {
    if (!groupRef.current || !armRef.current) return;

    // Horizontal swing
    const targetAngle = isPlaying ? 0.2 : -0.6;
    currentAngle.current = MathUtils.lerp(currentAngle.current, targetAngle, delta * 3);
    groupRef.current.rotation.y = currentAngle.current;

    // Vertical lift arc (parabola)
    // Progress is 0 at rest (-0.6) and 1 at play (0.2)
    const progress = (currentAngle.current + 0.6) / 0.8;
    // Math.sin(progress * Math.PI) creates a perfect arc: 0 -> 1 -> 0
    const liftAngle = Math.sin(progress * Math.PI) * -0.15; // Negative Z lifts the arm up
    armRef.current.rotation.z = liftAngle;
  });

  return (
    <group ref={groupRef} position={[1.6, 0.35, -1.2]}>
      {/* Pivot base */}
      <mesh position={[0, -0.05, 0]} castShadow>
        <cylinderGeometry args={[0.15, 0.2, 0.2, 32]} />
        <meshStandardMaterial color="#222" metalness={0.9} roughness={0.2} />
      </mesh>
      {/* Pivot joint sphere */}
      <mesh position={[0, 0.1, 0]}>
        <sphereGeometry args={[0.12, 32, 32]} />
        <meshStandardMaterial color="#444" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* The Arm extending from pivot (rotated 45deg to face the platter) */}
      <group position={[0, 0.1, 0]} rotation={[0, Math.PI / 4, 0]}>
        <group ref={armRef}>
          {/* Arm bar (aligned along -X axis locally for clean Z-axis pivoting) */}
          <mesh position={[-1.0, 0, 0]} castShadow>
            <boxGeometry args={[2.0, 0.04, 0.04]} />
            <meshStandardMaterial color="#666" metalness={1.0} roughness={0.2} />
          </mesh>
          {/* Stylus head */}
          <mesh position={[-2.0, -0.04, 0]}>
            <boxGeometry args={[0.25, 0.08, 0.12]} />
            <meshStandardMaterial color="#111" metalness={0.5} roughness={0.5} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

function DustLid() {
  const hingeRef = useRef<Group>(null);
  const lidAngle = useRef(0);

  useFrame((_, delta) => {
    if (!hingeRef.current) return;
    // Animate open on mount: from 0 (closed) to -Math.PI / 2.2 (open)
    const target = -Math.PI / 2.2;
    lidAngle.current = MathUtils.lerp(lidAngle.current, target, delta * 1.5);
    hingeRef.current.rotation.x = lidAngle.current;
  });

  return (
    // Hinge anchored at the back-top edge of the chassis
    <group ref={hingeRef} position={[0, 0.3, -1.4]}>
      {/* Lid is offset forward so it pivots from the back edge */}
      <mesh position={[0, 0, 1.4]} castShadow>
        <boxGeometry args={[3.6, 0.04, 2.8]} />
        <meshStandardMaterial
          color="#a8d8ea"
          transparent
          opacity={0.18}
          roughness={0.05}
          metalness={0.1}
        />
      </mesh>
      {/* Side walls of the lid */}
      <mesh position={[-1.78, -0.25, 1.4]}>
        <boxGeometry args={[0.04, 0.5, 2.8]} />
        <meshStandardMaterial color="#a8d8ea" transparent opacity={0.12} roughness={0.05} metalness={0.1} />
      </mesh>
      <mesh position={[1.78, -0.25, 1.4]}>
        <boxGeometry args={[0.04, 0.5, 2.8]} />
        <meshStandardMaterial color="#a8d8ea" transparent opacity={0.12} roughness={0.05} metalness={0.1} />
      </mesh>
      {/* Front face */}
      <mesh position={[0, -0.25, 2.78]}>
        <boxGeometry args={[3.6, 0.5, 0.04]} />
        <meshStandardMaterial color="#a8d8ea" transparent opacity={0.12} roughness={0.05} metalness={0.1} />
      </mesh>
    </group>
  );
}

function FlyingVinylMesh({ track, onLanded, scale = 1 }: { track: Track; onLanded: () => void; scale?: number }) {
  const meshRef = useRef<Mesh>(null);
  const progress = useRef(0);
  const hasLanded = useRef(false);
  const environmentTheme = useThemeStore(state => state.environmentTheme);

  const metalness = environmentTheme === 'warm_vibe' ? 0.95 : 0.8;
  const roughness = environmentTheme === 'warm_vibe' ? 0.08 : 0.15;

  useFrame((_, delta) => {
    if (!meshRef.current || hasLanded.current) return;

    progress.current = MathUtils.clamp(progress.current + delta * 1.8, 0, 1);
    const easeOut = 1 - Math.pow(1 - progress.current, 3);

    // Fly from above-and-forward down to the platter surface height
    meshRef.current.position.x = MathUtils.lerp(3 * scale, 0, easeOut);
    meshRef.current.position.y = MathUtils.lerp(6, getTurntableBaseY(scale) + 0.35 * scale * TURNTABLE_SCALE_MODIFIER, easeOut);
    meshRef.current.position.z = MathUtils.lerp(5 * scale, 0, easeOut);

    // Scale up smoothly
    const s = MathUtils.lerp(0.4 * scale, scale * TURNTABLE_SCALE_MODIFIER, easeOut);
    meshRef.current.scale.set(s, s, s);

    // Opacity fade in (first 40% of progress)
    const opacity = MathUtils.clamp(progress.current / 0.4, 0, 1);
    meshRef.current.visible = opacity > 0.01;

    if (progress.current >= 1 && !hasLanded.current) {
      hasLanded.current = true;
      onLanded();
    }
  });

  return (
    <mesh ref={meshRef} position={[3, 6, 5]} scale={[0.4, 0.4, 0.4]} castShadow renderOrder={10}>
      <cylinderGeometry args={[1.5, 1.5, 0.04, 64]} />
      <meshStandardMaterial attach="material-0" color="#111114" metalness={metalness} roughness={roughness} depthTest={true} />
      <meshStandardMaterial attach="material-1" color="#111114" metalness={metalness} roughness={roughness} depthTest={true} />
      <meshStandardMaterial attach="material-2" color="#111114" metalness={metalness} roughness={roughness} depthTest={true} />

      {/* Center Label */}
      <mesh position={[0, 0.021, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.45, 64]} />
        <Suspense fallback={<meshStandardMaterial color="#111114" metalness={metalness} roughness={roughness} />}>
          <VinylLabel track={track} />
        </Suspense>
      </mesh>
    </mesh>
  );
}

// ═══════════════════════════════════════════════════════════════
// BEDROOM ENVIRONMENT
// ═══════════════════════════════════════════════════════════════

function DJTable({ scale = 1 }: { scale?: number }) {
  const legRadius = 0.08;
  const legHeight = 2.6;
  const tableW = 5;
  const tableD = 3;

  return (
    <group position={[0, getTableBaseY(scale), 0]} scale={[scale, scale, scale]}>
      {/* Tabletop */}
      <mesh position={[0, legHeight / 2 + 0.05, 0]} receiveShadow castShadow>
        <boxGeometry args={[tableW, 0.1, tableD]} />
        <meshStandardMaterial color="#22150f" metalness={0.22} roughness={0.28} />
      </mesh>
      {/* Four legs */}
      {[
        [-(tableW / 2 - 0.15), 0, -(tableD / 2 - 0.15)],
        [(tableW / 2 - 0.15), 0, -(tableD / 2 - 0.15)],
        [-(tableW / 2 - 0.15), 0, (tableD / 2 - 0.15)],
        [(tableW / 2 - 0.15), 0, (tableD / 2 - 0.15)],
      ].map((pos, i) => (
        <mesh key={i} position={pos as [number, number, number]} castShadow>
          <cylinderGeometry args={[legRadius, legRadius, legHeight, 12]} />
          <meshStandardMaterial color="#1a120b" metalness={0.1} roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

function BedroomWalls() {
  return (
    <group>
      {/* Back Wall - left pane */}
      <mesh position={[-6.5, 2, -6]} receiveShadow>
        <boxGeometry args={[5, 10, 0.15]} />
        <meshStandardMaterial color="#181822" metalness={0.1} roughness={0.85} />
      </mesh>
      {/* Back Wall - right pane */}
      <mesh position={[6.5, 2, -6]} receiveShadow>
        <boxGeometry args={[5, 10, 0.15]} />
        <meshStandardMaterial color="#181822" metalness={0.1} roughness={0.85} />
      </mesh>
      {/* Back Wall - top pane */}
      <mesh position={[0, 7.5, -6]} receiveShadow>
        <boxGeometry args={[8, 5, 0.15]} />
        <meshStandardMaterial color="#181822" metalness={0.1} roughness={0.85} />
      </mesh>
      {/* Back Wall - bottom pane */}
      <mesh position={[0, -1.5, -6]} receiveShadow>
        <boxGeometry args={[8, 3, 0.15]} />
        <meshStandardMaterial color="#181822" metalness={0.1} roughness={0.85} />
      </mesh>

      {/* Left wall */}
      <mesh position={[-9, 2, 4]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <boxGeometry args={[20, 10, 0.15]} />
        <meshStandardMaterial color="#181822" metalness={0.1} roughness={0.85} />
      </mesh>
      {/* Right wall */}
      <mesh position={[9, 2, 4]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <boxGeometry args={[20, 10, 0.15]} />
        <meshStandardMaterial color="#181822" metalness={0.1} roughness={0.85} />
      </mesh>
      {/* Floor */}
      <mesh position={[0, -2.55, 4]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[18, 20]} />
        <meshStandardMaterial color="#0b0b0e" metalness={0.4} roughness={0.3} />
      </mesh>
    </group>
  );
}

function CozyCouch({ scale = 1 }: { scale?: number }) {
  return (
    <group position={[-4.6, -2.6, -2.8]} rotation={[0, 0.22, 0]} scale={[scale, scale, scale]}>
      {/* Main low-poly couch base */}
      <mesh position={[0, 0.25, 0]} receiveShadow castShadow>
        <boxGeometry args={[3.2, 0.4, 1.2]} />
        <meshStandardMaterial color="#202631" metalness={0.02} roughness={0.88} />
      </mesh>

      {/* Plush seat cushions */}
      {[-1.05, 0, 1.05].map((x, i) => (
        <mesh key={`seat-${i}`} position={[x, 0.52, 0.08]} rotation={[0.03, 0, (i - 1) * 0.015]} receiveShadow castShadow>
          <boxGeometry args={[0.98, 0.18, 1.05]} />
          <meshStandardMaterial color={i === 1 ? '#2b3340' : '#262e3a'} metalness={0.01} roughness={0.95} />
        </mesh>
      ))}

      {/* Relaxed back cushions */}
      {[-1.05, 0, 1.05].map((x, i) => (
        <mesh key={`back-${i}`} position={[x, 0.92, -0.48]} rotation={[-0.18, 0, (i - 1) * 0.025]} receiveShadow castShadow>
          <boxGeometry args={[1.0, 0.86, 0.18]} />
          <meshStandardMaterial color={i === 1 ? '#303948' : '#28313f'} metalness={0.01} roughness={0.92} />
        </mesh>
      ))}

      {/* Armrests */}
      <mesh position={[-1.82, 0.65, 0.02]} receiveShadow castShadow>
        <boxGeometry args={[0.28, 0.75, 1.35]} />
        <meshStandardMaterial color="#1c222c" metalness={0.02} roughness={0.9} />
      </mesh>
      <mesh position={[1.82, 0.65, 0.02]} receiveShadow castShadow>
        <boxGeometry args={[0.28, 0.75, 1.35]} />
        <meshStandardMaterial color="#1c222c" metalness={0.02} roughness={0.9} />
      </mesh>

      {/* Small amber-catching throw pillows */}
      <mesh position={[-0.95, 0.78, 0.25]} rotation={[0.1, -0.2, 0.12]} receiveShadow castShadow>
        <boxGeometry args={[0.46, 0.38, 0.16]} />
        <meshStandardMaterial color="#38435a" metalness={0.01} roughness={0.86} />
      </mesh>
      <mesh position={[1.02, 0.77, 0.26]} rotation={[0.08, 0.22, -0.08]} receiveShadow castShadow>
        <boxGeometry args={[0.42, 0.34, 0.15]} />
        <meshStandardMaterial color="#2f2730" metalness={0.01} roughness={0.88} />
      </mesh>
    </group>
  );
}

function VinylCabinet({ position, rotation }: { position: [number, number, number]; rotation?: [number, number, number] }) {
  const spineColors = ['#e3d5c8', '#111111', '#c05621', '#4a5568', '#f6e0b5', '#2d3748'];

  const recordSleeves = useMemo(() => {
    const sleeves = [];
    // Cubby 1: Top Left
    for (let i = 0; i < 18; i++) {
      sleeves.push({
        pos: [-0.6 + i * 0.05, 1.35, 0.1 + (Math.random() - 0.5) * 0.05],
        rot: [0, (Math.random() - 0.5) * 0.1, (Math.random() - 0.5) * 0.05],
        color: spineColors[Math.floor(Math.random() * spineColors.length)]
      });
    }
    // Cubby 2: Bottom Right
    for (let i = 0; i < 15; i++) {
      sleeves.push({
        pos: [0.65 - i * 0.05, 0.45, 0.1 + (Math.random() - 0.5) * 0.05],
        rot: [0, (Math.random() - 0.5) * 0.1, (Math.random() - 0.5) * 0.05],
        color: spineColors[Math.floor(Math.random() * spineColors.length)]
      });
    }
    return sleeves;
  }, []);

  const peekingDiscs = useMemo(() => {
    const discs = [];
    // Cubby 3: Top Right
    for (let i = 0; i < 8; i++) {
      discs.push({
        pos: [0.65 - i * 0.06, 1.35, 0.2 + (Math.random() - 0.5) * 0.05],
        rot: [Math.PI / 2, 0, Math.PI / 2 + (Math.random() - 0.5) * 0.1],
      });
    }
    return discs;
  }, []);

  const T = 0.05; // thickness
  const W = 2.5;
  const H = 1.8;
  const D = 1.2;
  const H_half = H / 2;

  return (
    <group position={position} rotation={rotation || [0, 0, 0]}>
      {/* Outer Frame */}
      <mesh position={[0, H - T / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[W, T, D]} />
        <meshStandardMaterial color="#4a2e1b" roughness={0.6} metalness={0.1} />
      </mesh>
      <mesh position={[0, T / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[W, T, D]} />
        <meshStandardMaterial color="#4a2e1b" roughness={0.6} metalness={0.1} />
      </mesh>
      <mesh position={[-W / 2 + T / 2, H_half, 0]} castShadow receiveShadow>
        <boxGeometry args={[T, H - 2 * T, D]} />
        <meshStandardMaterial color="#4a2e1b" roughness={0.6} metalness={0.1} />
      </mesh>
      <mesh position={[W / 2 - T / 2, H_half, 0]} castShadow receiveShadow>
        <boxGeometry args={[T, H - 2 * T, D]} />
        <meshStandardMaterial color="#4a2e1b" roughness={0.6} metalness={0.1} />
      </mesh>
      <mesh position={[0, H_half, -D / 2 + T / 2]} castShadow receiveShadow>
        <boxGeometry args={[W - 2 * T, H - 2 * T, T]} />
        <meshStandardMaterial color="#3a2518" roughness={0.7} metalness={0.1} />
      </mesh>

      {/* Grid Dividers */}
      <mesh position={[0, H_half, 0]} castShadow receiveShadow>
        <boxGeometry args={[W - 2 * T, T, D - T]} />
        <meshStandardMaterial color="#4a2e1b" roughness={0.6} metalness={0.1} />
      </mesh>
      <mesh position={[0, H_half, 0]} castShadow receiveShadow>
        <boxGeometry args={[T, H - 2 * T, D - T]} />
        <meshStandardMaterial color="#4a2e1b" roughness={0.6} metalness={0.1} />
      </mesh>

      {/* Record Sleeves */}
      {recordSleeves.map((sleeve, i) => (
        <mesh key={`sleeve-${i}`} position={sleeve.pos as any} rotation={sleeve.rot as any} castShadow receiveShadow>
          <boxGeometry args={[0.04, 0.8, 0.8]} />
          <meshStandardMaterial color={sleeve.color} roughness={0.8} />
        </mesh>
      ))}

      {/* Peeking Vinyl Discs */}
      {peekingDiscs.map((disc, i) => (
        <mesh key={`disc-${i}`} position={disc.pos as any} rotation={disc.rot as any} castShadow receiveShadow>
          <cylinderGeometry args={[0.48, 0.48, 0.01, 32]} />
          <meshStandardMaterial color="#111" roughness={0.15} metalness={0.8} />
        </mesh>
      ))}
    </group>
  );
}

function WallPosters() {
  const posterTracks = useMemo(() => {
    const shuffledTracks = [...tracks].sort(() => Math.random() - 0.5);
    return shuffledTracks.slice(0, 3);
  }, []);
  const posterTextures = useLoader(TextureLoader, posterTracks.map(track => track.artwork)) as Texture[];

  return (
    <group>
      {/* Poster 1 — back wall, left side (shifted out of window) */}
      <mesh position={[-7.5, 3, -5.92]}>
        <planeGeometry args={[2.0, 2.0]} />
        <meshStandardMaterial color="#111116" metalness={0.1} roughness={0.85} />
      </mesh>
      <mesh position={[-7.5, 3, -5.9]}>
        <planeGeometry args={[1.8, 1.8]} />
        <meshStandardMaterial map={posterTextures[0]} color="#ffffff" emissive="#ffffff" emissiveMap={posterTextures[0]} emissiveIntensity={0.04} metalness={0.05} roughness={0.7} />
      </mesh>
      {/* Poster 2 — back wall, right side (shifted out of window) */}
      <mesh position={[7.35, 3.45, -5.92]}>
        <planeGeometry args={[1.85, 1.85]} />
        <meshStandardMaterial color="#111116" metalness={0.1} roughness={0.85} />
      </mesh>
      <mesh position={[7.35, 3.45, -5.9]}>
        <planeGeometry args={[1.65, 1.65]} />
        <meshStandardMaterial map={posterTextures[1]} color="#ffffff" emissive="#ffffff" emissiveMap={posterTextures[1]} emissiveIntensity={0.035} metalness={0.05} roughness={0.72} />
      </mesh>
      {/* Poster 3 — left wall */}
      <mesh position={[-8.92, 3, -3]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[1.68, 1.68]} />
        <meshStandardMaterial color="#111116" metalness={0.1} roughness={0.85} />
      </mesh>
      <mesh position={[-8.9, 3, -3]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[1.5, 1.5]} />
        <meshStandardMaterial map={posterTextures[2]} color="#ffffff" emissive="#ffffff" emissiveMap={posterTextures[2]} emissiveIntensity={0.035} metalness={0.05} roughness={0.72} />
      </mesh>
    </group>
  );
}

// ═══════════════════════════════════════════════════════════════
// NEW COMPONENTS: RAINY WINDOW & FURNITURE
// ═══════════════════════════════════════════════════════════════

function Lightning() {
  const lightRef = useRef<PointLight>(null);

  useFrame((state) => {
    if (!lightRef.current) return;
    const t = state.clock.elapsedTime;
    const noise = Math.sin(t * 10.0) * Math.sin(t * 23.0) * Math.sin(t * 41.0);
    if (noise > 0.95 && Math.random() > 0.5) {
      lightRef.current.intensity = 150 + Math.random() * 100;
    } else {
      lightRef.current.intensity = MathUtils.lerp(lightRef.current.intensity, 0, 0.1);
    }
  });

  return (
    <pointLight ref={lightRef} position={[0, 2, -2]} color="#d0e0ff" distance={30} decay={2} castShadow={false} />
  );
}

function RainyWindow() {
  const cityTexture = useLoader(TextureLoader, cityBokehUrl) as Texture;

  const uniformsRef = useRef({ uTime: { value: 0 } });

  useFrame((state) => {
    uniformsRef.current.uTime.value = state.clock.elapsedTime;
  });

  const onBeforeCompile = useCallback((shader: any) => {
    shader.uniforms.uTime = uniformsRef.current.uTime;
    shader.fragmentShader = `
      uniform float uTime;
      ${shader.fragmentShader}
    `;
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <normal_fragment_maps>',
      `
      #include <normal_fragment_maps>
      float rainTime = uTime * 1.65;
      vec2 rainUv = vUv;
      rainUv.y += rainTime;

      vec2 streakGrid = rainUv * vec2(34.0, 9.0);
      vec2 streakId = floor(streakGrid);
      vec2 streakCell = fract(streakGrid);
      float streakRandom = fract(sin(dot(streakId, vec2(12.9898, 78.233))) * 43758.5453);
      float streakMask = smoothstep(0.035, 0.0, abs(streakCell.x - 0.5 + (streakRandom - 0.5) * 0.24));
      float streakTail = smoothstep(1.0, 0.18, streakCell.y) * smoothstep(0.0, 0.22, streakCell.y);
      float streak = streakMask * streakTail * step(0.42, streakRandom);

      vec2 beadGrid = (vUv * vec2(24.0, 18.0)) + vec2(0.0, rainTime * 1.35);
      vec2 beadId = floor(beadGrid);
      vec2 beadCell = fract(beadGrid) - 0.5;
      float beadRandom = fract(sin(dot(beadId, vec2(41.17, 19.31))) * 24634.6345);
      float bead = smoothstep(0.22, 0.0, length(beadCell)) * step(0.62, beadRandom);

      vec2 rainNormal = normalize(vec2(streakCell.x - 0.5, -0.85)) * streak * 0.45;
      rainNormal += normalize(beadCell + 0.0001) * bead * 0.34;
      normal = normalize(normal + vec3(rainNormal.x, rainNormal.y, streak + bead * 0.3));
      `
    );
  }, []);

  return (
    <group position={[0, 2.5, -6]}>
      {/* The City Background - Resized to prevent overshooting */}
      <mesh position={[0, 0, -2]}>
        <planeGeometry args={[10, 6]} />
        <meshBasicMaterial map={cityTexture} color="#ffffff" />
      </mesh>

      <Lightning />

      {/* The Glass Pane */}
      <mesh position={[0, 0, 0]}>
        <planeGeometry args={[8, 5]} />
        <meshPhysicalMaterial
          transparent
          opacity={0.45}
          roughness={0.045}
          color="#c8e0e8"
          metalness={0.02}
          clearcoat={1}
          clearcoatRoughness={0.08}
          onBeforeCompile={onBeforeCompile}
        />
      </mesh>

      {/* Window Frame Crossbars */}
      <mesh position={[0, 0, 0.05]} castShadow>
        <boxGeometry args={[8, 0.1, 0.1]} />
        <meshStandardMaterial color="#111" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0, 0.05]} castShadow>
        <boxGeometry args={[0.1, 5, 0.1]} />
        <meshStandardMaterial color="#111" roughness={0.9} />
      </mesh>
      {/* Outer Frame */}
      <mesh position={[0, 2.5, 0.05]} castShadow>
        <boxGeometry args={[8.2, 0.2, 0.2]} />
        <meshStandardMaterial color="#111" roughness={0.9} />
      </mesh>
      <mesh position={[0, -2.5, 0.05]} castShadow>
        <boxGeometry args={[8.2, 0.2, 0.2]} />
        <meshStandardMaterial color="#111" roughness={0.9} />
      </mesh>
      <mesh position={[-4, 0, 0.05]} castShadow>
        <boxGeometry args={[0.2, 5, 0.2]} />
        <meshStandardMaterial color="#111" roughness={0.9} />
      </mesh>
      <mesh position={[4, 0, 0.05]} castShadow>
        <boxGeometry args={[0.2, 5, 0.2]} />
        <meshStandardMaterial color="#111" roughness={0.9} />
      </mesh>
    </group>
  );
}

function BeachWindow() {
  const beachTexture = useLoader(TextureLoader, beachSunsetUrl) as Texture;

  return (
    <group position={[0, 2.5, -6]}>
      {/* The Beach Background */}
      <mesh position={[0, -1.5, -5]}>
        <planeGeometry args={[36, 18]} />
        <meshBasicMaterial map={beachTexture} color="#ffffff" />
      </mesh>

      {/* The Glass Pane (massive unobstructed picture window) */}
      <mesh position={[0, 0, 0]}>
        <planeGeometry args={[8, 5]} />
        <meshPhysicalMaterial
          transparent
          opacity={0.45}
          roughness={0.045}
          color="#ffdab9"
          metalness={0.02}
          clearcoat={1}
          clearcoatRoughness={0.08}
        />
      </mesh>

      {/* Outer Frame */}
      <mesh position={[0, 2.5, 0.05]} castShadow>
        <boxGeometry args={[8.2, 0.2, 0.2]} />
        <meshStandardMaterial color="#8b5a2b" roughness={0.9} />
      </mesh>
      <mesh position={[0, -2.5, 0.05]} castShadow>
        <boxGeometry args={[8.2, 0.2, 0.2]} />
        <meshStandardMaterial color="#8b5a2b" roughness={0.9} />
      </mesh>
      <mesh position={[-4, 0, 0.05]} castShadow>
        <boxGeometry args={[0.2, 5, 0.2]} />
        <meshStandardMaterial color="#8b5a2b" roughness={0.9} />
      </mesh>
      <mesh position={[4, 0, 0.05]} castShadow>
        <boxGeometry args={[0.2, 5, 0.2]} />
        <meshStandardMaterial color="#8b5a2b" roughness={0.9} />
      </mesh>
    </group>
  );
}

function FurnitureDetails() {
  return (
    <group position={[8.75, 0, -2.35]} rotation={[0, -Math.PI / 2, 0]}>
      {/* Shelf */}
      <mesh position={[0, 1.5, 0]} receiveShadow castShadow>
        <boxGeometry args={[3, 0.1, 0.8]} />
        <meshStandardMaterial color="#2d1c11" metalness={0.1} roughness={0.8} />
      </mesh>
      {/* Some books/vinyls on shelf */}
      <mesh position={[-0.8, 1.75, 0]} rotation={[0, 0.1, 0.1]} castShadow>
        <boxGeometry args={[0.1, 0.5, 0.6]} />
        <meshStandardMaterial color="#4a2c2c" roughness={0.9} />
      </mesh>
      <mesh position={[-0.65, 1.75, 0]} rotation={[0, -0.05, 0]} castShadow>
        <boxGeometry args={[0.1, 0.5, 0.6]} />
        <meshStandardMaterial color="#2c3a4a" roughness={0.9} />
      </mesh>
      <mesh position={[-0.5, 1.75, 0]} rotation={[0, 0.05, -0.1]} castShadow>
        <boxGeometry args={[0.1, 0.5, 0.6]} />
        <meshStandardMaterial color="#3a4a2c" roughness={0.9} />
      </mesh>
      {/* Tiny potted plant */}
      <mesh position={[0.8, 1.65, 0]} castShadow>
        <cylinderGeometry args={[0.15, 0.1, 0.2, 12]} />
        <meshStandardMaterial color="#8b5a2b" roughness={0.9} />
      </mesh>
      <mesh position={[0.8, 1.9, 0]} castShadow>
        <sphereGeometry args={[0.25, 8, 8]} />
        <meshStandardMaterial color="#2d5a27" roughness={0.8} />
      </mesh>
    </group>
  );
}

function DeskLamp({ scale = 1, positionX = 2, positionZ = -1 }: { scale?: number, positionX?: number, positionZ?: number }) {
  return (
    <group position={[positionX * scale, getTableBaseY(scale) + (TABLE_SURFACE_LOCAL_Y + 0.025) * scale, positionZ * scale]} scale={[scale, scale, scale]}>
      {/* Base */}
      <mesh castShadow>
        <cylinderGeometry args={[0.3, 0.3, 0.05, 16]} />
        <meshStandardMaterial color="#111" roughness={0.8} />
      </mesh>
      {/* Stand */}
      <mesh position={[0, 0.4, 0]} castShadow>
        <cylinderGeometry args={[0.03, 0.03, 0.8, 8]} />
        <meshStandardMaterial color="#222" metalness={0.8} />
      </mesh>
      {/* Head */}
      <mesh position={[0, 0.8, 0.1]} rotation={[0.4, 0, 0]} castShadow>
        <coneGeometry args={[0.2, 0.3, 16, 1, true]} />
        <meshStandardMaterial color="#111" roughness={0.8} side={2} />
      </mesh>
      {/* Bulb */}
      <mesh position={[0, 0.75, 0.15]}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial emissive="#ffb13b" emissiveIntensity={10.5} color="#fff1cf" />
      </mesh>
      {/* Warm Point Light */}
      <pointLight position={[0, 0.7, 0.2]} intensity={6.2} color="#ffb13b" distance={14} decay={1.3} castShadow shadow-bias={-0.002} />
    </group>
  );
}

function LargeFloorLamp({ scale = 1 }: { scale?: number }) {
  return (
    <group position={[6.2 * scale, ROOM_FLOOR_Y + 0.025 * scale, 1.8 * scale]} scale={[scale, scale, scale]}>
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[0.45, 0.55, 0.05, 24]} />
        <meshStandardMaterial color="#111" roughness={0.72} metalness={0.25} />
      </mesh>
      <mesh position={[0, 1.35, 0]} castShadow>
        <cylinderGeometry args={[0.045, 0.06, 2.7, 12]} />
        <meshStandardMaterial color="#222" metalness={0.8} roughness={0.35} />
      </mesh>
      <mesh position={[0, 2.75, 0.04]} rotation={[0.18, 0, 0]} castShadow>
        <coneGeometry args={[0.42, 0.7, 24, 1, true]} />
        <meshStandardMaterial color="#111" roughness={0.8} side={2} />
      </mesh>
      <mesh position={[0, 2.55, 0.16]}>
        <sphereGeometry args={[0.13, 20, 20]} />
        <meshStandardMaterial emissive="#ffb13b" emissiveIntensity={10.5} color="#fff1cf" />
      </mesh>
      <pointLight position={[0, 2.5, 0.2]} intensity={6.2} color="#ffb13b" distance={14} decay={1.3} castShadow shadow-bias={-0.002} />
    </group>
  );
}

function DefaultRoom({ scale = 1 }: { scale?: number }) {
  return (
    <>
      <ambientLight intensity={0.1} color="#1a2536" />
      {/* ── Exterior Coolness (The Window Cast) ── */}
      <directionalLight
        position={[0, 4, -8]}
        intensity={1.8}
        color="#64b5f6"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-far={30}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
        shadow-bias={-0.001}
      />

      <DeskLamp scale={scale} positionX={2} positionZ={-1} />
      <DeskLamp scale={scale} positionX={-2} positionZ={-1} />
      <LargeFloorLamp scale={scale} />

      {/* ── Environment ── */}
      <BedroomWalls />
      <RainyWindow />
      <FurnitureDetails />
      <DJTable scale={scale} />
      <CozyCouch />
      <WallPosters />
      <VinylCabinet position={[-8, -2.55, 1.5]} rotation={[0, Math.PI / 2, 0]} />
    </>
  );
}

function WarmVibeRoom({ scale = 1 }: { scale?: number }) {
  return (
    <>
      <ambientLight intensity={0.1} color="#36251a" />
      <directionalLight
        position={[0, 4, -8]}
        intensity={2.2}
        color="#ff9100"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.001}
        shadow-camera-far={30}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />

      {/* Interior Structural Swap */}
      {/* Walls & Flooring */}
      <group>
        {/* Back Wall - left pane */}
        <mesh position={[-6.5, 5, -6]} receiveShadow>
          <boxGeometry args={[5, 16, 0.15]} />
          <meshStandardMaterial color="#f5f5dc" roughness={0.9} />
        </mesh>
        {/* Back Wall - right pane */}
        <mesh position={[6.5, 5, -6]} receiveShadow>
          <boxGeometry args={[5, 16, 0.15]} />
          <meshStandardMaterial color="#f5f5dc" roughness={0.9} />
        </mesh>
        {/* Back Wall - top pane */}
        <mesh position={[0, 9, -6]} receiveShadow>
          <boxGeometry args={[8, 8, 0.15]} />
          <meshStandardMaterial color="#f5f5dc" roughness={0.9} />
        </mesh>
        {/* Back Wall - bottom pane */}
        <mesh position={[0, -1.5, -6]} receiveShadow>
          <boxGeometry args={[8, 3, 0.15]} />
          <meshStandardMaterial color="#f5f5dc" roughness={0.9} />
        </mesh>

        {/* Left wall */}
        <mesh position={[-9, 5, 4]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
          <boxGeometry args={[20, 16, 0.15]} />
          <meshStandardMaterial color="#f5f5dc" roughness={0.9} />
        </mesh>
        {/* Right wall */}
        <mesh position={[9, 5, 4]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
          <boxGeometry args={[20, 16, 0.15]} />
          <meshStandardMaterial color="#f5f5dc" roughness={0.9} />
        </mesh>
        {/* Floor: oak wood plank texture */}
        <mesh position={[0, -2.55, 4]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[18, 20]} />
          <meshStandardMaterial color="#d2a679" metalness={0.1} roughness={0.6} />
        </mesh>
      </group>

      <BeachWindow />
      {/* Minimalist Modern Layout */}
      {/* Media Console */}
      <group position={[0, getTableBaseY(scale), 0]} scale={[scale, scale, scale]}>
        <mesh position={[0, 1.2, 0]} receiveShadow castShadow>
          <boxGeometry args={[6, 0.4, 2.5]} />
          <meshStandardMaterial color="#e6e6e6" roughness={0.2} metalness={0.1} />
        </mesh>
        {[-2.8, 2.8].map((x) => (
          <React.Fragment key={x}>
            <mesh position={[x, -0.175, -1.1]} castShadow>
              <cylinderGeometry args={[0.05, 0.02, 2.25, 16]} />
              <meshStandardMaterial color="#333" metalness={0.8} />
            </mesh>
            <mesh position={[x, -0.175, 1.1]} castShadow>
              <cylinderGeometry args={[0.05, 0.02, 2.25, 16]} />
              <meshStandardMaterial color="#333" metalness={0.8} />
            </mesh>
          </React.Fragment>
        ))}
      </group>

      {/* Studio Monitors */}
      <group position={[0, -2.55 + 1.8 * scale, 0]} scale={[scale, scale, scale]}>
        {[-3.8, 3.8].map((x, i) => (
          <group key={i} position={[x, 0.1, -0.5]} rotation={[0, x < 0 ? 0.3 : -0.3, 0]}>
            <mesh castShadow receiveShadow>
              <boxGeometry args={[1.2, 1.8, 1.2]} />
              <meshStandardMaterial color="#111" roughness={0.8} />
            </mesh>
            <mesh position={[0, -0.3, 0.61]}>
              <cylinderGeometry args={[0.4, 0.4, 0.05, 32]} />
              <meshStandardMaterial color="#f5f5dc" roughness={0.9} />
            </mesh>
            <mesh position={[0, 0.5, 0.61]}>
              <cylinderGeometry args={[0.15, 0.15, 0.05, 32]} />
              <meshStandardMaterial color="#333" roughness={0.5} />
            </mesh>
            <mesh position={[0, -1.4, 0]} castShadow>
              <cylinderGeometry args={[0.1, 0.1, 1.0, 16]} />
              <meshStandardMaterial color="#333" metalness={0.8} />
            </mesh>
            <mesh position={[0, -1.9, 0]} castShadow>
              <boxGeometry args={[0.8, 0.05, 0.8]} />
              <meshStandardMaterial color="#111" />
            </mesh>
          </group>
        ))}
      </group>

      {/* Modern Vinyl Shelves */}
      <group position={[6.5, -2.05, -2.5]} rotation={[0, -Math.PI / 8, 0]}>
        <mesh castShadow receiveShadow position={[0, 1, 0]}>
          <boxGeometry args={[2, 3, 1]} />
          <meshStandardMaterial color="#d2a679" roughness={0.6} />
        </mesh>
        <mesh position={[0, 1, 0.05]} castShadow>
          <boxGeometry args={[1.8, 0.05, 0.9]} />
          <meshStandardMaterial color="#333" />
        </mesh>
        <mesh position={[-0.5, 0.5, 0.1]} castShadow>
          <boxGeometry args={[0.8, 0.8, 0.6]} />
          <meshStandardMaterial color="#444" />
        </mesh>
      </group>

      {/* Modern Plants */}
      <group position={[5.5, -2.55, -1.0]}>
        <mesh castShadow receiveShadow position={[0, 0.5, 0]}>
          <cylinderGeometry args={[0.6, 0.4, 1, 32]} />
          <meshStandardMaterial color="#f0f0f0" roughness={0.2} />
        </mesh>
        <mesh position={[0, 1.5, 0]} castShadow>
          <cylinderGeometry args={[0.05, 0.05, 1, 8]} />
          <meshStandardMaterial color="#2e4b2a" />
        </mesh>
        {[0, 1, 2].map((i) => (
          <mesh key={i} position={[0, 1.4 + i * 0.2, 0]} rotation={[0.4, i * 2, 0.2]} castShadow>
            <planeGeometry args={[0.8, 1.2]} />
            <meshStandardMaterial color="#3a5f35" side={2} roughness={0.4} />
          </mesh>
        ))}
      </group>

      {/* Re-added Default Room Furniture */}
      <CozyCouch scale={1.2} />
      <FurnitureDetails />
      <WallPosters />
      <VinylCabinet position={[-8, -2.55, 1.5]} rotation={[0, Math.PI / 2, 0]} />
    </>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN SCENE COMPOSER
// ═══════════════════════════════════════════════════════════════

function TurntableScene({ dockedTrack, flyingTrack, isPlaying, isEjecting, onLanded, isMobile }: {
  dockedTrack: Track | null;
  flyingTrack: Track | null;
  isPlaying: boolean;
  isEjecting: boolean;
  onLanded: () => void;
  isMobile: boolean;
}) {
  const environmentTheme = useThemeStore(state => state.environmentTheme);
  const scale = isMobile ? 0.7 : 1.0;

  return (
    <>
      {/* ── Environment Reflection Map for Metals & Skybox ── */}
      {environmentTheme === 'warm_vibe' ? (
        <Environment preset="sunset" background={false} environmentIntensity={0.3} />
      ) : (
        <Environment preset="night" environmentIntensity={0.2} />
      )}

      {environmentTheme === 'warm_vibe' ? <WarmVibeRoom scale={scale} /> : <DefaultRoom scale={scale} />}

      {/* ── Turntable Unit (sits on the table) ── */}
      <group position={[0, getTurntableBaseY(scale), 0]} scale={[scale * TURNTABLE_SCALE_MODIFIER, scale * TURNTABLE_SCALE_MODIFIER, scale * TURNTABLE_SCALE_MODIFIER]}>
        {/* Volumetric Chassis Body */}
        <mesh position={[0, 0, 0]} receiveShadow castShadow>
          <boxGeometry args={[3.8, 0.5, 2.8]} />
          <meshStandardMaterial color="#1e1e24" metalness={0.18} roughness={0.48} />
        </mesh>

        {/* Chassis top veneer strip */}
        <mesh position={[0, 0.26, 0]}>
          <boxGeometry args={[3.7, 0.02, 2.7]} />
          <meshStandardMaterial color="#252530" metalness={0.28} roughness={0.34} />
        </mesh>

        {/* Raised platter mount (brushed aluminum tier) */}
        <mesh position={[0, 0.3, 0]} castShadow>
          <cylinderGeometry args={[1.65, 1.65, 0.06, 64]} />
          <meshStandardMaterial color="#555560" metalness={0.7} roughness={0.25} />
        </mesh>

        {/* Platter spindle */}
        <mesh position={[0, 0.4, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 0.15, 16]} />
          <meshStandardMaterial color="#888" metalness={1.0} roughness={0.1} />
        </mesh>

        {/* Vinyl + Tonearm */}
        <VinylMesh track={dockedTrack} isPlaying={isPlaying} isEjecting={isEjecting} />
        <TonearmMesh isPlaying={isPlaying} />

        {/* Hinged Dust Lid */}
        <DustLid />
      </group>

      {/* ── Flying Vinyl (arrives from above the scene) ── */}
      {flyingTrack && <FlyingVinylMesh track={flyingTrack} onLanded={onLanded} scale={scale} />}

      {/* ── Camera Controls ── */}
      <OrbitControls
        enableZoom={true}
        minDistance={isMobile ? 3.5 : 4.5}
        maxDistance={isMobile ? 10.5 : 8.5}
        enableRotate={true}
        minPolarAngle={Math.PI / 2.85}
        maxPolarAngle={Math.PI / 2.15}
        minAzimuthAngle={isMobile ? -Math.PI / 4.5 : -Math.PI / 6}
        maxAzimuthAngle={isMobile ? Math.PI / 4.5 : Math.PI / 6}
        enablePan={true}
        panSpeed={0.65}
        enableDamping
        dampingFactor={0.08}
      />
    </>
  );
}

// ═══════════════════════════════════════════════════════════════
// EXPORTED COMPONENT
// ═══════════════════════════════════════════════════════════════

export function TurntableDeck({
  dockingTrack,
  onDockComplete,
  onVinylTap,
}: TurntableDeckProps) {
  const isPlaying = usePlayerStore(state => state.isPlaying);
  const currentTrack = usePlayerStore(state => state.currentTrack);
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const [dockedTrack, setDockedTrack] = useState<Track | null>(null);
  const [flyingTrack, setFlyingTrack] = useState<Track | null>(null);
  const [isEjecting, setIsEjecting] = useState(false);
  const [canvasCreated, setCanvasCreated] = useState(false);

  const pendingDockRef = useRef<Track | null>(null);
  const canvasOpacity = useRef(new Animated.Value(1)).current;
  const hasFadedCanvasRef = useRef(false);

  useEffect(() => {
    if (!canvasCreated || hasFadedCanvasRef.current) {
      return undefined;
    }

    hasFadedCanvasRef.current = true;

    const fadeTimer = setTimeout(() => {
      Animated.timing(canvasOpacity, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }, 80);

    return () => {
      clearTimeout(fadeTimer);
    };
  }, [canvasCreated, canvasOpacity]);

  useEffect(() => {
    const visibilityFallback = setTimeout(() => {
      if (!hasFadedCanvasRef.current) {
        canvasOpacity.setValue(1);
      }
    }, 900);

    return () => {
      clearTimeout(visibilityFallback);
    };
  }, [canvasOpacity]);

  // Mount sync: restore from global playerStore
  useEffect(() => {
    const storeTrack = usePlayerStore.getState().currentTrack;
    if (storeTrack && !dockedTrack && !flyingTrack) {
      setDockedTrack(storeTrack);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLanded = useCallback(() => {
    if (flyingTrack) {
      setDockedTrack(flyingTrack);
      onDockComplete(flyingTrack);
      setFlyingTrack(null);
    }
  }, [flyingTrack, onDockComplete]);

  useEffect(() => {
    if (!dockingTrack) return;

    if (flyingTrack) {
      pendingDockRef.current = dockingTrack;
      return;
    }

    if (dockedTrack) {
      // Eject the current disc first, then fly in the new one
      pendingDockRef.current = dockingTrack;
      setIsEjecting(true);
      setTimeout(() => {
        setIsEjecting(false);
        setDockedTrack(null);
        if (pendingDockRef.current) {
          setFlyingTrack(pendingDockRef.current);
          pendingDockRef.current = null;
        }
      }, 500);
      return;
    }

    // No disc on the platter — fly in directly
    setFlyingTrack(dockingTrack);
  }, [dockingTrack, dockedTrack, flyingTrack]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    // When the user tapped a track from the UI (dockingTrack is set),
    // the dockingTrack effect owns the state machine. Don't interfere.
    if (dockingTrack) return;

    if (!currentTrack) {
      // Don't nuke state if a docking operation is already in-flight
      if (!flyingTrack && !pendingDockRef.current && !dockingTrack) {
        setDockedTrack(null);
        setFlyingTrack(null);
        pendingDockRef.current = null;
        setIsEjecting(false);
      }
      return;
    }

    if (
      currentTrack.id === dockedTrack?.id ||
      currentTrack.id === flyingTrack?.id ||
      currentTrack.id === pendingDockRef.current?.id
    ) {
      return;
    }

    if (!dockedTrack) {
      setFlyingTrack(currentTrack);
      return;
    }

    pendingDockRef.current = currentTrack;
    setIsEjecting(true);

    const swapTimer = setTimeout(() => {
      setIsEjecting(false);
      setDockedTrack(null);
      if (pendingDockRef.current) {
        setFlyingTrack(pendingDockRef.current);
        pendingDockRef.current = null;
      }
    }, 500);

    return () => {
      clearTimeout(swapTimer);
    };
  }, [currentTrack, dockedTrack, flyingTrack]);

  // Auto-advance handler: when audio finishes, the store sets isAutoAdvancing=true.
  // We intercept it here to run the eject→fly-in animation before calling nextTrack().
  const isAutoAdvancing = usePlayerStore(state => state.isAutoAdvancing);

  useEffect(() => {
    if (!isAutoAdvancing || !dockedTrack) return;

    // 1. Clear the flag immediately so this doesn't re-fire
    usePlayerStore.setState({ isAutoAdvancing: false });

    // 2. Trigger eject animation on the current disc
    setIsEjecting(true);

    setTimeout(() => {
      setIsEjecting(false);
      setDockedTrack(null);

      // 3. Advance to next track in the store (updates audio + recents)
      usePlayerStore.getState().nextTrack();

      // 4. After a brief pause, fly in the new disc
      setTimeout(() => {
        const newTrack = usePlayerStore.getState().currentTrack;
        if (newTrack) {
          setFlyingTrack(newTrack);
        }
      }, 100);
    }, 500);
  }, [isAutoAdvancing]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <View style={styles.deckContainer}>
      <Animated.View style={[styles.canvasFade, { opacity: canvasOpacity }]}>
        <Canvas
          gl={{ alpha: true }}
          shadows
          camera={{ position: isMobile ? [0, 6, 11] : [0, 5, 9], fov: isMobile ? 50 : 45 }}
          dpr={[1, 2]}
          onCreated={() => setCanvasCreated(true)}
          style={styles.canvas}
        >
          <Suspense fallback={null}>
            <TurntableScene
              dockedTrack={flyingTrack ? null : dockedTrack}
              flyingTrack={flyingTrack}
              isPlaying={isPlaying && !flyingTrack && !isEjecting}
              isEjecting={isEjecting}
              onLanded={handleLanded}
              isMobile={isMobile}
            />
          </Suspense>
        </Canvas>
      </Animated.View>

      {/* Invisible touch target to open PlayerScreen when vinyl is tapped */}
      {dockedTrack && !flyingTrack && !isEjecting && (
        <TouchableOpacity
          activeOpacity={1}
          style={[
            styles.touchOverlay,
            isMobile && { width: 130, height: 75, borderRadius: 65 }
          ]}
          onPress={onVinylTap}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  deckContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
    flex: 1,
    width: '100%',
  },
  canvas: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  canvasFade: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  touchOverlay: {
    position: 'absolute',
    width: 180,
    height: 100,
    borderRadius: 90,
  },
});
