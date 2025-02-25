import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom'; // Added for routing
import { ToastContainer } from 'react-toastify'; // Added for toast notifications
import App from './App';
import 'react-toastify/dist/ReactToastify.css'; // Toastify styles
import './index.css'; // Custom styles

// Create the root element
const root = ReactDOM.createRoot(document.getElementById('root'));

// Render the app with routing and toast support
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </BrowserRouter>
  </React.StrictMode>
);
