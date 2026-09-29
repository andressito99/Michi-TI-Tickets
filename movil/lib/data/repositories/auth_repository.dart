// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 andressito99 y los colaboradores del proyecto Michi · Soporte TI con siete vidas

import '../datasources/auth_local_datasource.dart';
import '../datasources/auth_remote_datasource.dart';

export '../datasources/auth_remote_datasource.dart'
    show RegisterResult, LoginResult, RegisterResultMessage;

class AuthRepository {
  final AuthLocalDatasource  _local;
  final AuthRemoteDatasource _remote;

  AuthRepository({
    AuthLocalDatasource?  local,
    AuthRemoteDatasource? remote,
  })  : _local  = local  ?? AuthLocalDatasource(),
        _remote = remote ?? AuthRemoteDatasource();

  Future<RegisterResult> register({
    required String usuario,
    required String contrasena,
    required String correo,
    required String departamento,
  }) =>
      _remote.register(
        usuario:      usuario,
        contrasena:   contrasena,
        correo:       correo,
        departamento: departamento,
      );

  Future<bool> login(String usuario, String contrasena) async {
    final result = await _remote.login(
      usuario:    usuario,
      contrasena: contrasena,
    );
    if (result.success && result.username != null && result.userId != null && result.token != null) {
      await _local.saveSession(
        token:        result.token!,
        userId:       result.userId!,
        username:     result.username!,
        rol:          result.rol ?? 'usuario',
        departamento: result.departamento ?? '',
      );
      return true;
    }
    return false;
  }

  Future<void> logout() => _local.clearSession();

  Future<bool> isLoggedIn() => _local.isLoggedIn();

  Future<int?> getUserId() => _local.getUserId();

  Future<String?> getUsername() => _local.getUsername();

  Future<String?> getRol() => _local.getRol();

  Future<String?> getDepartamento() => _local.getDepartamento();
}
