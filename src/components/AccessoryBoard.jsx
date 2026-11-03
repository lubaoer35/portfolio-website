import React, { useId, useRef, useState } from 'react';
import { asset } from '../data';
import './accessory-board.css';

// Crop the original PDF artwork in SVG at runtime; source images stay intact.
const page19 = '/projects/free-in-the-wind/page-19.webp';
const page23 = '/projects/free-in-the-wind/page-23.webp';
const pieces = [
  { id:'fish', name:'蓝色小鱼', source:page23, crop:[918,800,188,244], x:644,y:100,w:310,h:320, flip:true,
    path:'M 1091 808 Q 1101 836 1090 863 L 1076 905 L 1075 943 L 1056 958 L 1037 939 Q 1008 977 989 1006 L 990 1035 L 977 1031 L 964 1002 L 926 994 L 923 983 L 956 965 L 975 929 L 972 911 L 983 904 L 971 874 L 980 862 L 1002 852 L 1044 820 Z' },
  { id:'blue-shell', name:'蓝色海螺', source:page23, crop:[1305,828,210,158], x:227,y:439,w:329,h:244,
    path:'M 1315 886 Q 1325 837 1379 834 Q 1415 830 1426 872 Q 1470 868 1508 891 L 1500 922 Q 1480 978 1424 981 Q 1356 987 1326 943 Q 1310 916 1315 886 Z' },
  { id:'shell', name:'黄色贝壳', source:page23, crop:[1103,817,188,180], x:748,y:441,w:253,h:250,
    path:'M 1118 887 Q 1124 849 1153 838 Q 1181 815 1209 828 Q 1250 831 1268 857 Q 1297 875 1286 903 L 1261 945 L 1262 969 L 1233 978 L 1209 991 Q 1180 981 1163 979 L 1115 957 Q 1102 944 1115 923 Z' },
  { id:'tag', name:'粉色飞鸟吊牌', source:page19, crop:[202,284,747,313], x:202,y:284,w:747,h:313,
    path:'M 207 337 Q 225 329 275 355 Q 380 324 511 304 Q 663 273 747 305 Q 802 325 813 379 Q 903 399 947 462 L 920 450 L 866 445 L 830 450 Q 782 453 766 493 Q 702 589 618 589 L 489 590 L 515 555 L 543 521 L 534 499 L 546 482 Q 436 494 340 541 Q 329 541 340 530 L 376 493 L 337 485 L 308 479 L 319 464 L 378 451 L 430 430 L 410 417 L 370 423 L 365 408 L 318 409 L 294 394 L 266 382 Q 216 368 207 337 Z' },
  { id:'conch', name:'粉色海螺', source:page19, crop:[235,153,297,257], x:235,y:153,w:297,h:257,
    path:'M 244 401 Q 226 390 249 366 L 259 351 L 258 332 L 277 317 Q 264 295 282 273 L 307 242 Q 309 204 332 189 Q 405 151 462 158 Q 502 159 512 185 Q 531 247 518 284 Q 501 326 457 348 Q 404 379 362 371 Q 340 395 309 392 Q 271 413 244 401 Z' },
  { id:'clip', name:'蓝色回形针', source:page19, crop:[127,140,125,164], x:127,y:140,w:125,h:164,
    path:'M 132 198 C 118 151 174 123 198 164 L 243 251 C 268 302 197 325 171 278 Z M 152 188 L 189 266 C 201 290 231 278 220 254 L 183 178 C 172 153 143 167 152 188 Z M 165 185 Q 173 173 184 190 L 213 250 Q 225 276 201 278 Q 190 277 183 262 Z' },
];
const initial = () => Object.fromEntries(pieces.map(p=>[p.id,{x:p.x,y:p.y}]));
const basket = 'M295 156 L864 156 C1001 156 1018 183 1042 307 C1077 484 1049 604 1000 671 C966 715 913 707 859 709 L284 709 C207 708 173 691 154 640 C109 525 116 397 151 277 C170 211 190 160 295 156 Z';
const rim = [[295,156],[385,156],[475,156],[565,156],[655,156],[745,156],[835,156],[935,168],[1000,220],[1032,300],[1048,390],[1048,480],[1030,570],[995,650],[915,704],[825,709],[735,709],[645,709],[555,709],[465,709],[375,709],[285,709],[205,686],[159,620],[138,530],[132,440],[139,350],[162,260],[207,189]];

