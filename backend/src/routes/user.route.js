import { Router } from "express";

const router = Router();

router.route("/profile").post((req, res) => {
    res.send("User Profile Route");
});

export default router;