import { useRef, useEffect } from 'react';
import type { CollectiveState } from '../CollectiveSchema';

interface EnergyFieldProps {
    state: CollectiveState | null;
}

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    life: number;
    color: string;
}

export default function EnergyField({ state }: EnergyFieldProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const particles = useRef<Particle[]>([]);

    // Parameters
    const coherence = state?.field_coherence || 0.5; // Dictates particle alignment
    const intensity = state?.emotional_temperature || 0.3; // Dictates speed/count
    const emotions = state?.dominant_emotions || {};

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;

        const resize = () => {
            if (canvas.parentElement) {
                canvas.width = canvas.parentElement.clientWidth;
                canvas.height = canvas.parentElement.clientHeight;
            }
        };
        window.addEventListener('resize', resize);
        resize();

        // Particle Spawner
        const spawnParticle = (w: number, h: number) => {
            const p: Particle = {
                x: Math.random() * w,
                y: Math.random() * h,
                vx: (Math.random() - 0.5) * (intensity * 4),
                vy: (Math.random() - 0.5) * (intensity * 4),
                size: Math.random() * 3,
                life: 1.0,
                color: '255, 255, 255'
            };

            // Color based on random emotion check
            const rand = Math.random();
            if (rand < (emotions.anger || 0)) p.color = '255, 50, 50'; // Red
            else if (rand < ((emotions.anger || 0) + (emotions.hope || 0))) p.color = '50, 200, 255'; // Blue
            else if (rand < ((emotions.anger || 0) + (emotions.hope || 0) + (emotions.fear || 0))) p.color = '100, 100, 100'; // Grey
            else p.color = '200, 100, 255'; // Purple (Unity/Default)

            return p;
        };

        const render = () => {
            const width = canvas.width;
            const height = canvas.height;

            // Trail effect
            ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            ctx.fillRect(0, 0, width, height);

            // Maintain particle count based on intensity
            const targetCount = 50 + (intensity * 150);
            if (particles.current.length < targetCount) {
                particles.current.push(spawnParticle(width, height));
            }

            // Update & Draw
            ctx.globalCompositeOperation = 'lighter'; // Additive blending for "energy" look

            for (let i = particles.current.length - 1; i >= 0; i--) {
                const p = particles.current[i];

                // Physics
                p.x += p.vx;
                p.y += p.vy;
                p.life -= 0.01;

                // Coherence Factor: If high coherence, particles align towards center or flow together
                if (coherence > 0.6) {
                    // Flow towards center
                    const dx = (width / 2) - p.x;
                    const dy = (height / 2) - p.y;
                    p.vx += dx * 0.001 * coherence;
                    p.vy += dy * 0.001 * coherence;
                }

                // Wrap around
                if (p.x < 0) p.x = width;
                if (p.x > width) p.x = 0;
                if (p.y < 0) p.y = height;
                if (p.y > height) p.y = 0;

                // Draw
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${p.color}, ${p.life})`;
                ctx.fill();

                // Kill dead particles
                if (p.life <= 0) particles.current.splice(i, 1);
            }

            ctx.globalCompositeOperation = 'source-over';

            animationFrameId = requestAnimationFrame(render);
        };

        render();

        return () => {
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(animationFrameId);
        };
    }, [state, coherence, intensity, emotions]);

    return <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />;
}
