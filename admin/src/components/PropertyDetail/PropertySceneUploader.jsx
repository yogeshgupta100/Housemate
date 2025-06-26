import React, { useState, useEffect } from 'react';
import { Box, Button, Typography, Grid, Card, CardContent, IconButton, TextField } from '@mui/material';
import { Delete as DeleteIcon, Add as AddIcon, Upload as UploadIcon } from '@mui/icons-material';
import { toast } from 'react-toastify';
import axios from 'axios';
import { backendurl } from '../../App';

const PropertySceneUploader = ({ propertyId }) => {
  const [scenes, setScenes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [sceneName, setSceneName] = useState('');

  useEffect(() => {
    if (propertyId) {
      fetchScenes();
    }
  }, [propertyId]);

  const fetchScenes = async () => {
    if (!propertyId) return;
    
    try {
      setLoading(true);
      const response = await axios.get(`${backendurl}/api/scenes/properties/${propertyId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      setScenes(response.data.data);
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch property scenes';
      toast.error(errorMessage);
      console.error('Error fetching property scenes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event) => {
    if (!propertyId) {
      toast.error('Please select a property first');
      return;
    }

    const file = event.target.files[0];
    if (!file) return;

    try {
      setUploading(true);
      
      // First upload the image to S3
      const formData = new FormData();
      formData.append('pdf', file); // Using 'pdf' as the field name to match the frontend

      const uploadResponse = await axios.post(
        `${backendurl}/api/pg/upload`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (!uploadResponse.data.success) {
        throw new Error('Failed to upload image to S3');
      }

      // Then create the scene with the S3 URL
      const sceneResponse = await axios.post(
        `${backendurl}/api/scenes/properties/${propertyId}`,
        {
          image: uploadResponse.data.url,
          name: sceneName || `Scene ${scenes.length + 1}`
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      toast.success('Property scene uploaded successfully');
      setSceneName('');
      fetchScenes();
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to upload property scene';
      toast.error(errorMessage);
      console.error('Error uploading property scene:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteScene = async (sceneId) => {
    if (!propertyId) return;

    try {
      await axios.delete(`${backendurl}/api/scenes/${sceneId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      toast.success('Property scene deleted successfully');
      fetchScenes();
    } catch (error) {
      toast.error('Failed to delete property scene');
      console.error('Error deleting property scene:', error);
    }
  };

  if (!propertyId) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" color="text.secondary">
          Please select a property to manage 360° scenes
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        360° Property Scenes
      </Typography>
      
      <Box sx={{ mb: 3, p: 2, border: '2px dashed #ccc', borderRadius: 2 }}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Upload 360° panoramic images for this property
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
          <TextField
            label="Scene Name (optional)"
            value={sceneName}
            onChange={(e) => setSceneName(e.target.value)}
            placeholder="e.g., Living Room, Kitchen, etc."
            size="small"
            sx={{ flexGrow: 1 }}
          />
          
          <Button
            variant="contained"
            component="label"
            startIcon={<UploadIcon />}
            disabled={uploading}
            sx={{ minWidth: 120 }}
          >
            {uploading ? 'Uploading...' : 'Upload Scene'}
            <input
              type="file"
              hidden
              accept="image/*"
              onChange={handleFileUpload}
              disabled={uploading}
            />
          </Button>
        </Box>
        
        {uploading && (
          <Typography variant="body2" color="primary">
            Uploading scene...
          </Typography>
        )}
      </Box>

      {loading ? (
        <Typography>Loading scenes...</Typography>
      ) : (
        <Grid container spacing={2}>
          {scenes.map((scene) => (
            <Grid item xs={12} sm={6} md={4} key={scene.id}>
              <Card>
                <CardContent>
                  <Box sx={{ position: 'relative' }}>
                    <img
                      src={scene.image_url}
                      alt={scene.name || 'Property Scene'}
                      style={{
                        width: '100%',
                        height: 200,
                        objectFit: 'cover',
                        borderRadius: 8
                      }}
                    />
                    <IconButton
                      onClick={() => handleDeleteScene(scene.id)}
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        backgroundColor: 'rgba(255, 255, 255, 0.8)',
                        '&:hover': {
                          backgroundColor: 'rgba(255, 255, 255, 0.9)'
                        }
                      }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                  <Typography variant="subtitle2" sx={{ mt: 1 }}>
                    {scene.name || `Scene ${scene.id}`}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {scene.hotspots?.length || 0} hotspots
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
          
          {scenes.length === 0 && (
            <Grid item xs={12}>
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body2" color="text.secondary">
                  No 360° scenes uploaded yet. Upload your first scene above.
                </Typography>
              </Box>
            </Grid>
          )}
        </Grid>
      )}
    </Box>
  );
};

export default PropertySceneUploader; 