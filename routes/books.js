var express = require('express');
var router = express.Router();
var Book = require('../models').Book;
var Loan = require('../models').Loan;
var Patron = require('../models').Patron;

//Books listing route
router.get('/', function(req, res, next) {
  Book.findAll()
    .then(function(books) {
    res.render('books/books', { books: books, pageTitle: 'All Books'})
  })
});

//List of all checked out books route
router.get('/checked_out', function(req, res, next) {
  Loan.findAll({
    include: [Book, Patron],
    where: { returned_on: null }
  }
)
    .then(function(loans) {
      let books = loans.map((loan) => loan.book);
      res.render('books/books', { books: books, pageTitle: 'Checked Out'});
    })
  });

  //Overdue books route
  router.get('/overdue', function(req, res, next) {
  Loan.findAll({
    include: [Book, Patron],
    where: {
      returned_on: null,
      return_by: { $lt: Date.now() }
      }
    }
  )
    .then(function(loans) {
      let books = loans.map((loan) => loan.Book);
      res.render('books/books', { books: books, pageTitle: 'Overdue' });
  })
});

//New book route
router.get('/new_book', function(req, res, next) {
  let book = Book.build();
  res.render('books/books_new', { book: book, pageTitle: 'New Book' });
});

// Error new book route
router.post('/', function(req, res, next) {
  Book.create(req.body)
      .then(function(book) {
        res.redirect('/books');
      })
      .catch(function(err) {
        if(err.name === "SequelizeValidationError") {
          let book = Book.build();
          res.render('books/books_new', { book: book, pageTitle: 'New Book', errors: err ? err.errors : [] });
        } else {
          console.log(err);
      }
      });
});

//Details of the book route
router.get('/:id', function(req, res, next) {
  Book.find({
    include: [
    {
      model: Loan,
        include: [Patron, Book]}
    ],
    where:
      {
        id: req.params.id
      }
    })
    .then(function(book) {
      let loans = book.Loans;
      res.render('books/book_detail', { book: book, loans: loans });
  });
});

//Books updates route
router.post('/:id', function(req, res, next){
  Book.find({
    include: [
    {
      model: Loan,
        include: [Patron, Book]}
    ],
    where:
      {
        id: req.params.id
      }
    })
    .then(function(book){
      return book.update(req.body);
  }).then(function(book){
    res.redirect('/books');
  }).catch(function(err){
    if(err.name === "SequelizeValidationError") {
      Book.find({
        include: [
        {
          model: Loan,
            include: [Patron, Book]}
        ],
        where:
          {
            id: req.params.id
          }
        })
        .then(function(book) {
          let loans = book.Loans;
          res.render('books/book_detail', { book: book, loans: loans, errors: err ? err.errors : [] });
      });
    } else {
      console.log(err);
    }
   });
});

module.exports = router;
