import 'dart:async';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'app.dart';
import 'core/services/api_client.dart';
import 'core/services/notification_service.dart';

import 'data/datasources/ticket_list_datasource.dart';

final GlobalKey<NavigatorState> navigatorKey = GlobalKey<NavigatorState>();

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await dotenv.load(fileName: '.env');
  final api = ApiClient.instance;

  final notificationService = NotificationService();
  await notificationService.init(onPayload: (String? payload) async {
    if (payload != null) {
      final tId = int.tryParse(payload);
      if (tId != null) {
        final ticket = await TicketListDatasource().getTicketById(tId);
        if (ticket != null) {
          navigatorKey.currentState?.pushNamed(
            '/ticket-detail',
            arguments: ticket,
          );
        }
      }
    }
  });
  await notificationService.requestPermissions();

  final prefs = await SharedPreferences.getInstance();
  int lastSeenId = prefs.getInt('last_seen_comment_id') ?? 0;

  if (lastSeenId == 0 && prefs.getString(ApiClient.tokenKey) != null) {
    try {
      // Sin "after" la API solo devuelve el último id existente
      final res = await api.get('/conversaciones/nuevas') as Map<String, dynamic>;
      lastSeenId = res['ultimo_id'] as int;
      await prefs.setInt('last_seen_comment_id', lastSeenId);
    } catch (e) {
      debugPrint('Error init lastSeenId: $e');
    }
  }

  Timer.periodic(const Duration(seconds: 15), (timer) async {
    try {
      // No hay sesión iniciada
      if (prefs.getInt('session_user_id') == null || prefs.getString(ApiClient.tokenKey) == null) return;

      // La API ya filtra: solo mensajes de otros usuarios en MIS tickets
      final res = await api.get(
        '/conversaciones/nuevas',
        query: {'after': '$lastSeenId'},
      ) as Map<String, dynamic>;
      final rows = res['mensajes'] as List;

      if (rows.isEmpty) {
        final ultimo = res['ultimo_id'] as int;
        if (ultimo > lastSeenId) {
          lastSeenId = ultimo;
          await prefs.setInt('last_seen_comment_id', lastSeenId);
        }
        return;
      }

      for (var row in rows) {
        final int id = row['id'] as int;
        if (id > lastSeenId) {
          lastSeenId = id;
          await prefs.setInt('last_seen_comment_id', lastSeenId);
        }

        final int tId = row['incidente_id'] as int;
        final String msg = row['mensaje']?.toString() ?? 'Nuevo mensaje';

        notificationService.showNotification(
          id: id,
          title: 'Nuevo comentario en Ticket #$tId',
          body: msg,
          payload: tId.toString(),
        );
      }
    } catch (e) {
      debugPrint('Error polling comentarios: $e');
    }
  });

  runApp(App(navigatorKey: navigatorKey));
}
