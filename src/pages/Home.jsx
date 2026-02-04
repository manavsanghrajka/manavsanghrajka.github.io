import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <main className="flex-grow flex flex-col items-center justify-center text-center px-6 py-16">
      <h1 className="text-2xl md:text-3xl font-bold text-ink uppercase tracking-terminal mb-6">
        WELCOME TO MY WEBSITE
      </h1>

      <p className="text-sm md:text-base text-ink/70 max-w-2xl mb-10 leading-relaxed">
        I'm a student who likes making random things
      </p>

      <Link to="/projects"
        className="bg-highlight text-invert px-8 py-4 font-semibold uppercase tracking-terminal hover:bg-ink hover:text-invert border border-highlight transition-none">
        [ EXPLORE PROJECTS → ]
      </Link>
    </main>
  );
};

export default Home;
