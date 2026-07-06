import React, { useState, useEffect } from 'react';

const PasswordLock = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const authStatus = sessionStorage.getItem('site_auth');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
    }
    setIsChecking(false);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password === 'donkeykong') {
      sessionStorage.setItem('site_auth', 'true');
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('Incorrect password');
      setPassword('');
    }
  };

  if (isChecking) {
    return null;
  }

  if (isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center font-mono bg-canvas text-ink p-4">
      <form onSubmit={handleSubmit} className="flex flex-col items-center gap-4 w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-4">Restricted Access</h1>
        <div className="flex flex-col w-full gap-2 text-center">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            className="px-4 py-2 bg-transparent border border-ink focus:outline-none text-center"
            autoFocus
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
        </div>
        <button
          type="submit"
          className="px-6 py-2 border border-ink hover:bg-ink hover:text-canvas transition-colors mt-2"
        >
          Enter
        </button>
      </form>
    </div>
  );
};

export default PasswordLock;
