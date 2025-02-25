import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Navbar from './components/Navbar';
import { ClipLoader } from 'react-spinners';
import Landing from './components/Landing';

const Home = lazy(() => import('./components/Home'));
const Login = lazy(() => import('./components/Login'));
const Register = lazy(() => import('./components/Register'));
const AdminDashboard = lazy(() => import('./components/AdminDashboard'));

const queryClient = new QueryClient();

const PrivateRoute = ({ children, roleRequired }) => {
  const token = localStorage.getItem('token');
  const userRole = token ? JSON.parse(atob(token.split('.')[1])).role : null;

  if (!token) return <Navigate to="/login" />;
  if (roleRequired === 'admin' && userRole !== 'admin') return <Navigate to="/" />;
  return children;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Navbar />
        <ToastContainer position="top-right" autoClose={3000} />
        <Suspense fallback={<div className="flex justify-center items-center min-h-screen"><ClipLoader color="#3498db" size={50} /></div>}>
        {/* <Landing /> */}
          <Routes>
            <Route exact path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/admin"
              element={<PrivateRoute roleRequired="admin"><AdminDashboard /></PrivateRoute>}
            />
          </Routes>
        </Suspense>
      </Router>
    </QueryClientProvider>
  );
}

export default App;