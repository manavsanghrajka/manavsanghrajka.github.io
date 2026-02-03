import Link from 'next/link';

export default function HomePage() {
  return (
    <div 
      className="min-h-screen"
      style={{ background: 'var(--bg-base)' }}
    >
      {/* Header - Terminal Style */}
      <header 
        className="relative z-10"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <nav className="max-w-6xl mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            <div style={{ color: 'var(--text-primary)', fontFamily: "'JetBrains Mono', monospace", fontSize: '14px' }}>
              HYPERLAPSE v1.0
            </div>
            <div className="flex items-center gap-4">
              <Link 
                href="/login" 
                className="btn btn-ghost"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                [ LOGIN ]
              </Link>
              <Link 
                href="/register" 
                className="btn btn-primary"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                REGISTER
              </Link>
            </div>
          </div>
        </nav>
        {/* Double line separator */}
        <div style={{ borderTop: '3px double var(--border)' }} />
      </header>

      {/* Hero - Terminal Output */}
      <main className="relative z-10 max-w-4xl mx-auto px-6 pt-16 pb-24">
        <div className="text-center mx-auto">
          {/* Terminal prompt style */}
          <p 
            className="mb-4"
            style={{ 
              color: 'var(--text-dim)', 
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '12px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}
          >
            {'>'} SYSTEM.INIT
          </p>
          
          <h1 
            className="mb-6"
            style={{ 
              color: 'var(--text-primary)',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '24px',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              lineHeight: '1.3'
            }}
          >
            MASTER ANY SUBJECT WITH<br />
            <span style={{ borderBottom: '1px solid var(--text-primary)' }}>
              AI-POWERED LEARNING_
            </span>
          </h1>
          
          <p 
            className="mb-8"
            style={{ 
              color: 'var(--text-secondary)', 
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '14px',
              lineHeight: '1.8',
              maxWidth: '600px'
            }}
          >
            Hyperlapse uses adaptive scheduling and real-time AI tutoring 
            to help you learn faster and retain more.
          </p>

          <div className="flex items-center gap-4 mb-16">
            <Link 
              href="/register" 
              className="btn btn-primary"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              [ START LEARNING ]
            </Link>
            <Link 
              href="/login" 
              className="btn btn-outline"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              [ SIGN IN ]
            </Link>
          </div>

          {/* Dotted Divider */}
          <div 
            className="mb-12"
            style={{ borderTop: '1px dotted var(--border)' }}
          />

          {/* Feature Cards - Wireframe Panels */}
          <div className="grid md:grid-cols-3 gap-6">
            <div 
              className="p-4"
              style={{ border: '1px solid var(--border)' }}
            >
              <div 
                className="mb-3"
                style={{ 
                  color: 'var(--text-dim)',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '12px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}
              >
                [ 01 ]
              </div>
              <h3 
                className="mb-2"
                style={{ 
                  color: 'var(--text-primary)',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '14px',
                  fontWeight: '600',
                  textTransform: 'uppercase'
                }}
              >
                ADAPTIVE LEARNING
              </h3>
              <p 
                style={{ 
                  color: 'var(--text-secondary)',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '12px',
                  lineHeight: '1.6'
                }}
              >
                Intelligent scheduling based on spaced repetition science.
              </p>
            </div>

            <div 
              className="p-4"
              style={{ border: '1px solid var(--border)' }}
            >
              <div 
                className="mb-3"
                style={{ 
                  color: 'var(--text-dim)',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '12px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}
              >
                [ 02 ]
              </div>
              <h3 
                className="mb-2"
                style={{ 
                  color: 'var(--text-primary)',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '14px',
                  fontWeight: '600',
                  textTransform: 'uppercase'
                }}
              >
                AI TUTOR
              </h3>
              <p 
                style={{ 
                  color: 'var(--text-secondary)',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '12px',
                  lineHeight: '1.6'
                }}
              >
                Personalized explanations and flashcards via advanced AI.
              </p>
            </div>

            <div 
              className="p-4"
              style={{ border: '1px solid var(--border)' }}
            >
              <div 
                className="mb-3"
                style={{ 
                  color: 'var(--text-dim)',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '12px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}
              >
                [ 03 ]
              </div>
              <h3 
                className="mb-2"
                style={{ 
                  color: 'var(--text-primary)',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '14px',
                  fontWeight: '600',
                  textTransform: 'uppercase'
                }}
              >
                PROGRESS ANALYTICS
              </h3>
              <p 
                style={{ 
                  color: 'var(--text-secondary)',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '12px',
                  lineHeight: '1.6'
                }}
              >
                Track mastery levels and study streaks with data.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer - Terminal Style */}
      <footer 
        className="relative z-10 py-6"
        style={{ borderTop: '1px solid var(--border)' }}
      >
        <div className="max-w-6xl mx-auto px-6">
          <p 
            style={{ 
              color: 'var(--text-dim)',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '12px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}
          >
            {'>'} HYPERLAPSE // LEARN SMARTER NOT HARDER
          </p>
        </div>
      </footer>
    </div>
  );
}
