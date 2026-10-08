import { useState } from 'react';

const blogEntries = [
  {
    id: 1,
    title: 'My Passions',
    date: 'OCTOBER 6, 2026',
    sections: [
      {
        heading: 'Film Photography',
        tag: 'OPTICS',
        content: [
          'A passion I have is film photography. I first got interested in it after my chemistry summative about how the chemical reaction in film cameras work. I now own a film camera and plan to make one myself for this Physics Passion Project. Outside of film photography, I also enjoy digital photography, and take lots of photos of daily life and special moments.',
        ],
      },
      {
        heading: 'Trebuchet',
        tag: 'MECHANICS',
        content: [
          'I enjoy learning lots about history, specifically the Middle ages and Renaissance periods. I particularly enjoy learning about war. Something I am learning about right now is the Siege of Stirling Castle during the Scottish War of Independence. During this siege the largest trebuchet ever built, called the Warwolf Trebuchet, was used. I plan to make a scaled down replica of the Warwolf Trebuchet for my Physics Passion Project.',
        ],
      },
      {
        heading: 'Tuned Mass Damper',
        tag: 'DYNAMICS',
        content: [
          'Recently, I have gotten very interested in architecture and skyscrapers. A common problem that skyscrapers face is high wind loads and earthquake risks. For example, the CN tower uses an over 700 ton tuned mass damper primarily to combat winds. For my Physics Passion Project, I plan to make a tower with a tuned mass damper, and one without, allowing me to display the effect that it has on winds.',
        ],
      },
      {
        heading: 'Servo Butterfly',
        tag: 'ROBOTICS',
        content: [
          'I am the Director of Governance and Operations for the robotics team at the school, and am in my 4th year on the team. Naturally, with this, I am very interested in robotics. On Instagram Reels, I saw someone who made a butterfly, and its wings flapped using servo motors. I thought this was very cool, and thought I could make it for my Physics Passion Project.',
        ],
      },
    ],
  },
];

const Blog = () => {
  const [expandedEntry, setExpandedEntry] = useState(1);

  const toggleEntry = (id) => {
    setExpandedEntry(expandedEntry === id ? null : id);
  };

  return (
    <main className="flex-grow flex flex-col items-center justify-start py-16 px-6">
      <h1 className="text-2xl md:text-3xl font-bold text-ink uppercase tracking-terminal mb-12 text-center">
        [ BLOG ]
      </h1>

      <div className="max-w-3xl w-full space-y-12">
        {blogEntries.map((entry) => (
          <article key={entry.id} className="border border-structure">
            {/* Entry Header */}
            <button
              onClick={() => toggleEntry(entry.id)}
              className="w-full flex items-center justify-between p-6 hover:bg-ink hover:text-invert transition-none group text-left"
            >
              <div>
                <span className="text-xs uppercase tracking-terminal text-ink/50 group-hover:text-invert/50 block mb-1">
                  [ {entry.date} ]
                </span>
                <h2 className="text-lg font-bold uppercase tracking-terminal text-ink group-hover:text-invert">
                  {entry.title}
                </h2>
              </div>
              <span className="text-sm font-semibold uppercase tracking-terminal text-ink group-hover:text-invert shrink-0 ml-4">
                {expandedEntry === entry.id ? '[ − ]' : '[ + ]'}
              </span>
            </button>

            {/* Expanded Content */}
            {expandedEntry === entry.id && (
              <div className="border-t border-dotted border-structure">
                {entry.sections.map((section, idx) => (
                  <div key={idx} className={idx > 0 ? 'border-t border-dotted border-structure' : ''}>
                    <div className="p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <span className="text-xs uppercase tracking-terminal text-ink/50">
                          [ {section.tag} ]
                        </span>
                        <div className="flex-grow border-t border-dotted border-structure"></div>
                      </div>
                      <h3 className="text-base font-bold uppercase tracking-terminal text-ink mb-4">
                        {section.heading}
                      </h3>
                      <div className="space-y-4">
                        {section.content.map((paragraph, pIdx) => (
                          <p
                            key={pIdx}
                            className="text-sm text-ink/70 leading-relaxed"
                          >
                            {paragraph}
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </article>
        ))}
      </div>
    </main>
  );
};

export default Blog;
