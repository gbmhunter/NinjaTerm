import {initTRPC} from '@trpc/server';
import * as z from 'zod';
// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-unsafe-assignment
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment

const t = initTRPC.create({
});

export const appRouter = t.router({
  users: t.procedure
    .query(() => {
      return 'hello';
    }),
  userById: t.procedure
    .input((val: unknown) => {
      if (typeof val !== 'number') {
        throw new Error('invalid input');
      }
      return val;
    })
    .query(({input: id}) => {
      return 'hello';
    }),
  userCreate: t.procedure
    .input(z.object({
      name: z.string(),
      dateCreated: z.date(),
    }))
    .mutation(async ({input: {name, dateCreated}}) => {
      console.log("Creating user on ", dateCreated.toLocaleString());
      const user = await 'hello';
      return user;
    })
});

export type AppRouter = typeof appRouter;
