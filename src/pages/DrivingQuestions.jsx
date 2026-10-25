import { useState } from 'react';

const projects = [
  {
    id: 1,
    title: 'A Servo Butterfly',
    questions: [
      {
        initial: 'How does a servo butterfly work?',
        critique:
          'Too broad, descriptive, and lacks a specific physics or engineering focus.',
        revised:
          'How do the rotational torque and pulse-width modulation (PWM) signals of a servo motor control the angular displacement and flapping frequency of a mechanical butterfly wing?',
      },
      {
        initial: 'Why do butterflies fly?',
        critique:
          'Too vague and leans heavily into biology rather than physical and mechanical investigation.',
        revised:
          'How do the fluid dynamics, kinematics, and aspect ratio of butterfly wings generate aerodynamic lift and thrust during flight?',
      },
      {
        initial: 'Can we build a robot butterfly?',
        critique:
          'Yes/No question; lacks open-ended depth, measurability, and experimental potential.',
        revised:
          "How does varying the wing membrane's surface area and material flexibility affect the aerodynamic efficiency of a servo-driven biomimetic flapping mechanism?",
      },
      {
        initial: 'How do drones help the environment?',
        critique:
          'Completely unrelated to the specific mechanics of the project; far too broad.',
        revised:
          'How can biomimetic flapping-wing micro-air vehicles (MAVs) reduce noise pollution and ecological disturbance compared to traditional rotor-based drones in environmental monitoring?',
      },
    ],
  },
  {
    id: 2,
    title: 'An Automatic Aiming Trebuchet',
    questions: [
      {
        initial: 'How does a trebuchet work?',
        critique:
          'Too broad and textbook-based; can easily be answered via a quick web search without experimentation.',
        revised:
          'How do the counterweight mass and sling-to-arm ratio affect the conservation of gravitational potential energy into kinetic energy during a trebuchet launch?',
      },
      {
        initial: 'How do you make a trebuchet accurate?',
        critique:
          'Lacks specific measurement parameters, variables, and scientific depth.',
        revised:
          'How do variations in the projectile release angle and initial velocity influence the horizontal range and landing precision of a trebuchet?',
      },
      {
        initial: 'Can you automate a trebuchet?',
        critique:
          'Too simple (operational query), lacking a core physics investigation.',
        revised:
          'How can an electronic microcontroller and sensor feedback loop dynamically adjust the launch parameters to compensate for target distance and environmental resistance?',
      },
      {
        initial: 'Why were trebuchets used in history?',
        critique:
          'Historical focus rather than a physics-based inquiry or a modern societal technology assessment.',
        revised:
          'How did the mechanical efficiency and kinetic energy output of ancient siege engines shape the structural evolution of defensive fortifications and societal architecture?',
      },
    ],
  },
  {
    id: 3,
    title: 'A Coil Gun',
    questions: [
      {
        initial: 'What is a coil gun?',
        critique:
          'Merely definitional and factual; lacks a testable scientific problem or open-ended exploration.',
        revised:
          'How does the number of coil turns and current intensity affect the strength of the electromagnetic field generated inside a solenoid?',
      },
      {
        initial: 'How does a coil gun shoot metal?',
        critique:
          'Vague phrasing; misses key measurable physical variables like energy storage and force.',
        revised:
          'How does the voltage stored in a capacitor bank influence the magnetic induction force and final muzzle velocity of a ferromagnetic projectile?',
      },
      {
        initial: 'Are coil guns dangerous?',
        critique:
          'Safety-oriented query rather than a rigorous physics or engineering analysis.',
        revised:
          'What are the energy loss mechanisms, such as eddy currents and resistive heating, that limit the overall electrical-to-kinetic energy conversion efficiency of a coil gun?',
      },
      {
        initial: 'Will coil guns replace gunpowder?',
        critique:
          'Speculative and superficial without quantitative backing or structural technological assessment.',
        revised:
          'What are the technical, economic, and safety feasibility challenges of scaling electromagnetic launch systems for aerospace propulsion and modern transit?',
      },
    ],
  },
];

