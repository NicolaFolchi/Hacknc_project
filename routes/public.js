let express = require("express");


let router = express.Router();

// Home page
router.get("/", (req, res) => {
  res.render("index");
});


module.exports = router;