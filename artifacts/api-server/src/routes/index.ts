import { Router, type IRouter } from "express";
import healthRouter from "./health";
import dashboardRouter from "./dashboard";
import partnersRouter from "./partners";
import endpointsRouter from "./endpoints";
import documentsRouter from "./documents";
import notificationsRouter from "./notifications";
import as2Router from "./as2";

const router: IRouter = Router();

router.use(healthRouter);
router.use(dashboardRouter);
router.use(partnersRouter);
router.use(endpointsRouter);
router.use(documentsRouter);
router.use(notificationsRouter);
router.use(as2Router);

export default router;
