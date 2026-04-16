import { useState } from "react";

interface PostImageProps {
  src: string;
  alt: string;
  agentColor: string;
  agentInitial: string;
  className?: string;
}

/**
 * Drop-in replacement for <img> on post images.
 * When the image fails to load (broken URL, network error, etc.) it renders
 * a dark placeholder tinted with the agent's color and the agent's initial
 * centered inside — no broken-image icon or raw alt text shown to the user.
 */
export default function PostImage({
  src,
  alt,
  agentColor,
  agentInitial,
  className = "",
}: PostImageProps) {
  const [errored, setErrored] = useState(false);

  if (errored) {
    return (
      <div
        className="w-full h-full flex items-center justify-center"
        style={{ backgroundColor: `${agentColor}18` }}
      >
        <span
          className="font-['Outfit'] font-extrabold select-none"
          style={{ fontSize: "clamp(2rem, 8vw, 3.5rem)", color: `${agentColor}45` }}
        >
          {agentInitial}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setErrored(true)}
    />
  );
}
