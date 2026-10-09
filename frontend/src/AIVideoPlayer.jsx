import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Maximize2, Minimize2, Download, Sparkles, CheckCircle2, ChevronRight, ChevronLeft, Film, MonitorPlay, Radio, Layers, Network, BookOpen, Languages, Globe } from 'lucide-react';

const SUPPORTED_LANGUAGES = [
  { id: 'en', name: 'English', code: 'en-US', flag: '🇬🇧' },
  { id: 'hi', name: 'हिंदी (Hindi)', code: 'hi-IN', flag: '🇮🇳' },
  { id: 'mr', name: 'मराठी (Marathi)', code: 'mr-IN', flag: '🇮🇳' },
  { id: 'es', name: 'Español (Spanish)', code: 'es-ES', flag: '🇪🇸' },
  { id: 'fr', name: 'Français (French)', code: 'fr-FR', flag: '🇫🇷' },
  { id: 'de', name: 'Deutsch (German)', code: 'de-DE', flag: '🇩🇪' },
];

const MULTILINGUAL_TEMPLATES = {
  en: (topic) => [
    { scene: 1, visual: `Title card: ${topic}`, narration: `Welcome. In this video lesson, we will understand ${topic} step by step.` },
    { scene: 2, visual: 'Key terms and fundamental definitions', narration: 'Let us begin with the core definition and why this concept is essential for your studies.' },
    { scene: 3, visual: 'System architecture and diagram breakdown', narration: 'Notice how data flows across each layer and component in the network.' },
    { scene: 4, visual: 'Recap card with core takeaways', narration: 'To summarize, remember the three key ideas, then proceed to the practice quiz.' }
  ],
  hi: (topic) => [
    { scene: 1, visual: `शीर्षक कार्ड (Title Card): ${topic}`, narration: `नमस्ते और स्वागत है। इस वीडियो पाठ में, हम ${topic} को सरल और स्पष्ट तरीके से समझेंगे।` },
    { scene: 2, visual: 'प्रमुख शब्दावली और परिभाषाएं (Key Concepts)', narration: 'आइए सबसे पहले मूल परिभाषा और यह विषय परीक्षा तथा वास्तविक दुनिया के लिए क्यों महत्वपूर्ण है, इससे शुरुआत करते हैं।' },
    { scene: 3, visual: 'प्रणाली आरेख और घटक प्रवाह (Architecture Flow)', narration: 'इस आरेख पर ध्यान दें। डेटा प्रेषक से विभिन्न प्रोटोकॉल परतों के माध्यम से प्राप्तकर्ता तक कैसे पहुँचता है, इसे देखें।' },
    { scene: 4, visual: 'निष्कर्ष और परीक्षा अभ्यास (Recap & Quiz)', narration: 'संक्षेप में, इन मुख्य बिंदुओं को याद रखें। अब अपनी समझ की जांच के लिए अभ्यास प्रश्न हल करें।' }
  ],
  mr: (topic) => [
    { scene: 1, visual: `शीर्षक कार्ड (Title Card): ${topic}`, narration: `नमस्कार आणि स्वागत. या व्हिडिओ धड्यात, आपण ${topic} सोप्या आणि प्रभावी भाषेत समजून घेऊया.` },
    { scene: 2, visual: 'महत्त्वाच्या व्याख्या आणि संकल्पना (Key Concepts)', narration: 'सुरुवातीला या संकल्पनेची मुख्य व्याख्या आणि परीक्षेच्या दृष्टीने याचे महत्त्व समजून घेऊया.' },
    { scene: 3, visual: 'प्रणाली आकृती आणि रचना (Architecture Flow)', narration: 'या आकृतीमध्ये डेटा एका घटकाकडून दुसऱ्या घटकाकडे कसा वाहतो ते काळजीपूर्वक पहा.' },
    { scene: 4, visual: 'पुनरावलोकन आणि सराव (Recap & Quiz)', narration: 'थोडक्यात, हे तीन मुख्य मुद्दे लक्षात ठेवा आणि पुढील सराव प्रश्न सोडवा.' }
  ],
  es: (topic) => [
    { scene: 1, visual: `Tarjeta de título: ${topic}`, narration: `Bienvenidos. En esta video lección, comprenderemos ${topic} paso a paso.` },
    { scene: 2, visual: 'Términos clave y definiciones fundamentales', narration: 'Comencemos con la definición central y por qué este concepto es fundamental.' },
    { scene: 3, visual: 'Diagrama de flujo de arquitectura del sistema', narration: 'Observe cómo fluyen los datos entre el emisor y el receptor a través de los componentes de la red.' },
    { scene: 4, visual: 'Resumen y puntos clave de repaso', narration: 'Para resumir, recuerde estos puntos esenciales y luego pruebe las preguntas de práctica.' }
  ],
  fr: (topic) => [
    { scene: 1, visual: `Titre: ${topic}`, narration: `Bienvenue. Dans cette leçon vidéo, nous allons comprendre ${topic} étape par étape.` },
    { scene: 2, visual: 'Termes clés et définitions essentielles', narration: 'Commençons par la définition principale et l\'importance de ce concept.' },
    { scene: 3, visual: 'Schéma d\'architecture et flux des données', narration: 'Regardez comment les paquets de données transitent entre l\'émetteur et le récepteur.' },
    { scene: 4, visual: 'Récapitulatif et points à retenir', narration: 'Pour résumer, retenez ces points clés puis passez au quiz d\'entraînement.' }
  ],
  de: (topic) => [
    { scene: 1, visual: `Titelkarte: ${topic}`, narration: `Willkommen. In dieser Videolektion lernen wir ${topic} schrittweise kennen.` },
    { scene: 2, visual: 'Schlüsselbegriffe und Grundlagen', narration: 'Beginnen wir mit der Definition und warum dieses Konzept wichtig ist.' },
    { scene: 3, visual: 'Systemarchitektur und Datenfluss-Diagramm', narration: 'Sehen Sie, wie die Daten zwischen Sender und Empfänger fließen.' },
    { scene: 4, visual: 'Zusammenfassung und Prüfungstipps', narration: 'Zusammenfassend merken Sie sich diese Kernpunkte und üben Sie mit den Testfragen.' }
  ]
};

