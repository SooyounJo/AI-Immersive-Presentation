import { useEffect, useRef } from 'react';
import { Renderer, Program, Mesh, Triangle, Vec2, Camera, Geometry } from 'ogl';

const fullScreenVertex = `
attribute vec2 position;
void main(){gl_Position=vec4(position,0.0,1.0);}
`;

export function DarkVeilBg({
  hueShift = 0, noiseIntensity = 0, scanlineIntensity = 0, speed = 0.5, scanlineFrequency = 0, warpAmount = 0,
}: Record<string, number>) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const container = ref.current;
    if (!container) return;
    const renderer = new Renderer({ dpr: Math.min(window.devicePixelRatio, 2), alpha: true });
    const gl = renderer.gl;
    gl.canvas.style.width = '100%';
    gl.canvas.style.height = '100%';
    gl.canvas.style.display = 'block';
    container.appendChild(gl.canvas);
    const geometry = new Triangle(gl);
    const program = new Program(gl, {
      vertex: fullScreenVertex,
      fragment: `
precision highp float;
uniform vec2 uResolution; uniform float uTime; uniform float uHueShift; uniform float uNoise; uniform float uScan; uniform float uScanFreq; uniform float uWarp;
float rand(vec2 c){return fract(sin(dot(c,vec2(12.9898,78.233)))*43758.5453);}
mat3 rgb2yiq=mat3(0.299,0.587,0.114,0.596,-0.274,-0.322,0.211,-0.523,0.312);
mat3 yiq2rgb=mat3(1.0,0.956,0.621,1.0,-0.272,-0.647,1.0,-1.106,1.703);
vec3 hueShiftRGB(vec3 col,float deg){vec3 yiq=rgb2yiq*col;float rad=radians(deg);float c=cos(rad),s=sin(rad);return clamp(yiq2rgb*vec3(yiq.x,yiq.y*c-yiq.z*s,yiq.y*s+yiq.z*c),0.0,1.0);}
void main(){
  vec2 uv=(gl_FragCoord.xy/uResolution)*2.0-1.0; uv.y*=-1.0;
  uv+=uWarp*vec2(sin(uv.y*6.283+uTime*0.5),cos(uv.x*6.283+uTime*0.5))*0.05;
  vec3 col=vec3(0.5+0.5*sin(uTime*0.18+uv.x*2.3),0.5+0.5*sin(uTime*0.23+uv.y*2.6),0.5+0.5*sin(uTime*0.14+uv.x*1.7+uv.y*1.3));
  col=hueShiftRGB(col,uHueShift);
  float scan=sin(gl_FragCoord.y*uScanFreq)*0.5+0.5; col*=1.0-(scan*scan)*uScan;
  col+=(rand(gl_FragCoord.xy+uTime)-0.5)*uNoise;
  gl_FragColor=vec4(clamp(col,0.0,1.0),1.0);
}`,
      uniforms: {
        uResolution: { value: new Vec2(1, 1) }, uTime: { value: 0 }, uHueShift: { value: hueShift },
        uNoise: { value: noiseIntensity }, uScan: { value: scanlineIntensity }, uScanFreq: { value: scanlineFrequency }, uWarp: { value: warpAmount },
      },
    });
    const mesh = new Mesh(gl, { geometry, program });
    const resize = () => {
      const w = container.clientWidth || 1;
      const h = container.clientHeight || 1;
      renderer.setSize(w, h);
      program.uniforms.uResolution.value.set(w, h);
    };
    const ro = new ResizeObserver(resize);
    ro.observe(container);
    resize();
    const start = performance.now();
    let raf = 0;
    const loop = () => {
      program.uniforms.uTime.value = ((performance.now() - start) / 1000) * speed;
      program.uniforms.uHueShift.value = hueShift;
      program.uniforms.uNoise.value = noiseIntensity;
      program.uniforms.uScan.value = scanlineIntensity;
      program.uniforms.uScanFreq.value = scanlineFrequency;
      program.uniforms.uWarp.value = warpAmount;
      renderer.render({ scene: mesh });
      raf = requestAnimationFrame(loop);
    };
    loop();
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      if (gl.canvas.parentElement === container) container.removeChild(gl.canvas);
    };
  }, [hueShift, noiseIntensity, scanlineIntensity, speed, scanlineFrequency, warpAmount]);
  return <div ref={ref} style={{ width: '100%', height: '100%' }} />;
}

