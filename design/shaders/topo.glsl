/** @resolution */
uniform vec2 u_resolution;
/**
 * @label Warna
 * @color
 * @default #D9B26A
 */
uniform vec3 u_color;
/**
 * @label Kepadatan
 * @default 2.0
 * @range 0.4, 8
 */
uniform float u_scale;
/**
 * @label Ketebalan
 * @default 0.06
 * @range 0.01, 0.3
 */
uniform float u_width;
/**
 * @label Opasitas
 * @default 0.25
 * @range 0, 1
 */
uniform float u_alpha;
void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  float n = sin(uv.x * 9.0 + sin(uv.y * 7.0) * 2.2)
          + sin(uv.y * 8.0 + cos(uv.x * 6.0) * 2.0)
          + 0.6 * sin((uv.x + uv.y) * 13.0);
  float c = abs(fract(n * u_scale) - 0.5);
  float a = (1.0 - smoothstep(u_width, u_width + 0.08, c)) * u_alpha;
  gl_FragColor = vec4(u_color * a, a);
}
