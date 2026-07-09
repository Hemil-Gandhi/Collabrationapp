import { Response } from "express";
import { Influencer } from "../models/user.model.js";
import { AuthenticatedRequest } from "../shared/types/index.js";

/**
 * POST /api/instagram/connect
 * Accepts an Instagram access token from the frontend, validates it by
 * calling the Instagram Graph API, and saves the profile data.
 */
export async function connectWithToken(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  const { accessToken } = req.body;

  if (!accessToken || typeof accessToken !== "string") {
    res.status(400).json({ error: "Access token is required." });
    return;
  }

  const userEmail = req.user?.email;
  if (!userEmail) {
    res.status(401).json({ error: "User not authenticated." });
    return;
  }

  try {
    // Try Instagram Graph API first (for tokens from Instagram Login)
    let profileResponse = await fetch(
      `https://graph.instagram.com/v22.0/me?fields=user_id,username,followers_count&access_token=${encodeURIComponent(accessToken)}`
    );

    let profileData = await profileResponse.json();
    let instagramUsername = "";
    let instagramFollowers = null;
    let instagramUserId = "";

    if (profileResponse.ok && !profileData.error) {
      // Success with Instagram Graph API
      instagramUsername = profileData.username || "";
      instagramFollowers = profileData.followers_count ?? null;
      instagramUserId = profileData.user_id || profileData.id || "";
    } else {
      // If it fails, try Facebook Graph API (for EAA... tokens generated via Facebook Login/Graph API Explorer)
      console.log("Instagram Graph API failed, trying Facebook Graph API...");
      
      const fbAccountsResponse = await fetch(
        `https://graph.facebook.com/v22.0/me/accounts?fields=instagram_business_account&access_token=${encodeURIComponent(accessToken)}`
      );
      const fbAccountsData = await fbAccountsResponse.json();

      if (!fbAccountsResponse.ok || fbAccountsData.error) {
        console.error("Facebook Graph API failed:", fbAccountsData);
        res.status(400).json({
          error: "Invalid or expired access token. Make sure it has the correct permissions.",
        });
        return;
      }

      // Find the first Facebook Page that has a connected Instagram Business Account
      const pageWithIg = fbAccountsData.data?.find((page: any) => page.instagram_business_account);
      
      if (!pageWithIg) {
        res.status(400).json({
          error: "No connected Instagram Business account found for this token.",
        });
        return;
      }

      const igAccountId = pageWithIg.instagram_business_account.id;

      // Fetch the Instagram account details
      const igProfileResponse = await fetch(
        `https://graph.facebook.com/v22.0/${igAccountId}?fields=username,followers_count&access_token=${encodeURIComponent(accessToken)}`
      );
      const igProfileData = await igProfileResponse.json();

      if (!igProfileResponse.ok || igProfileData.error) {
        res.status(400).json({
          error: "Failed to fetch Instagram profile details from Facebook Graph API.",
        });
        return;
      }

      instagramUsername = igProfileData.username || "";
      instagramFollowers = igProfileData.followers_count ?? null;
      instagramUserId = igProfileData.id || "";
    }

    // Update the influencer record in the database
    const updatedUser = await Influencer.findOneAndUpdate(
      { email: userEmail.toLowerCase() },
      {
        instagramUsername,
        instagramFollowers,
        instagramAccessToken: accessToken,
        instagramAccountId: String(instagramUserId),
      },
      { new: true }
    );

    if (!updatedUser) {
      res.status(404).json({ error: "Influencer profile not found." });
      return;
    }

    // Return the updated user (without sensitive token data)
    const userObj = updatedUser.toObject();
    delete (userObj as any).instagramAccessToken;
    delete (userObj as any).password;

    res.json({
      success: true,
      message: "Instagram account connected successfully!",
      user: userObj,
    });
  } catch (error) {
    console.error("Instagram connect error:", error);
    res.status(500).json({
      error: "An internal error occurred while connecting Instagram.",
    });
  }
}

/**
 * GET /api/instagram/media
 * Fetches recent media from the connected Instagram account.
 */
export async function getInstagramMedia(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  const userEmail = req.user?.email;
  if (!userEmail) {
    res.status(401).json({ error: "User not authenticated." });
    return;
  }

  try {
    const user = await Influencer.findOne({ email: userEmail.toLowerCase() });
    if (!user || !user.instagramAccessToken || !user.instagramAccountId) {
      res.status(400).json({ error: "Instagram account not connected." });
      return;
    }

    const token = user.instagramAccessToken;
    const accountId = user.instagramAccountId;

    // Check if token is Facebook Graph API (starts with EAA) or Instagram Basic (starts with IG)
    const isFacebookToken = token.startsWith("EAA");
    
    let apiUrl = "";
    if (isFacebookToken) {
      apiUrl = `https://graph.facebook.com/v22.0/${accountId}/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp&access_token=${encodeURIComponent(token)}`;
    } else {
      apiUrl = `https://graph.instagram.com/v22.0/me/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp&access_token=${encodeURIComponent(token)}`;
    }

    const response = await fetch(apiUrl);
    const data = await response.json();

    if (!response.ok || data.error) {
      console.error("Failed to fetch Instagram media:", data.error);
      res.status(400).json({ error: "Failed to fetch Instagram media. Token might be expired." });
      return;
    }

    res.json({ success: true, data: data.data || [] });
  } catch (error) {
    console.error("Instagram media error:", error);
    res.status(500).json({ error: "An internal error occurred while fetching media." });
  }
}

/**
 * POST /api/instagram/disconnect
 * Disconnects the Instagram account from the influencer's profile.
 */
export async function disconnect(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  const userEmail = req.user?.email;
  if (!userEmail) {
    res.status(401).json({ error: "User not authenticated." });
    return;
  }

  try {
    const updatedUser = await Influencer.findOneAndUpdate(
      { email: userEmail.toLowerCase() },
      {
        $unset: {
          instagramUsername: "",
          instagramFollowers: "",
          instagramAccessToken: "",
          instagramAccountId: "",
        },
      },
      { new: true }
    );

    if (!updatedUser) {
      res.status(404).json({ error: "Influencer profile not found." });
      return;
    }

    const userObj = updatedUser.toObject();
    delete (userObj as any).password;

    res.json({
      success: true,
      message: "Instagram account disconnected.",
      user: userObj,
    });
  } catch (error) {
    console.error("Instagram disconnect error:", error);
    res.status(500).json({ error: "An internal error occurred." });
  }
}
