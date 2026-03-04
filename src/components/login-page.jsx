'use client';

import { useState, useRef, useEffect } from 'react';
import { useSetAtom } from 'jotai';
import { isAuthenticatedAtom, verifyCredentials, createSession } from '@/lib/auth';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, User, Eye, EyeOff, ShieldCheck, AlertCircle } from 'lucide-react';

export default function LoginPage() {
    const setAuthenticated = useSetAtom(isAuthenticatedAtom);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [shake, setShake] = useState(false);
    const usernameRef = useRef(null);

    useEffect(() => {
        usernameRef.current?.focus();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (loading) return;
        setError('');
        setLoading(true);

        // Small delay for UX polish + hashing time
        await new Promise((r) => setTimeout(r, 300));

        const valid = await verifyCredentials(username.trim(), password);

        if (valid) {
            createSession();
            setAuthenticated(true);
        } else {
            setError('Invalid credentials');
            setShake(true);
            setTimeout(() => setShake(false), 600);
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            {/* Central login card */}
            <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, ease: [0.23, 1.0, 0.32, 1.0] }}
                className={`login-card ${shake ? 'login-shake' : ''}`}
            >                    {/* Header */}
                <div className="login-header">
                    <motion.div
                        className="login-logo"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 15 }}
                    >
                        <div className="login-logo-inner">
                            <span>D</span>
                        </div>
                    </motion.div>
                    <motion.h1
                        className="login-title"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.4 }}
                    >
                        Day Planner
                    </motion.h1>
                </div>

                {/* Form */}
                <motion.form
                    onSubmit={handleSubmit}
                    className="login-form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.45, duration: 0.4 }}
                >
                    {/* Username */}
                    <div className="login-field">
                        <label className="login-label">
                            <User size={11} />
                            USERNAME
                        </label>
                        <div className="login-input-wrapper">
                            <input
                                ref={usernameRef}
                                type="text"
                                value={username}
                                onChange={(e) => { setUsername(e.target.value); setError(''); }}
                                placeholder="Enter username"
                                className="login-input"
                                autoComplete="username"
                                disabled={loading}
                            />
                        </div>
                    </div>

                    {/* Password */}
                    <div className="login-field">
                        <label className="login-label">
                            <Lock size={11} />
                            PASSWORD
                        </label>
                        <div className="login-input-wrapper">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                                placeholder="Enter password"
                                className="login-input"
                                autoComplete="current-password"
                                disabled={loading}
                            />
                            <button
                                type="button"
                                className="login-eye-btn"
                                onClick={() => setShowPassword(!showPassword)}
                                tabIndex={-1}
                            >
                                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                            </button>
                        </div>
                    </div>

                    {/* Error */}
                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -4, height: 0 }}
                                animate={{ opacity: 1, y: 0, height: 'auto' }}
                                exit={{ opacity: 0, y: -4, height: 0 }}
                                className="login-error"
                            >
                                <AlertCircle size={13} />
                                <span>{error}</span>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Submit */}
                    <button
                        type="submit"
                        className="login-submit"
                        disabled={loading || !username.trim() || !password}
                    >
                        <div className="login-submit-sweep" />
                        {loading ? (
                            <div className="login-spinner" />
                        ) : (
                            <>
                                <ShieldCheck size={16} />
                                <span>AUTHENTICATE</span>
                            </>
                        )}
                    </button>
                </motion.form>

                {/* Footer */}
                <motion.p
                    className="login-footer"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                >
                    <Lock size={10} />
                    Secured access only
                </motion.p>
            </motion.div>
        </div>
    );
}
