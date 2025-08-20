import { mutation, query } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { Doc } from "./_generated/dataModel";
import { v } from "convex/values";

// plan limits
const PLAN_LIMITS: Record<string, number | typeof Infinity> = {
    free: 3,
    pro: Infinity,
};

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

// Create a new project
export const create = mutation({
    args: {
        title: v.string(),
        originalImageUrl: v.optional(v.string()),
        currentImageUrl: v.optional(v.string()),
        thumbnailUrl: v.optional(v.string()),
        width: v.number(),
        height: v.number(),
        canvasState: v.optional(v.any()),
    },
    handler: async (ctx, args): Promise<Id<"projects">> => {
        // Get current user (typed)
        const user = await ctx.runQuery(api.users.getCurrentUser);

        if (!user) {
            throw new Error("Not authenticated");
        }

        // Enforce plan limits
        const limit = PLAN_LIMITS[user.plan] ?? Infinity;
        if (limit !== Infinity) {
            const projects = await ctx.db
                .query("projects")
                .withIndex("by_user", (q) => q.eq("userId", user._id))
                .collect();

            if (projects.length >= limit) {
                throw new Error(
                    `Your plan allows only ${limit} projects. Upgrade to Pro for unlimited projects.`
                );
            }
        }

        // Create project
        const now = Date.now();
        const projectId = await ctx.db.insert("projects", {
            title: args.title,
            userId: user._id,
            originalImageUrl: args.originalImageUrl,
            currentImageUrl: args.currentImageUrl,
            thumbnailUrl: args.thumbnailUrl,
            width: args.width,
            height: args.height,
            canvasState: args.canvasState,
            createdAt: now,
            updatedAt: now,
        });

        // Update user record
        await ctx.db.patch(user._id, {
            projectsUsed: (user.projectsUsed ?? 0) + 1,
            lastActiveAt: now,
        });

        return projectId;
    },
});
