'use client';

import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';

function BrainParticles() {
  const ref = useRef<THREE.Points>(null);

  // Generate brain-shaped point cloud
  const particles = useMemo(() => {
    const points: number[] = [];
    const count = 2000;

    for (let i = 0; i < count; i++) {
      // Create an ellipsoid shape (brain-like)
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      // Brain proportions: wider than tall, with a slight indent in the middle
      const radiusX = 1.4 + Math.random() * 0.3;
      const radiusY = 1.1 + Math.random() * 0.2;
      const radiusZ = 1.2 + Math.random() * 0.25;

      let x = radiusX * Math.sin(phi) * Math.cos(theta);
      let y = radiusY * Math.sin(phi) * Math.sin(theta);
      let z = radiusZ * Math.cos(phi);

      // Add some internal structure (neural density)
      const internalChance = Math.random();
      if (internalChance > 0.6) {
        const scale = 0.3 + Math.random() * 0.5;
        x *= scale;
        y *= scale;
        z *= scale;
      }

      // Create the brain sulci (grooves) effect
      const grooveFactor = Math.sin(x * 3) * 0.1 + Math.sin(z * 4) * 0.08;
      y += grooveFactor;

      points.push(x, y, z);
    }

    return new Float32Array(points);
  }, []);

  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = state.clock.elapsedTime * 0.05;
      ref.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.1) * 0.1;
    }
  });

  return (
    <Points ref={ref} positions={particles} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        color="#6366f1"
        size={0.025}
        sizeAttenuation={true}
        depthWrite={false}
        opacity={0.6}
      />
    </Points>
  );
}

function NeuralConnections() {
  const linesRef = useRef<THREE.LineSegments>(null);

  const geometry = useMemo(() => {
    const pos: number[] = [];
    const col: number[] = [];
    const nodeCount = 50;
    const nodes: THREE.Vector3[] = [];

    // Generate nodes in brain shape
    for (let i = 0; i < nodeCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 0.8 + Math.random() * 0.4;

      nodes.push(
        new THREE.Vector3(
          r * 1.3 * Math.sin(phi) * Math.cos(theta),
          r * Math.sin(phi) * Math.sin(theta),
          r * 1.1 * Math.cos(phi)
        )
      );
    }

    // Create connections between nearby nodes
    const connectionDistance = 0.8;
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dist = nodes[i].distanceTo(nodes[j]);
        if (dist < connectionDistance) {
          pos.push(nodes[i].x, nodes[i].y, nodes[i].z);
          pos.push(nodes[j].x, nodes[j].y, nodes[j].z);

          // Gradient color based on position
          const intensity = 0.3 + Math.random() * 0.4;
          col.push(0.39, 0.4, 0.95, intensity);
          col.push(0.58, 0.35, 0.98, intensity);
        }
      }
    }

    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geom.setAttribute('color', new THREE.Float32BufferAttribute(col, 4));
    return geom;
  }, []);

  useFrame((state) => {
    if (linesRef.current) {
      linesRef.current.rotation.y = state.clock.elapsedTime * 0.05;
      linesRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.1) * 0.1;
    }
  });

  return (
    <lineSegments ref={linesRef} geometry={geometry}>
      <lineBasicMaterial vertexColors transparent opacity={0.3} />
    </lineSegments>
  );
}

function PulsingCore() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      const scale = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.1;
      meshRef.current.scale.setScalar(scale);
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.2} floatIntensity={0.3}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.15, 32, 32]} />
        <meshBasicMaterial color="#8b5cf6" transparent opacity={0.4} />
      </mesh>
    </Float>
  );
}

function BrainScene() {
  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={0.5} />
      <group position={[0, 0, 0]}>
        <BrainParticles />
        <NeuralConnections />
        <PulsingCore />
      </group>
    </>
  );
}

export default function Brain3D() {
  return (
    <div className="absolute inset-0 pointer-events-none opacity-40 dark:opacity-30">
      <Canvas
        camera={{ position: [0, 0, 4], fov: 50 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
      >
        <BrainScene />
      </Canvas>
    </div>
  );
}
