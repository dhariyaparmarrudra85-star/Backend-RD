import { Router } from 'express';
import {
    getSubscribedChannels,
    getUserChannelSubscribers,
    toggleSubscription,
} from "../controllers/subscription.controller.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"

const router = Router();
router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router.route("/toggle/:channelId").post(toggleSubscription);

router.route("/channel/:channelId").get(getUserChannelSubscribers)

router.route("/subscribed/:subscriberId").get(getSubscribedChannels);

export default router