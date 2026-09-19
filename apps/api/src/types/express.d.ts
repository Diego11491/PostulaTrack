import type{AuthUser}from"@postulatrack/contracts";declare global{namespace Express{interface Request{user?:AuthUser;sessionId?:number}}}export{}
