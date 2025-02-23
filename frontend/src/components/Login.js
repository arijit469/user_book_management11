import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';

const Login = () => {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const apiUrl = process.env.REACT_APP_API_URL; // Loads https://user-book-management4.onrender.com

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${apiUrl}/api/users/login`, formData); // Updated URL
      localStorage.setItem('token', res.data.token);
      toast.success('Logged in successfully!');
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      toast.error(err.response?.data?.message || 'Login failed');
      console.log('Login error:', err.response ? err.response.data : err.message);
    }
  };

  return (
    <div style={{
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '40px 20px',
      background: 'linear-gradient(135deg, #f5f7fa, #c3cfe2)',
      borderRadius: '15px',
      boxShadow: '0 10px 20px rgba(0, 0, 0, 0.1)',
      fontFamily: '"Poppins", sans-serif',
      minHeight: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
        padding: '30px',
        borderRadius: '15px',
        background: 'rgba(255, 255, 255, 0.9)',
        boxShadow: '0 8px 20px rgba(0, 0, 0, 0.15)',
        animation: 'slideIn 1s ease-out',
      }}>
        <h1 style={{
          textAlign: 'center',
          color: '#2c3e50',
          fontSize: '2.5rem',
          marginBottom: '20px',
          textShadow: '2px 2px 4px rgba(0, 0, 0, 0.1)',
          animation: 'fadeIn 1s ease-in',
        }}>
          Login
        </h1>
        {error && (
          <p style={{
            color: '#e74c3c',
            textAlign: 'center',
            marginBottom: '15px',
            fontSize: '1rem',
            fontWeight: '500',
            textShadow: '1px 1px 2px rgba(0, 0, 0, 0.1)',
          }}>
            {error}
          </p>
        )}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <input
            type="text"
            name="username"
            placeholder="Username"
            value={formData.username}
            onChange={handleChange}
            style={{
              padding: '14px',
              width: '100%',
              border: '2px solid #3498db',
              borderRadius: '10px',
              fontSize: '15px',
              outline: 'none',
              transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
              background: '#fff',
              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.05), inset 0 2px 4px rgba(0, 0, 0, 0.05)',
            }}
            onFocus={e => {
              e.currentTarget.style.borderColor = '#2980b9';
              e.currentTarget.style.boxShadow = '0 6px 12px rgba(41, 128, 185, 0.2), inset 0 2px 4px rgba(0, 0, 0, 0.05)';
            }}
            onBlur={e => {
              e.currentTarget.style.borderColor = '#3498db';
              e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.05), inset 0 2px 4px rgba(0, 0, 0, 0.05)';
            }}
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            style={{
              padding: '14px',
              width: '100%',
              border: '2px solid #3498db',
              borderRadius: '10px',
              fontSize: '15px',
              outline: 'none',
              transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
              background: '#fff',
              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.05), inset 0 2px 4px rgba(0, 0, 0, 0.05)',
            }}
            onFocus={e => {
              e.currentTarget.style.borderColor = '#2980b9';
              e.currentTarget.style.boxShadow = '0 6px 12px rgba(41, 128, 185, 0.2), inset 0 2px 4px rgba(0, 0, 0, 0.05)';
            }}
            onBlur={e => {
              e.currentTarget.style.borderColor = '#3498db';
              e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.05), inset 0 2px 4px rgba(0, 0, 0, 0.05)';
            }}
          />
          <button
            type="submit"
            style={{
              padding: '12px 25px',
              background: 'linear-gradient(45deg, #3498db, #2980b9)',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              fontSize: '15px',
              boxShadow: '0 8px 20px rgba(52, 152, 219, 0.5)',
              transition: 'all 0.3s ease',
              animation: 'pulse 1.5s infinite',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'linear-gradient(45deg, #2980b9, #3498db)';
              e.currentTarget.style.transform = 'translateY(-3px)';
              e.currentTarget.style.boxShadow = '0 10px 25px rgba(52, 152, 219, 0.6)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'linear-gradient(45deg, #3498db, #2980b9)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 8px 20px rgba(52, 152, 219, 0.5)';
            }}
          >
            Login
          </button>
        </form>
        <p style={{
          textAlign: 'center',
          marginTop: '20px',
          color: '#7f8c8d',
          fontSize: '1rem',
        }}>
          Don’t have an account? <Link to="/register" style={{ color: '#3498db', textDecoration: 'none', fontWeight: '600' }}>Register here</Link>
        </p>
      </div>
    </div>
  );
};

// CSS Animations (inline styles don’t support @keyframes, so move to a CSS file or handle differently)
const styleSheet = document.styleSheets[0];
styleSheet.insertRule(`
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`, styleSheet.cssRules.length);
styleSheet.insertRule(`
  @keyframes slideIn {
    from { transform: translateY(20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
`, styleSheet.cssRules.length);
styleSheet.insertRule(`
  @keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.05); }
    100% { transform: scale(1); }
  }
`, styleSheet.cssRules.length);

export default Login;