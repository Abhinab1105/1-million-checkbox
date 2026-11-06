import {createServer} from "node:http"
import express, { urlencoded } from "express"
import {Server} from "socket.io"
import { redisServer } from "../redis.js"
import "dotenv/config"
import cors from "cors"

const app = express()

app.use(cors())
app.use(express.json())
app.use(urlencoded({extended:true}))
const PORT = process.env.PORT || 8082

await redisServer.ping()

const server = createServer(app)
const io = new Server(server, {
    cors: {
        origin: "http://127.0.0.1:5500",
        methods: ["GET", "POST"]
    }
});




app.get("/",(req,res) => res.send("Hello"))

app.get("/getArray", async (req,res) => {
    
    try {
        const getArray = `
        local bitMap = redis.call("GET",KEYS[1])
        
        if bitMap == false  then
        redis.call("SETBIT",KEYS[1],99,0)
        bitMap = redis.call("GET",KEYS[1])
        end
        
        local counter = tonumber(redis.call("GET",KEYS[2]))
        
        if counter == nil or counter < 0 or counter > 100 then
        counter = redis.call("BITCOUNT",KEYS[1])
        redis.call("SET",KEYS[2],counter)
        end
        
        return {counter}
        `
        
        const result = await redisServer.eval(getArray,2,"board:bitMap","counter")



        const bitMap = await redisServer.getBuffer("board:bitMap")
        
        const states = []
        
    for(let i = 0;i<100;i++){
        let byteInd = Math.floor(i/8)
        let bitInd = 7 - (i % 8)
        let state = (bitMap[byteInd] >> bitInd) & 1
        states.push(state)
    }

    console.log("Decoded bitmap:", bitMap);
    console.log("Decoded state at 6:", states[6]);
    console.log("Counter:", result[1]);
    return res.json({states,counter : result[0]})
    
} catch (error) {
    console.log(error);
    
}

})

app.post("/updateState", async (req,res) => {

   
})

io.on('connection', async (socket) => {
    console.log('a user connected on',socket.id);
    socket.on("updateState", (payload) => {
        updateState(socket,payload)
    })
});

async function updateState(socket,payload){
     const {offset,desiredState} = payload
    console.log(offset);
    
    if( !Number.isInteger(offset) || offset < 0 || offset >= 100)
        throw new Error("Invalid ID")

    if(desiredState == null || !Number.isInteger(desiredState) || (desiredState != 0 && desiredState != 1))
        throw new Error("Invalid desired state")
    
    const toggleKey = `

    local offset = tonumber(ARGV[1])

    if offset == nil or offset < 0 or offset>999999  then
    return "Invalid offset"
    end

    local desiredState = tonumber(ARGV[2])

    if desiredState == nil or (desiredState ~= 0 and desiredState ~= 1) then
        return redis.error_reply("Invalid desired state")
    end

    local counter = tonumber(redis.call("GET",KEYS[2]))

    if counter == nil then
        counter = redis.call("BITCOUNT",KEYS[1])
        redis.call("SET",KEYS[2],counter)
    end 

    local currentState = redis.call("GETBIT",KEYS[1],offset)

    local changed = 1

    if currentState == desiredState then
        changed = 0
    end


    local newState
    
    if changed == 1 then
        newState = desiredState
        redis.call("SETBIT",KEYS[1],offset,newState)
        if newState == 1 then
            counter = redis.call("INCR",KEYS[2])
        else 
            counter = redis.call("DECR",KEYS[2])
        end
    end

    return {changed,counter,offset,desiredState,currentState}
    `
    const result4 = await redisServer.eval(toggleKey,2,"board:bitMap","counter",offset,desiredState)
    console.log({desiredState,changed : result4[0],currentState : result4[4]});
    
    socket.emit("changedState",{changed : result4[0],desiredState : result4[3]})
    socket.broadcast.emit("updateElse",{offset : result4[2], counter : result4[1] , changed : result4[0],desiredState : result4[3]})
}


server.listen(PORT,() => {
console.log(`Server is running on port ${PORT}`);

})