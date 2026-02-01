
precision highp float;
uniform sampler2D uPosition;
uniform sampler2D uPosRefs;
uniform sampler2D uPosNearest;

uniform vec2 uMousePos;
uniform float uTime;
uniform float uDeltaTime;
uniform float uIsHovering;
uniform float uSize;

vec2 hash( vec2 p ){
    p = vec2( dot(p,vec2(2127.1,81.17)), dot(p,vec2(1269.5,283.37)) );
    return fract(sin(p)*43758.5453);
}

void main() {
    vec2 simTexCoords = gl_FragCoord.xy / vec2(uSize, uSize);
    vec4 pFrame = texture2D(uPosition, simTexCoords);

    float scale = pFrame.z;
    float velocity = pFrame.w;
    vec2 refPos = texture2D(uPosRefs, simTexCoords).xy;
    vec2 nearestPos = texture2D(uPosNearest, simTexCoords).xy;
    float seed = hash(simTexCoords).x;
    float seed2 = hash(simTexCoords).y;

    float time = uTime * .5;
    float lifeEnd = 3. + sin(seed2 * 100.) * 1.;
    float lifeTime = mod((seed * 100.) + time, lifeEnd);

    vec2 disp = vec2(0., 0.);
    vec2 pos = pFrame.xy;

    vec2 targetPos = mix(refPos, nearestPos, uIsHovering);

    vec2 direction = normalize(targetPos - pos);
    float dist = length(targetPos - pos);
    
    float moveSpeed = mix(0.015, 0.03, uIsHovering); 
    float distStrength = smoothstep(0.0, 0.2, dist);
    
    if(dist > 0.002){
        pos += direction * moveSpeed * distStrength;
    }

    if(lifeTime < .01){
        pos = refPos;
        pFrame.xy = refPos;
        scale = 0.;
    }

    float targetScale = smoothstep(.01, 0.5, lifeTime) - smoothstep(0.5, 1., lifeTime/lifeEnd);
    targetScale += smoothstep(0.1, 0., smoothstep(0.001, .1, dist)) * 1.5 * uIsHovering;

    float scaleDiff = targetScale - scale;
    scaleDiff *= .1;
    scale += scaleDiff;

    float distRadius = 0.15;
    vec2 finalPos = pos + (disp * smoothstep(0.001, distRadius, dist));
    vec2 diff = finalPos - pFrame.xy;
    diff *= .2;

    velocity = smoothstep(distRadius, .001, dist) * uIsHovering;

    vec4 frame = vec4(pFrame.xy + diff, scale, velocity);
    gl_FragColor = frame;
}
