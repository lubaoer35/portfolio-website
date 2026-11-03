import React, { useEffect, useRef, useState } from "react";
import { useInView } from "motion/react";
import { asset } from "../data";
import "./living.css";
const vertex = `attribute vec2 position; varying vec2 uv; void main(){uv=(position+1.0)*0.5;gl_Position=vec4(position,0.0,1.0);}`;
const fragment = `precision mediump float;
uniform sampler2D artwork; uniform float time; varying vec2 uv;
float area(vec2 p,vec2 center,vec2 radius){vec2 d=(p-center)/radius;return exp(-dot(d,d)*2.5);}
void main(){
 vec2 p=vec2(uv.x,1.0-uv.y);float t=time;vec2 drift=vec2(0.0);
 // Only deform local regions of the original painting. No new artwork or colors.
 float river=area(p,vec2(.48,.75),vec2(.21,.27));
 drift.x+=river*(sin(p.y*105.0-t*1.1)*.0019+sin(p.y*54.0-t*.65)*.0012);
 drift.y+=river*sin(p.x*83.0+p.y*22.0-t*.8)*.0011;
 float wings=area(p,vec2(.18,.29),vec2(.18,.25));
 drift.x+=wings*sin(t*.85)*.0025;drift.y+=wings*sin(t*.85)*.0015;
 float flowers=area(p,vec2(.32,.24),vec2(.12,.23));
 drift.x+=flowers*sin(t*.67+.8)*.0028;
 float bloom=area(p,vec2(.73,.74),vec2(.14,.19));
 drift.x+=bloom*sin(t*.72+2.0)*.0022;drift.y+=bloom*cos(t*.72+2.0)*.0013;
 float leaves=area(p,vec2(.10,.88),vec2(.15,.22))+area(p,vec2(.91,.94),vec2(.14,.1));
 drift.x+=leaves*sin(t*.55+p.x*4.0)*.0026;
 float petal=area(p,vec2(.45,.57),vec2(.035,.065))+area(p,vec2(.56,.84),vec2(.055,.07));
 drift.x+=petal*sin(t*.8)*.003;drift.y+=petal*cos(t*.8)*.0025;
 // Protect the title and frame. The fox remains the calm focal point.
 float title=1.0-smoothstep(.18,.32,p.y);float protect=title*smoothstep(.30,.38,p.x)*(1.0-smoothstep(.58,.66,p.x));
 drift*=1.0-protect;
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
  const [ready,setReady]=useState(false);
  const [activated,setActivated]=useState(false);
  const elapsed=useRef(0);
  useEffect(()=>{if(visible)setActivated(true);},[visible]);
  useEffect(()=>{
    if(reduced || !activated || renderer.current) return;
    const gl=canvas.current?.getContext('webgl',{alpha:false,antialias:false,powerPreference:'low-power'});
    if(!gl) return; // Original image remains visible if WebGL is unavailable.
    let disposed=false, texture;
    const node=canvas.current;
    const onContextLost=(event)=>{event.preventDefault();renderer.current=null;setReady(false);};
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
        if(image.naturalWidth>max)return;
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
    }catch { node.removeEventListener('webglcontextlost',onContextLost);resources.forEach(s=>gl.deleteShader(s)); }
  // Once initialized, retain the texture when scrolling out of view.
  },[reduced,activated]);
  useEffect(()=>{
    if(!ready || !visible || reduced)return;
    let frame=0,last=performance.now();
    const draw=(now)=>{frame=requestAnimationFrame(draw);if(document.hidden){last=now;return;}if(now-last<32)return;elapsed.current+=(now-last)/1000;last=now;const r=renderer.current;if(!r)return;r.gl.uniform1f(r.clock,elapsed.current);r.gl.drawArrays(r.gl.TRIANGLES,0,6);};
    frame=requestAnimationFrame(draw);return()=>cancelAnimationFrame(frame);
  },[ready,visible,reduced]);
  return <span className="living-artwork" ref={ref} data-living={ready&&!reduced?'active':'static'}>
    <img src={asset('/projects/iqiyi-vision/cover.webp')} alt={alt} width="3035" height="1707" loading={priority?'eager':'lazy'} decoding="async" />
    <canvas ref={canvas} aria-hidden="true" />
  </span>;
}
