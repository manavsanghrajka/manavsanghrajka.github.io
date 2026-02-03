'use client';

import { createClient } from '@/lib/supabase/client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { awardXP } from '@/components/DopamineBar';


type Flashcard = {
  id: string;
  front: string;
  back: string;
};

export default function FlashcardsPage() {
  const { planId } = useParams();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [topicId, setTopicId] = useState<string | null>(null);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [finished, setFinished] = useState(false);
  const [xpAwarded, setXpAwarded] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setUser(user);
      
      const searchParams = new URLSearchParams(window.location.search);
      const tid = searchParams.get('topicId');
      if (tid) {
        setTopicId(tid);
        await fetchFlashcards(tid);
      } else {
        setLoading(false);
      }
    };
    init();
  }, []);

  const fetchFlashcards = async (tid: string) => {
    try {
      const res = await fetch(`/api/flashcards?topicId=${tid}`);
      const data = await res.json();
      if (data.flashcards) {
        setFlashcards(data.flashcards);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleResult = async (correct: boolean) => {
    if (!flashcards[currentIndex]) return;
    
    const cardId = flashcards[currentIndex].id;
    
    await fetch('/api/flashcards/result', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ flashcardId: cardId, isCorrect: correct })
    });

    setIsFlipped(false);
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setFinished(true);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-base)' }}>
        <div className="spinner spinner-lg" />
      </div>
    );
  }

  if (!topicId) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-base)' }}>
        <div className="text-center card p-8">
          <h2 className="text-h2 mb-4" style={{ color: 'var(--text-primary)' }}>No Topic Selected</h2>
          <p className="text-body mb-6" style={{ color: 'var(--text-muted)' }}>Please select a topic to study flashcards for.</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="btn btn-primary"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (flashcards.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-base)' }}>
        <div className="text-center card p-8">
          <h2 className="text-h2 mb-4" style={{ color: 'var(--text-primary)' }}>No Flashcards Found</h2>
          <p className="text-body mb-6" style={{ color: 'var(--text-muted)' }}>This topic doesn't have any flashcards yet.</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="btn btn-primary"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (finished) {
    // Award XP when session is complete
    if (!xpAwarded) {
      (async () => {
        const result = await awardXP(10, 'flashcard_set');

        setXpAwarded(true);
      })();
    }

    return (
      <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: 'var(--bg-base)' }}>
        <div className="card p-8 text-center">
          <h2 className="text-h1 mb-4" style={{ color: 'var(--success)' }}>Session Complete!</h2>
          <p className="text-body mb-2" style={{ color: 'var(--accent-light)' }}>+10 XP earned! 🎉</p>
          <p className="text-body mb-6" style={{ color: 'var(--text-muted)' }}>You've reviewed all cards for this topic.</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="btn btn-primary"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const currentCard = flashcards[currentIndex];

  return (
    <div className="min-h-screen flex flex-col items-center py-12" style={{ background: 'var(--bg-base)' }}>
      <div className="w-full max-w-2xl px-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-h2" style={{ color: 'var(--text-primary)' }}>Flashcards</h1>
          <span className="text-small" style={{ color: 'var(--text-muted)' }}>{currentIndex + 1} / {flashcards.length}</span>
        </div>

        {/* Card Container */}
        <div
          className="perspective-1000 h-96 cursor-pointer mb-8 group"
          onClick={() => setIsFlipped(!isFlipped)}
        >
          <div className={`relative w-full h-full transition-transform duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>

            {/* Front */}
            <div 
              className="absolute w-full h-full backface-hidden flex flex-col items-center justify-center p-8"
              style={{ 
                background: 'var(--bg-elevated)', 
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border)'
              }}
            >
              <p className="text-h2 font-medium text-center" style={{ color: 'var(--text-primary)' }}>{currentCard.front}</p>
              <p className="absolute bottom-4 text-caption uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Click to Flip</p>
            </div>

            {/* Back */}
            <div 
              className="absolute w-full h-full backface-hidden rotate-y-180 flex flex-col items-center justify-center p-8"
              style={{ 
                background: 'var(--accent)', 
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--accent-light)'
              }}
            >
              <p className="text-h3 text-center" style={{ color: 'var(--text-primary)' }}>{currentCard.back}</p>
              <p className="absolute bottom-4 text-caption uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Answer</p>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex justify-center gap-6">
          <button
            onClick={(e) => { e.stopPropagation(); handleResult(false); }}
            className="flex-1 max-w-xs py-3 font-semibold transition-colors"
            style={{ 
              background: 'rgba(248, 113, 113, 0.1)',
              border: '1px solid var(--error)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--error)'
            }}
          >
            Incorrect
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleResult(true); }}
            className="flex-1 max-w-xs py-3 font-semibold transition-colors"
            style={{ 
              background: 'rgba(20, 184, 166, 0.1)',
              border: '1px solid var(--success)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--success)'
            }}
          >
            Correct
          </button>
        </div>
      </div>

      <style jsx global>{`
        .perspective-1000 { perspective: 1000px; }
        .transform-style-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
      `}</style>
    </div>
  );
}
