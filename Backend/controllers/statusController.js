import { conversationModel } from "../models/conversation.js";
import { statusModel } from "../models/status.js";
import userModel from "../models/user.js";
import { uploadFileToCloudinary } from "../config/cloudinaryConfig.js";

export const createStatus = async (req, res) => {
  try {
    const { content, contentType } = req.body;
    const userId = req.userId
    const file = req.file;

    let mediaUrl = null
    let finalContentType = contentType || 'text'

    // media upload handled here
    if (file) {
      const uploadFile = await uploadFileToCloudinary(file);

      if (!uploadFile?.secure_url) {
        return res
          .status(400)
          .json({ success: false, messagae: "failed to upload media" });
      }
      mediaUrl = uploadFile?.secure_url;

      if (file.mimetype.startswith("image")) {
        finalContentType = "image";
      } else if (file.mimetype.startswith("video")) {
        finalContentType = "video";
      } else {
        return res
          .status(400)
          .json({ sucess: false, message: "Unsupported Media or file type" });
      }
    } else if (content?.trim()) {
      finalContentType = "text";
    } else {
      return res
        .status(400)
        .json({ sucess: false, message: "Message content is required" });
    }

    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24)

    const status = new statusModel({
      user: userId,
      content: mediaUrl || content,
      contentType: finalContentType,
      expiresAt,
    });

    await status.save();

    const populateStatus = await statusModel
      .findById(status?._id)
      .populate("user", "fullName profilePicture")
      .populate("viewers", "fullName profilePicture");


    // emit socket event
    if (req.io && req.socketUserMap) {
      // broadcast to mutual saved contacts only
      const currentUser = await userModel.findById(userId).select('savedContacts');
      const mySavedContacts = currentUser?.savedContacts || [];
      
      const mutualContacts = await userModel.find({
          _id: { $in: mySavedContacts },
          savedContacts: userId
      }).select('_id');
      
      const mutualContactIds = mutualContacts.map(c => c._id.toString());

      for (const [connectedUserId, socketId] of req.socketUserMap) {
        if (connectedUserId !== userId && mutualContactIds.includes(connectedUserId)) {
          req.io.to(socketId).emit("new_status", populateStatus)
        }
      }
    }


    return res.status(200).json({
      success: true,
      message: "Status uploaded successfully",
      data: populateStatus,
    });
  } catch (error) {
    console.error("Error in sendMessage", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

export const getStatus = async (req, res) => {
  try {
    const userId = req.userId;
    const currentUser = await userModel.findById(userId).select('savedContacts');
    const mySavedContacts = currentUser?.savedContacts || [];

    // Find users who have me in their savedContacts and are in my savedContacts
    const mutualContacts = await userModel.find({
        _id: { $in: mySavedContacts },
        savedContacts: userId
    }).select('_id');

    const mutualContactIds = mutualContacts.map(c => c._id);
    mutualContactIds.push(userId); // Include my own statuses

    const statuses = await statusModel.find({
      user: { $in: mutualContactIds },
      expiresAt: { $gt: new Date() }
    }).populate("user", "fullName profilePicture phoneNumber")
      .populate("viewers", "fullName profilePicture").sort({ createdAt: -1 })

    return res.status(200).json({ success: true, message: "Status retrived successfully", data: statuses })
  } catch (error) {
    console.error("Error in getStatus", error)
    return res.status(500).json({ success: true, message: "Internal Server Error" })
  }
}

export const viewStatus = async (req, res) => {
  const { statusId } = req.params
  const userId = req.userId
  try {
    const status = await statusModel.findById(statusId)
    if (!status) {
      return res.status(404).json({ success: false, message: "Status not found" })
    }

    if (!status.viewers.includes(userId)) {
      status.viewers.push(userId)
      await status.save()

      const updateStatus = await statusModel.findById(statusId)
        .populate("user", "fullName profilePicture")
        .populate("viewers", "fullName profilePicture")
    }

    // Emit socket event
    if (req.io && req.socketUserMap) {
      // broadcast to all connecting user except the creator
      const statusOwnerSocketId = req.socketUserMap.get(status?.user?._id.toString())
      if (statusOwnerSocketId) {
        const viewData = {
          statusId,
          viewerId: userId,
          totalViewers: updateStatus.viewers.length,
          viewers: updateStatus.viewers
        }

        res.io.to(statusOwnerSocketId).emit("status_viewed", viewData)
      }
      else {
        console.log("status owner are not connected")
      }
    }

    else {
      console.log("user already viewed the status")
    }

    return res.status(200).json({ success: true, message: "Status viewed successfully" })
  } catch (error) {
    console.error("Error in viewStatus", error)
    return res.status(500).json({ success: true, message: "Internal Server Error" })
  }
}

export const deleteStatus = async (req, res) => {
  const { statusId } = req.params
  const userId = req.userId
  try {
    const status = await statusModel.findById(statusId)
    if (!status) {
      return res.status(404).json({ success: false, message: "Status not found" })
    }
    if (status.user.toString() !== userId) {
      return res.status(400).json({ success: false, message: "Not authorized to delete the status" })
    }

    await statusModel.deleteOne()

    // emit socket event
    if (req.io && req.socketUserMap) {
      for (const [connectedUserId, socketId] of req.socketUserMap) {
        if (connectedUserId !== userId) {
          req.io.to(socketId).emit("status_deleted", statusId)
        }
      }
    }


    return res.status(200).json({ success: true, message: "Status deleted successfully" })
  } catch (error) {
    console.error("Error in deleteStatus", error)
    return res.status(500).json({ success: true, message: "Internal Server Error" })
  }
}
