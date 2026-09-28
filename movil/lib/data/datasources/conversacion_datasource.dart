import 'package:flutter/foundation.dart';
import '../../core/services/api_client.dart';
import '../models/conversacion_message.dart';

class ConversacionDatasource {
  final _api = ApiClient.instance;

  Future<ConversacionMessage?> getLastComment(int ticketId) async {
    final map = await getLastComments([ticketId]);
    return map[ticketId];
  }

  Future<Map<int, ConversacionMessage?>> getLastComments(
      List<int> ticketIds) async {
    if (ticketIds.isEmpty) return {};
    try {
      final res = await _api.get(
        '/conversaciones/ultimas',
        query: {'tickets': ticketIds.join(',')},
      ) as List;
      final map = <int, ConversacionMessage?>{};
      for (final r in res) {
        final msg = ConversacionMessage.fromMap(r as Map<String, dynamic>);
        map[msg.incidenteId] = msg;
      }
      for (final id in ticketIds) {
        map.putIfAbsent(id, () => null);
      }
      return map;
    } catch (e) {
      debugPrint('=== getLastComments error: $e');
      return {};
    }
  }

  Future<List<ConversacionMessage>> getConversacion(int ticketId) async {
    try {
      final res = await _api.get('/tickets/$ticketId/conversaciones') as List;
      return res
          .map((r) => ConversacionMessage.fromMap(r as Map<String, dynamic>))
          .toList();
    } catch (e, stack) {
      debugPrint('=== getConversacion error: $e\n$stack');
      // Return a fake message with the error so it shows on screen
      return [
        ConversacionMessage(
          id: -1,
          incidenteId: ticketId,
          mensaje: 'ERROR DE CARGA: $e',
          fechaPublicacion: DateTime.now(),
          usuarioId: 0,
        )
      ];
    }
  }
}
