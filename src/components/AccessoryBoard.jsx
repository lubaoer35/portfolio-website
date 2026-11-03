import React, { useEffect, useId, useRef, useState } from 'react';
import { asset } from '../data';
import './accessory-board.css';

const source = id => asset(`/interactive/chloe-accessories/${id}.png`);
// The five supplied designs are standalone transparent PNGs, never PDF crops.
const pieces = [
  { id:'fish', name:'蓝色小鱼', x:660, y:101, w:244, h:419 },
  { id:'blue-shell', name:'蓝色海螺', x:227, y:439, w:329, h:241 },
  { id:'shell', name:'黄色贝壳', x:748, y:441, w:253, h:216 },
  { id:'tag', name:'粉色飞鸟吊牌', x:202, y:292, w:747, h:303 },
  { id:'conch', name:'粉色海螺', x:235, y:153, w:297, h:264 },
];
const initial = () => Object.fromEntries(pieces.map(p=>[p.id,{x:p.x,y:p.y}]));

export default function AccessoryBoard({ onOpenOriginal }) {
  const svg = useRef(null), drag = useRef(null), masks = useRef({});
  const uid = useId().replace(/:/g,'');
  const [positions,setPositions] = useState(initial);
  const [order,setOrder] = useState(pieces.map(p=>p.id));
  const [active,setActive] = useState(null);
  const [ready,setReady] = useState(false);
  const [notice,setNotice] = useState('抓住配件，拖到画面任意位置');

  useEffect(()=>{
    let disposed=false;
    Promise.all(pieces.map(p=>new Promise((resolve,reject)=>{
      const image=new Image();
      image.onload=()=>{
        const canvas=document.createElement('canvas');canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;
        const context=canvas.getContext('2d',{willReadFrequently:true});context.drawImage(image,0,0);
        resolve([p.id,{width:canvas.width,height:canvas.height,pixels:context.getImageData(0,0,canvas.width,canvas.height).data}]);
      };
      image.onerror=reject;image.src=source(p.id);
    }))).then(values=>{if(!disposed){masks.current=Object.fromEntries(values);setReady(true);}})
      .catch(()=>{if(!disposed)setNotice('配件加载失败，请刷新重试');});
    return()=>{disposed=true;};
  },[]);

  const point = event => new DOMPoint(event.clientX,event.clientY).matrixTransform(svg.current.getScreenCTM().inverse());
  // Pick only painted pixels. Transparent PNG corners never block another piece.
  const pick = here => {
    for(const id of [...order].reverse()){
      const p=pieces.find(piece=>piece.id===id),position=positions[id],mask=masks.current[id];
      if(!mask)continue;
      const x=Math.floor((here.x-position.x)/p.w*mask.width),y=Math.floor((here.y-position.y)/p.h*mask.height);
      if(x>=0 && y>=0 && x<mask.width && y<mask.height && mask.pixels[(y*mask.width+x)*4+3]>32)return p;
    }
    return null;
  };
  const start = event => {
    if(drag.current || event.button!==0)return;
    const here=point(event),piece=pick(here);if(!piece)return;
    event.preventDefault();event.stopPropagation();
    svg.current.querySelector(`[data-piece="${piece.id}"]`).focus({preventScroll:true});
    svg.current.setPointerCapture(event.pointerId);
    drag.current={id:piece.id,pointer:event.pointerId,point:here,origin:{...positions[piece.id]}};
    setActive(piece.id);setOrder(order=>[...order.filter(id=>id!==piece.id),piece.id]);
  };
  const move = event => {
    const held=drag.current,now=point(event);
    svg.current.style.cursor=held?'grabbing':pick(now)?'grab':'default';
    if(!held || event.pointerId!==held.pointer)return;
    setPositions(current=>({...current,[held.id]:{x:held.origin.x+now.x-held.point.x,y:held.origin.y+now.y-held.point.y}}));
  };
  const finish = (event,cancel=false) => {
    const held=drag.current;if(!held || held.pointer!==event.pointerId)return;
    if(cancel)setPositions(current=>({...current,[held.id]:held.origin}));
    drag.current=null;
    if(svg.current.hasPointerCapture(event.pointerId))svg.current.releasePointerCapture(event.pointerId);
    svg.current.style.cursor='grab';
    setActive(null);setNotice(cancel?'已取消移动':`已放下${pieces.find(p=>p.id===held.id).name}`);
  };
  const key = (event,piece) => {
    const delta={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[event.key];
    if(delta){event.preventDefault();const step=event.shiftKey?50:10;setPositions(current=>({...current,[piece.id]:{x:current[piece.id].x+delta[0]*step,y:current[piece.id].y+delta[1]*step}}));}
    if(event.key==='Home'){event.preventDefault();setPositions(current=>({...current,[piece.id]:{x:piece.x,y:piece.y}}));}
  };
  const reset = () => { drag.current=null;setActive(null);setPositions(initial());setOrder(pieces.map(p=>p.id));setNotice('所有配件已复位'); };
  return <div className="accessory-board" data-dragging={active || ''} data-ready={ready}>
    <div className="accessory-toolbar">
      <p role="status" aria-live="polite">{notice}<span>鼠标 / 触屏拖动 · 方向键微调 · Home 归位</span></p>
      <div><button type="button" onClick={reset}>全部复位 ↺</button><button type="button" onClick={onOpenOriginal}>查看原稿 ↗</button></div>
    </div>
    <svg ref={svg} viewBox="0 0 2048 1152" className="accessory-canvas" aria-label="DIY Your Own Accessories：五个透明PNG配件"
      onPointerDown={start} onPointerMove={move} onPointerUp={finish} onPointerCancel={e=>finish(e,true)} onLostPointerCapture={e=>finish(e,true)}>
      <image href={asset('/projects/free-in-the-wind/page-19.webp')} width="2048" height="1152" pointerEvents="none"/>
      <image href={source('basket-background')} x="95" y="96" width="1000" height="655" preserveAspectRatio="none" pointerEvents="none"/>
      {order.map(id=>{
        const p=pieces.find(piece=>piece.id===id),pos=positions[id];
        return <g key={id} role="button" tabIndex="0" aria-label={`拖动${p.name}`} aria-describedby={`${uid}-help`} data-piece={id}
          className="accessory-piece" data-held={active===id} transform={`translate(${pos.x} ${pos.y})`} onKeyDown={e=>key(e,p)} pointerEvents="none">
          <image href={source(id)} width={p.w} height={p.h} preserveAspectRatio="none"/>
        </g>;
      })}
    </svg>
    <p id={`${uid}-help`} className="sr-only">按住鼠标或触屏拖动配件，松手放下。选中后可用方向键移动，Home 键复位。</p>
  </div>;
}
