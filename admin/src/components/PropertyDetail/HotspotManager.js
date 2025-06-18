import React, { useState, useEffect } from 'react';
import { Box, Button, Typography, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';
import { toast } from 'react-toastify';
import axios from 'axios';
import Pannellum from 'pannellum-react';

const HotspotManager = ({ scene, onClose }) => {
  const [hotspots, setHotspots] = useState([]);
  const [newHotspot, setNewHotspot] = useState({ yaw: 0, pitch: 0, target: '' });
  const [isAddingHotspot, setIsAddingHotspot] = useState(false);

  useEffect(() => {
    if (scene) {
      setHotspots(scene.hotspots || []);
    }
  }, [scene]);

  const handleAddHotspot = async () => {
    try {
      const response = await axios.post(`/api/scenes/${scene.id}/hotspots`, newHotspot);
      setHotspots([...hotspots, response.data.data]);
      setNewHotspot({ yaw: 0, pitch: 0, target: '' });
      setIsAddingHotspot(false);
      toast.success('Hotspot added successfully');
    } catch (error) {
      toast.error('Failed to add hotspot');
      console.error('Error adding hotspot:', error);
    }
  };

  const handleDeleteHotspot = async (hotspotId) => {
    try {
      await axios.delete(`/api/scenes/${scene.id}/hotspots/${hotspotId}`);
      setHotspots(hotspots.filter(h => h.id !== hotspotId));
      toast.success('Hotspot deleted successfully');
    } catch (error) {
      toast.error('Failed to delete hotspot');
      console.error('Error deleting hotspot:', error);
    }
  };

  const handleClick = (event) => {
    if (!isAddingHotspot) return;
    
    const { yaw, pitch } = event;
    setNewHotspot({ ...newHotspot, yaw, pitch });
  };

  return (
    <Dialog open={true} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Manage Hotspots</DialogTitle>
      <DialogContent>
        <Box sx={{ height: 400, position: 'relative' }}>
          <Pannellum
            width="100%"
            height="100%"
            image={scene.image_url}
            pitch={0}
            yaw={0}
            hfov={100}
            autoLoad
            onLoad={() => console.log('panorama loaded')}
            hotspotDebug={true}
            onHotspotClick={handleClick}
          />
        </Box>

        <Box sx={{ mt: 2 }}>
          <Button
            variant="contained"
            onClick={() => setIsAddingHotspot(!isAddingHotspot)}
            sx={{ mb: 2 }}
          >
            {isAddingHotspot ? 'Cancel Adding Hotspot' : 'Add New Hotspot'}
          </Button>

          {isAddingHotspot && (
            <Box sx={{ mb: 2 }}>
              <TextField
                label="Target Scene ID"
                value={newHotspot.target}
                onChange={(e) => setNewHotspot({ ...newHotspot, target: e.target.value })}
                fullWidth
                sx={{ mb: 1 }}
              />
              <Button variant="contained" onClick={handleAddHotspot}>
                Save Hotspot
              </Button>
            </Box>
          )}

          <Typography variant="h6" gutterBottom>
            Existing Hotspots
          </Typography>
          {hotspots.map((hotspot) => (
            <Box key={hotspot.id} sx={{ mb: 1, p: 1, border: '1px solid #ddd' }}>
              <Typography>Yaw: {hotspot.yaw.toFixed(2)}°</Typography>
              <Typography>Pitch: {hotspot.pitch.toFixed(2)}°</Typography>
              <Typography>Target: {hotspot.target}</Typography>
              <Button
                color="error"
                size="small"
                onClick={() => handleDeleteHotspot(hotspot.id)}
              >
                Delete
              </Button>
            </Box>
          ))}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default HotspotManager; 