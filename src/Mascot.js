import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { PerspectiveCamera, ContactShadows, Float } from '@react-three/drei';
import './Mascot.css'; // Import Mascot.css // Removed OrbitControls
// import * as THREE from 'three'; // Not needed if not directly referencing THREE.

// Components for reusable parts
function Eye({ position }) {
  return (
    <group position={position}>
      <mesh>
        <sphereGeometry args={[0.11, 32, 32]} />
        <meshStandardMaterial color="white" roughness={0.1} />
      </mesh>
      <mesh position={[0, 0, 0.07]}>
        <sphereGeometry args={[0.065, 16, 16]} />
        <meshStandardMaterial color="#222" />
      </mesh>
      <mesh position={[0.04, 0.04, 0.11]}>
        <sphereGeometry args={[0.025, 16, 16]} />
        <meshStandardMaterial color="white" />
      </mesh>
    </group>
  );
}

function Bunny() {
  const bunnyRef = useRef();
  const leftEarRef = useRef();
  const rightEarRef = useRef();

  // Color Palette
  const colors = {
    body: '#FFF5E6', // Warmer cream
    innerEar: '#FFB3D9', // Vibrant pink
    tummy: '#FFFEF7',
    nose: '#FF1493',
    blush: '#FF9EB3',
    boots: '#10B981', // Richer green
    bootHighlight: '#34D399'
  };

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    
    // Gentle breathing with slight squash and stretch
    const breathe = Math.sin(t * 1.5) * 0.08;
    bunnyRef.current.position.y = breathe;
    bunnyRef.current.scale.y = 1 + Math.sin(t * 1.5) * 0.02;
    bunnyRef.current.scale.x = 1 - Math.sin(t * 1.5) * 0.01;
    bunnyRef.current.scale.z = 1 - Math.sin(t * 1.5) * 0.01;
    
    // More expressive ear animations
    leftEarRef.current.rotation.z = -0.15 + Math.sin(t * 2.5) * 0.12;
    leftEarRef.current.rotation.x = Math.sin(t * 2) * 0.05;
    rightEarRef.current.rotation.z = 0.15 - Math.sin(t * 2.7) * 0.12;
    rightEarRef.current.rotation.x = -Math.sin(t * 2.2) * 0.05;
  });

  return (
    <group ref={bunnyRef} scale={[0.15, 0.15, 0.15]} position={[0, -0.5, -10]}> {/* Decreased overall scale */}
      {/* --- BODY --- */}
      <mesh position={[0, 0.7, 0]} castShadow>
        <sphereGeometry args={[0.65, 32, 32]} />
        <meshStandardMaterial color={colors.body} roughness={0.6} metalness={0.1} />
        {/* Tummy */}
        <mesh position={[0, -0.15, 0.48]}>
          <sphereGeometry args={[0.38, 32, 32]} />
          <meshStandardMaterial color={colors.tummy} roughness={0.5} />
        </mesh>
      </mesh>

      {/* --- TAIL --- */}
      <mesh position={[0, 0.4, -0.55]} castShadow>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial color={colors.tummy} />
      </mesh>

      {/* --- HEAD --- */}
      <group position={[0, 1.5, 0.1]}>
        <mesh castShadow>
          <sphereGeometry args={[0.52, 32, 32]} />
          <meshStandardMaterial color={colors.body} roughness={0.6} metalness={0.1} />
        </mesh>

        {/* Features */}
        <Eye position={[-0.2, 0.12, 0.44]} />
        <Eye position={[0.2, 0.12, 0.44]} />

        {/* Blush Marks */}
        <mesh position={[-0.32, -0.08, 0.42]} rotation={[0, 0.3, 0]}>
          <sphereGeometry args={[0.12, 16, 16]} scale={[1, 0.6, 0.3]} />
          <meshStandardMaterial color={colors.blush} transparent opacity={0.7} roughness={0.8} />
        </mesh>
        <mesh position={[0.32, -0.08, 0.42]} rotation={[0, -0.3, 0]}>
          <sphereGeometry args={[0.12, 16, 16]} scale={[1, 0.6, 0.3]} />
          <meshStandardMaterial color={colors.blush} transparent opacity={0.7} roughness={0.8} />
        </mesh>

        {/* Cute button nose */}
        <mesh position={[0, -0.02, 0.52]}>
          <sphereGeometry args={[0.07, 16, 16]} scale={[1, 0.9, 0.9]} />
          <meshStandardMaterial color={colors.nose} roughness={0.4} />
        </mesh>
        
        {/* Simple smile */}
        <mesh position={[0, -0.15, 0.48]}>
          <torusGeometry args={[0.12, 0.015, 8, 24, Math.PI]} />
          <meshStandardMaterial color="#333" />
        </mesh>

        {/* --- EARS --- */}
        <group ref={leftEarRef} position={[-0.25, 0.4, 0]}>
          <mesh position={[0, 0.3, 0]} castShadow>
            <capsuleGeometry args={[0.1, 0.5, 8, 16]} />
            <meshStandardMaterial color={colors.body} />
            {/* Inner Ear Pink */}
            <mesh position={[0, 0, 0.06]}>
              <capsuleGeometry args={[0.06, 0.4, 8, 16]} />
              <meshStandardMaterial color={colors.innerEar} />
            </mesh>
          </mesh>
        </group>

        <group ref={rightEarRef} position={[0.25, 0.4, 0]}>
          <mesh position={[0, 0.3, 0]} castShadow>
            <capsuleGeometry args={[0.1, 0.5, 8, 16]} />
            <meshStandardMaterial color={colors.body} />
            {/* Inner Ear Pink */}
            <mesh position={[0, 0, 0.06]}>
              <capsuleGeometry args={[0.06, 0.4, 8, 16]} />
              <meshStandardMaterial color={colors.innerEar} />
            </mesh>
          </mesh>
        </group>
      </group>

      {/* --- ARMS --- */}
      <mesh position={[-0.65, 0.7, 0.1]} rotation={[0, 0, 0.4]}>
        <capsuleGeometry args={[0.08, 0.25, 8, 16]} />
        <meshStandardMaterial color={colors.body} />
      </mesh>
      <mesh position={[0.65, 0.7, 0.1]} rotation={[0, 0, -0.4]}>
        <capsuleGeometry args={[0.08, 0.25, 8, 16]} />
        <meshStandardMaterial color={colors.body} />
      </mesh>

      {/* --- GUMBOOTS --- */}
      <group position={[0, 0.12, 0]}>
        {/* Left Boot */}
        <group position={[-0.25, 0, 0]}>
          <mesh castShadow>
            <capsuleGeometry args={[0.14, 0.18, 8, 16]} />
            <meshStandardMaterial color={colors.boots} roughness={0.3} metalness={0.2} />
          </mesh>
          {/* Boot highlight stripe */}
          <mesh position={[0, 0.1, 0]}>
            <torusGeometry args={[0.145, 0.02, 8, 24]} />
            <meshStandardMaterial color={colors.bootHighlight} />
          </mesh>
        </group>
        {/* Right Boot */}
        <group position={[0.25, 0, 0]}>
          <mesh castShadow>
            <capsuleGeometry args={[0.14, 0.18, 8, 16]} />
            <meshStandardMaterial color={colors.boots} roughness={0.3} metalness={0.2} />
          </mesh>
          {/* Boot highlight stripe */}
          <mesh position={[0, 0.1, 0]}>
            <torusGeometry args={[0.145, 0.02, 8, 24]} />
            <meshStandardMaterial color={colors.bootHighlight} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

export default function Mascot() {
  return (
    <div className="mascot-container"> {/* Changed to class name */}
      <Canvas shadows antialias="true">
        <PerspectiveCamera makeDefault position={[0, 1.5, 6.0]} fov={30} />
        
        {/* Soft Studio Lighting */}
        <ambientLight intensity={0.5} />
        <directionalLight 
          position={[5, 5, 5]} 
          intensity={1} 
          castShadow 
          shadow-mapSize={[1024, 1024]} 
        />
        <pointLight position={[-5, 2, 2]} intensity={0.5} color="#ffd1dc" />

        <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
          <Bunny />
        </Float>

        {/* Soft shadow on the "floor" */}
        <ContactShadows 
          position={[0, 0, 0]} 
          opacity={0.4} 
          scale={10} 
          blur={2.5} 
          far={1} 
        />
      </Canvas>
    </div>
  );
}