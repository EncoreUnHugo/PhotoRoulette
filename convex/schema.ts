import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    username: v.string(),
  }).index("by_username", ["username"]),

  rooms: defineTable({
    code: v.string(),
    hostUserId: v.id("users"),
    status: v.union(v.literal("waiting"), v.literal("playing"), v.literal("finished")),
    maxPlayers: v.number(),
    numberOfRounds: v.number(),
    createdAt: v.number(),
  }).index("by_code", ["code"]),

  roomPlayers: defineTable({
    roomId: v.id("rooms"),
    userId: v.id("users"),
    status: v.union(v.literal("joined"), v.literal("ready"), v.literal("playing")),
    joinedAt: v.number(),
  })
    .index("by_room", ["roomId"])
    .index("by_user", ["userId"])
    .index("by_room_user", ["roomId", "userId"]),

  photos: defineTable({
    roomId: v.id("rooms"),
    userId: v.id("users"),
    storageId: v.id("_storage"), 
    originalName: v.optional(v.string()),
    uploadedAt: v.number(),
  })
    .index("by_room", ["roomId"])
    .index("by_user", ["userId"])
    .index("by_room_user", ["roomId", "userId"]),

  gameRounds: defineTable({
    roomId: v.id("rooms"),
    roundNumber: v.number(),
    photoId: v.id("photos"),
    photoOwnerId: v.id("users"),
    status: v.union(v.literal("active"), v.literal("finished")),
    startedAt: v.number(),
    timeLimit: v.number(), 
  }).index("by_room", ["roomId"]),

  playerAnswers: defineTable({
    roundId: v.id("gameRounds"),
    playerId: v.id("users"),
    guessedUserId: v.id("users"), 
    isCorrect: v.boolean(),
    answeredAt: v.number(),
    timeToAnswer: v.number(), 
  })
    .index("by_round", ["roundId"])
    .index("by_player", ["playerId"]),

  scores: defineTable({
    roomId: v.id("rooms"),
    userId: v.id("users"),
    totalScore: v.number(),
    correctAnswers: v.number(),
    incorrectAnswers: v.number(),
    averageResponseTime: v.number(),
  })
    .index("by_room", ["roomId"])
    .index("by_user", ["userId"])
    .index("by_room_user", ["roomId", "userId"]),
});
