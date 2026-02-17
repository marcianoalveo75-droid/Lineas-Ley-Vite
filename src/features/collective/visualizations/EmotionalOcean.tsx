import { useRef, useEffect } from 'react';
import type { CollectiveState, EmotionVector } from '../CollectiveSchema';

interface EmotionalOceanProps {
    state: CollectiveState | null;
}

export default function EmotionalOcean({ state }: EmotionalOceanProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Default emotions if state is null
    const emotions: Partial<EmotionVector> = state?.dominant_emotions || { fear: 0.1, hope: 0.1, chaos: 0.1 };

    // Determine Parameters
    // Intensity = Wave Height (Amplitude)
    const intensity = state?.emotional_temperature || 0.3;
    const baseAmp = 20 + (intensity * 50);

    // Chaos/Fear = Choppiness (Frequency modulation)
    const choppiness = (emotions.chaos || 0) + (emotions.fear || 0);

    // Anger = Speed
    const speed = 0.02 + ((emotions.anger || 0) * 0.05);

    // Color Logic
    const getBaseColor = () => {
        if ((emotions.anger || 0) > 0.3) return { r: 255, g: 50, b: 50 }; // Red
        if ((emotions.fear || 0) > 0.3) return { r: 50, g: 50, b: 50 }; // Dark Grey
        if ((emotions.hope || 0) > 0.3) return { r: 50, g: 200, b: 255 }; // Light Blue
        if ((emotions.unity || 0) > 0.3) return { r: 200, g: 100, b: 255 }; // Purple
        if ((emotions.chaos || 0) > 0.3) return { r: 255, g: 150, b: 0 }; // Orange
        return { r: 0, g: 100, b: 150 }; // Deep Teal Default
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let time = 0;

        const resize = () => {
            if (canvas.parentElement) {
                canvas.width = canvas.parentElement.clientWidth;
                canvas.height = canvas.parentElement.clientHeight;
            }
        };
        window.addEventListener('resize', resize);
        resize();

        const render = () => {
            const width = canvas.width;
            const height = canvas.height;
            const color = getBaseColor();

            ctx.clearRect(0, 0, width, height);

            // Background Gradient
            const gradient = ctx.createLinearGradient(0, 0, 0, height);
            gradient.addColorStop(0, '#050510');
            gradient.addColorStop(1, `rgba(${color.r * 0.3}, ${color.g * 0.3}, ${color.b * 0.3}, 1)`);
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, width, height);

            // Draw Waves
            const drawWave = (yOffset: number, freq: number, amp: number, phase: number, alpha: number) => {
                ctx.beginPath();
                ctx.moveTo(0, height);
                for (let x = 0; x <= width; x += 5) {
                    // Sine wave with chaos modulation
                    const y = Math.sin(x * freq + time * speed + phase) * amp
                        + Math.cos(x * (freq * 2.5) + time * (speed * 0.8)) * (amp * choppiness);
                    ctx.lineTo(x, yOffset + y);
                }
                ctx.lineTo(width, height);
                ctx.lineTo(0, height);
                ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`;
                ctx.fill();
            };

            // Back Wave
            drawWave(height * 0.6, 0.005, baseAmp * 0.8, 0, 0.2);
            // Middle Wave
            drawWave(height * 0.7, 0.008, baseAmp, 2, 0.4);
            // Front Wave
            drawWave(height * 0.8, 0.012, baseAmp * 1.2, 4, 0.7);

            // Info Overlay
            ctx.fillStyle = "rgba(255,255,255,0.8)";
            ctx.font = "12px monospace";
            ctx.fillText(`PHASE: ${(state?.phase || 'FLUX').toUpperCase()}`, 10, 20);
            ctx.fillText(`TEMP:  ${(intensity * 100).toFixed(0)}%`, 10, 35);

            time += 1;
            animationFrameId = requestAnimationFrame(render);
        };

        render();

        return () => {
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(animationFrameId);
        };
    }, [state, emotions, intensity, baseAmp, choppiness, speed]);

    return <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />;
}
