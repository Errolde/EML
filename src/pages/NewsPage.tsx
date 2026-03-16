import { useState } from 'react';
import { useApp } from '../context';
import { getAvatarUrl, timeAgo } from '../utils/helpers';
import { Newspaper, Heart, MessageCircle, Send, ChevronDown, ChevronUp, Reply, X } from 'lucide-react';
import { generateId } from '../store';
import { Comment, Reply as ReplyType } from '../types';
import { supabase } from '../supabase';

interface Props { setPage: (p: string) => void; }

export function NewsPage({ setPage }: Props) {
  const { data, currentUser, addNotification } = useApp();
  const [expandedArticle, setExpandedArticle] = useState<string | null>(null);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  const articles = [...data.news].sort((a, b) => b.createdAt - a.createdAt);

  const categoryColors: Record<string, string> = {
    'Match Recap': 'bg-blue-500/20 text-blue-300',
    'Announcement': 'bg-[#e8b84b]/20 text-[#e8b84b]',
    'Tournament Update': 'bg-purple-500/20 text-purple-300',
    'Player Spotlight': 'bg-emerald-500/20 text-emerald-300',
  };

  async function toggleLikeArticle(articleId: string) {
    if (!currentUser) return;
    const article = data.news.find(a => a.id === articleId);
    if (!article) return;
    const liked = article.likes.includes(currentUser.id);
    const newLikes = liked
      ? article.likes.filter(id => id !== currentUser.id)
      : [...article.likes, currentUser.id];
    await supabase.from('news_articles').update({ likes: newLikes }).eq('id', articleId);
    if (!liked && article.authorId !== currentUser.id) {
      addNotification(article.authorId, 'like', `${currentUser.username} liked your article "${article.title}"`);
    }
  }

  async function toggleLikeComment(articleId: string, commentId: string) {
    if (!currentUser) return;
    const article = data.news.find(a => a.id === articleId);
    if (!article) return;
    const newComments = article.comments.map(c => {
      if (c.id !== commentId) return c;
      const liked = c.likes.includes(currentUser.id);
      if (!liked && c.authorId !== currentUser.id) {
        addNotification(c.authorId, 'like', `${currentUser.username} liked your comment`);
      }
      return { ...c, likes: liked ? c.likes.filter(id => id !== currentUser.id) : [...c.likes, currentUser.id] };
    });
    await supabase.from('news_articles').update({ comments: newComments }).eq('id', articleId);
  }

  async function submitComment(articleId: string) {
    const content = commentInputs[articleId]?.trim();
    if (!content || !currentUser) return;
    const article = data.news.find(a => a.id === articleId);
    if (!article) return;

    const mentions = content.match(/@(\w+)/g) || [];
    for (const mention of mentions) {
      const mentionedUsername = mention.slice(1);
      const mentionedUser = data.users.find(u => u.username.toLowerCase() === mentionedUsername.toLowerCase());
      if (mentionedUser && mentionedUser.id !== currentUser.id) {
        addNotification(mentionedUser.id, 'mention', `${currentUser.username} mentioned you in a comment`);
      }
    }
    if (article.authorId !== currentUser.id) {
      addNotification(article.authorId, 'comment', `${currentUser.username} commented on "${article.title}"`);
    }

    const newComment: Comment = {
      id: generateId(),
      authorId: currentUser.id,
      content,
      createdAt: Date.now(),
      likes: [],
      replies: [],
    };
    const newComments = [...article.comments, newComment];
    await supabase.from('news_articles').update({ comments: newComments }).eq('id', articleId);
    setCommentInputs(p => ({ ...p, [articleId]: '' }));
  }

  async function submitReply(articleId: string, commentId: string) {
    const content = replyInputs[commentId]?.trim();
    if (!content || !currentUser) return;
    const article = data.news.find(a => a.id === articleId);
    const comment = article?.comments.find(c => c.id === commentId);
    if (!comment || !article) return;

    if (comment.authorId !== currentUser.id) {
      addNotification(comment.authorId, 'reply', `${currentUser.username} replied to your comment`);
    }

    const newReply: ReplyType = {
      id: generateId(),
      authorId: currentUser.id,
      content,
      createdAt: Date.now(),
      likes: [],
    };
    const newComments = article.comments.map(c =>
      c.id !== commentId ? c : { ...c, replies: [...c.replies, newReply] }
    );
    await supabase.from('news_articles').update({ comments: newComments }).eq('id', articleId);
    setReplyInputs(p => ({ ...p, [commentId]: '' }));
    setReplyingTo(null);
  }

  function renderMentions(content: string) {
    const parts = content.split(/(@\w+)/g);
    return parts.map((part, i) => {
      if (part.startsWith('@')) {
        const username = part.slice(1);
        const user = data.users.find(u => u.username.toLowerCase() === username.toLowerCase());
        if (user) return (
          <button key={i} onClick={() => setPage(`profile_${user.id}`)} className="text-[#e8b84b] hover:underline font-medium">
            {part}
          </button>
        );
      }
      return <span key={i}>{part}</span>;
    });
  }

  if (articles.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2"><Newspaper size={22} className="text-[#e8b84b]" />News</h1>
        </div>
        <div className="bg-[#0f1923] border border-white/10 rounded-xl p-12 text-center text-white/30">
          <Newspaper size={40} className="mx-auto mb-3 opacity-30" />
          <p>No news yet. Check back soon!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white flex items-center gap-2"><Newspaper size={22} className="text-[#e8b84b]" />News</h1>
        <p className="text-white/40 text-sm mt-1">{articles.length} article{articles.length !== 1 ? 's' : ''}</p>
      </div>

      <div className="space-y-4">
        {articles.map(article => {
          const author = data.users.find(u => u.id === article.authorId);
          const isExpanded = expandedArticle === article.id;
          const isLiked = currentUser ? article.likes.includes(currentUser.id) : false;
          const visibleComments = isExpanded ? article.comments : article.comments.slice(-2);

          return (
            <div key={article.id} className="bg-[#0f1923] border border-white/10 rounded-2xl overflow-hidden">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <img
                    src={author?.avatar || getAvatarUrl(author?.username || 'Unknown')}
                    alt={author?.username}
                    className="w-10 h-10 rounded-full object-cover border border-white/10 cursor-pointer"
                    onClick={() => author && setPage(`profile_${author.id}`)}
                  />
                  <div className="flex-1">
                    <button onClick={() => author && setPage(`profile_${author.id}`)} className="font-semibold text-white text-sm hover:text-[#e8b84b] transition-colors">
                      {author?.username || 'Unknown'}
                    </button>
                    <p className="text-white/30 text-xs">{timeAgo(article.createdAt)}</p>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${categoryColors[article.category] || 'bg-white/10 text-white/60'}`}>
                    {article.category}
                  </span>
                </div>

                <h2 className="text-xl font-black text-white mb-3">{article.title}</h2>

                <div className="text-white/70 text-sm leading-relaxed">
                  {isExpanded ? article.content : article.content.slice(0, 200) + (article.content.length > 200 ? '...' : '')}
                </div>
                {article.content.length > 200 && (
                  <button
                    onClick={() => setExpandedArticle(isExpanded ? null : article.id)}
                    className="text-[#e8b84b] text-sm mt-2 hover:underline flex items-center gap-1"
                  >
                    {isExpanded ? <><ChevronUp size={14} /> Show less</> : <><ChevronDown size={14} /> Read more</>}
                  </button>
                )}

                {article.media && (
                  <div className="mt-4 rounded-xl overflow-hidden">
                    {article.media.type === 'image' ? (
                      <img src={article.media.url} alt="Article media" className="w-full max-h-96 object-cover" />
                    ) : (
                      <video src={article.media.url} controls className="w-full max-h-96" />
                    )}
                  </div>
                )}

                <div className="flex items-center gap-4 mt-4 pt-4 border-t border-white/5">
                  <button
                    onClick={() => toggleLikeArticle(article.id)}
                    className={`flex items-center gap-2 text-sm font-medium transition-all ${isLiked ? 'text-red-400' : 'text-white/40 hover:text-red-400'}`}
                  >
                    <Heart size={16} className={isLiked ? 'fill-current' : ''} />
                    {article.likes.length}
                  </button>
                  <button
                    onClick={() => setExpandedArticle(isExpanded ? null : article.id)}
                    className="flex items-center gap-2 text-sm text-white/40 hover:text-white transition-colors"
                  >
                    <MessageCircle size={16} />
                    {article.comments.length} comment{article.comments.length !== 1 ? 's' : ''}
                  </button>
                </div>
              </div>

              {(isExpanded ? article.comments : visibleComments).length > 0 && (
                <div className="border-t border-white/5 divide-y divide-white/5">
                  {(isExpanded ? article.comments : visibleComments).map(comment => {
                    const commentAuthor = data.users.find(u => u.id === comment.authorId);
                    const commentLiked = currentUser ? comment.likes.includes(currentUser.id) : false;
                    return (
                      <div key={comment.id} className="px-6 py-3">
                        <div className="flex items-start gap-3">
                          <img
                            src={commentAuthor?.avatar || getAvatarUrl(commentAuthor?.username || 'U')}
                            alt=""
                            className="w-7 h-7 rounded-full object-cover border border-white/10 cursor-pointer"
                            onClick={() => commentAuthor && setPage(`profile_${commentAuthor.id}`)}
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <button onClick={() => commentAuthor && setPage(`profile_${commentAuthor.id}`)} className="text-white text-xs font-semibold hover:text-[#e8b84b] transition-colors">
                                {commentAuthor?.username}
                              </button>
                              <span className="text-white/30 text-xs">{timeAgo(comment.createdAt)}</span>
                            </div>
                            <p className="text-white/70 text-sm mt-0.5">{renderMentions(comment.content)}</p>
                            <div className="flex items-center gap-3 mt-1.5">
                              <button
                                onClick={() => toggleLikeComment(article.id, comment.id)}
                                className={`flex items-center gap-1 text-xs transition-all ${commentLiked ? 'text-red-400' : 'text-white/30 hover:text-red-400'}`}
                              >
                                <Heart size={11} className={commentLiked ? 'fill-current' : ''} /> {comment.likes.length}
                              </button>
                              <button
                                onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                                className="flex items-center gap-1 text-xs text-white/30 hover:text-[#e8b84b] transition-colors"
                              >
                                <Reply size={11} /> Reply
                              </button>
                            </div>

                            {comment.replies.length > 0 && (
                              <div className="mt-2 space-y-2 pl-2 border-l-2 border-white/10">
                                {comment.replies.map(reply => {
                                  const replyAuthor = data.users.find(u => u.id === reply.authorId);
                                  return (
                                    <div key={reply.id} className="flex items-start gap-2">
                                      <img src={replyAuthor?.avatar || getAvatarUrl(replyAuthor?.username || 'U')} alt="" className="w-5 h-5 rounded-full object-cover" />
                                      <div>
                                        <span className="text-white text-xs font-semibold">{replyAuthor?.username} </span>
                                        <span className="text-white/60 text-xs">{renderMentions(reply.content)}</span>
                                        <span className="text-white/30 text-xs ml-2">{timeAgo(reply.createdAt)}</span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {replyingTo === comment.id && (
                              <div className="flex gap-2 mt-2">
                                <input
                                  value={replyInputs[comment.id] || ''}
                                  onChange={e => setReplyInputs(p => ({ ...p, [comment.id]: e.target.value }))}
                                  placeholder={`Reply to ${commentAuthor?.username}...`}
                                  onKeyDown={e => { if (e.key === 'Enter') submitReply(article.id, comment.id); }}
                                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white text-xs focus:outline-none focus:border-[#e8b84b]/40"
                                />
                                <button onClick={() => submitReply(article.id, comment.id)} className="p-1.5 text-[#e8b84b] hover:bg-[#e8b84b]/10 rounded-lg transition-all">
                                  <Send size={13} />
                                </button>
                                <button onClick={() => setReplyingTo(null)} className="p-1.5 text-white/30 hover:text-white rounded-lg transition-all">
                                  <X size={13} />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="px-6 py-3 border-t border-white/5">
                <div className="flex gap-2 items-center">
                  <img src={currentUser?.avatar || getAvatarUrl(currentUser?.username || 'U')} alt="" className="w-7 h-7 rounded-full object-cover border border-white/10" />
                  <input
                    value={commentInputs[article.id] || ''}
                    onChange={e => setCommentInputs(p => ({ ...p, [article.id]: e.target.value }))}
                    placeholder="Write a comment... (@mention users)"
                    onKeyDown={e => { if (e.key === 'Enter') submitComment(article.id); }}
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-[#e8b84b]/40"
                  />
                  <button
                    onClick={() => submitComment(article.id)}
                    className="p-2 text-[#e8b84b] hover:bg-[#e8b84b]/10 rounded-xl transition-all"
                  >
                    <Send size={16} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}