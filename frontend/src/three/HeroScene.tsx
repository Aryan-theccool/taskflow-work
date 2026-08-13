import { Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import {
  Environment,
  Float,
  Grid,
  Lightformer,
  RoundedBox,
  Sparkles,
} from '@react-three/drei';
import * as THREE from 'three';
import { scrollStore } from './scrollStore';
import type { Priority } from '../types';

const PRIORITY_COLOR: Record<Priority, string> = {
  Low: '#9ca3af',
  Medium: '#f59e0b',
  High: '#ef4444',
};

const COLUMN_ACCENT = ['#60a5fa', '#f5a623', '#34d399'];

interface FloatingCardSpec {
  position: [number, number, number];
  rotation: [number, number, number];
  priority: Priority;
  speed: number;
  delay: number;
}

/** Abstract 3D task-card glyphs orbiting the board sculpture. */
const FLOATING_CARDS: FloatingCardSpec[] = [
  { position: [-3.15, 1.15, 1.45], rotation: [0.02, 0.42, 0.03], priority: 'High', speed: 1.6, delay: 0 },
  { position: [3.05, 0.75, 1.25], rotation: [-0.03, -0.5, -0.02], priority: 'High', speed: 1.2, delay: 1 },
  { position: [-3.4, -1.15, 0.7], rotation: [0.02, 0.3, -0.04], priority: 'Medium', speed: 1.9, delay: 2 },
  { position: [3.45, -1.4, 0.45], rotation: [0.01, -0.28, 0.04], priority: 'Medium', speed: 1.4, delay: 3 },
  { position: [-1.8, 2.1, -0.8], rotation: [0, 0.16, 0.02], priority: 'Low', speed: 2.2, delay: 4 },
  { position: [1.95, 2.3, -0.5], rotation: [0, -0.2, -0.02], priority: 'Low', speed: 1.7, delay: 5 },
];

function TaskGlyph({ spec }: { spec: FloatingCardSpec }) {
  const color = PRIORITY_COLOR[spec.priority];
  return (
    <Float
      speed={spec.speed}
      rotationIntensity={0.5}
      floatIntensity={1.5}
      floatingRange={[-0.14, 0.14]}
    >
      <group position={spec.position} rotation={spec.rotation}>
        {/* card body */}
        <RoundedBox args={[1.55, 0.92, 0.06]} radius={0.05} smoothness={4}>
          <meshStandardMaterial
            color="#101828"
            roughness={0.32}
            metalness={0.4}
            envMapIntensity={1.1}
          />
        </RoundedBox>
        {/* priority edge strip */}
        <RoundedBox args={[0.045, 0.92, 0.062]} radius={0.02} position={[-0.75, 0, 0]}>
          <meshBasicMaterial color={color} toneMapped={false} />
        </RoundedBox>
        {/* priority dot */}
        <mesh position={[-0.56, 0.27, 0.045]}>
          <circleGeometry args={[0.045, 24]} />
          <meshBasicMaterial color={color} toneMapped={false} />
        </mesh>
        {/* title line */}
        <RoundedBox args={[0.68, 0.075, 0.014]} radius={0.03} position={[-0.09, 0.27, 0.042]}>
          <meshBasicMaterial color="#dbe3ff" toneMapped={false} />
        </RoundedBox>
        {/* description lines */}
        <RoundedBox args={[0.98, 0.05, 0.012]} radius={0.02} position={[-0.13, 0.05, 0.042]}>
          <meshBasicMaterial color="#4c5678" />
        </RoundedBox>
        <RoundedBox args={[0.6, 0.05, 0.012]} radius={0.02} position={[-0.32, -0.14, 0.042]}>
          <meshBasicMaterial color="#39435f" />
        </RoundedBox>
        {/* avatar chip */}
        <mesh position={[0.52, -0.28, 0.045]}>
          <circleGeometry args={[0.075, 24]} />
          <meshBasicMaterial color="#2a3554" />
        </mesh>
      </group>
    </Float>
  );
}

function BoardSculpture() {
  const group = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    const g = group.current;
    if (!g) return;
    const hero = scrollStore.hero; // 0 → 1 as the hero scrolls away
    const t = state.clock.elapsedTime;

    const targetRotY = state.pointer.x * 0.32 + hero * 1.35 + Math.sin(t * 0.12) * 0.05;
    const targetRotX = -0.03 - state.pointer.y * 0.14;
    g.rotation.y = THREE.MathUtils.damp(g.rotation.y, targetRotY, 2.6, delta);
    g.rotation.x = THREE.MathUtils.damp(g.rotation.x, targetRotX, 2.6, delta);
    g.position.y = THREE.MathUtils.damp(g.position.y, -hero * 0.9, 3, delta);

    const cam = state.camera;
    cam.position.y = THREE.MathUtils.damp(cam.position.y, 0.55 - hero * 1.7, 3, delta);
    cam.position.z = THREE.MathUtils.damp(cam.position.z, 8.6 + hero * 1.4, 3, delta);
    cam.lookAt(0, -hero * 0.5, 0);
  });

  return (
    <group ref={group}>
      {/* three glass columns */}
      {COLUMN_ACCENT.map((accent, i) => {
        const x = (i - 1) * 1.95;
        return (
          <group key={accent} position={[x, 0, 0]}>
            <RoundedBox args={[1.72, 3.35, 0.07]} radius={0.06} smoothness={6}>
              <meshPhysicalMaterial
                color="#a9bbff"
                roughness={0.18}
                metalness={0.05}
                transmission={0.82}
                thickness={0.6}
                ior={1.45}
                envMapIntensity={1.4}
                transparent
              />
            </RoundedBox>
            {/* column header accent bar */}
            <RoundedBox args={[1.28, 0.085, 0.03]} radius={0.04} position={[0, 1.32, 0.055]}>
              <meshBasicMaterial color={accent} toneMapped={false} />
            </RoundedBox>
            {/* faint placeholder rows etched into the glass */}
            {[0.78, 0.22, -0.34, -0.9].map((y) => (
              <RoundedBox key={y} args={[1.3, 0.34, 0.02]} radius={0.05} position={[0, y, 0.045]}>
                <meshBasicMaterial color="#1b2440" transparent opacity={0.55} />
              </RoundedBox>
            ))}
          </group>
        );
      })}

      {/* floating task glyphs around the sculpture */}
      {FLOATING_CARDS.map((spec) => (
        <TaskGlyph key={spec.position.join(',')} spec={spec} />
      ))}
    </group>
  );
}

