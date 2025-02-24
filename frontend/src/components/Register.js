import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Login.css';

function Login() {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', credentials);
      localStorage.setItem('token', res.data.data.token); // Store JWT token
      navigate('/books'); // Redirect to books page
    } catch (err) {
      setError('Invalid username or password');
    }
  };

  return (
    <div className="landing-container">
      <div className="landing-overlay">
        <div className="landing-card animate-slide-up">
          <h1 className="landing-title animate-text">Book Haven</h1>
          <p className="landing-subtitle animate-text">Your Gateway to Literary Bliss</p>
          <form onSubmit={handleSubmit} className="landing-form">
            <div className="input-wrapper">
              <input
                type="text"
                name="username"
                placeholder="Username"
                value={credentials.username}
                onChange={handleChange}
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
                value={credentials.password}
                onChange={handleChange}
                required
                className="landing-input"
              />
              <span className="input-border"></span>
            </div>
            <button type="submit" className="landing-btn">Log In</button>
            {error && <p className="error-message">{error}</p>}
          </form>
          <p className="register-text">
            New here? <a href="/register" className="register-link">Sign Up</a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
