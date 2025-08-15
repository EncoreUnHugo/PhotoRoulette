import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { deleteRoomPhotosInternal } from "./photos";

export const startRound = mutation({
  args: {
    roomId: v.id("rooms"),
    roundNumber: v.number(),
    timeLimit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const roomPhotos = await ctx.db
      .query("photos")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .collect();

    if (roomPhotos.length === 0) {
      throw new Error("No photos available for this room");
    }

    const randomPhoto = roomPhotos[Math.floor(Math.random() * roomPhotos.length)];

    const roundId = await ctx.db.insert("gameRounds", {
      roomId: args.roomId,
      roundNumber: args.roundNumber,
      photoId: randomPhoto._id,
      photoOwnerId: randomPhoto.userId,
      status: "active",
      startedAt: Date.now(),
      timeLimit: args.timeLimit || 30, 
    });

    return await ctx.db.get(roundId);
  },
});

export const getActiveRound = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const activeRound = await ctx.db
      .query("gameRounds")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .first();

    if (!activeRound) {
      return null;
    }

    const photo = await ctx.db.get(activeRound.photoId);
    const photoOwner = await ctx.db.get(activeRound.photoOwnerId);

    return {
      ...activeRound,
      photo,
      photoOwner,
    };
  },
});

export const endGameAndCleanup = mutation({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    // 1. Marquer la room comme terminée
    const room = await ctx.db.get(args.roomId);
    if (room) {
      await ctx.db.patch(args.roomId, { status: "finished" });
    }

    // 2. Supprimer toutes les photos (utilise la fonction commune)
    const deletedPhotosCount = await deleteRoomPhotosInternal(ctx, args.roomId);

    const rounds = await ctx.db
      .query("gameRounds")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .collect();

    for (const round of rounds) {
      await ctx.db.delete(round._id);
    }

    const answers = await ctx.db
      .query("playerAnswers")
      .collect();

    for (const answer of answers) {
      const round = rounds.find(r => r._id === answer.roundId);
      if (round) {
        await ctx.db.delete(answer._id);
      }
    }

    const scores = await ctx.db
      .query("scores")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .collect();

    for (const score of scores) {
      await ctx.db.delete(score._id);
    }

    const roomPlayers = await ctx.db
      .query("roomPlayers")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .collect();

    for (const player of roomPlayers) {
      await ctx.db.patch(player._id, { status: "joined" });
    }

    return {
      message: "Game ended and data cleaned up",
      deletedPhotos: deletedPhotosCount,
      deletedRounds: rounds.length,
      deletedScores: scores.length,
    };
  },
});

export const submitAnswer = mutation({
  args: {
    roundId: v.id("gameRounds"),
    playerId: v.id("users"),
    guessedUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const round = await ctx.db.get(args.roundId);
    if (!round || round.status !== "active") {
      throw new Error("Round is not active");
    }

    const existingAnswer = await ctx.db
      .query("playerAnswers")
      .withIndex("by_round", (q) => q.eq("roundId", args.roundId))
      .filter((q) => q.eq(q.field("playerId"), args.playerId))
      .first();

    if (existingAnswer) {
      throw new Error("Player has already answered this round");
    }

    const isCorrect = args.guessedUserId === round.photoOwnerId;
    
    const timeToAnswer = Date.now() - round.startedAt;

    const answerId = await ctx.db.insert("playerAnswers", {
      roundId: args.roundId,
      playerId: args.playerId,
      guessedUserId: args.guessedUserId,
      isCorrect,
      answeredAt: Date.now(),
      timeToAnswer,
    });

    return {
      answerId,
      isCorrect,
      timeToAnswer,
    };
  },
});
