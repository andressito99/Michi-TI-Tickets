// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 andressito99 y los colaboradores del proyecto Michi · Soporte TI con siete vidas

import 'dart:async';
import 'dart:convert';

import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

/// Error devuelto por la API (backend Node).
class ApiException implements Exception {
  final int statusCode;
  final String message;

  const ApiException(this.statusCode, this.message);

  @override
  String toString() => 'ApiException($statusCode): $message';
}

/// Cliente HTTP para la API REST de TI-Tickets.
///
/// La URL base se lee de `API_URL` en el archivo `.env`.
/// En el emulador de Android, `localhost` del PC es `10.0.2.2`.
class ApiClient {
  ApiClient._();
  static final ApiClient instance = ApiClient._();

  static const tokenKey = 'session_token';
  static const _timeout = Duration(seconds: 20);

  final http.Client _http = http.Client();

  String get baseUrl =>
      (dotenv.env['API_URL'] ?? 'http://10.0.2.2:3000/api').replaceAll(RegExp(r'/+$'), '');

  Future<dynamic> get(String path, {Map<String, String>? query}) =>
      _send('GET', path, query: query);

  Future<dynamic> post(String path, [Map<String, dynamic>? body]) =>
      _send('POST', path, body: body ?? const {});

  Future<dynamic> patch(String path, Map<String, dynamic> body) =>
      _send('PATCH', path, body: body);

  Future<dynamic> _send(
    String method,
    String path, {
    Map<String, String>? query,
    Object? body,
  }) async {
    final uri = Uri.parse('$baseUrl$path').replace(queryParameters: query);
    final token = (await SharedPreferences.getInstance()).getString(tokenKey);

    final request = http.Request(method, uri)
      ..headers['Accept'] = 'application/json';
    if (token != null) request.headers['Authorization'] = 'Bearer $token';
    if (body != null) {
      request.headers['Content-Type'] = 'application/json; charset=utf-8';
      request.body = jsonEncode(body);
    }

    final http.Response res;
    try {
      res = await http.Response.fromStream(await _http.send(request).timeout(_timeout));
    } on TimeoutException {
      throw const ApiException(0, 'El servidor no respondió a tiempo');
    } catch (e) {
      throw ApiException(0, 'No se pudo conectar con el servidor ($e)');
    }

    final text = utf8.decode(res.bodyBytes);
    final data = text.isEmpty ? null : jsonDecode(text);

    if (res.statusCode >= 400) {
      final msg = data is Map && data['error'] is String ? data['error'] as String : 'Error ${res.statusCode}';
      throw ApiException(res.statusCode, msg);
    }
    return data;
  }
}
