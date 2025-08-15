import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const generateRoomCode : () => string = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export const createRoom = mutation({
    args: {
        hostUserId: v.id("users"),
        status: v.union(v.literal("waiting"), v.literal("playing"), v.literal("finished")),
        maxPlayers: v.number(),
        numberOfRounds: v.number(),
    },
    handler: async (ctx, args) => {
        const room = await ctx.db.insert("rooms", {
            code: generateRoomCode(),
            hostUserId: args.hostUserId,
            status: args.status,
            maxPlayers: args.maxPlayers,
            numberOfRounds: args.numberOfRounds,
            createdAt: Date.now(),
        });
        return await ctx.db.get(room);
    }
})

