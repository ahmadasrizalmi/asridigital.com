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
 * @default 26
 * @range 8, 90
 */
uniform float u_spacing;
/**
 * @label Ketebalan
 * @default 1.0
 * @range 0.4, 4
 */
uniform float u_width;
/**
 * @label Opasitas
 * @default 0.2
 * @range 0, 1
 */
uniform float u_alpha;
void main() {
  float v = fract((gl_FragCoord.x + gl_FragCoord.y) / u_spacing);
  float d = min(v, 1.0 - v) * u_spacing;
  float w = u_width * 0.5;
  float a = (1.0 - smoothstep(w, w + 1.0, d)) * u_alpha;
  gl_FragColor = vec4(u_color * a, a);
}
