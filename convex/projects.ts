import { query } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { Doc } from "./_generated/dataModel";

export const getUserProjects = query({
    handler: async (ctx): Promise<Doc<"projects">[]> => {
        const user = await ctx.runQuery(api.users.getCurrentUser);

        if (!user) {
            throw new Error("Not authenticated");
        }

        // Query projects belonging to this user, ordered by last update
        const projects = await ctx.db
            .query("projects")
            .withIndex("by_user_updated", (q) =>
                q.eq("userId", user._id as Id<"users">)
            )
            .order("desc")
            .collect();

        return projects;
    },
});
