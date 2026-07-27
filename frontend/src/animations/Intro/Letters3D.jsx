import React, { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'

// Helper to construct 2D THREE.Shapes for SMARTFLOW
function createLetterShapes() {
  const shapes = {}

  // Letter S
  const s = new THREE.Shape()
  s.moveTo(0.65, 1.05)
  s.bezierCurveTo(0.35, 1.25, -0.05, 1.15, -0.05, 0.85)
  s.bezierCurveTo(-0.05, 0.60, 0.25, 0.55, 0.50, 0.45)
  s.bezierCurveTo(0.75, 0.35, 0.75, 0.05, 0.40, -0.05)
  s.bezierCurveTo(0.05, -0.15, -0.15, 0.05, -0.15, 0.25)
  s.lineTo(0.05, 0.30)
  s.bezierCurveTo(0.05, 0.15, 0.20, 0.08, 0.40, 0.12)
  s.bezierCurveTo(0.55, 0.16, 0.55, 0.30, 0.35, 0.38)
  s.bezierCurveTo(0.10, 0.48, -0.20, 0.52, -0.20, 0.85)
  s.bezierCurveTo(-0.20, 1.25, 0.25, 1.35, 0.65, 1.20)
  s.closePath()
  shapes['S'] = s

  // Letter M
  const m = new THREE.Shape()
  m.moveTo(-0.4, 0)
  m.lineTo(-0.4, 1.2)
  m.lineTo(-0.15, 1.2)
  m.lineTo(0, 0.45)
  m.lineTo(0.15, 1.2)
  m.lineTo(0.4, 1.2)
  m.lineTo(0.4, 0)
  m.lineTo(0.22, 0)
  m.lineTo(0.22, 0.85)
  m.lineTo(0.04, 0.1)
  m.lineTo(-0.04, 0.1)
  m.lineTo(-0.22, 0.85)
  m.lineTo(-0.22, 0)
  m.closePath()
  shapes['M'] = m

  // Letter A
  const a = new THREE.Shape()
  a.moveTo(0, 1.2)
  a.lineTo(-0.4, 0)
  a.lineTo(-0.2, 0)
  a.lineTo(-0.08, 0.35)
  a.lineTo(0.08, 0.35)
  a.lineTo(0.2, 0)
  a.lineTo(0.4, 0)
  a.closePath()
  const aHole = new THREE.Path()
  aHole.moveTo(0, 0.95)
  aHole.lineTo(-0.05, 0.5)
  aHole.lineTo(0.05, 0.5)
  aHole.closePath()
  a.holes.push(aHole)
  shapes['A'] = a

  // Letter R
  const r = new THREE.Shape()
  r.moveTo(-0.3, 0)
  r.lineTo(-0.3, 1.2)
  r.lineTo(0.1, 1.2)
  r.bezierCurveTo(0.4, 1.2, 0.4, 0.65, 0.1, 0.65)
  r.lineTo(0.35, 0)
  r.lineTo(0.12, 0)
  r.lineTo(-0.1, 0.6)
  r.lineTo(-0.1, 0)
  r.closePath()
  const rHole = new THREE.Path()
  rHole.moveTo(-0.1, 1.0)
  rHole.lineTo(0.08, 1.0)
  rHole.bezierCurveTo(0.22, 1.0, 0.22, 0.78, 0.08, 0.78)
  rHole.lineTo(-0.1, 0.78)
  rHole.closePath()
  r.holes.push(rHole)
  shapes['R'] = r

  // Letter T
  const t = new THREE.Shape()
  t.moveTo(-0.4, 1.2)
  t.lineTo(0.4, 1.2)
  t.lineTo(0.4, 1.0)
  t.lineTo(0.1, 1.0)
  t.lineTo(0.1, 0)
  t.lineTo(-0.1, 0)
  t.lineTo(-0.1, 1.0)
  t.lineTo(-0.4, 1.0)
  t.closePath()
  shapes['T'] = t

  // Letter F
  const f = new THREE.Shape()
  f.moveTo(-0.3, 0)
  f.lineTo(-0.3, 1.2)
  f.lineTo(0.35, 1.2)
  f.lineTo(0.35, 1.0)
  f.lineTo(-0.1, 1.0)
  f.lineTo(-0.1, 0.7)
  f.lineTo(0.25, 0.7)
  f.lineTo(0.25, 0.5)
  f.lineTo(-0.1, 0.5)
  f.lineTo(-0.1, 0)
  f.closePath()
  shapes['F'] = f

  // Letter L
  const l = new THREE.Shape()
  l.moveTo(-0.3, 1.2)
  l.lineTo(-0.1, 1.2)
  l.lineTo(-0.1, 0.2)
  l.lineTo(0.3, 0.2)
  l.lineTo(0.3, 0)
  l.lineTo(-0.3, 0)
  l.closePath()
  shapes['L'] = l

  // Letter O
  const o = new THREE.Shape()
  o.absarc(0, 0.6, 0.55, 0, Math.PI * 2, false)
  const oHole = new THREE.Path()
  oHole.absarc(0, 0.6, 0.32, 0, Math.PI * 2, true)
  o.holes.push(oHole)
  shapes['O'] = o

  // Letter W
  const w = new THREE.Shape()
  w.moveTo(-0.45, 1.2)
  w.lineTo(-0.28, 0)
  w.lineTo(-0.1, 0)
  w.lineTo(0, 0.75)
  w.lineTo(0.1, 0)
  w.lineTo(0.28, 0)
  w.lineTo(0.45, 1.2)
  w.lineTo(0.28, 1.2)
  w.lineTo(0.18, 0.35)
  w.lineTo(0.07, 1.05)
  w.lineTo(-0.07, 1.05)
  w.lineTo(-0.18, 0.35)
  w.lineTo(-0.28, 1.2)
  w.closePath()
  shapes['W'] = w

  return shapes
}

const letterList = [
  { char: 'S', targetX: -3.4 },
  { char: 'M', targetX: -2.55 },
  { char: 'A', targetX: -1.7 },
  { char: 'R', targetX: -0.85 },
  { char: 'T', targetX: 0.0 },
  { char: 'F', targetX: 0.85 },
  { char: 'L', targetX: 1.7 },
  { char: 'O', targetX: 2.55 },
  { char: 'W', targetX: 3.4 },
]

export default function Letters3D({ letterStates = {}, lightSweepProgress = 0 }) {
  const shapes = useMemo(() => createLetterShapes(), [])

  // Shared Extrude Settings for Matte Ceramic + Brushed Aluminum edges
  const extrudeSettings = useMemo(() => ({
    steps: 1,
    depth: 0.22,
    bevelEnabled: true,
    bevelThickness: 0.035,
    bevelSize: 0.03,
    bevelOffset: 0,
    bevelSegments: 4
  }), [])

  // Material 0: White Ceramic Front / Back
  const ceramicMaterial = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: '#ffffff',
    roughness: 0.18,
    metalness: 0.05,
    clearcoat: 0.5,
    clearcoatRoughness: 0.1,
    reflectivity: 0.9,
  }), [])

  // Material 1: Brushed Aluminum Sides
  const aluminumMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#cbd5e1',
    roughness: 0.3,
    metalness: 0.85,
  }), [])

  const materials = useMemo(() => [ceramicMaterial, aluminumMaterial], [ceramicMaterial, aluminumMaterial])

  return (
    <group position={[0, -0.6, 0]}>
      {letterList.map((item, index) => {
        const state = letterStates[item.char] || {
          x: item.targetX,
          y: 0,
          z: 0,
          rotX: 0,
          rotY: 0,
          rotZ: 0,
          scale: 1,
          glow: 0,
        }

        const shape = shapes[item.char]
        if (!shape) return null

        // Light sweep highlight boost per letter
        const sweepPos = -3.4 + lightSweepProgress * 6.8
        const distToSweep = Math.abs(item.targetX - sweepPos)
        const sweepGlow = Math.max(0, 1 - distToSweep * 1.2) * (lightSweepProgress > 0 && lightSweepProgress < 1 ? 1 : 0)
        const totalGlow = Math.max(state.glow || 0, sweepGlow)

        return (
          <group
            key={item.char}
            position={[state.x, state.y, state.z]}
            rotation={[state.rotX, state.rotY, state.rotZ]}
            scale={[state.scale, state.scale, state.scale]}
          >
            {/* Main Extruded 3D Letter */}
            <mesh castShadow receiveShadow material={materials}>
              <extrudeGeometry args={[shape, extrudeSettings]} />
            </mesh>

            {/* Blue Illuminated Edge Glow Overlay */}
            {totalGlow > 0.01 && (
              <mesh position={[0, 0, 0.001]} scale={[1.01, 1.01, 1.02]}>
                <extrudeGeometry args={[shape, { ...extrudeSettings, depth: 0.23 }]} />
                <meshBasicMaterial
                  color="#2563eb"
                  wireframe
                  transparent
                  opacity={totalGlow * 0.75}
                />
              </mesh>
            )}

            {/* Soft Contact Shadow below letter */}
            <mesh position={[0, -0.05, -0.1]} rotation={[-Math.PI / 2, 0, 0]} scale={[0.8, 0.3, 1]}>
              <planeGeometry args={[1, 1]} />
              <meshBasicMaterial
                color="#0f172a"
                transparent
                opacity={Math.max(0, (1 - Math.abs(state.y)) * 0.15)}
              />
            </mesh>
          </group>
        )
      })}
    </group>
  )
}
