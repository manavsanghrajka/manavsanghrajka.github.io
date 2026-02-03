'use client';

import { createClient } from '@/lib/supabase/client';
import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { awardXP } from '@/components/DopamineBar';


interface StudyContent {
  summary: string;
  keyPoints: string[];
  examples: string[];
}

interface Question {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

interface Flashcard {
  id?: string;
  front: string;
  back: string;
  leitner_box?: number;
  next_review_date?: string;
}

export default function AIStudyPage() {
  const { topicId } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const topicName = searchParams.get('name') || 'Topic';
  const courseName = searchParams.get('course') || 'Course';
  
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'content' | 'flashcards' | 'quiz'>('content');
  
  // Content state
  const [content, setContent] = useState<StudyContent | null>(null);
  const [contentLoading, setContentLoading] = useState(false);
  
  // Flashcards state
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [flashcardsLoading, setFlashcardsLoading] = useState(false);
  const [currentCard, setCurrentCard] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  
  // Quiz state
  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [quizXPAwarded, setQuizXPAwarded] = useState(false);
  const [flashcardsXPAwarded, setFlashcardsXPAwarded] = useState(false);
  const [contentXPAwarded, setContentXPAwarded] = useState(false);
  
  const supabase = createClient();

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setUser(user);
      
      // Try to load stored content from database first
      if (topicId && typeof topicId === 'string') {
        setContentLoading(true);
        try {
          const { data: topic, error } = await supabase
            .from('Topic')
            .select('summary, keyPoints, examples')
            .eq('id', topicId)
            .single();
          
          if (!error && topic && topic.summary) {
            // Content exists in database - use it!
            setContent({
              summary: topic.summary,
              keyPoints: topic.keyPoints || [],
              examples: topic.examples || []
            });
            console.log('Loaded stored content for topic:', topicId);
          } else {
            console.log('No stored content found, will need to generate');
          }
        } catch (err) {
          console.log('Error loading topic content:', err);
        } finally {
          setContentLoading(false);
        }
      }
      
      setLoading(false);
    };
    init();
  }, [topicId]);

  const generateContent = async () => {
    setContentLoading(true);
    try {
      console.log('Generating content for:', topicName, courseName);
      const res = await fetch('/api/ai/study-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topicName, courseName })
      });
      const data = await res.json();
      console.log('API response:', data);
      
      if (!res.ok) {
        alert('Error generating content: ' + (data.error || 'Unknown error'));
        return;
      }
      
      if (data.content) {
        setContent(data.content);
        
        // Award XP for studying content
        if (!contentXPAwarded) {
          const result = await awardXP(50, 'task_complete');

          setContentXPAwarded(true);
          
          // Update streak
          const localDate = new Date().toISOString().split('T')[0];
          await fetch('/api/progress/streak', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ localDate })
          });
        }
      } else {
        alert('No content returned from API');
      }
    } catch (error) {
      console.error('Failed to generate content:', error);
      alert('Failed to generate content: ' + (error as Error).message);
    } finally {
      setContentLoading(false);
    }
  };

  const loadFlashcards = async () => {
    setFlashcardsLoading(true);
    try {
      // 1. Try to fetch existing due flashcards
      const res = await fetch(`/api/flashcards?topicId=${topicId}`);
      const data = await res.json();
      
      if (data.flashcards && data.flashcards.length > 0) {
        setFlashcards(data.flashcards);
      } else {
        // 2. If no persistent cards, generate new ones
        await generateNewFlashcards();
      }
      setCurrentCard(0);
      setIsFlipped(false);
    } catch (error) {
      console.error('Failed to load flashcards:', error);
    } finally {
      setFlashcardsLoading(false);
    }
  };

  const generateNewFlashcards = async () => {
    try {
      const res = await fetch('/api/ai/flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          topicName, 
          courseName, 
          topicId, // Pass topicId to save to DB
          count: 10 
        })
      });
      const data = await res.json();
      
      if (data.saved) {
        // Re-fetch to get IDs
        const savedRes = await fetch(`/api/flashcards?topicId=${topicId}`);
        const savedData = await savedRes.json();
        setFlashcards(savedData.flashcards || data.flashcards);
      } else {
        setFlashcards(data.flashcards);
      }
    } catch (error) {
      console.error('Failed to generate flashcards:', error);
    }
  };

  const handleReview = async (isCorrect: boolean) => {
    const card = flashcards[currentCard];
    
    // Optimistic UI update
    if (card.id) {
      const newBox = isCorrect ? Math.min((card.leitner_box || 1) + 1, 5) : 1;
      const updatedCards = [...flashcards];
      updatedCards[currentCard] = { ...card, leitner_box: newBox };
      setFlashcards(updatedCards);

      // Call API
      fetch('/api/flashcards/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flashcardId: card.id, isCorrect })
      });
    }

    // Award XP
    if (isCorrect) {
       const result = await awardXP(5, 'flashcard_review');

    }

    // Move to next card
    if (currentCard < flashcards.length - 1) {
      setCurrentCard(currentCard + 1);
      setIsFlipped(false);
    } else {
      // Completed set
      if (!flashcardsXPAwarded) {
        await awardXP(10, 'flashcard_set');

        setFlashcardsXPAwarded(true);
      }
      // Loop back or show completion
      setCurrentCard(0);
      setIsFlipped(false);
    }
  };

  const generateQuiz = async () => {
    setQuestionsLoading(true);
    try {
      const res = await fetch('/api/ai/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topicName, courseName, count: 5 })
      });
      const data = await res.json();
      if (data.questions) {
        setQuestions(data.questions);
        setCurrentQuestion(0);
        setSelectedAnswer(null);
        setShowResult(false);
        setScore(0);
      }
    } catch (error) {
      console.error('Failed to generate quiz:', error);
    } finally {
      setQuestionsLoading(false);
    }
  };

  const handleQuizAnswer = () => {
    if (selectedAnswer === null) return;
    
    const isCorrect = selectedAnswer === questions[currentQuestion].correctIndex;
    if (isCorrect) {
      setScore(score + 1);
    }
    setShowResult(true);
  };

  const nextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-base)' }}>
        <div className="spinner spinner-lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
      {/* Header */}
      <nav style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => router.back()}
                className="btn btn-ghost mr-4"
              >
                Back
              </button>
              <div>
                <h1 className="text-h3" style={{ color: 'var(--text-primary)' }}>{topicName}</h1>
                <p className="text-caption" style={{ color: 'var(--text-muted)' }}>{courseName}</p>
              </div>
            </div>
            <div className="flex items-center">
              <span 
                className="text-caption px-2 py-1"
                style={{ 
                  background: 'var(--bg-surface)', 
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--accent-light)'
                }}
              >
                AI-Powered
              </span>
            </div>
          </div>
        </div>
      </nav>

      {/* Tab Navigation */}
      <div className="max-w-4xl mx-auto px-4 mt-6">
        <div className="flex gap-2 p-1" style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)' }}>
          {[
            { key: 'content', label: 'Study Content' },
            { key: 'flashcards', label: 'Flashcards' },
            { key: 'quiz', label: 'Practice Quiz' }
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as 'content' | 'flashcards' | 'quiz')}
              className="flex-1 py-2 px-4 font-medium transition-colors"
              style={{
                background: activeTab === key ? 'var(--accent-light)' : 'transparent',
                color: activeTab === key ? 'var(--text-primary)' : 'var(--text-muted)',
                borderRadius: 'var(--radius-md)'
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <main className="max-w-4xl mx-auto py-6 px-4">
        {/* Study Content Tab */}
        {activeTab === 'content' && (
          <div className="card p-6">
            {!content ? (
              <div className="text-center py-12">
                <div className="mb-4" style={{ color: 'var(--accent-light)' }}>
                  <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h2 className="text-h2 mb-2" style={{ color: 'var(--text-primary)' }}>AI Study Guide</h2>
                <p className="text-body mb-6" style={{ color: 'var(--text-muted)' }}>
                  Get a summary, key points, and examples for this topic.
                </p>
                <button
                  onClick={generateContent}
                  disabled={contentLoading}
                  className="btn btn-primary px-6 py-3"
                >
                  {contentLoading ? (
                    <>
                      <span className="spinner spinner-sm" />
                      Generating...
                    </>
                  ) : (
                    'Generate Study Guide'
                  )}
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <h3 className="text-h3 mb-3" style={{ color: 'var(--text-primary)' }}>Summary</h3>
                  <p className="text-body" style={{ color: 'var(--text-secondary)' }}>{content.summary}</p>
                </div>
                
                <div>
                  <h3 className="text-h3 mb-3" style={{ color: 'var(--text-primary)' }}>Key Points</h3>
                  <ul className="space-y-2">
                    {content.keyPoints.map((point, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <span 
                          className="w-6 h-6 rounded-full flex items-center justify-center text-caption flex-shrink-0"
                          style={{ background: 'var(--accent-light)', color: 'var(--text-primary)' }}
                        >
                          {i + 1}
                        </span>
                        <span className="text-body" style={{ color: 'var(--text-secondary)' }}>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-h3 mb-3" style={{ color: 'var(--text-primary)' }}>Examples</h3>
                  <div className="space-y-3">
                    {content.examples.map((example, i) => (
                      <div 
                        key={i} 
                        className="p-4" 
                        style={{ 
                          background: 'var(--bg-surface)', 
                          borderRadius: 'var(--radius-md)',
                          borderLeft: '3px solid var(--accent-light)'
                        }}
                      >
                        <p className="text-body" style={{ color: 'var(--text-secondary)' }}>{example}</p>
                      </div>
                    ))}
                  </div>
                </div>
                
                <button
                  onClick={generateContent}
                  disabled={contentLoading}
                  className="btn btn-ghost"
                >
                  {contentLoading ? 'Regenerating...' : 'Regenerate'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Flashcards Tab */}
        {activeTab === 'flashcards' && (
          <div className="card p-6">
            {flashcards.length === 0 ? (
              <div className="text-center py-12">
                <div className="mb-4" style={{ color: 'var(--accent-light)' }}>
                  <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h2 className="text-h2 mb-2" style={{ color: 'var(--text-primary)' }}>AI Flashcards</h2>
                <p className="text-body mb-6" style={{ color: 'var(--text-muted)' }}>
                  Create flashcards to test your knowledge.
                </p>
                <button
                  onClick={loadFlashcards}
                  disabled={flashcardsLoading}
                  className="btn btn-primary px-6 py-3"
                >
                  {flashcardsLoading ? (
                    <>
                      <span className="spinner spinner-sm" />
                      Generating...
                    </>
                  ) : (
                    'Generate Flashcards'
                  )}
                </button>
              </div>
            ) : (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-small" style={{ color: 'var(--text-muted)' }}>
                    Card {currentCard + 1} of {flashcards.length}
                  </span>
                  
                  {/* Leitner Box Indicator */}
                  {flashcards[currentCard].leitner_box && (
                    <div className="flex items-center gap-2">
                       <span className="text-caption uppercase" style={{ color: 'var(--text-dim)' }}>
                         Box {flashcards[currentCard].leitner_box}/5
                       </span>
                       <div className="flex gap-1">
                         {[1,2,3,4,5].map(b => (
                           <div 
                             key={b}
                             className="w-2 h-2 rounded-full"
                             style={{ 
                               background: b <= (flashcards[currentCard].leitner_box || 1) 
                                 ? 'var(--accent)' 
                                 : 'var(--border)' 
                             }}
                           />
                         ))}
                       </div>
                    </div>
                  )}

                  <button
                    onClick={generateNewFlashcards}
                    disabled={flashcardsLoading}
                    className="btn btn-ghost text-small"
                  >
                    Add More
                  </button>
                </div>
                
                {/* Flashcard */}
                <div
                  onClick={() => setIsFlipped(!isFlipped)}
                  className="cursor-pointer h-64 mb-6 perspective-1000"
                >
                  <div 
                    className="w-full h-full p-8 flex items-center justify-center text-center transition-all duration-300 transform preserve-3d"
                    style={{
                      background: isFlipped ? 'var(--bg-surface)' : 'var(--bg-elevated)',
                      border: `1px solid ${isFlipped ? 'var(--accent)' : 'var(--border)'}`,
                      borderRadius: 'var(--radius-lg)',
                      transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                      position: 'relative'
                    }}
                  >
                    {/* Front */}
                    <div 
                      className="absolute inset-0 flex items-center justify-center p-6 backface-hidden"
                      style={{ backfaceVisibility: 'hidden' }}
                    >
                      <div>
                        <p className="text-h3" style={{ color: 'var(--text-primary)' }}>
                          {flashcards[currentCard].front}
                        </p>
                        <p className="text-caption mt-4 blink" style={{ color: 'var(--accent-light)' }}>
                          [ CLICK TO REVEAL ]
                        </p>
                      </div>
                    </div>

                    {/* Back */}
                    <div 
                      className="absolute inset-0 flex items-center justify-center p-6 backface-hidden"
                      style={{ 
                        backfaceVisibility: 'hidden', 
                        transform: 'rotateY(180deg)' 
                      }}
                    >
                      <div>
                        <p className="text-h3" style={{ color: 'var(--text-primary)' }}>
                          {flashcards[currentCard].back}
                        </p>
                        <p className="text-caption mt-4" style={{ color: 'var(--text-muted)' }}>
                          Did you get it right?
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Review Controls (Leitner) */}
                {isFlipped ? (
                   <div className="flex justify-center gap-4 animate-fadeIn">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleReview(false); }}
                      className="btn btn-error w-32"
                    >
                      Forgot It
                      <div className="text-xxs opacity-70">RESET TO BOX 1</div>
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleReview(true); }}
                      className="btn btn-success w-32"
                    >
                      Got It
                      <div className="text-xxs opacity-70">promote to next box</div>
                    </button>
                   </div>
                ) : (
                   <div className="text-center text-caption" style={{ color: 'var(--text-dim)' }}>
                     Tap card to reveal answer
                   </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Quiz Tab */}
        {activeTab === 'quiz' && (
          <div className="card p-6">
            {questions.length === 0 ? (
              <div className="text-center py-12">
                <div className="mb-4" style={{ color: 'var(--accent-light)' }}>
                  <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                </div>
                <h2 className="text-h2 mb-2" style={{ color: 'var(--text-primary)' }}>Practice Quiz</h2>
                <p className="text-body mb-6" style={{ color: 'var(--text-muted)' }}>
                  Test your understanding with multiple-choice questions.
                </p>
                <button
                  onClick={generateQuiz}
                  disabled={questionsLoading}
                  className="btn btn-primary px-6 py-3"
                >
                  {questionsLoading ? (
                    <>
                      <span className="spinner spinner-sm" />
                      Generating...
                    </>
                  ) : (
                    'Start Quiz'
                  )}
                </button>
              </div>
            ) : currentQuestion >= questions.length ? (
              <div className="text-center py-12">
                <h2 className="text-h2 mb-2" style={{ color: 'var(--text-primary)' }}>Quiz Complete!</h2>
                <p className="text-display font-bold mb-4" style={{ color: 'var(--accent-light)' }}>
                  {score} / {questions.length}
                </p>
                <p className="text-body mb-6" style={{ color: 'var(--text-muted)' }}>
                  {score === questions.length ? 'Perfect! +100 XP bonus!' : score >= questions.length * 0.8 ? 'Great job!' : 'Keep practicing!'}
                </p>
                {/* Award XP on quiz complete */}
                {!quizXPAwarded && (() => {
                  (async () => {
                    if (score === questions.length) {
                      const result = await awardXP(100, 'perfect_quiz');

                    }
                    setQuizXPAwarded(true);
                  })();
                  return null;
                })()}
                <button
                  onClick={() => {
                    setQuizXPAwarded(false);
                    generateQuiz();
                  }}
                  disabled={questionsLoading}
                  className="btn btn-primary px-6 py-3"
                >
                  Try Another Quiz
                </button>
              </div>
            ) : (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-small" style={{ color: 'var(--text-muted)' }}>
                    Question {currentQuestion + 1} of {questions.length}
                  </span>
                  <span className="text-small" style={{ color: 'var(--accent-light)' }}>Score: {score}</span>
                </div>
                
                <h3 className="text-h3 mb-6" style={{ color: 'var(--text-primary)' }}>
                  {questions[currentQuestion].question}
                </h3>
                
                <div className="space-y-3 mb-6">
                  {questions[currentQuestion].options.map((option, i) => (
                    <button
                      key={i}
                      onClick={() => !showResult && setSelectedAnswer(i)}
                      disabled={showResult}
                      className="w-full text-left p-4 transition-all"
                      style={{
                        background: showResult 
                          ? i === questions[currentQuestion].correctIndex
                            ? 'rgba(20, 184, 166, 0.2)'
                            : i === selectedAnswer
                              ? 'rgba(248, 113, 113, 0.2)'
                              : 'var(--bg-surface)'
                          : selectedAnswer === i
                            ? 'var(--accent)'
                            : 'var(--bg-surface)',
                        border: `1px solid ${showResult 
                          ? i === questions[currentQuestion].correctIndex
                            ? 'var(--success)'
                            : i === selectedAnswer
                              ? 'var(--error)'
                              : 'var(--border)'
                          : selectedAnswer === i
                            ? 'var(--accent-light)'
                            : 'var(--border)'}`,
                        borderRadius: 'var(--radius-md)',
                        color: 'var(--text-primary)'
                      }}
                    >
                      <span className="font-medium mr-2">{String.fromCharCode(65 + i)}.</span>
                      {option}
                    </button>
                  ))}
                </div>
                
                {showResult && (
                  <div 
                    className="p-4 mb-6" 
                    style={{ 
                      background: 'var(--bg-surface)', 
                      borderRadius: 'var(--radius-md)' 
                    }}
                  >
                    <p className="text-body" style={{ color: 'var(--text-secondary)' }}>
                      <strong>Explanation:</strong> {questions[currentQuestion].explanation}
                    </p>
                  </div>
                )}
                
                <div className="flex justify-end">
                  {!showResult ? (
                    <button
                      onClick={handleQuizAnswer}
                      disabled={selectedAnswer === null}
                      className="btn btn-primary"
                    >
                      Check Answer
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        if (currentQuestion < questions.length - 1) {
                          nextQuestion();
                        } else {
                          setCurrentQuestion(questions.length);
                        }
                      }}
                      className="btn btn-primary"
                    >
                      {currentQuestion < questions.length - 1 ? 'Next Question' : 'See Results'}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
