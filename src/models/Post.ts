import { model, Schema } from "mongoose";

const postSchema = new Schema(
  {
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 600,
    },
  },
  {
    timestamps: true,
  },
);

postSchema.index({ createdAt: -1 });

export const Post = model("Post", postSchema);
