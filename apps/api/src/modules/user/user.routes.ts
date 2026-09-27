import { authLimiter } from "../../http/middleware/rate-limit.js";
import type { AppDeps } from "../../runtime-types.js";
import { Router } from "express";
import { AUTH_COOKIE, authCookieOptions, signToken } from "../auth/jwt.js";
import { requireAuth } from "../../http/middleware/auth.js";

export function userRouter({env}:AppDeps) : Router {
    const router = Router();
    const limiter = authLimiter()
    const setSession = (res : import('express').Response, id : string, role: 'user' | 'admin') =>
        res.cookie(AUTH_COOKIE, signToken({sub : id,role},env.JWT_SECRET),authCookieOptions(env))

    router.get("/me",requireAuth(env), async (_req,res)=>{
        return res.json({message : "ok bro"});
    })
    return router;
}