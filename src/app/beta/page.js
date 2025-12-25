"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF, Environment, Center, Html } from "@react-three/drei";
import { Suspense, useState } from "react";

function Loader() {
  return (
    <Html center>
      <div style={{ 
        color: '#3b82f6', 
        fontSize: '16px', 
        fontWeight: 500,
        background: '#f0f9ff',
        padding: '12px 24px',
        borderRadius: '8px',
        border: '1px solid #3b82f6'
      }}>
        Loading 3D Model...
      </div>
    </Html>
  );
}

function Model() {
  const { scene } = useGLTF("/3d/tinker.glb");
  
  return (
    <Center>
      <primitive 
        object={scene} 
        scale={0.9} 
        position={[0, 0, 0]}
      />
    </Center>
  );
}

export default function BetaPage() {
  const [error, setError] = useState(null);

  return (
    <div style={{ 
      height: "100vh", 
      width: "100%", 
      background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)" 
    }}>
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        color: '#fff',
        zIndex: 10,
        background: 'rgba(0,0,0,0.5)',
        padding: '10px 20px',
        borderRadius: '8px'
      }}>
        <h2 style={{ margin: 0, fontSize: '18px' }}>3D Model Viewer (Beta)</h2>
        <p style={{ margin: '5px 0 0', fontSize: '12px', opacity: 0.8 }}>
          Drag to rotate • Scroll to zoom • Right-click to pan
        </p>
      </div>
      
      <Canvas 
        camera={{ position: [0, 2, 8], fov: 45 }}
        style={{ background: 'transparent' }}
        onCreated={({ gl }) => {
          gl.setClearColor('#0f172a', 1);
        }}
      >
        {/* LIGHTING */}
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1.5} castShadow />
        <directionalLight position={[-10, -10, -5]} intensity={0.5} />
        <pointLight position={[0, 10, 0]} intensity={1} />

        {/* ENVIRONMENT FOR REFLECTIONS */}
        <Environment preset="city" />

        {/* MODEL */}
        <Suspense fallback={<Loader />}>
          <Model />
        </Suspense>

        {/* GROUND GRID */}
        <gridHelper args={[20, 20, '#3b82f6', '#1e3a5f']} position={[0, -2, 0]} />

        {/* USER CONTROLS */}
        <OrbitControls
          enableRotate={true}
          enableZoom={true}
          enablePan={true}
          autoRotate={true}
          autoRotateSpeed={1}
          minDistance={2}
          maxDistance={20}
        />
      </Canvas>
    </div>
  );
}

// Preload the model
useGLTF.preload("/3d/tinker.glb");
