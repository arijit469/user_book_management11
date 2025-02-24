import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Landing.css';

function Landing() {
  const [activeTab, setActiveTab] = useState('login'); // Default to login tab
  const [loginCredentials, setLoginCredentials] = useState({ username: '', password: '' });
  const [registerCredentials, setRegisterCredentials] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  // Handle input changes for login
  const handleLoginChange = (e) => {
    setLoginCredentials({ ...loginCredentials, [e.target.name]: e.target.value });
  };

  // Handle input changes for register
  const handleRegisterChange = (e) => {
    setRegisterCredentials({ ...registerCredentials, [e.target.name]: e.target.value });
  };

  // Handle login submission
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', loginCredentials);
      localStorage.setItem('token', res.data.data.token);
      navigate('/books');
    } catch (err) {
      setError('Invalid username or password');
      setSuccess('');
    }
  };

  // Handle register submission
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/api/auth/register', registerCredentials);
      setSuccess('Registration successful! Please log in.');
      setError('');
      setTimeout(() => setActiveTab('login'), 2000); // Switch to login tab after 2 seconds
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
      setSuccess('');
    }
  };

  return (
    <div className="landing-container">
      <div className="landing-overlay">
        <div className="landing-card animate-slide-up">
          <h1 className="landing-title animate-text">Book Haven</h1>
          <p className="landing-subtitle animate-text">Your Literary Sanctuary</p>

          {/* Tab Navigation */}
          <div className="tab-navigation">
            <button
              className={`tab-btn ${activeTab === 'login' ? 'active' : ''}`}
              onClick={() => setActiveTab('login')}
            >
              Login
            </button>
            <button
              className={`tab-btn ${activeTab === 'register' ? 'active' : ''}`}
              onClick={() => setActiveTab('register')}
            >
              Register
            </button>
          </div>

          {/* Login Form */}
          {activeTab === 'login' && (
            <form onSubmit={handleLoginSubmit} className="landing-form animate-form">
              <div className="input-wrapper">
                <input
                  type="text"
                  name="username"
                  placeholder="Username"
                  value={loginCredentials.username}
                  onChange={handleLoginChange}
                  required
                  className="landing-input"
                />
                <span className="input-border"></span>
              </div>
              <div className="input-wrapper">
                <input
                  type="password"
                  name="password"
                  placeholder="Password"
                  value={loginCredentials.password}
                  onChange={handleLoginChange}
                  required
                  className="landing-input"
                />
                <span className="input-border"></span>
              </div>
              <button type="submit" className="landing-btn">Log In</button>
            </form>
          )}

          {/* Register Form */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="landing-form animate-form">
              <div className="input-wrapper">
                <input
                  type="text"
                  name="username"
                  placeholder="Username"
                  value={registerCredentials.username}
                  onChange={handleRegisterChange}
                  required
                  className="landing-input"
                />
                <span className="input-border"></span>
              </div>
              <div className="input-wrapper">
                <input
                  type="password"
                  name="password"
                  placeholder="Password"
                  value={registerCredentials.password}
                  onChange={handleRegisterChange}
                  required
                  className="landing-input"
                />
                <span className="input-border"></span>
              </div>
              
              <button type="submit" className="landing-btn">Sign Up</button>
            </form>
          )}

          {/* Messages */}
          {error && <p className="error-message">{error}</p>}
          {success && <p className="success-message">{success}</p>}
        </div>
      </div>
    </div>
  );
}

export default Landing;