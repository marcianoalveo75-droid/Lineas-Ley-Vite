import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { login } from '../auth/authSlice';
import './LandingPage.css';

interface CardProps {
    id: number;
    title: string;
    bgImage: string;
    isActive: boolean;
    isInitiallyLocked: boolean;
    isUnlocked: boolean;
    unlocking: boolean;
    onNavigate: (id: number) => void;
}

const LockSVG = ({ unlocking, isUnlocked }: { unlocking: boolean; isUnlocked: boolean }) => {
    if (isUnlocked) return null;
    return (
        <div className={`lock-container ${unlocking ? 'unlocking' : ''}`}>
            <svg className="lock-svg" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <filter id="glow">
                        <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                    <linearGradient id="goldGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style={{ stopColor: '#FFD700', stopOpacity: 1 }} />
                        <stop offset="50%" style={{ stopColor: '#FFC700', stopOpacity: 1 }} />
                        <stop offset="100%" style={{ stopColor: '#DAA520', stopOpacity: 1 }} />
                    </linearGradient>
                </defs>
                <circle cx="50" cy="50" r="48" fill="none" stroke="rgba(255,215,160,0.15)" strokeWidth="2" filter="url(#glow)" />
                <g className="lock-body">
                    <rect x="28" y="55" width="44" height="25" rx="3" fill="none" stroke="url(#goldGradient)" strokeWidth="2.5" />
                    <path d="M 30 55 Q 30 52 33 52 L 67 52 Q 70 52 70 55" fill="none" stroke="url(#goldGradient)" strokeWidth="2.5" />
                    <circle cx="50" cy="68" r="3" fill="url(#goldGradient)" filter="url(#glow)" />
                    <g className="lock-shackle">
                        <path d="M 38 55 Q 38 35 50 30 Q 62 35 62 55" fill="none" stroke="url(#goldGradient)" strokeWidth="3" strokeLinecap="round" filter="url(#glow)" />
                    </g>
                </g>
            </svg>
        </div>
    );
};

const LandingCard = ({ id, title, bgImage, isActive, isInitiallyLocked, isUnlocked, unlocking, onNavigate }: CardProps) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const actuallyLocked = isInitiallyLocked && !isUnlocked;

    const handleMouseMove = (e: React.MouseEvent) => {
        if (actuallyLocked || !cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const mouseX = e.clientX - centerX;
        const mouseY = e.clientY - centerY;

        const rotateX = (mouseY / (rect.height / 2)) * -10;
        const rotateY = (mouseX / (rect.width / 2)) * 10;

        const baseScale = isActive ? 1.08 : 0.95;
        const baseTranslateZ = isActive ? 20 : 0;

        cardRef.current.style.transform = `
      scale(${baseScale}) 
      translateZ(${baseTranslateZ}px) 
      rotateX(${rotateX}deg) 
      rotateY(${rotateY}deg)
    `;
    };

    const handleMouseLeave = () => {
        if (cardRef.current) {
            cardRef.current.style.transform = '';
        }
    };

    const handleClick = () => {
        if (actuallyLocked) return;
        onNavigate(id);
    };

    return (
        <div
            ref={cardRef}
            className={`landing-card ${isActive ? 'active' : ''} ${actuallyLocked ? 'locked' : ''}`}
            onClick={handleClick}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
                background: `linear-gradient(135deg, rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.5)), url('${bgImage}') center/cover no-repeat`
            }}
        >
            {actuallyLocked && <div className="landing-overlay" />}
            <div className="landing-card-content">
                <LockSVG unlocking={unlocking} isUnlocked={isUnlocked} />
                <div className="landing-card-title">{title}</div>
            </div>
        </div>
    );
};

