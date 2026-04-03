import jwt from "jsonwebtoken";

export const authMiddleware = (req, res, next) => {
  try {
    const cookieToken = req.cookies?.auth_token;
    const headerToken = req.headers.authorization?.split(" ")[1];
    const token = cookieToken || headerToken;

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: "Not Authorized, Please login first" 
      });
    }

    const token_decode = jwt.verify(token, process.env.JWT_SECRET_KEY);
    req.userId = token_decode.id || token_decode.userId; 
    next();
    
  } catch (error) {
    console.error("Error in auth middleware", error);
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ success: false, message: "Session Expired, Login again" });
    }
    return res.status(500).json({ success: false, message: "Internal server Error" });
  }
};