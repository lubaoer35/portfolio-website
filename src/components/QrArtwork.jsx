import React, { useEffect, useRef, useState } from 'react';
import { Maximize2 } from 'lucide-react';
import { asset } from '../data';
import './qr-artwork.css';

const original = '/enhanced/red-bull/page-33.svg';
// A window onto the existing QR in the original artwork, never a regenerated code.
const qr = {x:1194,y:645,size:78};
export default function QrArtwork({title,onOpenOriginal}) {
  const frame=useRef(null),hotspot=useRef(null);
  const [hovered,setHovered]=useState(false),[focused,setFocused]=useState(false),[pinned,setPinned]=useState(false);
  const [zoom,setZoom]=useState(4);
  const expanded=hovered || focused || pinned;
  useEffect(()=>{
    const measure=()=>setZoom(Math.max(3,Math.min(18,200/(frame.current.clientWidth*qr.size/2048))));
    measure();const observer=new ResizeObserver(measure);observer.observe(frame.current);
    return()=>observer.disconnect();
  },[]);
  useEffect(()=>{
    if(!pinned)return;
    const close=event=>{if(!hotspot.current?.contains(event.target))setPinned(false);};
    document.addEventListener('pointerdown',close);
    return()=>document.removeEventListener('pointerdown',close);
  },[pinned]);
  return <div className="gallery-image qr-artwork" ref={frame}>
    <button className="qr-artwork-original" type="button" onClick={onOpenOriginal} aria-label={`放大：${title}`}>
      <img src={asset(original)} alt={`红牛 — ${title}，原稿第33页`} width="2182.57" height="1227.69" loading="lazy" decoding="async"/>
      <span className="zoom-label"><Maximize2 size={15}/> VIEW FULL SIZE</span>
    </button>
    <button ref={hotspot} className="qr-hotspot" type="button" aria-label="放大二维码，移开鼠标恢复" aria-expanded={expanded}
      style={{left:`${qr.x/2048*100}%`,top:`${qr.y/1152*100}%`,width:`${qr.size/2048*100}%`,height:`${qr.size/1152*100}%`,'--qr-zoom':zoom}}
      onPointerEnter={event=>{if(event.pointerType==='mouse')setHovered(true);}}
      onPointerLeave={()=>setHovered(false)}
      onFocus={event=>setFocused(event.currentTarget.matches(':focus-visible'))} onBlur={()=>setFocused(false)}
      onClick={()=>setPinned(value=>!value)}
      onKeyDown={event=>{if(event.key==='Escape'){event.preventDefault();event.stopPropagation();setPinned(false);setHovered(false);setFocused(false);event.currentTarget.blur();}}}>
      <svg className="qr-crop" viewBox={`${qr.x} ${qr.y} ${qr.size} ${qr.size}`} width={qr.size} height={qr.size} aria-hidden="true">
        <image href={asset(original)} width="2048" height="1152"/>
      </svg>
    </button>
  </div>;
}
