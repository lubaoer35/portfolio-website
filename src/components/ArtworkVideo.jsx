import React, { useEffect, useRef, useState } from 'react';
import { useInView } from 'motion/react';
import { asset } from '../data';
import './artwork-video.css';

export default function ArtworkVideo({ alt }) {
  const container = useRef(null);
  const video = useRef(null);
  const visible = useInView(container, { amount: 0.08 });
  const [paused, setPaused] = useState(true);
  const [failed, setFailed] = useState(false);
  const [requested, setRequested] = useState(() => !window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  useEffect(() => {
    const node = video.current;
    const sync = () => {
      if (requested && visible && !document.hidden && !failed) {
        node.play().catch(() => setPaused(true));
      } else {
        node.pause();
      }
    };
    sync();
    document.addEventListener('visibilitychange', sync);
    return () => { document.removeEventListener('visibilitychange', sync); node.pause(); };
  }, [requested, visible, failed]);

  const toggle = () => {
    const node = video.current;
    if (!node.paused) { setRequested(false); node.pause(); }
    else {
      setRequested(true);
      // Keep play inside the user gesture for browsers that restrict autoplay.
      node.play().catch(() => setPaused(true));
    }
  };

  return <div className="artwork-video" ref={container} data-playing={!paused}>
    <video
      ref={video}
      src={asset('/projects/iqiyi-vision/hero-video.mp4')}
      poster={asset('/projects/iqiyi-vision/cover.webp')}
      aria-label={alt}
      width="1280" height="720"
      muted loop playsInline preload="auto"
      onPlay={() => setPaused(false)}
      onPause={() => setPaused(true)}
      onError={() => { setFailed(true); setPaused(true); }}
    />
    {failed ? <span className="artwork-video-control" role="status">视频暂不可用</span> :
      <button className="artwork-video-control" type="button" onClick={toggle} aria-label={paused ? '播放主视觉视频' : '暂停主视觉视频'}>
        {paused ? '▶ 播放视频' : 'Ⅱ 暂停视频'}
      </button>}
  </div>;
}
