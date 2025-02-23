import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import Modal from 'react-modal';
import { toast } from 'react-toastify';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import 'react-toastify/dist/ReactToastify.css';

Modal.setAppElement('#root'); // Set the root element for accessibility

const AdminDashboard = () => {
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

  if (loading) return <div style={{ textAlign: 'center', padding: '20px' }}>Loading books...</div>;
  if (error) return <div style={{ color: 'red', textAlign: 'center', padding: '20px' }}>Error: {error}</div>;

  const filteredBooks = books.filter(book =>
    book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.isbn.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  const addToFavorites = (id) => {
    if (!token) {
      alert('Please log in to add books to favorites');
      return;
    }
    const headers = { Authorization: `Bearer ${token}` };
    axios.post(`${apiUrl}/api/favorites`, { bookId: id }, { headers })
      .then(() => {
        toast.success('Book added to favorites!');
      })
      .catch(err => {
        setError(err.response?.data?.message || err.message);
        toast.error(err.response?.data?.message || err.message || 'Failed to add to favorites');
        console.log('Favorites error:', err.response ? err.response.data : err.message);
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
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px' }}>
      <h1 style={{ textAlign: 'center', color: '#333' }}>Admin Dashboard</h1>
      {token ? (
        <div style={{ textAlign: 'center', margin: '10px 0' }}>
          <p style={{ marginBottom: '5px', fontSize: '16px', color: '#007BFF' }}>
            Welcome, <strong>{username || 'User'}</strong>!
          </p>
          <button
            onClick={handleLogout}
            style={{
              padding: '6px 12px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '12px',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
              transition: 'background-color 0.3s, transform 0.2s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = '#c82333';
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = '#dc3545';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            Logout
          </button>
        </div>
      ) : (
        <p style={{ textAlign: 'center', margin: '10px 0' }}>
          Please <Link to="/login" style={{ color: '#007BFF', textDecoration: 'underline' }}>log in</Link> to access this dashboard.
        </p>
      )}

      {token && (
        <div style={{ margin: '20px 0', padding: '10px', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#f9f9f9' }}>
          <input
            type="text"
            placeholder="Search by title, author, or ISBN..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ marginRight: '10px', padding: '8px', width: '70%', border: '1px solid #ccc', borderRadius: '4px' }}
          />
          <button
            onClick={() => setSearchTerm('')}
            style={{
              padding: '6px 12px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '12px',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
              transition: 'background-color 0.3s, transform 0.2s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = '#c82333';
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = '#dc3545';
              e.currentTarget.style.transform = 'scale(1)';
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
              padding: '6px 12px',
              backgroundColor: '#007BFF',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '12px',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
              transition: 'background-color 0.3s, transform 0.2s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = '#0056b3';
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = '#007BFF';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            Download All Books
          </button>
        </div>
      )}

      {token && (
        <div style={{ margin: '20px 0', padding: '15px', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#f9f9f9' }}>
          <h2 style={{ marginBottom: '10px' }}>Add New Book</h2>
          <input
            type="text"
            placeholder="Title"
            value={newBook.title}
            onChange={e => setNewBook({ ...newBook, title: e.target.value })}
            style={{ margin: '5px 0', padding: '8px', width: '100%', border: '1px solid #ccc', borderRadius: '4px' }}
          />
          <input
            type="text"
            placeholder="Author"
            value={newBook.author}
            onChange={e => setNewBook({ ...newBook, author: e.target.value })}
            style={{ margin: '5px 0', padding: '8px', width: '100%', border: '1px solid #ccc', borderRadius: '4px' }}
          />
          <input
            type="text"
            placeholder="ISBN"
            value={newBook.isbn}
            onChange={e => setNewBook({ ...newBook, isbn: e.target.value })}
            style={{ margin: '5px 0', padding: '8px', width: '100%', border: '1px solid #ccc', borderRadius: '4px' }}
          />
          <textarea
            placeholder="Description"
            value={newBook.description}
            onChange={e => setNewBook({ ...newBook, description: e.target.value })}
            style={{ margin: '5px 0', padding: '8px', width: '100%', border: '1px solid #ccc', borderRadius: '4px', minHeight: '50px' }}
          />
          <button
            onClick={addBook}
            style={{
              margin: '10px 0',
              padding: '6px 12px',
              backgroundColor: '#007BFF',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '12px',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
              transition: 'background-color 0.3s, transform 0.2s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = '#0056b3';
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = '#007BFF';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            Add Book
          </button>
        </div>
      )}

      <h2 style={{ marginTop: '20px' }}>Books</h2>
      {filteredBooks.length === 0 ? (
        <p style={{ textAlign: 'center', margin: '10px 0' }}>
          {searchTerm ? 'No books found matching your search.' : 'No books available. Please add books above.'}
        </p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
              <th style={{ padding: '10px', textAlign: 'left' }}>Title</th>
              <th style={{ padding: '10px', textAlign: 'left' }}>Author</th>
              <th style={{ padding: '10px', textAlign: 'left' }}>ISBN</th>
              <th style={{ padding: '10px', textAlign: 'left' }}>Description</th>
              <th style={{ padding: '10px', textAlign: 'left' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredBooks.map(book => (
              <tr
                key={book._id}
                style={{
                  borderBottom: '1px solid #ddd',
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f9f9f9'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <td style={{ padding: '10px' }}>{book.title}</td>
                <td style={{ padding: '10px' }}>{book.author}</td>
                <td style={{ padding: '10px' }}>{book.isbn}</td>
                <td style={{ padding: '10px' }}>{book.description}</td>
                <td style={{ padding: '10px' }}>
                  {token && (
                    <>
                      <button
                        onClick={() => addToFavorites(book._id)}
                        style={{
                          margin: '5px 5px 5px 0',
                          padding: '6px 10px',
                          backgroundColor: '#28a745',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                          transition: 'background-color 0.3s, transform 0.2s',
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.backgroundColor = '#218838';
                          e.currentTarget.style.transform = 'scale(1.05)';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.backgroundColor = '#28a745';
                          e.currentTarget.style.transform = 'scale(1)';
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
                              padding: '6px 10px',
                              backgroundColor: '#ffc107',
                              color: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              fontSize: '12px',
                              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                              transition: 'background-color 0.3s, transform 0.2s',
                            }}
                            onMouseEnter={e => {
                              e.currentTarget.style.backgroundColor = '#e0a800';
                              e.currentTarget.style.transform = 'scale(1.05)';
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.backgroundColor = '#ffc107';
                              e.currentTarget.style.transform = 'scale(1)';
                            }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteBook(book._id)}
                            style={{
                              margin: '5px 5px 5px 0',
                              padding: '6px 10px',
                              backgroundColor: '#dc3545',
                              color: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              fontSize: '12px',
                              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                              transition: 'background-color 0.3s, transform 0.2s',
                            }}
                            onMouseEnter={e => {
                              e.currentTarget.style.backgroundColor = '#c82333';
                              e.currentTarget.style.transform = 'scale(1.05)';
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.backgroundColor = '#dc3545';
                              e.currentTarget.style.transform = 'scale(1)';
                            }}
                          >
                            Delete
                          </button>
                        </>
                      )}
                      {book.createdBy.toString() !== userId && (
                        <p style={{ color: '#dc3545', margin: '5px 0', fontSize: '0.9em' }}>
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
            width: '400px',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          },
          overlay: {
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
          },
        }}
      >
        <h2 style={{ marginBottom: '15px', color: '#333' }}>Edit Book</h2>
        <form onSubmit={handleEditSubmit}>
          <input
            type="text"
            placeholder="Title"
            value={editForm.title}
            onChange={e => setEditForm({ ...editForm, title: e.target.value })}
            style={{ margin: '5px 0', padding: '8px', width: '100%', border: '1px solid #ccc', borderRadius: '4px' }}
          />
          <input
            type="text"
            placeholder="Author"
            value={editForm.author}
            onChange={e => setEditForm({ ...editForm, author: e.target.value })}
            style={{ margin: '5px 0', padding: '8px', width: '100%', border: '1px solid #ccc', borderRadius: '4px' }}
          />
          <input
            type="text"
            placeholder="ISBN"
            value={editForm.isbn}
            onChange={e => setEditForm({ ...editForm, isbn: e.target.value })}
            style={{ margin: '5px 0', padding: '8px', width: '100%', border: '1px solid #ccc', borderRadius: '4px' }}
          />
          <textarea
            placeholder="Description"
            value={editForm.description}
            onChange={e => setEditForm({ ...editForm, description: e.target.value })}
            style={{ margin: '5px 0', padding: '8px', width: '100%', border: '1px solid #ccc', borderRadius: '4px', minHeight: '50px' }}
          />
          <div style={{ marginTop: '15px', display: 'flex', justifyContent: 'space-between' }}>
            <button
              type="submit"
              style={{
                padding: '6px 12px',
                backgroundColor: '#007BFF',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '12px',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                transition: 'background-color 0.3s, transform 0.2s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = '#0056b3';
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = '#007BFF';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              Save Changes
            </button>
            <button
              onClick={handleEditClose}
              style={{
                padding: '6px 12px',
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '12px',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                transition: 'background-color 0.3s, transform 0.2s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = '#c82333';
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = '#dc3545';
                e.currentTarget.style.transform = 'scale(1)';
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

export default AdminDashboard;