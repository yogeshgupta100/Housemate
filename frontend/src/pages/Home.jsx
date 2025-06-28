import React from "react";
import Hero from "../components/Hero";
import Companies from "../components/Companies";
import Features from "../components/Features";
import Properties from "../components/propertiesshow";
import Steps from "../components/Steps";
import Testimonials from "../components/testimonial";
import Blog from "../components/Blog";
import PanoramaViewer from "../components/PanoramaViewer";

const Home = () => {
  // Static 360° scenes for the home page
  const staticScenes = [
    {
      id: 5,
      image_url:
        "https://housemateone.s3.us-east-1.amazonaws.com/documents/1750403025623-Property_360_Home1.jpeg",
      room_id: 19,
      created_at: "2025-06-20T07:03:48.989Z",
      hotspots: [],
    },
    {
      id: 6,
      image_url:
        "https://housemateone.s3.us-east-1.amazonaws.com/documents/1750403035792-Property_360_Home2.jpeg",
      room_id: 19,
      created_at: "2025-06-20T07:03:58.207Z",
      hotspots: [],
    },
    {
      id: 7,
      image_url:
        "https://housemateone.s3.us-east-1.amazonaws.com/documents/1750403078428-Property_360_Home3.jpeg",
      room_id: 19,
      created_at: "2025-06-20T07:04:41.858Z",
      hotspots: [],
    },
  ];

  return (
    <div>
      <Hero />
      {/* <Companies /> */}
      <Features />
      <div className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Experience Our Properties in 360°
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Take a virtual tour of our premium properties and explore every
              corner from the comfort of your home.
            </p>
          </div>
          <PanoramaViewer
            staticScenes={staticScenes}
            className="w-full h-[600px] rounded-xl shadow-lg"
          />
        </div>
      </div>
      <Properties />
      <Steps />
      {/* <Testimonials /> */}
      <Blog />
    </div>
  );
};

export default Home;
