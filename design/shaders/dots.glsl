/** @resolution */
uniform vec2 u_resolution;
/**
 * @label Warna
 * @color
 * @default #D9B26A
 */
uniform vec3 u_color;
/**
 * @label Jarak
 * @default 34
 * @range 10, 120
 */
uniform float u_spacing;
/**
 * @label Radius
 * @default 1.7
 * @range 0.4, 6
 */
uniform float u_radius;
/**
 * @label Opasitas
 * @default 0.5
 * @range 0, 1
 */
uniform float u_alpha;
void main() {
  vec2 p = mod(gl_FragCoord.xy, u_spacing) - u_spacing * 0.5;
  float d = length(p);
  float a = (1.0 - smoothstep(u_radius - 0.6, u_radius + 0.6, d)) * u_alpha;
  gl_FragColor = vec4(u_color * a, a);
}
