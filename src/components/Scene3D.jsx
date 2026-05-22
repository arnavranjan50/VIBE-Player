import { useRef, useEffect } from 'react';

// Upgraded interactive canvas background with:
// - Floating gradient mesh blobs
// - Subtle aurora waves
// - Responsive particle constellations
// - Music-themed visual rhythm

export default function Scene3D() {
  const canvasRef = useRef(null);
  const mouse = useRef({ x: 0.5, y: 0.5 });
  const animRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let w = window.innerWidth;
    let h = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.scale(dpr, dpr);

    const onResize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    };

    const onMouseMove = (e) => {
      mouse.current.x = e.clientX / w;
      mouse.current.y = e.clientY / h;
    };

    window.addEventListener('resize', onResize);
    window.addEventListener('mousemove', onMouseMove);

    // ── Gradient Mesh Blobs ──
    const blobs = [
      { x: 0.2, y: 0.3, vx: 0.0002, vy: 0.0001, radius: 280, color: [250, 45, 72], opacity: 0.04 },
      { x: 0.75, y: 0.6, vx: -0.0001, vy: 0.00015, radius: 320, color: [168, 85, 247], opacity: 0.035 },
      { x: 0.5, y: 0.15, vx: 0.00015, vy: -0.0001, radius: 240, color: [59, 130, 246], opacity: 0.03 },
      { x: 0.85, y: 0.2, vx: -0.0002, vy: 0.0002, radius: 200, color: [16, 185, 129], opacity: 0.025 },
    ];

    // ── Particles (fewer, but more elegant) ──
    const particles = Array.from({ length: 50 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.15,
      vy: (Math.random() - 0.5) * 0.15,
      size: 0.8 + Math.random() * 1.8,
      opacity: 0.1 + Math.random() * 0.2,
      phase: Math.random() * Math.PI * 2,
      hue: Math.random() > 0.5 ? 0 : (Math.random() > 0.5 ? 270 : 210), // red, purple, or blue
    }));

    // ── Aurora wave params ──
    const aurora = {
      waves: [
        { amplitude: 30, frequency: 0.003, speed: 0.3, yOffset: 0.45, color: [250, 45, 72], opacity: 0.015 },
        { amplitude: 25, frequency: 0.004, speed: -0.25, yOffset: 0.55, color: [168, 85, 247], opacity: 0.012 },
        { amplitude: 20, frequency: 0.005, speed: 0.2, yOffset: 0.65, color: [59, 130, 246], opacity: 0.01 },
      ],
    };

    let time = 0;

    const animate = () => {
      time += 0.01;
      ctx.clearRect(0, 0, w, h);

      const mx = mouse.current.x;
      const my = mouse.current.y;

      // ── 1. Aurora waves ──
      aurora.waves.forEach((wave) => {
        ctx.beginPath();
        const baseY = wave.yOffset * h + (my - 0.5) * 40;

        for (let x = 0; x <= w; x += 3) {
          const y = baseY +
            Math.sin(x * wave.frequency + time * wave.speed) * wave.amplitude +
            Math.sin(x * wave.frequency * 1.5 + time * wave.speed * 0.7) * (wave.amplitude * 0.4);
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }

        ctx.lineTo(w, h);
        ctx.lineTo(0, h);
        ctx.closePath();

        const grad = ctx.createLinearGradient(0, baseY - wave.amplitude, 0, baseY + 200);
        grad.addColorStop(0, `rgba(${wave.color.join(',')}, ${wave.opacity * 2})`);
        grad.addColorStop(0.5, `rgba(${wave.color.join(',')}, ${wave.opacity})`);
        grad.addColorStop(1, `rgba(${wave.color.join(',')}, 0)`);
        ctx.fillStyle = grad;
        ctx.fill();
      });

      // ── 2. Gradient Mesh Blobs ──
      blobs.forEach((blob) => {
        // Gentle autonomous drift
        blob.x += blob.vx;
        blob.y += blob.vy;
        if (blob.x < -0.1 || blob.x > 1.1) blob.vx *= -1;
        if (blob.y < -0.1 || blob.y > 1.1) blob.vy *= -1;

        // Mouse attraction
        const bx = blob.x * w + (mx - 0.5) * 80;
        const by = blob.y * h + (my - 0.5) * 50;
        const pulseRadius = blob.radius + Math.sin(time * 0.5 + blob.x * 10) * 30;

        const gradient = ctx.createRadialGradient(bx, by, 0, bx, by, pulseRadius);
        gradient.addColorStop(0, `rgba(${blob.color.join(',')}, ${blob.opacity * 1.8})`);
        gradient.addColorStop(0.4, `rgba(${blob.color.join(',')}, ${blob.opacity})`);
        gradient.addColorStop(1, `rgba(${blob.color.join(',')}, 0)`);
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(bx, by, pulseRadius, 0, Math.PI * 2);
        ctx.fill();
      });

      // ── 3. Particles with constellation lines ──
      particles.forEach((p) => {
        const dx = mx * w - p.x;
        const dy = my * h - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;

        p.x += p.vx + (dx / dist) * 0.04 + Math.sin(time * 1.5 + p.phase) * 0.12;
        p.y += p.vy + (dy / dist) * 0.04 + Math.cos(time * 1.2 + p.phase) * 0.1;

        // Wrap
        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;
        if (p.y < -10) p.y = h + 10;
        if (p.y > h + 10) p.y = -10;

        const pulse = 1 + Math.sin(time * 2 + p.phase) * 0.25;
        const brightness = p.opacity * (0.8 + 0.2 * Math.sin(time + p.phase));

        // Draw glow
        const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * pulse * 4);
        glow.addColorStop(0, `rgba(255, 255, 255, ${brightness * 0.3})`);
        glow.addColorStop(1, `rgba(255, 255, 255, 0)`);
        ctx.fillStyle = glow;
        ctx.fillRect(p.x - p.size * 4, p.y - p.size * 4, p.size * 8, p.size * 8);

        // Draw dot
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * pulse, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${brightness})`;
        ctx.fill();
      });

      // Constellation lines (only nearby particles)
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            const alpha = 0.035 * (1 - dist / 100);
            ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      // ── 4. Subtle vignette overlay ──
      const vignetteGrad = ctx.createRadialGradient(w / 2, h / 2, w * 0.2, w / 2, h / 2, w * 0.8);
      vignetteGrad.addColorStop(0, 'rgba(5, 5, 7, 0)');
      vignetteGrad.addColorStop(1, 'rgba(5, 5, 7, 0.3)');
      ctx.fillStyle = vignetteGrad;
      ctx.fillRect(0, 0, w, h);

      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('mousemove', onMouseMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  );
}
