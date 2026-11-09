import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';

const vertexSource = `attribute vec2 position; varying vec2 uv;
void main(){uv=vec2((position.x+1.0)*0.5,(1.0-position.y)*0.5);gl_Position=vec4(position,0.0,1.0);}`;
const fragmentSource = `precision mediump float; varying vec2 uv; uniform sampler2D frame; uniform vec2 crop; uniform float isScroll;
void main(){
 vec4 c=texture2D(frame,vec2(mix(crop.x,crop.y,uv.x),uv.y));
 // Remove only the pure green production background. Do not mask the upper scroll,
 // because the hanging cords and finials are part of the reference artwork.
 float excess=c.g-max(c.r,c.b);
 float alpha=1.0-smoothstep(0.035,0.13,excess);
 // Despill green from anti-aliased edges while preserving warm gold details.
 if(excess>0.015)c.g=min(c.g,max(c.r,c.b)+0.015);
 gl_FragColor=vec4(c.rgb*alpha,alpha);
}`;

// Videos remain real HTML media elements. Only the display is composited by WebGL.
export const KeyedVideo = forwardRef(function KeyedVideo({ src, poster, role, flipX = false, crop = [0.30, 0.64], onEnded }, ref) {
  const videoRef = useRef(null), canvasRef = useRef(null), drawRef = useRef(null);
  const [failed, setFailed] = useState(false);
  const [frameReady, setFrameReady] = useState(false);
  const [finished, setFinished] = useState(false);
  useImperativeHandle(ref, () => ({
    get video() { return videoRef.current; },
    load: () => new Promise((resolve) => {
      const video = videoRef.current;
      if (!src || !video) return resolve(false);
      if (video.readyState >= 2) return resolve(true);
      let timer;
      const done = (ok) => { clearTimeout(timer); video.removeEventListener('loadeddata', ready); video.removeEventListener('error', error); resolve(ok); };
      const ready = () => done(true), error = () => { setFailed(true); done(false); };
      video.addEventListener('loadeddata', ready, { once: true }); video.addEventListener('error', error, { once: true });
      timer = setTimeout(error, 15000);
      video.src = src; video.load();
    }),
    draw: () => drawRef.current?.(),
    hold: () => { videoRef.current?.pause(); setFinished(true); },
    reset: () => setFinished(false),
  }), [src]);

  useEffect(() => {
    const canvas = canvasRef.current, video = videoRef.current;
    const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true, preserveDrawingBuffer: false, powerPreference: 'high-performance' });
    if (!gl) { setFailed(true); return; }
    const compile = (type, source) => {
      const shader = gl.createShader(type); gl.shaderSource(shader, source); gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) { gl.deleteShader(shader); throw new Error('Video shader is unavailable.'); }
      return shader;
    };
    let program, texture, buffer, vertex, fragment, callback = 0, raf = 0, active = true;
    try {
      vertex = compile(gl.VERTEX_SHADER, vertexSource); fragment = compile(gl.FRAGMENT_SHADER, fragmentSource);
      program = gl.createProgram(); gl.attachShader(program, vertex); gl.attachShader(program, fragment); gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error('Video compositor unavailable.');
      gl.useProgram(program); buffer = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,1,1]), gl.STATIC_DRAW);
      const position = gl.getAttribLocation(program, 'position'); gl.enableVertexAttribArray(position); gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
      gl.uniform2f(gl.getUniformLocation(program, 'crop'), crop[0], crop[1]);
      gl.uniform1f(gl.getUniformLocation(program, 'isScroll'), role === 'scroll' ? 1 : 0);
      texture = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      const draw = () => {
        if (!active || video.readyState < 2 || gl.isContextLost()) return;
        const width = Math.round(video.videoWidth * (crop[1] - crop[0]));
        if (canvas.width !== width || canvas.height !== video.videoHeight) { canvas.width = width; canvas.height = video.videoHeight; gl.viewport(0, 0, width, video.videoHeight); }
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); setFrameReady(true);
      };
      const tick = () => {
        if (!active) return;
        draw();
        if (!video.paused && !video.ended && !document.hidden) {
          if (video.requestVideoFrameCallback) callback = video.requestVideoFrameCallback(tick);
          else raf = requestAnimationFrame(tick);
        }
      };
      drawRef.current = draw;
      const play = () => { if (callback) video.cancelVideoFrameCallback?.(callback); cancelAnimationFrame(raf); tick(); };
      const lost = (event) => { event.preventDefault(); setFailed(true); };
      video.addEventListener('play', play); video.addEventListener('seeked', draw); video.addEventListener('loadeddata', draw); video.addEventListener('ended', draw);
      canvas.addEventListener('webglcontextlost', lost);
      return () => {
        active = false; drawRef.current = null;
        video.cancelVideoFrameCallback?.(callback); cancelAnimationFrame(raf);
        video.removeEventListener('play', play); video.removeEventListener('seeked', draw); video.removeEventListener('loadeddata', draw); video.removeEventListener('ended', draw);
        canvas.removeEventListener('webglcontextlost', lost);
        gl.deleteTexture(texture); gl.deleteBuffer(buffer); gl.deleteProgram(program); gl.deleteShader(vertex); gl.deleteShader(fragment);
      };
    } catch { setFailed(true); }
    // Crop values are fixed for the lifetime of a given asset.
  }, [crop[0], crop[1], role]);

  // Mirror the display, not the moving entrance container, so both footage and
  // fallback poses face inward without reversing the entrance animation.
  return <div className={`keyed-video keyed-${role}${flipX ? ' keyed-mirrored' : ''}`}>
    <img src={poster} alt={role === 'scroll' ? '' : `${role === 'groom' ? 'Rahul' : 'Bhavani'} in traditional wedding attire`} className={(role === 'scroll' ? (failed || finished) : !(frameReady && !failed && !finished)) ? '' : 'poster-hidden'} />
    <canvas ref={canvasRef} className={failed || finished ? 'canvas-hidden' : ''} aria-hidden="true" />
    <video ref={videoRef} poster={poster} muted playsInline preload="metadata" loop={false} aria-hidden="true" className="source-video" onError={() => setFailed(true)} onEnded={() => { setFinished(true); onEnded?.(); }} />
  </div>;
});