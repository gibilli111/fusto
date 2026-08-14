"use client";

import { useEffect, useRef, useState } from "react";

type DeviceOrientationEventIOS = typeof DeviceOrientationEvent & {
  requestPermission?: () => Promise<"granted" | "denied">;
};

// Persiste per la sessione della pagina: se l'utente ha già concesso il
// permesso su un altro profilo visitato, non richiederlo di nuovo.
let orientationGranted = false;

type MugOpts = {
  width: number;
  height: number;
  halfH: number;
  outerTopX: number;
  outerBotX: number;
  wall: number;
  handleReach: number;
  topRY: number;
  foamH: number;
  maxAngle: number;
  fillLevel: number;
  liquidTop: string;
  liquidMid: string;
  liquidBottom: string;
  foam: string;
  stroke: string;
  glow: string;
};

function drawMug(canvas: HTMLCanvasElement, opts: MugOpts) {
  const noop = { setTarget: () => {}, stop: () => {} };
  const ctx = canvas.getContext("2d");
  if (!ctx) return noop;

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const cssW = opts.width;
  const cssH = opts.height;
  canvas.width = cssW * dpr;
  canvas.height = cssH * dpr;
  ctx.scale(dpr, dpr);

  const cx = cssW / 2;
  const cy = cssH / 2 + 4;
  const topY = -opts.halfH;
  const botY = opts.halfH;
  const { outerTopX, outerBotX, wall } = opts;
  const innerTopX = outerTopX - wall - 2;
  const innerBotX = outerBotX - wall;
  const innerTopY = topY + 9;
  const innerBotY = botY - 12;
  const baseH = 10;

  function outerBody() {
    ctx!.beginPath();
    ctx!.moveTo(-outerTopX, topY);
    ctx!.quadraticCurveTo(-outerTopX - 6, 0, -outerBotX, botY - baseH);
    ctx!.quadraticCurveTo(-outerBotX, botY, -outerBotX + 10, botY);
    ctx!.lineTo(outerBotX - 10, botY);
    ctx!.quadraticCurveTo(outerBotX, botY, outerBotX, botY - baseH);
    ctx!.quadraticCurveTo(outerTopX + 6, 0, outerTopX, topY);
    ctx!.closePath();
  }

  function innerCavity() {
    ctx!.beginPath();
    ctx!.moveTo(-innerTopX, innerTopY);
    ctx!.quadraticCurveTo(-innerTopX - 4, (innerTopY + innerBotY) / 2, -innerBotX, innerBotY);
    ctx!.quadraticCurveTo(0, innerBotY + 10, innerBotX, innerBotY);
    ctx!.quadraticCurveTo(innerTopX + 4, (innerTopY + innerBotY) / 2, innerTopX, innerTopY);
    ctx!.closePath();
  }

  function handlePath() {
    ctx!.beginPath();
    ctx!.moveTo(outerTopX - 6, -opts.halfH * 0.55);
    ctx!.quadraticCurveTo(outerTopX + opts.handleReach, -opts.halfH * 0.55, outerTopX + opts.handleReach, 0);
    ctx!.quadraticCurveTo(outerTopX + opts.handleReach, opts.halfH * 0.55, outerTopX - 6, opts.halfH * 0.55);
  }

  let angle = 0;
  let velocity = 0;
  let targetAngle = 0;
  const liquidTopY = innerBotY - opts.fillLevel * (innerBotY - innerTopY);

  const colCount = 5;
  const columns: number[] = [];
  for (let c = 0; c < colCount; c++) {
    columns.push(((c - (colCount - 1) / 2) / (colCount - 1)) * innerBotX * 1.4);
  }
  const bubbles = Array.from({ length: 22 }, (_, i) => ({
    col: columns[i % columns.length] + (Math.random() - 0.5) * 6,
    speed: 0.2 + Math.random() * 0.35,
    phase: Math.random(),
    r: 0.8 + Math.random() * 1.3,
  }));

  const drops = Array.from({ length: 13 }, () => {
    const dy = topY + 40 + Math.random() * (botY - topY - 60);
    const reach = outerTopX + ((dy - topY) / (botY - topY)) * (outerBotX - outerTopX);
    const side = Math.random() < 0.5 ? -1 : 1;
    return {
      x: side * (reach * (0.35 + Math.random() * 0.5)),
      y: dy,
      w: 1.2 + Math.random() * 1.6,
      h: 2.5 + Math.random() * 3.5,
    };
  });

  function update() {
    const stiffness = 0.1;
    const damping = 0.86;
    velocity += (targetAngle - angle) * stiffness;
    velocity *= damping;
    angle += velocity;
  }

  function draw(time: number) {
    ctx!.clearRect(0, 0, cssW, cssH);
    ctx!.save();
    ctx!.translate(cx, cy);

    const glow = ctx!.createRadialGradient(0, 0, 6, 0, 0, opts.halfH * 1.35);
    glow.addColorStop(0, opts.glow);
    glow.addColorStop(1, "rgba(0,0,0,0)");
    ctx!.fillStyle = glow;
    ctx!.fillRect(-cssW, -cssH, cssW * 2, cssH * 2);

    ctx!.save();
    ctx!.rotate(angle);

    ctx!.beginPath();
    ctx!.ellipse(4, botY + 6, outerBotX * 0.85, 9, 0, 0, Math.PI * 2);
    ctx!.fillStyle = "rgba(0,0,0,0.3)";
    ctx!.fill();

    handlePath();
    ctx!.lineWidth = opts.handleReach * 0.42;
    ctx!.lineCap = "round";
    ctx!.lineJoin = "round";
    ctx!.strokeStyle = "rgba(214,232,255,0.16)";
    ctx!.stroke();
    handlePath();
    ctx!.lineWidth = 3;
    ctx!.strokeStyle = "rgba(255,255,255,0.4)";
    ctx!.stroke();

    outerBody();
    const bodyGrad = ctx!.createLinearGradient(-outerTopX, 0, outerTopX, 0);
    bodyGrad.addColorStop(0, "rgba(255,255,255,0.05)");
    bodyGrad.addColorStop(0.35, "rgba(255,255,255,0.16)");
    bodyGrad.addColorStop(0.5, "rgba(255,255,255,0.03)");
    bodyGrad.addColorStop(0.7, "rgba(0,0,0,0.05)");
    bodyGrad.addColorStop(1, "rgba(255,255,255,0.08)");
    ctx!.fillStyle = bodyGrad;
    ctx!.fill();

    ctx!.restore();

    ctx!.save();
    ctx!.rotate(angle);
    innerCavity();
    ctx!.clip();
    ctx!.rotate(-angle);

    const liqGrad = ctx!.createLinearGradient(0, liquidTopY, 0, innerBotY);
    liqGrad.addColorStop(0, opts.liquidTop);
    liqGrad.addColorStop(0.5, opts.liquidMid);
    liqGrad.addColorStop(1, opts.liquidBottom);
    ctx!.fillStyle = liqGrad;
    ctx!.fillRect(-cssW, liquidTopY, cssW * 2, innerBotY - liquidTopY + cssH);

    const t = (time || 0) * 0.001;
    for (const bb of bubbles) {
      const p = (t * bb.speed + bb.phase) % 1;
      const by = innerBotY - p * (innerBotY - liquidTopY - 4);
      const bx = bb.col + Math.sin(p * 14 + bb.phase * 8) * 1.6;
      if (by > liquidTopY + 3) {
        ctx!.globalAlpha = 0.5 * (1 - p * 0.6);
        ctx!.fillStyle = "rgba(255,244,214,0.8)";
        ctx!.beginPath();
        ctx!.arc(bx, by, bb.r, 0, Math.PI * 2);
        ctx!.fill();
      }
    }
    ctx!.globalAlpha = 1;

    const foamH = opts.foamH;
    ctx!.beginPath();
    ctx!.moveTo(-innerTopX * 1.2, liquidTopY + 4);
    for (let x = -innerTopX; x <= innerTopX; x += 4) {
      const bump = Math.sin(x * 0.35 + t * 1.2) * 2.2 + Math.sin(x * 0.9 - t * 0.7) * 1.1;
      ctx!.lineTo(x, liquidTopY - foamH * 0.6 + bump);
    }
    ctx!.lineTo(innerTopX * 1.2, liquidTopY + 4);
    ctx!.closePath();
    const foamGrad = ctx!.createLinearGradient(-innerTopX, liquidTopY - foamH, innerTopX, liquidTopY + 4);
    foamGrad.addColorStop(0, "#fffaf0");
    foamGrad.addColorStop(0.5, opts.foam);
    foamGrad.addColorStop(1, "#e4cf9f");
    ctx!.fillStyle = foamGrad;
    ctx!.fill();

    for (let i2 = 0; i2 < 16; i2++) {
      const fx = -innerTopX + (i2 / 15) * innerTopX * 2;
      const fy = liquidTopY - foamH * 0.5 + Math.sin(i2 * 1.8 + t) * (foamH * 0.28);
      const fr = 1 + (i2 % 3) * 0.6;
      ctx!.beginPath();
      ctx!.arc(fx, fy, fr, 0, Math.PI * 2);
      ctx!.fillStyle = i2 % 2 === 0 ? "rgba(255,255,255,0.65)" : "rgba(190,160,100,0.25)";
      ctx!.fill();
    }

    const sheen = ctx!.createLinearGradient(-innerTopX, 0, innerTopX, 0);
    sheen.addColorStop(0, "rgba(255,255,255,0)");
    sheen.addColorStop(0.5, "rgba(255,255,255,0.14)");
    sheen.addColorStop(1, "rgba(255,255,255,0)");
    ctx!.fillStyle = sheen;
    ctx!.fillRect(-innerTopX, liquidTopY + 2, innerTopX * 2, 6);

    ctx!.restore();

    ctx!.save();
    ctx!.rotate(angle);

    ctx!.save();
    outerBody();
    ctx!.clip();

    const band1 = ctx!.createLinearGradient(-outerTopX * 0.75, 0, -outerTopX * 0.15, 0);
    band1.addColorStop(0, "rgba(255,255,255,0)");
    band1.addColorStop(0.5, "rgba(255,255,255,0.38)");
    band1.addColorStop(1, "rgba(255,255,255,0)");
    ctx!.fillStyle = band1;
    ctx!.fillRect(-outerTopX, topY, outerTopX * 0.85, botY - topY);

    const band2 = ctx!.createLinearGradient(outerTopX * 0.05, 0, outerTopX * 0.55, 0);
    band2.addColorStop(0, "rgba(0,0,0,0)");
    band2.addColorStop(0.5, "rgba(0,0,0,0.14)");
    band2.addColorStop(1, "rgba(0,0,0,0)");
    ctx!.fillStyle = band2;
    ctx!.fillRect(0, topY, outerTopX * 0.7, botY - topY);

    for (const dr of drops) {
      ctx!.beginPath();
      ctx!.ellipse(dr.x, dr.y, dr.w, dr.h, 0, 0, Math.PI * 2);
      ctx!.fillStyle = "rgba(235,248,255,0.5)";
      ctx!.fill();
      ctx!.beginPath();
      ctx!.ellipse(dr.x - dr.w * 0.3, dr.y - dr.h * 0.3, dr.w * 0.3, dr.h * 0.3, 0, 0, Math.PI * 2);
      ctx!.fillStyle = "rgba(255,255,255,0.7)";
      ctx!.fill();
    }

    ctx!.restore();

    outerBody();
    ctx!.lineWidth = 2;
    ctx!.strokeStyle = opts.stroke;
    ctx!.stroke();

    ctx!.beginPath();
    ctx!.ellipse(0, topY, outerTopX, opts.topRY, 0, 0, Math.PI * 2);
    ctx!.lineWidth = 3.5;
    ctx!.strokeStyle = "rgba(255,255,255,0.4)";
    ctx!.stroke();
    ctx!.beginPath();
    ctx!.ellipse(0, topY + 3, innerTopX, opts.topRY * 0.7, 0, 0, Math.PI * 2);
    ctx!.strokeStyle = "rgba(0,0,0,0.15)";
    ctx!.lineWidth = 1.4;
    ctx!.stroke();

    handlePath();
    ctx!.lineWidth = 2;
    ctx!.strokeStyle = opts.stroke;
    ctx!.stroke();

    ctx!.restore();
    ctx!.restore();
  }

  let raf = 0;
  function loop(time: number) {
    update();
    draw(time);
    raf = requestAnimationFrame(loop);
  }
  raf = requestAnimationFrame(loop);

  return {
    setTarget(a: number) {
      targetAngle = Math.max(-opts.maxAngle, Math.min(opts.maxAngle, a));
    },
    stop() {
      cancelAnimationFrame(raf);
    },
  };
}

