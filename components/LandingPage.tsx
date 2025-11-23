
import React from 'react';
import { Button } from './Button';
import { ICONS } from '../constants';

interface LandingPageProps {
  onLoginClick: () => void;
  onSignupClick: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLoginClick, onSignupClick }) => {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Navigation */}
      <nav className="w-full px-6 py-4 flex justify-between items-center max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2 text-hoop-orange">
            <ICONS.Basketball width={32} height={32} />
            <span className="text-2xl font-black text-gray-900 tracking-tighter">HoopLink</span>
        </div>
        <div className="flex gap-4">
            <Button variant="outline" onClick={onLoginClick}>Log In</Button>
            <Button variant="primary" onClick={onSignupClick}>Sign Up</Button>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="flex-1 flex items-center relative overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-5 pointer-events-none">
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                <path d="M0 100 C 20 0 50 0 100 100 Z" fill="#FF5722" />
            </svg>
        </div>
        
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center relative z-10 py-12">
            <div className="space-y-6 animate-in slide-in-from-left duration-700">
                <h1 className="text-5xl md:text-7xl font-black text-gray-900 leading-tight">
                    Find Your <span className="text-hoop-orange">Court.</span><br/>
                    Find Your <span className="text-hoop-dark">Squad.</span>
                </h1>
                <p className="text-xl text-gray-500 max-w-md leading-relaxed">
                    The ultimate app for scheduling pickup games, discovering local courts, and connecting with ballers in your area.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                    <Button variant="primary" className="px-8 py-4 text-lg" onClick={onSignupClick}>
                        Get Started Free
                    </Button>
                    <Button variant="outline" className="px-8 py-4 text-lg" onClick={onLoginClick}>
                        Explore Maps
                    </Button>
                </div>
                <div className="pt-8 flex items-center gap-4 text-sm text-gray-500 font-medium">
                    <div className="flex -space-x-3">
                        {[
                            "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&h=100",
                            "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=100&h=100",
                            "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&h=100",
                            "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=100&h=100"
                        ].map((src, i) => (
                            <img 
                                key={i} 
                                src={src} 
                                alt="Player" 
                                className="w-10 h-10 rounded-full border-2 border-white object-cover ring-2 ring-gray-50" 
                            />
                        ))}
                    </div>
                    <p>Join 1,000+ local players</p>
                </div>
            </div>
            
            <div className="relative hidden md:block animate-in zoom-in duration-1000 delay-200 h-[500px] w-full">
                <div className="absolute inset-0 bg-gradient-to-tr from-hoop-orange to-purple-500 rounded-[2rem] blur-2xl opacity-20 transform rotate-6"></div>
                
                {/* Main Hero Image */}
                <div className="absolute inset-0 rounded-[2rem] overflow-hidden shadow-2xl transform rotate-3 hover:rotate-0 transition-all duration-500 border-4 border-white bg-gray-900">
                    <img 
                        src="https://images.unsplash.com/photo-1546519638-68e109498ffc?q=80&w=1000&auto=format&fit=crop" 
                        alt="Basketball players playing outside" 
                        className="w-full h-full object-cover opacity-90 hover:opacity-100 transition-opacity"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                    
                    <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                        <div className="font-bold text-lg">Venice Beach Courts</div>
                        <div className="flex items-center gap-2 text-sm opacity-90">
                            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                            Live Action Now
                        </div>
                    </div>
                </div>

                {/* Floating UI Card Overlay */}
                <div className="absolute -bottom-6 -left-6 bg-white rounded-xl p-4 shadow-xl max-w-xs border border-gray-100 transform -rotate-2 hover:rotate-0 transition-all duration-300 z-20">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-hoop-orange/10 rounded-full flex items-center justify-center text-hoop-orange">
                             <ICONS.MapPin width={20} />
                        </div>
                        <div>
                            <div className="font-bold text-gray-900 text-sm">Rucker Park Run</div>
                            <div className="text-xs text-gray-500">Starting in 15 min</div>
                        </div>
                    </div>
                    <div className="flex -space-x-2 mb-3 pl-2">
                         {[
                            "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=64&h=64",
                            "https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=64&h=64",
                            "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=64&h=64"
                         ].map((src, i) => (
                            <img key={i} src={src} className="w-8 h-8 rounded-full border-2 border-white object-cover" />
                         ))}
                         <div className="w-8 h-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-xs font-bold text-gray-500">+5</div>
                    </div>
                    <Button variant="primary" fullWidth size="sm" className="text-xs py-2">Join Game</Button>
                </div>
            </div>
        </div>
      </div>

      {/* Feature Grid */}
      <div className="bg-gray-50 py-24">
        <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
                <h2 className="text-3xl font-bold text-gray-900">Everything you need to ball</h2>
                <p className="text-gray-500 mt-2">Simple tools for the modern hooper.</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
                {[
                    { 
                        icon: <ICONS.MapPin className="w-8 h-8 text-hoop-orange" />, 
                        title: "Locate Courts", 
                        desc: "Find hidden gems and popular courts near you with real-time info." 
                    },
                    { 
                        icon: <ICONS.Calendar className="w-8 h-8 text-hoop-orange" />, 
                        title: "Schedule Runs", 
                        desc: "Set a time, set the rules, and let people know where the game is at." 
                    },
                    { 
                        icon: <ICONS.MessageSquare className="w-8 h-8 text-hoop-orange" />, 
                        title: "Team Chat", 
                        desc: "Coordinate with players before you arrive so you never play alone." 
                    }
                ].map((feature, idx) => (
                    <div key={idx} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                        <div className="bg-orange-50 w-16 h-16 rounded-xl flex items-center justify-center mb-6">
                            {feature.icon}
                        </div>
                        <h3 className="text-xl font-bold mb-3 text-gray-900">{feature.title}</h3>
                        <p className="text-gray-500 leading-relaxed">{feature.desc}</p>
                    </div>
                ))}
            </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-hoop-dark text-gray-400 py-12 text-center border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-6 flex flex-col items-center gap-4">
            <div className="flex items-center gap-2 text-white opacity-50">
                <ICONS.Basketball width={24} height={24} />
                <span className="font-bold text-lg">HoopLink</span>
            </div>
            <p className="text-sm">© {new Date().getFullYear()} HoopLink. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};
