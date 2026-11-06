import {createElement,render,diff,patch} from "./virtual.dom.js"

const container = document.getElementById("container")
const count = document.getElementById("count")
container.addEventListener('change',tickCheck)


const socket = io("http://localhost:8082")


// let checkArray = JSON.parse(localStorage.getItem("checkArray") || new Array(100).fill(0))
const getArrayResponse = await fetch("http://localhost:8082/getArray")

const getArrayData = await getArrayResponse.json()

const checkArray = getArrayData.states
let counter = getArrayData.counter

count.innerHTML = `Checked : ${counter}/100`




for(let j = 0;j<100;j++){
    const ele = document.createElement("input")
    ele.type = 'checkbox'
    ele.className = "box"
    ele.id = j;      
    ele.checked = checkArray[j] === 1
    container.appendChild(ele)
}


async function tickCheck(e){
    const offset = Number(e.target.id)
    const desiredState = e.target.checked ? 1 : 0
    if(offset>=0 && offset<100){
        
        socket.emit("updateState",{offset,desiredState})        
    }
    
}

socket.on("changedState",(payload) => {
            if(payload.changed){
                if(payload.desiredState == 1)   counter++
                else  counter--
                score()        
            }

        })

socket.on("updateElse",(payload) => {
    const offset = payload.offset
    const counterUpdate = payload.counter
    const checkbox = document.getElementById(offset.toString())
    checkbox.checked = (payload.desiredState == 1)? true : false
    counter = counterUpdate
    score()
    
})

function score(){

    count.innerHTML = `Checked : ${counter}/100`
}


const checkAll = document.getElementById("checkAll")

checkAll.addEventListener('click',() => {
    const boxes = document.querySelectorAll(".box")
    boxes.forEach((e) => e.checked = true)
    checkArray.fill(1)
    totalScore = 100
    localStorage.setItem("checkArray",JSON.stringify(checkArray))
    score()
})

const uncheckAll = document.getElementById("uncheckAll")

uncheckAll.addEventListener('click',() => {
    const boxes = document.querySelectorAll(".box")
    boxes.forEach((e) => e.checked = false)
    totalScore = 0
    checkArray.fill(0)
    localStorage.setItem("checkArray",JSON.stringify(checkArray))
    score()
})