export default function LandingPage() {
    const [activeIndex, setActiveIndex] = useState(0);
    const [showAuth, setShowAuth] = useState(false);
    const [unlockedIds, setUnlockedIds] = useState<number[]>([0, 3]);
    const [unlockingId, setUnlockingId] = useState<number | null>(null);

    const { analysisResult } = useAppSelector(state => state.map);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const authCardRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const isAuthenticated = useAppSelector(state => state.auth.isAuthenticated);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isRegister, setIsRegister] = useState(false);

    const handleAuthSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (isRegister && password !== confirmPassword) {
            alert('Las contraseñas no coinciden');
            return;
        }

        if (email && password) {
            const userName = isRegister ? name : email.split('@')[0];
            dispatch(login({ name: userName || email.split('@')[0], email }));
            setShowAuth(false);
        }
    };

    const handleAuthMouseMove = (e: React.MouseEvent) => {
        if (!authCardRef.current) return;
        const card = authCardRef.current;
        const rect = card.getBoundingClientRect();

        // Spotlight effect
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        card.style.setProperty("--x", `${x}px`);
        card.style.setProperty("--y", `${y}px`);

        // 3D Tilt effect
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const mouseX = e.clientX - rect.left - centerX;
        const mouseY = e.clientY - rect.top - centerY;

        const rotateX = (mouseY / centerY) * 5;
        const rotateY = (mouseX / centerX) * -5;

        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    };

    const handleAuthMouseLeave = () => {
        if (authCardRef.current) {
            authCardRef.current.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg)`;
        }
    };

    // Reactive Unlocking: Card 1 (Ley Lines) when Auth is true
    useEffect(() => {
        if (isAuthenticated && !unlockedIds.includes(1)) {
            const unlock = async () => {
                await new Promise(r => setTimeout(r, 500));
                setUnlockingId(1);
                await new Promise(r => setTimeout(r, 800));
                setUnlockedIds(prev => [...prev, 1]);
                setUnlockingId(null);
                setActiveIndex(1);
            };
            unlock();
        }
    }, [isAuthenticated, unlockedIds]);

    // Reactive Unlocking: Card 2 (Reports) when Analysis is done
    useEffect(() => {
        if (analysisResult && !unlockedIds.includes(2)) {
            const unlock = async () => {
                await new Promise(r => setTimeout(r, 500));
                setUnlockingId(2);
                await new Promise(r => setTimeout(r, 800));
                setUnlockedIds(prev => [...prev, 2]);
                setUnlockingId(null);
            };
            unlock();
        }
    }, [analysisResult, unlockedIds]);

    // Focus on Report card if analysis results exist
    useEffect(() => {
        if (analysisResult && activeIndex !== 2) {
            setActiveIndex(2);
        }
    }, [analysisResult]);

    const cards = [
        { id: 0, title: 'Acceder', bgImage: '/assets/landing/auth_images/neon-animals.jpg', locked: false },
        { id: 3, title: 'Guía de Campo', bgImage: '/assets/landing/images/guiadecampo.png', locked: false },
        { id: 1, title: 'Líneas Ley', bgImage: '/assets/landing/images/cartalinealey.png', locked: true },
        { id: 2, title: 'Reportes', bgImage: '/assets/landing/images/reporte.png', locked: true },
    ];

    const drawParticles = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number, particles: any[]) => {
        ctx.clearRect(0, 0, width, height);
        const centerX = width / 2;
        const centerY = height / 2;
        const g = ctx.createRadialGradient(centerX, centerY, 50, centerX, centerY, Math.max(width, height));
        g.addColorStop(0, "rgba(0,150,255,0.15)");
        g.addColorStop(1, "rgba(0,150,255,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(centerX, centerY, Math.max(width, height), 0, Math.PI * 2);
        ctx.fill();
        particles.forEach(p => {
            p.y -= p.s;
            if (p.y < 0) p.y = height;
            ctx.fillStyle = "rgba(180,220,255,0.3)";
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fill();
        });
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        let animationId: number;
        const particles: any[] = [];
        const width = window.innerWidth;
        const height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;
        for (let i = 0; i < 120; i++) {
            particles.push({
                x: Math.random() * width,
                y: Math.random() * height,
                r: Math.random() * 1.5 + 0.5,
                s: Math.random() * 0.45 + 0.15
            });
        }
        const render = () => {
            drawParticles(ctx, canvas.width, canvas.height, particles);
            animationId = requestAnimationFrame(render);
        };
        render();
        const handleResize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        window.addEventListener('resize', handleResize);
        return () => {
            cancelAnimationFrame(animationId);
            window.removeEventListener('resize', handleResize);
        };
    }, [drawParticles]);

    const handleCardClick = (id: number) => {
        if (id === 0 && !isAuthenticated) {
            setActiveIndex(0);
            setShowAuth(true);
            return;
        }

        // Direct navigation if already active or if user expects immediate action on unlocked cards
        if (id === 0 && isAuthenticated) {
            navigate('/app');
        } else if (id === 1 && unlockedIds.includes(1)) {
            navigate('/app');
        } else if (id === 2 && unlockedIds.includes(2)) {
            navigate('/report');
        } else if (id === 3) {
            navigate('/manual');
        } else {
            setActiveIndex(id);
        }
    };

    return (
        <div className="landing-body">
            <div className="landing-static-bg" />
            <canvas ref={canvasRef} className="landing-fx-canvas" />
            <div className="landing-app-background" />

            <div className="landing-carousel-container">
                <div className="landing-carousel">
                    {cards.map((card, idx) => (
                        <LandingCard
                            key={card.id}
                            id={card.id}
                            title={card.title}
                            bgImage={card.bgImage}
                            isActive={idx === activeIndex}
                            isInitiallyLocked={card.locked}
                            isUnlocked={unlockedIds.includes(card.id)}
                            unlocking={unlockingId === card.id}
                            onNavigate={handleCardClick}
                        />
                    ))}
                </div>

                <div className="landing-dots">
                    {cards.map((_, idx) => (
                        <span
                            key={idx}
                            className={`landing-dot ${idx === activeIndex ? 'active' : ''}`}
                            onClick={() => setActiveIndex(idx)}
                        />
                    ))}
                </div>
            </div>

            <div className={`auth-overlay-backdrop ${showAuth ? 'active' : ''}`} onClick={() => setShowAuth(false)}>
                <div className="auth-wrapper">
                    <div
                        ref={authCardRef}
                        className="auth-card"
                        onClick={(e) => e.stopPropagation()}
                        onMouseMove={handleAuthMouseMove}
                        onMouseLeave={handleAuthMouseLeave}
                    >
                        <button className="auth-close-x" onClick={() => setShowAuth(false)}>×</button>

                        <div className="auth-forms-container">
                            <div className={`auth-form-box ${isRegister ? 'inactive' : 'active'}`}>
                                <h1 className="auth-h1">Bienvenido</h1>
                                <p className="auth-p-subtitle">Accede a tu cuenta Líneas Ley</p>

                                <form className="auth-inner-form" onSubmit={handleAuthSubmit}>
                                    <input
                                        className="auth-input-field"
                                        placeholder="Correo electrónico"
                                        type="email"
                                        required
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                    />
                                    <input
                                        className="auth-input-field"
                                        placeholder="Contraseña"
                                        type="password"
                                        required
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                    />
                                    <button type="submit" className="energy-btn">Entrar</button>
                                </form>

                                <div className="auth-divider">O continúa con</div>
                                <div className="auth-social">
                                    <i className="fab fa-google"></i>
                                    <i className="fab fa-apple"></i>
                                    <i className="fab fa-facebook"></i>
                                </div>

                                <div className="auth-footer-links">
                                    <span className="auth-mode-label">LOGIN</span>
                                    <span className="auth-slash">/</span>
                                    <span className="auth-mode-label subtle">REGISTRO</span>
                                </div>

                                <p className="auth-switch-text">
                                    ¿No tienes cuenta? <span className="auth-switch-link" onClick={() => setIsRegister(true)}>Crear cuenta</span>
                                </p>
                            </div>

                            <div className={`auth-form-box ${isRegister ? 'active' : 'inactive'}`}>
                                <h1 className="auth-h1">Crear Cuenta</h1>
                                <p className="auth-p-subtitle">Únete al mundo de las Líneas Ley</p>

                                <form className="auth-inner-form" onSubmit={handleAuthSubmit}>
                                    <input
                                        className="auth-input-field"
                                        placeholder="Nombre completo"
                                        type="text"
                                        required
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                    />
                                    <input
                                        className="auth-input-field"
                                        placeholder="Correo electrónico"
                                        type="email"
                                        required
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                    />
                                    <input
                                        className="auth-input-field"
                                        placeholder="Contraseña"
                                        type="password"
                                        required
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                    />
                                    <input
                                        className="auth-input-field"
                                        placeholder="Confirmar contraseña"
                                        type="password"
                                        required
                                        value={confirmPassword}
                                        onChange={e => setConfirmPassword(e.target.value)}
                                    />
                                    <button type="submit" className="energy-btn">Registrarme</button>
                                </form>

                                <div className="auth-divider">O regístrate con</div>
                                <div className="auth-social">
                                    <i className="fab fa-google"></i>
                                    <i className="fab fa-apple"></i>
                                    <i className="fab fa-facebook"></i>
                                </div>

                                <div className="auth-footer-links">
                                    <span className="auth-mode-label subtle">LOGIN</span>
                                    <span className="auth-slash">/</span>
                                    <span className="auth-mode-label">REGISTRO</span>
                                </div>

                                <p className="auth-switch-text">
                                    ¿Ya tienes cuenta? <span className="auth-switch-link" onClick={() => setIsRegister(false)}>Iniciar sesión</span>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