export default function AccessoryBoard({ onOpenOriginal }) {
  const svg = useRef(null), drag = useRef(null);
  const uid = useId().replace(/:/g,'');
  const [positions,setPositions] = useState(initial);
  const [order,setOrder] = useState(pieces.map(p=>p.id));
  const [active,setActive] = useState(null);
  const [notice,setNotice] = useState('抓住配件，拖到画面任意位置');
  const point = event => new DOMPoint(event.clientX,event.clientY).matrixTransform(svg.current.getScreenCTM().inverse());
  const start = (event,piece) => {
    if(drag.current || event.button !== 0)return;
    event.preventDefault();event.stopPropagation();
    event.currentTarget.focus({preventScroll:true});svg.current.setPointerCapture(event.pointerId);
    drag.current={id:piece.id,pointer:event.pointerId,point:point(event),origin:{...positions[piece.id]}};
    setActive(piece.id);setOrder(order=>[...order.filter(id=>id!==piece.id),piece.id]);
  };
  const move = event => {
    const held=drag.current;if(!held || event.pointerId!==held.pointer)return;
    const now=point(event);
    setPositions(current=>({...current,[held.id]:{x:held.origin.x+now.x-held.point.x,y:held.origin.y+now.y-held.point.y}}));
  };
  const finish = (event,cancel=false) => {
    const held=drag.current;if(!held || held.pointer!==event.pointerId)return;
    if(cancel)setPositions(current=>({...current,[held.id]:held.origin}));
    drag.current=null;
    if(svg.current.hasPointerCapture(event.pointerId))svg.current.releasePointerCapture(event.pointerId);
    setActive(null);setNotice(cancel?'已取消移动':`已放下${pieces.find(p=>p.id===held.id).name}`);
  };
  const key = (event,piece) => {
    const delta={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[event.key];
    if(delta){event.preventDefault();const step=event.shiftKey?50:10;setPositions(current=>({...current,[piece.id]:{x:current[piece.id].x+delta[0]*step,y:current[piece.id].y+delta[1]*step}}));}
    if(event.key==='Home'){event.preventDefault();setPositions(current=>({...current,[piece.id]:{x:piece.x,y:piece.y}}));}
  };
  const reset = () => { drag.current=null;setActive(null);setPositions(initial());setOrder(pieces.map(p=>p.id));setNotice('所有配件已复位'); };
  return <div className="accessory-board" data-dragging={active || ''}>
    <div className="accessory-toolbar">
      <p role="status" aria-live="polite">{notice}<span>鼠标 / 触屏拖动 · 方向键微调 · Home 归位</span></p>
      <div><button type="button" onClick={reset}>全部复位 ↺</button><button type="button" onClick={onOpenOriginal}>查看原稿 ↗</button></div>
    </div>
    <svg ref={svg} viewBox="0 0 2048 1152" className="accessory-canvas" aria-label="DIY Your Own Accessories：可自由拖动的原稿配件"
      onPointerMove={move} onPointerUp={finish} onPointerCancel={e=>finish(e,true)} onLostPointerCapture={e=>finish(e,true)}>
      <defs>
        <clipPath id={`${uid}-basket`}><path d={basket}/></clipPath>
        <mask id={`${uid}-tag-visible`} maskUnits="userSpaceOnUse" x="0" y="0" width="2048" height="1152">
          <path d={pieces.find(p=>p.id==='tag').path} fill="white"/>
          <path d={pieces.find(p=>p.id==='conch').path} fill="black"/>
        </mask>
        {pieces.map(p=><clipPath key={p.id} id={`${uid}-${p.id}`}><path d={p.path} clipRule="evenodd"/></clipPath>)}
      </defs>
      <image href={asset(page19)} width="2048" height="1152" pointerEvents="none"/>
      <rect x="95" y="96" width="1000" height="655" fill="white" pointerEvents="none"/>
      <g pointerEvents="none" fill="none" stroke="#b5b2d4" strokeLinecap="round" strokeLinejoin="round">
        <path d={basket} fill="white" strokeWidth="35"/>
        <g clipPath={`url(#${uid}-basket)`} strokeWidth="17">{rim.map(([x,y],i)=><path key={i} d={`M ${x} ${y} L 599 444`}/>)}</g>
      </g>
      {order.map(id=>{
        const p=pieces.find(piece=>piece.id===id),pos=positions[id];
        const [cx,cy,cw,ch]=p.crop;
        return <g key={id} role="button" tabIndex="0" aria-label={`拖动${p.name}`} aria-describedby={`${uid}-help`} data-piece={id}
          className="accessory-piece" data-held={active===id} transform={`translate(${pos.x} ${pos.y})`}
          onPointerDown={e=>start(e,p)} onKeyDown={e=>key(e,p)}>
          <svg width={p.w} height={p.h} viewBox={`${cx} ${cy} ${cw} ${ch}`} overflow="visible" pointerEvents="none">
            <g transform={p.flip?`translate(${cx*2+cw} 0) scale(-1 1)`:undefined}>
              {id==='tag' && <path d={p.path} fill="#e0c7d6"/>}
              <image href={asset(p.source)} width="2048" height="1152" clipPath={`url(#${uid}-${id})`} mask={id==='tag'?`url(#${uid}-tag-visible)`:undefined}/>
              <path className="accessory-hit" d={p.path} fill="transparent" fillRule="evenodd" pointerEvents="all"/>
            </g>
          </svg>
        </g>;
      })}
    </svg>
    <p id={`${uid}-help`} className="sr-only">按住鼠标或触屏拖动配件，松手放下。选中后可用方向键移动，Home 键复位。</p>
  </div>;
}
