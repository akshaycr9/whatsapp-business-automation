import React, { useState, useEffect, useRef, useCallback } from "react";
import { FileText, AlertCircle } from "lucide-react";
import Lightbox from "yet-another-react-lightbox";
import VideoPlugin from "yet-another-react-lightbox/plugins/video";
import "yet-another-react-lightbox/styles.css";
import { MediaSkeleton } from "./MediaSkeleton";
import type { MessageType } from "@/types";

interface MediaContainerProps {
  mediaId: string | null;
  type: MessageType;
  caption?: string;
  mediaMimeType?: string;
}

export const MediaContainer = React.memo(function MediaContainer({
  mediaId,
  type,
  caption,
  mediaMimeType,
}: MediaContainerProps) {
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const hasTriedFetchRef = useRef(false);

  // IntersectionObserver: Lazy load media only when element is visible
  useEffect(() => {
    // If no mediaId, nothing to load
    if (!mediaId) {
      setIsLoading(false);
      return;
    }

    // If no container element, can't observe
    if (!containerRef.current) {
      return;
    }

    // Reset fetch flag when mediaId changes
    hasTriedFetchRef.current = false;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Load media when element is visible and we haven't tried yet
        if (entry.isIntersecting && !hasTriedFetchRef.current) {
          hasTriedFetchRef.current = true;
          console.log(
            `[MediaContainer] Element intersected, loading media for mediaId=${mediaId}`,
          );
          setMediaUrl(`/api/media/${mediaId}`);
          setIsLoading(false);
        }
      },
      { threshold: 0 }, // Fire when element enters viewport
    );

    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
    };
  }, [mediaId]);

  const handleMediaLoad = useCallback(() => {
    console.log(
      `[MediaContainer] Media loaded successfully for mediaId=${mediaId}`,
    );
    setIsLoading(false);
  }, [mediaId]);

  const handleMediaError = useCallback(() => {
    console.log(`[MediaContainer] Media load error for mediaId=${mediaId}`);
    setIsLoading(false);
    setHasError(true);
  }, [mediaId]);

  // IMAGE — Fixed dimensions (280px × 210px for 4:3 aspect ratio)
  if (type === "IMAGE") {
    return (
      <div ref={containerRef} className="flex flex-col gap-2">
        {isLoading && <MediaSkeleton type="IMAGE" />}

        {!isLoading && hasError && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-black/10 text-sm">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <span>Image unavailable</span>
          </div>
        )}

        {!isLoading && mediaUrl && !hasError && (
          <>
            <button
              type="button"
              onClick={() => setLightboxOpen(true)}
              className="relative group rounded-lg overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              style={{ width: '280px', height: '210px' }}
            >
              <img
                src={mediaUrl}
                alt={caption ?? "Image"}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                className="rounded-lg"
                onLoad={handleMediaLoad}
                onError={handleMediaError}
              />
              <span className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-colors rounded-lg">
                <span className="opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs font-medium bg-black/50 px-2 py-1 rounded-full">
                  View
                </span>
              </span>
            </button>
            {mediaUrl && (
              <Lightbox
                open={lightboxOpen}
                close={() => setLightboxOpen(false)}
                slides={[{ src: mediaUrl }]}
              />
            )}
          </>
        )}

        {caption && <p className="text-sm px-1">{caption}</p>}
      </div>
    );
  }

  // VIDEO — Fixed dimensions (280px × 157px for 16:9 aspect ratio)
  if (type === "VIDEO") {
    return (
      <div ref={containerRef} className="flex flex-col gap-2">
        {isLoading && <MediaSkeleton type="VIDEO" />}

        {!isLoading && hasError && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-black/10 text-sm">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <span>Video unavailable</span>
          </div>
        )}

        {!isLoading && mediaUrl && !hasError && (
          <>
            <button
              type="button"
              onClick={() => setLightboxOpen(true)}
              className="relative group rounded-lg overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              style={{ width: '280px', height: '157px' }}
            >
              {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
              <video
                src={mediaUrl}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                className="rounded-lg"
                onLoadedMetadata={handleMediaLoad}
                onError={handleMediaError}
              />
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="flex items-center justify-center w-12 h-12 rounded-full bg-black/50 group-hover:bg-black/70 transition-colors">
                  <span className="text-white text-xl">▶</span>
                </span>
              </span>
            </button>
            {mediaUrl && (
              <Lightbox
                open={lightboxOpen}
                close={() => setLightboxOpen(false)}
                plugins={[VideoPlugin]}
                slides={[
                  {
                    type: "video",
                    sources: [
                      { src: mediaUrl, type: mediaMimeType ?? "video/mp4" },
                    ],
                  },
                ]}
              />
            )}
          </>
        )}

        {caption && <p className="text-sm px-1">{caption}</p>}
      </div>
    );
  }

  // AUDIO — Fixed dimensions (flexible width, 40px height)
  if (type === "AUDIO") {
    return (
      <div ref={containerRef} className="flex flex-col gap-2">
        {isLoading && <MediaSkeleton type="AUDIO" />}

        {!isLoading && hasError && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-black/10 text-sm">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <span>Audio unavailable</span>
          </div>
        )}

        {!isLoading && mediaUrl && !hasError && (
          // eslint-disable-next-line jsx-a11y/media-has-caption
          <audio
            src={mediaUrl}
            controls
            style={{ width: '100%', maxWidth: '320px', height: '40px' }}
            onLoadedMetadata={handleMediaLoad}
            onError={handleMediaError}
          />
        )}
      </div>
    );
  }

  // DOCUMENT — Fixed dimensions (flexible width, 40px height)
  if (type === "DOCUMENT") {
    return (
      <div ref={containerRef} className="flex flex-col gap-2">
        {isLoading && <MediaSkeleton type="DOCUMENT" />}

        {!isLoading && hasError && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-black/10 text-sm">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <span>Document unavailable</span>
          </div>
        )}

        {!isLoading && mediaUrl && !hasError && (
          <a
            href={mediaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 rounded-md bg-black/10 hover:bg-black/20 transition-colors text-sm font-medium"
            style={{ width: '100%', maxWidth: '320px', height: '40px' }}
            onLoad={handleMediaLoad}
            onError={handleMediaError}
          >
            <FileText className="h-5 w-5 flex-shrink-0" />
            <span>{caption ?? "Document"}</span>
          </a>
        )}
      </div>
    );
  }

  // Fallback for unknown types
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-black/10 text-sm">
      <span>File</span>
    </div>
  );
});
