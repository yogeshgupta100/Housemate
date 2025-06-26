import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, X, Maximize, Minimize } from 'lucide-react';
import axios from 'axios';
import { Backendurl } from '../App';
import PanoramaViewer from '../components/PanoramaViewer';

const SceneViewer = () => {
  const { sceneId } = useParams();
  const navigate = useNavigate();
  const [scene, setScene] = useState(null);
  const [scenes, setScenes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (sceneId) {
      fetchScene();
    }
  }, [sceneId]);

  const fetchScene = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${Backendurl}/api/scenes/${sceneId}`);
      
      if (response.data.success) {
        const sceneData = response.data.data;
        setScene(sceneData);
        
        // Determine if this is a room-based or property-based scene
        if (sceneData.room_id) {
          // Room-based scene - fetch all scenes for this room
          try {
            const roomScenesResponse = await axios.get(`${Backendurl}/api/scenes/rooms/${sceneData.room_id}`);
            if (roomScenesResponse.data.success) {
              setScenes(roomScenesResponse.data.data);
            }
          } catch (roomError) {
            console.error('Error fetching room scenes:', roomError);
            // If we can't fetch room scenes, just use the single scene
            setScenes([sceneData]);
          }
        } else if (sceneData.property_id) {
          // Property-based scene - fetch all scenes for this property
          try {
            const propertyScenesResponse = await axios.get(`${Backendurl}/api/scenes/properties/${sceneData.property_id}`);
            if (propertyScenesResponse.data.success) {
              setScenes(propertyScenesResponse.data.data);
            }
          } catch (propertyError) {
            console.error('Error fetching property scenes:', propertyError);
            const errorMessage = propertyError.response?.data?.message || 'Failed to fetch property scenes';
            toast.error(errorMessage);
            // If we can't fetch property scenes, just use the single scene
            setScenes([sceneData]);
          }
        } else {
          // Fallback - just use the single scene
          setScenes([sceneData]);
        }
      } else {
        setError('Scene not found');
      }
    } catch (error) {
      console.error('Error fetching scene:', error);
      setError('Failed to load scene');
    } finally {
      setLoading(false);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      });
    }
  };

  const handleBack = () => {
    if (isFullscreen) {
      document.exitFullscreen();
    }
    navigate(-1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading 360° view...</p>
        </div>
      </div>
    );
  }

  if (error || !scene) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-center">
          <p className="text-red-400 mb-4">{error || 'Scene not found'}</p>
          <button
            onClick={handleBack}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black relative">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-50 bg-black bg-opacity-50 text-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Back
            </button>
            <div>
              <h1 className="text-lg font-semibold">
                {scene.name || `Scene ${scene.id}`}
              </h1>
              <p className="text-sm text-gray-300">
                {scene.room_id ? 'Room Tour' : 'Property Tour'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={toggleFullscreen}
              className="hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
              title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            >
              {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
            </button>
            <button
              onClick={handleBack}
              className="hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* 360° Viewer */}
      <div className="w-full h-screen">
        {scene.room_id ? (
          <PanoramaViewer 
            roomId={scene.room_id} 
            className="w-full h-full"
          />
        ) : (
          <PanoramaViewer 
            staticScenes={scenes}
            className="w-full h-full"
          />
        )}
      </div>

      {/* Instructions */}
      <div className="absolute bottom-4 left-4 z-50 bg-black bg-opacity-50 text-white p-3 rounded-lg max-w-sm">
        <h3 className="font-semibold mb-2">How to Navigate</h3>
        <ul className="text-sm space-y-1">
          <li>• Click and drag to look around</li>
          <li>• Scroll to zoom in/out</li>
          <li>• Click hotspots to navigate between scenes</li>
          {scenes.length > 1 && (
            <li>• Use arrow buttons to switch scenes</li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default SceneViewer; 