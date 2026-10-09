import React, { useState } from 'react';
import { 
  Sparkles, Lightbulb, CheckCircle2, ChevronDown, ChevronUp, 
  Layers, Zap, Target, BookmarkCheck, Eye, EyeOff, RotateCw, 
  HelpCircle, ArrowRight, BookOpen, Flame, Compass, Maximize2
} from 'lucide-react';

/* ========================================================
   1. SMART NOTES VIEW (Infographic Cards + Flashcard Mode)
   ======================================================== */
export function SmartNotesView({ content, topic, activeBook }) {
  const [viewMode, setViewMode] = useState('infographic'); // 'infographic' or 'flashcards'
  const [activeCard, setActiveCard] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [masteredCards, setMasteredCards] = useState({});

  const points = content?.points?.length ? content.points : [
    `Foundational concepts of ${topic}`,
    'Key protocol specifications and packet formatting',
    'Layered communication model and interface boundaries',
    'Performance metrics: latency, bandwidth, and reliability'
  ];

  const cardIcons = [Zap, Target, Layers, Compass];
  const cardTones = ['card-violet', 'card-blue', 'card-green', 'card-orange'];
  const cardLabels = ['CORE TAKEAWAY', 'PROTOCOL MECHANISM', 'SYSTEM ARCHITECTURE', 'EXAM ESSENTIAL'];

  const toggleMaster = (idx) => {
    setMasteredCards(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  return (
    <div className="visual-notes-wrapper">
      {/* Visual Infographic Hero Banner */}
      <div className="visual-hero-banner">
        <div className="hero-banner-image-wrap">
          <img 
            src="/images/concept_art.jpg" 
            alt="AI Visual Concept Map" 
            className="hero-concept-img"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          <div className="hero-image-overlay" />
          <div className="hero-badge-floating">
            <Sparkles size={14} />
            <span>AI VISUAL CONCEPT MAP</span>
          </div>
        </div>

        <div className="hero-banner-content">
          <div className="hero-eyebrow">TOPIC AT A GLANCE</div>
          <h3>{topic}</h3>
          <p>{content?.intro || `Visual revision map summarizing key concepts from ${activeBook?.title || 'the textbook'}.`}</p>

          <div className="visual-quick-stats">
            <div className="quick-stat-chip">
              <Zap size={14} />
              <span><b>{points.length}</b> Visual Insights</span>
            </div>
            <div className="quick-stat-chip">
              <BookmarkCheck size={14} />
              <span><b>2 min</b> Speed Revision</span>
            </div>
            <div className="quick-stat-chip highlight">
              <Flame size={14} />
              <span><b>95%</b> High-Yield Exam Focus</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mode Switcher: Infographic Cards vs Flashcards */}
      <div className="notes-mode-bar">
        <span className="mode-bar-label">Study Mode:</span>
        <div className="mode-pill-group">
          <button 
            className={`mode-pill ${viewMode === 'infographic' ? 'active' : ''}`}
            onClick={() => setViewMode('infographic')}
          >
            <Layers size={14} />
            <span>Visual Cards</span>
          </button>
          <button 
            className={`mode-pill ${viewMode === 'flashcards' ? 'active' : ''}`}
            onClick={() => { setViewMode('flashcards'); setIsFlipped(false); }}
          >
            <RotateCw size={14} />
            <span>Interactive Flashcards</span>
          </button>
        </div>
      </div>

      {/* Mode 1: Infographic Visual Cards Grid */}
      {viewMode === 'infographic' && (
        <div className="infographic-cards-grid">
          {points.map((pt, idx) => {
            const Icon = cardIcons[idx % cardIcons.length];
            const tone = cardTones[idx % cardTones.length];
            const label = cardLabels[idx % cardLabels.length];
            const isMastered = masteredCards[idx];

            return (
              <div 
                key={idx} 
                className={`visual-concept-card ${tone} ${isMastered ? 'mastered' : ''}`}
                onClick={() => toggleMaster(idx)}
                title="Click to mark as understood"
              >
                <div className="card-top-row">
                  <div className="card-icon-badge">
                    <Icon size={16} />
                  </div>
                  <span className="card-category-label">{label}</span>
                  <button 
                    className={`card-check-pill ${isMastered ? 'active' : ''}`}
                    onClick={(e) => { e.stopPropagation(); toggleMaster(idx); }}
                  >
                    <CheckCircle2 size={13} />
                    <span>{isMastered ? 'Understood' : 'Got it'}</span>
                  </button>
                </div>

                <div className="card-body-text">
                  <p>{pt}</p>
                </div>

                <div className="card-foot-row">
                  <span className="card-step-num">POINT 0{idx + 1}</span>
                  <span className="card-hint-text">Bite-sized insight</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Mode 2: Interactive 3D Flip Flashcards */}
      {viewMode === 'flashcards' && (
        <div className="flashcard-interactive-stage">
          <div className="flashcard-nav-row">
            <span>Card {activeCard + 1} of {points.length}</span>
            <div className="flashcard-nav-buttons">
              <button 
                className="btn secondary small" 
                disabled={activeCard === 0}
                onClick={() => { setActiveCard(prev => prev - 1); setIsFlipped(false); }}
              >
                Prev
              </button>
              <button 
                className="btn secondary small" 
                disabled={activeCard === points.length - 1}
                onClick={() => { setActiveCard(prev => prev + 1); setIsFlipped(false); }}
              >
                Next
              </button>
            </div>
          </div>

          <div 
            className={`flashcard-3d-box ${isFlipped ? 'flipped' : ''}`}
            onClick={() => setIsFlipped(!isFlipped)}
          >
            {/* Front Side */}
            <div className="flashcard-face flashcard-front">
              <div className="flashcard-tag">CONCEPT #{activeCard + 1}</div>
              <h4>{topic}</h4>
              <p className="flashcard-prompt">Can you explain Point #{activeCard + 1}?</p>
              <span className="flashcard-tap-hint">
                <RotateCw size={14} /> Click card to flip & reveal takeaway
              </span>
            </div>

            {/* Back Side */}
            <div className="flashcard-face flashcard-back">
              <div className="flashcard-tag back">KEY INSIGHT</div>
              <p className="flashcard-answer-text">{points[activeCard]}</p>
              <div className="flashcard-action-bar">
                <button 
                  className={`btn small ${masteredCards[activeCard] ? 'primary' : 'secondary'}`}
                  onClick={(e) => { e.stopPropagation(); toggleMaster(activeCard); }}
                >
                  <CheckCircle2 size={14} />
                  <span>{masteredCards[activeCard] ? 'Mastered!' : 'Mark as Mastered'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* High-Yield Exam Tip Box */}
      {content?.exam_tip && (
        <div className="visual-exam-tip-card">
          <div className="exam-tip-icon">
            <Lightbulb size={22} />
          </div>
          <div>
            <b>Exam High-Yield Tip</b>
            <p>{content.exam_tip}</p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ========================================================
   2. IMPORTANT QUESTIONS VIEW (Interactive Reveal Flashcards)
   ======================================================== */
export function QuestionsView({ content, topic }) {
  const questions = content?.questions?.length ? content.questions : [
    `Explain the fundamental architecture and purpose of ${topic}.`,
    `What are the advantages, limitations, and primary use-cases of ${topic}?`,
    `How does data validation and routing occur in ${topic}?`,
    `Compare and contrast ${topic} with alternative networking protocols.`
  ];

  const [expandedCards, setExpandedCards] = useState({});
  const [mastered, setMastered] = useState({});

  const toggleExpand = (idx) => {
    setExpandedCards(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const toggleMastered = (idx) => {
    setMastered(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const masteredCount = Object.values(mastered).filter(Boolean).length;

  return (
    <div className="visual-questions-wrapper">
      {/* Progress Header */}
      <div className="questions-progress-header">
        <div>
          <b>Active Recall Questions</b>
          <p>Test yourself before viewing answers to build long-term memory</p>
        </div>
        <div className="questions-mastery-pill">
          <CheckCircle2 size={14} />
          <span><b>{masteredCount}</b> / {questions.length} Mastered</span>
        </div>
      </div>

      {/* Question Cards List */}
      <div className="interactive-questions-list">
        {questions.map((q, idx) => {
          const isExpanded = expandedCards[idx];
          const isDone = mastered[idx];
          const badges = ['⭐ High Probability', '🔥 Exam Favorite', '🎯 Core Theory', '💡 Application Based'];
          const badge = badges[idx % badges.length];

          return (
            <div key={idx} className={`interactive-q-card ${isDone ? 'done' : ''}`}>
              <div className="q-card-head" onClick={() => toggleExpand(idx)}>
                <div className="q-num-badge">Q{String(idx + 1).padStart(2, '0')}</div>
                <div className="q-head-text">
                  <div className="q-badges-row">
                    <span className="exam-badge">{badge}</span>
                    {isDone && <span className="mastered-tag">✓ Ready</span>}
                  </div>
                  <h4>{q}</h4>
                </div>
                <button className="q-expand-trigger" title="Toggle Answer Hint">
                  {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
              </div>

              {/* Revealable Answer Breakdown */}
              {isExpanded && (
                <div className="q-revealed-answer">
                  <div className="answer-hint-header">
                    <Lightbulb size={15} />
                    <span>Key Points to Write in Exam:</span>
                  </div>
                  <ul className="answer-points-list">
                    <li><b>Definition:</b> Start by stating the textbook definition and purpose clearly.</li>
                    <li><b>Components:</b> List 2–3 main elements or packet header fields involved.</li>
                    <li><b>Real Example:</b> Give a concrete scenario (e.g. web browsing, file transfer).</li>
                    <li><b>Diagram:</b> Draw a quick box diagram showing flow between Sender and Receiver.</li>
                  </ul>
                  <div className="q-card-actions">
                    <button 
                      className={`btn small ${isDone ? 'primary' : 'secondary'}`}
                      onClick={() => toggleMastered(idx)}
                    >
                      <CheckCircle2 size={14} />
                      <span>{isDone ? 'Marked as Mastered' : 'I Know This Answer'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="questions-bottom-note">
        <HelpCircle size={15} />
        <span>Use active recall: write the answers on paper before checking your notes.</span>
      </div>
    </div>
  );
}

/* ========================================================
   3. EASY EXPLANATION VIEW (Diagram Blueprint + ELI5 Analogy)
   ======================================================== */
export function ExplanationView({ content, topic }) {
  const [activeTerm, setActiveTerm] = useState(null);

  const terms = content?.key_terms?.length ? content.key_terms : [
    'Packet', 'Header', 'Bandwidth', 'Protocol', 'Latency', 'Routing'
  ];

  const termDefinitions = {
    packet: 'Small block of data transmitted over a network.',
    header: 'Control information placed at the start of a packet.',
    bandwidth: 'Maximum transmission capacity of a communication channel.',
    protocol: 'Standard set of rules that computers follow to communicate.',
    latency: 'Time taken for data to travel from source to destination.',
    routing: 'Selecting the optimal path for network traffic.'
  };

  return (
    <div className="visual-explanation-wrapper">
      {/* 3D Blueprint Diagram Card */}
      <div className="explanation-diagram-card">
        <div className="diagram-image-container">
          <img 
            src="/images/network_diagram.jpg" 
            alt="System Architecture Diagram" 
            className="diagram-rendered-img"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          <div className="diagram-overlay-gradient" />
          <div className="diagram-tag-floating">
            <Layers size={14} />
            <span>3D ARCHITECTURAL BLUEPRINT</span>
          </div>
        </div>

        <div className="diagram-caption-box">
          <b>Visual Concept Architecture</b>
          <p>End-to-end data flow: Client Devices ➔ Core Network ➔ Datacenter Storage & Servers</p>
        </div>
      </div>

      {/* The Big Idea - Simplified Breakdown */}
      <div className="eli5-big-idea-card">
        <div className="big-idea-header">
          <div className="big-idea-icon">
            <Zap size={20} />
          </div>
          <div>
            <b>The Big Idea (In Simple Terms)</b>
            <p className="big-idea-text">
              {content?.explanation || `${topic} coordinates communication so devices can exchange structured information reliably without losing packets.`}
            </p>
          </div>
        </div>
      </div>

      {/* Real-World Analogy (Metaphor Card) */}
      {content?.analogy && (
        <div className="analogy-metaphor-card">
          <div className="metaphor-badge">
            <Compass size={14} />
            <span>REAL-WORLD METAPHOR</span>
          </div>
          <div className="metaphor-content">
            <h4>"Think of it like a postal shipping service..."</h4>
            <p>{content.analogy}</p>
          </div>
        </div>
      )}

      {/* Interactive Key Terms Matrix */}
      <div className="interactive-terms-box">
        <div className="terms-head">
          <b>Interactive Terminology</b>
          <small>Click any term for instant breakdown</small>
        </div>
        <div className="terms-pill-cloud">
          {terms.map(t => {
            const key = t.toLowerCase();
            const isSelected = activeTerm === t;
            return (
              <button 
                key={t} 
                className={`interactive-term-pill ${isSelected ? 'active' : ''}`}
                onClick={() => setActiveTerm(isSelected ? null : t)}
              >
                <span>{t}</span>
                {isSelected && <span className="term-pulse-dot" />}
              </button>
            );
          })}
        </div>

        {activeTerm && (
          <div className="term-popup-definition">
            <b>{activeTerm}:</b>
            <span>
              {termDefinitions[activeTerm.toLowerCase()] || 
               `Crucial component used in ${topic} for standardized network execution and addressing.`}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
