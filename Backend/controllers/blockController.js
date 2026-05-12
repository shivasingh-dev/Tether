import userModel from "../models/user.js";

export const blockUser = async (req, res) => {
  const { userIdToBlock } = req.body;
  const userId = req.userId; // Current logged-in user

  try {
    // Validation
    if (!userIdToBlock || userIdToBlock === userId) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID or cannot block yourself",
      });
    }

    // Check if user to block exists
    const userToBlock = await userModel.findById(userIdToBlock);
    if (!userToBlock) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Block the user (add to blockedUsers array)
    const currentUser = await userModel.findByIdAndUpdate(
      userId,
      { $addToSet: { blockedUsers: userIdToBlock } }, // $addToSet prevents duplicates
      { returnDocument: 'after' }
    ).select('-password');

    // Emit socket event for real-time update
    if (req.io) {
      req.io.to(userId.toString()).emit("user_blocked", {
        blockedUserId: userIdToBlock,
      });
      
      // Notify blocked user (optional)
      req.io.to(userIdToBlock.toString()).emit("blocked_by_user", {
        blockedByUserId: userId,
      });
    }

    return res.status(200).json({
      success: true,
      message: "User blocked successfully",
      data: { blockedUserId: userIdToBlock },
    });
  } catch (error) {
    console.error("Error in blockUser", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const unblockUser = async (req, res) => {
  const { userIdToUnblock } = req.body;
  const userId = req.userId;

  try {
    if (!userIdToUnblock) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    // Unblock the user (remove from blockedUsers array)
    const currentUser = await userModel.findByIdAndUpdate(
      userId,
      { $pull: { blockedUsers: userIdToUnblock } },
      { returnDocument: 'after' }
    ).select('-password');

    // Emit socket event
    if (req.io) {
      req.io.to(userId.toString()).emit("user_unblocked", {
        unblockedUserId: userIdToUnblock,
      });

      req.io.to(userIdToUnblock.toString()).emit("unblocked_by_user", {
        unblockedByUserId: userId,
      });
    }

    return res.status(200).json({
      success: true,
      message: "User unblocked successfully",
      data: { unblockedUserId: userIdToUnblock },
    });
  } catch (error) {
    console.error("Error in unblockUser", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getBlockedUsers = async (req, res) => {
  const userId = req.userId;

  try {
    const user = await userModel
      .findById(userId)
      .populate('blockedUsers', 'fullName userName profilePicture')
      .select('blockedUsers');

    return res.status(200).json({
      success: true,
      message: "Blocked users fetched successfully",
      data: user.blockedUsers || [],
    });
  } catch (error) {
    console.error("Error in getBlockedUsers", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const checkBlockStatus = async (req, res) => {
  const { otherUserId } = req.params;
  const userId = req.userId;

  try {
    const currentUser = await userModel.findById(userId).select('blockedUsers');
    const otherUser = await userModel.findById(otherUserId).select('blockedUsers');

    const isBlockedByMe = currentUser.blockedUsers.includes(otherUserId);
    const isBlockedByThem = otherUser.blockedUsers.includes(userId);

    return res.status(200).json({
      success: true,
      data: {
        isBlockedByMe,
        isBlockedByThem,
        canMessage: !isBlockedByMe && !isBlockedByThem,
      },
    });
  } catch (error) {
    console.error("Error in checkBlockStatus", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};