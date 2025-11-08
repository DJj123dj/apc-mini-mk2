const {APCMiniController,hexToRgb,rgbToHex,isHexColor,brightness} = require("../dist/index")

const apcMini = new APCMiniController(4,true,{xAxis:"left->right",yAxis:"top->bottom"},60)

console.log("Available units:",apcMini.listAvailableControllers())

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
