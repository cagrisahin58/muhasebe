import { router } from "./trpc.js";
import { authRouter } from "./auth.js";
import { accountsRouter } from "./accounts.js";
import { journalRouter } from "./journal.js";
import { contactsRouter } from "./contacts.js";
import { reportsRouter } from "./reports.js";

export const appRouter = router({
  auth: authRouter,
  accounts: accountsRouter,
  journal: journalRouter,
  contacts: contactsRouter,
  reports: reportsRouter,
});

export type AppRouter = typeof appRouter;