export function GrainientBg({
  timeSpeed = 0.25, warpFrequency = 5, warpSpeed = 2, grainAmount = 0.1, contrast = 1.2, saturation = 1.0, zoom = 0.9,
}: Record<string, number>) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const container = ref.current;
    if (!container) return;
    const renderer = new Renderer({ dpr: Math.min(window.devicePixelRatio, 2), alpha: true });
    const gl = renderer.gl;
    gl.canvas.style.width = '100%'; gl.canvas.style.height = '100%'; gl.canvas.style.display = 'block';
    container.appendChild(gl.canvas);
    const geometry = new Triangle(gl);
    const program = new Program(gl, {
      vertex: `#version 300 es
in vec2 position;
void main(){gl_Position=vec4(position,0.0,1.0);}
`,
      fragment: `#version 300 es
precision highp float;
uniform vec2 uResolution; uniform float uTime; uniform float uTimeSpeed; uniform float uWarpFrequency; uniform float uWarpSpeed; uniform float uGrainAmount; uniform float uContrast; uniform float uSaturation; uniform float uZoom;
out vec4 fragColor;
mat2 rot(float a){float s=sin(a),c=cos(a);return mat2(c,-s,s,c);}
void main(){
  vec2 uv=(gl_FragCoord.xy/uResolution)*2.0-1.0;
  uv/=max(uZoom,0.001);
  uv*=rot(uTime*0.06*uTimeSpeed);
  uv.x += sin(uv.y*uWarpFrequency + uTime*uWarpSpeed)*0.12;
  uv.y += sin(uv.x*(uWarpFrequency*1.5)+uTime*uWarpSpeed)*0.08;
  vec3 col=mix(vec3(1.0,0.62,0.98),vec3(0.32,0.15,1.0),0.5+0.5*uv.x);
  col=mix(col,vec3(0.70,0.59,0.81),0.5+0.5*uv.y);
  float n=fract(sin(dot(gl_FragCoord.xy+uTime,vec2(12.9898,78.233)))*43758.5453);
  col+=(n-0.5)*uGrainAmount;
  float l=dot(col,vec3(0.2126,0.7152,0.0722));
  col=mix(vec3(l),col,uSaturation);
  col=(col-0.5)*uContrast+0.5;
  fragColor=vec4(clamp(col,0.0,1.0),1.0);
}`,
      uniforms: {
        uResolution: { value: new Vec2(1, 1) }, uTime: { value: 0 }, uTimeSpeed: { value: timeSpeed }, uWarpFrequency: { value: warpFrequency },
        uWarpSpeed: { value: warpSpeed }, uGrainAmount: { value: grainAmount }, uContrast: { value: contrast }, uSaturation: { value: saturation }, uZoom: { value: zoom },
      },
    });
    const mesh = new Mesh(gl, { geometry, program });
    const resize = () => renderer.setSize(container.clientWidth || 1, container.clientHeight || 1);
    const ro = new ResizeObserver(resize); ro.observe(container); resize();
    const start = performance.now(); let raf = 0;
    const loop = () => { program.uniforms.uTime.value = (performance.now() - start) * 0.001 * timeSpeed; renderer.render({ scene: mesh }); raf = requestAnimationFrame(loop); };
    loop();
    return () => { cancelAnimationFrame(raf); ro.disconnect(); if (gl.canvas.parentElement === container) container.removeChild(gl.canvas); };
  }, [timeSpeed, warpFrequency, warpSpeed, grainAmount, contrast, saturation, zoom]);
  return <div ref={ref} style={{ width: '100%', height: '100%' }} />;
}

export function ParticlesBg({
  particleCount = 180, particleSpread = 10, speed = 0.12, particleBaseSize = 90,
}: Record<string, number>) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const container = ref.current;
    if (!container) return;
    const renderer = new Renderer({ dpr: 1, depth: false, alpha: true });
    const gl = renderer.gl;
    container.appendChild(gl.canvas);
    gl.canvas.style.width = '100%';
    gl.canvas.style.height = '100%';
    const camera = new Camera(gl, { fov: 15 });
    camera.position.set(0, 0, 20);
    const positions = new Float32Array(particleCount * 3);
    const randoms = new Float32Array(particleCount * 4);
    for (let i = 0; i < particleCount; i += 1) {
      positions[i * 3] = (Math.random() * 2 - 1);
      positions[i * 3 + 1] = (Math.random() * 2 - 1);
      positions[i * 3 + 2] = (Math.random() * 2 - 1);
      randoms[i * 4] = Math.random();
      randoms[i * 4 + 1] = Math.random();
      randoms[i * 4 + 2] = Math.random();
      randoms[i * 4 + 3] = Math.random();
    }
    const geometry = new Geometry(gl, { position: { size: 3, data: positions }, random: { size: 4, data: randoms } });
    const program = new Program(gl, {
      vertex: `
attribute vec3 position; attribute vec4 random;
uniform mat4 modelMatrix; uniform mat4 viewMatrix; uniform mat4 projectionMatrix; uniform float uTime; uniform float uSpread; uniform float uBaseSize;
void main(){
  vec3 pos=position*uSpread;
  vec4 mPos=modelMatrix*vec4(pos,1.0);
  mPos.x += sin(uTime*random.z + 6.28*random.w)*mix(0.1,1.2,random.x);
  mPos.y += sin(uTime*random.y + 6.28*random.x)*mix(0.1,1.2,random.w);
  vec4 mvPos=viewMatrix*mPos;
  gl_PointSize=(uBaseSize*(0.6+random.x))/length(mvPos.xyz);
  gl_Position=projectionMatrix*mvPos;
}`,
      fragment: `
precision highp float;
void main(){
  float d=length(gl_PointCoord-vec2(0.5));
  if(d>0.5) discard;
  gl_FragColor=vec4(1.0,1.0,1.0,0.95);
}`,
      uniforms: { uTime: { value: 0 }, uSpread: { value: particleSpread }, uBaseSize: { value: particleBaseSize } },
      transparent: true,
      depthTest: false,
    });
    const mesh = new Mesh(gl, { mode: gl.POINTS, geometry, program });
    const resize = () => {
      const w = container.clientWidth || 1;
      const h = container.clientHeight || 1;
      renderer.setSize(w, h);
      camera.perspective({ aspect: gl.canvas.width / gl.canvas.height });
    };
    const ro = new ResizeObserver(resize); ro.observe(container); resize();
    let t = 0; let raf = 0;
    const loop = () => {
      t += speed * 16;
      program.uniforms.uTime.value = t * 0.001;
      mesh.rotation.z += 0.002 * speed;
      renderer.render({ scene: mesh, camera });
      raf = requestAnimationFrame(loop);
    };
    loop();
    return () => { cancelAnimationFrame(raf); ro.disconnect(); if (gl.canvas.parentElement === container) container.removeChild(gl.canvas); };
  }, [particleCount, particleSpread, speed, particleBaseSize]);
  return <div ref={ref} style={{ width: '100%', height: '100%' }} />;
}

