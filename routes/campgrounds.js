var express = require("express");
var router  = express.Router();
var Campground = require("../models/campground");
var middleware = require("../middleware");
var NodeGeocoder = require('node-geocoder');
 
var options = {
  provider: 'google',
  httpAdapter: 'https',
  apiKey: process.env.GEOCODER_API_KEY,
  formatter: null
};
 
var geocoder = NodeGeocoder(options);
//INDEX ROUTE
router.get("/", function(req, res){
    //fuzzy search logic
    var noMatch = null;
    if(req.query.search){
        const regex = new RegExp(escapeRegex(req.query.search), 'gi');
        Campground.find({name:regex}, function(err, allCampgrounds){
            if(err){
                console.log(err);
            } else {
                if(allCampgrounds < 1) {
                    noMatch = "No campgrounds match that query, please try another one";
                }
               res.render("campgrounds/index",{campgrounds: allCampgrounds, noMatch: noMatch});
            }
         });
    } else {
        //get all camps from db
        Campground.find({}, function(err, allCampgrounds){
            if(err){
                console.log(err);
            } else {
                res.render("campgrounds/index", {campgrounds: allCampgrounds, noMatch: noMatch});
            }
        });
    }
});

//CREATE ROUTE
router.post("/", middleware.isLoggedIn, function(req, res){
    // get data from form and add to campgrounds array
    var price = req.body.price;
    var name = req.body.name;
    var image = req.body.image;
    var desc = req.body.description;
    var author = {
        id: req.user._id,
        username: req.user.username
    }
    //google maps location
    geocoder.geocode(req.body.location, function (err, data) {
        if (err || !data.length) {
          req.flash('error', 'Invalid address');
          return res.redirect('back');
        }
        var lat = data[0].latitude;
        var lng = data[0].longitude;
        var location = data[0].formattedAddress;
        var newCampground = {name: name, price:price, image: image, description: desc, author:author, location:location, lat:lat, lng:lng}
    // create and save to db
    Campground.create(newCampground, function(err, newlyCreated){
        if(err){
            console.log(err);
        } else {
            //redirect
            console.log(newlyCreated);
            res.redirect("/campgrounds");
        }
    });
}); });

//NEW ROUTE
router.get("/new", middleware.isLoggedIn, function(req, res){
   res.render("campgrounds/new"); 
});

// SHOW ROUTE
router.get("/:id", function(req, res){
    //find the campground with provided ID
    Campground.findById(req.params.id).populate("comments").exec(function(err, foundCampground){
        if(err || !foundCampground){
            req.flash("error", "campground not found");
            res.redirect("/campgrounds");
        } else {
            console.log(foundCampground)
            //render show template with that campground
            res.render("campgrounds/show", {campground: foundCampground});
        }
    });
});

// EDIT ROUTE
router.get("/:id/edit", middleware.checkCampgroundOwnership, function(req, res){
    Campground.findById(req.params.id, function(err, foundCampground){
        res.render("campgrounds/edit", {campground: foundCampground});
    });
});

// UPDATE ROUTE
router.put("/:id",middleware.checkCampgroundOwnership, function(req, res){
    //update google maps location
    geocoder.geocode(req.body.location, function (err, data) {
        if (err || !data.length) {
          req.flash("error", "Invalid address");
          return res.redirect("back");
        }
        var lat = data[0].latitude;
        var lng = data[0].longitude;
        var location = data[0].formattedAddress;
        var newData = {name: req.body.campground.name, image: req.body.image, description: req.body.description, location: location, lat: lat, lng: lng};
    // find and update the correct campground
    Campground.findByIdAndUpdate(req.params.id, req.body.campground, newData , function(err, updatedCampground){
        if(err){
            req.flash("error", err.message);
            res.redirect("back");
        } else {
            req.flash("success","Successfully Updated!");
            res.redirect("/campgrounds/" + campground._id);
        }
    });
}); });

// DESTROY ROUTE
router.delete("/:id",middleware.checkCampgroundOwnership, function(req, res){
    //find the camp ID and remove from db
   Campground.findByIdAndRemove(req.params.id, function(err){
      if(err){
          res.redirect("/campgrounds");
      } else {
          res.redirect("/campgrounds");
      }
   });
});
//fuzzy search function
function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

module.exports = router;

