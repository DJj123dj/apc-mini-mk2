import easymidi from "easymidi"
import { APCMiniUtils } from "./utils"
import { EventEmitter } from "stream"

export type APCMiniValidInput = APCMiniVirtualInput|easymidi.Input
export type APCMiniValidOutput = APCMiniVirtualOutput|easymidi.Output
export interface APCMiniVirtualDevice {
    name:string
    input:APCMiniVirtualInput,
    output:APCMiniVirtualOutput
}

const virtualLinkKey: unique symbol = Symbol("VirtualAPCMini")
export function createVirtualApcMini(){
    const input = new APCMiniVirtualInput(virtualLinkKey)
    const output = new APCMiniVirtualOutput(virtualLinkKey)
    input.linkedOutput = output
    output.linkedInput = input
    return {input,output}
}

export class APCMiniVirtualInput extends EventEmitter {
    closed: boolean = false
    linkedOutput: APCMiniVirtualOutput|null = null
    #utils = new APCMiniUtils({xAxis:"left->right",yAxis:"top->bottom"}) //coordinate functions are unused
    initialSliderValues = new Map<number,number>(new Array(9).fill(0).map((s,i) => ([i,s])))

    /**## Create this class using the `createVirtualApcMini()` method. */
    constructor(key:typeof virtualLinkKey){
        super()
        if (key !== virtualLinkKey) throw new Error("Create an `APCMiniVirtualInput` using the `createVirtualApcMini()` method.")
    }

    on(evt:"noteon"|"noteoff", handler:(param:easymidi.Note) => void): this
    on(evt:"cc", handler:(param:easymidi.ControlChange) => void): this
    on(evt:"sysex", handler:(param:easymidi.Sysex) => void): this
    on(eventName:string|symbol,listener:(...args:any[]) => void): this {
        return super.on(eventName,listener)
    }

    once(evt:"noteon"|"noteoff", handler:(param:easymidi.Note) => void): this
    once(evt:"cc", handler:(param:easymidi.ControlChange) => void): this
    once(evt:"sysex", handler:(param:easymidi.Sysex) => void): this
    once(eventName:string|symbol,listener:(...args:any[]) => void): this {
        return super.once(eventName,listener)
    }

    close(){
        this.closed = true
    }

    /**Press a RGB pad button. */
    pressPadButton(midiLocation:number){
        if (midiLocation < 0 || midiLocation > 63) return

        this.emit("noteon",{
            channel:0,
            note:midiLocation,
            velocity:127
        })
    }
    /**Release a RGB pad button. */
    releasePadButton(midiLocation:number){
        if (midiLocation < 0 || midiLocation > 63) return

        this.emit("noteoff", {
            channel:0,
            note:midiLocation,
            velocity:0
        })
    }
    /**Press a horizontal button. */
    pressHorizontalButton(location:number){
        if (location < 0 || location > 7) return

        this.emit("noteon",{
            channel:0,
            note:100+location,
            velocity:127
        })
    }
    /**Release a horizontal button. */
    releaseHorizontalButton(location:number){
        if (location < 0 || location > 7) return

        this.emit("noteoff", {
            channel:0,
            note:100+location,
            velocity:0
        })
    }
    /**Press a vertical button. */
    pressVerticalButton(location:number){
        if (location < 0 || location > 7) return

        this.emit("noteon",{
            channel:0,
            note:112+location,
            velocity:127
        })
    }
    /**Release a vertical button. */
    releaseVerticalButton(location:number){
        if (location < 0 || location > 7) return

        this.emit("noteoff", {
            channel:0,
            note:112+location,
            velocity:0
        })
    }
    /**Press the shift button. */
    pressShiftButton(){
        this.emit("noteon",{
            channel:0,
            note:122,
            velocity:127
        })
    }
    /**Release the shift button. */
    releaseShiftButton(){
        this.emit("noteoff", {
            channel:0,
            note:122,
            velocity:0
        })
    }
    /**Set a slider to a certain value from 0-127. */
    setSlider(location:number,value:number){
        if (location < 0 || location > 8) return
        if (value < 0 || value > 127) return

        this.emit("cc",{
            channel:0,
            controller:48+location,
            value
        })
        this.initialSliderValues.set(location,value)
    }
}