export default function BeerMug({ fillPercent }: { fillPercent: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [needsPermission, setNeedsPermission] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const maxAngle = (22 * Math.PI) / 180;
    const clamped = Math.max(0, Math.min(100, fillPercent));
    const mug = drawMug(canvas, {
      width: 200,
      height: 283,
      halfH: 117,
      outerTopX: 62,
      outerBotX: 58,
      wall: 8,
      handleReach: 38,
      topRY: 11,
      foamH: 17,
      maxAngle,
      fillLevel: clamped / 100,
      liquidTop: "#f4c65a",
      liquidMid: "#d99a2b",
      liquidBottom: "#9c5f18",
      foam: "#f2e2b8",
      stroke: "rgba(255,255,255,0.34)",
      glow: "rgba(214,175,60,0.2)",
    });

    function handleOrientation(e: DeviceOrientationEvent) {
      const gamma = e.gamma || 0;
      mug.setTarget((gamma / 45) * maxAngle);
    }

    function handlePointerMove(e: PointerEvent) {
      const cxp = window.innerWidth / 2;
      const rel = (e.clientX - cxp) / cxp;
      mug.setTarget(rel * maxAngle);
    }

    const OrientationEvt = window.DeviceOrientationEvent as DeviceOrientationEventIOS | undefined;

    (function attach() {
      if (orientationGranted && OrientationEvt) {
        window.addEventListener("deviceorientation", handleOrientation);
      } else if (OrientationEvt && typeof OrientationEvt.requestPermission === "function") {
        setNeedsPermission(true);
        window.addEventListener("pointermove", handlePointerMove);
      } else if (OrientationEvt) {
        window.addEventListener("deviceorientation", handleOrientation);
      } else {
        window.addEventListener("pointermove", handlePointerMove);
      }
    })();

    return () => {
      mug.stop();
      window.removeEventListener("deviceorientation", handleOrientation);
      window.removeEventListener("pointermove", handlePointerMove);
    };
  }, [fillPercent]);

  async function requestGyro() {
    const OrientationEvt = window.DeviceOrientationEvent as DeviceOrientationEventIOS;
    try {
      const result = await OrientationEvt.requestPermission?.();
      if (result === "granted") {
        orientationGranted = true;
        setNeedsPermission(false);
      }
    } catch {
      // permesso negato o non disponibile: resta il fallback al puntatore
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <canvas ref={canvasRef} style={{ width: 150, height: 212 }} aria-label="Boccale di birra" />
      {needsPermission && (
        <button
          type="button"
          onClick={requestGyro}
          className="rounded-md border border-card-border bg-card px-3 py-1 text-xs text-foreground"
        >
          Attiva il giroscopio
        </button>
      )}
    </div>
  );
}
