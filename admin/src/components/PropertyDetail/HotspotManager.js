import React, { useState, useEffect } from 'react';
import { Box, Button, Typography, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Grid, Card, CardContent, IconButton } from '@mui/material';
import { Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import { toast } from 'react-toastify';
import axios from 'axios';

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

  return (
    <Dialog open={true} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Manage Hotspots for Scene</DialogTitle>
      <DialogContent>
        {scene && (
          <Box sx={{ mb: 3 }}>
            <img 
              src={scene.image_url} 
              alt="Scene Preview" 
              style={{ 
                width: '100%', 
                height: '300px', 
                objectFit: 'cover',
                borderRadius: '8px'
              }} 
            />
            <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
              Scene ID: {scene.id} | Hotspots: {hotspots.length}
            </Typography>
          </Box>
        )}

        <Box sx={{ mb: 3 }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setIsAddingHotspot(!isAddingHotspot)}
            sx={{ mb: 2 }}
          >
            {isAddingHotspot ? 'Cancel Adding Hotspot' : 'Add New Hotspot'}
          </Button>

          {isAddingHotspot && (
            <Box sx={{ p: 2, border: '1px solid #ddd', borderRadius: '8px', mb: 2 }}>
              <Typography variant="h6" gutterBottom>
                Add New Hotspot
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    label="Yaw (degrees)"
                    type="number"
                    value={newHotspot.yaw}
                    onChange={(e) => setNewHotspot({ ...newHotspot, yaw: parseFloat(e.target.value) || 0 })}
                    fullWidth
                    inputProps={{ step: 0.1 }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="Pitch (degrees)"
                    type="number"
                    value={newHotspot.pitch}
                    onChange={(e) => setNewHotspot({ ...newHotspot, pitch: parseFloat(e.target.value) || 0 })}
                    fullWidth
                    inputProps={{ step: 0.1 }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Target Scene ID"
                    value={newHotspot.target}
                    onChange={(e) => setNewHotspot({ ...newHotspot, target: e.target.value })}
                    fullWidth
                    placeholder="Enter the ID of the scene to navigate to"
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button variant="contained" onClick={handleAddHotspot} fullWidth>
                    Save Hotspot
                  </Button>
                </Grid>
              </Grid>
            </Box>
          )}
        </Box>

        <Typography variant="h6" gutterBottom>
          Existing Hotspots ({hotspots.length})
        </Typography>
        
        {hotspots.length === 0 ? (
          <Typography color="textSecondary" sx={{ textAlign: 'center', py: 4 }}>
            No hotspots configured for this scene
          </Typography>
        ) : (
          <Grid container spacing={2}>
            {hotspots.map((hotspot) => (
              <Grid item xs={12} sm={6} key={hotspot.id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" color="textSecondary">
                          Yaw: {hotspot.yaw.toFixed(2)}°
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Pitch: {hotspot.pitch.toFixed(2)}°
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          <strong>Target:</strong> {hotspot.target}
                        </Typography>
                      </Box>
                      <IconButton
                        color="error"
                        size="small"
                        onClick={() => handleDeleteHotspot(hotspot.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default HotspotManager; 