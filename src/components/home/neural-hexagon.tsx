'use client';

import { useEffect, useRef } from 'react';
import { useLocale } from 'next-intl';
import * as THREE from 'three';
import { DISCIPLINES, INTERDISCIPLINES, disciplineLabel } from '@/lib/disciplines';

/**
 * The Sloan hexagon as a slow 3D object: the six disciplines as nodes, the
 * named interdisciplines as edges, signals travelling along them, and a loose
 * field of "neurons" around it. Decorative: the accessible, interactive version
 * of the same diagram lives in the field section below the hero.
 *
 * Colours come from the theme tokens so the scene follows light/dark mode.
 */

const RADIUS = 2.55;
const NEURONS = 900;

/** Resolve a CSS colour token (oklch included) to RGB via a 1px canvas. */
function readToken(name: string, fallback: string): THREE.Color {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 1;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const color = new THREE.Color(fallback);
  if (!ctx) return color;
  ctx.fillStyle = fallback;
  ctx.fillStyle =
    getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
  return color.setRGB(r / 255, g / 255, b / 255, THREE.SRGBColorSpace);
}

/** Soft round sprite so points render as dots, not squares. */
function dotTexture(): THREE.CanvasTexture {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.55, 'rgba(255,255,255,0.9)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/** Deterministic PRNG so the neuron field is identical on every visit. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export default function NeuralHexagon({ className }: { className?: string }) {
  const locale = useLocale();
  const mountRef = useRef<HTMLDivElement>(null);
  const labelRefs = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.setAttribute('aria-hidden', 'true');
    renderer.domElement.style.display = 'block';
    mount.prepend(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
    camera.position.set(0, 0, 12);

    const root = new THREE.Group();
    root.rotation.x = -0.32;
    scene.add(root);

    // Vertices, clockwise from the top, with alternating depth so the hexagon
    // reads as an object in space rather than a flat drawing.
    const nodes = DISCIPLINES.map((_, i) => {
      const angle = ((90 - i * 60) * Math.PI) / 180;
      return new THREE.Vector3(
        RADIUS * Math.cos(angle),
        RADIUS * Math.sin(angle),
        i % 2 === 0 ? 0.45 : -0.45,
      );
    });

    const dot = dotTexture();
    const disposables: { dispose: () => void }[] = [dot];
    const track = <T extends { dispose: () => void }>(item: T) => {
      disposables.push(item);
      return item;
    };

    // Perimeter
    const perimeterGeo = track(
      new THREE.BufferGeometry().setFromPoints([...nodes, nodes[0]]),
    );
    const perimeterMat = track(
      new THREE.LineBasicMaterial({ transparent: true, opacity: 0.55 }),
    );
    root.add(new THREE.Line(perimeterGeo, perimeterMat));

    // Named interdisciplines; the ones Sloan marked as emerging are dashed.
    const solidPts: THREE.Vector3[] = [];
    const dashedPts: THREE.Vector3[] = [];
    for (const e of INTERDISCIPLINES) {
      (e.emerging ? dashedPts : solidPts).push(nodes[e.a], nodes[e.b]);
    }
    const solidMat = track(new THREE.LineBasicMaterial({ transparent: true, opacity: 0.32 }));
    const dashedMat = track(
      new THREE.LineDashedMaterial({ transparent: true, opacity: 0.32, dashSize: 0.08, gapSize: 0.1 }),
    );
    root.add(
      new THREE.LineSegments(track(new THREE.BufferGeometry().setFromPoints(solidPts)), solidMat),
    );
    const dashed = new THREE.LineSegments(
      track(new THREE.BufferGeometry().setFromPoints(dashedPts)),
      dashedMat,
    );
    dashed.computeLineDistances();
    root.add(dashed);

    // Discipline nodes
    const nodeGeo = track(new THREE.SphereGeometry(0.075, 24, 24));
    const nodeMat = track(new THREE.MeshBasicMaterial());
    for (const p of nodes) {
      const mesh = new THREE.Mesh(nodeGeo, nodeMat);
      mesh.position.copy(p);
      root.add(mesh);
    }

    // Neuron field: a flattened shell around the hexagon, denser near the ring.
    const rand = mulberry32(1978);
    const neuronPos = new Float32Array(NEURONS * 3);
    for (let i = 0; i < NEURONS; i++) {
      const angle = rand() * Math.PI * 2;
      const r = RADIUS * (0.25 + Math.pow(rand(), 0.6) * 1.25);
      neuronPos[i * 3] = Math.cos(angle) * r;
      neuronPos[i * 3 + 1] = Math.sin(angle) * r * 0.92;
      neuronPos[i * 3 + 2] = (rand() - 0.5) * 2.4 * (1 - r / (RADIUS * 2));
    }
    const neuronGeo = track(new THREE.BufferGeometry());
    neuronGeo.setAttribute('position', new THREE.BufferAttribute(neuronPos, 3));
    const neuronMat = track(
      new THREE.PointsMaterial({
        size: 0.045,
        map: dot,
        transparent: true,
        opacity: 0.55,
        depthWrite: false,
      }),
    );
    const neurons = new THREE.Points(neuronGeo, neuronMat);
    root.add(neurons);

    // Signals: one per interdiscipline, each with its own phase and speed.
    const signals = INTERDISCIPLINES.map((e, i) => ({
      from: nodes[e.a],
      to: nodes[e.b],
      phase: (i * 0.37) % 1,
      speed: 0.12 + ((i * 7) % 5) * 0.03,
      reverse: i % 2 === 1,
    }));
    const signalPos = new Float32Array(signals.length * 3);
    const signalGeo = track(new THREE.BufferGeometry());
    signalGeo.setAttribute('position', new THREE.BufferAttribute(signalPos, 3));
    const signalMat = track(
      new THREE.PointsMaterial({ size: 0.16, map: dot, transparent: true, depthWrite: false }),
    );
    root.add(new THREE.Points(signalGeo, signalMat));

    const applyTheme = () => {
      const fg = readToken('--foreground', '#1d2230');
      const muted = readToken('--muted-foreground', '#6b7280');
      const primary = readToken('--primary', '#c2334d');
      perimeterMat.color.copy(fg);
      solidMat.color.copy(fg);
      dashedMat.color.copy(muted);
      nodeMat.color.copy(fg);
      neuronMat.color.copy(muted);
      signalMat.color.copy(primary);
    };
    applyTheme();

    // Layout
    let width = 0;
    let height = 0;
    const resize = () => {
      width = mount.clientWidth;
      height = mount.clientHeight;
      if (!width || !height) return;
      renderer.setSize(width, height, false);
      renderer.domElement.style.width = `${width}px`;
      renderer.domElement.style.height = `${height}px`;
      camera.aspect = width / height;
      // Pull back on narrow containers so the outward labels stay in frame.
      // Phones need more room: the outward labels are wide relative to the canvas.
      const room = width < 640 ? 1.7 : 1.1;
      camera.position.z = 12 * Math.max(1, room / Math.max(camera.aspect, 0.6));
      camera.updateProjectionMatrix();
    };

    // Labels are HTML so they stay crisp; they follow the projected nodes.
    const projected = new THREE.Vector3();
    const placeLabels = () => {
      projected.set(0, 0, 0).applyMatrix4(root.matrixWorld).project(camera);
      const cx = (projected.x * 0.5 + 0.5) * width;
      const cy = (-projected.y * 0.5 + 0.5) * height;
      nodes.forEach((p, i) => {
        const el = labelRefs.current[i];
        const inner = el?.firstElementChild as HTMLElement | null;
        if (!el || !inner) return;
        projected.copy(p).applyMatrix4(root.matrixWorld).project(camera);
        const x = (projected.x * 0.5 + 0.5) * width;
        const y = (-projected.y * 0.5 + 0.5) * height;
        // Push each label outward from the centre so it never sits on an edge.
        const len = Math.hypot(x - cx, y - cy) || 1;
        const ux = (x - cx) / len;
        const uy = (y - cy) / len;
        const depth = THREE.MathUtils.clamp(1 - (projected.z - 0.9) * 8, 0.45, 1);
        el.style.transform = `translate3d(${(x + ux * 16).toFixed(1)}px, ${(y + uy * 16).toFixed(1)}px, 0)`;
        inner.style.transform = `translate(${(-50 + ux * 50).toFixed(1)}%, ${(-50 + uy * 50).toFixed(1)}%)`;
        inner.style.textAlign = ux > 0.35 ? 'left' : ux < -0.35 ? 'right' : 'center';
        el.style.opacity = depth.toFixed(2);
      });
    };

    const placeSignals = (time: number) => {
      signals.forEach((s, i) => {
        let t = (s.phase + time * s.speed) % 1;
        if (s.reverse) t = 1 - t;
        signalPos[i * 3] = s.from.x + (s.to.x - s.from.x) * t;
        signalPos[i * 3 + 1] = s.from.y + (s.to.y - s.from.y) * t;
        signalPos[i * 3 + 2] = s.from.z + (s.to.z - s.from.z) * t;
      });
      signalGeo.attributes.position.needsUpdate = true;
    };

    // Pointer parallax, eased toward the target each frame.
    const target = { x: 0, y: 0 };
    const onPointer = (ev: PointerEvent) => {
      target.y = (ev.clientX / window.innerWidth - 0.5) * 0.5;
      target.x = (ev.clientY / window.innerHeight - 0.5) * 0.25;
    };

    const draw = (time: number) => {
      placeSignals(time);
      root.updateMatrixWorld();
      renderer.render(scene, camera);
      placeLabels();
    };

    let frame = 0;
    let running = false;
    let last = performance.now();
    let elapsed = 0;
    let spin = 0;

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      elapsed += dt;
      spin += dt * 0.09;
      root.rotation.y += (target.y + Math.sin(spin) * 0.35 - root.rotation.y) * 0.04;
      root.rotation.x += (-0.32 + target.x - root.rotation.x) * 0.04;
      neurons.rotation.z += dt * 0.012;
      draw(elapsed);
      frame = requestAnimationFrame(tick);
    };

    const start = () => {
      if (running || reduceMotion) return;
      running = true;
      last = performance.now();
      frame = requestAnimationFrame(tick);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(frame);
    };

    resize();
    draw(0.35);

    const resizeObserver = new ResizeObserver(() => {
      resize();
      if (!running) draw(elapsed || 0.35);
    });
    resizeObserver.observe(mount);

    // Only animate while visible.
    const visibility = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !document.hidden) start();
      else stop();
    });
    visibility.observe(mount);
    const onVisibility = () => (document.hidden ? stop() : start());
    document.addEventListener('visibilitychange', onVisibility);

    // Re-read colours when the theme class flips.
    const themeObserver = new MutationObserver(() => {
      applyTheme();
      if (!running) draw(elapsed || 0.35);
    });
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    if (!reduceMotion) window.addEventListener('pointermove', onPointer, { passive: true });

    return () => {
      stop();
      resizeObserver.disconnect();
      visibility.disconnect();
      themeObserver.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pointermove', onPointer);
      disposables.forEach((d) => d.dispose());
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return (
    <div ref={mountRef} className={`relative ${className ?? ''}`}>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        {DISCIPLINES.map((d, i) => (
          <span
            key={d.slug}
            ref={(el) => {
              labelRefs.current[i] = el;
            }}
            className="absolute top-0 left-0 will-change-transform"
            style={{ opacity: 0 }}
          >
            <span className="block whitespace-nowrap">
              <span className="block font-display text-[13px] font-semibold text-foreground" style={{ fontStretch: '88%' }}>
                {disciplineLabel(d, locale)}
              </span>
              <span className="block font-mono text-[10px] text-muted-foreground">
                {(locale === 'fi' ? d.en : d.fi).toLowerCase()}
              </span>
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
