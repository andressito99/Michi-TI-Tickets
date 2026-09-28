import { Router } from "express";
import bcrypt from "bcryptjs";
import { query, queryOne } from "../db.js";
import { HttpError, requireAuth, signToken } from "../middleware/auth.js";

const router = Router();

const PUBLIC_USER_FIELDS = "id, Usuario, Correo, Rol, Departmento";
const isBcryptHash = value => /^\$2[aby]\$\d{2}\$/.test(value ?? "");

export const hashPassword = plain => bcrypt.hash(plain, 10);

/**
 * Comprueba la contraseña. Si la fila guarda texto plano (datos antiguos o
 * insertados a mano en phpMyAdmin) y coincide, la re-hashea con bcrypt.
 */
async function verifyPassword(user, plain) {
  const stored = user["Contraseña"] ?? "";
  if (isBcryptHash(stored)) return bcrypt.compare(plain, stored);
  if (stored !== plain) return false;
  await query("UPDATE Usuarios SET `Contraseña` = ? WHERE id = ?", [await hashPassword(plain), user.id]);
  return true;
}

// POST /api/auth/login  { correo | usuario, password }
router.post("/login", async (req, res) => {
  const { correo, usuario, password } = req.body ?? {};
  if ((!correo && !usuario) || !password) throw new HttpError(400, "Faltan credenciales");

  const user = correo
    ? await queryOne("SELECT * FROM Usuarios WHERE Correo = ? LIMIT 1", [String(correo).toLowerCase().trim()])
    : await queryOne("SELECT * FROM Usuarios WHERE Usuario = ? LIMIT 1", [String(usuario).trim()]);

  if (!user || !(await verifyPassword(user, String(password)))) {
    throw new HttpError(401, "Usuario o contraseña incorrectos");
  }

  const { ["Contraseña"]: _omit, created_at: _c, ...publicUser } = user;
  res.json({ token: signToken(user), user: publicUser });
});

// POST /api/auth/register  { usuario, contrasena, correo, departamento }
router.post("/register", async (req, res) => {
  const usuario      = String(req.body?.usuario ?? "").trim();
  const contrasena   = String(req.body?.contrasena ?? "");
  const correo       = String(req.body?.correo ?? "").trim().toLowerCase();
  const departamento = String(req.body?.departamento ?? "").trim();

  if (!usuario || !contrasena.trim() || !correo || !departamento) throw new HttpError(400, "Completa todos los campos");
  if (usuario.length < 3)    throw new HttpError(400, "El usuario debe tener al menos 3 caracteres");
  if (contrasena.length < 4) throw new HttpError(400, "La contraseña debe tener al menos 4 caracteres");
  if (!correo.endsWith("@empresa.com")) throw new HttpError(400, "El correo debe ser @empresa.com");

  const existing = await queryOne("SELECT id FROM Usuarios WHERE Usuario = ? OR Correo = ? LIMIT 1", [usuario, correo]);
  if (existing) throw new HttpError(409, "El usuario o correo ya está en uso");

  const result = await query(
    "INSERT INTO Usuarios (Usuario, `Contraseña`, Correo, Rol, Departmento) VALUES (?, ?, ?, 'usuario', ?)",
    [usuario, await hashPassword(contrasena), correo, departamento]
  );
  res.status(201).json({ id: result.insertId });
});

// GET /api/auth/me
router.get("/me", requireAuth, async (req, res) => {
  const user = await queryOne(`SELECT ${PUBLIC_USER_FIELDS} FROM Usuarios WHERE id = ?`, [req.user.id]);
  if (!user) throw new HttpError(404, "Usuario no encontrado");
  res.json(user);
});

export default router;
