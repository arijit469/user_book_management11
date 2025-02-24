import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import './Books.css';

function Books() {
  const [books, setBooks] = useState([]);
  const [formData, setFormData] = useState({ title: '', author: '', year: '' });
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  // Fetch books on mount
  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:5000/api/books', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBooks(res.data.data);
    } catch (err) {
      toast.error('Failed to fetch books');
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem('token');
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await axios.put(`http://localhost:5000/api/books/${editId}`, formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success('Book updated successfully');
        setEditId(null);
      } else {
        const res = await axios.post('http://localhost:5000/api/books', formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success('Book added successfully');
        console.log('New book added:', res.data.data); // Console log as requested
      }
      setFormData({ title: '', author: '', year: '' });
      fetchBooks();
    } catch (err) {
      toast.error('Failed to save book');
    }
  };

  const handleEdit = (book) => {
    setFormData({ title: book.title, author: book.author, year: book.year });
    setEditId(book._id);
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/books/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Book deleted successfully');
      fetchBooks();
    } catch (err) {
      toast.error('Failed to delete book');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
    toast.info('Logged out successfully');
  };

  return (
    <div className="books-container">
      <div className="books-overlay">
        <div className="books-card animate-slide-up">
          <h1 className="books-title animate-text">Your Books</h1>
          <button className="logout-btn" onClick={handleLogout}>
            Log Out
          </button>
          <form onSubmit={handleSubmit} className="books-form">
            <div className="input-wrapper">
              <input
                type="text"
                name="title"
                placeholder="Title"
                value={formData.title}
                onChange={handleChange}
                required
                className="books-input"
              />
              <span className="input-border"></span>
            </div>
            <div className="input-wrapper">
              <input
                type="text"
                name="author"
                placeholder="Author"
                value={formData.author}
                onChange={handleChange}
                required
                className="books-input"
              />
              <span className="input-border"></span>
            </div>
            <div className="input-wrapper">
              <input
                type="number"
                name="year"
                placeholder="Year"
                value={formData.year}
                onChange={handleChange}
                required
                className="books-input"
              />
              <span className="input-border"></span>
            </div>
            <button type="submit" className="books-btn">
              {editId ? 'Update Book' : 'Add Book'}
            </button>
          </form>
          <div className="books-list">
            {loading ? (
              <p className="loading-text">Loading...</p>
            ) : books.length === 0 ? (
              <p className="no-books">No books yet. Add some!</p>
            ) : (
              <ul>
                {books.map((book) => (
                  <li key={book._id} className="book-item animate-fade-in">
                    <span>
                      {book.title} by {book.author} ({book.year})
                    </span>
                    <div>
                      <button
                        className="edit-btn"
                        onClick={() => handleEdit(book)}
                      >
                        Edit
                      </button>
                      <button
                        className="delete-btn"
                        onClick={() => handleDelete(book._id)}
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Books;