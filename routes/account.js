const express = require('express');
const router = express.Router();
const flashMessage = require('../helpers/messenger');
const User = require('../models/User');
const Booking = require('../models/Booking');
const Class = require('../models/Class');
const Course = require('../models/Course');
const bcrypt = require('bcryptjs');
const passport = require('passport');
const ensureAuthenticated = require('../helpers/auth');
const randtoken = require('rand-token');
const nodemailer = require("nodemailer");

function sendEmail(email, token) {
    var email = email;
    var token = token;
    let mail = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'skylarhiyagaming@gmail.com', // Your email id
            pass: 'mjbtqsqqdkhoeptc' // Your password
        }
    });
    var mailOptions = {
        from: 'skylarhiyagaming@gmail.com',
        to: email,
        subject: 'Reset Password Link - Ginseng and stitch',
        html: '<p>You requested for reset password, kindly use this <a href="http://localhost:5000/reset-password?token=' + token + '">link</a> to reset your password</p>'
    };
    mail.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.log(1)
        } else {
            console.log(0)
        }
    });
}
/* home page */
router.get('/', ensureAuthenticated, async (req, res) => {
    const bookings = await Booking.findAll({ where: { userId: req.user.id }, include: [{ model: Class }, { model: Course }] });
    // console.log(JSON.stringify(bookings))
    res.render('account/account', { bookings })
});

router.get('/login', (req, res) => {
    res.render('account/login');
});

router.get('/register', (req, res) => {
    res.render('account/register');
});

router.post('/register', async function (req, res) {
    let { name, email, password, password2 } = req.body;

    let isValid = true;
    if (password.length < 6) {
        flashMessage(res, 'error', 'Password must be at least 6 characters');
        isValid = false;
    }
    if (password != password2) {
        flashMessage(res, 'error', 'Passwords do not match');
        isValid = false;
    }
    if (!isValid) {
        res.render('account/register', {
            name,
            email
        });
        return;
    }

    try {
        // If all is well, checks if user is already registered
        let user = await User.findOne({ where: { email: email } });
        if (user) {
            // If user is found, that means email has already been registered
            flashMessage(res, 'error', email + ' already registered');
            res.render('account/register', {
                name,
                email
            });
        } else {
            // Create new user record 
            var salt = bcrypt.genSaltSync(10);
            var hash = bcrypt.hashSync(password, salt);
            // Use hashed password

            let user = await User.create({ name, email, password: hash });
            flashMessage(res, 'success', email + ' registered successfully');
            res.redirect('/account/login');
        }
    } catch (err) {
        console.log(err);
    }
});

router.post('/login',
    passport.authenticate('local', {
        failureRedirect: '/account/login',
        failureFlash: true,
    }), (req, res) => {
        if (req.user.role === 'a') {
            console.log(req.user)
            res.redirect('/admin');
        }
        else if (req.user.role === 'u') {
            console.log(req.user)
            res.redirect('/account');
        }
    });

router.get('/resetPassword', (req, res) => {
    res.render('account/resetPassword');
});

router.post('/sendEmail', async function (req, res) {
    console.log("wow");
    var email = req.body.email;
    try {
        const user = await User.findOne({ where: { email: email } })
        if (!user) {
            flashMessage(res, 'error', 'The Email is not registered with us');
            res.redirect('/account/register')
        }
        else {
            var token = randtoken.generate(20);
            var sent = sendEmail(email, token);
            var data = {
                token: token
            };
            user.update({ token: token });
            flashMessage(res, 'success', 'Email sent');
            res.redirect('/');
        }
    }
    catch (err) {
        console.log(err);
    }
});

router.get('/logout', (req, res, next) => {
    req.logout(function (err) {
        if (err) { return next(err); }
        res.redirect('/');
        console.log("User logged out successfully");
        flashMessage(res, 'success', ' logged out successfully');
    });
});

router.post('/editUser/:id', ensureAuthenticated, (req, res) => {
    console.log(JSON.stringify(req.body));
    let name = req.body.name;
    let email = req.body.email;
    console.log(name);
    console.log(email);
    User.update({ name, email }, { where: { id: req.params.id } })
        .then((result) => {
            console.log(result[0] + ' account updated');
            res.redirect('/account');
        })
        .catch(err => console.log(err));
});

router.post('/changePassword/:id', ensureAuthenticated, async (req, res) => {
    console.log("L")
    let { oldPassword, newPassword, newPassword2 } = req.body;
    var hashOld = bcrypt.hashSync(oldPassword, salt);
    let isValid = true;
    if (hashOld != req.user.password) {
        flashMessage(res, 'error', 'Old password is wrong');
        isValid = false;
    }
    if (newPassword.length < 6) {
        flashMessage(res, 'error', 'Password must be at least 6 characters');
        isValid = false;
    }
    if (newPassword != newPassword2) {
        flashMessage(res, 'error', 'Passwords do not match');
        isValid = false;
    }
    if (!isValid) {
        res.redirect('/account');
        return;
    }
    try {
        var salt = bcrypt.genSaltSync(10);
        var hash = bcrypt.hashSync(newPassword, salt);
        // If all is well, checks if user is already registered
        let check = await User.findOne({ where: { password: hash } });
        if (check) {
            // If user is found, that means email has already been registered
            flashMessage(res, 'error', ' current password is wrong');
            res.redirect('/account')
        } else {
            // Create new user record 
            // Use hashed password
            User.update({ password: hash }, { where: { id: req.params.id } })
                .then((result) => {
                    console.log(result[0] + ' account updated');
                    flashMessage(res, 'success', ' Password changed successfully!');
                    res.redirect('/account');
                })
                .catch(err => console.log(err));
        }
    } catch (err) {
        console.log(err);
    }

});

module.exports = router;