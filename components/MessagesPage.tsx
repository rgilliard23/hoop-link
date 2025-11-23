
import React, { useState } from 'react';
import { ChatChannel, User } from '../types';
import { ChatRoom } from './ChatRoom';
import { ICONS } from '../constants';
import { Button } from './Button';

interface MessagesPageProps {
  channels: ChatChannel[];
  currentUser: User;
  activeChannelId: string | null;
  onSelectChannel: (id: string) => void;
  onSendMessage: (channelId: string, text: string) => void;
  onCreateChannel: (name: string, type: 'general', privacy: 'public' | 'private') => void;
  onAddParticipant: (channelId: string, name: string) => void;
}

export const MessagesPage: React.FC<MessagesPageProps> = ({
  channels,
  currentUser,
  activeChannelId,
  onSelectChannel,
  onSendMessage,
  onCreateChannel,
  onAddParticipant
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelPrivacy, setNewChannelPrivacy] = useState<'public' | 'private'>('public');

  // Filter channels:
  // 1. Public channels are visible to everyone
  // 2. Private channels are only visible if user is in participants
  const visibleChannels = channels.filter(c => 
    c.privacy === 'public' || 
    c.participants.includes(currentUser.id)
  );

  const activeChannel = visibleChannels.find(c => c.id === activeChannelId);
  
  // Sort channels by last message timestamp
  const sortedChannels = [...visibleChannels].sort((a, b) => b.lastMessageAt - a.lastMessageAt);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newChannelName.trim()) {
        onCreateChannel(newChannelName, 'general', newChannelPrivacy);
        setIsCreating(false);
        setNewChannelName('');
        setNewChannelPrivacy('public');
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 h-[calc(100vh-100px)] overflow-hidden flex">
      
      {/* Sidebar - List of Channels */}
      <div className={`${activeChannel ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-80 border-r border-gray-100 bg-gray-50/50`}>
        
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-100 bg-white flex items-center justify-between">
          <h2 className="font-bold text-xl text-gray-800">Messages</h2>
          <button 
            onClick={() => setIsCreating(true)}
            className="p-2 rounded-full hover:bg-gray-100 text-hoop-orange transition-colors"
            title="New Group Chat"
          >
            <ICONS.MessageSquarePlus width={20} height={20} />
          </button>
        </div>

        {/* Create Channel Form (Inline) */}
        {isCreating && (
            <form onSubmit={handleCreateSubmit} className="p-4 m-2 bg-white rounded-xl border border-gray-200 shadow-lg animate-in slide-in-from-top-2 z-10">
                <h3 className="font-bold text-sm mb-2 text-gray-800">New Group Chat</h3>
                <input 
                    autoFocus
                    type="text"
                    placeholder="Group Name..."
                    className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 mb-3 focus:border-hoop-orange outline-none focus:ring-1 focus:ring-hoop-orange"
                    value={newChannelName}
                    onChange={(e) => setNewChannelName(e.target.value)}
                />
                
                <div className="flex gap-2 mb-4">
                    <button
                        type="button"
                        onClick={() => setNewChannelPrivacy('public')}
                        className={`flex-1 py-1.5 text-xs font-medium rounded-md border ${newChannelPrivacy === 'public' ? 'bg-hoop-orange text-white border-hoop-orange' : 'bg-white text-gray-600 border-gray-200'}`}
                    >
                        Public
                    </button>
                    <button
                        type="button"
                        onClick={() => setNewChannelPrivacy('private')}
                        className={`flex-1 py-1.5 text-xs font-medium rounded-md border ${newChannelPrivacy === 'private' ? 'bg-hoop-dark text-white border-hoop-dark' : 'bg-white text-gray-600 border-gray-200'}`}
                    >
                        Private
                    </button>
                </div>

                <div className="flex gap-2">
                    <Button size="sm" fullWidth type="submit" disabled={!newChannelName.trim()}>Create</Button>
                    <Button size="sm" variant="outline" fullWidth type="button" onClick={() => setIsCreating(false)}>Cancel</Button>
                </div>
            </form>
        )}

        {/* Channel List */}
        <div className="flex-1 overflow-y-auto">
          {sortedChannels.length === 0 ? (
             <div className="p-6 text-center text-gray-400 text-sm">
                 No active chats. Join a game or create a group!
             </div>
          ) : (
              sortedChannels.map(channel => {
                const isActive = channel.id === activeChannelId;
                const lastMsg = channel.messages[channel.messages.length - 1];
                
                return (
                  <div 
                    key={channel.id}
                    onClick={() => onSelectChannel(channel.id)}
                    className={`p-4 cursor-pointer transition-colors border-b border-gray-50 hover:bg-gray-100 ${isActive ? 'bg-white border-l-4 border-l-hoop-orange shadow-sm' : 'border-l-4 border-l-transparent'}`}
                  >
                    <div className="flex justify-between items-start mb-1">
                        <div className="font-bold text-gray-800 text-sm truncate flex items-center gap-2 max-w-[70%]">
                            {channel.privacy === 'private' ? (
                                <ICONS.Lock width={14} className="text-gray-400 shrink-0" />
                            ) : (
                                <>
                                {channel.type === 'game' && <ICONS.Basketball width={14} className="text-hoop-orange shrink-0" />}
                                {channel.type === 'venue' && <ICONS.MapPin width={14} className="text-blue-500 shrink-0" />}
                                {channel.type === 'general' && <ICONS.Users width={14} className="text-gray-500 shrink-0" />}
                                </>
                            )}
                            <span className="truncate">{channel.name}</span>
                        </div>
                        {lastMsg && (
                            <span className="text-[10px] text-gray-400 whitespace-nowrap ml-2">
                                {new Date(lastMsg.timestamp).toLocaleDateString(undefined, {month:'short', day:'numeric'})}
                            </span>
                        )}
                    </div>
                    <div className="text-xs text-gray-500 truncate pl-6">
                        {lastMsg ? (
                            <span><span className="font-semibold text-gray-700">{lastMsg.userId === currentUser.id ? 'You' : lastMsg.userName}:</span> {lastMsg.text}</span>
                        ) : (
                            <span className="italic text-gray-400">No messages yet</span>
                        )}
                    </div>
                  </div>
                );
              })
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={`${activeChannel ? 'flex' : 'hidden md:flex'} flex-1 flex-col bg-white relative`}>
        {activeChannel ? (
            <>
                {/* Mobile Header to go back */}
                <div className="md:hidden p-3 border-b border-gray-100 flex items-center gap-2 bg-gray-50">
                    <button onClick={() => onSelectChannel('')} className="p-1 text-gray-500">
                        <ICONS.ChevronLeft />
                    </button>
                    <span className="font-bold text-gray-800 truncate flex-1">{activeChannel.name}</span>
                </div>

                <ChatRoom 
                    channel={activeChannel}
                    currentUser={currentUser}
                    onSendMessage={onSendMessage}
                    isEmbedded={true}
                    onAddParticipant={onAddParticipant}
                />
            </>
        ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-300 p-8 text-center">
                <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                    <ICONS.MessageSquare width={48} height={48} />
                </div>
                <h3 className="text-xl font-bold text-gray-400">Select a conversation</h3>
                <p className="text-sm max-w-xs mt-2">Choose a chat from the left or create a new group to start talking smack.</p>
            </div>
        )}
      </div>
    </div>
  );
};
