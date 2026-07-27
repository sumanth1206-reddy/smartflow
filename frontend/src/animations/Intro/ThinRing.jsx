import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'

export default function ThinRing({ visible = true, progress = 0 }) {
  const ringRef = useRef()

  useFrame((_, delta) => {
    if (ringRef.current) {
      // Rotation driven by progress or continuous smooth rotation
      ringRef.current.rotation.z = progress * Math.PI * 2
      ringRef.current.rotation.x = Math.sin(progress * Math.PI) * 0.15
    }
  })

  if (!visible) return null

  // Scale ring to encompass the logo width (~7 units wide)
  const scale = 1.0 + Math.sin(progress * Math.PI) * 0.08
  const opacity = progress > 0.9 ? (1 - progress) * 10 : Math.min(progress * 4, 1)

  return (
    <group ref={ringRef} scale={[scale, scale, scale]} position={[0, 0, -0.5]}>
      {/* Outer Blue Emissive Ring */}
      <mesh>
        <torusGeometry args={[4.2, 0.04, 32, 128]} />
        <meshStandardMaterial
          color="#2563eb"
          emissive="#2563eb"
          emissiveIntensity={0.8}
          roughness={0.2}
          metalness={0.9}
          transparent
          opacity={Math.max(0, opacity)}
        />
      </mesh>
      
      {/* Inner Metallic Accent Ring */}
      <mesh scale={[0.98, 0.98, 0.98]}>
        <torusGeometry args={[4.2, 0.015, 16, 128]} />
        <meshStandardMaterial
          color="#e2e8f0"
          roughness={0.1}
          metalness={0.95}
          transparent
          opacity={Math.max(0, opacity * 0.7)}
        />
      </mesh>
    </group>
  )
}
