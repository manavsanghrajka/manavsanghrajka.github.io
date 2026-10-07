import { useState } from 'react';

const blogEntries = [
  {
    id: 1,
    title: 'Passions & Physics',
    date: 'OCTOBER 6, 2026',
    sections: [
      {
        heading: 'Film Photography',
        tag: 'OPTICS',
        content: [
          'Film photography is, at its core, an exercise in optics and photochemistry. When you press the shutter, light passes through a glass lens that refracts incoming rays, bending them according to Snell\'s Law (n₁ sin θ₁ = n₂ sin θ₂) to converge at a focal point on the film plane.',
          'The lens system uses convex elements to produce a real, inverted image on the film. The focal length of the lens determines magnification and field of view — a shorter focal length captures a wider scene, while a longer one magnifies distant subjects. The thin lens equation, 1/f = 1/dₒ + 1/dᵢ, relates the focal length (f), object distance (dₒ), and image distance (dᵢ), and is what governs how focus works.',
          'Aperture controls how much light enters the camera by adjusting the diameter of the opening. A wider aperture (lower f-number) lets in more light but decreases the depth of field, meaning only a narrow range of distances will appear sharp. This is because a larger aperture allows light rays to enter at steeper angles, increasing the circle of confusion for out-of-focus points.',
          'Shutter speed determines how long the film is exposed to light. A fast shutter speed freezes motion but allows less total light; a slow shutter speed gathers more light but can introduce motion blur. The film itself is coated in silver halide crystals — when photons strike these crystals, they transfer energy and cause a chemical change that creates a latent image, which is then developed in a darkroom.',
          'Film grain is a direct result of the size of these silver halide crystals. Higher ISO (more sensitive) film has larger crystals that react to fewer photons, producing visible grain. Lower ISO film has finer crystals, yielding smoother images but requiring more light — a fundamental trade-off between sensitivity and resolution.',
        ],
      },
      {
        heading: 'Tuned Mass Damper',
        tag: 'DYNAMICS',
        content: [
          'A tuned mass damper (TMD) is a device mounted in structures — typically skyscrapers and bridges — to reduce the amplitude of mechanical vibrations. It works by exploiting the physics of resonance and energy transfer between coupled oscillators.',
          'Every structure has natural frequencies at which it vibrates most readily. When an external force (wind, earthquakes, foot traffic) drives the structure at or near one of these natural frequencies, resonance occurs and the oscillations can grow dangerously large. The equation of motion for a simple harmonic oscillator is F = -kx, where the restoring force is proportional to displacement, and the natural frequency is given by ω₀ = √(k/m).',
          'A TMD is essentially a secondary mass-spring-damper system attached to the primary structure. Its natural frequency is "tuned" to match the problematic frequency of the building. When the building begins to sway, kinetic energy transfers from the structure into the TMD, which oscillates out of phase — meaning it moves in the opposite direction to the building\'s motion.',
          'This phase opposition is the key mechanism: the TMD applies a counteracting inertial force that reduces the net amplitude of the primary structure\'s oscillation. The energy absorbed by the TMD is then dissipated as heat through viscous dampers or friction mechanisms. Mathematically, this is modeled as a two-degree-of-freedom system where the secondary mass shifts the effective resonance peak and introduces beneficial damping.',
          'One of the most famous examples is Taipei 101\'s 730-tonne steel pendulum, suspended near the top of the tower. During typhoons, the pendulum swings to counteract the building\'s sway, reducing peak displacement by up to 40%. The engineering elegance of this concept is that a relatively small mass (compared to the building) can dramatically improve structural safety and occupant comfort.',
        ],
      },
      {
        heading: 'Trebuchet',
        tag: 'MECHANICS',
        content: [
          'A trebuchet is a siege engine that converts gravitational potential energy into kinetic energy to launch projectiles over long distances. Unlike a catapult, which stores energy in tension or torsion, a trebuchet uses a heavy counterweight and the principle of torque around a pivot.',
          'The core physics is rotational mechanics. The trebuchet arm is a lever pivoting around a fulcrum. The counterweight, with mass M, hangs on the short arm (distance r₁ from the pivot), while the projectile, with mass m, sits in a sling at the end of the long arm (distance r₂ from the pivot). When released, the torque due to the counterweight (τ = Mgr₁) causes angular acceleration of the arm according to τ = Iα, where I is the moment of inertia of the entire system.',
          'As the counterweight falls, gravitational potential energy (E = Mgh, where h is the drop height) is converted into rotational kinetic energy of the arm and translational kinetic energy of the projectile. The mechanical advantage comes from the lever ratio — because r₂ >> r₁, the tip of the long arm moves much faster than the counterweight drops, amplifying the velocity imparted to the projectile.',
          'The sling adds another layer of physics. As the arm rotates, the sling extends outward, effectively lengthening the throwing arm and further increasing the tip speed. At the optimal release angle, the sling releases the projectile, which then follows a parabolic trajectory governed by projectile motion equations: x = v₀ cos(θ) · t and y = v₀ sin(θ) · t − ½gt².',
          'The optimal release angle for maximum range in a vacuum is 45°, but in practice, air resistance and the geometry of the trebuchet mean the ideal angle is usually slightly lower. The efficiency of a trebuchet — how much of the counterweight\'s potential energy actually ends up as projectile kinetic energy — depends on factors like friction at the pivot, air drag on the arm, and how well the sling release timing is tuned. A well-built trebuchet can achieve efficiencies above 60%, which is remarkably high for a mechanical device designed in the Middle Ages.',
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
