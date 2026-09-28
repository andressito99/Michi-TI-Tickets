import 'package:shared_preferences/shared_preferences.dart';
import '../../core/services/api_client.dart';

class AuthLocalDatasource {
  static const _keyToken        = ApiClient.tokenKey;
  static const _keyUserId       = 'session_user_id';
  static const _keyUsername     = 'session_username';
  static const _keyLogged       = 'session_logged';
  static const _keyRol          = 'session_rol';
  static const _keyDepartamento = 'session_departamento';

  Future<SharedPreferences> get _prefs => SharedPreferences.getInstance();

  Future<void> saveSession({
    required String token,
    required int userId,
    required String username,
    required String rol,
    required String departamento,
  }) async {
    final prefs = await _prefs;
    await prefs.setString(_keyToken,       token);
    await prefs.setBool(_keyLogged,        true);
    await prefs.setInt(_keyUserId,         userId);
    await prefs.setString(_keyUsername,    username);
    await prefs.setString(_keyRol,         rol);
    await prefs.setString(_keyDepartamento, departamento);
  }

  Future<void> clearSession() async {
    final prefs = await _prefs;
    await prefs.remove(_keyToken);
    await prefs.remove(_keyLogged);
    await prefs.remove(_keyUserId);
    await prefs.remove(_keyUsername);
    await prefs.remove(_keyRol);
    await prefs.remove(_keyDepartamento);
  }

  /// Requiere también el token: las sesiones antiguas (Supabase) no lo tienen.
  Future<bool> isLoggedIn() async {
    final prefs = await _prefs;
    return (prefs.getBool(_keyLogged) ?? false) && prefs.getString(_keyToken) != null;
  }

  Future<int?> getUserId() async {
    final prefs = await _prefs;
    return prefs.getInt(_keyUserId);
  }

  Future<String?> getUsername() async {
    final prefs = await _prefs;
    return prefs.getString(_keyUsername);
  }

  Future<String?> getRol() async {
    final prefs = await _prefs;
    return prefs.getString(_keyRol);
  }

  Future<String?> getDepartamento() async {
    final prefs = await _prefs;
    return prefs.getString(_keyDepartamento);
  }
}
