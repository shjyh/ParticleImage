
export interface ParticleImageOptions {
    /**
     * Visual theme of the background and default particle color.
     * @default 'dark'
     */
    theme?: 'dark' | 'light';

    /**
     * Base hex color for particles in scattered or transition state.
     * Defaults to light blue for dark theme, and dark grey for light theme.
     */
    color?: string;

    /**
     * Scale of the morphed image relative to the canvas.
     * @default 0.5
     */
    particlesScale?: number;

    /**
     * Particle density. Higher values result in more particles and sharper images.
     * @default 150
     */
    density?: number;

    /**
     * Perspective zoom level for the 3D camera.
     * @default 3.5
     */
    cameraZoom?: number;

    /**
     * Duration of the morphing and scattering animations in seconds.
     * @default 0.6
     */
    duration?: number;
}

/**
 * ParticleImage is a high-performance 3D particle morphing library built with Three.js.
 */
export class ParticleImage {
    /**
     * Creates an instance of ParticleImage.
     * @param canvas The HTMLCanvasElement to render on.
     * @param options Configuration options for the particle effect.
     */
    constructor(canvas: HTMLCanvasElement, options?: ParticleImageOptions);

    /**
     * The current progress of the morph animation (0 to 1).
     */
    progress: number;

    /**
     * Triggers the morphing animation to the specified image.
     * Fits the image within the canvas while maintaining aspect ratio.
     * @param imageSource URL path, Base64 string, or raw SVG string.
     * @returns A promise that resolves when the image processing is complete and animation starts.
     */
    render(imageSource: string): Promise<void>;

    /**
     * Triggers the scattering animation, returning particles to their wandering background state.
     */
    scatter(): void;

    /**
     * Stops the animation loop and releases all memory and GPU resources.
     */
    destroy(): void;
}
