import { mutation } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel"; // <-- Generated Convex types

export const store = mutation({
    args: {}, // no client-provided arguments
    handler: async (ctx): Promise<Id<"users">> => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Called storeUser without authentication present");
        }

        // Look up user by token
        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) =>
                q.eq("tokenIdentifier", identity.tokenIdentifier)
            )
            .unique();

        if (user) {
            // Always refresh lastActiveAt
            const updates: Partial<typeof user> = { lastActiveAt: Date.now() };

            // Update name if changed
            if (user.name !== identity.name) {
                updates.name = identity.name ?? "Anonymous";
            }

            await ctx.db.patch(user._id, updates);
            return user._id;
        }

        // Insert new user
        const newUserId = await ctx.db.insert("users", {
            name: identity.name ?? "Anonymous",
            tokenIdentifier: identity.tokenIdentifier,
            email: identity.email ?? "",
            imageUrl: identity.pictureUrl ?? "/default-avatar.png",
            plan: "free" as const,
            projectsUsed: 0,
            exportsThisMonth: 0,
            createdAt: Date.now(),
            lastActiveAt: Date.now(),
        });

        return newUserId;
    },
});
