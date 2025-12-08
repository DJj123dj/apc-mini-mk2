const {APCMiniController,rgbToHex,hexToRgb} = require("../dist/index")

const apcMini = new APCMiniController(2) //max 2 controllers

console.log("Available units:",apcMini.listAvailableControllers())

//listen for errors
apcMini.on("error",(err) => {
    console.error(err)
})

//listen for connected & disconnected controllers
apcMini.on("connect",(id,midiName) => {
    console.log("Apc with id "+id+" and name "+midiName+" connected succesfully!")
})
apcMini.on("disconnect",(id,midiName) => {
    console.log("Apc with id "+id+" and name "+midiName+" disconnected!")
})

//automatically connect APC Mini Mk2 controllers
apcMini.startAutoConnect()

//first light: static cyan
apcMini.setRgbLights(0,0,"brightness_100","static","#00ffff")
//light 2 & 3: static red
apcMini.setRgbLights(0,[1,2],"brightness_100","static","#ff0000")
//last light & (3,3): blinking white
apcMini.setRgbLights(0,[63,{x:3,y:3}],"brightness_10","blinking_1/2","#ffffff")

//first 3 lights on second controller: fading-out blue
apcMini.setRgbLights(1,[0,1,2],"brightness_100","fade_out_1/2","#0000ff")

//set & configure horizontal/vertical sidebar lights
apcMini.setHorizontalLights(0,[0,2,3,6],"blink")
apcMini.setVerticalLights(1,[0,1,2,3,4,7],"on")

//listen for button events
apcMini.on("padButtonChanged",(id,location,coords,pressed,shift) => {
    console.log("pad button event:",pressed,location,coords,"withShift: "+shift,"controller: "+id)
})
apcMini.on("horizontalButtonChanged",(id,location,pressed,shift) => {
    console.log("horizontal button event:",pressed,location,"withShift: "+shift,"controller: "+id)
})
apcMini.on("verticalButtonChanged",(id,location,pressed,shift) => {
    console.log("vertical button event:",pressed,location,"withShift: "+shift,"controller: "+id)
})
apcMini.on("sliderChanged",(id,location,value) => {
    console.log("slider changed:",location,value)
})

//poll current state of buttons & sliders
console.log("horizontal buttons:",apcMini.getHorizontalStates(0))
console.log("rgb pads:",apcMini.getPadStates(0))
console.log("sliders:",apcMini.getSliderValues(0))