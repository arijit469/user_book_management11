import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import useDarkMode from 'use-dark-mode';

const Navbar = () => {
  const token = localStorage.getItem('token');
  const navigate = useNavigate();
  const darkMode = useDarkMode(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    toast.success('Logged out successfully!');
    navigate('/login');
  };

  return (
    <nav className={`p-4 shadow-md ${darkMode.value ? 'bg-gray-800 text-white' : 'bg-blue-600 text-white'}`}>
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold">Book Management</Link>
        <div className="space-x-4 flex items-center">
          <Link to="/" className="hover:underline">Home</Link>
          {token ? (
            <>
              <Link to="/admin" className="hover:underline">Admin</Link>
              <button onClick={handleLogout} className="hover:underline">Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className="hover:underline">Login</Link>
              <Link to="/register" className="hover:underline">Register</Link>
            </>
          )}
          <button
            onClick={darkMode.toggle}
            className="p-2 bg-gray-200 text-gray-800 rounded-full hover:bg-gray-300 dark:bg-gray-700 dark:text-white"
          >
            {darkMode.value ? '☀️' : '🌙'}
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;