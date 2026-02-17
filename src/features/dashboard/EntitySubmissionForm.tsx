import { useState } from 'react';
import { useAppSelector } from '../../store/hooks';

export default function EntitySubmissionForm() {
    const agentName = useAppSelector(state => state.config.agentName);
    const [name, setName] = useState('');
    const [type, setType] = useState('Demonio');
    const [influence, setInfluence] = useState('');
    const [description, setDescription] = useState('');
    const [source, setSource] = useState('');
    const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('saving');

        try {
            const response = await fetch('/api/entities/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    type,
                    influence,
                    description,
                    source: source || 'Unknown',
                    contributor: agentName,
                    biblical_reference: '',
                    countermeasures: ''
                })
            });

            if (response.ok) {
                setStatus('success');
                setName('');
                setInfluence('');
                setDescription('');
                setSource('');
                setTimeout(() => setStatus('idle'), 3000);
            } else {
                throw new Error('Failed to save');
            }
        } catch (error) {
            console.error(error);
            setStatus('error');
        }
    };

    return (
        <div className="cyber-panel" style={{ padding: '15px', border: '1px solid var(--cyber-primary)' }}>
            <h3 className="cyber-title" style={{ fontSize: '0.9rem' }}>+ NEW ENTITY ENTRY</h3>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div>
                    <label className="data-label">NAME</label>
                    <input className="sci-fi-input" value={name} onChange={e => setName(e.target.value)} required placeholder="e.g., Moloch" />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                        <label className="data-label">TYPE</label>
                        <select className="sci-fi-input" value={type} onChange={e => setType(e.target.value)}>
                            <option value="Demonio">Demonio</option>
                            <option value="Arcángel">Arcángel</option>
                            <option value="Espíritu Urbano">Espíritu Urbano</option>
                            <option value="Principado">Principado</option>
                        </select>
                    </div>
                    <div>
                        <label className="data-label">INFLUENCE</label>
                        <input className="sci-fi-input" value={influence} onChange={e => setInfluence(e.target.value)} required placeholder="e.g., Anger, Greed" />
                    </div>
                </div>

                <div>
                    <label className="data-label">DESCRIPTION</label>
                    <textarea className="sci-fi-input" value={description} onChange={e => setDescription(e.target.value)} rows={3} required />
                </div>

                <div>
                    <label className="data-label">SOURCE / BOOK</label>
                    <input className="sci-fi-input" value={source} onChange={e => setSource(e.target.value)} placeholder="e.g., Dictionnaire Infernal" />
                </div>

                <div className="hud-line"></div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="data-label" style={{ fontSize: '0.7rem' }}>SIGNED AS: {agentName}</span>
                    <button type="submit" className="cyber-button" disabled={status === 'saving'}>
                        {status === 'saving' ? 'UPLOADING...' : status === 'success' ? 'UPLOAD COMPLETE' : 'SUBMIT DATA'}
                    </button>
                </div>
                {status === 'error' && <span style={{ color: 'var(--cyber-danger)', fontSize: '0.8rem' }}>Error uploading data. Check connection.</span>}
            </form>
        </div>
    );
}
