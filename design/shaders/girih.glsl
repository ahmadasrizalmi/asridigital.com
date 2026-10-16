/** @resolution */
uniform vec2 u_resolution;
/**
 * @label Warna
 * @color
 * @default #D9B26A
 */
uniform vec3 u_color;
/**
 * @label Skala
 * @default 64
 * @range 20, 200
 */
uniform float u_scale;
/**
 * @label Ketebalan
 * @default 1.2
 * @range 0.2, 4
 */
uniform float u_width;
/**
 * @label Opasitas
 * @default 0.3
 * @range 0, 1
 */
uniform float u_alpha;
void main() {
  vec2 p = gl_FragCoord.xy / u_scale;
  vec2 q = vec2(p.x + p.y, p.x - p.y) * 0.7071;
  float l1 = abs(fract(p.x) - 0.5);
  float l2 = abs(fract(p.y) - 0.5);
  float l3 = abs(fract(q.x) - 0.5);
  float l4 = abs(fract(q.y) - 0.5);
  float l = min(min(l1, l2), min(l3, l4));
  float px = u_width / u_scale;
  float a = (1.0 - smoothstep(px, px + 0.014, l)) * u_alpha;
  gl_FragColor = vec4(u_color * a, a);
}
