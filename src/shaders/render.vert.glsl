
precision highp float;
attribute vec4 seeds;

uniform sampler2D uPosition;
uniform float uTime;
uniform float uParticleScale;
uniform float uPixelRatio;
uniform int uColorScheme;
uniform float uIsHovering;
uniform float uPulseProgress;

varying vec4 vSeeds;
varying float vVelocity;
varying vec2 vLocalPos;
varying vec2 vScreenPos;
varying float vScale;
varying vec2 vUv;

// NOISE_SHADER_CHUNK will be prepended manually

void main() {
    vUv = uv;

    vec4 pos = texture2D(uPosition, uv);
    vSeeds = seeds;

    float noiseX = snoise(vec3( vec2(pos.xy * 10.), uTime * .2 + 100.));
    float noiseY = snoise(vec3( vec2(pos.xy * 10.), uTime * .2));

    float noiseX2 = snoise(vec3( vec2(pos.xy * .5), uTime * .15 + 45.));
    float noiseY2 = snoise(vec3( vec2(pos.xy * .5), uTime * .15 + 87.));

    float cDist = length(pos.xy) * 1.;
    float progress = uPulseProgress;
    float t = smoothstep(progress - .25, progress, cDist) - smoothstep(progress, progress + .25, cDist);
    t *= smoothstep(1., .0, cDist);
    pos.xy *= 1. + (t * .02);

    float dist = smoothstep(0., 0.9, pos.w);
    dist = mix(0., dist, uIsHovering);

    pos.y += noiseY * 0.005 * dist;
    pos.x += noiseX * 0.005 * dist;
    pos.y += noiseY2 * 0.02;
    pos.x += noiseX2 * 0.02;

    vVelocity = pos.w;
    vScale = pos.z;
    vLocalPos = pos.xy;
    vec4 viewSpace  = modelViewMatrix * vec4(vec3(pos.xy, 0.), 1.0);

    gl_Position = projectionMatrix * viewSpace;
    vScreenPos = gl_Position.xy;

    float minScale = .25;
    minScale += float(uColorScheme) * .75;

    gl_PointSize = ((vScale * 7.) * (uPixelRatio * 0.5) * uParticleScale) + (minScale * uPixelRatio);
}
