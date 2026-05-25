import mongoose from "mongoose";

import { env } from "../config/env.js";
import { ChatRoom } from "../models/ChatRoom.js";
import { Follow } from "../models/Follow.js";
import { Message } from "../models/Message.js";
import { Post } from "../models/Post.js";
import { User } from "../models/User.js";
import { DEFAULT_ROLE_OPTIONS, ensureRolesSeeded } from "../services/role.service.js";
import { encryptText } from "../utils/encryption.js";

type SeedUser = {
  email: string;
  name: string;
  role: string;
  location: string;
  bio: string;
  avatarUrl: string;
};

const seedUsers: SeedUser[] = [
  {
    email: "ava.bryant@circle.dev",
    name: "Ava Bryant",
    role: "product_manager",
    location: "Austin, TX",
    bio: "Loves shipping small, useful products with clear edges.",
    avatarUrl: "https://i.pravatar.cc/300?img=11",
  },
  {
    email: "liam.carter@circle.dev",
    name: "Liam Carter",
    role: "frontend_engineer",
    location: "San Diego, CA",
    bio: "Design systems, strong coffee, and tidy component APIs.",
    avatarUrl: "https://i.pravatar.cc/300?img=12",
  },
  {
    email: "noah.evans@circle.dev",
    name: "Noah Evans",
    role: "backend_engineer",
    location: "Chicago, IL",
    bio: "API reliability and clean service boundaries are my thing.",
    avatarUrl: "https://i.pravatar.cc/300?img=13",
  },
  {
    email: "mia.hughes@circle.dev",
    name: "Mia Hughes",
    role: "ux_designer",
    location: "New York, NY",
    bio: "Human-centered flows with compact visuals.",
    avatarUrl: "https://i.pravatar.cc/300?img=14",
  },
  {
    email: "elijah.stone@circle.dev",
    name: "Elijah Stone",
    role: "data_analyst",
    location: "Seattle, WA",
    bio: "Turns product behavior into simple dashboards.",
    avatarUrl: "https://i.pravatar.cc/300?img=15",
  },
  {
    email: "zoe.turner@circle.dev",
    name: "Zoe Turner",
    role: "growth_lead",
    location: "Atlanta, GA",
    bio: "Runs experiments and keeps messaging sharp.",
    avatarUrl: "https://i.pravatar.cc/300?img=16",
  },
  {
    email: "ethan.wells@circle.dev",
    name: "Ethan Wells",
    role: "devops_engineer",
    location: "Denver, CO",
    bio: "Build pipelines, infra hygiene, and release confidence.",
    avatarUrl: "https://i.pravatar.cc/300?img=17",
  },
  {
    email: "sophia.reed@circle.dev",
    name: "Sophia Reed",
    role: "sales",
    location: "Boston, MA",
    bio: "Bridges customer context with product feedback.",
    avatarUrl: "https://i.pravatar.cc/300?img=18",
  },
  {
    email: "jack.foster@circle.dev",
    name: "Jack Foster",
    role: "frontend_engineer",
    location: "Portland, OR",
    bio: "Smooth mobile interactions and stable releases.",
    avatarUrl: "https://i.pravatar.cc/300?img=19",
  },
  {
    email: "olivia.hart@circle.dev",
    name: "Olivia Hart",
    role: "operations",
    location: "Miami, FL",
    bio: "Keeps teams aligned and execution friction low.",
    avatarUrl: "https://i.pravatar.cc/300?img=20",
  },
];

const followMatrix: Array<[string, string]> = [
  ["ava.bryant@circle.dev", "liam.carter@circle.dev"],
  ["ava.bryant@circle.dev", "mia.hughes@circle.dev"],
  ["liam.carter@circle.dev", "noah.evans@circle.dev"],
  ["liam.carter@circle.dev", "zoe.turner@circle.dev"],
  ["noah.evans@circle.dev", "ethan.wells@circle.dev"],
  ["noah.evans@circle.dev", "jack.foster@circle.dev"],
  ["mia.hughes@circle.dev", "ava.bryant@circle.dev"],
  ["mia.hughes@circle.dev", "olivia.hart@circle.dev"],
  ["elijah.stone@circle.dev", "sophia.reed@circle.dev"],
  ["elijah.stone@circle.dev", "ava.bryant@circle.dev"],
  ["zoe.turner@circle.dev", "sophia.reed@circle.dev"],
  ["zoe.turner@circle.dev", "liam.carter@circle.dev"],
  ["ethan.wells@circle.dev", "noah.evans@circle.dev"],
  ["ethan.wells@circle.dev", "olivia.hart@circle.dev"],
  ["sophia.reed@circle.dev", "mia.hughes@circle.dev"],
  ["jack.foster@circle.dev", "ava.bryant@circle.dev"],
  ["jack.foster@circle.dev", "ethan.wells@circle.dev"],
  ["olivia.hart@circle.dev", "zoe.turner@circle.dev"],
  ["olivia.hart@circle.dev", "sophia.reed@circle.dev"],
  ["olivia.hart@circle.dev", "liam.carter@circle.dev"],
];

