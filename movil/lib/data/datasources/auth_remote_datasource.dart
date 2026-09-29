// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 andressito99 y los colaboradores del proyecto Michi · Soporte TI con siete vidas

import 'package:flutter/foundation.dart';
import '../../core/services/api_client.dart';

class AuthRemoteDatasource {
  final _api = ApiClient.instance;

  static bool isValidCompanyEmail(String email) {
    return email.trim().toLowerCase().endsWith('@empresa.com');
  }

  Future<RegisterResult> register({
    required String usuario,
    required String contrasena,
    required String correo,
    required String departamento,
  }) async {
    if (usuario.trim().isEmpty ||
        contrasena.trim().isEmpty ||
        correo.trim().isEmpty ||
        departamento.trim().isEmpty) {
      return RegisterResult.emptyFields;
    }
    if (usuario.trim().length < 3) return RegisterResult.usernameTooShort;
    if (contrasena.length < 4)     return RegisterResult.passwordTooShort;
    if (!isValidCompanyEmail(correo)) return RegisterResult.invalidEmail;

    try {
      await _api.post('/auth/register', {
        'usuario':      usuario.trim(),
        'contrasena':   contrasena,
        'correo':       correo.trim().toLowerCase(),
        'departamento': departamento.trim(),
      });
      return RegisterResult.success;
    } on ApiException catch (e) {
      debugPrint('=== register error: $e');
      if (e.statusCode == 409) return RegisterResult.usernameTaken;
      return RegisterResult.serverError;
    } catch (e, s) {
      debugPrint('=== register catch: $e');
      debugPrint('=== stack: $s');
      return RegisterResult.serverError;
    }
  }

  Future<LoginResult> login({
    required String usuario,
    required String contrasena,
  }) async {
    try {
      final res = await _api.post('/auth/login', {
        'usuario':  usuario.trim(),
        'password': contrasena,
      }) as Map<String, dynamic>;
      final user = res['user'] as Map<String, dynamic>;

      return LoginResult(
        success:      true,
        token:        res['token'] as String,
        userId:       user['id'] as int,
        username:     user['Usuario'] as String,
        rol:          user['Rol'] as String? ?? 'usuario',
        departamento: user['Departmento'] as String? ?? '',
      );
    } on ApiException catch (e) {
      debugPrint('=== login error: $e');
      return e.statusCode == 401 ? LoginResult.invalid : LoginResult.serverError;
    } catch (e) {
      debugPrint('=== login error: $e');
      return LoginResult.serverError;
    }
  }
}

enum RegisterResult {
  success,
  usernameTaken,
  emptyFields,
  usernameTooShort,
  passwordTooShort,
  invalidEmail,
  serverError,
}

extension RegisterResultMessage on RegisterResult {
  String get message {
    switch (this) {
      case RegisterResult.success:
        return 'Registro exitoso';
      case RegisterResult.usernameTaken:
        return 'Este usuario o correo ya está en uso';
      case RegisterResult.emptyFields:
        return 'Completa todos los campos';
      case RegisterResult.usernameTooShort:
        return 'El usuario debe tener al menos 3 caracteres';
      case RegisterResult.passwordTooShort:
        return 'La contraseña debe tener al menos 4 caracteres';
      case RegisterResult.invalidEmail:
        return 'El correo debe ser @empresa.com';
      case RegisterResult.serverError:
        return 'Error de servidor, intenta de nuevo';
    }
  }
}

class LoginResult {
  final bool success;
  final String? token;
  final int? userId;
  final String? username;
  final String? rol;
  final String? departamento;

  const LoginResult({
    required this.success,
    this.token,
    this.userId,
    this.username,
    this.rol,
    this.departamento,
  });

  static const invalid = LoginResult(success: false);
  static const serverError = LoginResult(success: false);
}
