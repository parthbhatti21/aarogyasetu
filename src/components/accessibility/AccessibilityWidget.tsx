import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Language codes supported by Google Translate
const LANGUAGES = [
  { code: 'en', name: 'English', native: 'English' },
  { code: 'hi', name: 'Hindi', native: 'हिंदी' },
  { code: 'bn', name: 'Bengali', native: 'বাংলা' },
  { code: 'te', name: 'Telugu', native: 'తెలుగు' },
  { code: 'mr', name: 'Marathi', native: 'मराठी' },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்' },
  { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી' },
  { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ' },
  { code: 'ml', name: 'Malayalam', native: 'മലയാളം' },
  { code: 'pa', name: 'Punjabi', native: 'ਪੰਜਾਬੀ' },
];

export function AccessibilityWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [fontSize, setFontSize] = useState(0);
  const [lineHeight, setLineHeight] = useState(0);
  const [textSpacing, setTextSpacing] = useState(0);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [showLanguages, setShowLanguages] = useState(false);
  const [features, setFeatures] = useState({
    textToSpeech: false,
    highlightLinks: false,
    dyslexiaFont: false,
    hideImages: false,
    largeCursor: false,
    invertColors: false,
    translate: false,
  });

  // Apply text size changes
  useEffect(() => {
    const root = document.documentElement;
    if (fontSize !== 0) {
      root.style.fontSize = `${16 + fontSize * 2}px`;
    } else {
      root.style.fontSize = '';
    }
  }, [fontSize]);

  // Apply line height changes
  useEffect(() => {
    if (lineHeight !== 0) {
      document.body.style.lineHeight = `${1.5 + lineHeight * 0.2}`;
    } else {
      document.body.style.lineHeight = '';
    }
  }, [lineHeight]);

  // Apply text spacing changes
  useEffect(() => {
    if (textSpacing !== 0) {
      document.body.style.letterSpacing = `${textSpacing * 0.5}px`;
      document.body.style.wordSpacing = `${textSpacing * 2}px`;
    } else {
      document.body.style.letterSpacing = '';
      document.body.style.wordSpacing = '';
    }
  }, [textSpacing]);

  // Highlight links
  useEffect(() => {
    if (features.highlightLinks) {
      document.body.classList.add('highlight-links');
    } else {
      document.body.classList.remove('highlight-links');
    }
  }, [features.highlightLinks]);

  // Dyslexia friendly font
  useEffect(() => {
    if (features.dyslexiaFont) {
      document.body.classList.add('dyslexia-font');
    } else {
      document.body.classList.remove('dyslexia-font');
    }
  }, [features.dyslexiaFont]);

  // Hide images
  useEffect(() => {
    if (features.hideImages) {
      document.body.classList.add('hide-images');
    } else {
      document.body.classList.remove('hide-images');
    }
  }, [features.hideImages]);

  // Large cursor
  useEffect(() => {
    if (features.largeCursor) {
      document.body.classList.add('large-cursor');
    } else {
      document.body.classList.remove('large-cursor');
    }
  }, [features.largeCursor]);

  // Invert colors
  useEffect(() => {
    if (features.invertColors) {
      document.body.style.filter = 'invert(1) hue-rotate(180deg)';
    } else {
      document.body.style.filter = '';
    }
  }, [features.invertColors]);

  // Text to speech - hover to speak with natural voice
  const speakText = (text: string) => {
    if ('speechSynthesis' in window && text.trim()) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text.trim());
      
      // Adjust for more natural speech
      utterance.rate = 0.9; // Slightly slower for clarity
      utterance.pitch = 1.0; // Normal pitch
      utterance.volume = 1.0; // Full volume
      
      // Set language based on selected language
      const langMap: Record<string, string> = {
        'en': 'en-US',
        'hi': 'hi-IN',
        'bn': 'bn-IN',
        'te': 'te-IN',
        'mr': 'mr-IN',
        'ta': 'ta-IN',
        'gu': 'gu-IN',
        'kn': 'kn-IN',
        'ml': 'ml-IN',
        'pa': 'pa-IN',
      };
      utterance.lang = langMap[selectedLanguage] || 'en-US';
      
      // Select the best available voice for the language
      const voices = window.speechSynthesis.getVoices();
      
      // Filter voices by language
      const matchingVoices = voices.filter(voice => 
        voice.lang.startsWith(utterance.lang.split('-')[0])
      );
      
      if (matchingVoices.length > 0) {
        // Prefer Google voices or natural-sounding voices
        const preferredVoice = matchingVoices.find(voice => 
          voice.name.includes('Google') || 
          voice.name.includes('Natural') ||
          voice.name.includes('Premium') ||
          voice.name.includes('Enhanced') ||
          voice.localService === false // Cloud-based voices are usually better
        ) || matchingVoices[0];
        
        utterance.voice = preferredVoice;
      }
      
      window.speechSynthesis.speak(utterance);
    }
  };

  // Load voices when they become available
  useEffect(() => {
    if ('speechSynthesis' in window) {
      const loadVoices = () => {
        window.speechSynthesis.getVoices();
      };
      
      // Load voices immediately
      loadVoices();
      
      // Some browsers load voices asynchronously
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
      }
    }
  }, []);

  useEffect(() => {
    if (features.textToSpeech) {
      let hoverTimeout: NodeJS.Timeout;
      
      // Add hover listener to read text
      const handleMouseEnter = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        
        // Clear any existing timeout
        if (hoverTimeout) {
          clearTimeout(hoverTimeout);
        }
        
        // Wait a bit before speaking to avoid speaking on quick mouse movements
        hoverTimeout = setTimeout(() => {
          const text = target.textContent || target.innerText;
          if (text && text.trim().length > 0) {
            speakText(text);
          }
        }, 300); // 300ms delay
      };

      const handleMouseLeave = () => {
        // Clear timeout if mouse leaves before speaking
        if (hoverTimeout) {
          clearTimeout(hoverTimeout);
        }
      };

      // Add listeners to interactive elements
      const elements = document.querySelectorAll('button, a, p, h1, h2, h3, h4, h5, h6, span, div[role="button"], label, input, textarea');
      elements.forEach(el => {
        el.addEventListener('mouseenter', handleMouseEnter as EventListener);
        el.addEventListener('mouseleave', handleMouseLeave);
      });

      return () => {
        if (hoverTimeout) {
          clearTimeout(hoverTimeout);
        }
        elements.forEach(el => {
          el.removeEventListener('mouseenter', handleMouseEnter as EventListener);
          el.removeEventListener('mouseleave', handleMouseLeave);
        });
        window.speechSynthesis.cancel();
      };
    } else {
      window.speechSynthesis.cancel();
    }
  }, [features.textToSpeech, selectedLanguage]);

  // Google Translate integration
  useEffect(() => {
    if (features.translate && selectedLanguage !== 'en') {
      // Remove any existing Google Translate elements
      const existingScript = document.querySelector('script[src*="translate.google.com"]');
      const existingFrame = document.querySelector('iframe.goog-te-banner-frame');
      const existingDiv = document.getElementById('google_translate_element');
      
      if (existingScript) existingScript.remove();
      if (existingFrame) existingFrame.remove();
      if (existingDiv) existingDiv.remove();

      // Create translate element
      const translateDiv = document.createElement('div');
      translateDiv.id = 'google_translate_element';
      translateDiv.style.display = 'none';
      document.body.appendChild(translateDiv);

      // Initialize Google Translate
      (window as any).googleTranslateElementInit = () => {
        new (window as any).google.translate.TranslateElement(
          {
            pageLanguage: 'en',
            includedLanguages: LANGUAGES.map(l => l.code).join(','),
            layout: (window as any).google.translate.TranslateElement.InlineLayout.SIMPLE,
            autoDisplay: false,
          },
          'google_translate_element'
        );
        
        // Wait for the translate element to be ready
        const checkAndTranslate = setInterval(() => {
          const selectElement = document.querySelector('.goog-te-combo') as HTMLSelectElement;
          if (selectElement) {
            clearInterval(checkAndTranslate);
            selectElement.value = selectedLanguage;
            selectElement.dispatchEvent(new Event('change'));
          }
        }, 100);
        
        // Clear interval after 5 seconds if element not found
        setTimeout(() => clearInterval(checkAndTranslate), 5000);
      };

      // Load Google Translate script
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      script.async = true;
      script.onerror = () => {
        console.error('Failed to load Google Translate');
      };
      document.head.appendChild(script);

      return () => {
        // Cleanup
        const scriptToRemove = document.querySelector('script[src*="translate.google.com"]');
        const divToRemove = document.getElementById('google_translate_element');
        if (scriptToRemove) scriptToRemove.remove();
        if (divToRemove) divToRemove.remove();
        delete (window as any).googleTranslateElementInit;
      };
    } else if (selectedLanguage === 'en' || !features.translate) {
      // Reset to English
      const selectElement = document.querySelector('.goog-te-combo') as HTMLSelectElement;
      if (selectElement) {
        selectElement.value = '';
        selectElement.dispatchEvent(new Event('change'));
      }
      
      // Remove translation artifacts
      setTimeout(() => {
        const frames = document.querySelectorAll('iframe.goog-te-banner-frame, iframe.skiptranslate');
        frames.forEach(frame => frame.remove());
        
        const banners = document.querySelectorAll('.goog-te-banner-frame');
        banners.forEach(banner => banner.remove());
        
        // Reset body classes
        document.body.classList.remove('translated-ltr', 'translated-rtl');
        document.documentElement.removeAttribute('class');
      }, 100);
    }
  }, [features.translate, selectedLanguage]);

  const toggleFeature = (feature: keyof typeof features) => {
    setFeatures((prev) => ({ ...prev, [feature]: !prev[feature] }));
  };

  const resetAll = () => {
    setFontSize(0);
    setLineHeight(0);
    setTextSpacing(0);
    setSelectedLanguage('en');
    setShowLanguages(false);
    setFeatures({
      textToSpeech: false,
      highlightLinks: false,
      dyslexiaFont: false,
      hideImages: false,
      largeCursor: false,
      invertColors: false,
      translate: false,
    });
  };

  return (
    <>
      {/* Accessibility Button (Floating) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-all hover:scale-110"
        aria-label="Open accessibility menu"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-6 w-6"
        >
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="8" r="1.5" />
          <path d="M8 14h8" />
          <path d="M12 14v6" />
        </svg>
      </button>

      {/* Accessibility Panel */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 z-50 w-80 max-h-[80vh] overflow-y-auto rounded-xl border bg-background shadow-2xl">
          {/* Header */}
          <div className="sticky top-0 flex items-center justify-between border-b bg-background p-4">
            <h3 className="text-lg font-semibold">Accessibility</h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              aria-label="Close accessibility menu"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Features */}
          <div className="p-4 space-y-3">
            {/* Language Translation */}
            <div className="rounded-lg border p-3">
              <button
                onClick={() => {
                  setShowLanguages(!showLanguages);
                  if (!features.translate) toggleFeature('translate');
                }}
                className="w-full flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🌐</span>
                  <span className="text-sm font-medium">Translate</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {LANGUAGES.find(l => l.code === selectedLanguage)?.native}
                </span>
              </button>
              
              {showLanguages && (
                <div className="mt-3 max-h-48 overflow-y-auto space-y-1">
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setSelectedLanguage(lang.code);
                        if (!features.translate) toggleFeature('translate');
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                        selectedLanguage === lang.code
                          ? 'bg-primary/10 text-primary font-medium'
                          : 'hover:bg-muted'
                      }`}
                    >
                      <span className="font-medium">{lang.native}</span>
                      <span className="text-xs text-muted-foreground ml-2">({lang.name})</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Text to Speech */}
            <button
              onClick={() => toggleFeature('textToSpeech')}
              className={`w-full flex items-center justify-between rounded-lg border p-3 transition-colors ${
                features.textToSpeech ? 'bg-primary/10 border-primary' : 'hover:bg-muted'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">🔊</span>
                <span className="text-sm font-medium">Text To Speech</span>
              </div>
              {features.textToSpeech && <span className="text-primary">✓</span>}
            </button>

            {/* Bigger Text */}
            <div className="rounded-lg border p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🔍</span>
                  <span className="text-sm font-medium">Text Size</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFontSize(Math.max(-2, fontSize - 1))}
                  disabled={fontSize <= -2}
                >
                  A-
                </Button>
                <div className="flex-1 flex justify-center gap-1">
                  {[-2, -1, 0, 1, 2, 3].map((level) => (
                    <span
                      key={level}
                      className={`h-2 w-2 rounded-full ${
                        fontSize >= level ? 'bg-primary' : 'bg-muted'
                      }`}
                    />
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFontSize(Math.min(3, fontSize + 1))}
                  disabled={fontSize >= 3}
                >
                  A+
                </Button>
              </div>
            </div>

            {/* Line Height */}
            <div className="rounded-lg border p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">↕️</span>
                  <span className="text-sm font-medium">Line Height</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLineHeight(Math.max(0, lineHeight - 1))}
                  disabled={lineHeight <= 0}
                >
                  -
                </Button>
                <div className="flex-1 flex justify-center gap-1">
                  {[0, 1, 2, 3].map((level) => (
                    <span
                      key={level}
                      className={`h-2 w-2 rounded-full ${
                        lineHeight >= level ? 'bg-primary' : 'bg-muted'
                      }`}
                    />
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLineHeight(Math.min(3, lineHeight + 1))}
                  disabled={lineHeight >= 3}
                >
                  +
                </Button>
              </div>
            </div>

            {/* Text Spacing */}
            <div className="rounded-lg border p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">↔️</span>
                  <span className="text-sm font-medium">Text Spacing</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setTextSpacing(Math.max(0, textSpacing - 1))}
                  disabled={textSpacing <= 0}
                >
                  -
                </Button>
                <div className="flex-1 flex justify-center gap-1">
                  {[0, 1, 2, 3].map((level) => (
                    <span
                      key={level}
                      className={`h-2 w-2 rounded-full ${
                        textSpacing >= level ? 'bg-primary' : 'bg-muted'
                      }`}
                    />
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setTextSpacing(Math.min(3, textSpacing + 1))}
                  disabled={textSpacing >= 3}
                >
                  +
                </Button>
              </div>
            </div>

            {/* Highlight Links */}
            <button
              onClick={() => toggleFeature('highlightLinks')}
              className={`w-full flex items-center justify-between rounded-lg border p-3 transition-colors ${
                features.highlightLinks ? 'bg-primary/10 border-primary' : 'hover:bg-muted'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">🔗</span>
                <span className="text-sm font-medium">Highlight Links</span>
              </div>
              {features.highlightLinks && <span className="text-primary">✓</span>}
            </button>

            {/* Dyslexia Friendly */}
            <button
              onClick={() => toggleFeature('dyslexiaFont')}
              className={`w-full flex items-center justify-between rounded-lg border p-3 transition-colors ${
                features.dyslexiaFont ? 'bg-primary/10 border-primary' : 'hover:bg-muted'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">📖</span>
                <span className="text-sm font-medium">Dyslexia Friendly</span>
              </div>
              {features.dyslexiaFont && <span className="text-primary">✓</span>}
            </button>

            {/* Hide Images */}
            <button
              onClick={() => toggleFeature('hideImages')}
              className={`w-full flex items-center justify-between rounded-lg border p-3 transition-colors ${
                features.hideImages ? 'bg-primary/10 border-primary' : 'hover:bg-muted'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">🖼️</span>
                <span className="text-sm font-medium">Hide Images</span>
              </div>
              {features.hideImages && <span className="text-primary">✓</span>}
            </button>

            {/* Large Cursor */}
            <button
              onClick={() => toggleFeature('largeCursor')}
              className={`w-full flex items-center justify-between rounded-lg border p-3 transition-colors ${
                features.largeCursor ? 'bg-primary/10 border-primary' : 'hover:bg-muted'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">👆</span>
                <span className="text-sm font-medium">Large Cursor</span>
              </div>
              {features.largeCursor && <span className="text-primary">✓</span>}
            </button>

            {/* Invert Colors */}
            <button
              onClick={() => toggleFeature('invertColors')}
              className={`w-full flex items-center justify-between rounded-lg border p-3 transition-colors ${
                features.invertColors ? 'bg-primary/10 border-primary' : 'hover:bg-muted'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">🎨</span>
                <span className="text-sm font-medium">Invert Colors</span>
              </div>
              {features.invertColors && <span className="text-primary">✓</span>}
            </button>
          </div>

          {/* Footer */}
          
        </div>
      )}
    </>
  );
}
