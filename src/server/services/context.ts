/** Every owner-scoped service call receives the authenticated user's id. Never from the client. */
export type Ctx = { userId: string };
