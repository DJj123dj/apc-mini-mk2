import easymidi from "easymidi"

/**A pre-connection of an APC Mini mk2 controller. */
interface APCMiniPreConnection {
    name:string,
    input:easymidi.Input,
    output:easymidi.Output,
    animationInterval:NodeJS.Timeout|null
}
/**A normal connection of an APC Mini mk2 controller. */
interface APCMiniConnection {
    name:string,
    input:easymidi.Input,
    output:easymidi.Output,
    id:number
}
/**Available action pad button coordinate systems. */
type APCMiniCoordinateSystem = {xAxis:"left->right"|"right->left",yAxis:"top->bottom"|"bottom->top"}|{xAxis:"top->bottom"|"bottom->top",yAxis:"left->right"|"right->left"}
/**A valid hex color for the APC Mini RGB Pads. */
export type APCMiniHexColor = `#${string}`
/**A mathematical X-Y coordinate. */
export interface APCMiniCoordinates {
    x:number,
    y:number
}
/**Available brightness values for the RGB action pads of the APC Mini mk2 controller. */
type APCMiniBrightnessMode = (
    "brightness_5"|
    "brightness_10"|
    "brightness_20"|
    "brightness_25"|
    "brightness_30"|
    "brightness_40"|
    "brightness_50"|
    "brightness_60"|
    "brightness_70"|
    "brightness_75"|
    "brightness_80"|
    "brightness_90"|
    "brightness_100"
)
/**Available light modes for the RGB action pads of the APC Mini mk2 controller. */
type APCMiniLightMode = (
    "static"|
    "pulsing_1/2"|
    "pulsing_1/4"|
    "pulsing_1/8"|
    "pulsing_1/16"|
    "blinking_1/2"|
    "blinking_1/4"|
    "blinking_1/8"|
    "blinking_1/16"|
    "blinking_1/24"|
    "short_blinking_1/2"|
    "short_blinking_1/4"|
    "short_blinking_1/8"|
    "short_blinking_1/16"|
    "short_blinking_1/24"|
    "fade_in_1/2"|
    "fade_in_1/4"|
    "fade_in_1/8"|
    "fade_in_1/16"|
    "fade_out_1/2"|
    "fade_out_1/4"|
    "fade_out_1/8"|
    "fade_out_1/16"
)
/**The callback function for the preconnect animation */
type APCMiniPreconnectAnimation = (time:number,currentFrame:Map<number,APCMiniHexColor>) => void

const BRIGHTNESS_MAP = {
    "brightness_5":0.05,
    "brightness_10":0.1,
    "brightness_20":0.2,
    "brightness_25":0.25,
    "brightness_30":0.3,
    "brightness_40":0.4,
    "brightness_50":0.5,
    "brightness_60":0.6,
    "brightness_70":0.7,
    "brightness_75":0.75,
    "brightness_80":0.8,
    "brightness_90":0.9,
    "brightness_100":1
}
const MODE_MAP = {
    "static":1,
    "pulsing_1/2":0.5,
    "pulsing_1/4":0.25,
    "pulsing_1/8":0.125,
    "pulsing_1/16":0.0625,
    "blinking_1/2":0.5,
    "blinking_1/4":0.25,
    "blinking_1/8":0.125,
    "blinking_1/16":0.0625,
    "blinking_1/24":0.04167,
    "short_blinking_1/2":0.5,
    "short_blinking_1/4":0.25,
    "short_blinking_1/8":0.125,
    "short_blinking_1/16":0.0625,
    "short_blinking_1/24":0.04167,
    "fade_in_1/2":0.5,
    "fade_in_1/4":0.25,
    "fade_in_1/8":0.125,
    "fade_in_1/16":0.0625,
    "fade_out_1/2":0.5,
    "fade_out_1/4":0.25,
    "fade_out_1/8":0.125,
    "fade_out_1/16":0.0625
}

/** ## APCMiniController (`class`)
 * The main class for managing one or multiple **Akai Apc Mini Mk2**'s. With this class you're able to:
 * - Receive button events.
 * - Receive slider events.
 * - Manually request button & slider states.
 * - Manually set horizontal, vertical & actionpad RGB lights.
 * - Create startup/connect animations
 * - Manage connected APC Mini Mk2's
 * - Use built-in effects for awesome button lights.
 * - Change coordinate systems, apply different settings & so much more!
 * 
 * @example
 * //connect up to 2 controllers & automatically assign ID's/locations
 * const apcMini = new APCMiniController(2,false)
 * 
 * //connect up to 2 controllers & manually assign ID's/locations
 * const apcMini2 = new APCMiniController(2,true)
 * 
 * //or use a custom coordinate system
 * const apcMini3 = new APCMiniController(2,true,{xAxis:"left->right",yAxis:"top->bottom"}) 
 */
export class APCMiniController {
    /////////////////////////////
    //// INTERNAL PROPERTIES ////
    /////////////////////////////

    /**A list of all active connections. */
    #connections: APCMiniConnection[] = []
    /**A list of all active pre-connections (without assigned ID, still in manual ID Selector program). */
    #preconnections: APCMiniPreConnection[] = []
    /**A blacklist of ignored midi devices, resetted when the device is disconnected. */
    #ignoredNames: Set<string> = new Set()
    /**Listeners for the on() & emit() events. */
    #listeners: {event:string,cb:Function}[] = []
    /**The interval-id of the auto-disconnect feature. Should be cleared before exit. */
    #disconnectInterval: NodeJS.Timeout|null = null
    /**The interval-id of the auto-connect feature. Should be cleared before exit. */
    #connectInterval: NodeJS.Timeout|null = null
    /**The interval-id of the lights renderer. Should be cleared before exit. */
    #renderInterval: NodeJS.Timeout|null = null
    /**A name-list of all active connections.*/
    get #preconnectedNames(){
        return new Set(this.#preconnections.map((c) => c.name))
    }
    /**A name-list of all active preconnections (without assigned ID, still in manual ID Selector program)..*/
    get #connectedNames(){
        return new Set(this.#connections.map((c) => c.name))
    }
    /**Utilities for coordinates & colors. */
    #utils: APCMiniUtils
    /**The cache for all RGB lights of the APC Mini Mk2. */
    #rgbLightCache: Map<number,Map<number,{id:number,location:number,color:APCMiniHexColor,mode:APCMiniLightMode}>> = new Map()
    /**The cache for all horizontal lights of the APC Mini Mk2. */
    #horizontalLightCache: Map<number,Map<number,{id:number,location:number,mode:"off"|"on"|"blink"}>> = new Map()
    /**The cache for all vertical lights of the APC Mini Mk2. */
    #verticalLightCache: Map<number,Map<number,{id:number,location:number,mode:"off"|"on"|"blink"}>> = new Map()
    /**The bpm on which the lights blink/pulse. `Default: 60` */
    lightBpm: number
    /**Is shift pressed for any of the connected controllers? */
    #shiftPressed: boolean = false
    /**The cache for all pad button states of the APC Mini Mk2. */
    #padButtonCache: Map<number,Map<number,boolean>> = new Map()
    /**The cache for all horizontal button states of the APC Mini Mk2. */
    #horizontalButtonCache: Map<number,Map<number,boolean>> = new Map()
    /**The cache for all vertical button states of the APC Mini Mk2. */
    #verticalButtonCache: Map<number,Map<number,boolean>> = new Map()
    /**The cache for all slider states of the APC Mini Mk2. */
    #sliderCache: Map<number,Map<number,number>> = new Map()
    
