import { APCMiniCoordinates, APCMiniCoordinateSystem, APCMiniHexColor } from "."

/** ## APCMiniUtils (`class`)
 * A utility class containing color formatters, button coordinate converters & more!
 */
export class APCMiniUtils {
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
    /**Transform coordinates between the midi/physical <-- local/virtual coordinate system. */
    transformToMidiCoordinates(virtual:APCMiniCoordinates): APCMiniCoordinates {
        const {x,y} = virtual
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
    /**Transform coordinates between the midi/physical --> local/virtual coordinate system. */
    transformToVirtualCoordinates(midi:APCMiniCoordinates): APCMiniCoordinates {
        const {x,y} = midi
        const {xAxis,yAxis} = this.coordSystem
        //ROWS
        if (xAxis == "left->right" && yAxis == "bottom->top") return {x,y}
        else if (xAxis == "left->right" && yAxis == "top->bottom") return {x,y:7-y}
        else if (xAxis == "right->left" && yAxis == "bottom->top") return {x:7-x,y}
        else if (xAxis == "right->left" && yAxis == "top->bottom") return {x:7-x,y:7-y}
        //COLUMNS
        else if (xAxis == "bottom->top" && yAxis == "left->right") return {x:y,y:x}
        else if (xAxis == "top->bottom" && yAxis == "left->right") return {x:7-y,y:x}
        else if (xAxis == "bottom->top" && yAxis == "right->left") return {x:y,y:7-x}
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
            const midiCoords = this.transformToMidiCoordinates(virtualCoords)
            const midiLocation = this.coordinatesToLocation(midiCoords)
            return {hex:color,midiLocation}
        })
        return output
    }
    /**Split a number to MSB & LSB 7-bit groups */
    splitToMsbLsb(x:number){
        return {msb:(x >> 7) & 0x7f,lsb:(x & 0x7f)}
    }
    /**Join a number from MSB & LSB 7-bit groups */
    joinMsbLsb(msb:number,lsb:number){
        return (msb << 7) + lsb
    }
}