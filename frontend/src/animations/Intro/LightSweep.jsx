import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'

export default function LightSweep({ active = false, progress = 0 }) {
  const lightRef = useRef()

  useFrame(() => {
    if (lightRef.current && active) {
      // Sweep light X position from left (-5.5) to right (+5.5)
      const startX = -5.5
      const endX = 5.5
      lightRef.current.position.x = startX + (endX - startX) * progress
      lightRef.current.intensity = Math.sin(progress * Math.PI) * 4.5
    }
  })

  if (!active) return null

  return (
    <spotLight
      ref={lightRef}
      position={[-5.5, 1.2, 2.5]}
      target-position={[0, 0, 0]}
      color="#2563eb"
      intensity={0}
      angle={0.4}
      penumbra={0.5}
      distance={8}
      decay={1.5}
    />
  )
}