    /**This function will be called before selecting the id of the controller. It can be used to display a cool animation. */
    #preconnectIntroAnimation: APCMiniPreconnectAnimation|null = null
    /**This function will be called while selecting the id of the controller. It can be used to display a cool animation. */
    #preconnectWaitAnimation: APCMiniPreconnectAnimation|null = null
    /**This function will be called after selecting the id of the controller. It can be used to display a cool animation. */
    #preconnectOutroAnimation: APCMiniPreconnectAnimation|null = null
    /**The duration of the preconnect intro in milliseconds. */
    #preconnectIntroDuration: number = 1000
    /**The duration of the preconnect outro in milliseconds. */
    #preconnectOutroDuration: number = 1000

    /////////////////////////////
    //// EXTERNAL PROPERTIES ////
    /////////////////////////////

    /**The maximum amount of controllers able to connect at the same time. */
    readonly maxControllerAmount: number
    /**Enable assigning a controller ID manually by pressing a button instead of choosing it automatically. */
    readonly manualIdAssignmentsEnabled: boolean
    /**The selected actionpad coordinate system. */
    readonly coordinates: APCMiniCoordinateSystem
    
    ////////////////////////////
    //// CONSTRUCTOR + INIT ////
    ////////////////////////////

    constructor(maxControllerAmount:number=1,manualIdAssignmentsEnabled:boolean=false,coordinates:APCMiniCoordinateSystem={xAxis:"left->right",yAxis:"top->bottom"},lightBpm:number=60){
        this.maxControllerAmount = maxControllerAmount
        this.manualIdAssignmentsEnabled = manualIdAssignmentsEnabled
        this.lightBpm = lightBpm
        
        if (!coordinates.xAxis || !coordinates.yAxis) throw new Error("(APCMiniController) Invalid coordinate system. Expected an {xAxis,yAxis} object.")
        if (!(["left->right","right->left"].includes(coordinates.xAxis) && ["top->bottom","bottom->top"].includes(coordinates.yAxis)) && !(["left->right","right->left"].includes(coordinates.yAxis) && ["top->bottom","bottom->top"].includes(coordinates.xAxis))) throw new Error("(APCMiniController) Invalid coordinate system. Expected valid values for each of the {xAxis,yAxis} properties.")
        this.coordinates = coordinates
        this.#utils = new APCMiniUtils(coordinates)
        this.#autoDisconnectUnusedUnits()

        process.on("exit",() => {
            this.#handleShutdown()
        })
        process.on("SIGINT",() => {
            this.#handleShutdown()
            process.exit(0)
        })
        process.on("SIGUSR1",() => {
            this.#handleShutdown()
            process.exit(0)
        })
        process.on("SIGUSR2",() => {
            this.#handleShutdown()
            process.exit(0)
        })
        
        this.#renderInterval = setInterval(() => {
            this.#renderConnectedLights()
            this.#renderHorizontalLights()
            this.#renderVerticalLights()
        },50)
    }

    ////////////////////////////
    //// INTERNAL FUNCTIONS ////
    ////////////////////////////

    /**Clear intervals, event-loops & reset lights before shutdown/exit. */
    #handleShutdown(){
        if (this.#disconnectInterval) clearInterval(this.#disconnectInterval)
        if (this.#connectInterval) clearInterval(this.#connectInterval)
        if (this.#renderInterval) clearInterval(this.#renderInterval)

        for (const name of [...this.#preconnectedNames,...this.#connectedNames]){
            this.#disconnectMidi(name)
        }
    }
    /**Returns a list of all (apc mini) units and a list of the available/unused (apc mini) units. */
    #discoverAvailableUnits(){
        const inputs = easymidi.getInputs()
        const outputs = easymidi.getOutputs()
        const sharedPorts = inputs.filter((input) => outputs.includes(input))

        const apcMinis = process.platform == "darwin" ? sharedPorts.filter((p) => p.toLowerCase().startsWith("apc mini mk2 control")) : sharedPorts.filter((p) => p.toLowerCase().startsWith("apc mini mk2"))
        const availableApcMinis = apcMinis.filter((apc) => !this.#connectedNames.has(apc) && !this.#preconnectedNames.has(apc) && !this.#ignoredNames.has(apc))
        return {all:apcMinis,available:availableApcMinis}
    }
    /**Automatically connect all (apc mini) units which are available. */
    #autoConnectAvailableUnits(){
        const availableApcMinis = this.#discoverAvailableUnits()
        for (const apc of availableApcMinis.available){
            this.#connectMidi(apc)
        }
    }
    /**Automatically remove/destroy all related events/objects of the (apc mini) units which are disconnected from the computer. */
    #autoDisconnectUnusedUnits(){
        if (this.#disconnectInterval) clearInterval(this.#disconnectInterval)
        this.#disconnectInterval = setInterval(() => {
            const apcMinis = this.#discoverAvailableUnits().all
            const disconnectedApcMinis = [...this.#connectedNames,...this.#preconnectedNames,...this.#ignoredNames].filter((apc) => !apcMinis.includes(apc))
            for (const apc of disconnectedApcMinis){
                this.#disconnectMidi(apc)
            }

            //+ EXTRA --> periodically update pre-connection lights every 500ms (not related to disconnecting units)
            for (const preconnection of this.#preconnections){
                this.#renderPreconnectLights(preconnection.output)
            }
        },500)
    }
    /**A mini algorithm to find the lowest possible ID which isn't in-use yet. */
    #getLowestUnusedId(){
        const usedIds = this.#connections.map((c) => c.id)
        let id = 0
        while (usedIds.includes(id)){id++}
        return id
    }
    /**Connect a raw midi device by name and assign a custom or the lowest possible ID. */
    #connectMidi(name:string,customId?:number){
        try{
            if (typeof customId !== "number" && this.manualIdAssignmentsEnabled){
                //if no customId is given and the ids are assigned manually, start the pre-connect mode to let the user choose the ID of the device.
                this.#startPreconnectIdSelector(name)
                return
            }else{
                //normal connection procedure
                const id = customId || this.#getLowestUnusedId()
                if (this.#connections.length >= this.maxControllerAmount) return null
                if (this.#preconnections.map((c) => c.name).includes(name)) return null
                if (this.#connections.map((c) => c.id).includes(id)) return null
                if (this.#connections.map((c) => c.name).includes(name)) return null
                if (this.#ignoredNames.has(name)) return null

                const input = new easymidi.Input(name)
                const output = new easymidi.Output(name)
                const connection: APCMiniConnection = {name,id,input,output}
                this.#connections.push(connection)
                this.#listenForInputs(connection)
                output.send("sysex",[0xF0,0x47,0x7F,0x4F,0x62,0x00,0x01,0x00,0xF7])
                this.#emit("connect",connection.id,connection.name)
                this.#preconnections.forEach((c) => this.#renderPreconnectLights(c.output))
                return connection
            }
        }catch(err){
            return null
        }
    }
    /**Disconnect a raw midi device by name and remove/destroy all related events/objects. */
    #disconnectMidi(name:string){
        try{
            //disconnect (in case of normal connection)
            const index = this.#connections.findIndex((c) => c.name === name)
            if (index > -1){
                //remove from connections
                const connection = this.#connections.splice(index,1)[0]
                connection.input.removeAllListeners()

                //reset horizontal lights
                for (let i = 0; i < 8; i++){
                    connection.output.send("noteon",{
                        channel:0,
                        note:i+100,
                        velocity:0,
                    })
                }

                //reset vertical lights
                for (let i = 0; i < 8; i++){
                    connection.output.send("noteon",{
                        channel:0,
                        note:i+112,
                        velocity:0,
                    })
                }

                //reset RGB Lights
                let locations: {midiLocation:number,hex:string}[] = []
                for (let i = 0; i < 64; i++) {locations.push({midiLocation:i,hex:"#000000"})}
                try{
                    this.#sendBulkRgbLights(connection.output,locations)
                }catch(err){
                    console.error(err)
                    return false
                }

                //emit disconnect events
                connection.input.close()
                connection.output.close()
                this.#emit("disconnect",connection.id,connection.name)
            }

            //disconnect (in case of pre-connection)
            const preIndex = this.#preconnections.findIndex((c) => c.name === name)
            if (preIndex > -1){
                const preconnection = this.#preconnections.splice(preIndex,1)[0]
                if (preconnection){
                    if (preconnection.animationInterval) clearInterval(preconnection.animationInterval)
                    this.#renderPreconnectLights(preconnection.output,true)

                    //reset RGB Lights
                    let locations: {midiLocation:number,hex:string}[] = []
                    for (let i = 0; i < 64; i++) {locations.push({midiLocation:i,hex:"#000000"})}
                    try{
                        this.#sendBulkRgbLights(preconnection.output,locations)
                    }catch(err){
                        console.error(err)
                        return false
                    }

                    //remove input/output IO & listeners
                    preconnection.input.removeAllListeners()
                    preconnection.input.close()
                    preconnection.output.close()
                }
            }

            //remove from ignored names
            this.#ignoredNames.delete(name)
        }catch(err){}
    }
    /**Start the pre-connect ID Selector program to manually select an ID for the device by pressing a button. */
    #startPreconnectIdSelector(name:string){
        if (this.#preconnections.map((c) => c.name).includes(name)) return null
        if (this.#connections.map((c) => c.name).includes(name)) return null
        const preconnection: APCMiniPreConnection = {name,input:new easymidi.Input(name),output:new easymidi.Output(name),animationInterval:null}
        this.#preconnections.push(preconnection)
        preconnection.output.send("sysex",[0xF0,0x47,0x7F,0x4F,0x62,0x00,0x01,0x00,0xF7])
        this.#renderPreconnectLights(preconnection.output)

        //intro animation
        const animationFrame = this.#utils.createAnimationFrame()
        let startTime = Date.now()
        let waitTime: number|null = null
        let outroTime: number|null = null
        preconnection.animationInterval = setInterval(() => {
            if (outroTime){
                //display outro animation
                const time = (Date.now() - outroTime)
                if (time < this.#preconnectOutroDuration && this.#preconnectOutroAnimation){
                    this.#preconnectOutroAnimation(time,animationFrame)
                    this.#sendBulkRgbLights(preconnection.output,this.#utils.animationFrameToBulkPadColors(animationFrame))
                }else{
                    //end animation
                    if (preconnection.animationInterval) clearInterval(preconnection.animationInterval)
                    //reset RGB Lights
                    let locations: {midiLocation:number,hex:string}[] = []
                    for (let i = 0; i < 64; i++) {locations.push({midiLocation:i,hex:"#000000"})}
                    try{
                        this.#sendBulkRgbLights(preconnection.output,locations)
                    }catch(err){
                        console.error(err)
                        return false
                    }
                }
            }else if (waitTime){
                //display wait animation
                const time = (Date.now() - waitTime)
                if (this.#preconnectWaitAnimation){
                    this.#preconnectWaitAnimation(time,animationFrame)
                    this.#sendBulkRgbLights(preconnection.output,this.#utils.animationFrameToBulkPadColors(animationFrame))
                }
            }else{
                //display intro animation
                const time = (Date.now() - startTime)
                if (time < this.#preconnectIntroDuration && this.#preconnectIntroAnimation){
                    this.#preconnectIntroAnimation(time,animationFrame)
                    this.#sendBulkRgbLights(preconnection.output,this.#utils.animationFrameToBulkPadColors(animationFrame))
                }else{
                    //go to wait animation
                    waitTime = Date.now()
                }
            }
        },50)

        
        preconnection.input.on("noteon",(note) => {
            if (note.note > 99 && note.note < 108){
                const button = note.note-100 //horizontal buttons
                if (!this.listUsedIds().includes(button) && button < this.maxControllerAmount){
                    outroTime = Date.now()

                    //wait until outro animation is finished + 10 extra milliseconds
                    setTimeout(() => {
                        //remove from preconnect list & reset lights
                        const index = this.#preconnections.findIndex((c) => c.name === name)
                        if (index < 0) return
                        this.#preconnections.splice(index,1)
                        this.#renderPreconnectLights(preconnection.output,true)

                        //reset RGB Lights
                        let locations: {midiLocation:number,hex:string}[] = []
                        for (let i = 0; i < 64; i++) {locations.push({midiLocation:i,hex:"#000000"})}
                        try{
                            this.#sendBulkRgbLights(preconnection.output,locations)
                        }catch(err){
                            console.error(err)
                            return false
                        }

                        //remove input/output IO & listeners
                        preconnection.input.removeAllListeners()
                        preconnection.input.close()
                        preconnection.output.close()
                        
                        //start connection with custom ID
                        this.#connectMidi(name,button)
                    },(this.#preconnectOutroAnimation) ? this.#preconnectOutroDuration+10 : 0)
                }

            }else if (note.note > 111 && note.note < 120){
                const button = note.note-112 //vertical buttons
                if (button == 0){
                    //remove from preconnect list & reset lights
                    const index = this.#preconnections.findIndex((c) => c.name === name)
                    if (index < 0) return
                    this.#preconnections.splice(index,1)
                    this.#renderPreconnectLights(preconnection.output,true)

                    //reset RGB Lights
                    let locations: {midiLocation:number,hex:string}[] = []
                    for (let i = 0; i < 64; i++) {locations.push({midiLocation:i,hex:"#000000"})}
                    try{
                        this.#sendBulkRgbLights(preconnection.output,locations)
                    }catch(err){
                        console.error(err)
                        return false
                    }
                    
                    //remove input/output IO & listeners
                    preconnection.input.removeAllListeners()
                    preconnection.input.close()
                    preconnection.output.close()

                    //add to ignored names
                    this.#ignoredNames.add(name)
                }
            }
        })
    }
    /**Render the lights for the pre-connect Id Selector program. */
    #renderPreconnectLights(output:easymidi.Output,reset?:boolean){
        for (let i = 0; i < 7; i++){
            output.send("noteon",{
                channel:0,
                note:i+100,
                velocity:(!reset && i < this.maxControllerAmount && !this.listUsedIds().includes(i)) ? 1 : 0
            })
        }
        output.send("noteon",{
            channel:0,
            note:112,
            velocity:(reset) ? 0 : 1,
        })
    }
    /**Get a connection with midi (input, output) from a controller id. */
    #getMidiPortsFromId(id:number){
        return this.#connections.find((c) => c.id === id) ?? null
    }
    /**Split a number to MSB & LSB 7-bit groups */
    #splitToMsbLsb(x:number){
        return {msb:(x >> 7) & 0x7f,lsb:(x & 0x7f)}
    }
    /**Send a sysex message with bulk RGB pad values. */
    #sendBulkRgbLights(outputPort:easymidi.Output,pads:{hex:string,midiLocation:number}[]){
        const splittedPads: {hex:string,midiLocation:number}[][] = []
        let currentPads: {hex:string,midiLocation:number}[] = []
        for (const pad of pads){
            currentPads.push(pad)
            if (currentPads.length == 32){
                splittedPads.push(currentPads)
                currentPads = []
            }
        }
        if (currentPads.length > 0) splittedPads.push(currentPads)

        //split up pads in groups of 32, because bulk messages can send max 32 pads in one message.
        for (const padGroup of splittedPads){
            const header: number[] = [0xF0,0x47,0x7F,0x4F,0x24]
            const padBytes: number[] = []

            for (const {hex,midiLocation} of padGroup){
                if (!this.#utils.isHexColor(hex)) continue
                const {red,green,blue} = this.#utils.hexToRgb(hex)
                const redBytes = this.#splitToMsbLsb(red)
                const greenBytes = this.#splitToMsbLsb(green)
                const blueBytes = this.#splitToMsbLsb(blue)

                padBytes.push(midiLocation,midiLocation,redBytes.msb,redBytes.lsb,greenBytes.msb,greenBytes.lsb,blueBytes.msb,blueBytes.lsb)
            }

            const dataLength = this.#splitToMsbLsb(padBytes.length)
            const message: number[] = [...header,dataLength.msb,dataLength.lsb,...padBytes,0xF7]
            outputPort.send("sysex",message)
        }
        return true
    }
    /**Render all modes/effects of the RGB lights. */
    #renderConnectedLights(){
        //timer & BPM
        let i = Math.round((Date.now()*(this.lightBpm/60)) % 2000)

        for (const [id,controllerLights] of this.#rgbLightCache.entries()){
            const pads: {hex:string,midiLocation:number}[] = []
            const instance = this.#getMidiPortsFromId(id)
            if (!instance) continue
            const {input,output} = instance
            try{
                //static
                const staticLights = [...controllerLights.values()].filter((l) => l.mode === "static").map((l) => ({hex:l.color,midiLocation:l.location}))
                pads.push(...staticLights)

                //blinking
                const blinkingLights = [...controllerLights.values()].filter((l) => l.mode.startsWith("blinking_")).map((l) => {
                    const value = MODE_MAP[l.mode]
                    const newColor = ((i % (4000*value)) < 2000*value) ? l.color : "#000000"
                    return {hex:newColor,midiLocation:l.location}
                })
                pads.push(...blinkingLights)

                //pulsing
                const pulsingLights = [...controllerLights.values()].filter((l) => l.mode.startsWith("pulsing_")).map((l) => {
                    const value = MODE_MAP[l.mode]
                    const multiplier = ((i % (4000*value)) < 2000*value) ? (i % (4000*value))/(2000*value) : 1 - ((i % (4000*value)) - (2000*value))/(2000*value)
                    const {red,green,blue} = this.#utils.hexToRgb(l.color)
                    const newColor = this.#utils.rgbToHex(Math.round(red*multiplier),Math.round(green*multiplier),Math.round(blue*multiplier))
                    
                    return {hex:newColor,midiLocation:l.location}
                })
                pads.push(...pulsingLights)

                //fadeIn
                const fadeInLights = [...controllerLights.values()].filter((l) => l.mode.startsWith("fade_in_")).map((l) => {
                    const value = MODE_MAP[l.mode]
                    const multiplier = ((i % (4000*value)) < 2000*value) ? (i % (4000*value))/(2000*value) : 0
                    const {red,green,blue} = this.#utils.hexToRgb(l.color)
                    const newColor = this.#utils.rgbToHex(Math.round(red*multiplier),Math.round(green*multiplier),Math.round(blue*multiplier))
                    
                    return {hex:newColor,midiLocation:l.location}
                })
                pads.push(...fadeInLights)

                //fadeOut
                const fadeOutLights = [...controllerLights.values()].filter((l) => l.mode.startsWith("fade_out_")).map((l) => {
                    const value = MODE_MAP[l.mode]
                    const multiplier = ((i % (4000*value)) < 2000*value) ? 1 - (i % (4000*value))/(2000*value) : 0
                    const {red,green,blue} = this.#utils.hexToRgb(l.color)
                    const newColor = this.#utils.rgbToHex(Math.round(red*multiplier),Math.round(green*multiplier),Math.round(blue*multiplier))
                    
                    return {hex:newColor,midiLocation:l.location}
                })
                pads.push(...fadeOutLights)
                
                //send pad values to APC mini
                this.#sendBulkRgbLights(output,pads)
            }catch(err){
                console.error(err)
            }
        }
    }
    /**Render all modes/effects of the horizontal lights. */
    #renderHorizontalLights(){
        for (const [id,controllerLights] of this.#horizontalLightCache.entries()){
            const instance = this.#getMidiPortsFromId(id)
            if (!instance) continue
            const {input,output} = instance
            
            for (const light of [...controllerLights.values()]){
                output.send("noteon",{
                    channel:0,
                    note:light.location+100,
                    velocity:(light.mode == "off") ? 0 : ((light.mode == "on") ? 1 : 2),
                })
            }
        }
    }
    /**Render all modes/effects of the vertical lights. */
    #renderVerticalLights(){
        for (const [id,controllerLights] of this.#verticalLightCache.entries()){
            const instance = this.#getMidiPortsFromId(id)
            if (!instance) continue
            const {input,output} = instance
            
            for (const light of [...controllerLights.values()]){
                output.send("noteon",{
                    channel:0,
                    note:light.location+112,
                    velocity:(light.mode == "off") ? 0 : ((light.mode == "on") ? 1 : 2),
                })
            }
        }
    }
    /**Listen for input events (e.g. buttons, shift, sliders, ...) */
    #listenForInputs(connection:APCMiniConnection){
        const {id,input,output} = connection
        input.on("noteon",(note) => {
            if (note.note >= 0 && note.note < 64){
                const midiCoords = this.#utils.locationToCoordinates(note.note)
                const virtualCoords = this.#utils.transformCoordinates(midiCoords)
                const position = this.#utils.coordinatesToLocation(virtualCoords)

                if (!this.#padButtonCache.has(id)) this.#padButtonCache.set(id,new Map(new Array(64).fill(false).map((b,i) => ([i,b]))))
                const padMap = this.#padButtonCache.get(id)!
                padMap.set(position,true)
                
                this.#emit("padButtonPressed",id,position,virtualCoords,this.#shiftPressed)
                this.#emit("padButtonChanged",id,position,virtualCoords,true,this.#shiftPressed)

            }else if (note.note >= 100 && note.note < 108){
                const position = note.note-100

                if (!this.#horizontalButtonCache.has(id)) this.#horizontalButtonCache.set(id,new Map(new Array(8).fill(false).map((b,i) => ([i,b]))))
                const horizontalMap = this.#horizontalButtonCache.get(id)!
                horizontalMap.set(position,true)

                this.#emit("horizontalButtonPressed",id,position,this.#shiftPressed)
                this.#emit("horizontalButtonChanged",id,position,true,this.#shiftPressed)

            }else if (note.note >= 112 && note.note < 120){
                const position = note.note-112

                if (!this.#verticalButtonCache.has(id)) this.#verticalButtonCache.set(id,new Map(new Array(8).fill(false).map((b,i) => ([i,b]))))
                const verticalMap = this.#verticalButtonCache.get(id)!
                verticalMap.set(position,true)

                this.#emit("verticalButtonPressed",id,position,this.#shiftPressed)
                this.#emit("verticalButtonChanged",id,position,true,this.#shiftPressed)

            }else if (note.note == 122){
                this.#shiftPressed = true
                this.#emit("shiftButtonPressed",id)
                this.#emit("shiftButtonChanged",id,true)
            }
        })

        input.on("noteoff",(note) => {
            if (note.note >= 0 && note.note < 64){
                const midiCoords = this.#utils.locationToCoordinates(note.note)
                const virtualCoords = this.#utils.transformCoordinates(midiCoords)
                const position = this.#utils.coordinatesToLocation(virtualCoords)
                
                if (!this.#padButtonCache.has(id)) this.#padButtonCache.set(id,new Map(new Array(64).fill(false).map((b,i) => ([i,b]))))
                const padMap = this.#padButtonCache.get(id)!
                padMap.set(position,false)
                
                this.#emit("padButtonReleased",id,position,virtualCoords,this.#shiftPressed)
                this.#emit("padButtonChanged",id,position,virtualCoords,false,this.#shiftPressed)

            }else if (note.note >= 100 && note.note < 108){
                const position = note.note-100
                
                if (!this.#horizontalButtonCache.has(id)) this.#horizontalButtonCache.set(id,new Map(new Array(8).fill(false).map((b,i) => ([i,b]))))
                const horizontalMap = this.#horizontalButtonCache.get(id)!
                horizontalMap.set(position,false)

                this.#emit("horizontalButtonReleased",id,position,this.#shiftPressed)
                this.#emit("horizontalButtonChanged",id,position,false,this.#shiftPressed)

            }else if (note.note >= 112 && note.note < 120){
                const position = note.note-112

                if (!this.#verticalButtonCache.has(id)) this.#verticalButtonCache.set(id,new Map(new Array(8).fill(false).map((b,i) => ([i,b]))))
                const verticalMap = this.#verticalButtonCache.get(id)!
                verticalMap.set(position,false)

                this.#emit("verticalButtonReleased",id,position,this.#shiftPressed)
                this.#emit("verticalButtonChanged",id,position,false,this.#shiftPressed)

            }else if (note.note == 122){
                this.#shiftPressed = false
                this.#emit("shiftButtonReleased",id)
                this.#emit("shiftButtonChanged",id,false)
            }
        })

        input.on("cc",(cc) => {
            const location = cc.controller - 48
            const value = cc.value

            if (!this.#sliderCache.has(id)) this.#sliderCache.set(id,new Map(new Array(9).fill(0).map((s,i) => ([i,s]))))
            const sliderMap = this.#sliderCache.get(id)!
            sliderMap.set(location,value)

            this.#emit("sliderChanged",id,location,value)
        })

        //get initial slider values (using midi introduction message)
        input.on("sysex",(sysex) => {
            const bytes: number[] = sysex.bytes
            if (bytes[4] !== 0x61) return
            if (!this.#sliderCache.has(id)) this.#sliderCache.set(id,new Map(new Array(9).fill(0).map((s,i) => ([i,s]))))
            const controllerMap = this.#sliderCache.get(id)!
            bytes.slice(7,16).forEach((value,index) => {
                controllerMap.set(index,value)
            })
        })
        output.send("sysex",[0xF0,0x47,0x7F,0x4F,0x60,0x00,0x04,0x00,0x01,0x00,0x00,0xF7])

        //the controller might not be in the 0x00 (default) mode, but in one of the alternative 0x01 (note) or 0x02 (drum) modes.
        //try setting it back to default mode
        output.send("sysex",[0xF0,0x47,0x7F,0x4F,0x62,0x00,0x01,0x00,0xF7])
        input.on("sysex",(msg) => {
            if (!this.#utils.compareArrays([0xF0,0x47,0x7F,0x4F,0x62,0x00,0x01,0x00,0xF7],msg.bytes)){
                
                output.send("sysex",[0xF0,0x47,0x7F,0x4F,0x62,0x00,0x01,0x00,0xF7])
            }
        })
    }

    //////////////////////////
    //// PUBLIC FUNCTIONS ////
    //////////////////////////

    /**Start auto-connecting available (apc mini) controllers. Once the `maxControllerAmount` is reached, it will stop auto-connecting until a controller disconnects.  */
    startAutoConnect(){
        this.stopAutoConnect()
        this.#connectInterval = setInterval(() => {
            this.#autoConnectAvailableUnits()
        },1000)
        this.#autoConnectAvailableUnits()
    }
    /**Stop auto-connecting new (apc mini) controllers. */
    stopAutoConnect(){
        if (this.#connectInterval) clearInterval(this.#connectInterval)
    }
    /**Manually connect an available (apc mini) controller using a name fetched from `listAvailableControllers()`. The ID will be assigned automatically or can be provided manually. This function will throw an error when it fails to connect with the controller. */
    manualConnect(midiName:string,customId?:number){
        if (this.#connectedNames.size < this.maxControllerAmount){
            if (customId && this.#connections.map((c) => c.id).includes(customId)){
                this.#emit("error","(APCMiniController) Failed to connect with controller '"+midiName+"'. The provided ID is already in-use.")
                return false
            }
            if (this.#connections.map((c) => c.name).includes(midiName)){
                this.#emit("error","(APCMiniController) Failed to connect with controller '"+midiName+"'. This controller is already connected.")
                return false
            }
            const connection = this.#connectMidi(midiName,customId)
            if (!connection){
                this.#emit("error","(APCMiniController) Failed to connect with controller '"+midiName+"'.")
                return false
            }else return true
        }else throw new Error("(APCMiniController) You can't connect more controllers than the configured 'maxControllerAmount'.")
    }
    /**Manually connect a used (apc mini) controller using a name fetched from `listAvailableControllers()` or using a controller ID from `listUsedIds()`. */
    manualDisconnect(midiNameOrId:string|number){
        const connection = ((typeof midiNameOrId == "string") ? this.#connections.find((c) => c.name == midiNameOrId) : this.#connections.find((c) => c.id == midiNameOrId)) ?? null
        if (connection){
            this.#disconnectMidi(connection.name)
            return true
        }else return false
    }
    /**Get a list of all unused/available controller names. */
    listAvailableControllers(){
        return this.#discoverAvailableUnits().available
    }
    /**Get a list of all used/connected controller names. */
    listConnectedControllers(){
        return this.#connections.map((c) => c.name)
    }
    /**Get a list of all used/connected controller ids. */
    listUsedIds(){
        return this.#connections.map((c) => c.id)
    }
    /**The amount of currently connected controllers. */
    getConnectedAmount(){
        return this.#connections.length
    }
    /**Set the speed (beats per minute) at which the lights will blink/pulse. */
    setBpm(bpm:number){
        this.lightBpm = bpm
    }

    ////////////////////////
    //// EVENT HANDLING ////
    ////////////////////////

    on(event:"connect",cb:(controllerId:number,midiName:string) => void): void
    on(event:"disconnect",cb:(controllerId:number,midiName:string) => void): void
    on(event:"error",cb:(err:string,controllerId?:number) => void): void
    on(event:"padButtonPressed",cb:(controllerId:number,location:number,coordinates:APCMiniCoordinates,usingShift:boolean) => void): void
    on(event:"padButtonReleased",cb:(controllerId:number,location:number,coordinates:APCMiniCoordinates,usingShift:boolean) => void): void
    on(event:"padButtonChanged",cb:(controllerId:number,location:number,coordinates:APCMiniCoordinates,pressed:boolean,usingShift:boolean) => void): void
    on(event:"horizontalButtonPressed",cb:(controllerId:number,location:number,usingShift:boolean) => void): void
    on(event:"horizontalButtonReleased",cb:(controllerId:number,location:number,usingShift:boolean) => void): void
    on(event:"horizontalButtonChanged",cb:(controllerId:number,location:number,pressed:boolean,usingShift:boolean) => void): void
    on(event:"verticalButtonPressed",cb:(controllerId:number,location:number,usingShift:boolean) => void): void
    on(event:"verticalButtonReleased",cb:(controllerId:number,location:number,usingShift:boolean) => void): void
    on(event:"verticalButtonChanged",cb:(controllerId:number,location:number,pressed:boolean,usingShift:boolean) => void): void
    on(event:"shiftButtonPressed",cb:(controllerId:number) => void): void
    on(event:"shiftButtonReleased",cb:(controllerId:number) => void): void
    on(event:"shiftButtonChanged",cb:(controllerId:number,pressed:boolean) => void): void
    on(event:"sliderChanged",cb:(controllerId:number,location:number,value:number) => void): void
    /**Listen to an available event. */
    on(event:string,cb:Function): void {
        this.#listeners.push({event,cb})
    }
    #emit(event:"connect",controllerId:number,midiName:string): void
    #emit(event:"disconnect",controllerId:number,midiName:string): void
    #emit(event:"error",err:string,controllerId?:number): void
    #emit(event:"padButtonPressed",controllerId:number,location:number,coordinates:APCMiniCoordinates,usingShift:boolean): void
    #emit(event:"padButtonReleased",controllerId:number,location:number,coordinates:APCMiniCoordinates,usingShift:boolean): void
    #emit(event:"padButtonChanged",controllerId:number,location:number,coordinates:APCMiniCoordinates,pressed:boolean,usingShift:boolean): void
    #emit(event:"horizontalButtonPressed",controllerId:number,location:number,usingShift:boolean): void
    #emit(event:"horizontalButtonReleased",controllerId:number,location:number,usingShift:boolean): void
    #emit(event:"horizontalButtonChanged",controllerId:number,location:number,pressed:boolean,usingShift:boolean): void
    #emit(event:"verticalButtonPressed",controllerId:number,location:number,usingShift:boolean): void
    #emit(event:"verticalButtonReleased",controllerId:number,location:number,usingShift:boolean): void
    #emit(event:"verticalButtonChanged",controllerId:number,location:number,pressed:boolean,usingShift:boolean): void
    #emit(event:"shiftButtonPressed",controllerId:number): void
    #emit(event:"shiftButtonReleased",controllerId:number): void
    #emit(event:"shiftButtonChanged",controllerId:number,pressed:boolean): void
    #emit(event:"sliderChanged",controllerId:number,location:number,value:number): void
    /**Emit an event. */
    #emit(event:string,...args:any[]): void {
        for (const listener of this.#listeners.filter((l) => l.event === event)){
            try{
                listener.cb(...args)
            }catch(err){
                if (event !== "error") this.#emit("error",err)
            }
        }
    }

    /////////////////////////
    //// LIGHT FUNCTIONS ////
    /////////////////////////
    /**Set the color, brightness & mode of an RGB pad from a certain controller. The color should be in hex-format (e.g. #123abc) */
    setRgbLights(controllerId:number,positions:(number|APCMiniCoordinates)[]|number|APCMiniCoordinates,brightness:APCMiniBrightnessMode,mode:APCMiniLightMode,color:string){
        if (controllerId < 0 || (controllerId % 1 !== 0)) return false
        for (const position of (Array.isArray(positions) ? positions : [positions])){
            if (typeof position == "number"){
                if (position < 0 || position > 63 || (position % 1 !== 0)){
                    this.#emit("error","(APCMiniController) setRgbLight(): Invalid position, must be a value from 0-63",controllerId)
                    return false
                }
            }else{
                if (typeof position.x !== "number" || typeof position.y !== "number" || (position.x % 1 !== 0) || (position.y % 1 !== 0)){
                    this.#emit("error","(APCMiniController) setRgbLight(): Invalid position coordinates, expected {x,y} with the value of x,y from 0-7",controllerId)
                    return false
                }
            }
        }
        if (!["brightness_5","brightness_10","brightness_20","brightness_25","brightness_30","brightness_40","brightness_50","brightness_60","brightness_70","brightness_75","brightness_80","brightness_90","brightness_100"].includes(brightness)){
            this.#emit("error","(APCMiniController) setRgbLight(): Please usa a valid light brightness",controllerId)
            return false
        }
        if (!["static","pulsing_1/2","pulsing_1/4","pulsing_1/8","pulsing_1/16","blinking_1/2","blinking_1/4","blinking_1/8","blinking_1/16","blinking_1/24","short_blinking_1/2","short_blinking_1/4","short_blinking_1/8","short_blinking_1/16","short_blinking_1/24","fade_in_1/2","fade_in_1/4","fade_in_1/8","fade_in_1/16","fade_out_1/2","fade_out_1/4","fade_out_1/8","fade_out_1/16"].includes(mode)){
            this.#emit("error","(APCMiniController) setRgbLight(): Please usa a valid light mode",controllerId)
            return false
        }
        if (!this.#utils.isHexColor(color)){
            this.#emit("error","(APCMiniController) setRgbLight(): Please usa a valid hex color",controllerId)
            return false
        }

        const {red,green,blue} = this.#utils.hexToRgb(color)
        const multiplier = BRIGHTNESS_MAP[brightness]
        const newColor = this.#utils.rgbToHex(Math.round(red*multiplier),Math.round(green*multiplier),Math.round(blue*multiplier))

        for (const pos of (Array.isArray(positions) ? positions : [positions])){
            const virtualCoords = (typeof pos == "number") ? this.#utils.locationToCoordinates(pos) : pos
            const midiCoords = this.#utils.transformCoordinates(virtualCoords)
            const midiLocation = this.#utils.coordinatesToLocation(midiCoords)

            if (!this.#rgbLightCache.has(controllerId)) this.#rgbLightCache.set(controllerId,new Map())
            const controllerMap = this.#rgbLightCache.get(controllerId)!
            controllerMap.set(midiLocation,{id:controllerId,location:midiLocation,color:newColor,mode:mode})
        }
        this.#renderConnectedLights()
        return true
    }
    /**Set the mode of the horizontal (red) lights of the Apc Mini Mk2. Positions go from `0:left` to `7:right` */
    setHorizontalLights(controllerId:number,positions:number[]|number,mode:"off"|"on"|"blink"){
        for (const position of (Array.isArray(positions) ? positions : [positions])){
            if (position < 0 || position > 7 || (position % 1 !== 0)){
                this.#emit("error","(APCMiniController) setHorizontalLight(): Invalid position, must be a value from 0-7",controllerId)
                return false
            }
        }
        if (!["off","on","blink"].includes(mode)){
            this.#emit("error","(APCMiniController) setHorizontalLight(): Invalid light mode, must be 'off', 'on' or 'blink'",controllerId)
            return false
        }

        for (const pos of (Array.isArray(positions) ? positions : [positions])){
            if (!this.#horizontalLightCache.has(controllerId)) this.#horizontalLightCache.set(controllerId,new Map())
            const controllerMap = this.#horizontalLightCache.get(controllerId)!
            controllerMap.set(pos,{id:controllerId,location:pos,mode:mode})
        }
        this.#renderHorizontalLights()
        return true
    }
    /**Set the mode of the vertical (green) lights of the Apc Mini Mk2. Positions go from `0:top` to `7:bottom` */
    setVerticalLights(controllerId:number,positions:number[]|number,mode:"off"|"on"|"blink"){
        for (const position of (Array.isArray(positions) ? positions : [positions])){
            if (position < 0 || position > 7 || (position % 1 !== 0)){
                this.#emit("error","(APCMiniController) setVerticalLights(): Invalid position, must be a value from 0-7",controllerId)
                return false
            }
        }
        if (!["off","on","blink"].includes(mode)){
            this.#emit("error","(APCMiniController) setVerticalLights(): Invalid light mode, must be 'off', 'on' or 'blink'",controllerId)
            return false
        }

        for (const pos of (Array.isArray(positions) ? positions : [positions])){
            if (!this.#verticalLightCache.has(controllerId)) this.#verticalLightCache.set(controllerId,new Map())
            const controllerMap = this.#verticalLightCache.get(controllerId)!
            controllerMap.set(pos,{id:controllerId,location:pos,mode:mode})
        }
        this.#renderVerticalLights()
        return true
    }
    /**Clear/turn off all lights from a certain controller (including horizontal & vertical lights). */
    resetLights(controllerId:number){
        let locations: number[] = []
        for (let i = 0; i < 64; i++){locations.push(i)}
        try{
            this.setRgbLights(controllerId,locations,"brightness_100","static","#000000")
        }catch(err){
            console.error(err)
            return false
        }

        let uiLocations: number[] = []
        for (let i = 0; i < 8; i++){uiLocations.push(i)}
        this.setVerticalLights(controllerId,uiLocations,"off")
        this.setHorizontalLights(controllerId,uiLocations,"off")
        
        return true
    }
    /**Clear/turn off all lights from all controllers (including horizontal & vertical lights). */
    resetAllLights(){
        for (const id of this.listUsedIds()){
            this.resetLights(id)
        }
        return true
    }
    /**Fill an RGB pad using a rectangle from from (x,y) to a specific width & height. */
    fillRgbLights(controllerId:number,startPos:(number|APCMiniCoordinates),width:number,height:number,brightness:APCMiniBrightnessMode,mode:APCMiniLightMode,color:string){
        const positions: APCMiniCoordinates[] = []
        const startCoord = (typeof startPos == "number") ? this.#utils.locationToCoordinates(startPos) : startPos
        for (let x = 0; x < width; x++){
            const xPos = x+startCoord.x
            if (xPos < 0 || xPos > 7) continue
            for (let y = 0; y < height; y++){
                const yPos = y+startCoord.y
                if (yPos < 0 || yPos > 7) continue
                positions.push({x:xPos,y:yPos})
            }
        }
        return this.setRgbLights(controllerId,positions,brightness,mode,color)
    }

    /////////////////////////
    //// INPUT FUNCTIONS ////
    /////////////////////////
    /**Get the current state of all the shift buttons combined. */
    getShiftState(): boolean {
        return this.#shiftPressed
    }
    /**Get the current states of the RGB pad buttons. */
    getPadStates(controllerId:number): boolean[] {
        const controllerMap = this.#padButtonCache.get(controllerId)
        if (!controllerMap) return new Array(64).fill(false)
        return [...controllerMap.values()]
    }
    /**Get the current states of the horizontal buttons. */
    getHorizontalStates(controllerId:number): boolean[] {
        const controllerMap = this.#horizontalButtonCache.get(controllerId)
        if (!controllerMap) return new Array(8).fill(false)
        return [...controllerMap.values()]
    }
    /**Get the current states of the vertical buttons. */
    getVerticalStates(controllerId:number): boolean[] {
        const controllerMap = this.#verticalButtonCache.get(controllerId)
        if (!controllerMap) return new Array(8).fill(false)
        return [...controllerMap.values()]
    }
    /**Get the current slider values. */
    getSliderValues(controllerId:number): number[] {
        const controllerMap = this.#sliderCache.get(controllerId)
        if (!controllerMap) return new Array(9).fill(0)
        return [...controllerMap.values()]
    }

    /////////////////////////////
    //// ANIMATION FUNCTIONS ////
    /////////////////////////////
    /**This function will be called before selecting the id of the controller. It can be used to display a cool animation. + The duration of the intro in milliseconds. */
    setIntroAnimation(animation:APCMiniPreconnectAnimation|null,durationMs:number){
        this.#preconnectIntroAnimation = animation
        this.#preconnectIntroDuration = durationMs
    }
    /**This function will be called while selecting the id of the controller. It can be used to display a cool animation. */
    setWaitAnimation(animation:APCMiniPreconnectAnimation|null){
        this.#preconnectWaitAnimation = animation
    }
    /**This function will be called after selecting the id of the controller. It can be used to display a cool animation. + The duration of the outro in milliseconds. */
    setOutroAnimation(animation:APCMiniPreconnectAnimation|null,durationMs:number){
        this.#preconnectOutroAnimation = animation
        this.#preconnectOutroDuration = durationMs
    }
}

/** ## APCMiniUtils (`class`)
 * A utility class containing color formatters, button coordinate converters & more!
 */
class APCMiniUtils {
    /**A list of all the available hex colors of the APC Mini Mk2 & their corresponding midi values. */
    readonly colors: Map<string,number> = new Map([
        ["#000000",0],
        ["#1E1E1E",1],
        ["#7F7F7F",2],
        ["#FFFFFF",3],
        ["#FF4C4C",4],
        ["#FF0000",5],
        ["#590000",6],
        ["#190000",7],
        ["#FFBD6C",8],
        ["#FF5400",9],
        ["#591D00",10],
        ["#271B00",11],
        ["#FFFF4C",12],
        ["#FFFF00",13],
        ["#595900",14],
        ["#191900",15],
        ["#88FF4C",16],
        ["#54FF00",17],
        ["#1D5900",18],
        ["#142B00",19],
        ["#4CFF4C",20],
        ["#00FF00",21],
        ["#005900",22],
        ["#001900",23],
        ["#4CFF5E",24],
        ["#00FF19",25],
        ["#00590D",26],
        ["#001902",27],
        ["#4CFF88",28],
        ["#00FF55",29],
        ["#00591D",30],
        ["#001F12",31],
        ["#4CFFB7",32],
        ["#00FF99",33],
        ["#005935",34],
        ["#001912",35],
        ["#4CC3FF",36],
        ["#00A9FF",37],
        ["#004152",38],
        ["#001019",39],
        ["#4C88FF",40],
        ["#0055FF",41],
        ["#001D59",42],
        ["#000819",43],
        ["#4C4CFF",44],
        ["#0000FF",45],
        ["#000059",46],
        ["#000019",47],
        ["#874CFF",48],
        ["#5400FF",49],
        ["#190064",50],
        ["#0F0030",51],
        ["#FF4CFF",52],
        ["#FF00FF",53],
        ["#590059",54],
        ["#190019",55],
        ["#FF4C87",56],
        ["#FF0054",57],
        ["#59001D",58],
        ["#220013",59],
        ["#FF1500",60],
        ["#993500",61],
        ["#795100",62],
        ["#436400",63],
        ["#033900",64],
        ["#005735",65],
        ["#00547F",66],
        ["#0000FF",67],
        ["#00454F",68],
        ["#2500CC",69],
        ["#7F7F7F",70],
        ["#202020",71],
        ["#FF0000",72],
        ["#BDFF2D",73],
        ["#AFED06",74],
        ["#64FF09",75],
        ["#108B00",76],
        ["#00FF87",77],
        ["#00A9FF",78],
        ["#002AFF",79],
        ["#3F00FF",80],
        ["#7A00FF",81],
        ["#B21A7D",82],
        ["#402100",83],
        ["#FF4A00",84],
        ["#88E106",85],
        ["#72FF15",86],
        ["#00FF00",87],
        ["#3BFF26",88],
        ["#59FF71",89],
        ["#38FFCC",90],
        ["#5B8AFF",91],
        ["#3151C6",92],
        ["#877FE9",93],
        ["#D31DFF",94],
        ["#FF005D",95],
        ["#FF7F00",96],
        ["#B9B000",97],
        ["#90FF00",98],
        ["#835D07",99],
        ["#392b00",100],
        ["#144C10",101],
        ["#0D5038",102],
        ["#15152A",103],
        ["#16205A",104],
        ["#693C1C",105],
        ["#A8000A",106],
        ["#DE513D",107],
        ["#D86A1C",108],
        ["#FFE126",109],
        ["#9EE12F",110],
        ["#67B50F",111],
        ["#1E1E30",112],
        ["#DCFF6B",113],
        ["#80FFBD",114],
        ["#9A99FF",115],
        ["#8E66FF",116],
        ["#404040",117],
        ["#757575",118],
        ["#E0FFFF",119],
        ["#A00000",120],
        ["#350000",121],
        ["#1AD000",122],
        ["#074200",123],
        ["#B9B000",124],
        ["#3F3100",125],
        ["#B35F00",126],
        ["#4B1502",127]
    ])
    /**The selected actionpad coordinate system. */
    readonly coordSystem: APCMiniCoordinateSystem

    constructor(coordSystem:APCMiniCoordinateSystem){
        this.coordSystem = coordSystem
    }

    /**Check if a certain color is a valid hex color. */
    isHexColor(hexColor:string): hexColor is APCMiniHexColor {
        return (/^#[0-9a-fA-F]{6}$/.test(hexColor))
    }
    /**Convert a hex color to RGB values (0-255). */
    hexToRgb(hexColor:APCMiniHexColor){
        const red = parseInt(hexColor.substring(1,3),16)
        const green = parseInt(hexColor.substring(3,5),16)
        const blue = parseInt(hexColor.substring(5,7),16)
        return {red,green,blue}
    }
    /**Convert RGB values (0-255) to a hex color. */
    rgbToHex(red:number,green:number,blue:number): APCMiniHexColor {
        const newRed = Math.round(red).toString(16).padStart(2,"0")
        const newGreen = Math.round(green).toString(16).padStart(2,"0")
        const newBlue = Math.round(blue).toString(16).padStart(2,"0")
        return `#${newRed}${newGreen}${newBlue}`
    }
    /**Get the RGB difference between 2 hex colors. */
    colorDiff(hex1:APCMiniHexColor,hex2:APCMiniHexColor){
        const red1 = parseInt(hex1.substring(1,3),16)
        const green1 = parseInt(hex1.substring(3,5),16)
        const blue1 = parseInt(hex1.substring(5,7),16)
        const red2 = parseInt(hex2.substring(1,3),16)
        const green2 = parseInt(hex2.substring(3,5),16)
        const blue2 = parseInt(hex2.substring(5,7),16)

        const diffred = Math.abs(red1-red2)
        const diffgreen = Math.abs(green1-green2)
        const diffblue = Math.abs(blue1-blue2)
        const diffaverage = (diffred + diffgreen + diffblue)/3

        return {
            red:diffred,
            green:diffgreen,
            blue:diffblue,
            average:diffaverage
        }
    }
    /**Get the closest available midi color-value to the provided `hexColor` for the midi controller. */
    getMidiColor(hexColor:string){
        if (!this.isHexColor(hexColor)) return null
        const differences: {value:number,hex:string,difference:number}[] = []
        
        for (const [hex,value] of [...this.colors.entries()]){
            try{
                if (this.isHexColor(hex)) differences.push({hex,value,difference:this.colorDiff(hexColor,hex).average})
            }catch(err){
                console.error(err)
            }
        }

        differences.sort((a,b) => {
            if (a.difference > b.difference) return 1
            else if (a.difference < b.difference) return -1
            else return 0
        })

        return differences[0].value
    }
    /**Get the closest available midi color-value to the provided `hexColor` for the midi controller. **All colors are dimmed by 85% for darker LEDs**. */
    getDarkMidiColor(hexColor:string){
        if (!this.isHexColor(hexColor)) return null

        const red = parseInt(hexColor.substring(1,3),16)
        const green = parseInt(hexColor.substring(3,5),16)
        const blue = parseInt(hexColor.substring(5,7),16)
        
        const newRed = Math.round(red * 0.15).toString(16).padStart(2,"0")
        const newGreen = Math.round(green * 0.15).toString(16).padStart(2,"0")
        const newBlue = Math.round(blue * 0.15).toString(16).padStart(2,"0")

        return this.getMidiColor(`#${newRed}${newGreen}${newBlue}`)
    }
    /**Transform coordinates between the midi/physical <-> local/virtual coordinate system. */
    transformCoordinates(local:APCMiniCoordinates): APCMiniCoordinates {
        const {x,y} = local
        const {xAxis,yAxis} = this.coordSystem
        //ROWS
        if (xAxis == "left->right" && yAxis == "bottom->top") return {x,y}
        else if (xAxis == "left->right" && yAxis == "top->bottom") return {x,y:7-y}
        else if (xAxis == "right->left" && yAxis == "bottom->top") return {x:7-x,y}
        else if (xAxis == "right->left" && yAxis == "top->bottom") return {x:7-x,y:7-y}
        //COLUMNS
        else if (xAxis == "bottom->top" && yAxis == "left->right") return {x:y,y:x}
        else if (xAxis == "top->bottom" && yAxis == "left->right") return {x:y,y:7-x}
        else if (xAxis == "bottom->top" && yAxis == "right->left") return {x:7-y,y:x}
        else if (xAxis == "top->bottom" && yAxis == "right->left") return {x:7-y,y:7-x}
        else return {x,y:7-y} //left->right, top->bottom
    }
    /**Transform a location ID to X-Y coordinates. */
    locationToCoordinates(location:number): APCMiniCoordinates {
        return {x:(location % 8),y:Math.floor(location/8)}
    }
    /**Transform X-Y coordinates to a location ID. */
    coordinatesToLocation(coordinates:APCMiniCoordinates): number {
        return coordinates.x + (coordinates.y * 8)
    }
    /**Check if two arrays are the same. */
    compareArrays(arr1:any[],arr2:any[]): boolean {
        return (arr1.length === arr2.length && arr1.every((v,i) => v === arr2[i]))
    }
    /**Create an animation frame used for animating intro/outro's */
    createAnimationFrame(): Map<number,APCMiniHexColor> {
        return new Map(new Array(64).fill("#000000").map((b,i) => ([i,b])))
    }
    /**Transform an animation frame used for animating intro/outro's to a bulk pad colors list for rendering. */
    animationFrameToBulkPadColors(frame:Map<number,APCMiniHexColor>){
        const output: {hex:string,midiLocation:number}[] = [...frame.entries()].map(([pos,color]) => {
            const virtualCoords = this.locationToCoordinates(pos)
            const midiCoords = this.transformCoordinates(virtualCoords)
            const midiLocation = this.coordinatesToLocation(midiCoords)
            return {hex:color,midiLocation}
        })
        return output
    }
}

/**Check if a certain color is a valid hex color. */
export function isHexColor(hexColor:string): hexColor is APCMiniHexColor {
    return (/^#[0-9a-fA-F]{6}$/.test(hexColor))
}
/**Convert a hex color to RGB values (0-255). */
export function hexToRgb(hexColor:APCMiniHexColor){
    const red = parseInt(hexColor.substring(1,3),16)
    const green = parseInt(hexColor.substring(3,5),16)
    const blue = parseInt(hexColor.substring(5,7),16)
    return {red,green,blue}
}
/**Convert RGB values (0-255) to a hex color. */
export function rgbToHex(red:number,green:number,blue:number): APCMiniHexColor {
    const newRed = Math.round(red).toString(16).padStart(2,"0")
    const newGreen = Math.round(green).toString(16).padStart(2,"0")
    const newBlue = Math.round(blue).toString(16).padStart(2,"0")
    return `#${newRed}${newGreen}${newBlue}`
}
/**Increase/decrease the brightness using a float from 0-1. */
export function brightness(multiplier:number,hexColor:APCMiniHexColor){
    const {red,green,blue} = hexToRgb(hexColor)
    return rgbToHex(Math.round(red*multiplier),Math.round(green*multiplier),Math.round(blue*multiplier))
}
/**Transform a location ID to X-Y coordinates. */
export function locationToCoordinates(location:number): APCMiniCoordinates {
    return {x:(location % 8),y:Math.floor(location/8)}
}
/**Transform X-Y coordinates to a location ID. */
export function coordinatesToLocation(coordinates:APCMiniCoordinates): number {
    return coordinates.x + (coordinates.y * 8)
}

export default {APCMiniController,isHexColor,hexToRgb,rgbToHex,brightness,locationToCoordinates,coordinatesToLocation}