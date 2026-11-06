import { redisServer } from "../redis.js"

const addNum = `
    local a = tonumber(ARGV[1])
    local b = tonumber(ARGV[2])

    return a + b
`
const user = `
    return {redis.pcall("GET",KEYS[1]),
    redis.pcall("GET",KEYS[2])}
`

const count = `


    local cnt = redis.pcall("GET",KEYS[1])
    cnt = tonumber(cnt) 

    if cnt == nil then
        cnt = 0
    end

    if cnt < 100 then
        cnt = redis.call("INCR",cnt)
    end

    return cnt;
`

const getArray = `

    const bitMap = redis.call("GET",KEYS[1])

    if bitMap == nil then
        

`
export const bitMap =  redisServer.eval("getArray",count)


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

    return {offset,currentState,desiredState,counter,changed}
`

const bulkUpdate = `


    local upds = tonumber(ARGV[1])

    if(upds == nil or upds <  0 or upds > 100) then
        return redis.error_reply("Invalid no of updates")
    end

    
    for i = 1 , upds do
    
    
        local offset = tonumber(ARGV[(i-1)* 2 + 2])
        local desiredState = tonumber(ARGV[(i-1)* 2 + 3])
        
        if offset == nil or (offset < 0 or offset > 100) then
            return redis.error_reply("Invalid offset")
        end
        
        if desiredState == nil or (desiredState ~= 1 and desiredState ~= 0) then
            return redis.error_reply("Invalid desired State")
        end
        
    end
        
    --Update
        
    local counter = tonumber(redis.call("GET",KEYS[2]))

    if counter == nil then
        counter = redis.call("BITCOUNT",KEYS[1])
        redis.call("SET",KEYS[2],counter)
    end 

    local changedCount = 0
        
    for i = 1 , upds do
        
        local offset = tonumber(ARGV[(i-1)* 2 + 2])
        local desiredState = tonumber(ARGV[(i-1)* 2 + 3])
        

        local currentState = redis.call("GETBIT",KEYS[1],offset)

        local changed = 1

        if currentState == desiredState then
            changed = 0
        end


        local newState
        
        if changed == 1 then
            newState = desiredState
            changedCount++
            redis.call("SETBIT",KEYS[1],offset,newState)

            if newState == 1 then
                counter = redis.call("INCR",KEYS[2])
            else 
                counter = redis.call("DECR",KEYS[2])
            end
        end
    end

    return {changedCount,counter}
`

export const result4 = await redisServer.eval(toggleKey,2,"count","counter",10,1)

console.log(result4);
