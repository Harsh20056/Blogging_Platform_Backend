import express from "express";
import { SearchController } from "../controllers/search.controller.js";

const router = express.Router();
const ctrl = new SearchController();

// Public route for searching and sorting posts
router.get("/", ctrl.search);

export default router;
