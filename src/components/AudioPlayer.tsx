"use client";

import { useCallback, useEffect, useRef } from "react";

/**
 * Native audio player plus a live frequency-bar visualizer driven by the
 * Web Audio AnalyserNode while the audio plays.
 */
export default function AudioPlayer({ src }: { src: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);

  const draw = useCallback((animate: boolean) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const cssWidth = canvas.clientWidth;
    const cssHeight = canvas.clientHeight;
    if (
      canvas.width !== Math.round(cssWidth * dpr) ||
      canvas.height !== Math.round(cssHeight * dpr)
    ) {
      canvas.width = Math.round(cssWidth * dpr);
      canvas.height = Math.round(cssHeight * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssWidth, cssHeight);

    const analyser = analyserRef.current;
    const binCount = analyser?.frequencyBinCount ?? 64;
    const freqData = new Uint8Array(binCount);
    if (analyser) analyser.getByteFrequencyData(freqData);

    // Only show the lower ~75% of bins, which hold most of the audible energy.
    const bars = Math.floor(binCount * 0.75);
    const gap = 2;
    const barWidth = Math.max(1, (cssWidth - gap * (bars - 1)) / bars);

    for (let i = 0; i < bars; i++) {
      const v = (freqData[i] ?? 0) / 255;
      const barHeight = Math.max(2, v * cssHeight);
      const x = i * (barWidth + gap);
      const y = cssHeight - barHeight;
      // Stone-700 at rest, shifting toward blue as energy rises.
      const r = Math.round(68 - v * 17);
      const g = Math.round(64 + v * 64);
      const b = Math.round(60 + v * 195);
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, barHeight, Math.min(3, barWidth / 2));
      ctx.fill();
    }

    if (animate) {
      rafRef.current = requestAnimationFrame(() => draw(true));
    }
  }, []);

  const stopLoop = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const ensureAudioGraph = () => {
    const audio = audioRef.current;
    if (!audio || audioCtxRef.current) return;
    const audioCtx = new AudioContext();
    // createMediaElementSource can only be called once per element, so the
    // graph is built once and reused when `src` changes.
    const source = audioCtx.createMediaElementSource(audio);
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.8;
    source.connect(analyser);
    analyser.connect(audioCtx.destination);
    audioCtxRef.current = audioCtx;
    analyserRef.current = analyser;
  };

  const handlePlay = async () => {
    ensureAudioGraph();
    await audioCtxRef.current?.resume();
    stopLoop();
    draw(true);
  };

  const handleStop = () => {
    stopLoop();
    // Let the bars fall back down smoothly before freezing.
    let frames = 30;
    const settle = () => {
      draw(false);
      if (--frames > 0) rafRef.current = requestAnimationFrame(settle);
    };
    settle();
  };

  // Idle render and redraw on resize.
  useEffect(() => {
    draw(false);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const observer = new ResizeObserver(() => {
      if (rafRef.current === null) draw(false);
    });
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [draw, src]);

  useEffect(() => {
    return () => {
      stopLoop();
      void audioCtxRef.current?.close();
    };
  }, [stopLoop]);

  return (
    <div className="space-y-3">
      <canvas
        ref={canvasRef}
        aria-label="Live frequency visualization"
        className="block h-32 w-full rounded-lg border border-stone-200 bg-stone-50"
      />
      <audio
        ref={audioRef}
        src={src}
        controls
        onPlay={handlePlay}
        onPause={handleStop}
        onEnded={handleStop}
        className="w-full"
      />
    </div>
  );
}
