# Pencil

Vector based drawing in your browser.

Features:

- A pure ESM JavaScript component in one file, `pencil.js`.
- Draw using your mouse or using touch.
- Use strike-through to remove strokes.
- Dynamically resized drawing area.
- Export to SVG or PNG.

## Demo

Try it out: https://josdejong.github.io/pencil/

## Usage

You need one file: `pencil.js`.

```html
<html lang="en">
<body>
  <div id="my-drawing-area"></div>
  
  <script type="module">
    import { createDrawingArea } from "./pencil.js"
  
    const drawingArea = createDrawingArea({ 
      target: document.getElementById('my-drawing-area'),
      strokeColor: 'black'
    })
  </script>
</body>
</html>
```

## API

```js
const drawingArea = createDrawingArea(config)
```

Here, config is an object `DrawingAreaConfig` with the following properties:

| Name                  | Type               | Required | Description                                                    |
|-----------------------|--------------------|----------|----------------------------------------------------------------|
| `target`              | `HTMLDivElement`   | Yes      | The HTML DIV where to create the drawing area                  |
| `strokeColor`         | `string`           | No       | The color of the lines                                         |
| `strokeWidth`         | `number`           | No       | The width of the lines                                         |
| `enableStrikeThrough` | `boolean`          | No       | When true, you can use strike through to clear a drawn stroke. |
| `onChange`            | `function(): void` | No       | Callback which is invoked after a new line is drawn.           |

The created `DrawingArea` has the following methods:

| Name        | Type                          | Description                                   |
|-------------|-------------------------------|-----------------------------------------------|
| `getTraces` | `function(): Trace[]`         | The HTML DIV where to create the drawing area |
| `getSVG`    | `function(): string`          | The color of the lines                        |
| `getPNG`    | `function(): Promise<string>` | The color that the line has while drawing it  |
| `clear`     | `function(): void`            | Clear all drawn lines.                        |
| `destroy`   | `function() : void`           | Destroy the drawing area.                     |
