import redis, { Redis } from "ioredis"

export const redisServer = new Redis({
    host: "127.0.0.1",
    port : 6379
})

redisServer.on("connect", () => {
    console.log("Redis connected");
    
})

redisServer.on("error",(err) => {
    console.log("Redis error",err);
    
})

