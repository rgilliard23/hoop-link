
import React, { useState, useRef, useEffect } from 'react';
import { ChatChannel, User } from '../types';
import { Button } from './Button';
import { ICONS, MOCK_USERS } from '../constants';

interface ChatRoomProps {
  channel: ChatChannel;
  currentUser: User;
  onSendMessage: (channelId: string, text: string) => void;
  onClose?: () => void;
  isEmbedded?: boolean;
  onAddParticipant?: (channelId: string, name: string) => void;
}

export const ChatRoom: React.FC<ChatRoomProps> = ({ 
    channel, 
    currentUser, 
    onSendMessage, 
    onClose, 
    isEmbedded = false,
    onAddParticipant 
}) => {
  const [input, setInput] = useState('');
  const [showDetails, setShowDetails] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [channel.messages, showDetails]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    onSendMessage(channel.id, input);
    setInput('');
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setInviteName(val);
      if (val.trim().length > 0) {
          // Search MOCK_USERS excluding current participants
          const filtered = MOCK_USERS.filter(u => 
              u.name.toLowerCase().includes(val.toLowerCase()) || 
              u.email.toLowerCase().includes(val.toLowerCase())
          ).filter(u => !channel.participants.includes(u.id)); 
          setSearchResults(filtered);
      } else {
          setSearchResults([]);
      }
  };

  const selectUserToInvite = (user: User) => {
      if (onAddParticipant) {
          onAddParticipant(channel.id, user.id);
      }
      setInviteName('');
      setSearchResults([]);
      setIsInviteOpen(false);
  };

  const handleManualInvite = (e: React.FormEvent) => {
      e.preventDefault();
      if (!inviteName.trim() || !onAddParticipant) return;
      onAddParticipant(channel.id, inviteName);
      setInviteName('');
      setSearchResults([]);
      setIsInviteOpen(false);
  };

  const canManage = channel.adminIds.includes(currentUser.id) || channel.privacy === 'public';

  return (
    <div className={`flex h-full bg-white overflow-hidden relative ${!isEmbedded && 'rounded-2xl shadow-lg border border-gray-200 h-[500px]'}`}>
      
      {/* Main Chat Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b border-gray-100 ${!isEmbedded ? 'bg-hoop-dark text-white' : 'bg-white'}`}>
          <div>
            <h3 className={`font-bold flex items-center gap-2 ${isEmbedded ? 'text-gray-900' : 'text-white'}`}>
              {channel.privacy === 'private' && <ICONS.Lock width={16} className={isEmbedded ? 'text-gray-500' : 'text-gray-400'} />}
              {channel.type === 'game' && channel.privacy !== 'private' && <ICONS.Basketball width={16} />}
              {channel.type === 'venue' && channel.privacy !== 'private' && <ICONS.MapPin width={16} />}
              {channel.name}
            </h3>
            <p className={`text-xs ${isEmbedded ? 'text-gray-500' : 'text-gray-400'}`}>
              {channel.participants.length} Member{channel.participants.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setShowDetails(!showDetails)} className={`p-2 rounded-full transition-colors ${isEmbedded ? 'hover:bg-gray-100 text-gray-500' : 'hover:bg-white/10 text-white'}`}>
               <ICONS.Info width={20} height={20} />
            </button>
            {onClose && (
                <button onClick={onClose} className="text-gray-400 hover:text-white p-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
            )}
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 scrollbar-thin scrollbar-thumb-gray-300">
            {channel.messages.length === 0 ? (
                <div className="text-center text-gray-400 mt-10 flex flex-col items-center gap-2">
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center opacity-50">
                    <ICONS.MessageSquare width={20} height={20} />
                    </div>
                    <p>No messages yet.</p>
                    <p className="text-sm">Start the conversation!</p>
                </div>
            ) : (
                channel.messages.map((msg) => {
                const isMe = msg.userId === currentUser.id;
                const isSystem = msg.userId === 'system';
                
                if (isSystem) {
                    return (
                        <div key={msg.id} className="flex justify-center my-2">
                            <span className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full">
                                {msg.text}
                            </span>
                        </div>
                    )
                }

                return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    {!isMe && (
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600 mr-2 border border-white mt-1">
                            {msg.userName.charAt(0).toUpperCase()}
                        </div>
                    )}
                    <div className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm shadow-sm ${isMe ? 'bg-hoop-orange text-white rounded-br-none' : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none'}`}>
                        {!isMe && <div className="text-xs text-gray-500 font-bold mb-1">{msg.userName}</div>}
                        {msg.text}
                        <div className={`text-[10px] mt-1 text-right ${isMe ? 'text-orange-200' : 'text-gray-400'}`}>
                        {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </div>
                    </div>
                    </div>
                );
                })
            )}
            <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <form onSubmit={handleSend} className="p-4 bg-white border-t border-gray-100 flex gap-2 z-10">
            <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Message ${channel.name}...`}
            className="flex-1 bg-gray-100 border-transparent focus:bg-white focus:border-hoop-orange focus:ring-0 rounded-lg px-4 py-2 transition-colors outline-none"
            />
            <Button type="submit" variant="primary" disabled={!input.trim()}>
            <ICONS.Send />
            </Button>
        </form>
      </div>

      {/* Details Sidebar (Animated) */}
      <div className={`border-l border-gray-100 bg-white absolute inset-y-0 right-0 w-64 shadow-xl transform transition-transform duration-300 z-20 ${showDetails ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="p-4 h-full flex flex-col">
              <div className="flex items-center justify-between mb-6">
                  <h4 className="font-bold text-gray-800">Channel Info</h4>
                  <button onClick={() => setShowDetails(false)} className="text-gray-400 hover:text-gray-600">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                  </button>
              </div>
              
              <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-400">
                      {channel.privacy === 'private' ? <ICONS.Lock width={32} height={32} /> : <ICONS.Users width={32} height={32} />}
                  </div>
                  <h5 className="font-bold text-gray-900">{channel.name}</h5>
                  <p className="text-xs text-gray-500 capitalize">{channel.privacy} Group</p>
              </div>

              <div className="flex-1 overflow-y-auto">
                  <div className="flex items-center justify-between mb-2">
                    <h6 className="text-xs font-bold text-gray-400 uppercase">Members ({channel.participants.length})</h6>
                    {onAddParticipant && (
                        <button 
                            onClick={() => setIsInviteOpen(!isInviteOpen)}
                            className="text-hoop-orange hover:text-orange-700 p-1"
                            title="Add Person"
                        >
                            <ICONS.UserPlus width={16} height={16} />
                        </button>
                    )}
                  </div>

                  {/* Inline Invite Form */}
                  {isInviteOpen && (
                      <div className="mb-4 bg-gray-50 p-2 rounded-lg border border-gray-200 animate-in fade-in slide-in-from-top-1 relative">
                          <form onSubmit={handleManualInvite}>
                            <input 
                                type="text" 
                                placeholder="Search members..."
                                className="w-full text-sm border border-gray-300 rounded px-2 py-1 mb-2 outline-none focus:border-hoop-orange"
                                value={inviteName}
                                onChange={handleSearchChange}
                                autoFocus
                            />
                            {/* Dropdown for search results */}
                            {searchResults.length > 0 && (
                                <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 z-50 max-h-48 overflow-y-auto">
                                    {searchResults.map(u => (
                                        <div 
                                            key={u.id} 
                                            className="px-3 py-2 hover:bg-gray-50 cursor-pointer flex items-center gap-2 border-b border-gray-50 last:border-none"
                                            onClick={() => selectUserToInvite(u)}
                                        >
                                            <div className="w-6 h-6 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                                                <img src={u.avatar} alt={u.name} className="w-full h-full object-cover" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-bold text-gray-800 truncate">{u.name}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <Button size="sm" fullWidth type="submit" disabled={!inviteName.trim()}>
                                {inviteName.includes('@') ? 'Invite Email' : 'Add'}
                            </Button>
                          </form>
                      </div>
                  )}

                  <div className="space-y-3">
                      {channel.participants.map((pid) => {
                          const isMe = pid === currentUser.id;
                          const mockUser = MOCK_USERS.find(u => u.id === pid);
                          const displayName = isMe ? `${currentUser.name} (You)` : (mockUser ? mockUser.name : pid);
                          const avatar = isMe ? currentUser.avatar : (mockUser ? mockUser.avatar : null);

                          return (
                            <div key={pid} className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-500 overflow-hidden border border-white shadow-sm">
                                    {avatar ? <img src={avatar} alt={displayName} className="w-full h-full object-cover" /> : displayName.charAt(0)}
                                </div>
                                <span className="text-sm text-gray-700 flex-1 truncate">
                                    {displayName.startsWith('user-') && !mockUser && !isMe ? 'Guest Baller' : displayName}
                                </span>
                                {channel.adminIds.includes(pid) && (
                                    <span className="text-[10px] bg-gray-100 text-gray-500 px-1 rounded">Admin</span>
                                )}
                            </div>
                          );
                      })}
                  </div>
              </div>

              {channel.privacy === 'private' && (
                  <div className="pt-4 border-t border-gray-100 mt-4">
                      <Button variant="outline" fullWidth className="text-red-500 hover:bg-red-50 hover:border-red-200 hover:text-red-600">
                          Leave Group
                      </Button>
                  </div>
              )}
          </div>
      </div>

    </div>
  );
};
