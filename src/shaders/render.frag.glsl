
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

float sdRoundBox( in vec2 p, in vec2 b, in vec4 r )
{
    r.xy = (p.x>0.0)?r.xy : r.zw;
    r.x  = (p.y>0.0)?r.x  : r.y;
    vec2 q = abs(p)-b+r.x;
    return min(max(q.x,q.y),0.0) + length(max(q,0.0)) - r.x;
}

vec2 rotate(vec2 v, float a) {
    float s = sin(a);
    float c = cos(a);
    mat2 m = mat2(c, s, -s, c);
    return m * v;
}

void main() {
    float uBorderSize = 0.2;
    vec2 center = vec2(.48, .4);
    float ratio = uRez.x / uRez.y;

    float angle = atan(vLocalPos.y - uMousePos.y, vLocalPos.x - uMousePos.x);

    vec2 uv = gl_PointCoord.xy;
    uv -= vec2(0.5);
    uv.y *= -1.;

    vec2 tuv = vScreenPos;
    tuv = rotate(tuv, uTime * 1.);
    tuv.y *= 1./ratio;
    tuv += .5;

    float h = 0.5; 
    vec3 gradientColor = mix(uColor, uColor * 0.8, vVelocity);
    
    vec3 imgColor = texture2D(uColorTex, vUv).rgb;
    vec3 color = mix(gradientColor, imgColor, uProgress);

    float dist = sqrt(dot(uv, uv));

    float dr = .5;
    float t = smoothstep(dr+(uBorderSize + .0001), dr-uBorderSize, dist);
    t = clamp(t, 0., 1.);

    float rounded = sdRoundBox(uv, vec2(0.5, 0.2), vec4(.25));
    rounded = smoothstep(.1, 0., rounded);

    float disc = smoothstep(.5, .45, length(uv));

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
