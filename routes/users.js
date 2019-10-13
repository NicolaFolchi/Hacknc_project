let express = require("express");


let router = express.Router();

// Log a user out
router.get("/logout", function(req, res) {
  req.logout();
  res.redirect("/");
});


module.exports = router;