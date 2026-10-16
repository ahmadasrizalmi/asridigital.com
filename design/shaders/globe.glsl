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
 * @default 0.85
 * @range 0.3, 1.4
 */
uniform float u_scale;
/**
 * @label Ketebalan
 * @default 1.0
 * @range 0.3, 3
 */
uniform float u_width;
/**
 * @label Opasitas
 * @default 0.4
 * @range 0, 1
 */
uniform float u_alpha;
void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution) / (0.5 * u_resolution.y);
  vec2 p = uv / u_scale;
  float r = length(p);
  float a = 0.0;
  if (r <= 1.0) {
    float z = sqrt(max(0.0, 1.0 - r * r));
    vec3 n = vec3(p, z);
    float lon = atan(n.x, n.z);
    float lat = asin(clamp(n.y, -1.0, 1.0));
    float fl = abs(fract(lon / 3.14159265 * 6.0) - 0.5);
    float fa = abs(fract((lat + 1.5707963) / 3.14159265 * 8.0) - 0.5);
    float l = min(fl, fa);
    float px = u_width / (0.5 * u_resolution.y * u_scale);
    a = (1.0 - smoothstep(px, px * 3.5, l)) * u_alpha;
    float edge = 1.0 - smoothstep(0.0, px * 3.5, abs(1.0 - r));
    a = max(a, edge * u_alpha);
  }
  gl_FragColor = vec4(u_color * a, a);
}
