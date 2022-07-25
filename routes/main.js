const express = require('express');
const router = express.Router();
const flashMessage = require('../helpers/messenger');
const Classes = require('../models/Classes');
const ensureAuthenticated = require("../helpers/auth");
const courses = require("./courses");
const User = require('../models/User');

router.get('/', (req, res) => {
    const title = 'Ginseng and Stitch';
    // renders views/index.handlebars, passing title as an object
    res.render('index', { title: title })
});

router.get('/about', (req, res) => {
    res.render('about');
});

router.use('/courses', courses)

router.get('/courses', (req, res) => {
    res.render('courses');
});

// WITHOUT ADMIN -> CLASSES
router.get('/class', (req, res) => {
    Classes.findAll({
        where: { userId: req.user.id },
        raw: true
    })
        .then((classes) => {
            res.render('class', { classes });
        })
        .catch(err => console.log(err));
});

router.get('/contactUs', (req, res) => {
    res.render('contactUs');
});

module.exports = router;