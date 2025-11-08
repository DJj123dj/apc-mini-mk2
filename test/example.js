const {APCMiniController} = require("../dist/index")

const apcMini = new APCMiniController(4,true,{xAxis:"left->right",yAxis:"top->bottom"})

console.log("Available units:",apcMini.listAvailableControllers())

function rgbToHex(red,green,blue){
    const newRed = Math.round(red).toString(16).padStart(2,"0")
    const newGreen = Math.round(green).toString(16).padStart(2,"0")
    const newBlue = Math.round(blue).toString(16).padStart(2,"0")
    return `#${newRed}${newGreen}${newBlue}`
}

apcMini.on("error",(err) => {
    console.error(err)
})

apcMini.on("connect",(id,midiName) => {
    console.log("Apc with id "+id+" and name "+midiName+" connected succesfully!")
})
apcMini.on("disconnect",(id,midiName) => {
    console.log("Apc with id "+id+" and name "+midiName+" disconnected!")
})

apcMini.startAutoConnect()
