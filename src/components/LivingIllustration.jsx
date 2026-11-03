import React, { useEffect, useRef, useState } from "react";
import { useInView } from "motion/react";
import { asset } from "../data";
import "./living.css";
const vertex = `attribute vec2 position; varying vec2 uv; void main(){uv=(position+1.0)*0.5;gl_Position=vec4(position,0.0,1.0);}`;
const fragment = `precision mediump float;
uniform sampler2D artwork; uniform float time; varying vec2 uv;
// Compact masks are exactly zero outside their boundaries: surrounding artwork stays still.
float ellipse(vec2 p,vec2 c,vec2 r){return 1.0-smoothstep(.72,1.0,length((p-c)/r));}
float side(vec2 p,vec2 a,vec2 b){vec2 e=b-a;return (e.x*(p.y-a.y)-e.y*(p.x-a.x))/length(e);}
float triangle(vec2 p,vec2 a,vec2 b,vec2 c){return smoothstep(0.0,.008,min(side(p,a,b),min(side(p,b,c),side(p,c,a))));}
vec2 blink(vec2 p,vec2 c,vec2 r,float phase){
 vec2 d=(p-c)/r;
 float pulse=pow(max(0.0,cos(time*2.4+phase)),20.0);
 float mask=1.0-smoothstep(.82,1.0,length(d));
 // Compress the original iris to a horizontal slit; sample the original lid at closure.
 float y=clamp(d.y/max(.025,1.0-pulse*.975),-1.0,1.0);
 return vec2(0.0,(y-d.y)*r.y*mask);
}
void main(){
 vec2 p=vec2(uv.x,1.0-uv.y);float t=time;vec2 drift=vec2(0.0);
 // Feather interiors only, with a fixed shoulder and stationary surroundings.
 float wing=triangle(p,vec2(.003,.115),vec2(.139,.394),vec2(.003,.354));
 wing+=triangle(p,vec2(.143,.361),vec2(.186,.158),vec2(.242,.148));
 drift.y+=wing*sin(t*2.5)*.020;
 // Separate pools avoid the banks, fox, flowers, fish, and floating petals.
 float river=ellipse(p,vec2(.433,.448),vec2(.035,.020));
 river+=ellipse(p,vec2(.448,.486),vec2(.041,.014));
 river+=ellipse(p,vec2(.422,.692),vec2(.060,.023));
 river+=ellipse(p,vec2(.469,.730),vec2(.043,.025));
 river+=ellipse(p,vec2(.464,.790),vec2(.045,.029));
 river+=ellipse(p,vec2(.403,.819),vec2(.040,.024));
 river+=ellipse(p,vec2(.488,.839),vec2(.023,.026));
 drift.x+=river*sin(p.y*170.0-t*2.2)*.006;
 drift.y+=river*sin(p.x*120.0-t*1.5)*.002;
 // Both visible eyes of the fish. Bodies and fins never translate.
 drift+=blink(p,vec2(.1125,.755),vec2(.009,.027),.6);
 drift+=blink(p,vec2(.317,.801),vec2(.0078,.012),2.0);
 gl_FragColor=texture2D(artwork,uv+vec2(drift.x,-drift.y));

}`;
export default function LivingIllustration({ alt, priority = false }) {
  const ref=useRef(null), canvas=useRef(null), renderer=useRef(null);
  const visible=useInView(ref,{amount:0.08});
  const [reduced,setReduced]=useState(()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(()=>{
    const query=window.matchMedia('(prefers-reduced-motion: reduce)');
    const update=()=>setReduced(query.matches);
    query.addEventListener('change',update);
    return()=>query.removeEventListener('change',update);
  },[]);
  const [manualPlay,setManualPlay]=useState(null);
  const playing=manualPlay ?? !reduced;
  const [ready,setReady]=useState(false);
  const [fallback,setFallback]=useState(false);
  const fallbackCanvas=useRef(null);
  const [activated,setActivated]=useState(false);
  const elapsed=useRef(0);
  useEffect(()=>{if(visible)setActivated(true);},[visible]);
  useEffect(()=>{
    if(!activated || renderer.current) return;
    const gl=canvas.current?.getContext('webgl',{alpha:false,antialias:false,powerPreference:'low-power'});
    if(!gl){setFallback(true);return;}
    let disposed=false, texture;
    const node=canvas.current;
    const onContextLost=(event)=>{event.preventDefault();renderer.current=null;setReady(false);setFallback(true);};
    node.addEventListener('webglcontextlost',onContextLost);
    const resources=[];
    try {
      const compile=(type,source)=>{const shader=gl.createShader(type);resources.push(shader);gl.shaderSource(shader,source);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw new Error('shader');return shader;};
      const program=gl.createProgram();gl.attachShader(program,compile(gl.VERTEX_SHADER,vertex));gl.attachShader(program,compile(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);
      if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error('program');
      const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
      gl.useProgram(program);const loc=gl.getAttribLocation(program,'position');gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
      const clock=gl.getUniformLocation(program,'time');
      const image=new Image();image.decoding='async';image.src=asset('/projects/iqiyi-vision/cover.webp');
      image.onload=()=>{
        if(disposed)return;
        const max=gl.getParameter(gl.MAX_TEXTURE_SIZE);
        if(image.naturalWidth>max){setFallback(true);return;}
        texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
        gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
        gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,gl.RGB,gl.UNSIGNED_BYTE,image);
        const node=canvas.current;
        const width=Math.min(2200,Math.max(640,Math.round(ref.current.clientWidth*Math.min(devicePixelRatio,1.5))));
        node.width=width;node.height=Math.round(width*1707/3035);gl.viewport(0,0,node.width,node.height);
        gl.uniform1f(clock,elapsed.current);gl.drawArrays(gl.TRIANGLES,0,6);
        renderer.current={gl,program,buffer,clock,resources};setReady(true);
      };
      return ()=>{disposed=true;node.removeEventListener('webglcontextlost',onContextLost);image.onload=null;renderer.current=null;setReady(false);if(texture)gl.deleteTexture(texture);gl.deleteBuffer(buffer);gl.deleteProgram(program);resources.forEach(s=>gl.deleteShader(s));};
    }catch { node.removeEventListener('webglcontextlost',onContextLost);resources.forEach(s=>gl.deleteShader(s));setFallback(true); }
  // Once initialized, retain the texture when scrolling out of view.
  },[activated]);
  useEffect(()=>{
    if(!ready || !visible || !playing)return;
    let frame=0,last=performance.now();
    const draw=(now)=>{frame=requestAnimationFrame(draw);if(document.hidden){last=now;return;}if(now-last<32)return;elapsed.current+=(now-last)/1000;last=now;const r=renderer.current;if(!r)return;r.gl.uniform1f(r.clock,elapsed.current);r.gl.drawArrays(r.gl.TRIANGLES,0,6);};
    frame=requestAnimationFrame(draw);return()=>cancelAnimationFrame(frame);
  },[ready,visible,playing]);
  useEffect(()=>{
    if(!fallback || !activated)return;
    const node=fallbackCanvas.current, ctx=node?.getContext('2d');
    if(!ctx)return;
    let frame=0,disposed=false,last=0;
    const image=new Image();
    image.onload=()=>{
      if(disposed)return;
      const w=Math.min(1400,Math.max(640,Math.round(ref.current.clientWidth)));
      node.width=w;node.height=Math.round(w*1707/3035);
      const h=node.height;
      // Reuse original pixels inside compact clips; never move the complete image.
      const patch=(path,dx,dy)=>{ctx.save();ctx.scale(w,h);ctx.clip(path);ctx.drawImage(image,dx,dy,1,1);ctx.restore();};
      const pool=(x,y,rx,ry,t)=>{
        const path=new Path2D();path.ellipse(x,y,rx,ry,0,0,Math.PI*2);
        patch(path,Math.sin(t*2.2+y*170)*.004,Math.sin(t*1.5+x*120)*.001);
      };
      const eye=(x,y,rx,ry,phase,t)=>{
        const pulse=Math.pow(Math.max(0,Math.cos(t*2.4+phase)),20);
        if(pulse<.01)return;
        ctx.save();ctx.scale(w,h);const path=new Path2D();path.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.clip(path);
        // Stretch a thin strip of the original eyelid across the eye, leaving a closing slit.
        ctx.drawImage(image,(x-rx)*image.width,(y-ry)*image.height,rx*2*image.width,2, x-rx,y-ry,rx*2,ry*2);
        const open=1-pulse*.98;
        ctx.drawImage(image,(x-rx)*image.width,(y-ry)*image.height,rx*2*image.width,ry*2*image.height,x-rx,y-ry*open,rx*2,ry*2*open);ctx.restore();
      };
      const draw=now=>{
        frame=requestAnimationFrame(draw);
        if(now-last<40 || document.hidden || !playing || !visible)return;last=now;
        const t=playing ? (elapsed.current+=.04) : elapsed.current;
        ctx.drawImage(image,0,0,w,h);
        const left=new Path2D('M .003 .115 L .139 .394 L .003 .354 Z');
        const right=new Path2D('M .143 .361 L .186 .158 L .242 .148 Z');
        patch(left,0,Math.sin(t*2.5)*.012);patch(right,0,-Math.sin(t*2.5)*.012);
        [[.433,.448,.03,.014],[.448,.486,.035,.009],[.422,.692,.05,.016],[.469,.730,.035,.018],[.464,.790,.035,.02],[.403,.819,.03,.016],[.488,.839,.017,.018]].forEach(v=>pool(...v,t));
        eye(.1125,.755,.009,.027,.6,t);eye(.317,.801,.0078,.012,2,t);
      };
      setReady(true);frame=requestAnimationFrame(draw);
    };
    image.src=asset('/projects/iqiyi-vision/cover.webp');
    return()=>{disposed=true;image.onload=null;cancelAnimationFrame(frame);};
  },[fallback,activated,playing,visible]);
  return <span className="living-artwork" ref={ref} data-living={ready&&playing?'active':'static'} data-renderer={fallback?'2d':'webgl'}>
    <img src={asset('/projects/iqiyi-vision/cover.webp')} alt={alt} width="3035" height="1707" loading={priority?'eager':'lazy'} decoding="async" />
    <canvas ref={canvas} aria-hidden="true" hidden={fallback} />
    {fallback && <canvas ref={fallbackCanvas} aria-hidden="true" />}
    <button type="button" className="living-toggle" aria-label={playing?'暂停作品动画':'播放作品动画'} onClick={event=>{event.preventDefault();event.stopPropagation();setManualPlay(!playing);}}>{playing?'Ⅱ 暂停动画':'▶ 播放动画'}</button>
  </span>;
}
