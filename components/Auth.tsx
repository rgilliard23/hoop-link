
import React, { useState } from 'react';
import { Button } from './Button';
import { ICONS } from '../constants';

interface AuthProps {
  type: 'LOGIN' | 'SIGNUP';
  onSuccess: (data: { name?: string, email: string }) => void;
  onSwitch: () => void;
  onBack: () => void;
}

export const AuthForm: React.FC<AuthProps> = ({ type, onSuccess, onSwitch, onBack }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
        setLoading(false);
        onSuccess({ name, email });
    }, 1000);
  };

  const isLogin = type === 'LOGIN';

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md p-8 rounded-3xl shadow-xl animate-in fade-in zoom-in duration-300 relative">
        
        {/* Back Button */}
        <button 
            onClick={onBack}
            className="absolute top-6 left-6 text-gray-400 hover:text-hoop-orange transition-colors p-1 rounded-full hover:bg-orange-50"
            title="Back to Home"
        >
            <ICONS.ChevronLeft className="w-6 h-6" />
        </button>

        <div className="text-center mb-8 mt-2">
            <div className="w-12 h-12 bg-hoop-orange text-white rounded-xl mx-auto flex items-center justify-center mb-4 shadow-lg shadow-orange-200">
                <ICONS.Basketball width={24} height={24} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
                {isLogin ? 'Welcome Back' : 'Join the Squad'}
            </h2>
            <p className="text-gray-500 text-sm mt-2">
                {isLogin ? 'Enter your details to access your account' : 'Create an account to start scheduling games'}
            </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <input 
                        type="text" 
                        required 
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-hoop-orange focus:border-transparent outline-none transition-all"
                        placeholder="Jordan Michael"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                </div>
            )}
            
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input 
                    type="email" 
                    required 
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-hoop-orange focus:border-transparent outline-none transition-all"
                    placeholder="baller@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input 
                    type="password" 
                    required 
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-hoop-orange focus:border-transparent outline-none transition-all"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
            </div>

            <Button type="submit" fullWidth disabled={loading} className="mt-6">
                {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
            </Button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button 
                onClick={onSwitch}
                className="font-bold text-hoop-orange hover:underline focus:outline-none"
            >
                {isLogin ? 'Sign up' : 'Log in'}
            </button>
        </div>
      </div>
    </div>
  );
};
