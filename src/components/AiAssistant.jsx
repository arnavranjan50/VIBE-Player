import { useState, useEffect, useRef } from 'react';
import { Send, Bot, Sparkles, X } from 'lucide-react';
import { getRecommendationQuery, saveChatHistory, getChatHistory, getHistory } from '../utils/storage';

const MOODS = ['Happy 😄', 'Sad 😢', 'Energetic ⚡', 'Chill 🌊', 'Romantic 💕', 'Party 🎉', 'Focus 🎯', 'Angry 😤'];

const AiAssistant = ({ onRecommend, onClose }) => {
  const [messages, setMessages] = useState(() => {
    const saved = getChatHistory();
    if (saved?.length) return saved;
    const history = getHistory();
    const greeting = history.length > 0
      ? `Hey! 🎵 I see you've been vibing to ${history[0]?.artist || 'some great music'}. What mood are you in right now? Pick one below or just tell me!`
      : `Hey there! 🎵 I'm your AI DJ. Tell me your mood and I'll curate the perfect playlist for you!`;
    return [{ id: 1, sender: 'bot', text: greeting }];
  });
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const endRef = useRef(null);
  const randomOptionsRef = useRef(null);

  useEffect(() => { if (messages.length) saveChatHistory(messages); }, [messages]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, typing]);

  const processInput = (userText) => {
    const lower = userText.toLowerCase();

    if (/happy|good|great|joy|excited/i.test(lower)) {
      return { reply: '🎉 Let\'s keep that energy going! Here are some feel-good bangers!', search: 'happy upbeat hits' };
    } else if (/sad|down|blue|depress|cry|heartbreak/i.test(lower)) {
      return { reply: '🥺 I got you. Here\'s something soothing for your soul...', search: 'sad emotional songs' };
    } else if (/energy|energetic|pump|hype|workout|gym/i.test(lower)) {
      return { reply: '⚡ Let\'s turn it UP! High-energy tracks incoming!', search: 'high energy workout motivation' };
    } else if (/chill|relax|calm|peace|lofi|lo-fi/i.test(lower)) {
      return { reply: '🌊 Vibes on. Smooth, chill beats coming your way...', search: 'chill lofi relaxing beats' };
    } else if (/romantic|love|crush|date/i.test(lower)) {
      return { reply: '💕 Love is in the air! Here are some romantic melodies...', search: 'romantic love songs' };
    } else if (/party|dance|club|friday|night/i.test(lower)) {
      return { reply: '🎉 Party mode activated! Let\'s get this party started!', search: 'party dance club hits' };
    } else if (/focus|study|work|concentrate|productive/i.test(lower)) {
      return { reply: '🎯 Focus mode ON. Instrumental vibes to keep you locked in.', search: 'focus study instrumental ambient' };
    } else if (/angry|rage|frustrated|mad/i.test(lower)) {
      return { reply: '😤 Let it out! Here\'s some heavy stuff to match that energy.', search: 'angry rock rap intense' };
    } else if (/bollywood|hindi|indian/i.test(lower)) {
      return { reply: '🎬 Bollywood vibes! Here are the latest and greatest...', search: 'latest bollywood hits 2025' };
    } else if (/punjabi|bhangra/i.test(lower)) {
      return { reply: '🕺 Balle balle! Punjabi beats incoming!', search: 'punjabi hits' };
    } else if (/change|different|something else|new|switch/i.test(lower)) {
      const options = ['trending global hits', 'indie discoveries', 'throwback classics', 'fresh releases today', 'top English pop'];
      // eslint-disable-next-line react-hooks/purity
      const randomIndex = randomOptionsRef.current ?? Math.floor(Math.random() * options.length);
      randomOptionsRef.current = (randomIndex + 1) % options.length;
      const search = options[randomIndex];
      return { reply: `🔄 Switching it up! How about some "${search}"?`, search };
    } else if (/yes|sure|ok|continue|same|more/i.test(lower)) {
      return { reply: '✨ More of what you love coming right up!', search: getRecommendationQuery() };
    } else {
      return { reply: `🎵 Let me find something matching "${userText}" for you!`, search: userText };
    }
  };

  const send = (text) => {
    const userText = text || input.trim();
    if (!userText) return;
    setInput('');

    setMessages(prev => [...prev, { id: Date.now(), sender: 'user', text: userText }]);
    setTyping(true);

    setTimeout(() => {
      const { reply, search } = processInput(userText);
      setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'bot', text: reply + ' 🎧 Playing now...' }]);
      setTyping(false);
      // Auto-play immediately
      setTimeout(() => onRecommend(search), 400);
    }, 800);
  };

  const handleMood = (mood) => {
    const cleanMood = mood.replace(/[^\w\s]/g, '').trim();
    send(cleanMood);
  };

  return (
    <div className="ai-overlay" onClick={onClose}>
      <div className="ai-sheet" onClick={e => e.stopPropagation()}>
        <div className="ai-header">
          <div className="ai-avatar"><Sparkles size={20} color="#fff" /></div>
          <div className="ai-header-info">
            <h3>VIBE DJ</h3>
            <p>Your AI-powered music curator</p>
          </div>
          <button onClick={onClose} style={{ marginLeft: 'auto', padding: 8, color: 'var(--text-secondary)' }}>
            <X size={20} />
          </button>
        </div>

        <div className="ai-messages">
          {messages.map(msg => (
            <div key={msg.id} className={`ai-msg ${msg.sender}`}>
              {msg.sender === 'bot' && (
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--bg-highlight)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Bot size={14} color="var(--accent)" />
                </div>
              )}
              <div className="ai-bubble">{msg.text}</div>
            </div>
          ))}

          {typing && (
            <div className="ai-msg bot">
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--bg-highlight)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Bot size={14} color="var(--accent)" />
              </div>
              <div className="ai-bubble" style={{ display: 'flex', gap: 4, padding: '16px 20px' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--text-secondary)', animation: 'eq .6s infinite alternate' }} />
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--text-secondary)', animation: 'eq .6s .2s infinite alternate' }} />
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--text-secondary)', animation: 'eq .6s .4s infinite alternate' }} />
              </div>
            </div>
          )}

          {messages.length <= 1 && (
            <div className="ai-mood-chips">
              {MOODS.map(m => (
                <button key={m} className="mood-chip" onClick={() => handleMood(m)}>{m}</button>
              ))}
            </div>
          )}
          <div ref={endRef} />
        </div>

        <form onSubmit={e => { e.preventDefault(); send(); }} className="ai-input-row">
          <input
            className="ai-input"
            placeholder="Tell me your mood or ask for music..."
            value={input}
            onChange={e => setInput(e.target.value)}
            id="ai-input"
          />
          <button type="submit" className="ai-send" disabled={!input.trim()}>
            <Send size={16} style={{ marginLeft: -1 }} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default AiAssistant;
