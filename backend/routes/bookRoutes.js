const express = require('express');
const Book = require('../models/Book');
const { auth } = require('../middleware/auth'); // Ensure only auth, not adminAuth
const router = express.Router();

// Get all books (public)
router.get('/', async (req, res) => {
  try {
    const books = await Book.find();
    res.json(books);
  } catch (err) {
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

// Get a specific book by ID (public or authenticated, for ownership check)
router.get('/:id', async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: 'Book not found' });
    res.json(book);
  } catch (err) {
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

// Add book (authenticated users and admins can add, tracked by createdBy)
router.post('/', auth, async (req, res) => {
  const { title, author, isbn, description } = req.body;
  try {
    const book = new Book({ title, author, isbn, description, createdBy: req.user.id });
    await book.save();
    res.json(book);
  } catch (err) {
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

// Update book (authenticated users and admins, restricted to their own books)
router.put('/:id', auth, async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: 'Book not found' });

    // Restrict to books created by the user or admin
    if (book.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You can only edit your own books' });
    }

    const updatedBook = await Book.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.json(updatedBook);
  } catch (err) {
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

// Delete book (authenticated users and admins, restricted to their own books)
router.delete('/:id', auth, async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: 'Book not found' });

    // Restrict to books created by the user or admin
    if (book.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You can only delete your own books' });
    }

    await Book.findByIdAndDelete(req.params.id);
    res.json({ message: 'Book deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

module.exports = router;