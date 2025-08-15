import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const uploadPhoto = mutation({
  args: {
    roomId: v.id("rooms"),
    userId: v.id("users"),
    storageId: v.id("_storage"),
    originalName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const photoId = await ctx.db.insert("photos", {
      roomId: args.roomId,
      userId: args.userId,
      storageId: args.storageId,
      originalName: args.originalName,
      uploadedAt: Date.now(),
    });

    return photoId;
  },
});

export const getUserPhotos = query({
  args: {
    roomId: v.id("rooms"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("photos")
      .withIndex("by_room_user", (q) => 
        q.eq("roomId", args.roomId).eq("userId", args.userId)
      )
      .collect();
  },
});

export const getRoomPhotos = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("photos")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .collect();
  },
});

export const getRoomPhotoStatus = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const roomPlayers = await ctx.db
      .query("roomPlayers")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .collect();

    const playersWithPhotos = await Promise.all(
      roomPlayers.map(async (player) => {
        const photos = await ctx.db
          .query("photos")
          .withIndex("by_room_user", (q) => 
            q.eq("roomId", args.roomId).eq("userId", player.userId)
          )
          .collect();

        const user = await ctx.db.get(player.userId);
        return {
          userId: player.userId,
          username: user?.username,
          hasPhotos: photos.length > 0,
          photoCount: photos.length,
        };
      })
    );

    const totalPlayers = roomPlayers.length;
    const playersReady = playersWithPhotos.filter(p => p.hasPhotos).length;

    return {
      totalPlayers,
      playersReady,
      allReady: playersReady === totalPlayers && totalPlayers > 1,
      players: playersWithPhotos,
    };
  },
});

// Fonction interne réutilisable pour supprimer les photos d'une room
export async function deleteRoomPhotosInternal(ctx: any, roomId: any): Promise<number> {
  const photos = await ctx.db
    .query("photos")
    .withIndex("by_room", (q: any) => q.eq("roomId", roomId))
    .collect();

  for (const photo of photos) {
    await ctx.storage.delete(photo.storageId);
    await ctx.db.delete(photo._id);
  }

  return photos.length;
}

export const deleteRoomPhotos = mutation({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const deletedCount = await deleteRoomPhotosInternal(ctx, args.roomId);
    return { deletedCount };
  },
});

export const getPhotoUrl = query({
  args: { photoId: v.id("photos") },
  handler: async (ctx, args) => {
    const photo = await ctx.db.get(args.photoId);
    if (!photo) {
      return null;
    }

    const url = await ctx.storage.getUrl(photo.storageId);
    
    return {
      ...photo,
      url,
    };
  },
});
