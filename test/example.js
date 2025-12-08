const {APCMiniController,hexToRgb,rgbToHex,isHexColor,brightness} = require("../dist/index")

const apcMini = new APCMiniController(4,true,{xAxis:"left->right",yAxis:"top->bottom"},60)

console.log("Available units:",apcMini.listAvailableControllers())

apcMini.on("error",(err) => {
    console.error(err)
})

apcMini.on("connect",(id,midiName) => {
    console.log("Apc with id "+id+" and name "+midiName+" connected succesfully!")
    /*
    apcMini.setRgbLight(id,0,"brightness_100","#0000ffi")
    apcMini.setRgbLight(id,1,"brightness_100","#00ffff")
    apcMini.setRgbLight(id,2,"brightness_100","#ff00ff")
    apcMini.setRgbLight(id,3,"brightness_100","#ff0000")
    apcMini.setRgbLight(id,4,"brightness_100","#ffff00")
    apcMini.setRgbLight(id,5,"brightness_100","#00ff00")
    */

    
    
/*
    let i = 0
    setInterval(() => {
        apcMini.testingRGBBulk(id,[
            {position:0,hex:"#f8ba00"},
            {position:1,hex:rgbToHex(i,0,0)},
            {position:2,hex:"#00ff00"},
            {position:3,hex:"#0000ff"},
            {position:4,hex:"#ffff00"},
            {position:5,hex:"#f8ba00"},
            {position:6,hex:"#808000"},
            {position:7,hex:"#f8ba00"},
            {position:8,hex:"#f8ba00"},
        ])

        if (i < 0xff) i++
        else i = 0
        console.log(i)
    },10)
    */

})
apcMini.on("disconnect",(id,midiName) => {
    console.log("Apc with id "+id+" and name "+midiName+" disconnected!")
})

apcMini.startAutoConnect()

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

apcMini.setRgbLights(1,[{x:0,y:3}],"brightness_100","fade_out_1/2","#0000ff")
apcMini.setRgbLights(1,[{x:1,y:3}],"brightness_100","fade_out_1/4","#0000ff")
apcMini.setRgbLights(1,[{x:3,y:3}],"brightness_100","fade_out_1/8","#0000ff")
apcMini.setRgbLights(1,[{x:4,y:3}],"brightness_100","fade_out_1/16","#0000ff")

apcMini.setRgbLights(0,[63],"brightness_100","static","#808080")

apcMini.setHorizontalLights(0,[0,2,3,6],"blink")
apcMini.setVerticalLights(1,[0,1,2,3,4,7],"on")

apcMini.fillRgbLights(2,{x:2,y:2},3,4,"brightness_100","fade_out_1/2","#ff0000")

apcMini.on("padButtonChanged",(id,location,coords,pressed,shift) => {
    console.log(pressed ? "pressed pad button:" : "released pad button:",location,coords,"withShift: "+shift,"controller: "+id)
})
apcMini.on("horizontalButtonChanged",(id,location,pressed,shift) => {
    console.log(pressed ? "pressed horizontal:" : "released horizontal:",location,"withShift: "+shift,"controller: "+id)
})

apcMini.setIntroAnimation((time,frame) => {
    frame.set(0,"#ff0000")
},1000)
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
apcMini.setOutroAnimation((time,frame) => {
    frame.set(0,"#00ff00")
},1000)

apcMini.on("sliderChanged",(id,location,value) => {
    console.log("slider",location,value)
})

//setInterval(() => {
//    console.log("sliders:",apcMini.getSliderValues(0))
//},500)

//apcMini.on("horizontalButtonChanged",(id,location,pressed,shift) => {
//    console.log(pressed ? "pressed horizontal button:" : "released horizontal button:",location,"withShift: "+shift,"controller: "+id)
//})
//apcMini.on("verticalButtonChanged",(id,location,pressed,shift) => {
//    console.log(pressed ? "pressed vertical button:" : "released vertical button:",location,"withShift: "+shift,"controller: "+id)
//})

/**
 * TODO TODO TODO
 * - ✅ ability to assign the id manually by clicking on a horizontal button on the APC mini itself using 'assignIdManually' == true
 * - ✅ Also provide a "STOP" button next to these to ignore this APC mini to be used in another program.
 * - ✅ Stop autoconnect feature
 * - ✅ test coordinates!!
 * - ✅ Provider clear feedback if a controller has connected succesfully using manualConnect()
 * - ✅ Set LED status manually, cache this data & if wanted, preserve this cache per-id when APC gets disconnected accidentally
 * - ✅ multiple different coordinate systems (with a default one)
 * - ✅ optimize resetLights to make use of the rect() fill rgb pads function
 * - ✅ fill LED with shapes LEDs (e.g. rectangle, circle, ...)
 * - ✅ event based button events --> (each button has controller, x, y OR id (unique over all APCs))
 * - ✅ auto-disable "notes" mode when accidentally triggered using Shift+... (via sysex msg --> more info see livecontrol v1)
 * - ✅ utility funcs like connectedAmount(), ...
 * - ✅ Get button & actionpad data manually by polling or event-based
 * - ✅ startup sequence/animation
 * - ✅ draw pattern via string/2DArray ->> Color[][] with start X,Y position
 * - ✅ slider events + slider polling 
 * - ✅ initial slider values on startup
 * - ✅ disconnect ALL function
 * - ✅ Make sure every function + property is documented
 * - Create an advanced README.md file + advanced docs for the available coordinate systems, dark colors, ...
 * - Utility functions like hsl(), hsv() & more conversions?
 * - fix bug that pressing a button while disconnecting keeps the button pressed (release event not triggered anymore)
 */