export default function HeroScene() {
  return (
    <Canvas
      className="hero-canvas"
      dpr={[1, 1.8]}
      camera={{ position: [0, 0.55, 8.6], fov: 42 }}
      gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
    >
      <color attach="background" args={['#05070d']} />
      <fog attach="fog" args={['#05070d', 10, 24]} />

      <ambientLight intensity={0.4} />
      <spotLight position={[0, 8, 6]} angle={0.55} penumbra={1} intensity={260} color="#dfe6ff" />
      <pointLight position={[5.5, 2.5, 4]} intensity={50} color="#4f6df5" />
      <pointLight position={[-5.5, -0.5, -2]} intensity={35} color="#22d3ee" />

      <Suspense fallback={null}>
        <BoardSculpture />
        {/* Local, network-free environment: pure WebGL light cards */}
        <Environment resolution={128}>
          <group>
            <Lightformer form="rect" intensity={4} color="#4f6df5" position={[0, 5, -8]} scale={[10, 4, 1]} />
            <Lightformer form="rect" intensity={2.4} color="#22d3ee" position={[8, 1, 2]} rotation-y={-Math.PI / 2} scale={[6, 3, 1]} />
            <Lightformer form="rect" intensity={1.8} color="#a855f7" position={[-8, -1, 1]} rotation-y={Math.PI / 2} scale={[5, 2.5, 1]} />
            <Lightformer form="circle" intensity={1.6} color="#ffffff" position={[0, 0, 9]} scale={[3, 3, 1]} />
          </group>
        </Environment>
      </Suspense>

      <Sparkles count={130} scale={[17, 9, 9]} size={1.7} speed={0.22} color="#7aa2ff" opacity={0.55} position={[0, 1, -2]} />
      <Sparkles count={46} scale={[13, 7, 7]} size={2.6} speed={0.32} color="#22d3ee" opacity={0.4} position={[0, 0.4, 0]} />

      <Grid
        position={[0, -2.4, 0]}
        args={[30, 30]}
        cellSize={0.55}
        cellThickness={0.65}
        cellColor="#141c31"
        sectionSize={2.75}
        sectionThickness={1.15}
        sectionColor="#2b3f8f"
        fadeDistance={23}
        fadeStrength={2.4}
        infiniteGrid
      />
    </Canvas>
  );
}
