import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    users: defineTable({
        name: v.string(),
        email: v.string(), // Optional for providers that don't return it
        tokenIdentifier: v.string(), // Clerk user ID for auth
        imageUrl: v.optional(v.string()), // Profile picture

        // Subscription plan
        plan: v.union(v.literal("free"), v.literal("pro")),

        // Usage tracking
        projectsUsed: v.number(),
        exportsThisMonth: v.number(),

        // Activity tracking
        createdAt: v.number(),
        lastActiveAt: v.number(),
    })
        .index("by_token", ["tokenIdentifier"])
        .index("by_email", ["email"])
        .searchIndex("search_name", { searchField: "name" })
        .searchIndex("search_email", { searchField: "email" }),
});
