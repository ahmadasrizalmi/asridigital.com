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
 * @default 48
 * @range 12, 160
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
 * @default 0.22
 * @range 0, 1
 */
uniform float u_alpha;
void main() {
  vec2 p = mod(gl_FragCoord.xy, u_spacing);
  float dx = min(p.x, u_spacing - p.x);
  float dy = min(p.y, u_spacing - p.y);
  float d = min(dx, dy);
  float w = u_width * 0.5;
  float a = (1.0 - smoothstep(w, w + 1.0, d)) * u_alpha;
  gl_FragColor = vec4(u_color * a, a);
}
