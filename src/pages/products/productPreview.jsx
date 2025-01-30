import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom"; 
import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import api from "pages/api"; // Adjust import path as needed

/**
 * This component fetches product info by :id,
 * then renders a 3D tile preview (floor + walls + chairs) in React Three Fiber.
 */
export default function ProductPreviewPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [floorTexture, setFloorTexture] = useState(null);
  const [wallTexture, setWallTexture] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch product details on mount or when `id` changes
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await api.get(`/api/products/${id}`);
        setProduct(response.data);
      } catch (err) {
        console.error("Error fetching product:", err);
        setError("Failed to load product. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  // Load tile texture(s) whenever the product changes
  useEffect(() => {
    if (product && product.image) {
      // Use Three.js TextureLoader to load the tile image
      const loader = new THREE.TextureLoader();

      loader.load(
        product.image,
        (baseTexture) => {
          // We clone the base texture to create separate floor & wall textures
          const floorTex = baseTexture.clone();
          const wallTex = baseTexture.clone();

          // Enable repeating
          floorTex.wrapS = THREE.RepeatWrapping;
          floorTex.wrapT = THREE.RepeatWrapping;
          wallTex.wrapS = THREE.RepeatWrapping;
          wallTex.wrapT = THREE.RepeatWrapping;

          // Convert "actLength" & "actBreadth" from cm to meters (fallback 0.6m)
          const lengthM = parseFloat(product.actLength) / 100 || 0.6;
          const breadthM = parseFloat(product.actBreadth) / 100 || 0.6;

          // Floor: 10m x 10m
          // -> how many tiles along X and Y?
          const floorSize = 10;
          const tileCountX = floorSize / lengthM;   // e.g. 10 / 0.6 = ~16.6
          const tileCountY = floorSize / breadthM;

          floorTex.repeat.set(tileCountX, tileCountY);

          // Walls: let’s assume each wall is 10m wide, 3m tall
          // -> how many tiles along X (width) and Y (height)?
          const wallWidth = 10; 
          const wallHeight = 3;
          const wallCountX = wallWidth / lengthM;    // e.g. 10 / 0.6 = ~16.6
          const wallCountY = wallHeight / breadthM;  // e.g. 3 / 0.6 = 5

          wallTex.repeat.set(wallCountX, wallCountY);

          setFloorTexture(floorTex);
          setWallTexture(wallTex);
        },
        undefined,
        (err) => {
          console.error("Texture loading error:", err);
          setError("Failed to load tile texture.");
        }
      );
    }
  }, [product]);

  // Loading / Error handling
  if (loading) {
    return (
      <div style={styles.container}>
        <p>Loading product...</p>
      </div>
    );
  }
  if (error) {
    return (
      <div style={styles.container}>
        <p style={{ color: "red" }}>{error}</p>
      </div>
    );
  }

  // Main render
  return (
    <div style={styles.container}>
      <h2 style={styles.title}>
        {product?.name || "Unnamed Product"}
      </h2>

      <div style={styles.previewSection}>
        {/* 3D scene */}
        <Canvas style={styles.canvas} camera={{ position: [0, 5, 10], fov: 50 }}>
          <OrbitControls enablePan={false} />

          {/* Lights */}
          <ambientLight intensity={0.4} />
          <directionalLight
            intensity={0.8}
            position={[10, 10, 10]}
            castShadow
          />

          {/* Floor (with tile texture) */}
          {floorTexture && <Floor texture={floorTexture} />}

          {/* Walls (with tile texture) */}
          {wallTexture && <Walls texture={wallTexture} />}

          {/* Some example “chairs” as simple boxes */}
          <Chairs />
        </Canvas>

        {/* Product info panel */}
        <div style={styles.infoPanel}>
          <p><strong>Item ID:</strong> {product.item_id}</p>
          <p><strong>Seller:</strong> {product.seller || "N/A"}</p>
          <p><strong>Brand:</strong> {product.brand}</p>
          <p><strong>Category:</strong> {product.category}</p>
          <p><strong>Description:</strong> {product.description || "No description provided."}</p>
          <p>
            <strong>Actual Dimensions (cm):</strong>{" "}
            {product.actLength || "--"} x {product.actBreadth || "--"}
          </p>
          <p><strong>Price:</strong> {product.price || "N/A"}</p>
          <p><strong>Count in Stock:</strong> {product.countInStock || "0"}</p>
        </div>
      </div>
    </div>
  );
}

/** Floor: a 10m x 10m plane, rotated flat */
function Floor({ texture }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[10, 10]} />
      <meshStandardMaterial map={texture} />
    </mesh>
  );
}

/** Walls: 4 planeGeometry meshes forming a room perimeter (10m x 3m each) */
function Walls({ texture }) {
  // Each wall is 10 wide, 3 high
  // We'll place them around the edges of the floor at +/- 5 in X or Z.
  // 1) Back wall (behind the origin, -Z)
  // 2) Front wall (+Z)
  // 3) Left wall (-X)
  // 4) Right wall (+X)
  return (
    <>
      {/* Back wall */}
      <mesh
        position={[0, 1.5, -5]} // 1.5 up means half of 3m height
        rotation={[0, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[10, 3]} />
        <meshStandardMaterial map={texture} />
      </mesh>

      {/* Front wall */}
      <mesh
        position={[0, 1.5, 5]}
        rotation={[0, Math.PI, 0]}
        receiveShadow
      >
        <planeGeometry args={[10, 3]} />
        <meshStandardMaterial map={texture} />
      </mesh>

      {/* Left wall */}
      <mesh
        position={[-5, 1.5, 0]}
        rotation={[0, -Math.PI / 2, 0]}
        receiveShadow
      >
        <planeGeometry args={[10, 3]} />
        <meshStandardMaterial map={texture} />
      </mesh>

      {/* Right wall */}
      <mesh
        position={[5, 1.5, 0]}
        rotation={[0, Math.PI / 2, 0]}
        receiveShadow
      >
        <planeGeometry args={[10, 3]} />
        <meshStandardMaterial map={texture} />
      </mesh>
    </>
  );
}

/** Chairs: just two colored boxes for decoration */
function Chairs() {
  return (
    <>
      {/* Chair #1 */}
      <mesh position={[2, 0.5, 2]} castShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#8B4513" />
      </mesh>

      {/* Chair #2 */}
      <mesh position={[-2, 0.5, -1]} castShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#556B2F" />
      </mesh>
    </>
  );
}

/** Basic inline styles for layout */
const styles = {
  container: {
    padding: "20px",
  },
  title: {
    marginBottom: "1rem",
  },
  previewSection: {
    display: "flex",
    flexDirection: "row",
    gap: "20px",
  },
  canvas: {
    width: "600px",
    height: "400px",
    border: "1px solid #ccc",
    borderRadius: "8px",
  },
  infoPanel: {
    flex: 1,
    background: "#f9f9f9",
    padding: "1rem",
    borderRadius: "8px",
    maxWidth: "300px",
  },
};
