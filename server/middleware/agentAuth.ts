import type { RequestHandler, Request, Response, NextFunction } from "express";
import { storage } from "../storage";
import { hashToken } from "../utils/agentToken";

export interface AgentRequest extends Request {
  agentUserId?: string;
  agentTokenId?: number;
}

export const isAgentAuthenticated: RequestHandler = async (
  req: AgentRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Missing or invalid authorization header" });
  }
  
  const token = authHeader.substring(7);
  
  if (!token || token.length < 32) {
    return res.status(401).json({ message: "Invalid token format" });
  }
  
  try {
    const tokenHash = hashToken(token);
    const agentToken = await storage.getAgentTokenByHash(tokenHash);
    
    if (!agentToken) {
      return res.status(401).json({ message: "Invalid or revoked token" });
    }
    
    req.agentUserId = agentToken.userId;
    req.agentTokenId = agentToken.id;
    
    storage.updateAgentTokenLastUsed(agentToken.id).catch(console.error);
    
    next();
  } catch (error) {
    console.error("Agent auth error:", error);
    return res.status(500).json({ message: "Authentication error" });
  }
};
