var express = require("express");
var router  = express.Router();
var passport = require("passport");
var User = require("../models/user");

//root route
router.get("/", function(req, res){
    res.render("landing");
    console.log("process.env.GEOCODER_API_KEY is " + process.env.GEOCODER_API_KEY); 
});
// show register form
router.get("/register", function(req, res){
    res.render("register", {page: "register"}); 
 });

//handle sign up logic
router.post("/register", function(req, res){
    const captcha = req.body["g-recaptcha-response"];
    if (!captcha) {
      console.log(req.body);
      req.flash("error", "Please select captcha");
      return res.redirect("/register");
    }
    // secret key
    var secretKey = process.env.CAPTCHA;
    // Verify URL
    var verifyURL = "https://www.google.com/recaptcha/api/siteverify?secret=${secret}&response=${captcha}&remoteip=${req.connection.remoteAddress}";
    // Make request to Verify URL
    request.get(verifyURL, (err, response, body) => {
      // if not successful
      if (body.success !== undefined && !body.success) {
        req.flash("error", "Captcha Failed");
        return res.redirect("/register");
      }

    var newUser = new User({username: req.body.username});
    if(req.body.adminCode === "secretcode12") {
        newUser.isAdmin = true;
    }
    User.register(newUser, req.body.password, function(err, user){
        if(err){
            console.log(err);
            return res.render("register", {error: err.message});
        }
        passport.authenticate("local")(req, res, function(){
           req.flash("success", "Successfully Signed Up! Nice to meet you " + req.body.username);
           res.redirect("/campgrounds"); 
        });
    });
}); });

//show login form
router.get("/login", function(req, res){
    res.render("login", {page: "login"}); 
 });

//handling login logic
router.post("/login", passport.authenticate("local", 
    {
        successRedirect: "/campgrounds",
        failureRedirect: "/login"
    }), function(req, res){
});

// logout route
router.get("/logout", function(req, res){
   req.logout();
   req.flash("success", "Logged you out!");
   res.redirect("/campgrounds");
});



module.exports = router;