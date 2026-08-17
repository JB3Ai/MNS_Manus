import { COOKIE_NAME } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  activatePortalMember,
  getPortalMemberByEmail,
  listPortalDecisions,
  listPortalMembers,
  removePortalMember,
  savePortalDecision,
  savePortalMember,
} from "./db";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";

async function requirePortalAccess(user: { role: string; email: string | null }) {
  if (user.role === "admin") return { role: "admin" as const };
  if (!user.email) throw new TRPCError({ code: "FORBIDDEN", message: "No email is associated with this account" });
  const member = await getPortalMemberByEmail(user.email);
  if (!member) throw new TRPCError({ code: "FORBIDDEN", message: "This account has not been allocated an NMS portal seat" });
  await activatePortalMember(user.email);
  return { role: "decision_maker" as const, member };
}

const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  portal: router({
    access: protectedProcedure.query(async ({ ctx }) => {
      const access = await requirePortalAccess(ctx.user);
      const members = await listPortalMembers();
      return { access, members, seatLimit: 3 };
    }),
    saveMember: adminProcedure
      .input(
        z.object({
          email: z.string().email(),
          name: z.string().max(160).optional(),
          title: z.string().max(160).optional(),
          seatNumber: z.number().int().min(1).max(3),
        }),
      )
      .mutation(async ({ ctx, input }) =>
        savePortalMember({ ...input, invitedByUserId: ctx.user.id, status: "invited" }),
      ),
    removeMember: adminProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ input }) => {
        await removePortalMember(input.id);
        return { success: true } as const;
      }),
  }),
  decisions: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      await requirePortalAccess(ctx.user);
      return listPortalDecisions();
    }),
    save: protectedProcedure
      .input(
        z.object({
          area: z.string().min(1).max(80),
          selection: z.string().min(1).max(240),
          note: z.string().max(2000).optional(),
          status: z.enum(["draft", "approved", "needs_discussion"]),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        await requirePortalAccess(ctx.user);
        return savePortalDecision({ userId: ctx.user.id, ...input });
      }),
  }),
});

export type AppRouter = typeof appRouter;
