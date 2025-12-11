const {APCMiniController,hexToRgb,rgbToHex,isHexColor,brightness} = require("../dist/index")

const apcMini = new APCMiniController(4,true,{xAxis:"left->right",yAxis:"top->bottom"},60)

console.log("Available units:",apcMini.listAvailableControllers())

//listen for errors
apcMini.on("error",(err) => {
    console.error(err)
})

//listen for connected controllers
apcMini.on("connect",(id,midiName) => {
    console.log("Apc with id "+id+" and name "+midiName+" connected succesfully!")
})

//listen for disconnected controllers
apcMini.on("disconnect",(id,midiName) => {
    console.log("Apc with id "+id+" and name "+midiName+" disconnected!")
})

//start automatically connecting APC Mini Mk2 controllers
apcMini.startAutoConnect()

/////////////////////////////////
//// RGB PAD LIGHTS EXAMPLES ////
/////////////////////////////////

// PANEL 0 (first)
apcMini.setRgbLights(0,[60,61,62],"brightness_100","static","#00ffff")
apcMini.setRgbLights(0,[1],"brightness_100","static","#ffffff")
apcMini.setRgbLights(0,[40,41,42],"brightness_10","static","#ffffff")

apcMini.setRgbLights(0,[8],"brightness_10","blinking_1/2","#ff00ff")
apcMini.setRgbLights(0,[9],"brightness_10","blinking_1/4","#ff00ff")
apcMini.setRgbLights(0,[10],"brightness_10","blinking_1/8","#ff00ff")
apcMini.setRgbLights(0,[11],"brightness_10","blinking_1/16","#ff00ff")

apcMini.setRgbLights(0,[30+16],"brightness_100","pulsing_1/2","#8000ff")
apcMini.setRgbLights(0,[30+17],"brightness_100","pulsing_1/4","#8000ff")
apcMini.setRgbLights(0,[30+18],"brightness_100","pulsing_1/8","#8000ff")
apcMini.setRgbLights(0,[30+19],"brightness_100","pulsing_1/16","#8000ff")

apcMini.setRgbLights(0,[20],"brightness_100","fade_in_1/2","#4000ff")
apcMini.setRgbLights(0,[21],"brightness_100","fade_in_1/4","#4000ff")
apcMini.setRgbLights(0,[22],"brightness_100","fade_in_1/8","#4000ff")
apcMini.setRgbLights(0,[23],"brightness_100","fade_in_1/16","#4000ff")

// PANEL 1 (second)
apcMini.setRgbLights(1,[{x:0,y:3}],"brightness_100","fade_out_1/2","#0000ff")
apcMini.setRgbLights(1,[{x:1,y:3}],"brightness_100","fade_out_1/4","#0000ff")
apcMini.setRgbLights(1,[{x:3,y:3}],"brightness_100","fade_out_1/8","#0000ff")
apcMini.setRgbLights(1,[{x:4,y:3}],"brightness_100","fade_out_1/16","#0000ff")

apcMini.setRgbLights(1,[63],"brightness_100","static","#808080")

// PANEL 0,1 HORIZONTAL/VERTICAL LIGHTS
apcMini.setHorizontalLights(0,[0,2,3,6],"blink")
apcMini.setVerticalLights(1,[0,1,2,3,4,7],"on")

// PANEL 2 (third)
// use the fillRgbLights() function to draw a rectangle of a certain size
apcMini.fillRgbLights(2,{x:2,y:2},3,4,"brightness_100","fade_out_1/2","#ff0000")


////////////////////////////////////////
//// RECEIVE BUTTON & SLIDER EVENTS ////
////////////////////////////////////////

apcMini.on("padButtonChanged",(id,location,coords,pressed,shift) => {
    console.log(pressed ? "pressed pad button:" : "released pad button:",location,coords,"withShift: "+shift,"controller: "+id)
})
apcMini.on("horizontalButtonChanged",(id,location,pressed,shift) => {
    console.log(pressed ? "pressed horizontal button:" : "released horizontal button:",location,"withShift: "+shift,"controller: "+id)
})
apcMini.on("verticalButtonChanged",(id,location,pressed,shift) => {
    console.log(pressed ? "pressed vertical button:" : "released vertical button:",location,"withShift: "+shift,"controller: "+id)
})
apcMini.on("sliderChanged",(id,location,value) => {
    console.log("slider",location,value,"controller: "+id)
})

console.log("horizontal buttons:",apcMini.getHorizontalStates(0))
console.log("rgb pads:",apcMini.getPadStates(0))
console.log("sliders:",apcMini.getSliderValues(0))



////////////////////////////////////
//// ADVANCED: INTRO ANIMATIONS ////
////////////////////////////////////

// While the APC Mini Mk2 is in the "id selection menu", it will show a custom animation made by your software.
// This can be used to show the logo/icon of the software or just a cool startup animation.

//This intro animation of 1000ms will start immediately when the device connects
apcMini.setIntroAnimation((time,frame) => {
    frame.set(0,"#ff0000")
},1000)

//This wait animation plays in repeat while the "id selection menu" is visible.
apcMini.setWaitAnimation((time,frame) => {
    frame.set(0,brightness(Math.sin(((time % 2000)/2000) * 2 * Math.PI)/2 + 0.5,"#ffff00"))
    frame.set(1,brightness(Math.sin(((time-200 % 2000)/2000) * 2 * Math.PI)/2 + 0.5,"#ffff00"))
    frame.set(2,brightness(Math.sin(((time-400 % 2000)/2000) * 2 * Math.PI)/2 + 0.5,"#ffff00"))
    frame.set(3,brightness(Math.sin(((time-600 % 2000)/2000) * 2 * Math.PI)/2 + 0.5,"#ffff00"))
    frame.set(4,brightness(Math.sin(((time-600 % 2000)/2000) * 2 * Math.PI)/2 + 0.5,"#ffff00"))
    frame.set(5,brightness(Math.sin(((time-800 % 2000)/2000) * 2 * Math.PI)/2 + 0.5,"#ffff00"))
    frame.set(6,brightness(Math.sin(((time-1000 % 2000)/2000) * 2 * Math.PI)/2 + 0.5,"#ffff00"))
    frame.set(7,brightness(Math.sin(((time-1200 % 2000)/2000) * 2 * Math.PI)/2 + 0.5,"#ffff00"))
})

//This outro animation of 1000ms plays once an id is selected. When the animation is finished, the APC Mini will work like normal.
apcMini.setOutroAnimation((time,frame) => {
    frame.set(0,"#00ff00")
},1000)