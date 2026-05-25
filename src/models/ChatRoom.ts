import { model, Schema } from "mongoose";

const chatRoomSchema = new Schema(
  {
    name: {
      type: String,
      default: "",
      trim: true,
      maxlength: 80,
    },
    isGroup: {
      type: Boolean,
      default: false,
    },
    members: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

chatRoomSchema.index({ members: 1 });

export const ChatRoom = model("ChatRoom", chatRoomSchema);