const postSeedEntries = [
  { email: "ava.bryant@circle.dev", content: "Booked a discovery session with three pilot users this week." },
  { email: "liam.carter@circle.dev", content: "Refined the sidebar interactions. Navigation feels tighter now." },
  { email: "mia.hughes@circle.dev", content: "Testing a denser people list with calmer visual hierarchy." },
  { email: "noah.evans@circle.dev", content: "Shipped OTP auth with fewer moving parts and clear error states." },
  { email: "zoe.turner@circle.dev", content: "Drafting lifecycle messaging for new-user activation." },
  { email: "ethan.wells@circle.dev", content: "Queued a deployment check and tightened API logging." },
  { email: "sophia.reed@circle.dev", content: "Talked to two customers who want lightweight team chat." },
  { email: "jack.foster@circle.dev", content: "Improved button loading states to reduce jitter." },
  { email: "olivia.hart@circle.dev", content: "Created a weekly operating cadence for cross-team updates." },
  { email: "elijah.stone@circle.dev", content: "Preparing dashboard metrics for the next product review." },
];

const chatSeedMessages = [
  { email: "ava.bryant@circle.dev", text: "Welcome to the Circle test room." },
  { email: "liam.carter@circle.dev", text: "Nice, typing events are already responsive." },
  { email: "mia.hughes@circle.dev", text: "Visual polish on the people cards looks much better now." },
  { email: "noah.evans@circle.dev", text: "Encrypted message storage is live for this room." },
];

const shouldReset = process.argv.includes("--reset") || process.env.SEED_RESET === "true";

const seed = async () => {
  await mongoose.connect(env.MONGODB_URI);

  if (shouldReset) {
    await Promise.all([
      Message.deleteMany({}),
      ChatRoom.deleteMany({}),
      Post.deleteMany({}),
      Follow.deleteMany({}),
      User.deleteMany({}),
    ]);
    console.log("Reset complete: removed users, follows, posts, rooms, and messages.");
  }

  await ensureRolesSeeded();

  await Promise.all(
    seedUsers.map((user) =>
      User.updateOne(
        { email: user.email },
        {
          $set: {
            name: user.name,
            role: user.role,
            location: user.location,
            bio: user.bio,
            avatarUrl: user.avatarUrl,
            avatarPublicId: null,
          },
          $setOnInsert: {
            email: user.email,
          },
        },
        { upsert: true },
      ),
    ),
  );

  const users = await User.find({ email: { $in: seedUsers.map((user) => user.email) } }).lean();
  const idByEmail = new Map(users.map((user) => [user.email, String(user._id)]));

  await Follow.deleteMany({
    $or: users.map((user) => [{ follower: user._id }, { following: user._id }]).flat(),
  });

  const followDocs = followMatrix
    .map(([followerEmail, followingEmail]) => {
      const followerId = idByEmail.get(followerEmail);
      const followingId = idByEmail.get(followingEmail);

      if (!followerId || !followingId || followerId === followingId) {
        return null;
      }

      return {
        follower: followerId,
        following: followingId,
      };
    })
    .filter((entry): entry is { follower: string; following: string } => Boolean(entry));

  if (followDocs.length > 0) {
    await Follow.insertMany(followDocs, { ordered: false });
  }

  const seededUserIds = users.map((user) => user._id);

  await Post.deleteMany({ author: { $in: seededUserIds } });

  const posts = postSeedEntries
    .map((entry) => {
      const author = idByEmail.get(entry.email);
      if (!author) {
        return null;
      }

      return {
        author,
        content: entry.content,
      };
    })
    .filter((entry): entry is { author: string; content: string } => Boolean(entry));

  if (posts.length > 0) {
    await Post.insertMany(posts);
  }

  await ChatRoom.deleteMany({ createdBy: { $in: seededUserIds } });

  const roomMemberEmails = [
    "ava.bryant@circle.dev",
    "liam.carter@circle.dev",
    "mia.hughes@circle.dev",
    "noah.evans@circle.dev",
  ];

  const roomMemberIds = roomMemberEmails
    .map((email) => idByEmail.get(email))
    .filter((id): id is string => Boolean(id));

  let seededRoomId: string | null = null;

  if (roomMemberIds.length > 1) {
    const room = await ChatRoom.create({
      name: "Product Squad",
      isGroup: true,
      members: roomMemberIds,
      createdBy: roomMemberIds[0],
    });

    seededRoomId = String(room._id);
  }

  if (seededRoomId) {
    const messageDocs = chatSeedMessages
      .map((entry) => {
        const sender = idByEmail.get(entry.email);
        if (!sender) {
          return null;
        }

        return {
          room: seededRoomId,
          sender,
          ...encryptText(entry.text),
        };
      })
      .filter(
        (
          entry,
        ): entry is {
          room: string;
          sender: string;
          cipherText: string;
          iv: string;
          authTag: string;
        } => Boolean(entry),
      );

    if (messageDocs.length > 0) {
      await Message.insertMany(messageDocs);
    }
  }

  console.log(`Seeded ${users.length} users and ${followDocs.length} follow relationships.`);
  console.log(`Seeded ${posts.length} posts and ${seededRoomId ? 1 : 0} chat room.`);
  console.log("Role options:");
  for (const role of DEFAULT_ROLE_OPTIONS) {
    console.log(`- ${role.key} (${role.label})`);
  }
  console.log("Seeded emails:");
  for (const user of seedUsers) {
    console.log(`- ${user.email}`);
  }
};

seed()
  .catch((error) => {
    console.error("Seed failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
