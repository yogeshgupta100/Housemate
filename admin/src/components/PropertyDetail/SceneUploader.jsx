import React, { useState, useEffect } from 'react';
import { Box, Button, Typography, Grid, Card, CardContent, IconButton } from '@mui/material';
import { Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import { toast } from 'react-toastify';
import axios from 'axios';
import { backendurl } from '../../App';

const SceneUploader = ({ propertyId, roomId }) => {
  const [scenes, setScenes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (roomId) {
      fetchScenes();
    }
  }, [roomId]);

  const fetchScenes = async () => {
    if (!roomId) return;
    
    try {
      setLoading(true);
      const response = await axios.get(`${backendurl}/api/scenes/rooms/${roomId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      setScenes(response.data.data);
    } catch (error) {
      toast.error('Failed to fetch scenes');
      console.error('Error fetching scenes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event) => {
    if (!roomId) {
      toast.error('Please select a room first');
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
        `${backendurl}/api/scenes/rooms/${roomId}`,
        {
          image: uploadResponse.data.url
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      toast.success('Scene uploaded successfully');
      fetchScenes();
    } catch (error) {
      toast.error('Failed to upload scene');
      console.error('Error uploading scene:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteScene = async (sceneId) => {
    if (!roomId) return;

    try {
      await axios.delete(`${backendurl}/api/scenes/${sceneId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      toast.success('Scene deleted successfully');
      fetchScenes();
    } catch (error) {
      toast.error('Failed to delete scene');
      console.error('Error deleting scene:', error);
    }
  };

  if (!roomId) {
    return null;
  }

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h6" gutterBottom>
        360° Scene Management
      </Typography>

      <Box sx={{ mb: 3 }}>
        <input
          accept="image/*"
          style={{ display: 'none' }}
          id="scene-upload"
          type="file"
          onChange={handleFileUpload}
          disabled={uploading}
        />
        <label htmlFor="scene-upload">
          <Button
            variant="contained"
            component="span"
            startIcon={<AddIcon />}
            disabled={uploading}
          >
            Upload New Scene
          </Button>
        </label>
      </Box>

      <Grid container spacing={2}>
        {scenes.map((scene) => (
          <Grid item xs={12} sm={6} md={4} key={scene.id}>
            <Card>
              <CardContent>
                <Box sx={{ position: 'relative', paddingTop: '56.25%' }}>
                  <img
                    src={scene.image_url}
                    alt={`Scene ${scene.id}`}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                </Box>
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">
                    Hotspots: {scene.hotspots?.length || 0}
                  </Typography>
                  <IconButton
                    color="error"
                    onClick={() => handleDeleteScene(scene.id)}
                    size="small"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default SceneUploader; 