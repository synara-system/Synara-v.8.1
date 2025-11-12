import { publicProcedure, router } from "/server/trpc/trpc";

export const healthRouter = router({
  healthcheck: publicProcedure.query(() => {
    return {
      status: "ok",
      message: "Synara System API is healthy.",
    };
  }),
});
