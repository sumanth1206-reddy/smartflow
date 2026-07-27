import React from 'react'

export default function Lighting() {
  return (
    <>
      {/* Soft Ambient Light for Apple minimalism */}
      <ambientLight intensity={0.8} color="#ffffff" />

      {/* Main Key Light for clear white ceramic highlights */}
      <directionalLight
        position={[6, 12, 8]}
        intensity={1.6}
        color="#ffffff"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={0.5}
        shadow-camera-far={25}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={6}
        shadow-camera-bottom={-6}
        shadow-bias={-0.0005}
      />

      {/* Blue Rim / Accent Light for illuminated blue edge reflection */}
      <spotLight
        position={[-8, 8, -4]}
        intensity={2.2}
        color="#2563eb"
        angle={0.6}
        penumbra={0.8}
      />

      {/* Bottom Fill Light for subtle underside brightness */}
      <directionalLight position={[0, -6, 4]} intensity={0.3} color="#93c5fd" />
    </>
  )
}
