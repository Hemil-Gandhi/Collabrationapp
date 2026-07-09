import { Response, NextFunction } from "express";
import { env } from "../config/env.js";
import { Post } from "../models/post.model.js";
import { User } from "../models/user.model.js";
import { BadRequestError, NotFoundError, UnauthorizedError } from "../shared/utils/appError.js";
import { AuthenticatedRequest } from "../shared/types/index.js";

// Call Google Gemini API
async function callGeminiApi(prompt: string): Promise<string> {
  const apiKey = env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 500,
      }
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Gemini API Error:", errorText);
    throw new Error("Failed to generate caption with AI.");
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error("AI returned an empty response.");
  }

  return text.trim();
}

export async function createPost(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const email = req.user?.email;
    if (!email) throw new UnauthorizedError("Unauthorized.");

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) throw new NotFoundError("User not found.");
    if (user.role !== "influencer") throw new UnauthorizedError("Only influencers can create posts.");

    const { caption } = req.body;
    if (!caption) throw new BadRequestError("Caption is required.");

    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    if (!files || !files.postImage || files.postImage.length === 0) {
      throw new BadRequestError("Post image is required.");
    }

    const imageUrl = `uploads/posts/${files.postImage[0].filename}`;

    const post = new Post({
      influencerEmail: user.email,
      influencer: user._id,
      imageUrl,
      caption,
    });

    await post.save();
    res.status(201).json({ message: "Post created successfully.", post });
  } catch (error) {
    next(error);
  }
}

export async function getPosts(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const email = req.user?.email;
    if (!email) throw new UnauthorizedError("Unauthorized.");

    const posts = await Post.find({ influencerEmail: email.toLowerCase().trim() })
      .sort({ createdAt: -1 });

    res.json({ posts });
  } catch (error) {
    next(error);
  }
}

export async function generateCaption(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user?.email) throw new UnauthorizedError("Unauthorized.");

    const { prompt, currentCaption } = req.body;
    if (!prompt) throw new BadRequestError("Prompt is required.");

    let fullPrompt = `You are an expert social media manager writing an Instagram caption.\n`;
    if (currentCaption) {
      fullPrompt += `The user has already written this caption: "${currentCaption}"\n`;
      fullPrompt += `Instruction to modify/improve it: ${prompt}\n`;
    } else {
      fullPrompt += `Topic/Instruction: ${prompt}\n`;
    }
    
    fullPrompt += `\nWrite a highly engaging Instagram caption with relevant hashtags. Keep it natural and authentic. Only output the caption itself, no introductory text.`;

    const generatedCaption = await callGeminiApi(fullPrompt);

    res.json({ caption: generatedCaption });
  } catch (error) {
    next(error);
  }
}