const DrivingQuestions = () => {
  const [expandedProject, setExpandedProject] = useState(1);

  const toggleProject = (id) => {
    setExpandedProject(expandedProject === id ? null : id);
  };

  return (
    <main className="flex-grow flex flex-col items-center justify-start py-16 px-6">
      <h1 className="text-2xl md:text-3xl font-bold text-ink uppercase tracking-terminal mb-12 text-center">
        [ DRIVING QUESTIONS ]
      </h1>

      <div className="max-w-3xl w-full space-y-12">
        {projects.map((project) => (
          <article key={project.id} className="border border-structure">
            {/* Project Header */}
            <button
              onClick={() => toggleProject(project.id)}
              className="w-full flex items-center justify-between p-6 hover:bg-ink hover:text-invert transition-none group text-left"
            >
              <div>
                <span className="text-xs uppercase tracking-terminal text-ink/50 group-hover:text-invert/50 block mb-1">
                  [ PROJECT {project.id} ]
                </span>
                <h2 className="text-lg font-bold uppercase tracking-terminal text-ink group-hover:text-invert">
                  {project.title}
                </h2>
              </div>
              <span className="text-sm font-semibold uppercase tracking-terminal text-ink group-hover:text-invert shrink-0 ml-4">
                {expandedProject === project.id ? '[ − ]' : '[ + ]'}
              </span>
            </button>

            {/* Expanded Table */}
            {expandedProject === project.id && (
              <div className="border-t border-dotted border-structure">
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead>
                      <tr className="border-b border-dotted border-structure">
                        <th className="p-4 text-xs uppercase tracking-terminal text-ink/50 font-semibold w-1/4">
                          Initial Question
                        </th>
                        <th className="p-4 text-xs uppercase tracking-terminal text-ink/50 font-semibold w-1/4 border-l border-dotted border-structure">
                          Critique of It
                        </th>
                        <th className="p-4 text-xs uppercase tracking-terminal text-ink/50 font-semibold w-1/2 border-l border-dotted border-structure">
                          Revised Driving Question
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {project.questions.map((q, idx) => (
                        <tr
                          key={idx}
                          className={
                            idx > 0
                              ? 'border-t border-dotted border-structure'
                              : ''
                          }
                        >
                          <td className="p-4 text-ink/70 leading-relaxed align-top">
                            {q.initial}
                          </td>
                          <td className="p-4 text-ink/70 leading-relaxed align-top border-l border-dotted border-structure italic">
                            {q.critique}
                          </td>
                          <td className="p-4 text-ink leading-relaxed align-top border-l border-dotted border-structure font-medium">
                            {q.revised}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden">
                  {project.questions.map((q, idx) => (
                    <div
                      key={idx}
                      className={
                        idx > 0
                          ? 'border-t border-dotted border-structure'
                          : ''
                      }
                    >
                      <div className="p-6 space-y-4">
                        <div>
                          <span className="text-xs uppercase tracking-terminal text-ink/50 block mb-2">
                            [ INITIAL QUESTION ]
                          </span>
                          <p className="text-sm text-ink/70 leading-relaxed">
                            {q.initial}
                          </p>
                        </div>
                        <div>
                          <span className="text-xs uppercase tracking-terminal text-ink/50 block mb-2">
                            [ CRITIQUE ]
                          </span>
                          <p className="text-sm text-ink/70 leading-relaxed italic">
                            {q.critique}
                          </p>
                        </div>
                        <div>
                          <span className="text-xs uppercase tracking-terminal text-ink/50 block mb-2">
                            [ REVISED DRIVING QUESTION ]
                          </span>
                          <p className="text-sm text-ink leading-relaxed font-medium">
                            {q.revised}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </article>
        ))}
      </div>
    </main>
  );
};

export default DrivingQuestions;
