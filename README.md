<img src="https://apis.dj-dj.be/cdn/apc-mini-mk2/logo.png" alt="Apc Mini Mk2 Logo" width="300px">

[![discord](https://img.shields.io/badge/discord-join%20our%20server-5865F2.svg?style=flat-square&logo=discord)](https://discord.com/invite/26vT9wt3n3)  [![version](https://img.shields.io/badge/version-1.0.3-brightgreen.svg?style=flat-square)](https://github.com/DJj123dj/apc-mini-mk2/releases/tag/v1.0.3)  [![license](https://img.shields.io/badge/license-MIT-important.svg?style=flat-square)](https://github.com/DJj123dj/logbucket/blob/main/LICENSE) [![stars](https://img.shields.io/github/stars/DJj123dj/apc-mini-mk2?color=yellow&label=stars&logo=github&style=flat-square)](https://www.github.com/DJj123dj/apc-mini-mk2)

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
> Images will be added to the README soon!
<!--<img src="https://apis.dj-dj.be/cdn/apc-mini-mk2/example.png" width="700px">
<img src="https://apis.dj-dj.be/cdn/apc-mini-mk2/example.png" width="700px">
<img src="https://apis.dj-dj.be/cdn/apc-mini-mk2/example.png" width="700px">
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
> [View full examples in Github Repository](https://github.com/DJj123dj/logbucket/tree/main/examples)

---
### 📦 Main Class: `APCMiniController`
This is the main class used to connect, manage and control APC Mini Mk2 devices.  
Almost all described functions are a method of this class.

> **Construction Parameters:**
> * **`maxControllerAmount?`** (`number`): Maximum simultaneously connected controllers. *Default: `1`*
> * **`manualIdAssignmentsEnabled?`** (`boolean`): Require manually selecting device IDs by pressing a horizontal button.
> * **`coordinates?`** (`APCMiniCoordinateSystem`): Custom coordinate orientation of the 8×8 RGB grid.
> * **`lightBpm?`** (`number`): BPM used for blinking/pulsing modes. *Default: `60`*

### ✅ Properties
- (`lightBpm`: `number`) The BPM used for pulsing/blinking light effects.  
- (`maxControllerAmount`: `number`) Maximum allowed connected APC Mini devices.  
- (`manualIdAssignmentsEnabled`: `boolean`) Enables manual device ID assignment via pad press during connection.  
- (`coordinates`: `APCMiniCoordinateSystem`) The coordinate system mapping used for pad grid orientation.  

---
### 🔌 Connection Management
#### function `startAutoConnect()`: `void`
Begins automatically detecting and connecting APC Mini controllers until the max limit is reached.

#### function `stopAutoConnect()`: `void`
Stops auto-connecting new controllers.

#### function `manualConnect(midiName, customId?)`: `boolean`
Connects to a specific controller by MIDI name.  
Returns `false` on failure.
</summary>

> **Parameters:**
> * **`midiName`** (`string`): Name from `listAvailableControllers()`.
> * **`customId?`** (`number`): Optional forced ID number.
</details>

#### function `manualDisconnect(midiNameOrId)`: `boolean`
Disconnect a controller by MIDI name or ID.  
Returns `false` on failure.

> **Parameters:**
> * **`midiNameOrId`** (`string | number`): The controller name or ID.
</details>

#### function `manualDisconnectAll()`: `boolean`
Disconnects all currently connected controllers.  
Returns `false` on failure.

#### function `listAvailableControllers()`: `string[]`
Returns all unused / available APC Mini Mk2 device names.

#### function `listConnectedControllers()`: `string[]`
Returns all currently connected controller names.

#### function `listUsedIds()`: `number[]`
Returns all assigned controller IDs.

#### function `getConnectedAmount()`: `number`
Returns how many controllers are currently connected.

#### function `setBpm(bpm)`: `void`
Sets the blinking/pulsing BPM for all RGB LED effects.

> **Parameters:**
> * **`bpm`** (`number`): New BPM value.

---
### 🎛️ Event Handling
Each `.on(event, callback)` registers a listener for one of the following events:

#### event `connect`
Triggered when a controller successfully connects.

> **Callback:** `(controllerId: number, midiName: string) => void`

#### event `disconnect`
Triggered when a controller disconnects.

> **Callback:** `(controllerId: number, midiName: string) => void`

#### event `error`
Triggered upon connection errors or failures with lights or buttons.  
If the error is specific to a controller, it will include the ID.

> **Callback:** `(err: string, controllerId?: number) => void`

---
### 🎛️ Pad Button Events

#### event `padButtonPressed`
Triggered when one of the 64 pad buttons has been pressed.  
The location & coordinates correspond to the selected coordinate system.

> **Callback:** `(controllerId: number, location: number, coordinates: APCMiniCoordinates, usingShift: boolean) => void`  
> Location Values: (`0-63`)

#### event `padButtonReleased`
Triggered when one of the 64 pad buttons has been released.  
The location & coordinates correspond to the selected coordinate system.

> **Callback:** `(controllerId: number, location: number, coordinates: APCMiniCoordinates, usingShift: boolean) => void`  
> Location Values: (`0-63`)

#### event `padButtonChanged`
Triggered when one of the 64 pad buttons has changed states (pressed/released).  
The current state of the button is available in the `pressed` parameter.

> **Callback:** `(controllerId: number, location: number, coordinates: APCMiniCoordinates, pressed: boolean, usingShift: boolean) => void`  
> Location Values: (`0-63`)

---
### 🎛️ Horizontal/Vertical Button Events

#### event `horizontalButtonPressed` / `verticalButtonPressed`
Triggered when one of the 8 horizontal or vertical buttons has been pressed.  

> **Callback:** `(controllerId: number, location: number, usingShift: boolean) => void`  
> Location Values: (`0-7`)

#### event `horizontalButtonReleased` / `verticalButtonReleased`
Triggered when one of the 8 horizontal or vertical buttons has been released.  

> **Callback:** `(controllerId: number, location: number, usingShift: boolean) => void`  
> Location Values: (`0-7`)

#### event `horizontalButtonChanged` / `verticalButtonChanged`
Triggered when one of the 8 horizontal or vertical buttons has changed states (pressed/released).  
The current state of the button is available in the `pressed` parameter.

> **Callback:** `(controllerId: number, location: number, pressed: boolean, usingShift: boolean) => void`  
> Location Values: (`0-7`)


---
### 🎛️ Shift Button Events

#### event `shiftButtonPressed`
Triggered when one of the shift buttons on any controller has been pressed.  

> **Callback:** `(controllerId: number) => void): void`  

#### event `shiftButtonReleased`
Triggered when one of the shift buttons on any controller has been released.  

> **Callback:** `(controllerId: number) => void): void`  

#### event `shiftButtonChanged`
Triggered when one of the shift buttons on any controller has changed states (pressed/released).  
The current state of the button is available in the `pressed` parameter.

> **Callback:** `(controllerId: number, pressed: boolean) => void`  

---
### 🎛️ Slider Events

#### event `sliderChanged`
Triggered when one of slider values changes.  
The current state of the slider is available in the `value` parameter.

> **Callback:** `(controllerId: number, location: number, value: number) => void`  
> Location: (`0-8`), Value: (`0-127`)


---
### 🌈 RGB & Light Control

#### function `setRgbLights(controllerId, positions, brightness, mode, color)`: `boolean`
Set RGB pad color, brightness and animation (mode) for one or many pads.

> **Parameters:**
> * **`controllerId`** (`number`): The Controller ID
> * **`positions`** (`number|APCMiniCoordinates|Array<...>`): Pads to change.
> * **`brightness`** (`APCMiniBrightnessMode`): Brightness of the LEDs.
> * **`mode`** (`APCMiniLightMode`): `static` or one of the available LED Effects.
> * **`color`** (`string`): Hex color (e.g. `#f8ba00`)

#### function `setHorizontalLights(controllerId, positions, mode)`: `boolean`
Changes the horizontal (red) button LEDs.

> **Parameters:**
> * **`positions`** (`number|number[]`): A position from `0–7`.
> * **`mode`** (`"off"|"on"|"blink"`): The LED effect to apply.

#### function `setVerticalLights(controllerId, positions, mode)`: `boolean`
Changes the vertical (green) button LEDs.

> **Parameters:**
> * **`positions`** (`number|number[]`): A position from `0–7`.
> * **`mode`** (`"off"|"on"|"blink"`): The LED effect to apply.

#### function `resetLights(controllerId)`: `boolean`
Turns off all lights for a specific controller.

#### function `resetAllLights()`: `boolean`
Turns off all lights for all controllers.

#### function `fillRgbLights(controllerId, startPos, width, height, brightness, mode, color)`: `boolean`
Fills a rectangular region of pads with an RGB color/mode.

> **Parameters:**
> * **`controllerId`** (`number`): The Controller ID
> * **`startPos`** (`number|APCMiniCoordinates`): Start position.
> * **`width`** (`number`): Width of the rectangle (follows the coordinate system).
> * **`height`** (`number`): Height of the rectangle (follows the coordinate system).
> * **`brightness`** (`APCMiniBrightnessMode`): Brightness of the LEDs.
> * **`mode`** (`APCMiniLightMode`): `static` or one of the available LED Effects.
> * **`color`** (`string`): Hex color (e.g. `#f8ba00`)

---
### 📊 State Polling

#### function `getShiftState()`: `boolean`
Returns whether any controller has its Shift button pressed.

#### function `getPadStates(controllerId)`: `boolean[]`
Returns pressed state of all 64 RGB pads.

> **Parameters:**
> * **`controllerId`** (`number`): The Controller ID

#### function `getHorizontalStates(controllerId)`: `boolean[]`
Returns state of horizontal buttons.

> **Parameters:**
> * **`controllerId`** (`number`): The Controller ID

#### function `getVerticalStates(controllerId)`: `boolean[]`
Returns state of vertical buttons.

> **Parameters:**
> * **`controllerId`** (`number`): The Controller ID

#### function `getSliderValues(controllerId)`: `number[]`
Returns slider values (0–127) for the specified controller.

> **Parameters:**
> * **`controllerId`** (`number`): The Controller ID

---
### 🎬 Startup / Connection Animations
All 3 animation methods accept the following callback:  
`(time: number, currentFrame: Map<padLoc, hexColor>) => void`

> **Parameters:**
> * **`time`** (`number`): The time since the start of the animation in milliseconds.
> * **`currentFrame`** (`Map<padLoc,hexColor>`): The current (8x8) animation frame, changes made to this map will update the next frame.

#### function `setIntroAnimation(animation, durationMs)`: `void`
Sets the animation displayed before the user selects the controller ID.

> **Parameters:**
> * **`animation`** (`APCMiniPreconnectAnimation | null`)
> * **`durationMs`** (`number`): The duration of the intro animation.

#### function `setWaitAnimation(animation)`: `void`
Animation played *while* selecting the controller ID.

> **Parameters:**
> * **`animation`** (`APCMiniPreconnectAnimation | null`)

#### function `setOutroAnimation(animation, durationMs)`: `void`
Animation played after controller ID selection is completed.

> **Parameters:**
> * **`animation`** (`APCMiniPreconnectAnimation | null`)
> * **`durationMs`** (`number`): The duration of the outro animation.

---
### 🎨 Utility Functions
Utility functions are available directly, outside the `APCMiniController` class.

#### function `isHexColor(hexColor)`: `hexColor is APCMiniHexColor`
Checks if a string is a valid hex color.

#### function `hexToRgb(hexColor)`: `{ red, green, blue }`
Converts a hex color to 0–255 RGB values.

#### function `rgbToHex(r, g, b)`: `APCMiniHexColor`
Converts RGB values into a hex color string.

#### function `brightness(multiplier, hexColor)`: `#xxxxxx`
Modifies brightness of a hex color using a (0–1) multiplier.

#### function `locationToCoordinates(location)`: `APCMiniCoordinates`
Converts a pad index (0–63) to X-Y coordinates.

#### function `coordinatesToLocation(coordinates)`: `number`
Converts X-Y coordinates to a pad index (0–63).

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

**v1.0.3 - README.md**<br>
© 2026 - [DJdj Development](https://www.dj-dj.be) - [Discord](https://discord.dj-dj.be) - [Terms](https://www.dj-dj.be/terms) - [Privacy Policy](https://www.dj-dj.be/privacy) - [Support Us](https://github.com/sponsors/DJj123dj) - [License](./LICENSE.md)