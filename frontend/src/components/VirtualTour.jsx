import React, { useState, useEffect } from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import Pannellum from 'pannellum-react';
import axios from 'axios';

const VirtualTour = ({ roomId }) => {
  const [scenes, setScenes] = useState([]);
  const [currentScene, setCurrentScene] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchScenes();
  }, [roomId]);

  const fetchScenes = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/scenes/rooms/${roomId}`);
      const scenesData = response.data.data;
      setScenes(scenesData);
      if (scenesData.length > 0) {
        setCurrentScene(scenesData[0]);
      }
    } catch (error) {
      console.error('Error fetching scenes:', error);
      setError('Failed to load virtual tour');
    } finally {
      setLoading(false);
    }
  };

  const handleHotspotClick = (target) => {
    const nextScene = scenes.find(scene => scene.id === target);
    if (nextScene) {
      setCurrentScene(nextScene);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  if (!currentScene) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>No virtual tour available for this room</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', height: '500px', position: 'relative' }}>
      <Pannellum
        width="100%"
        height="100%"
        image={currentScene.image_url}
        pitch={0}
        yaw={0}
        hfov={100}
        autoLoad
        onLoad={() => console.log('panorama loaded')}
        hotspotDebug={false}
        hotspots={currentScene.hotspots?.map(hotspot => ({
          pitch: hotspot.pitch,
          yaw: hotspot.yaw,
          type: 'info',
          text: 'Click to move to next scene',
          URL: hotspot.target
        }))}
        onHotspotClick={handleHotspotClick}
      />
    </Box>
  );
};

export default VirtualTour; 