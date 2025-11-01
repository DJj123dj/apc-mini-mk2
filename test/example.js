const {APCMiniController} = require("../dist/index")

const apcMini = new APCMiniController(4,true)

console.log("Available units:",apcMini.listAvailableControllers())

apcMini.on("connect",(id,midiName) => {
    console.log("Apc with id "+id+" and name "+midiName+" connected succesfully!")
})
apcMini.on("disconnect",(id,midiName) => {
    console.log("Apc with id "+id+" and name "+midiName+" disconnected!")
})

apcMini.startAutoConnect()
