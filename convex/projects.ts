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

// Get a single project by ID
export const getProject = query({
    args: { projectId: v.id("projects") },
    handler: async (ctx, args) => {
        const user = await ctx.runQuery(api.users.getCurrentUser);

        const project = await ctx.db.get(args.projectId);
        if (!project) {
            throw new Error("Project not found");
        }

        if (!user || project.userId !== user._id) {
            throw new Error("Access denied");
        }

        return project;
    },
});

// Update project canvas state and metadata
export const updateProject = mutation({
    args: {
        projectId: v.id("projects"),
        canvasState: v.optional(v.any()),
        width: v.optional(v.number()), // ← Add this
        height: v.optional(v.number()), // ← Add this
        currentImageUrl: v.optional(v.string()),
        thumbnailUrl: v.optional(v.string()),
        activeTransformations: v.optional(v.string()),
        backgroundRemoved: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const user = await ctx.runQuery(api.users.getCurrentUser);

        const project = await ctx.db.get(args.projectId);
        if (!project) {
            throw new Error("Project not found");
        }

        if (!user || project.userId !== user._id) {
            throw new Error("Access denied");
        }

        // Update the project
        const updateData: Partial<typeof project> = {
            updatedAt: Date.now(),
        };

        // Only update provided fields
        if (args.canvasState !== undefined)
            updateData.canvasState = args.canvasState;
        if (args.width !== undefined) updateData.width = args.width;
        if (args.height !== undefined) updateData.height = args.height;
        if (args.currentImageUrl !== undefined)
            updateData.currentImageUrl = args.currentImageUrl;
        if (args.thumbnailUrl !== undefined)
            updateData.thumbnailUrl = args.thumbnailUrl;
        if (args.activeTransformations !== undefined)
            updateData.activeTransformations = args.activeTransformations;
        if (args.backgroundRemoved !== undefined)
            updateData.backgroundRemoved = args.backgroundRemoved;

        await ctx.db.patch(args.projectId, updateData);

        // Update user's last active time
        await ctx.db.patch(user._id, {
            lastActiveAt: Date.now(),
        });

        return args.projectId;
    },
});
