
import React, { useState, useRef } from 'react';
import { User } from '../types';
import { Button } from './Button';
import { ICONS } from '../constants';

interface ProfilePageProps {
  user: User;
  onUpdateUser: (updates: Partial<User>) => void;
  onLogout: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ user, onUpdateUser, onLogout }) => {
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
    bio: user.bio || '',
    skillLevel: user.skillLevel || 'Casual',
    location: user.location || ''
  });
  
  const [settings, setSettings] = useState(user.settings || { notifications: true, publicProfile: true });
  const [isDirty, setIsDirty] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setIsDirty(true);
  };

  const handleSettingToggle = (setting: keyof typeof settings) => {
    const newSettings = { ...settings, [setting]: !settings[setting] };
    setSettings(newSettings);
    setIsDirty(true);
  };

  const handleSave = () => {
    onUpdateUser({
      ...formData,
      settings,
      skillLevel: formData.skillLevel as any
    });
    setIsDirty(false);
    // Show toast ideally
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Create local object URL for preview
      const imageUrl = URL.createObjectURL(file);
      onUpdateUser({ avatar: imageUrl });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left Column: Avatar & Quick Stats */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-gray-100 group-hover:border-hoop-orange transition-colors">
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              </div>
              <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                <ICONS.Camera width={24} height={24} />
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleImageUpload}
              />
            </div>
            
            <h2 className="mt-4 text-xl font-bold text-gray-900">{user.name}</h2>
            <p className="text-sm text-gray-500">{user.email}</p>
            
            <div className="mt-4 flex gap-2">
                <span className="px-3 py-1 bg-orange-50 text-hoop-orange text-xs font-bold rounded-full uppercase">
                    {user.skillLevel || 'Rookie'}
                </span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-4">Account Settings</h3>
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Email Notifications</span>
                    <button 
                        onClick={() => handleSettingToggle('notifications')}
                        className={`w-10 h-6 rounded-full transition-colors relative ${settings.notifications ? 'bg-hoop-orange' : 'bg-gray-300'}`}
                    >
                        <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${settings.notifications ? 'left-5' : 'left-1'}`}></div>
                    </button>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Public Profile</span>
                    <button 
                        onClick={() => handleSettingToggle('publicProfile')}
                        className={`w-10 h-6 rounded-full transition-colors relative ${settings.publicProfile ? 'bg-hoop-orange' : 'bg-gray-300'}`}
                    >
                        <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${settings.publicProfile ? 'left-5' : 'left-1'}`}></div>
                    </button>
                </div>
                <div className="pt-4 border-t border-gray-100">
                    <Button variant="danger" fullWidth onClick={onLogout}>
                        Log Out
                    </Button>
                </div>
            </div>
          </div>
        </div>

        {/* Right Column: Edit Form */}
        <div className="md:col-span-2">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Edit Profile</h2>
                    {isDirty && <span className="text-sm text-amber-500 font-medium animate-pulse">Unsaved Changes</span>}
                </div>

                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                            <input 
                                type="text" 
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-hoop-orange focus:border-transparent outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input 
                                type="email" 
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-hoop-orange focus:border-transparent outline-none bg-gray-50"
                                readOnly
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Home Court / Location</label>
                        <input 
                            type="text" 
                            name="location"
                            placeholder="e.g. Brooklyn, NY"
                            value={formData.location}
                            onChange={handleInputChange}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-hoop-orange focus:border-transparent outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Skill Level</label>
                        <select 
                            name="skillLevel"
                            value={formData.skillLevel}
                            onChange={handleInputChange}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-hoop-orange focus:border-transparent outline-none"
                        >
                            <option value="Casual">Casual (Just for fun)</option>
                            <option value="All Levels">All Levels</option>
                            <option value="Competitive">Competitive (High School/College exp)</option>
                            <option value="Pro">Pro / Elite</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                        <textarea 
                            name="bio"
                            rows={4}
                            placeholder="Tell us about your game..."
                            value={formData.bio}
                            onChange={handleInputChange}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-hoop-orange focus:border-transparent outline-none resize-none"
                        ></textarea>
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <Button variant="outline" onClick={() => setIsDirty(false)}>Reset</Button>
                        <Button onClick={handleSave} disabled={!isDirty}>Save Changes</Button>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
