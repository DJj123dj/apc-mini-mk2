import easymidi from "easymidi"

/**A pre-connection of an APC Mini mk2 controller. */
interface APCMiniPreConnection {
    name:string,
    input:easymidi.Input,
    output:easymidi.Output
}
/**A normal connection of an APC Mini mk2 controller. */
interface APCMiniConnection extends APCMiniPreConnection {
    id:number,
    instance:APCMiniInstance
}
/**Available actionpad coordinate systems. */
type APCMiniCoordinateSystem = (
    "rows_(left->right)_(top->bottom)"|
    "rows_(right->left)_(top->bottom)"|
    "rows_(left->right)_(bottom->top)"|
    "rows_(right->left)_(bottom->top)"|
    "columns_(left->right)_(top->bottom)"|
    "columns_(right->left)_(top->bottom)"|
    "columns_(left->right)_(bottom->top)"|
    "columns_(right->left)_(bottom->top)"
)
/**A mathematical X-Y coordinate. */
interface APCMiniCoordinates {
    x:number,
    y:number
}

/** ## APCMiniController (`class`)
 * The main class for managing one or multiple **Akai Apc Mini Mk2**'s. With this class you're able to:
 * - Receive button events.
 * - Receive slider events.
 * - Manually request button & slider states.
 * - Manually set horizontal, vertical & actionpad RGB lights.
 * - Draw colors, change render modes, apply effects & so much more!
 * 
 * @example
 * const apcMini = new APCMiniController(2,false) //connect up to 2 controllers & automatically assign ID's/locations
 * 
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
    /**A name-list of all active connections.*/
    get #preconnectedNames(){
        return new Set(this.#preconnections.map((c) => c.name))
    }
    /**A name-list of all active preconnections (without assigned ID, still in manual ID Selector program)..*/
    get #connectedNames(){
        return new Set(this.#connections.map((c) => c.name))
    }

    /////////////////////////////
    //// EXTERNAL PROPERTIES ////
    /////////////////////////////

    /**The maximum amount of controllers able to connect at the same time. */
    readonly maxControllerAmount: number
    /**Enable assigning a controller ID manually by pressing a button instead of choosing it automatically. */
    readonly manualIdAssignmentsEnabled: boolean
    /**The selected actionpad coordinate system. */
    readonly coordSystem: APCMiniCoordinateSystem

    ////////////////////////////
    //// CONSTRUCTOR + INIT ////
    ////////////////////////////

    constructor(maxControllerAmount:number=1,manualIdAssignmentsEnabled:boolean=false,coordSystem:APCMiniCoordinateSystem="rows_(left->right)_(top->bottom)"){
        this.maxControllerAmount = maxControllerAmount
        this.manualIdAssignmentsEnabled = manualIdAssignmentsEnabled
        this.coordSystem = coordSystem
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
    }

    ////////////////////////////
    //// INTERNAL FUNCTIONS ////
    ////////////////////////////

    /**Clear intervals, event-loops & reset lights before shutdown/exit. */
    #handleShutdown(){
        if (this.#disconnectInterval) clearInterval(this.#disconnectInterval)
        if (this.#connectInterval) clearInterval(this.#connectInterval)

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
                const connection: APCMiniConnection = {
                    name,id,input,output,
                    instance:new APCMiniInstance(input,output,id,this)
                }
                this.#connections.push(connection)
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
                const connection = this.#connections.splice(index,1)[0]
                connection.input.removeAllListeners()
                connection.input.close()
                connection.output.close()
                this.#emit("disconnect",connection.id,connection.name)
            }

            //disconnect (in case of pre-connection)
            const preIndex = this.#preconnections.findIndex((c) => c.name === name)
            if (preIndex > -1){
                const preconnection = this.#preconnections.splice(preIndex,1)[0]
                if (preconnection){
                    this.#renderPreconnectLights(preconnection.output,true)

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
        const preconnection = {name,input:new easymidi.Input(name),output:new easymidi.Output(name)}
        this.#preconnections.push(preconnection)
        this.#renderPreconnectLights(preconnection.output)

        preconnection.input.on("noteon",(note) => {
            if (note.note > 99 && note.note < 108){
                const button = note.note-100 //horizontal buttons
                if (!this.listUsedIds().includes(button) && button < this.maxControllerAmount){
                    //remove from preconnect list & reset lights
                    const index = this.#preconnections.findIndex((c) => c.name === name)
                    if (index < 0) return
                    this.#preconnections.splice(index,1)
                    this.#renderPreconnectLights(preconnection.output,true)

                    //remove input/output IO & listeners
                    preconnection.input.removeAllListeners()
                    preconnection.input.close()
                    preconnection.output.close()
                    
                    //start connection with custom ID
                    this.#connectMidi(name,button)
                }

            }else if (note.note > 111 && note.note < 120){
                const button = note.note-112 //vertical buttons
                if (button == 0){
                    //remove from preconnect list & reset lights
                    const index = this.#preconnections.findIndex((c) => c.name === name)
                    if (index < 0) return
                    this.#preconnections.splice(index,1)
                    this.#renderPreconnectLights(preconnection.output,true)

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
            if (customId && this.#connections.map((c) => c.id).includes(customId)) throw new Error("(APCMiniController) Failed to connect with controller '"+midiName+"'. The provided ID is already in-use.")
            if (this.#connections.map((c) => c.name).includes(midiName)) throw new Error("(APCMiniController) Failed to connect with controller '"+midiName+"'. This controller is already connected.")
            
            const connection = this.#connectMidi(midiName,customId)
            if (!connection) throw new Error("(APCMiniController) Failed to connect with controller '"+midiName+"'.")
        }else throw new Error("(APCMiniController) You can't connect more controllers than the configured 'maxControllerAmount'.")
    }
    /**Manually connect a used (apc mini) controller using a name fetched from `listAvailableControllers()` or using a controller ID from `listUsedIds()`. */
    manualDisconnect(midiNameOrId:string|number){
        const connection = ((typeof midiNameOrId == "string") ? this.#connections.find((c) => c.name == midiNameOrId) : this.#connections.find((c) => c.id == midiNameOrId)) ?? null
        if (connection) this.#disconnectMidi(connection.name)
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

    ////////////////////////
    //// EVENT HANDLING ////
    ////////////////////////

    on(event:"connect",cb:(id:number,midiName:string) => void): void
    on(event:"disconnect",cb:(id:number,midiName:string) => void): void
    /**Listen to an available event. */
    on(event:string,cb:Function): void {
        this.#listeners.push({event,cb})
    }
    #emit(event:"connect",id:number,midiName:string): void
    #emit(event:"disconnect",id:number,midiName:string): void
    /**Emit an event. */
    #emit(event:string,...args:any[]): void {
        for (const listener of this.#listeners.filter((l) => l.event === event)){
            listener.cb(...args)
        }
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

    /**Get the RGB difference between 2 hex colors. */
    colorDiff(hex1:string,hex2:string){
        if (!/^#[0-9a-f]{6}$/.test(hex1) || !/^#[0-9a-f]{6}$/.test(hex2)) throw new Error("(APCMiniUtils) Invalid hex-color.")
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
        if (!/^#[0-9a-f]{6}$/.test(hexColor)) throw new Error("(APCMiniUtils) Invalid hex-color.")
        
        const differences: {value:number,hex:string,difference:number}[] = []
        for (const [hex,value] of this.colors.entries()){
            differences.push({hex,value,difference:this.colorDiff(hexColor,hex).average})
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
        if (!/^#[0-9a-f]{6}$/.test(hexColor)) throw new Error("(APCMiniUtils) Invalid hex-color.")

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
        //ROWS
        if (this.coordSystem == "rows_(left->right)_(bottom->top)") return {x,y}
        else if (this.coordSystem == "rows_(left->right)_(top->bottom)") return {x,y:7-y}
        else if (this.coordSystem == "rows_(right->left)_(bottom->top)") return {x:7-x,y}
        else if (this.coordSystem == "rows_(right->left)_(top->bottom)") return {x:7-x,y:7-y}
        //COLUMNS
        else if (this.coordSystem == "columns_(left->right)_(bottom->top)") return {x:y,y:x}
        else if (this.coordSystem == "columns_(left->right)_(top->bottom)") return {x:y,y:7-x}
        else if (this.coordSystem == "columns_(right->left)_(bottom->top)") return {x:7-y,y:x}
        else if (this.coordSystem == "columns_(right->left)_(top->bottom)") return {x:7-y,y:7-x}
        else throw new Error("(APCMiniUtils) Invalid coordinate system.")
    }
    /**Transform a location ID to X-Y coordinates. */
    locationToCoordinates(location:number): APCMiniCoordinates {
        return {x:Math.floor(location/8),y:(location % 8)}
    }
    /**Transform X-Y coordinates to a location ID. */
    coordinatesToLocation(coordinates:APCMiniCoordinates): number {
        return (coordinates.x * 8) + coordinates.y
    }
}

/** ## APCMiniInstance (`class`)
 * This class is an active instance (& connection) of a single APC Mini Mk2. It's responsible for sending & receiving midi signals to & from this controller.
 */
class APCMiniInstance {
    #input: easymidi.Input
    #output: easymidi.Output
    #id: number
    #controller: APCMiniController
    #utils: APCMiniUtils

    constructor(input:easymidi.Input,output:easymidi.Output,id:number,controller:APCMiniController){
        this.#input = input
        this.#output = output
        this.#id = id
        this.#controller = controller
        this.#utils = new APCMiniUtils(controller.coordSystem)
    }
}