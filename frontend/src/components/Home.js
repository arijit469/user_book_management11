import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import Modal from 'react-modal';
import { toast } from 'react-toastify';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import 'react-toastify/dist/ReactToastify.css';

Modal.setAppElement('#root'); // Set the root element for accessibility

const Home = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newBook, setNewBook] = useState({ title: '', author: '', isbn: '', description: '' });
  const [editBook, setEditBook] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', author: '', isbn: '', description: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const token = localStorage.getItem('token');
  const navigate = useNavigate();
  const apiUrl = process.env.REACT_APP_API_URL; // Loads https://user-book-management4.onrender.com

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = () => {
    setLoading(true);
    axios.get(`${apiUrl}/api/books`)
      .then(res => {
        setBooks(res.data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
        console.log('Fetch books error:', err.response ? err.response.data : err.message);
      });
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '20px', color: '#fff', background: 'linear-gradient(45deg, #4a90e2, #50c878)' }}>Loading books...</div>;
  if (error) return <div style={{ color: 'red', textAlign: 'center', padding: '20px', background: '#ffebee' }}>Error: {error}</div>;

  const filteredBooks = books.filter(book =>
    book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.isbn.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addToFavorites = (bookId) => {
    if (!token) {
      alert('Please log in to add books to favorites');
      return;
    }
    axios.post(`${apiUrl}/api/users/favorites/${bookId}`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => toast.success(res.data.message))
      .catch(err => {
        console.log('Add to favorites error:', err.response ? err.response.data : err.message);
        toast.error(err.response?.data?.message || 'Failed to add to favorites');
      });
  };

  const getUserId = () => {
    if (!token) return null;
    try {
      const decoded = JSON.parse(atob(token.split('.')[1]));
      return decoded.id;
    } catch (err) {
      console.log('Token decoding error:', err);
      return null;
    }
  };

  const getUsername = () => {
    if (!token) return null;
    try {
      const decoded = JSON.parse(atob(token.split('.')[1]));
      return decoded.username;
    } catch (err) {
      console.log('Token decoding error:', err);
      return null;
    }
  };

  const userId = getUserId();
  const username = getUsername();

  const addBook = () => {
    if (!token) {
      alert('Please log in to add books');
      return;
    }
    const headers = { Authorization: `Bearer ${token}` };
    axios.post(`${apiUrl}/api/books`, newBook, { headers })
      .then(res => {
        setBooks([...books, res.data]);
        setNewBook({ title: '', author: '', isbn: '', description: '' });
        setError(null);
        toast.success('Book added successfully!');
      })
      .catch(err => {
        setError(err.response?.data?.message || err.message);
        toast.error(err.response?.data?.message || err.message || 'Failed to add book');
        console.log('Add book error:', err.response ? err.response.data : err.message);
      });
  };

  const deleteBook = (id) => {
    if (!token) {
      alert('Please log in to delete books');
      return;
    }
    axios.get(`${apiUrl}/api/books/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(bookRes => {
        if (bookRes.data.createdBy.toString() !== userId) {
          toast.error('You can only delete your own books');
          return;
        }
        const headers = { Authorization: `Bearer ${token}` };
        axios.delete(`${apiUrl}/api/books/${id}`, { headers })
          .then(response => {
            console.log('Delete response:', response.data);
            setBooks(books.filter(book => book._id !== id));
            setError(null);
            toast.success('Book deleted successfully!');
          })
          .catch(err => {
            setError(err.response?.data?.message || err.message);
            toast.error(err.response?.data?.message || err.message || 'Failed to delete book');
            console.log('Delete error:', err.response ? err.response.data : err.message);
          });
      })
      .catch(err => {
        setError(err.message);
        toast.error(err.message);
        console.log('Fetch book error:', err.response ? err.response.data : err.message);
      });
  };

  const handleEditOpen = (book) => {
    setEditBook(book);
    setEditForm({
      title: book.title,
      author: book.author,
      isbn: book.isbn,
      description: book.description,
    });
  };

  const handleEditClose = () => {
    setEditBook(null);
    setEditForm({ title: '', author: '', isbn: '', description: '' });
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!token) {
      alert('Please log in to edit books');
      return;
    }
    if (editBook.createdBy.toString() !== userId) {
      toast.error('You can only edit your own books');
      return;
    }
    const headers = { Authorization: `Bearer ${token}` };
    axios.put(`${apiUrl}/api/books/${editBook._id}`, editForm, { headers })
      .then(res => {
        setBooks(books.map(b => (b._id === editBook._id ? res.data : b)));
        handleEditClose();
        toast.success('Book updated successfully!');
      })
      .catch(err => {
        setError(err.response?.data?.message || err.message);
        toast.error(err.response?.data?.message || err.message || 'Failed to update book');
        console.log('Edit error:', err.response ? err.response.data : err.message);
      });
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const downloadBooks = () => {
    if (!token) {
      alert('Please log in to download books');
      return;
    }
    const headers = { Authorization: `Bearer ${token}` };
    axios.get(`${apiUrl}/api/books/export`, { headers })
      .then(response => {
        const ws = XLSX.utils.json_to_sheet(response.data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Books');
        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        saveAs(blob, 'books.xlsx');
        toast.success('Books downloaded successfully!');
      })
      .catch(err => {
        setError(err.response?.data?.message || err.message);
        toast.error(err.response?.data?.message || err.message || 'Failed to download books');
        console.log('Download error:', err.response ? err.response.data : err.message);
      });
  };

  return (
    <div style={{
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '20px',
      background: 'linear-gradient(135deg, #f5f7fa, #c3cfe2)',
      borderRadius: '15px',
      boxShadow: '0 10px 20px rgba(0, 0, 0, 0.1)',
      fontFamily: '"Poppins", sans-serif',
    }}>
      <h1 style={{
        textAlign: 'center',
        color: '#2c3e50',
        fontSize: '2.5rem',
        marginBottom: '20px',
        textShadow: '2px 2px 4px rgba(0, 0, 0, 0.1)',
        animation: 'fadeIn 1s ease-in',
      }}>
        Book Management System
      </h1>
      {token ? (
        <div style={{
          textAlign: 'center',
          margin: '20px 0',
          background: 'rgba(255, 255, 255, 0.9)',
          padding: '15px',
          borderRadius: '10px',
          boxShadow: '0 5px 15px rgba(0, 0, 0, 0.1)',
        }}>
          <p style={{
            marginBottom: '10px',
            fontSize: '1.2rem',
            color: '#2c3e50',
            fontWeight: '600',
          }}>
            Welcome, <span style={{ color: '#3498db', fontWeight: '700' }}>{username || 'User'}</span>!
          </p>
          <button
            onClick={handleLogout}
            style={{
              padding: '8px 16px',
              background: 'linear-gradient(45deg, #e74c3c, #c0392b)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              boxShadow: '0 4px 12px rgba(231, 76, 60, 0.3)',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'linear-gradient(45deg, #c0392b, #e74c3c)';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 15px rgba(231, 76, 60, 0.4)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'linear-gradient(45deg, #e74c3c, #c0392b)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(231, 76, 60, 0.3)';
            }}
          >
            Logout
          </button>
        </div>
      ) : (
        <p style={{
          textAlign: 'center',
          margin: '20px 0',
          color: '#7f8c8d',
          fontSize: '1.1rem',
        }}>
          Please <Link to="/login" style={{ color: '#3498db', textDecoration: 'none', fontWeight: '600' }}>log in</Link> or 
          <Link to="/register" style={{ color: '#3498db', textDecoration: 'none', fontWeight: '600', marginLeft: '5px' }}>register</Link> 
          to access more features.
        </p>
      )}

      {token && (
        <div style={{
          margin: '20px 0',
          padding: '15px',
          borderRadius: '10px',
          background: 'rgba(255, 255, 255, 0.9)',
          boxShadow: '0 5px 15px rgba(0, 0, 0, 0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}>
          <input
            type="text"
            placeholder="Search by title, author, or ISBN..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              padding: '10px',
              width: '70%',
              border: '2px solid #3498db',
              borderRadius: '8px',
              fontSize: '14px',
              outline: 'none',
              transition: 'border-color 0.3s ease',
            }}
            onFocus={e => e.currentTarget.style.borderColor = '#2980b9'}
            onBlur={e => e.currentTarget.style.borderColor = '#3498db'}
          />
          <button
            onClick={() => setSearchTerm('')}
            style={{
              padding: '8px 16px',
              background: 'linear-gradient(45deg, #e74c3c, #c0392b)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              boxShadow: '0 4px 12px rgba(231, 76, 60, 0.3)',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'linear-gradient(45deg, #c0392b, #e74c3c)';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 15px rgba(231, 76, 60, 0.4)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'linear-gradient(45deg, #e74c3c, #c0392b)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(231, 76, 60, 0.3)';
            }}
          >
            Clear Search
          </button>
        </div>
      )}

      {token && (
        <div style={{ textAlign: 'center', margin: '20px 0' }}>
          <button
            onClick={downloadBooks}
            style={{
              padding: '8px 16px',
              background: 'linear-gradient(45deg, #3498db, #2980b9)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              boxShadow: '0 4px 12px rgba(52, 152, 219, 0.3)',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'linear-gradient(45deg, #2980b9, #3498db)';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 15px rgba(52, 152, 219, 0.4)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'linear-gradient(45deg, #3498db, #2980b9)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(52, 152, 219, 0.3)';
            }}
          >
            Download All Books
          </button>
        </div>
      )}

      {token && (
        <div style={{
          margin: '20px 0',
          padding: '20px',
          borderRadius: '10px',
          background: 'rgba(255, 255, 255, 0.9)',
          boxShadow: '0 8px 20px rgba(0, 0, 0, 0.1)',
          animation: 'slideIn 1s ease-out',
        }}>
          <h2 style={{
            marginBottom: '15px',
            color: '#2c3e50',
            fontSize: '1.8rem',
            textShadow: '1px 1px 3px rgba(0, 0, 0, 0.1)',
          }}>
            Add New Book
          </h2>
          <input
            type="text"
            placeholder="Title"
            value={newBook.title}
            onChange={e => setNewBook({ ...newBook, title: e.target.value })}
            style={{
              margin: '10px 0',
              padding: '12px',
              width: '100%',
              border: '2px solid #3498db',
              borderRadius: '8px',
              fontSize: '14px',
              outline: 'none',
              transition: 'border-color 0.3s ease',
            }}
            onFocus={e => e.currentTarget.style.borderColor = '#2980b9'}
            onBlur={e => e.currentTarget.style.borderColor = '#3498db'}
          />
          <input
            type="text"
            placeholder="Author"
            value={newBook.author}
            onChange={e => setNewBook({ ...newBook, author: e.target.value })}
            style={{
              margin: '10px 0',
              padding: '12px',
              width: '100%',
              border: '2px solid #3498db',
              borderRadius: '8px',
              fontSize: '14px',
              outline: 'none',
              transition: 'border-color 0.3s ease',
            }}
            onFocus={e => e.currentTarget.style.borderColor = '#2980b9'}
            onBlur={e => e.currentTarget.style.borderColor = '#3498db'}
          />
          <input
            type="text"
            placeholder="ISBN"
            value={newBook.isbn}
            onChange={e => setNewBook({ ...newBook, isbn: e.target.value })}
            style={{
              margin: '10px 0',
              padding: '12px',
              width: '100%',
              border: '2px solid #3498db',
              borderRadius: '8px',
              fontSize: '14px',
              outline: 'none',
              transition: 'border-color 0.3s ease',
            }}
            onFocus={e => e.currentTarget.style.borderColor = '#2980b9'}
            onBlur={e => e.currentTarget.style.borderColor = '#3498db'}
          />
          <textarea
            placeholder="Description"
            value={newBook.description}
            onChange={e => setNewBook({ ...newBook, description: e.target.value })}
            style={{
              margin: '10px 0',
              padding: '12px',
              width: '100%',
              border: '2px solid #3498db',
              borderRadius: '8px',
              fontSize: '14px',
              outline: 'none',
              minHeight: '80px',
              resize: 'vertical',
              transition: 'border-color 0.3s ease',
            }}
            onFocus={e => e.currentTarget.style.borderColor = '#2980b9'}
            onBlur={e => e.currentTarget.style.borderColor = '#3498db'}
          />
          <button
            onClick={addBook}
            style={{
              margin: '15px 0',
              padding: '10px 20px',
              background: 'linear-gradient(45deg, #3498db, #2980b9)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              boxShadow: '0 6px 18px rgba(52, 152, 219, 0.4)',
              transition: 'all 0.3s ease',
              animation: 'pulse 1.5s infinite',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'linear-gradient(45deg, #2980b9, #3498db)';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 20px rgba(52, 152, 219, 0.5)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'linear-gradient(45deg, #3498db, #2980b9)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 6px 18px rgba(52, 152, 219, 0.4)';
            }}
          >
            Add Book
          </button>
        </div>
      )}

      <h2 style={{
        marginTop: '30px',
        color: '#2c3e50',
        fontSize: '2rem',
        textAlign: 'center',
        textShadow: '2px 2px 4px rgba(0, 0, 0, 0.1)',
        animation: 'fadeIn 1s ease-in',
      }}>
        Books
      </h2>
      {filteredBooks.length === 0 ? (
        <p style={{
          textAlign: 'center',
          margin: '20px 0',
          color: '#7f8c8d',
          fontSize: '1rem',
          background: 'rgba(255, 255, 255, 0.9)',
          padding: '15px',
          borderRadius: '10px',
          boxShadow: '0 5px 15px rgba(0, 0, 0, 0.1)',
        }}>
          {searchTerm ? 'No books found matching your search.' : 'No books available. Please add books above.'}
        </p>
      ) : (
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          marginTop: '20px',
          background: 'rgba(255, 255, 255, 0.9)',
          borderRadius: '10px',
          boxShadow: '0 8px 20px rgba(0, 0, 0, 0.1)',
          animation: 'slideIn 1s ease-out',
        }}>
          <thead>
            <tr style={{
              background: 'linear-gradient(45deg, #3498db, #2980b9)',
              borderBottom: '2px solid #2980b9',
            }}>
              <th style={{
                padding: '12px',
                textAlign: 'left',
                color: 'white',
                fontWeight: '600',
                textShadow: '1px 1px 2px rgba(0, 0, 0, 0.1)',
              }}>Title</th>
              <th style={{
                padding: '12px',
                textAlign: 'left',
                color: 'white',
                fontWeight: '600',
                textShadow: '1px 1px 2px rgba(0, 0, 0, 0.1)',
              }}>Author</th>
              <th style={{
                padding: '12px',
                textAlign: 'left',
                color: 'white',
                fontWeight: '600',
                textShadow: '1px 1px 2px rgba(0, 0, 0, 0.1)',
              }}>ISBN</th>
              <th style={{
                padding: '12px',
                textAlign: 'left',
                color: 'white',
                fontWeight: '600',
                textShadow: '1px 1px 2px rgba(0, 0, 0, 0.1)',
              }}>Description</th>
              <th style={{
                padding: '12px',
                textAlign: 'left',
                color: 'white',
                fontWeight: '600',
                textShadow: '1px 1px 2px rgba(0, 0, 0, 0.1)',
              }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredBooks.map(book => (
              <tr
                key={book._id}
                style={{
                  borderBottom: '1px solid #ddd',
                  transition: 'background-color 0.3s ease',
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <td style={{ padding: '12px', color: '#2c3e50' }}>{book.title}</td>
                <td style={{ padding: '12px', color: '#2c3e50' }}>{book.author}</td>
                <td style={{ padding: '12px', color: '#2c3e50' }}>{book.isbn}</td>
                <td style={{ padding: '12px', color: '#2c3e50' }}>{book.description}</td>
                <td style={{ padding: '12px' }}>
                  {token && (
                    <>
                      <button
                        onClick={() => addToFavorites(book._id)}
                        style={{
                          margin: '5px 5px 5px 0',
                          padding: '8px 12px',
                          background: 'linear-gradient(45deg, #27ae60, #2ecc71)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          boxShadow: '0 4px 12px rgba(39, 174, 96, 0.3)',
                          transition: 'all 0.3s ease',
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.background = 'linear-gradient(45deg, #2ecc71, #27ae60)';
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 6px 15px rgba(39, 174, 96, 0.4)';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.background = 'linear-gradient(45deg, #27ae60, #2ecc71)';
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(39, 174, 96, 0.3)';
                        }}
                      >
                        Favorites
                      </button>
                      {book.createdBy.toString() === userId && (
                        <>
                          <button
                            onClick={() => handleEditOpen(book)}
                            style={{
                              margin: '5px 5px 5px 0',
                              padding: '8px 12px',
                              background: 'linear-gradient(45deg, #f1c40f, #f39c12)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              fontSize: '14px',
                              boxShadow: '0 4px 12px rgba(241, 196, 15, 0.3)',
                              transition: 'all 0.3s ease',
                            }}
                            onMouseEnter={e => {
                              e.currentTarget.style.background = 'linear-gradient(45deg, #f39c12, #f1c40f)';
                              e.currentTarget.style.transform = 'translateY(-2px)';
                              e.currentTarget.style.boxShadow = '0 6px 15px rgba(241, 196, 15, 0.4)';
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.background = 'linear-gradient(45deg, #f1c40f, #f39c12)';
                              e.currentTarget.style.transform = 'translateY(0)';
                              e.currentTarget.style.boxShadow = '0 4px 12px rgba(241, 196, 15, 0.3)';
                            }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteBook(book._id)}
                            style={{
                              margin: '5px 5px 5px 0',
                              padding: '8px 12px',
                              background: 'linear-gradient(45deg, #e74c3c, #c0392b)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              fontSize: '14px',
                              boxShadow: '0 4px 12px rgba(231, 76, 60, 0.3)',
                              transition: 'all 0.3s ease',
                            }}
                            onMouseEnter={e => {
                              e.currentTarget.style.background = 'linear-gradient(45deg, #c0392b, #e74c3c)';
                              e.currentTarget.style.transform = 'translateY(-2px)';
                              e.currentTarget.style.boxShadow = '0 6px 15px rgba(231, 76, 60, 0.4)';
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.background = 'linear-gradient(45deg, #e74c3c, #c0392b)';
                              e.currentTarget.style.transform = 'translateY(0)';
                              e.currentTarget.style.boxShadow = '0 4px 12px rgba(231, 76, 60, 0.3)';
                            }}
                          >
                            Delete
                          </button>
                        </>
                      )}
                      {book.createdBy.toString() !== userId && (
                        <p style={{
                          color: '#e74c3c',
                          margin: '5px 0',
                          fontSize: '0.9rem',
                          fontWeight: '500',
                          textShadow: '1px 1px 2px rgba(0, 0, 0, 0.1)',
                        }}>
                          You can only edit or delete your own books.
                        </p>
                      )}
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <Modal
        isOpen={!!editBook}
        onRequestClose={handleEditClose}
        style={{
          content: {
            top: '50%',
            left: '50%',
            right: 'auto',
            bottom: 'auto',
            marginRight: '-50%',
            transform: 'translate(-50%, -50%)',
            width: '450px',
            padding: '20px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #ffffff, #f5f7fa)',
            boxShadow: '0 15px 30px rgba(0, 0, 0, 0.2)',
            border: 'none',
            animation: 'modalSlide 0.5s ease-out',
          },
          overlay: {
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
          },
        }}
      >
        <h2 style={{
          marginBottom: '15px',
          color: '#2c3e50',
          fontSize: '1.8rem',
          textAlign: 'center',
          textShadow: '1px 1px 3px rgba(0, 0, 0, 0.1)',
        }}>
          Edit Book
        </h2>
        <form onSubmit={handleEditSubmit}>
          <input
            type="text"
            placeholder="Title"
            value={editForm.title}
            onChange={e => setEditForm({ ...editForm, title: e.target.value })}
            style={{
              margin: '10px 0',
              padding: '12px',
              width: '100%',
              border: '2px solid #3498db',
              borderRadius: '8px',
              fontSize: '14px',
              outline: 'none',
              transition: 'border-color 0.3s ease',
              background: '#fff',
              boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.05)',
            }}
            onFocus={e => e.currentTarget.style.borderColor = '#2980b9'}
            onBlur={e => e.currentTarget.style.borderColor = '#3498db'}
          />
          <input
            type="text"
            placeholder="Author"
            value={editForm.author}
            onChange={e => setEditForm({ ...editForm, author: e.target.value })}
            style={{
              margin: '10px 0',
              padding: '12px',
              width: '100%',
              border: '2px solid #3498db',
              borderRadius: '8px',
              fontSize: '14px',
              outline: 'none',
              transition: 'border-color 0.3s ease',
              background: '#fff',
              boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.05)',
            }}
            onFocus={e => e.currentTarget.style.borderColor = '#2980b9'}
            onBlur={e => e.currentTarget.style.borderColor = '#3498db'}
          />
          <input
            type="text"
            placeholder="ISBN"
            value={editForm.isbn}
            onChange={e => setEditForm({ ...editForm, isbn: e.target.value })}
            style={{
              margin: '10px 0',
              padding: '12px',
              width: '100%',
              border: '2px solid #3498db',
              borderRadius: '8px',
              fontSize: '14px',
              outline: 'none',
              transition: 'border-color 0.3s ease',
              background: '#fff',
              boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.05)',
            }}
            onFocus={e => e.currentTarget.style.borderColor = '#2980b9'}
            onBlur={e => e.currentTarget.style.borderColor = '#3498db'}
          />
          <textarea
            placeholder="Description"
            value={editForm.description}
            onChange={e => setEditForm({ ...editForm, description: e.target.value })}
            style={{
              margin: '10px 0',
              padding: '12px',
              width: '100%',
              border: '2px solid #3498db',
              borderRadius: '8px',
              fontSize: '14px',
              outline: 'none',
              minHeight: '80px',
              resize: 'vertical',
              transition: 'border-color 0.3s ease',
              background: '#fff',
              boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.05)',
            }}
            onFocus={e => e.currentTarget.style.borderColor = '#2980b9'}
            onBlur={e => e.currentTarget.style.borderColor = '#3498db'}
          />
          <div style={{
            marginTop: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            gap: '10px',
          }}>
            <button
              type="submit"
              style={{
                padding: '10px 20px',
                background: 'linear-gradient(45deg, #3498db, #2980b9)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                boxShadow: '0 6px 18px rgba(52, 152, 219, 0.4)',
                transition: 'all 0.3s ease',
                flex: '1',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'linear-gradient(45deg, #2980b9, #3498db)';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(52, 152, 219, 0.5)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'linear-gradient(45deg, #3498db, #2980b9)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 6px 18px rgba(52, 152, 219, 0.4)';
              }}
            >
              Save Changes
            </button>
            <button
              onClick={handleEditClose}
              style={{
                padding: '10px 20px',
                background: 'linear-gradient(45deg, #e74c3c, #c0392b)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                boxShadow: '0 6px 18px rgba(231, 76, 60, 0.4)',
                transition: 'all 0.3s ease',
                flex: '1',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'linear-gradient(45deg, #c0392b, #e74c3c)';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(231, 76, 60, 0.5)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'linear-gradient(45deg, #e74c3c, #c0392b)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 6px 18px rgba(231, 76, 60, 0.4)';
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

// CSS Animations (inline styles don’t support @keyframes, but you can add this to a CSS file or use a library)
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
  @keyframes modalSlide {
    from { transform: translate(-50%, -60%); opacity: 0; }
    to { transform: translate(-50%, -50%); opacity: 1; }
  }
`, styleSheet.cssRules.length);
styleSheet.insertRule(`
  @keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.05); }
    100% { transform: scale(1); }
  }
`, styleSheet.cssRules.length);

export default Home;