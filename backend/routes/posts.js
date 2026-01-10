import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import prisma from "../config/prisma.js";
import multer from "multer";
import { uploadPostMedia } from "../middleware/postMedia.js";
import fs from "fs";
import path from "path";

const router = express.Router();
const MEDIA_STORAGE_PATH = process.env.MEDIA_STORAGE_PATH || "/var/www/media_uploads";

// --- Helper: Get Author Info ---
const getAuthorInfo = async (id, role) => {
  let author = null;
  role = role.toLowerCase();
  try {
    switch (role) {
      case "student":
        author = await prisma.student.findUnique({
          where: { id },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePicture: true,
            email: true,
          },
        });
        if (author)
          author.fullName = `${author.firstName || ""} ${
            author.lastName || ""
          }`.trim();
        break;
      case "college":
        author = await prisma.college.findUnique({
          where: { id },
          select: { id: true, name: true, profilePicture: true, email: true },
        });
        if (author) author.fullName = author.name;
        break;
      case "industry":
        author = await prisma.industry.findUnique({
          where: { id },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            companyName: true,
            profilePicture: true,
            email: true,
          },
        });
        if (author)
          author.fullName =
            author.companyName ||
            `${author.firstName || ""} ${author.lastName || ""}`.trim();
        break;
      case "startup":
        author = await prisma.startup.findUnique({
          where: { id },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            startupName: true,
            profilePicture: true,
            email: true,
          },
        });
        if (author)
          author.fullName =
            author.startupName ||
            `${author.firstName || ""} ${author.lastName || ""}`.trim();
        break;
      case "alumni":
        author = await prisma.alumni.findUnique({ where: { id } });
        if (author) author.fullName = "Alumni User";
        break;
    }
  } catch (err) {
    console.error("getAuthorInfo error:", err);
  }
  return author;
};

// --- Helper: Add Reactions/Comments/Shares ---
const addInteractionData = async (posts, currentUserId, currentUserRole) => {
  return Promise.all(
    posts.map(async (post) => {
      const reactionCount = await prisma.post_reactions.count({
        where: { post_id: post.post_id },
      });
      const commentCount = await prisma.post_comments.count({
        where: { post_id: post.post_id },
      });
      const shareCount = await prisma.post_shares.count({
        where: { post_id: post.post_id },
      });

      const userReaction = await prisma.post_reactions.findFirst({
        where: {
          post_id: post.post_id,
          [`${currentUserRole.toLowerCase()}_id`]: currentUserId,
        },
      });

      return {
        ...post,
        reaction_count: reactionCount,
        comment_count: commentCount,
        share_count: shareCount,
        liked: !!userReaction,
        user_reaction_type: userReaction?.reaction_type || null,
      };
    })
  );
};

/* ================================
   UPLOAD MEDIA TO EXISTING POST
================================ */
router.post(
  "/:postId/media",
  authMiddleware,
  uploadPostMedia.array("media"),
  async (req, res) => {
    const { postId } = req.params;
    const userId = req.user.id;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No files uploaded" });
    }

    const mediaRecords = await prisma.post_media.createMany({
      data: req.files.map((f) => ({
        post_id: parseInt(postId),
        media_url: `/media/posts/${userId}/${f.filename}`,
        media_type: f.mimetype.startsWith("image")
          ? "image"
          : f.mimetype.startsWith("video")
          ? "video"
          : "file",
      })),
    });

    res.json({ success: true, media: mediaRecords });
  }
);

/* ================================
   CREATE NEW POST
================================ */
router.post(
  "/",
  authMiddleware,
  uploadPostMedia.array("media"),
  async (req, res) => {
    try {
      const { id: userId, role } = req.user;
      const content = req.body.content?.trim();

      if (!content && (!req.files || req.files.length === 0)) {
        return res.status(400).json({
          message: "Post must contain text or media.",
        });
      }

      const post = await prisma.post.create({
        data: {
          content,
          authorId: userId,
          student_id: userId,
          authorType: role.toUpperCase(),
          post_media: {
            create:
              req.files?.map((f) => ({
                media_url: `/media/posts/${userId}/${f.filename}`,
                media_type: f.mimetype.startsWith("image")
                  ? "image"
                  : f.mimetype.startsWith("video")
                  ? "video"
                  : "file",
              })) || [],
          },
        },
        include: {
          post_media: true,
        },
      });

      res.status(201).json({ success: true, post });
    } catch (err) {
      console.error("Create post error:", err);
      res.status(500).json({
        message: "Failed to create post",
        error: err.message,
      });
    }
  }
);

