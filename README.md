# ParticleImage

A high-performance 3D particle morphing library built with Three.js. Transform particles into any image (Path, Base64, or SVG) with smooth GPGPU-powered animations.

video.mp4

## Installation

```bash
npm install particle-image
```

## Usage

```javascript
import { ParticleImage } from 'particle-image';

const canvas = document.getElementById('canvas');
const effect = new ParticleImage(canvas, {
    theme: 'dark',        // 'dark' | 'light' (default: 'dark')
    color: '#aecbfa',     // Base particle color
    density: 200,         // Number of particles (default: 150)
    particlesScale: 0.6,  // Scale of the morphed image (default: 0.5)
    cameraZoom: 3.5,      // Camera distance (default: 3.5)
    duration: 0.8         // Animation duration in seconds (default: 0.6)
});

// Morph to an image
await effect.render('./path/to/image.png');

// Scatter particles back to background state
effect.scatter();

// Clean up resources
effect.destroy();
```

## Options

| Property | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `theme` | `string` | `'dark'` | Visual theme (`'dark'` or `'light'`). Affects background and auto-default color. |
| `color` | `string` | *Varies* | Hex color for particles in scattered/background state. Defaults to light blue for dark theme, dark grey for light theme. |
| `density` | `number` | `150` | Higher values result in more particles and sharper images. |
| `particlesScale` | `number` | `0.5` | The target size of the image relative to the canvas. |
| `cameraZoom` | `number` | `3.5` | Perspective zoom level. Lower values create more wide-angle distortion. |
| `duration` | `number` | `0.6` | Transition time for `render()` and `scatter()` animations. |

## API

### `render(imageSource)`
- **Arguments**: `imageSource` (String: URL path, Base64 data, or raw SVG string).
- **Returns**: `Promise<void>`
- **Description**: Triggers the particle morphing animation towards the provided image. Uses an internal LRU cache to store processed data for instant repeated calls.

### `scatter()`
- **Description**: Resets particles back to their original wandering background state.

### `destroy()`
- **Description**: Stops the animation loop and releases all memory and GPU resources used by the instance. Use this when the component is unmounted to prevent memory leaks.

## License

MIT
