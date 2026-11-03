import React, { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import { asset } from '../data';
import './extended-gallery.css';

// All panels and captions are windows onto the SAME untouched original page.
// No re-encoding, image generation, tint, transparency or color filter.
const original = '/projects/free-in-the-wind/page-16.webp';
const designs = [
  {id:'freedom',name:'Freedom',crop:[107,306,373,340],label:[104,1038,160,37]},
  {id:'sand',name:'Sand',crop:[642,306,762,570],label:[980,1038,88,37]},
  {id:'breeze',name:'Breeze',crop:[1566,306,373,340],label:[1821,1038,121,37]},
];
const slots = {
  left:{x:107,y:306,width:373,height:340},
  center:{x:642,y:306,width:762,height:570},
  right:{x:1566,y:306,width:373,height:340},
};

const layoutFor = active => Object.fromEntries(designs.map((d,index)=>{
  const delta=(index-active+3)%3,slot=delta===0?'center':delta===1?'right':'left';
  return [d.id,{...slots[slot],labelX:slot==='left'?104:slot==='center'?1024-d.label[2]/2:1942-d.label[2]}];
}));

export default function ExtendedGallery({onOpenOriginal}) {
  const [active,setActive]=useState(1);
  const gesture=useRef(null),svg=useRef(null);
  const reduced=useReducedMotion();
  const [frames,setFrames]=useState(()=>layoutFor(1));
  const currentFrames=useRef(frames);
  useEffect(()=>{
    const goal=layoutFor(active),from=currentFrames.current;
    const apply=next=>{currentFrames.current=next;setFrames(next);};
    if(reduced){apply(goal);return;}
    let timer=0;const start=performance.now();
    const animate=now=>{
      const progress=Math.min(1,(now-start)/550),ease=1-Math.pow(1-progress,3);
      const next=Object.fromEntries(designs.map(d=>[d.id,Object.fromEntries(Object.keys(goal[d.id]).map(key=>[key,from[d.id][key]+(goal[d.id][key]-from[d.id][key])*ease]))]));
      apply(next);if(progress<1)timer=requestAnimationFrame(animate);
    };
    timer=requestAnimationFrame(animate);return()=>cancelAnimationFrame(timer);
  },[active,reduced]);
  const shift=direction=>setActive(current=>(current+direction+designs.length)%designs.length);
  const down=event=>{
    if(event.button!==0 || gesture.current)return;
    gesture.current={x:event.clientX,y:event.clientY,id:event.pointerId,design:event.target.closest('[data-design]')?.dataset.design};
    svg.current.setPointerCapture(event.pointerId);
  };
  const up=event=>{
    const start=gesture.current;if(!start || start.id!==event.pointerId)return;
    gesture.current=null;
    if(svg.current.hasPointerCapture(event.pointerId))svg.current.releasePointerCapture(event.pointerId);
    const dx=event.clientX-start.x,dy=event.clientY-start.y;
    if(Math.abs(dx)>35 && Math.abs(dx)>Math.abs(dy)){shift(dx>0?-1:1);return;}
    if(Math.hypot(dx,dy)<10 && start.design)setActive(designs.findIndex(d=>d.id===start.design));
  };
  return <section className="extended-gallery" aria-label="延展设计，可左右移动的原图画廊" data-active={designs[active].id}>
    <svg ref={svg} viewBox="0 0 2048 1152" className="extended-stage"
      onPointerDown={down} onPointerUp={up} onPointerCancel={()=>{gesture.current=null;}}>
      <image href={asset(original)} width="2048" height="1152" pointerEvents="none"/>
      {Object.values(slots).map((s,i)=><rect key={i} x={s.x-1} y={s.y-1} width={s.width+2} height={s.height+2} fill="white" pointerEvents="none"/>)}
      <rect x="90" y="1030" width="1870" height="57" fill="white" pointerEvents="none"/>
      {[...designs.filter((_,i)=>i!==active),designs[active]].map(d=>{
        const index=designs.indexOf(d),delta=(index-active+3)%3;
        const slot=delta===0?'center':delta===1?'right':'left';
        const frame=frames[d.id];
        return <g key={d.id} data-design={d.id} data-slot={slot} className="extended-design" role="button" tabIndex="0"
          aria-label={`将 ${d.name} 移到中间`} aria-pressed={slot==='center'}
          onKeyDown={event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();setActive(index);}else if(event.key==='ArrowRight'){event.preventDefault();shift(-1);}else if(event.key==='ArrowLeft'){event.preventDefault();shift(1);}}}>
          <svg className="extended-panel" x={frame.x} y={frame.y} width={frame.width} height={frame.height}
            viewBox={d.crop.join(' ')} preserveAspectRatio="xMidYMid slice" overflow="hidden">
            <image href={asset(original)} width="2048" height="1152"/>
          </svg>
          <svg x={frame.labelX} y="1038" width={d.label[2]} height={37}
            viewBox={d.label.join(' ')} overflow="hidden" pointerEvents="none">
            <image href={asset(original)} width="2048" height="1152"/>
          </svg>
        </g>;
      })}
    </svg>
    <div className="extended-controls">
      <button type="button" onClick={()=>shift(1)} aria-label="画面向左移">← 向左移</button>
      <div className="extended-choices" aria-label="选择中央画面">
        {designs.map((d,i)=><button key={d.id} type="button" onClick={()=>setActive(i)} aria-pressed={active===i}>{d.name}</button>)}
      </div>
      <button type="button" onClick={()=>shift(-1)} aria-label="画面向右移">向右移 →</button>
      <button className="extended-original" type="button" onClick={onOpenOriginal}>查看原稿 ↗</button>
      <span className="sr-only" role="status" aria-live="polite">当前中央画面：{designs[active].name}</span>
    </div>
  </section>;
}
