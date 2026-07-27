import React from 'react'

export default function Background() {
  return (
    <>
      {/* Pure White Background Color */}
      <color attach="background" args={['#ffffff']} />

      {/* Subtle Studio Floor for Soft Ambient Shadow Receiving */}
      <mesh position={[0, -1.2, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[30, 30]} />
        <shadowMaterial opacity={0.06} />
      </mesh>
    </>
  )
}