/* ================================
   DELETE POST
================================ */
router.delete("/:postId", authMiddleware, async (req, res) => {
  const { postId } = req.params;
  const { id: userId } = req.user;

  try {
    const post = await prisma.post.findUnique({
      where: { post_id: Number(postId) },
      include: { post_media: true },
    });

    if (!post) return res.status(404).json({ message: "Post not found" });
    if (post.authorId !== userId)
      return res.status(403).json({ message: "Unauthorized" });

    // Delete media files from disk
    for (const media of post.post_media) {
      const filePath = path.join(MEDIA_STORAGE_PATH, media.media_url.replace('/media/', ''));
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await prisma.post.delete({ where: { post_id: Number(postId) } });
    res.json({ success: true, message: "Post deleted" });
  } catch (err) {
    console.error("Delete post error:", err);
    res
      .status(500)
      .json({ message: "Failed to delete post", error: err.message });
  }
});

/* ================================
   GET ALL POSTS (FEED)
================================ */
router.get("/", authMiddleware, async (req, res) => {
  try {
    const { id: userId, role } = req.user;
    const { limit = 10, offset = 0 } = req.query;

    const posts = await prisma.post.findMany({
      take: parseInt(limit),
      skip: parseInt(offset),
      orderBy: { createdAt: "desc" },
      include: { post_media: true, post_polls: true },
    });

    const enhancedPosts = await Promise.all(
      posts.map(async (p) => {
        const author = await getAuthorInfo(p.authorId, p.authorType);

        return {
          ...p,
          author,
          media: p.post_media.map((m) => ({
            ...m,
            media_url: m.media_url.startsWith("http")
              ? m.media_url
              : `${process.env.API_BASE_URL}${m.media_url}`,
          })),
          pollMedia: p.post_polls.map((poll) => ({
            ...poll,
            media_url: poll.media_url
              ? poll.media_url.startsWith("http")
                ? poll.media_url
                : `${process.env.API_BASE_URL}${poll.media_url}`
              : null,
          })),
        };
      })
    );

    const postsWithInteractions = await addInteractionData(
      enhancedPosts,
      userId,
      role
    );

    res.status(200).json({
      success: true,
      data: postsWithInteractions,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: postsWithInteractions.length,
      },
    });
  } catch (err) {
    console.error("Get posts error:", err);
    res
      .status(500)
      .json({ message: "Failed to get posts", error: err.message });
  }
});

