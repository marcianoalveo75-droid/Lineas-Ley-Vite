import { useState } from 'react';
import { useAppDispatch } from '../../store/hooks';
import { login } from './authSlice';
import './Login.css';

export default function Login() {
    const dispatch = useAppDispatch();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isRegister, setIsRegister] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Mock auth logic
        if (email && password) {
            dispatch(login({ name: email.split('@')[0], email }));
        } else {
            alert('Por favor completa los campos');
        }
    };

    return (
        <div className="login-container">
            <div className="login-box">
                <div className="login-header">
                    <h1>Ley Lines Explorer</h1>
                    <p>Spiritual Mapping PWA</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="usuario@ejemplo.com"
                        />
                    </div>

                    <div className="form-group">
                        <label>Contraseña</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="******"
                        />
                    </div>

                    <button type="submit" className="login-btn">
                        {isRegister ? 'Registrarse' : 'Iniciar Sesión'}
                    </button>
                </form>

                <div className="login-footer">
                    <button className="link-btn" onClick={() => setIsRegister(!isRegister)}>
                        {isRegister ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}
                    </button>
                </div>
            </div>
        </div>
    );
}
