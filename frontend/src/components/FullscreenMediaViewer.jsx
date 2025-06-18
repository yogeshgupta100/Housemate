import React, { useRef, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Maximize, X } from "lucide-react";
import GeneralModal from "./GeneralModal.jsx";

const FullscreenMediaViewer = ({ open, onClose, mediaGallery, startIndex = 0 }) => {
  const [currentIndex, setCurrentIndex] = useState(startIndex);
  const fullViewMediaRef = useRef(null);

  useEffect(() => {
    if (open) setCurrentIndex(startIndex);
  }, [open, startIndex]);

  const handleGoFullscreen = () => {
    if (fullViewMediaRef.current) {
      if (fullViewMediaRef.current.requestFullscreen) {
        fullViewMediaRef.current.requestFullscreen();
      } else if (fullViewMediaRef.current.webkitRequestFullscreen) {
        fullViewMediaRef.current.webkitRequestFullscreen();
      } else if (fullViewMediaRef.current.mozRequestFullScreen) {
        fullViewMediaRef.current.mozRequestFullScreen();
      } else if (fullViewMediaRef.current.msRequestFullscreen) {
        fullViewMediaRef.current.msRequestFullscreen();
      }
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <GeneralModal open={open} onClose={onClose}>
          <div
            ref={fullViewMediaRef}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90 select-none"
            style={{ padding: 0 }}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'ArrowLeft') {
                setCurrentIndex((currentIndex - 1 + mediaGallery.length) % mediaGallery.length);
              } else if (e.key === 'ArrowRight') {
                setCurrentIndex((currentIndex + 1) % mediaGallery.length);
              } else if (e.key === 'Escape') {
                onClose();
              } else if (e.key.toLowerCase() === 'f') {
                handleGoFullscreen();
              }
            }}
            onDoubleClick={handleGoFullscreen}
            autoFocus
          >
            {/* Top-right close button */}
            <button
              className="absolute top-4 right-4 text-white bg-black/60 rounded-full p-2 hover:bg-black/80 z-50"
              onClick={onClose}
              title="Close"
            >
              <X className="w-6 h-6" />
            </button>
            {/* Left/Right navigation */}
            {mediaGallery.length > 1 && (
              <>
                <button
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white bg-black/60 rounded-full p-2 hover:bg-black/80 z-50"
                  onClick={() => setCurrentIndex((currentIndex - 1 + mediaGallery.length) % mediaGallery.length)}
                  title="Previous"
                >
                  <ChevronLeft className="w-8 h-8" />
                </button>
                <button
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white bg-black/60 rounded-full p-2 hover:bg-black/80 z-50"
                  onClick={() => setCurrentIndex((currentIndex + 1) % mediaGallery.length)}
                  title="Next"
                >
                  <ChevronRight className="w-8 h-8" />
                </button>
              </>
            )}
            <div className="flex items-center justify-center w-screen h-screen">
              <div className="w-full h-full flex items-center justify-center relative">
                {mediaGallery[currentIndex]?.type === "image" ? (
                  <img
                    src={mediaGallery[currentIndex].url}
                    alt={`Full Media ${currentIndex + 1}`}
                    className="max-w-full max-h-screen object-contain"
                    style={{ cursor: 'zoom-in' }}
                    onDoubleClick={handleGoFullscreen}
                  />
                ) : (
                  <video
                    src={mediaGallery[currentIndex].url}
                    controls
                    className="max-w-full max-h-screen object-contain bg-black"
                    style={{ background: 'black' }}
                  />
                )}
                {/* Bottom center controls */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-black/60 rounded-full px-4 py-2 z-50">
                  {mediaGallery.length > 1 && (
                    <>
                      <button
                        onClick={() => setCurrentIndex((currentIndex - 1 + mediaGallery.length) % mediaGallery.length)}
                        className="text-white hover:text-blue-300 p-1"
                        title="Previous"
                      >
                        <ChevronLeft className="w-6 h-6" />
                      </button>
                    </>
                  )}
                  <span className="text-white text-sm select-none">
                    {currentIndex + 1} / {mediaGallery.length}
                  </span>
                  {mediaGallery.length > 1 && (
                    <>
                      <button
                        onClick={() => setCurrentIndex((currentIndex + 1) % mediaGallery.length)}
                        className="text-white hover:text-blue-300 p-1"
                        title="Next"
                      >
                        <ChevronRight className="w-6 h-6" />
                      </button>
                    </>
                  )}
                  <button
                    onClick={handleGoFullscreen}
                    className="text-white hover:text-blue-300 p-1"
                    title="Go Fullscreen (F)"
                  >
                    <Maximize className="w-6 h-6" />
                  </button>
                  <button
                    onClick={onClose}
                    className="text-white hover:text-red-400 p-1"
                    title="Close (Esc)"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </GeneralModal>
      )}
    </AnimatePresence>
  );
};

export default FullscreenMediaViewer; 