import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import axios from 'axios';
import { Backendurl } from '../App';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function PanoramaViewer({ roomId, className = "w-full h-[500px]", staticScenes = null }) {
  const mountRef = useRef(null);
  const [scenes, setScenes] = useState([]);
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const hotspotObjects = useRef([]);

  const currentScene = scenes[currentSceneIndex];

  useEffect(() => {
    const fetchScenes = async () => {
      // If static scenes are provided, use them instead of fetching from API
      if (staticScenes && Array.isArray(staticScenes)) {
        console.log('Using static scenes:', staticScenes);
        setScenes(staticScenes);
        setCurrentSceneIndex(0);
        setLoading(false);
        return;
      }

      if (!roomId) {
        console.log('No roomId provided');
        setLoading(false);
        setError('No room ID provided');
        return;
      }

      try {
        console.log('Fetching scenes for roomId:', roomId);
        setLoading(true);
        setError(null);
        // Fetch scenes for the given roomId
        const response = await axios.get(`${Backendurl}/api/scenes/rooms/${roomId}`);
        console.log('API Response:', response.data);
        
        if (response.data && response.data.success && response.data.data && response.data.data.length > 0) {
          console.log('Setting scenes:', response.data.data);
          setScenes(response.data.data);
          setCurrentSceneIndex(0);
        } else {
          console.log('No scenes found in response');
          setScenes([]);
          setCurrentSceneIndex(0);
          setError('No 360° views available for this room');
        }
      } catch (err) {
        console.error('Error fetching scenes:', err);
        console.error('Error details:', err.response?.data);
        setError(err.response?.data?.message || 'Failed to load 360° view');
      } finally {
        setLoading(false);
      }
    };

    fetchScenes();
  }, [roomId, staticScenes]);

  const navigateToScene = (direction) => {
    if (scenes.length <= 1) return;
    
    if (direction === 'next') {
      setCurrentSceneIndex((prev) => (prev + 1) % scenes.length);
    } else if (direction === 'prev') {
      setCurrentSceneIndex((prev) => (prev - 1 + scenes.length) % scenes.length);
    }
  };

  const goToScene = (index) => {
    if (index >= 0 && index < scenes.length) {
      setCurrentSceneIndex(index);
    }
  };

  useEffect(() => {
    if (!currentScene || !mountRef.current) {
      console.log('No current scene or mount ref:', { currentScene, mountRef: !!mountRef.current });
      return;
    }

    console.log('Initializing Three.js scene with:', currentScene);
    let scene, camera, renderer, controls, sphereMesh;
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const yawPitchToVector3 = (yawDeg, pitchDeg, radius = 490) => {
      const yaw = THREE.MathUtils.degToRad(yawDeg);
      const pitch = THREE.MathUtils.degToRad(pitchDeg);
      const x = radius * Math.cos(pitch) * Math.sin(yaw);
      const y = radius * Math.sin(pitch);
      const z = radius * Math.cos(pitch) * Math.cos(yaw);
      return new THREE.Vector3(x, y, z);
    };

    const init = () => {
      console.log('Initializing Three.js scene');
      scene = new THREE.Scene();

      const width = mountRef.current.clientWidth;
      const height = mountRef.current.clientHeight;

      camera = new THREE.PerspectiveCamera(75, width / height, 1, 1100);
      camera.position.set(0, 0, 0.1);

      renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(width, height);
      mountRef.current.appendChild(renderer.domElement);

      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableZoom = false;
      controls.enablePan = false;

      loadScene(currentScene);

      window.addEventListener('resize', onResize);
      window.addEventListener('click', onClick);
    };

    const loadScene = (sceneData) => {
      if (!sceneData) {
        console.log('No scene data provided to loadScene');
        return;
      }

      console.log('Loading scene:', sceneData);

      if (sphereMesh) {
        scene.remove(sphereMesh);
        sphereMesh.geometry.dispose();
        sphereMesh.material.dispose();
      }

      hotspotObjects.current.forEach(obj => scene.remove(obj));
      hotspotObjects.current = [];

      const loader = new THREE.TextureLoader();
      
      // Always use the proxy endpoint to avoid CORS issues
      const imageUrl = `${Backendurl}/api/scenes/proxy-image?url=${encodeURIComponent(sceneData.image_url)}`;
      console.log('Loading texture from proxy:', imageUrl);
      
      // Skip validation for static scenes to avoid double loading
      if (!staticScenes) {
        // First check if the image is accessible (only for API scenes)
        fetch(imageUrl)
          .then(response => {
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.blob();
          })
          .then(blob => {
            console.log('Image blob loaded:', blob.type, blob.size);
            if (!blob.type.startsWith('image/')) {
              throw new Error('Invalid image format');
            }
            // Create an image element to check dimensions
            const img = new Image();
            img.onload = () => {
              console.log('Image dimensions:', img.width, 'x', img.height);
              // Check if image has 2:1 aspect ratio (typical for 360° panoramas)
              const aspectRatio = img.width / img.height;
              console.log('Image aspect ratio:', aspectRatio);
              if (Math.abs(aspectRatio - 2) > 0.1) {
                console.warn('Image may not be a valid 360° panorama - aspect ratio should be close to 2:1');
                setError('Warning: Image may not be a valid 360° panorama. Expected 2:1 aspect ratio.');
              }
            };
            img.onerror = () => {
              throw new Error('Failed to load image');
            };
            img.src = URL.createObjectURL(blob);
          })
          .catch(error => {
            console.error('Error validating image:', error);
            setError(`Failed to load panorama image: ${error.message}`);
          });
      }

      loader.load(
        imageUrl,
        texture => {
          console.log('Texture loaded successfully');
          const geometry = new THREE.SphereGeometry(500, 60, 40);
          geometry.scale(-1, 1, 1);
          const material = new THREE.MeshBasicMaterial({ map: texture });
          sphereMesh = new THREE.Mesh(geometry, material);
          scene.add(sphereMesh);
          console.log('Sphere mesh added to scene');

          (sceneData.hotspots || []).forEach(hs => {
            const pos = yawPitchToVector3(hs.yaw, hs.pitch);
            const geo = new THREE.SphereGeometry(25, 16, 16);
            const mat = new THREE.MeshBasicMaterial({ color: 0xffffff });
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.copy(pos);
            mesh.userData.target = hs.target;
            scene.add(mesh);
            hotspotObjects.current.push(mesh);
          });
        },
        xhr => {
          console.log('Texture loading progress:', (xhr.loaded / xhr.total * 100) + '%');
        },
        error => {
          console.error('Error loading texture:', error);
          console.error('Error details:', {
            message: error.message,
            type: error.type,
            target: error.target
          });
          setError(`Failed to load panorama image: ${error.message || 'Unknown error'}`);
        }
      );
    };

    const onClick = (event) => {
      if (!mountRef.current) return; // Add null check
      
      const rect = mountRef.current.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(hotspotObjects.current);
      if (intersects.length > 0) {
        const target = intersects[0].object.userData.target;
        const nextScene = scenes.find(s => s.name === target);
        if (nextScene) {
          const nextIndex = scenes.indexOf(nextScene);
          setCurrentSceneIndex(nextIndex);
        }
      }
    };

    const onResize = () => {
      if (!mountRef.current) return;
      const width = mountRef.current.clientWidth;
      const height = mountRef.current.clientHeight;
      
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };

    init();
    animate();

    return () => {
      console.log('Cleaning up Three.js scene');
      if (mountRef.current && renderer) {
        mountRef.current.removeChild(renderer.domElement);
      }
      window.removeEventListener('resize', onResize);
      window.removeEventListener('click', onClick);
    };
  }, [currentScene, scenes, staticScenes]);

  if (loading) {
    return <div className={className}><div className="flex items-center justify-center h-full">Loading 360° view...</div></div>;
  }

  if (error) {
    return <div className={className}><div className="flex items-center justify-center h-full text-red-500">{error}</div></div>;
  }

  if (!scenes.length) {
    return <div className={className}><div className="flex items-center justify-center h-full">No 360° views available</div></div>;
  }

  return (
    <div className={`relative ${className}`}>
      <div ref={mountRef} className="w-full h-full" />
      
      {/* Navigation Controls */}
      {scenes.length > 1 && (
        <>
          {/* Left Arrow */}
          <button
            onClick={() => navigateToScene('prev')}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-all duration-200 z-10"
            title="Previous scene"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          {/* Right Arrow */}
          <button
            onClick={() => navigateToScene('next')}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-all duration-200 z-10"
            title="Next scene"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Scene Indicators */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {scenes.map((_, index) => (
              <button
                key={index}
                onClick={() => goToScene(index)}
                className={`w-3 h-3 rounded-full transition-all duration-200 ${
                  index === currentSceneIndex 
                    ? 'bg-white shadow-lg' 
                    : 'bg-white/50 hover:bg-white/70'
                }`}
                title={`Scene ${index + 1}`}
              />
            ))}
          </div>

          {/* Scene Counter */}
          <div className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm z-10">
            {currentSceneIndex + 1} / {scenes.length}
          </div>
        </>
      )}
    </div>
  );
}