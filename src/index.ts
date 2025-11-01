import easymidi from "easymidi"

export class APCMiniController {
    /////////////////////////////
    //// INTERNAL PROPERTIES ////
    /////////////////////////////

    /**A list of all active connections. */
    #connections: {name:string,id:number,input:easymidi.Input,output:easymidi.Output}[] = []
    /**A list of all active pre-connections (without assigned ID, still in manual ID Selector program). */
    #preconnections: {name:string,input:easymidi.Input,output:easymidi.Output}[] = []
    /**A blacklist of ignored midi devices, resetted when the device is disconnected. */
    #ignoredNames: Set<string> = new Set()
    /**A name-list of all active connections.*/
    get #preconnectedNames(){
        return new Set(this.#preconnections.map((c) => c.name))
    }
    /**A name-list of all active preconnections (without assigned ID, still in manual ID Selector program)..*/
    get #connectedNames(){
        return new Set(this.#connections.map((c) => c.name))
    }

    /**The maximum amount of controllers able to connect at the same time. */
    #maxControllerAmount: number
    /**Enable assigning a controller ID manually by pressing a button instead of choosing it automatically. */
    #manualIdAssignmentsEnabled: boolean

    /**Listeners for the on() & emit() events. */
    #listeners: {event:string,cb:Function}[] = []
    /**The interval-id of the auto-disconnect feature. Should be cleared before exit. */
    #disconnectInterval: NodeJS.Timeout|null = null
    /**The interval-id of the auto-connect feature. Should be cleared before exit. */
    #connectInterval: NodeJS.Timeout|null = null

    ////////////////////////////
    //// CONSTRUCTOR + INIT ////
    ////////////////////////////

    constructor(maxControllerAmount:number=1,manualIdAssignmentsEnabled:boolean=false){
        this.#maxControllerAmount = maxControllerAmount
        this.#manualIdAssignmentsEnabled = manualIdAssignmentsEnabled
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

        for (const preconnection of this.#preconnections){
            this.#renderPreconnectLights(preconnection.output,true)
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
            if (typeof customId !== "number" && this.#manualIdAssignmentsEnabled){
                //if no customId is given and the ids are assigned manually, start the pre-connect mode to let the user choose the ID of the device.
                this.#startPreconnectIdSelector(name)
                return
            }else{
                //normal connection procedure
                const id = customId || this.#getLowestUnusedId()
                if (this.#connections.length >= this.#maxControllerAmount) return null
                if (this.#preconnections.map((c) => c.name).includes(name)) return null
                if (this.#connections.map((c) => c.id).includes(id)) return null
                if (this.#connections.map((c) => c.name).includes(name)) return null
                if (this.#ignoredNames.has(name)) return null

                const connection = {name,id,input:new easymidi.Input(name),output:new easymidi.Output(name)}
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
                if (!this.listUsedIds().includes(button) && button < this.#maxControllerAmount){
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
                velocity:(!reset && i < this.#maxControllerAmount && !this.listUsedIds().includes(i)) ? 1 : 0
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
        if (this.#connectedNames.size < this.#maxControllerAmount){
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