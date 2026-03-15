import jwt from "jsonwebtoken";

export const authMiddleware = (req, res, next) => {
   try {
    const  token  = req.cookies?.auth_token
    if (!token) {
      return res.status(400).json({success: false, message: "Not Authorized, Please login first"})
    }
    const token_decode = jwt.verify(token, process.env.JWT_SECRET_KEY)
    req.userId = token_decode.userId
    next()
   } catch (error) {
    console.error("Error in auth middleware", error)
    return res.status(500).json({success: false, message: "Internal server Error"})
   }
}
