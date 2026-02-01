
precision highp float;

varying vec4 vSeeds;
varying vec2 vScreenPos;
varying vec2 vLocalPos;
varying float vScale;
varying float vVelocity;
varying vec2 vUv;

uniform vec3 uColor;

uniform vec2 uMousePos;
uniform vec2 uRez;

uniform float uAlpha;
uniform float uTime;
uniform sampler2D uColorTex;
uniform float uProgress;

uniform int uColorScheme;

// NOISE_SHADER_CHUNK will be prepended manually

#define PI 3.1415926535897932384626433832795

void main() {
    float uBorderSize = 0.2;
    float ratio = uRez.x / uRez.y;

    vec2 uv = gl_PointCoord.xy - 0.5;
    uv.y *= -1.;

    float h = 0.5; 
    vec3 gradientColor = mix(uColor, uColor * 0.8, vVelocity);
    
    vec3 imgColor = texture2D(uColorTex, vUv).rgb;
    vec3 color = mix(gradientColor, imgColor, uProgress);

    float dist = length(uv);

    float dr = .5;
    float t = smoothstep(dr+(uBorderSize + .0001), dr-uBorderSize, dist);
    t = clamp(t, 0., 1.);

    float disc = smoothstep(.5, .45, dist);

    float a = uAlpha * disc * smoothstep(0.1, 0.2, vScale);

    if(a < 0.01){
        discard;
    }

    color = clamp(color, 0., 1.);
    // For light mode, we want the particles to be darker when scattered
    // To improve dot visibility in light mode, we use uColor directly when not hovering
    vec3 finalCol = mix(color, uColor, float(uColorScheme) * (1.0 - uProgress));
    
    gl_FragColor = vec4(finalCol, clamp(a, 0., 1.));

    #ifdef SRGB_TRANSFER
        gl_FragColor = sRGBTransferOETF( gl_FragColor );
    #endif
}
