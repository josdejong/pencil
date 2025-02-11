# Pencil

Vector based drawing in your browser.

## Usage

```html
<html lang="en">
<body>
  <div id="my-drawing-area"></div>
  
  <script type="module">
    import { createDrawingArea } from "./pencil.js"
  
    const target = document.getElementById('my-drawing-area')
    const drawingArea = createDrawingArea({ target })
  </script>
</body>
</html>
```

## API

```js
const drawingArea = createDrawingArea(config)
```

With the following `DrawingAreaConfig` options:

| Name          | Type               | Description                                          |
|---------------|--------------------|------------------------------------------------------|
| `target`      | `HTMLDivElement`   | The HTML DIV where to create the drawing area        |
| `color`       | `string`           | The color of the lines                               |
| `activeColor` | `string`           | The color that the line has while drawing it         |
| `lineWidth`   | `number`           | The width of the lines                               |
| `onChange`    | `function(): void` | Callback which is invoked after a new line is drawn. |

The created `DrawingArea` has the following methods:

| Name        | Type                          | Description                                   |
|-------------|-------------------------------|-----------------------------------------------|
| `getTraces` | `function(): Trace[]`         | The HTML DIV where to create the drawing area |
| `getSVG`    | `function(): string`          | The color of the lines                        |
| `getPNG`    | `function(): Promise<string>` | The color that the line has while drawing it  |
| `clear`     | `function(): void`            | Clear all drawn lines.                        |
| `destroy`   | `function( : void`            | Destroy the drawing area.                     |
