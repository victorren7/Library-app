var express = require('express');
var router = express.Router();
var Book = require('../models').Book;
var Loan = require('../models').Loan;
var Patron = require('../models').Patron;
var moment = require('moment');

//All loans route
router.get('/', function(req, res, next) {
  Loan.findAll(
    {
     include: [Book, Patron]
   }
  ).then(function(loans) {
    res.render('loans/loans', { loans: loans, pageTitle: 'All Loans' });
  });
});

//Checked out loans route
router.get('/out', function(req, res, next) {
  Loan.findAll(
    {
     include: [Book, Patron],
     where: { returned_on: null }
    }
  )
    .then(function(loans) {
      res.render('loans/loans', { loans: loans, pageTitle: 'Checked Out' });
    })
});

//Overdue loans route
router.get('/overdue', function(req, res, next) {
  Loan.findAll(
    {
     include: [Book, Patron],
     where: {
       returned_on: null,
       return_by: { $lt: Date.now() }
       }
    }
  )
    .then(function(loans) {
      res.render('loans/loans', { loans: loans, pageTitle: 'Overdue' });
    })
});

//Update loan route
router.get('/return:id', function(req, res, next) {
  Loan.find(
    {
     include: [Book, Patron],
     where: { id: req.params.id },
   }
  ).then(function(loan) {
    loan.returned_on = moment().format('YYYY-MM-DD');
    res.render('loans/return_book', { loan: loan, pageTitle: 'Return Book' });
  });
});

//Post update loan route
router.post('/return:id', function(req, res, next) {
  Loan.find({
     include: [Book, Patron],
     where:
      {
        id: req.params.id
      }
    }).then(function(loan) {
        loan.returned_on = req.body.returned_on;
        loan.save().then(function(loan) {
            res.redirect('/loans');
        }).catch(function(err) {
          if(err.name === "SequelizeValidationError") {
            Loan.find(
              {
               include: [Book, Patron],
               where: { id: req.params.id },
             }
            ).then(function(loan) {
              loan.returned_on = moment().format('YYYY-MM-DD');
              res.render('loans/return_book', { loan: loan, pageTitle: 'Return Book', errors: err ? err.errors : [] });
          });
         } else {
            console.log(err);
          }
        });
    });
});

//New loan route
router.get('/new', function(req, res, next) {
  let loan = Loan.build({
    loaned_on: moment().format('YYYY-MM-DD'),
    return_by: moment().add(7, 'days').format('YYYY-MM-DD')
  });
  Book.findAll().then(function(books) {
    let allBooks = books;
    Patron.findAll().then(function(patrons) {
      res.render('loans/loans_new.pug', { books: allBooks, patrons: patrons, loan: loan, pageTitle: 'New Loan' });
    });
  });
});

//Post new loan route
router.post('/', function(req, res, next) {
  Loan.create(req.body)
      .then(function(loan) {
        res.redirect('/loans');
      })
      .catch(function(err) {
        if(err.name === "SequelizeValidationError") {
          let loan = Loan.build({
            loaned_on: moment().format('YYYY-MM-DD'),
            return_by: moment().add(7, 'days').format('YYYY-MM-DD')
          });
          Book.findAll().then(function(books) {
            let allBooks = books;
            Patron.findAll().then(function(patrons) {
              res.render('loans/loans_new.pug', { books: allBooks, patrons: patrons, loan: loan, pageTitle: 'New Loan', errors: err ? err.errors : [] });
            });
          });
        } else {
        console.log(err);
      }
      });
});

module.exports = router;
