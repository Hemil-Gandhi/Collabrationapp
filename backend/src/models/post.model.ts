import mongoose, { Schema, Document } from "mongoose";

export interface IPost extends Document {
  influencerEmail: string;
  influencer: mongoose.Types.ObjectId | any;
  imageUrl: string;
  caption: string;
  createdAt: Date;
  updatedAt: Date;
}

const PostSchema = new Schema<IPost>(
  {
    influencerEmail: { type: String, required: true, lowercase: true, trim: true },
    influencer: { type: Schema.Types.ObjectId, ref: "User", required: true },
    imageUrl: { type: String, required: true },
    caption: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

export const Post = mongoose.model<IPost>("Post", PostSchema);
