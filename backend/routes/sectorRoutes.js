const express = require("express");
const {
  getAllSectors,
  createSector,
  updateSector,
  deleteSector,
} = require("../controllers/industrycontroller");

const router = express.Router();

router.get("/", getAllSectors);
router.post("/", createSector);
router.put("/:id", updateSector);
router.delete("/:id", deleteSector);

module.exports = router;
