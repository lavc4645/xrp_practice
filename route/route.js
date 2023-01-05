const express = require("express");
const router = express.Router();
const batchcontroller = require("../controller/batchminting");

// router.get("/setminter", batchcontroller.setMinter);
router.get("/getsequence", batchcontroller.account_info);

module.exports = router;
