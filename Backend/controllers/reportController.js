import userModel from "../models/user.js";

export const reportUser = async (req, res) => {
  const { userIdToReport } = req.body;
  const userId = req.userId; // Current logged-in user

  try {
    if (!userIdToReport || userIdToReport === userId) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID or cannot report yourself",
      });
    }

    const userToReport = await userModel.findById(userIdToReport);
    if (!userToReport) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    await userModel.findByIdAndUpdate(
      userId,
      { $addToSet: { reportedUsers: userIdToReport } },
      { returnDocument: 'after' }
    );

    return res.status(200).json({
      success: true,
      message: "User reported successfully",
      data: { reportedUserId: userIdToReport },
    });
  } catch (error) {
    console.error("Error in reportUser", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const unreportUser = async (req, res) => {
  const { userIdToUnreport } = req.body;
  const userId = req.userId;

  try {
    if (!userIdToUnreport) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    await userModel.findByIdAndUpdate(
      userId,
      { $pull: { reportedUsers: userIdToUnreport } },
      { returnDocument: 'after' }
    );

    return res.status(200).json({
      success: true,
      message: "User unreported successfully",
      data: { unreportedUserId: userIdToUnreport },
    });
  } catch (error) {
    console.error("Error in unreportUser", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const checkReportStatus = async (req, res) => {
  const { otherUserId } = req.params;
  const userId = req.userId;

  try {
    const currentUser = await userModel.findById(userId).select('reportedUsers');

    const isReportedByMe = currentUser.reportedUsers.includes(otherUserId);

    return res.status(200).json({
      success: true,
      data: {
        isReportedByMe
      },
    });
  } catch (error) {
    console.error("Error in checkReportStatus", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