/* ================================
   GET SINGLE POST BY ID
================================ */
router.get("/:postId", authMiddleware, async (req, res) => {
  const postId = Number(req.params.postId);

  if (!postId || isNaN(postId)) {
    return res.status(400).json({ message: "Invalid post ID" });
  }

  try {
    const post = await prisma.post.findUnique({
      where: { post_id: postId },
      include: { post_media: true },
    });

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const author = await getAuthorInfo(post.authorId, post.authorType);

    res.json({
      success: true,
      post: {
        ...post,
        author,
        media: post.post_media.map((m) => ({
          ...m,
          media_url: m.media_url.startsWith("http")
            ? m.media_url
            : `${process.env.API_BASE_URL}${m.media_url}`,
        })),
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Failed to fetch post",
      error: err.message,
    });
  }
});

/* ================================
   COMMENTS
================================ */
router.post("/:postId/comment", authMiddleware, async (req, res) => {
  const { postId } = req.params;
  const { content } = req.body;
  const { id, role } = req.user;

  if (role !== "student") {
    return res.status(403).json({
      success: false,
      message: "Only students can comment",
    });
  }

  if (!content || !content.trim()) {
    return res.status(400).json({ message: "Comment cannot be empty" });
  }

  try {
    const comment = await prisma.post_comments.create({
      data: {
        post_id: Number(postId),
        comment_text: content,
        student_id: id,
      },
      include: {
        student: {
          select: {
            firstName: true,
            lastName: true,
            profilePicture: true,
          },
        },
      },
    });

    const comment_count = await prisma.post_comments.count({
      where: { post_id: Number(postId) },
    });

    const author = {
      name: `${comment.student.firstName} ${
        comment.student.lastName || ""
      }`.trim(),
      profilePicture: comment.student.profilePicture || null,
    };

    res.json({
      success: true,
      comment: {
        comment_id: comment.comment_id,
        comment_text: comment.comment_text,
        created_at: comment.created_at,
        author,
      },
      comment_count,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

router.get("/:postId/comments", async (req, res) => {
  const postId = Number(req.params.postId);

  if (isNaN(postId)) {
    return res.status(400).json({ success: false, message: "Invalid post ID" });
  }

  try {
    const comments = await prisma.post_comments.findMany({
      where: { post_id: postId },
      orderBy: { created_at: "desc" },
      include: {
        student: {
          select: {
            firstName: true,
            lastName: true,
            profilePicture: true,
          },
        },
      },
    });

    const formattedComments = comments.map((c) => ({
      comment_id: c.comment_id,
      comment_text: c.comment_text,
      created_at: c.created_at,
      author: {
        name: c.student
          ? `${c.student.firstName} ${c.student.lastName || ""}`.trim()
          : "User",
        profilePicture: c.student?.profilePicture || null,
      },
    }));

    res.json({
      success: true,
      comments: formattedComments,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

/* ================================
   REACTIONS
================================ */
router.post("/:postId/react", authMiddleware, async (req, res) => {
  const { postId } = req.params;
  const { id, role } = req.user;
  const roleField = `${role.toLowerCase()}_id`;

  const existing = await prisma.post_reactions.findFirst({
    where: { post_id: Number(postId), [roleField]: id },
  });

  if (existing) {
    await prisma.post_reactions.delete({
      where: { reaction_id: existing.reaction_id },
    });
  } else {
    await prisma.post_reactions.create({
      data: { post_id: Number(postId), [roleField]: id },
    });
  }

  const reaction_count = await prisma.post_reactions.count({
    where: { post_id: Number(postId) },
  });

  res.json({ success: true, liked: !existing, reaction_count });
});

/* ================================
   SHARE
================================ */
router.post("/:postId/share", authMiddleware, async (req, res) => {
  const { postId } = req.params;
  const { id, role } = req.user;
  const roleField = `shared_by_${role.toLowerCase()}_id`;

  const existing = await prisma.post_shares.findFirst({
    where: { post_id: Number(postId), [roleField]: id },
  });

  if (!existing) {
    await prisma.post_shares.create({
      data: { post_id: Number(postId), [roleField]: id },
    });
  }

  const share_count = await prisma.post_shares.count({
    where: { post_id: Number(postId) },
  });

  res.json({ success: true, share_count });
});

/* ================================
   REPOST
================================ */
router.post("/:postId/repost", authMiddleware, async (req, res) => {
  try {
    const { postId } = req.params;
    const { id, role } = req.user;

    const roleField = `${role.toLowerCase()}_id`;

    const existing = await prisma.post.findFirst({
      where: {
        repost_of: Number(postId),
        [roleField]: id,
      },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        error: "already_reposted",
        isReposted: true,
      });
    }

    const originalPost = await prisma.post.findUnique({
      where: { post_id: Number(postId) },
      include: { post_media: true },
    });

    if (!originalPost) {
      return res.status(404).json({
        success: false,
        message: "Original post not found",
      });
    }

    const [repost] = await prisma.$transaction([
      prisma.post.create({
        data: {
          repost_of: originalPost.post_id,
          [roleField]: id,
          authorId: id,
          authorType: role.toUpperCase(),
          content: originalPost.content,
          post_media: {
            create: originalPost.post_media.map((m) => ({
              media_url: m.media_url,
              media_type: m.media_type,
            })),
          },
        },
        include: { post_media: true },
      }),

      prisma.post_reposts.create({
        data: {
          post_id: originalPost.post_id,
          [roleField]: id,
        },
      }),

      prisma.post.update({
        where: { post_id: originalPost.post_id },
        data: { repost_count: { increment: 1 } },
      }),
    ]);

    res.json({
      success: true,
      repost,
      isReposted: true,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

/* ================================
   REPORT POST
================================ */
router.post("/:postId/report", authMiddleware, async (req, res) => {
  const { postId } = req.params;
  const { reason } = req.body;
  const { id: userId, role } = req.user;

  if (!reason) {
    return res.status(400).json({ message: "Report reason is required" });
  }

  const roleField = `${role.toLowerCase()}_id`;

  try {
    const existing = await prisma.reported_posts.findFirst({
      where: { post_id: Number(postId), [roleField]: userId },
    });

    if (existing) {
      return res
        .status(400)
        .json({ message: "You have already reported this post" });
    }

    await prisma.reported_posts.create({
      data: {
        post_id: Number(postId),
        reason,
        [roleField]: userId,
      },
    });

    res.json({ success: true, message: "Post reported successfully" });
  } catch (err) {
    console.error("Report post error:", err);
    res
      .status(500)
      .json({ message: "Failed to report post", error: err.message });
  }
});

/* ================================
   SAVE POST
================================ */
router.post("/:postId/save", authMiddleware, async (req, res) => {
  const { postId } = req.params;
  const { id: userId, role } = req.user;

  const roleField = `${role.toLowerCase()}_id`;

  try {
    const existing = await prisma.saved_posts.findFirst({
      where: { post_id: Number(postId), [roleField]: userId },
    });

    if (existing) {
      return res.status(400).json({ message: "Post already saved" });
    }

    await prisma.saved_posts.create({
      data: { post_id: Number(postId), [roleField]: userId },
    });

    res.json({ success: true, message: "Post saved" });
  } catch (err) {
    console.error("Save post error:", err);
    res
      .status(500)
      .json({ message: "Failed to save post", error: err.message });
  }
});

/* ================================
   UPDATE/EDIT POST
================================ */
router.put(
  "/:postId",
  authMiddleware,
  uploadPostMedia.array("media"),
  async (req, res) => {
    try {
      const postId = Number(req.params.postId);
      const userId = req.user.id;
      const content = req.body.content?.trim();

      if (!postId || isNaN(postId)) {
        return res.status(400).json({ message: "Invalid post ID" });
      }

      let existingMediaIds = req.body.existingMediaIds || [];
      if (!Array.isArray(existingMediaIds)) {
        existingMediaIds = [existingMediaIds];
      }
      existingMediaIds = existingMediaIds.map(Number).filter(Boolean);

      const post = await prisma.post.findUnique({
        where: { post_id: postId },
        include: { post_media: true },
      });

      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }

      if (post.authorId !== userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      // Delete removed media from disk and DB
      const removedMedia = post.post_media.filter(
        (m) => !existingMediaIds.includes(m.media_id)
      );

      for (const media of removedMedia) {
        const filePath = path.join(MEDIA_STORAGE_PATH, media.media_url.replace('/media/', ''));
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }

      await prisma.post_media.deleteMany({
        where: {
          post_id: postId,
          media_id: {
            notIn: existingMediaIds.length ? existingMediaIds : [0],
          },
        },
      });

      // Add new media
      if (req.files?.length) {
        await prisma.post_media.createMany({
          data: req.files.map((file) => ({
            post_id: postId,
            media_url: `/media/posts/${userId}/${file.filename}`,
            media_type: file.mimetype.startsWith("image") ? "image" : "video",
          })),
        });
      }

      const updatedPost = await prisma.post.update({
        where: { post_id: postId },
        data: { content },
        include: { post_media: true },
      });

      res.json({ success: true, post: updatedPost });
    } catch (err) {
      console.error("Edit post error:", err);
      res.status(500).json({ message: "Failed to update post" });
    }
  }
);

/* ================================
   GET MY POSTS
================================ */
router.get("/my-posts/data", authMiddleware, async (req, res) => {
  try {
    const { id: userId } = req.user;
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const posts = await prisma.post.findMany({
      where: {
        authorId: userId,
      },
      take: limit,
      skip: offset,
      orderBy: { createdAt: "desc" },
      include: {
        post_media: true,
        post_reactions: true,
        post_comments: true,
      },
    });

    const enrichedPosts = await Promise.all(
      posts.map(async (post) => {
        const author = await getAuthorInfo(post.authorId, post.authorType);

        const media = post.post_media.map((m) => ({
          ...m,
          media_url: m.media_url.startsWith("http")
            ? m.media_url
            : `${process.env.API_BASE_URL}${m.media_url}`,
        }));

        return {
          ...post,
          author,
          media,
          likesCount: post.post_reactions.length,
          commentsCount: post.post_comments.length,
          isLiked: post.post_reactions.some((r) => r.user_id === userId),
          isSaved: false,
        };
      })
    );

    res.status(200).json({
      success: true,
      posts: enrichedPosts,
      pagination: {
        limit,
        offset,
        total: enrichedPosts.length,
      },
    });
  } catch (err) {
    console.error("Get my posts error:", err);
    res.status(500).json({
      message: "Failed to get my posts",
      error: err.message,
    });
  }
});

/* ================================
   GET USER POSTS BY ID
================================ */
router.get("/user/:profileId/data", async (req, res) => {
  try {
    const profileIdInt = parseInt(req.params.profileId, 10);
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;

    if (isNaN(profileIdInt)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const posts = await prisma.post.findMany({
      where: { authorId: profileIdInt },
      take: limit,
      skip: offset,
      orderBy: { createdAt: "desc" },
      include: { post_media: true, post_reactions: true, post_comments: true },
    });

    const enrichedPosts = await Promise.all(
      posts.map(async (post) => {
        const author = await getAuthorInfo(post.authorId, post.authorType);
        const media = post.post_media.map((m) => ({
          ...m,
          media_url: m.media_url.startsWith("http")
            ? m.media_url
            : `${process.env.API_BASE_URL}${m.media_url}`,
        }));

        return {
          ...post,
          author,
          media,
          likesCount: post.post_reactions.length,
          commentsCount: post.post_comments.length,
          isLiked: req.user
            ? post.post_reactions.some((r) => r.user_id === req.user.id)
            : false,
          isSaved: false,
        };
      })
    );

    res.status(200).json({
      success: true,
      posts: enrichedPosts,
      pagination: { limit, offset, total: enrichedPosts.length },
    });
  } catch (err) {
    console.error("Get user posts error:", err);
    res
      .status(500)
      .json({ message: "Failed to get user posts", error: err.message });
  }
});

export default router;
