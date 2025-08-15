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



export const joinRoom = mutation({
    args: {
        roomCode: v.string(),
        userId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const room = await ctx.db
            .query("rooms")
            .withIndex("by_code", (q) => q.eq("code", args.roomCode))
            .first();

        if (!room) throw new Error("Room not found");

        if (room.status !== "waiting") throw new Error("Room is not accepting new players");

        const user = await ctx.db.get(args.userId);
        if (!user) throw new Error("User not found");

        await ctx.db.insert("roomPlayers", {
            roomId: room._id,
            userId: user._id,
            status: "joined",
            joinedAt: Date.now(),
        });

        return room;
    }
})