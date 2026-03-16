import { useState, useRef, useEffect } from 'react';
import { useApp } from '../context';
import { getAvatarUrl, timeAgo } from '../utils/helpers';
import { Send, Hash, Globe, Lock, X, CornerUpLeft, ChevronLeft, Menu as MenuIcon } from 'lucide-react';
import { generateId } from '../store';
import { ChatMessage, MatchChat } from '../types';

interface Props { setPage: (p: string) => void; }

export function ChatPage({ setPage }: Props) {
  const { data, update, currentUser } = useApp();
  const [activeTab, setActiveTab] = useState<string>('global');
  const [message, setMessage] = useState('');
  const [replyTo, setReplyTo] = useState<{ id: string; authorId: string; content: string } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Build accessible match chats list
  const accessibleMatchChats: (MatchChat & { label: string; matchLabel: string })[] = [];

  if (currentUser) {
    const isAdmin = currentUser.role === 'admin';
    const myTeamId = currentUser.teamId;

    for (const md of data.matchdays) {
      for (const match of md.matches) {
        const canAccess = isAdmin || (myTeamId && (match.homeTeamId === myTeamId || match.awayTeamId === myTeamId));
        if (!canAccess) continue;
        const existing = data.matchChats.find(mc => mc.matchId === match.id);
        if (existing?.archived && !isAdmin) continue;

        const homeTeam = data.teams.find(t => t.id === match.homeTeamId);
        const awayTeam = data.teams.find(t => t.id === match.awayTeamId);
        const matchLabel = `${homeTeam?.name ?? '?'} vs ${awayTeam?.name ?? '?'}`;
        const label = `MD${md.number} · ${matchLabel}`;

        accessibleMatchChats.push({
          matchId: match.id,
          matchdayId: md.id,
          messages: existing?.messages ?? [],
          archived: existing?.archived ?? false,
          label,
          matchLabel,
        });
      }
    }
  }

  const activeMatchChat = activeTab !== 'global'
    ? accessibleMatchChats.find(mc => mc.matchId === activeTab)
    : null;

  const messages = activeTab === 'global'
    ? data.globalChat.slice(-50)
    : (activeMatchChat?.messages ?? []).slice(-50);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, activeTab]);

  useEffect(() => {
    if (replyTo) inputRef.current?.focus();
  }, [replyTo]);

  function sendMessage() {
    if (!message.trim() || !currentUser) return;
    const msg: ChatMessage = {
      id: generateId(),
      authorId: currentUser.id,
      content: message.trim(),
      createdAt: Date.now(),
      replyTo: replyTo ?? undefined,
    };

    if (activeTab === 'global') {
      const globalChat = [...data.globalChat, msg].slice(-50);
      update({ ...data, globalChat });
    } else {
      const matchChats = [...data.matchChats];
      const idx = matchChats.findIndex(mc => mc.matchId === activeTab);
      if (idx >= 0) {
        matchChats[idx] = { ...matchChats[idx], messages: [...matchChats[idx].messages, msg] };
      } else {
        const md = data.matchdays.find(md => md.matches.some(m => m.id === activeTab));
        matchChats.push({ matchId: activeTab, matchdayId: md?.id ?? '', messages: [msg], archived: false });
      }
      update({ ...data, matchChats });
    }
    setMessage('');
    setReplyTo(null);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
    if (e.key === 'Escape') setReplyTo(null);
  }

  function selectChannel(id: string) {
    setActiveTab(id);
    setSidebarOpen(false);
  }

  const isArchived = activeMatchChat?.archived;

  // Sidebar channel list content — shared between desktop & mobile overlay
  function SidebarContent() {
    return (
      <>
        {/* Server header */}
        <div style={{ padding: '14px 14px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg,#e8b84b,#c99a2e)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 10, color: '#060a12', flexShrink: 0 }}>
              EML
            </div>
            <div>
              <p style={{ color: 'white', fontWeight: 700, fontSize: 13, lineHeight: 1.2 }}>EML Chat</p>
              <p style={{ color: 'rgba(255,255,255,0.28)', fontSize: 10 }}>Community</p>
            </div>
          </div>
        </div>

        {/* Channels scroll */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '10px 8px' }}>
          <p style={{ color: 'rgba(255,255,255,0.22)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', padding: '0 8px', marginBottom: 4 }}>General</p>

          <ChannelBtn
            icon={<Globe size={14} />}
            label="global-chat"
            active={activeTab === 'global'}
            onClick={() => selectChannel('global')}
          />

          {accessibleMatchChats.length > 0 && (
            <>
              <p style={{ color: 'rgba(255,255,255,0.22)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', padding: '0 8px', marginTop: 16, marginBottom: 4 }}>
                {currentUser?.role === 'admin' ? 'All Match Chats' : 'Your Match Chats'}
              </p>
              {accessibleMatchChats.map(mc => (
                <ChannelBtn
                  key={mc.matchId}
                  icon={mc.archived ? <Lock size={13} /> : <Hash size={13} />}
                  label={mc.label}
                  active={activeTab === mc.matchId}
                  archived={mc.archived}
                  onClick={() => selectChannel(mc.matchId)}
                />
              ))}
            </>
          )}

          {accessibleMatchChats.length === 0 && (
            <p style={{ color: 'rgba(255,255,255,0.18)', fontSize: 11, textAlign: 'center', padding: '16px 8px' }}>No match chats</p>
          )}
        </div>

        {/* User footer */}
        {currentUser && (
          <div style={{ padding: '10px 12px', borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.2)', flexShrink: 0 }}>
            <button
              onClick={() => setPage(`profile_${currentUser.id}`)}
              style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', background: 'none', border: 'none', cursor: 'pointer', borderRadius: 10, padding: '6px 8px', transition: 'background 0.15s' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
            >
              <img src={getAvatarUrl(currentUser.username, currentUser.avatar)} alt="" style={{ width: 32, height: 32, borderRadius: 10, objectFit: 'cover', border: '1.5px solid rgba(255,255,255,0.1)', flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                <p style={{ color: 'white', fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentUser.username}</p>
                <p style={{ fontSize: 10, color: currentUser.role === 'admin' ? '#c084fc' : '#e8b84b' }}>{currentUser.role}</p>
              </div>
            </button>
          </div>
        )}
      </>
    );
  }

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden', position: 'relative' }}>

      {/* Mobile sidebar overlay backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 20, backdropFilter: 'blur(4px)' }}
        />
      )}

      {/* Sidebar — desktop always visible, mobile slide-in overlay */}
      <div style={{
        width: 220,
        background: '#070c16',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        // Mobile: absolute overlay sliding in from left
        position: window.innerWidth < 768 ? 'absolute' : 'relative',
        top: 0, bottom: 0, left: 0,
        zIndex: window.innerWidth < 768 ? 30 : 'auto',
        transform: window.innerWidth < 768 ? (sidebarOpen ? 'translateX(0)' : 'translateX(-100%)') : 'none',
        transition: 'transform 0.25s cubic-bezier(0.34,1.2,0.64,1)',
      } as React.CSSProperties}>
        {/* Mobile close button */}
        <button
          onClick={() => setSidebarOpen(false)}
          style={{ display: window.innerWidth < 768 ? 'flex' : 'none', position: 'absolute', top: 10, right: 10, background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 8, padding: 6, cursor: 'pointer', color: 'rgba(255,255,255,0.5)', zIndex: 1, alignItems: 'center', justifyContent: 'center' }}
        >
          <ChevronLeft size={15} />
        </button>
        <SidebarContent />
      </div>

      {/* Main chat area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#0b1320', minWidth: 0, overflow: 'hidden' }}>

        {/* Channel header */}
        <div style={{ height: 52, display: 'flex', alignItems: 'center', padding: '0 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0, gap: 10 }}>
          {/* Mobile sidebar toggle */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', padding: 6, borderRadius: 8, display: 'flex', alignItems: 'center', flexShrink: 0 }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.08)'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
          >
            <MenuIcon size={16} />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
            {activeTab === 'global' ? (
              <>
                <Globe size={16} style={{ color: '#e8b84b', flexShrink: 0 }} />
                <span style={{ color: 'white', fontWeight: 700, fontSize: 14 }}>global-chat</span>
                <span style={{ color: 'rgba(255,255,255,0.22)', fontSize: 11, display: 'none' }} className="sm:block">· EML community</span>
              </>
            ) : (
              <>
                {isArchived
                  ? <Lock size={16} style={{ color: 'rgba(255,255,255,0.3)', flexShrink: 0 }} />
                  : <Hash size={16} style={{ color: '#e8b84b', flexShrink: 0 }} />}
                <span style={{ color: 'white', fontWeight: 700, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{activeMatchChat?.matchLabel}</span>
                {isArchived && (
                  <span style={{ fontSize: 10, background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.35)', padding: '2px 8px', borderRadius: 20, flexShrink: 0 }}>Archived</span>
                )}
              </>
            )}
          </div>
          <span style={{ color: 'rgba(255,255,255,0.18)', fontSize: 11, flexShrink: 0 }}>{messages.length} msgs</span>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 10px' }}>
          {messages.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center', padding: 20 }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                {activeTab === 'global' ? <Globe size={24} style={{ color: 'rgba(255,255,255,0.18)' }} /> : <Hash size={24} style={{ color: 'rgba(255,255,255,0.18)' }} />}
              </div>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 600, fontSize: 14, marginBottom: 4 }}>
                {activeTab === 'global' ? 'Welcome to #global-chat' : 'Match Chat'}
              </p>
              <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 12, maxWidth: 240 }}>
                {activeTab === 'global' ? 'Start the conversation with the EML community.' : 'Only team members from this match can chat here.'}
              </p>
            </div>
          ) : (
            messages.map((msg, i) => {
              const author = data.users.find(u => u.id === msg.authorId);
              const isMe = currentUser?.id === msg.authorId;
              const prevMsg = i > 0 ? messages[i - 1] : null;
              const showHeader = !prevMsg || prevMsg.authorId !== msg.authorId || (msg.createdAt - prevMsg.createdAt) > 5 * 60 * 1000;
              const replyAuthor = msg.replyTo ? data.users.find(u => u.id === msg.replyTo!.authorId) : null;

              return (
                <MessageRow
                  key={msg.id}
                  msg={msg}
                  author={author}
                  isMe={isMe}
                  showHeader={showHeader}
                  replyAuthor={replyAuthor ?? undefined}
                  isArchived={!!isArchived}
                  onReply={() => {
                    setReplyTo({ id: msg.id, authorId: msg.authorId, content: msg.content });
                    inputRef.current?.focus();
                  }}
                  onAvatarClick={() => author && setPage(`profile_${author.id}`)}
                />
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input area */}
        <div style={{ padding: '0 10px 12px', flexShrink: 0 }}>
          {/* Reply bar */}
          {replyTo && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px 12px 0 0', padding: '8px 12px', borderBottom: 'none' }}>
              <CornerUpLeft size={12} style={{ color: '#e8b84b', flexShrink: 0 }} />
              <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                Replying to{' '}
                <span style={{ color: '#e8b84b', fontWeight: 600 }}>
                  {data.users.find(u => u.id === replyTo.authorId)?.username}
                </span>
                : {replyTo.content.slice(0, 50)}{replyTo.content.length > 50 ? '...' : ''}
              </p>
              <button onClick={() => setReplyTo(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', padding: 2, display: 'flex' }}>
                <X size={13} />
              </button>
            </div>
          )}

          {isArchived ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '12px 16px' }}>
              <Lock size={14} style={{ color: 'rgba(255,255,255,0.25)' }} />
              <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>This chat has been archived</span>
            </div>
          ) : (
            <div style={{
              display: 'flex',
              alignItems: 'flex-end',
              gap: 10,
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.09)',
              borderRadius: replyTo ? '0 0 12px 12px' : 12,
              padding: '10px 12px',
              borderTop: replyTo ? '1px solid rgba(255,255,255,0.05)' : undefined,
            }}>
              <img
                src={getAvatarUrl(currentUser?.username ?? 'U', currentUser?.avatar)}
                alt=""
                style={{ width: 30, height: 30, borderRadius: 8, objectFit: 'cover', flexShrink: 0, marginBottom: 2 }}
              />
              <textarea
                ref={inputRef}
                value={message}
                onChange={e => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={activeTab === 'global' ? 'Message #global-chat' : `Message match chat`}
                rows={1}
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: 'rgba(255,255,255,0.9)',
                  fontSize: 14,
                  resize: 'none',
                  minHeight: 24,
                  maxHeight: 120,
                  overflowY: 'auto',
                  lineHeight: '1.5',
                  paddingTop: 3,
                  fontFamily: 'inherit',
                }}
                onInput={e => {
                  const el = e.target as HTMLTextAreaElement;
                  el.style.height = 'auto';
                  el.style.height = Math.min(el.scrollHeight, 120) + 'px';
                }}
              />
              {/* Send button — always visible, disabled when empty */}
              <button
                onClick={sendMessage}
                disabled={!message.trim()}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  border: 'none',
                  cursor: message.trim() ? 'pointer' : 'default',
                  background: message.trim()
                    ? 'linear-gradient(135deg,#e8b84b,#c99a2e)'
                    : 'rgba(255,255,255,0.06)',
                  color: message.trim() ? '#060a12' : 'rgba(255,255,255,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  transition: 'all 0.2s ease',
                  boxShadow: message.trim() ? '0 4px 12px rgba(232,184,75,0.35)' : 'none',
                }}
              >
                <Send size={15} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Extracted message row component
function ChannelBtn({ icon, label, active, archived, onClick }: {
  icon: React.ReactNode; label: string; active: boolean; archived?: boolean; onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        width: '100%',
        padding: '7px 10px',
        borderRadius: 8,
        background: active ? 'rgba(255,255,255,0.1)' : hovered ? 'rgba(255,255,255,0.05)' : 'transparent',
        border: 'none',
        cursor: 'pointer',
        transition: 'background 0.12s',
        marginBottom: 1,
      }}
    >
      <span style={{ color: active ? '#e8b84b' : archived ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.3)', flexShrink: 0 }}>{icon}</span>
      <span style={{ color: active ? 'white' : 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: active ? 600 : 400, flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
      {archived && <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.05)', padding: '1px 5px', borderRadius: 4, flexShrink: 0 }}>archived</span>}
    </button>
  );
}

function MessageRow({ msg, author, isMe, showHeader, replyAuthor, isArchived, onReply, onAvatarClick }: {
  msg: ChatMessage;
  author?: { username: string; avatar?: string; role?: string };
  isMe: boolean;
  showHeader: boolean;
  replyAuthor?: { username: string; avatar?: string };
  isArchived: boolean;
  onReply: () => void;
  onAvatarClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        gap: 10,
        padding: '3px 8px',
        borderRadius: 10,
        background: hovered ? 'rgba(255,255,255,0.025)' : 'transparent',
        transition: 'background 0.1s',
        marginTop: showHeader ? 14 : 0,
        alignItems: 'flex-start',
        position: 'relative',
      }}
    >
      {/* Avatar column */}
      <div style={{ width: 36, flexShrink: 0, display: 'flex', justifyContent: 'center', paddingTop: 2 }}>
        {showHeader ? (
          <button onClick={onAvatarClick} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            <img
              src={getAvatarUrl(author?.username ?? 'U', author?.avatar)}
              alt=""
              style={{ width: 36, height: 36, borderRadius: 10, objectFit: 'cover', border: '1.5px solid rgba(255,255,255,0.08)', transition: 'border-color 0.15s' }}
              onMouseEnter={e => (e.target as HTMLElement).style.borderColor = 'rgba(232,184,75,0.4)'}
              onMouseLeave={e => (e.target as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)'}
            />
          </button>
        ) : (
          <span style={{ fontSize: 9, color: hovered ? 'rgba(255,255,255,0.22)' : 'transparent', transition: 'color 0.1s', lineHeight: '36px', userSelect: 'none', whiteSpace: 'nowrap' }}>
            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {showHeader && (
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 3 }}>
            <button
              onClick={onAvatarClick}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontWeight: 600, fontSize: 14, color: isMe ? '#e8b84b' : 'rgba(255,255,255,0.9)', textDecoration: 'none' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.textDecoration = 'underline'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.textDecoration = 'none'}
            >
              {author?.username ?? 'Unknown'}
            </button>
            {author?.role === 'admin' && (
              <span style={{ fontSize: 9, background: 'rgba(168,85,247,0.2)', color: '#c084fc', padding: '1px 5px', borderRadius: 4, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Admin</span>
            )}
            <span style={{ color: 'rgba(255,255,255,0.22)', fontSize: 11 }}>{timeAgo(msg.createdAt)}</span>
          </div>
        )}

        {/* Reply preview */}
        {msg.replyTo && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5, paddingLeft: 8, borderLeft: '2px solid rgba(255,255,255,0.18)' }}>
            <img src={getAvatarUrl(replyAuthor?.username ?? 'U', replyAuthor?.avatar)} alt="" style={{ width: 14, height: 14, borderRadius: 4, flexShrink: 0 }} />
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              <span style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>{replyAuthor?.username}</span>
              {' '}{msg.replyTo.content.slice(0, 60)}{msg.replyTo.content.length > 60 ? '...' : ''}
            </p>
          </div>
        )}

        <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14, lineHeight: 1.5, wordBreak: 'break-word' }}>{msg.content}</p>
      </div>

      {/* Reply button on hover */}
      {!isArchived && hovered && (
        <button
          onClick={onReply}
          style={{
            position: 'absolute',
            top: 4,
            right: 8,
            background: 'rgba(14,20,35,0.95)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 8,
            padding: '4px 8px',
            cursor: 'pointer',
            color: 'rgba(255,255,255,0.5)',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            fontSize: 11,
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(232,184,75,0.12)'; (e.currentTarget as HTMLElement).style.color = '#e8b84b'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(232,184,75,0.25)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(14,20,35,0.95)'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.5)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.1)'; }}
        >
          <CornerUpLeft size={11} /> Reply
        </button>
      )}
    </div>
  );
}
