import React from 'react';

const timelineEvents = [
  {
    id: 1,
    date: 'OCTOBER 6, 2026',
    title: 'Blog Post 1: Passions & Project Introduction',
    description:
      'Publish the first blog post outlining your personal interest in physics, electromagnetism, and the initial concept for the energy conversion project.',
    phase: 'PHASE 01',
  },
  {
    id: 2,
    date: 'OCTOBER 20, 2026',
    title: 'Blog Post 2: Driving Questions',
    description:
      'Publish the finalized driving question focusing on electrical-to-kinetic energy conversion, material properties, and coil configurations.',
    phase: 'PHASE 02',
  },
  {
    id: 3,
    date: 'NOVEMBER 10, 2026',
    title: 'Research Initiation',
    description:
      'Begin research on capacitor discharge, magnetic permeability, and electrical-to-kinetic energy formulas.',
    phase: 'PHASE 03',
  },
  {
    id: 4,
    date: 'NOVEMBER 24, 2026',
    title: 'Project Design Completion',
    description:
      'Finalize all schematics and plans for the multi-coil system. Determine the timing mechanisms (like optical gates), select the varying projectile materials to test, and finalize the parts list for procurement.',
    phase: 'PHASE 04',
  },
  {
    id: 5,
    date: 'DECEMBER 2, 2026',
    title: 'Construction & Prototyping',
    description:
      'Assemble the coil system, charging/firing circuits, and velocity measurement tools. Ensure all safety protocols are active before beginning any live tests.',
    phase: 'PHASE 05',
  },
  {
    id: 6,
    date: 'DECEMBER 9, 2026',
    title: 'Experimentation & Data Collection',
    description:
      'Conduct structured test firings. Measure the input electrical energy versus output kinetic energy while isolating your two variables: different projectile materials and the active number of acceleration coils.',
    phase: 'PHASE 06',
  },
  {
    id: 7,
    date: 'DECEMBER 14, 2026',
    title: 'Data Analysis & Content Drafting',
    description:
      'Crunch the testing numbers to calculate overall efficiency percentages. Begin generating charts, writing conclusions, and formatting the documentation for your portfolio.',
    phase: 'PHASE 07',
  },
  {
    id: 8,
    date: 'DECEMBER 18, 2026',
    title: 'Website Completion',
    description:
      'Finalize and publish all project documentation, data visualizations, build logs, and final conclusions to the project website.',
    phase: 'PHASE 08',
  },
  {
    id: 9,
    date: 'DECEMBER 27, 2026',
    title: 'Peer Review & Buffer Week',
    description:
      'Use the holiday break to make any last minute changes or tweaks.',
    phase: 'PHASE 09',
  },
  {
    id: 10,
    date: 'JANUARY 4, 2027',
    title: 'Final Due Date',
    description: 'Submit the completed project and website.',
    phase: 'FINAL SUBMISSION',
  },
];

const Timeline = () => {
  return (
    <main className="flex-grow flex flex-col items-center justify-start py-16 px-6">
      <p className="text-xs uppercase tracking-terminal text-ink/50 mb-3 text-center">
        [ PROJECT ROADMAP ]
      </p>

      <h1 className="text-2xl md:text-3xl font-bold text-ink uppercase tracking-terminal mb-12 text-center">
        [ TIMELINE ]
      </h1>

      <div className="max-w-3xl w-full">
        <div className="relative border-l border-dotted border-structure ml-3 sm:ml-6 space-y-8 pb-4">
          {timelineEvents.map((event) => (
            <div key={event.id} className="relative pl-6 sm:pl-8 group">
              {/* Node Marker */}
              <div className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 bg-canvas border border-ink group-hover:bg-highlight group-hover:border-highlight transition-none" />

              {/* Event Card */}
              <article className="border border-structure p-6 bg-canvas hover:border-ink transition-none">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <span className="text-xs uppercase tracking-terminal font-bold text-ink">
                    [ {event.date} ]
                  </span>
                  <span className="text-[11px] uppercase tracking-terminal text-ink/50">
                    [ {event.phase} ]
                  </span>
                </div>

                <h2 className="text-base sm:text-lg font-bold uppercase tracking-terminal text-ink mb-3">
                  {event.title}
                </h2>

                <div className="border-t border-dotted border-structure mb-3"></div>

                <p className="text-sm text-ink/80 leading-relaxed">
                  {event.description}
                </p>
              </article>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
};

export default Timeline;
