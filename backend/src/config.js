// Toda la configuración sensible viene de variables de entorno (backend/.env).
// No hay secretos con valores por defecto en el código: si falta alguno, el servidor no arranca.
const env = process.env;

const errors = [];

function required(name, { minLength = 1 } = {}) {
  const value = env[name];
  if (value === undefined || value.trim() === "") {
    errors.push(`${name} no está definido`);
    return "";
  }
  if (value.length < minLength) errors.push(`${name} debe tener al menos ${minLength} caracteres`);
  return value;
}

// Valores de ejemplo de .env.example que nunca deben usarse de verdad
const PLACEHOLDERS = ["cambia-esto-por-un-secreto-largo", "cambia-esto-tambien", "dev-secret-cambiar"];
function secret(name, minLength) {
  const value = required(name, { minLength });
  if (PLACEHOLDERS.includes(value)) errors.push(`${name} todavía tiene el valor de ejemplo de .env.example`);
  return value;
}

export const config = {
  port: Number(env.PORT) || 3000,
  corsOrigins: (env.CORS_ORIGINS ?? "").split(",").map(s => s.trim()).filter(Boolean),
  isProduction: env.NODE_ENV === "production",

  db: {
    host:     required("DB_HOST"),
    port:     Number(required("DB_PORT")),
    user:     required("DB_USER"),
    password: env.DB_PASSWORD ?? "",   // puede estar vacío en instalaciones locales
    database: required("DB_NAME"),
  },

  jwtSecret:    secret("JWT_SECRET", 32),
  jwtExpiresIn: env.JWT_EXPIRES_IN || "12h",

  ai: {
    url:   (env.AI_SERVICE_URL || "http://127.0.0.1:8000").replace(/\/$/, ""),
    token: secret("AI_SERVICE_TOKEN", 16),
  },
};

if (config.isProduction && config.corsOrigins.length === 0) {
  errors.push("CORS_ORIGINS es obligatorio en producción");
}

if (errors.length) {
  console.error("\n[config] Configuración inválida en backend/.env:\n  - " + errors.join("\n  - "));
  console.error("\nCopia backend/.env.example a backend/.env y complétalo.");
  console.error('Para generar secretos: node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'base64url\'))"\n');
  process.exit(1);
}