export class APCMiniVirtualOutput extends EventEmitter {
    closed: boolean = false
    linkedInput: APCMiniVirtualInput|null = null

    #utils = new APCMiniUtils({xAxis:"left->right",yAxis:"top->bottom"}) //coordinate functions are unused
    #verticalLightListeners: ((location:number,mode:"off"|"on"|"blink") => void)[] = []
    #horizontalLightListeners: ((location:number,mode:"off"|"on"|"blink") => void)[] = []
    #rgbLightListeners: ((location:number,hex:string) => void)[] = []

    /**## Create this class using the `createVirtualApcMini()` method. */
    constructor(key:typeof virtualLinkKey){
        super()
        if (key !== virtualLinkKey) throw new Error("Create an `APCMiniVirtualOutput` using the `createVirtualApcMini()` method.")
    }

    send(evt:"noteon",param:easymidi.Note): void
    send(evt:"sysex",param:number[]): void
    send(eventName:string,param:easymidi.Note|number[]){
        if (eventName == "sysex" && Array.isArray(param)){
            const introductionMsg = Buffer.from([0xF0,0x47,0x7F,0x4F,0x60,0x00,0x04,0x00,0x01,0x00,0x00,0xF7]).toString("hex")
            const incomingMsg = Buffer.from(param).toString("hex")
            if (introductionMsg === incomingMsg && this.linkedInput){
                //send back all initial slider values as 0
                const sliderValues = [...this.linkedInput.initialSliderValues.values()]
                this.linkedInput.emit("sysex",[0xF0,0x47,0x7F,0x4F,0x61,0x00,0x04,...sliderValues,0xF7])
                return
            }
        }

        if (eventName == "noteon" && !Array.isArray(param)){
            if (param.channel == 0){
                //HORIZONTAL/VERTICAL LIGHTS
                const mode = (param.velocity == 0) ? "off" : ((param.velocity == 1) ? "on" : "blink")
                if (param.note >= 100 && param.note <= 107){
                    const location = param.note-100
                    for (const cb of this.#horizontalLightListeners){
                        cb(location,mode)
                    }

                }else if (param.note >= 112 && param.note <= 119){
                    const location = param.note-112
                    for (const cb of this.#verticalLightListeners){
                        cb(location,mode)
                    }
                }
            }
        }else if (eventName == "sysex" && Array.isArray(param)){
            //BULK RGB LIGHTS
            const header: number[] = [0xF0,0x47,0x7F,0x4F,0x24]
            const padBytes = param.slice(header.length+2,-1)
            const dataLength = this.#utils.joinMsbLsb(param[header.length],param[header.length+1])
            if (padBytes.length !== dataLength) return
            
            for (let i = 0; i < padBytes.length; i += 8){
                const midiLocation = padBytes[i]
                const red = this.#utils.joinMsbLsb(padBytes[i+2],padBytes[i+3])
                const green = this.#utils.joinMsbLsb(padBytes[i+4],padBytes[i+5])
                const blue = this.#utils.joinMsbLsb(padBytes[i+6],padBytes[i+7])
                const hex = this.#utils.rgbToHex(red,green,blue)
                for (const cb of this.#rgbLightListeners){
                    cb(midiLocation,hex)
                }
            }
        }
    }
    close(){
        this.closed = true
    }

    onVerticalLight(cb:(location:number,mode:"off"|"on"|"blink") => void){
        this.#verticalLightListeners.push(cb)
    }
    onHorizontalLight(cb:(location:number,mode:"off"|"on"|"blink") => void){
        this.#horizontalLightListeners.push(cb)
    }
    onRgbLight(cb:(location:number,hex:string) => void){
        this.#rgbLightListeners.push(cb)
    }
}