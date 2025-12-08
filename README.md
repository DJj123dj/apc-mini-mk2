<img src="https://apis.dj-dj.be/cdn/apc-mini-mk2/logo.png" alt="Apc Mini Mk2 Logo" width="300px">

[![discord](https://img.shields.io/badge/discord-join%20our%20server-5865F2.svg?style=flat-square&logo=discord)](https://discord.com/invite/26vT9wt3n3)  [![version](https://img.shields.io/badge/version-1.0.0-brightgreen.svg?style=flat-square)](https://github.com/DJj123dj/apc-mini-mk2/releases/tag/v1.0.0)  [![license](https://img.shields.io/badge/license-MIT-important.svg?style=flat-square)](https://github.com/DJj123dj/logbucket/blob/main/LICENSE) [![stars](https://img.shields.io/github/stars/DJj123dj/apc-mini-mk2?color=yellow&label=stars&logo=github&style=flat-square)](https://www.github.com/DJj123dj/apc-mini-mk2)

### Akai APC Mini Mk2
An easy-to-use and feature-rich Node.js package for interacting with one or multiple Apc Mini's (Mk2) from Akai Professional.
It features **Full RGB LED color support, button/slider events, input polling, startup animations & so much more!**
Perfect for scripts, Electron apps, automation, smart home, music production, games, event lightning, ...

Need help? Feel free to join our [support server](https://discord.dj-dj.be) and we will help you fruther!

### [Installation using npm ⬇️](https://www.npmjs.com/package/logbucket)
```
npm install apc-mini-mk2
```

> ### ❤️ Sponsors
> We're still searching for sponsors! Would you like to sponsor us?

## 📌 Features

- ⚖️ **Lightweight** — Minimal footprint, maximum performance.
- 🚨 **Built with TypeScript** — Enjoy full type safety and intelligent autocompletion.
- 🎨 **Full RGB Color Support** — Display awesome RGB lights with full (0-255) RGB.
- 🔢 **Multiple Controllers** — Use multiple controllers at the same time.
- ⚙️ **Highly Customizable** — Choose your own coordinate system, limits & more.
- 🪩 **Built-in Effects** — Choose between 20+ built-in pulse, flicker & fade effects.
- 📌 **Coordinates** — Use a location index or `(x,y)` coordinates for inputs & outputs.
- 🪦 **Preserves State** — Preserve the state of the LEDs when disconnected.
- 📢 **Event Driven** — Listen to events and define your own custom reactions.
- 🎯 **Input Polling** — Fetch the current state of sliders & buttons without events.
- 🎬 **Startup Animations** — Display RGB animations while the device is connecting.
- ✅ **Multi Platform** — Tested on MacOS & Windows. Linux is untested but should work.

## 📸 Examples
### TODO TODO TODO
<!--<img src="https://apis.dj-dj.be/cdn/logbucket/example-marketing.png" width="700px">
<img src="https://apis.dj-dj.be/cdn/logbucket/example-error.png" width="700px">
<img src="https://apis.dj-dj.be/cdn/logbucket/example-customisation.png" width="700px">
-->

## 🛠️ Quick Usage
> **TIP:** Detailed examples are available in the `./examples/` directory in the [Github repository](https://github.com/DJj123dj/logbucket/tree/main/examples).
```ts
const {APCMiniController,rgbToHex,hexToRgb} = require("apc-mini-mk2")
//import {APCMiniController,rgbToHex,hexToRgb} from "apc-mini-mk2"

const apcMini = new APCMiniController(2) //max 2 controllers

//list all connected controllers
apcMini.listAvailableControllers()

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

//automatically connecting APC Mini Mk2 controllers
apcMini.startAutoConnect()

// RGB LIGHT EXAMPLES:
//(1) first light: static cyan
//(2) light 2 & 3: static red
//(3) last light & (3,3): blinking white
//(4) first 3 lights on second controller: fading-out blue

apcMini.setRgbLights(0,0,"brightness_100","static","#00ffff")
apcMini.setRgbLights(0,[1,2],"brightness_100","static","#ff0000")
apcMini.setRgbLights(0,[63,{x:3,y:3}],"brightness_10","blinking_1/2","#ffffff")
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
```

## 🧩 API Reference

### TODO TODO TODO
> [View full examples in Github Repository](https://github.com/DJj123dj/logbucket/tree/main/examples)
<!--
### function `LogBucket()`: `LogBucketInstance`
<details>
<summary>
Create a Logbucket instance.  
</summary>

> **Parameters (Optional):**
> - **`disableDefault?`** (`boolean`): Disable the built-in templates (to replace them with your own)
> - **`templates?`** (`object`): An object containing additional/custom templates (`LBMessageTemplate`)
> - **`errTemplate?`** (`LBErrorTemplate`): Add a custom template for logging JS errors (`new Error(...)`)
> - **`debugFile?`** (`LBDebugFile`): Add a debug file to write all logs to. (Disabled by default)
</details>

### function `LogBucketInstance()`: `void`
<details>
<summary>
Log messages to the console using a specified log type/category.
</summary>

> **Parameters (Message):**
> - **`type`** (`string`): The type to use for this message. Must be a custom or default registered type.
> - **`message`** (`string`): The message to log to the console.
> - **`params?`** (`LBMessageParam[]`): Add custom parameters to the message.
>   - format: `{key:string, value:string, hidden:boolean}`
>
> **Parameters (Error):**
> - **`error`** (`Error`): The error to log to the console.
>
> **Listen for events:**
> - Use `LogBucketInstance.on(eventName,callback)` to listen for events.
</details>

### class `new LBMessageTemplate()`: `void`
<details>
<summary>
Create a message template to create a custom log type/category.
</summary>

> **Constructor Parameters:**
> - **`prefix`** (`string`): The prefix to use (uppercase recommended)
> - **`prefixColor`** (`LBDefaultColor|LBHexColor`): The color of the prefix.
> - **`msgColor`** (`LBDefaultColor|LBHexColor`): The color of the message.
> - **`paramsColor`** (`LBDefaultColor|LBHexColor`): The color of the parameters.
</details>

### class `new LBErrorTemplate()`
<details>
<summary>
Create an error template to display the errors differently.
</summary>

> **Constructor Parameters:**
> - **`titleColor`** (`LBDefaultColor|LBHexColor`): The color of the title.
> - **`descriptionColor`** (`LBDefaultColor|LBHexColor`): The color of the description.
> - **`title?`** (`string`): The title/prefix to use (uppercase recommended)
> - **`description?`** (`string`): An optional description to display below the error for additional information or bug reporting.
</details>

### class `new LBDebugFile()`
<details>
<summary>
Create a debug file instance to write all logs to.
</summary>

> **Constructor Parameters:**
> - **`path`** (`string`): The location of the debug file relative to the current directory. (`process.cwd()`)
> - **`maxHistoryLength?`** (`number`): The maximum length of the debug file. It will start to scroll once the limit has been reached.
> - **`metadata?`** (`LBDebugFileMetadata`): Customise the metadata of the debug file. (top of file)
</details>

### type `LBDefaultColor`
A collection of all available default colors:  
`white`,`red`,`orange`,`yellow`,`green`,`blue`,`gray`,`cyan`,`magenta`,`purple`,`pink`

### type `LBDefaultType`
A collection of all available log types/categories:  
`info`,`warning`,`error`,`system`,`database`,`debug`,`plugin`,`api`,`client`,`server`

### type `LBHexColor`
A utility type for hex-colors.

### interface `LBMessageParam`
A parameter in the `LogBucketInstance(type,message,params)` method.

### interface `LBDebugFileMetadata`
All settings for the debug file metadata.
-->

## 🛠️ Contributors
> All contributions are welcome! Feel free to create a pull-request or issue in the [Github repository](https://github.com/DJj123dj/apc-mini-mk2).
<table>
<tr>
<td align="center"><img src="https://github.com/DJj123dj.png" alt="Profile Picture" width="80px"></td>
</tr>
<tr>
<th><a href="https://github.com/DJj123dj">💻 DJj123dj</a></th>
</tr>
</table>

## ⭐️ Star History
> Thank you for using our package! — support us by sharing it! 😁

<a href="https://star-history.com/#DJj123dj/apc-mini-mk2&Date">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=DJj123dj/apc-mini-mk2&type=Date&theme=dark" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/svg?repos=DJj123dj/apc-mini-mk2&type=Date" />
   <img alt="Star History Chart" src="https://api.star-history.com/svg?repos=DJj123dj/apc-mini-mk2&type=Date" />
 </picture>
</a>

---
<img src="https://apis.dj-dj.be/cdn/apc-mini-mk2/logo.png" alt="Apc Mini Mk2 Logo" width="130px">

**v1.0.0 - README.md**<br>
© 2026 - [DJdj Development](https://www.dj-dj.be) - [Discord](https://discord.dj-dj.be) - [Terms](https://www.dj-dj.be/terms) - [Privacy Policy](https://www.dj-dj.be/privacy) - [Support Us](https://github.com/sponsors/DJj123dj) - [License](./LICENSE.md)