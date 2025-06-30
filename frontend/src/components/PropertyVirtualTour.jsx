import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import axios from "axios";
import { Backendurl } from "../App";

const PropertyVirtualTour = ({ propertyId }) => {
  const [scenes, setScenes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);

  useEffect(() => {
    if (propertyId) {
      fetchPropertyScenes();
    }
  }, [propertyId]);

  const fetchPropertyScenes = async () => {
    try {
      setLoading(true);

      // Check if user is authenticated
      const token = localStorage.getItem("token");
      if (!token) {
        setScenes([]);
        setLoading(false);
        return;
      }

      const response = await axios.get(
        `${Backendurl}/api/scenes/properties/${propertyId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        setScenes(response.data.data);
      } else {
        console.error(
          "Failed to fetch property scenes:",
          response.data.message
        );
        setScenes([]);
      }
    } catch (error) {
      console.error("Error fetching property scenes:", error);
      // Don't show toast for authentication errors
      if (error.response?.status !== 401 && error.response?.status !== 403) {
        const errorMessage =
          error.response?.data?.message || "Failed to load virtual tour";
        toast.error(errorMessage);
      }
      setScenes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSceneClick = (sceneId) => {
    // Navigate to the scene viewer
    window.open(`/scene-viewer/${sceneId}`, "_blank");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-2 text-gray-600">Loading virtual tour...</span>
      </div>
    );
  }

  if (scenes.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-400 mb-4">
          <svg
            className="mx-auto h-12 w-12"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No Virtual Tour Available
        </h3>
        <p className="text-gray-500">
          This property doesn't have any 360° scenes uploaded yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Virtual Tour</h3>
        <span className="text-sm text-gray-500">
          {scenes.length} scene{scenes.length !== 1 ? "s" : ""} available
        </span>
      </div>

      {/* Main Scene Display */}
      <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
        {scenes[currentSceneIndex] && (
          <img
            src={scenes[currentSceneIndex].image_url}
            alt={
              scenes[currentSceneIndex].name || `Scene ${currentSceneIndex + 1}`
            }
            className="w-full h-full object-cover cursor-pointer"
            onClick={() => handleSceneClick(scenes[currentSceneIndex].id)}
          />
        )}

        {/* Scene Navigation */}
        {scenes.length > 1 && (
          <>
            <button
              onClick={() =>
                setCurrentSceneIndex((prev) =>
                  prev === 0 ? scenes.length - 1 : prev - 1
                )
              }
              className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-all"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <button
              onClick={() =>
                setCurrentSceneIndex((prev) =>
                  prev === scenes.length - 1 ? 0 : prev + 1
                )
              }
              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-all"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </>
        )}

        {/* Scene Info Overlay */}
        <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded">
          <span className="text-sm">
            {scenes[currentSceneIndex]?.name ||
              `Scene ${currentSceneIndex + 1}`}
          </span>
        </div>
      </div>

      {/* Scene Thumbnails */}
      {scenes.length > 1 && (
        <div className="grid grid-cols-4 gap-2">
          {scenes.map((scene, index) => (
            <button
              key={scene.id}
              onClick={() => setCurrentSceneIndex(index)}
              className={`relative aspect-video rounded-lg overflow-hidden border-2 transition-all ${
                index === currentSceneIndex
                  ? "border-blue-500 ring-2 ring-blue-200"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <img
                src={scene.image_url}
                alt={scene.name || `Scene ${index + 1}`}
                className="w-full h-full object-cover"
              />
              {index === currentSceneIndex && (
                <div className="absolute inset-0 bg-blue-500 bg-opacity-20 flex items-center justify-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Interactive Tour Button */}
      <div className="text-center">
        <button
          onClick={() => handleSceneClick(scenes[currentSceneIndex]?.id)}
          className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
          Start Interactive Tour
        </button>
        <p className="text-sm text-gray-500 mt-2">
          Click to open the full 360° interactive experience
        </p>
      </div>
    </div>
  );
};

export default PropertyVirtualTour;
