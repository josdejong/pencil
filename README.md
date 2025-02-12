# Pencil

Vector based drawing in your browser.

## Demo

Try it out: https://josdejong.github.io/pencil/

## Usage

```html
<html lang="en">
<body>
  <div id="my-drawing-area"></div>
  
  <script type="module">
    import { createDrawingArea } from "./pencil.js"
  
    const drawingArea = createDrawingArea({ 
      target: document.getElementById('my-drawing-area'),
      color: 'black',
      activeColor: 'red'
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

| Name          | Type               | Required | Description                                          |
|---------------|--------------------|----------|------------------------------------------------------|
| `target`      | `HTMLDivElement`   | Yes      | The HTML DIV where to create the drawing area        |
| `color`       | `string`           | No       | The color of the lines                               |
| `activeColor` | `string`           | No       | The color that the line has while drawing it         |
| `lineWidth`   | `number`           | No       | The width of the lines                               |
| `onChange`    | `function(): void` | No       | Callback which is invoked after a new line is drawn. |

The created `DrawingArea` has the following methods:

| Name        | Type                          | Description                                   |
|-------------|-------------------------------|-----------------------------------------------|
| `getTraces` | `function(): Trace[]`         | The HTML DIV where to create the drawing area |
| `getSVG`    | `function(): string`          | The color of the lines                        |
| `getPNG`    | `function(): Promise<string>` | The color that the line has while drawing it  |
| `clear`     | `function(): void`            | Clear all drawn lines.                        |
| `destroy`   | `function( : void`            | Destroy the drawing area.                     |
