import React from "react";
import { features } from "../assets/featuredata";

const FeaturesDetail = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-24">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <span className="bg-blue-50 text-blue-600 px-4 py-1.5 rounded-full text-sm font-medium tracking-wide uppercase">Our Strengths</span>
          <h1 className="text-5xl font-bold text-gray-900 mt-6 mb-6">Why Choose Us</h1>
          <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-indigo-600 mx-auto mb-8 rounded-full"></div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            We're committed to providing exceptional service and finding the
            perfect home for you with our innovative approach
          </p>
        </div>

        <div className="space-y-32">
          {features.map((feature, index) => (
            <div
              key={index}
              id={`feature-${index}`}
              className="scroll-mt-32"
            >
              <div className="flex flex-col md:flex-row items-start gap-12">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl flex items-center justify-center">
                    <feature.icon className="h-8 w-8 text-blue-600" />
                  </div>
                </div>

                <div className="flex-1">
                  <h2 className="text-4xl font-bold text-gray-900 mb-6">
                    {feature.title}
                  </h2>
                  
                  <div className="prose prose-lg max-w-none text-gray-600">
                    <p className="leading-relaxed text-lg">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </div>

              {index < features.length - 1 && (
                <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent mt-16"></div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FeaturesDetail; 