export function AIVideoPlayer({ topic, content, activeBook, onSelectScene }) {
  // Detect initial language from content or fallback to English
  const initialLang = content?.language ? 
    (SUPPORTED_LANGUAGES.find(l => content.language.toLowerCase().includes(l.id) || l.name.toLowerCase().includes(content.language.toLowerCase()))?.id || 'en') 
    : 'en';

  const [selectedLanguage, setSelectedLanguage] = useState(initialLang);
  const [currentScene, setCurrentScene] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  const playerContainerRef = useRef(null);
  const timerRef = useRef(null);
  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;

  const currentLangConfig = SUPPORTED_LANGUAGES.find(l => l.id === selectedLanguage) || SUPPORTED_LANGUAGES[0];

  // Resolve scenes according to selected language
  const scenes = React.useMemo(() => {
    // If incoming content is already in the matching language, use its scenes
    if (content?.language && content.language.toLowerCase().includes(currentLangConfig.name.toLowerCase().split(' ')[0]) && content.scenes?.length) {
      return content.scenes;
    }
    // Otherwise use multilingual template
    const templateFn = MULTILINGUAL_TEMPLATES[selectedLanguage] || MULTILINGUAL_TEMPLATES.en;
    return templateFn(topic);
  }, [selectedLanguage, content, topic, currentLangConfig]);

  const activeSceneData = scenes[currentScene] || scenes[0];

  const handleLanguageChange = (langId) => {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    setSelectedLanguage(langId);
    setCurrentScene(0);
    if (isPlaying) {
      setIsPlaying(false);
      setTimeout(() => setIsPlaying(true), 200);
    }
  };

  // Speech Synthesis Controller with Multilingual Voice Selection
  useEffect(() => {
    if (!isPlaying) {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      if (timerRef.current) clearTimeout(timerRef.current);
      setIsSpeaking(false);
      return;
    }

    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    if (timerRef.current) clearTimeout(timerRef.current);

    if (isMuted || !window.speechSynthesis) {
      // Silent countdown per scene
      timerRef.current = setTimeout(() => {
        if (!isPlayingRef.current) return;
        if (currentScene < scenes.length - 1) {
          setCurrentScene(prev => prev + 1);
        } else {
          setIsPlaying(false);
        }
      }, 5500);
      return;
    }

    const narration = activeSceneData.narration || '';
    const utterance = new SpeechSynthesisUtterance(narration);
    utterance.lang = currentLangConfig.code;
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    // Pick best matching voice for the language
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      const langPrefix = currentLangConfig.id;
      const matchedVoice = voices.find(v => 
        v.lang.toLowerCase().startsWith(langPrefix) || 
        v.lang.toLowerCase().replace('_', '-').startsWith(currentLangConfig.code.toLowerCase())
      );
      if (matchedVoice) {
        utterance.voice = matchedVoice;
      }
    }

    utterance.onstart = () => {
      setIsSpeaking(true);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      if (isPlayingRef.current) {
        timerRef.current = setTimeout(() => {
          if (isPlayingRef.current) {
            if (currentScene < scenes.length - 1) {
              setCurrentScene(prev => prev + 1);
            } else {
              setIsPlaying(false);
            }
          }
        }, 900);
      }
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      if (isPlayingRef.current) {
        timerRef.current = setTimeout(() => {
          if (isPlayingRef.current) {
            if (currentScene < scenes.length - 1) {
              setCurrentScene(prev => prev + 1);
            } else {
              setIsPlaying(false);
            }
          }
        }, 4500);
      }
    };

    window.speechSynthesis.speak(utterance);

    return () => {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isPlaying, currentScene, isMuted, selectedLanguage, scenes]);

  const togglePlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    } else {
      if (currentScene >= scenes.length - 1) {
        setCurrentScene(0);
      }
      setIsPlaying(true);
    }
  };

  const handlePrev = () => {
    if (currentScene > 0) {
      setCurrentScene(prev => prev - 1);
    }
  };

  const handleNext = () => {
    if (currentScene < scenes.length - 1) {
      setCurrentScene(prev => prev + 1);
    }
  };

  const handleSelectScene = (idx) => {
    setCurrentScene(idx);
    if (onSelectScene) onSelectScene(idx);
  };

  const toggleFullscreen = () => {
    if (!playerContainerRef.current) return;
    if (!document.fullscreenElement) {
      playerContainerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // Video Export (generates real downloadable WebM/MP4 video in selected language)
  const handleExportVideo = async () => {
    if (isExporting) return;
    setIsExporting(true);
    setExportProgress(10);

    const canvas = document.createElement('canvas');
    canvas.width = 1280;
    canvas.height = 720;
    const ctx = canvas.getContext('2d');

    const stream = canvas.captureStream(30);
    let recorder;
    try {
      recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9' });
    } catch (e) {
      try {
        recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
      } catch (err) {
        recorder = new MediaRecorder(stream);
      }
    }

    const chunks = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `AI_Study_Video_${topic.replace(/\s+/g, '_')}_${selectedLanguage}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setIsExporting(false);
      setExportProgress(100);
    };

    recorder.start();

    // Render scenes sequentially into the canvas for 3.5 seconds each
    const totalScenes = scenes.length;
    for (let i = 0; i < totalScenes; i++) {
      const sc = scenes[i];
      setExportProgress(Math.round(((i + 1) / totalScenes) * 90));

      const startTime = Date.now();
      const sceneDuration = 3500;

      while (Date.now() - startTime < sceneDuration) {
        const elapsed = (Date.now() - startTime) / 1000;
        
        // Background Gradient
        const grad = ctx.createLinearGradient(0, 0, 1280, 720);
        grad.addColorStop(0, '#0a0d1a');
        grad.addColorStop(0.5, '#131a33');
        grad.addColorStop(1, '#0e1428');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 1280, 720);

        // Grid lines effect
        ctx.strokeStyle = 'rgba(155, 140, 255, 0.08)';
        ctx.lineWidth = 1;
        for (let x = 0; x < 1280; x += 60) {
          ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 720); ctx.stroke();
        }
        for (let y = 0; y < 720; y += 60) {
          ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(1280, y); ctx.stroke();
        }

        // Header Brand
        ctx.fillStyle = '#a99aff';
        ctx.font = 'bold 20px "DM Sans", sans-serif';
        ctx.fillText(`STUDYFLOW AI VIDEO STUDIO (${currentLangConfig.name.toUpperCase()})`, 60, 60);

        ctx.fillStyle = '#ffffff';
        ctx.font = '16px "DM Sans", sans-serif';
        ctx.fillText(`BOOK: ${activeBook?.title || 'DEMO BOOK'}   |   TOPIC: ${topic}`, 60, 90);

        // Scene Badge
        ctx.fillStyle = 'rgba(155, 140, 255, 0.2)';
        ctx.beginPath();
        ctx.roundRect(60, 130, 260, 36, 8);
        ctx.fill();
        ctx.fillStyle = '#c5bdff';
        ctx.font = 'bold 15px "DM Sans", sans-serif';
        ctx.fillText(`SCENE ${sc.scene || i + 1} OF ${totalScenes} (${currentLangConfig.flag} ${currentLangConfig.name})`, 75, 154);

        // Visual Presentation Box
        ctx.fillStyle = 'rgba(23, 31, 53, 0.85)';
        ctx.strokeStyle = 'rgba(155, 140, 255, 0.3)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(60, 190, 1160, 340, 16);
        ctx.fill();
        ctx.stroke();

        // Scene Visual Headline
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 36px "Manrope", sans-serif';
        ctx.fillText(topic, 100, 260);

        ctx.fillStyle = '#75a9ff';
        ctx.font = '600 24px "DM Sans", sans-serif';
        ctx.fillText(sc.visual, 100, 310);

        // Animated Equalizer Wave
        for (let bar = 0; bar < 25; bar++) {
          const h = Math.sin(elapsed * 8 + bar * 0.4) * 20 + 28;
          ctx.fillStyle = 'rgba(155, 140, 255, 0.7)';
          ctx.fillRect(100 + bar * 16, 450 - h, 8, h);
        }

        // Narration Subtitle Box
        ctx.fillStyle = 'rgba(10, 13, 24, 0.9)';
        ctx.beginPath();
        ctx.roundRect(60, 560, 1160, 100, 14);
        ctx.fill();

        ctx.fillStyle = '#ffb879';
        ctx.font = 'bold 14px "DM Sans", sans-serif';
        ctx.fillText(`VOICE & NARRATION [${currentLangConfig.name}]:`, 90, 595);

        ctx.fillStyle = '#f3f5ff';
        ctx.font = '500 20px "DM Sans", sans-serif';
        // Wrap narration text
        const words = sc.narration.split(' ');
        let line = '';
        let y = 628;
        for (let n = 0; n < words.length; n++) {
          const testLine = line + words[n] + ' ';
          const metrics = ctx.measureText(testLine);
          if (metrics.width > 1050 && n > 0) {
            ctx.fillText(line, 90, y);
            line = words[n] + ' ';
            y += 26;
            break;
          } else {
            line = testLine;
          }
        }
        ctx.fillText(line, 90, y);

        // Progress bar at bottom
        ctx.fillStyle = '#7867f5';
        const progWidth = ((i + (Date.now() - startTime) / sceneDuration) / totalScenes) * 1280;
        ctx.fillRect(0, 712, progWidth, 8);

        await new Promise(r => setTimeout(r, 33));
      }
    }

    recorder.stop();
  };

  return (
    <div className="ai-video-studio-wrapper" ref={playerContainerRef}>
      {/* Video Studio Header */}
      <div className="video-studio-banner">
        <div className="video-studio-title">
          <div className="video-studio-badge">
            <Radio size={14} className={isPlaying ? 'pulse-icon' : ''} />
            <span>AI MULTILINGUAL STUDIO</span>
          </div>
          <div>
            <b>Interactive Multilingual Video Lesson</b>
            <p>Generate, listen, and watch lessons in 6 global and regional languages</p>
          </div>
        </div>

        <div className="video-studio-actions">
          <button 
            className={`btn secondary export-video-btn ${isExporting ? 'loading' : ''}`}
            onClick={handleExportVideo}
            disabled={isExporting}
            title="Record and download this animated video"
          >
            <Download size={15} />
            <span>{isExporting ? `Exporting (${exportProgress}%)` : `Export (${currentLangConfig.name.split(' ')[0]})`}</span>
          </button>
        </div>
      </div>

      {/* Multilingual Voice & Subtitle Selector Bar */}
      <div className="video-language-bar">
        <div className="video-lang-title">
          <Languages size={15} />
          <span>Voice & Narration Language:</span>
        </div>
        <div className="video-lang-options">
          {SUPPORTED_LANGUAGES.map(lang => (
            <button
              key={lang.id}
              className={`lang-option-chip ${selectedLanguage === lang.id ? 'active' : ''}`}
              onClick={() => handleLanguageChange(lang.id)}
            >
              <span className="lang-flag">{lang.flag}</span>
              <span className="lang-name">{lang.name}</span>
              {selectedLanguage === lang.id && <span className="lang-active-check">✓</span>}
            </button>
          ))}
        </div>
      </div>

      {/* 16:9 Video Canvas Screen */}
      <div className="ai-video-screen">
        {/* Ambient Glow */}
        <div className={`video-screen-glow scene-glow-${currentScene % 4}`} />

        {/* Top Video Overlay Bar */}
        <div className="video-overlay-top">
          <div className="video-live-pill">
            <span className={`live-dot ${isPlaying ? 'active' : ''}`} />
            <span>{isPlaying ? `PLAYING IN ${currentLangConfig.name.toUpperCase()}` : 'READY TO PLAY'}</span>
          </div>
          <div className="video-scene-indicator">
            <Layers size={14} />
            <span>Scene {currentScene + 1} of {scenes.length}</span>
            <span className="lang-mini-badge">{currentLangConfig.flag}</span>
          </div>
        </div>

        {/* Dynamic Center Visual Stage */}
        <div className="video-visual-stage">
          {/* Scene 1: Title Card */}
          {currentScene === 0 && (
            <div className="stage-scene-card stage-scene-intro">
              <div className="stage-image-preview">
                <img src="/images/concept_art.jpg" alt="AI Concept Map" className="stage-preview-img" onError={(e)=>{e.target.style.display='none';}} />
              </div>
              <div className="stage-eyebrow">
                {selectedLanguage === 'hi' ? 'अध्याय सारांश' :
                 selectedLanguage === 'mr' ? 'धडा सारांश' :
                 selectedLanguage === 'es' ? 'RESUMEN DEL MÓDULO' :
                 selectedLanguage === 'fr' ? 'APERÇU DU MODULE' :
                 selectedLanguage === 'de' ? 'MODUL-ÜBERSICHT' : 'MODULE OVERVIEW'}
              </div>
              <h2 className="stage-title">{topic}</h2>
              <p className="stage-subtitle">{activeBook?.title || 'Study Book'}</p>
              <div className="stage-chips">
                <span>✦ {currentLangConfig.name} Narration</span>
                <span>✦ Visual Storyboard</span>
                <span>✦ High-Yield Concepts</span>
              </div>
            </div>
          )}

          {/* Scene 2: Concept Terms */}
          {currentScene === 1 && (
            <div className="stage-scene-card stage-scene-concepts">
              <div className="stage-eyebrow">
                {selectedLanguage === 'hi' ? 'मूल परिभाषा और शब्दावली' :
                 selectedLanguage === 'mr' ? 'मुख्य व्याख्या आणि संकल्पना' :
                 selectedLanguage === 'es' ? 'CONCEPTOS CLAVE Y DEFINICIÓN' :
                 selectedLanguage === 'fr' ? 'DÉFINITIONS ET CONCEPTS CLÉS' :
                 selectedLanguage === 'de' ? 'SCHLÜSSELBEGRIFFE UND GRUNDLAGEN' : 'KEY DEFINITION & CONCEPTS'}
              </div>
              <h3 className="stage-title-sm">{activeSceneData.visual}</h3>
              <div className="concept-grid-preview">
                <div className="concept-chip-item">
                  <b>{selectedLanguage === 'hi' ? 'मुख्य अवधारणा' : selectedLanguage === 'mr' ? 'मुख्य संकल्पना' : 'Core Concept'}</b>
                  <p>{selectedLanguage === 'hi' ? 'प्राथमिक सिद्धांत और वास्तविक उपयोग' : 'Primary mechanism & textbook principles'}</p>
                </div>
                <div className="concept-chip-item">
                  <b>{selectedLanguage === 'hi' ? 'मानक नियम' : selectedLanguage === 'mr' ? 'प्रोटोकॉल नियम' : 'Key Protocol / Rule'}</b>
                  <p>{selectedLanguage === 'hi' ? 'कंप्यूटर नेटवर्क विनिर्देश' : 'Standard specifications & data structures'}</p>
                </div>
                <div className="concept-chip-item">
                  <b>{selectedLanguage === 'hi' ? 'परीक्षा में महत्व' : selectedLanguage === 'mr' ? 'परीक्षेसाठी महत्त्वाचे' : 'High Relevance'}</b>
                  <p>{selectedLanguage === 'hi' ? 'अत्यंत महत्वपूर्ण परीक्षा प्रश्न' : 'Frequent exam questions & practical systems'}</p>
                </div>
              </div>
            </div>
          )}

          {/* Scene 3: Architecture Diagram */}
          {currentScene === 2 && (
            <div className="stage-scene-card stage-scene-diagram">
              <div className="stage-image-preview">
                <img src="/images/network_diagram.jpg" alt="3D Architecture Diagram" className="stage-preview-img" onError={(e)=>{e.target.style.display='none';}} />
              </div>
              <div className="stage-eyebrow">
                {selectedLanguage === 'hi' ? 'सिस्टम आर्किटेक्चर और डेटा प्रवाह' :
                 selectedLanguage === 'mr' ? 'प्रणाली रचना आणि डेटा प्रवाह' :
                 selectedLanguage === 'es' ? 'ARQUITECTURA Y FLUJO DEL SISTEMA' :
                 selectedLanguage === 'fr' ? 'ARCHITECTURE ET FLUX DU SYSTÈME' :
                 selectedLanguage === 'de' ? 'SYSTEMARCHITEKTUR UND DATENFLUSS' : 'SYSTEM ARCHITECTURE & FLOW'}
              </div>
              <h3 className="stage-title-sm">{activeSceneData.visual}</h3>
              <div className="diagram-visual-flow">
                <div className="flow-node">
                  <div className="node-icon"><Network size={22} /></div>
                  <b>{selectedLanguage === 'hi' ? 'प्रेषक (Sender)' : selectedLanguage === 'mr' ? 'प्रेषक (Sender)' : 'Input / Sender'}</b>
                  <small>Originating Data</small>
                </div>
                <div className="flow-arrow">
                  <span className="flow-dash" />
                  <span className="packet-bullet" />
                  <small>Transmission</small>
                </div>
                <div className="flow-node highlight">
                  <div className="node-icon"><Layers size={22} /></div>
                  <b>{topic}</b>
                  <small>{selectedLanguage === 'hi' ? 'प्रोटोकॉल प्रोसेसिंग' : selectedLanguage === 'mr' ? 'प्रक्रिया थर' : 'Protocol Stack'}</small>
                </div>
                <div className="flow-arrow">
                  <span className="flow-dash" />
                  <span className="packet-bullet delayed" />
                  <small>Delivery</small>
                </div>
                <div className="flow-node">
                  <div className="node-icon"><MonitorPlay size={22} /></div>
                  <b>{selectedLanguage === 'hi' ? 'प्राप्तकर्ता (Receiver)' : selectedLanguage === 'mr' ? 'प्राप्तकर्ता (Receiver)' : 'Output / Receiver'}</b>
                  <small>Target Endpoint</small>
                </div>
              </div>
            </div>
          )}

          {/* Scene 4: Recap & Exam Takeaways */}
          {currentScene === 3 && (
            <div className="stage-scene-card stage-scene-recap">
              <div className="stage-eyebrow">
                {selectedLanguage === 'hi' ? 'निष्कर्ष और परीक्षा अभ्यास' :
                 selectedLanguage === 'mr' ? 'पुनरावलोकन आणि सराव' :
                 selectedLanguage === 'es' ? 'RESUMEN Y PREPARACIÓN' :
                 selectedLanguage === 'fr' ? 'RÉCAPITULATIF ET CONSEILS' :
                 selectedLanguage === 'de' ? 'ZUSAMMENFASSUNG UND TIPPS' : 'RECAP & EXAM SUMMARY'}
              </div>
              <h3 className="stage-title-sm">{activeSceneData.visual}</h3>
              <div className="recap-list-preview">
                <div className="recap-item">
                  <CheckCircle2 size={18} />
                  <span>{selectedLanguage === 'hi' ? 'मूल परिभाषाएं और नियम कंठस्थ किए' : selectedLanguage === 'mr' ? 'मुख्य संकल्पना स्पष्ट झाल्या' : 'Mastered core definitions and fundamentals'}</span>
                </div>
                <div className="recap-item">
                  <CheckCircle2 size={18} />
                  <span>{selectedLanguage === 'hi' ? 'डेटा पैकेट प्रवाह और लेयर्स को समझा' : selectedLanguage === 'mr' ? 'रचना आणि डेटा प्रवाह समजला' : 'Understood end-to-end architecture & components'}</span>
                </div>
                <div className="recap-item">
                  <CheckCircle2 size={18} />
                  <span>{selectedLanguage === 'hi' ? 'अब MCQ प्रैक्टिस टैब में प्रश्नों का अभ्यास करें' : selectedLanguage === 'mr' ? 'MCQ सराव सोडवण्यासाठी सज्ज' : 'Ready to test recall in the MCQ Practice tab'}</span>
                </div>
              </div>
            </div>
          )}

          {/* Fallback for additional scenes */}
          {currentScene > 3 && (
            <div className="stage-scene-card stage-scene-general">
              <div className="stage-eyebrow">SCENE {currentScene + 1}</div>
              <h3 className="stage-title">{activeSceneData.visual}</h3>
              <p className="stage-subtitle">{topic}</p>
            </div>
          )}
        </div>

        {/* Center Big Play Trigger (when paused) */}
        {!isPlaying && (
          <button className="video-big-play-btn" onClick={togglePlay} title="Play Video">
            <Play size={38} fill="currentColor" />
          </button>
        )}

        {/* Subtitles & Captions Overlay */}
        <div className="video-captions-overlay">
          <div className="caption-instructor">
            <div className="instructor-avatar">{currentLangConfig.flag}</div>
            <div className="instructor-info">
              <b>{currentLangConfig.name} AI Voice</b>
              <div className="equalizer-bars">
                <span className={isSpeaking ? 'bounce-1' : ''} />
                <span className={isSpeaking ? 'bounce-2' : ''} />
                <span className={isSpeaking ? 'bounce-3' : ''} />
                <span className={isSpeaking ? 'bounce-4' : ''} />
              </div>
            </div>
          </div>
          <div className="caption-text-bubble">
            <p>{activeSceneData.narration}</p>
          </div>
        </div>

        {/* Bottom Scrubber & Controls Bar */}
        <div className="video-player-controls">
          {/* Segmented Timeline */}
          <div className="video-timeline-segments">
            {scenes.map((s, idx) => (
              <button 
                key={idx}
                className={`timeline-segment ${idx === currentScene ? 'active' : ''} ${idx < currentScene ? 'completed' : ''}`}
                onClick={() => handleSelectScene(idx)}
                title={`Jump to Scene ${idx + 1}`}
              >
                <span className="segment-fill" />
              </button>
            ))}
          </div>

          <div className="video-controls-row">
            <div className="controls-left">
              <button className="control-btn" onClick={togglePlay} title={isPlaying ? 'Pause' : 'Play'}>
                {isPlaying ? <Pause size={18} /> : <Play size={18} fill="currentColor" />}
              </button>

              <button className="control-btn" onClick={handlePrev} disabled={currentScene === 0} title="Previous Scene">
                <ChevronLeft size={18} />
              </button>

              <button className="control-btn" onClick={handleNext} disabled={currentScene === scenes.length - 1} title="Next Scene">
                <ChevronRight size={18} />
              </button>

              <button className="control-btn" onClick={() => { setCurrentScene(0); setIsPlaying(true); }} title="Replay from start">
                <RotateCcw size={16} />
              </button>

              <div className="control-time">
                <span>Scene {currentScene + 1} / {scenes.length}</span>
                <span className="control-lang-pill">{currentLangConfig.name}</span>
              </div>
            </div>

            <div className="controls-right">
              <button 
                className={`control-btn ${isMuted ? 'muted' : ''}`} 
                onClick={() => setIsMuted(!isMuted)} 
                title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
              >
                {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>

              <button className="control-btn" onClick={toggleFullscreen} title="Fullscreen">
                {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Storyboard Card Grid synced with the player */}
      <div className="video-synced-storyboard">
        <div className="storyboard-header">
          <div>
            <b>Interactive Scene Storyboard ({currentLangConfig.name})</b>
            <p>Click any scene to jump to it in the player above</p>
          </div>
          <span className="storyboard-count">{scenes.length} scenes ({currentLangConfig.name})</span>
        </div>

        <div className="synced-scene-grid">
          {scenes.map((s, i) => (
            <div 
              key={i} 
              className={`synced-scene-card ${currentScene === i ? 'current-active-scene' : ''}`}
              onClick={() => handleSelectScene(i)}
            >
              <div className="synced-scene-top">
                <span className="synced-scene-num">SCENE {String(s.scene || i + 1).padStart(2, '0')}</span>
                {currentScene === i && <span className="now-playing-tag">PLAYING</span>}
              </div>
              <b className="synced-scene-visual">{s.visual}</b>
              <p className="synced-scene-narration">{s.narration}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
