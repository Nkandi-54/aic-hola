import React from "react";

const YouTubeEmbed = ({ videoId, playlistId, title = "YouTube Player" }) => {
  // Decide which embed URL to use
  let src = "";

  if (playlistId) {
    // Playlist embed (this is what you want for "former lives")
    src = `https://www.youtube.com/embed/videoseries?list=${playlistId}`;
  } else if (videoId) {
    // Single video embed
    src = `https://www.youtube.com/embed/${videoId}`;
  } else {
    return null; // Nothing to render
  }

  return (
    <div className="youtube-embed">
      <iframe
        className="youtube-embed-frame"
        src={src}
        title={title}
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      ></iframe>
    </div>
  );
};

export default YouTubeEmbed;