export function IridescenceBg({
  speed = 1, amplitude = 0.1, colorR = 0.5, colorG = 0.6, colorB = 0.8,
}: Record<string, number>) {
  const ref = useRef<HTMLDivElement>(null);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });
  useEffect(() => {
    const container = ref.current;
    if (!container) return;
    const renderer = new Renderer({ dpr: Math.min(window.devicePixelRatio, 2), alpha: true });
    const gl = renderer.gl;
    gl.canvas.style.width = '100%'; gl.canvas.style.height = '100%'; gl.canvas.style.display = 'block';
    container.appendChild(gl.canvas);
    const geometry = new Triangle(gl);
    const program = new Program(gl, {
      vertex: `
attribute vec2 uv; attribute vec2 position; varying vec2 vUv;
void main(){vUv=uv; gl_Position=vec4(position,0.0,1.0);}
`,
      fragment: `
precision highp float;
uniform float uTime; uniform vec3 uColor; uniform vec2 uResolution; uniform vec2 uMouse; uniform float uAmplitude; uniform float uSpeed;
varying vec2 vUv;
void main(){
  float mr=min(uResolution.x,uResolution.y);
  vec2 uv=(vUv*2.0-1.0)*uResolution/mr;
  uv+=(uMouse-vec2(0.5))*uAmplitude;
  float d=-uTime*0.5*uSpeed; float a=0.0;
  for(float i=0.0;i<8.0;i++){a+=cos(i-d-a*uv.x); d+=sin(uv.y*i+a);}
  d+=uTime*0.5*uSpeed;
  vec3 col=vec3(cos(uv*vec2(d,a))*0.6+0.4,cos(a+d)*0.5+0.5);
  col=cos(col*cos(vec3(d,a,2.5))*0.5+0.5)*uColor;
  gl_FragColor=vec4(col,1.0);
}`,
      uniforms: {
        uTime: { value: 0 }, uColor: { value: [colorR, colorG, colorB] }, uResolution: { value: new Vec2(1, 1) },
        uMouse: { value: [0.5, 0.5] }, uAmplitude: { value: amplitude }, uSpeed: { value: speed },
      },
    });
    const mesh = new Mesh(gl, { geometry, program });
    const resize = () => {
      const w = container.clientWidth || 1;
      const h = container.clientHeight || 1;
      renderer.setSize(w, h);
      program.uniforms.uResolution.value.set(w, h);
    };
    const move = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = 1 - (e.clientY - rect.top) / rect.height;
      mouseRef.current = { x, y };
      program.uniforms.uMouse.value = [x, y];
    };
    container.addEventListener('mousemove', move);
    const ro = new ResizeObserver(resize); ro.observe(container); resize();
    let raf = 0;
    const loop = (t: number) => { program.uniforms.uTime.value = t * 0.001; renderer.render({ scene: mesh }); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      container.removeEventListener('mousemove', move);
      ro.disconnect();
      if (gl.canvas.parentElement === container) container.removeChild(gl.canvas);
    };
  }, [speed, amplitude, colorR, colorG, colorB]);
  return <div ref={ref} style={{ width: '100%', height: '100%' }} />;
}

export function SlideBackgroundLayer({
  kind,
  params,
}: {
  kind?: string;
  params?: Record<string, number | boolean | string>;
}) {
  if (!kind) return null;
  if (kind === 'darkVeil') return <DarkVeilBg {...(params as Record<string, number>)} />;
  if (kind === 'grainient') return <GrainientBg {...(params as Record<string, number>)} />;
  if (kind === 'particles') return <ParticlesBg {...(params as Record<string, number>)} />;
  if (kind === 'iridescence') return <IridescenceBg {...(params as Record<string, number>)} />;
  return null;
}
