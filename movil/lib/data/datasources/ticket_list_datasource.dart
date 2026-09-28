import 'package:flutter/foundation.dart';
import '../../core/services/api_client.dart';
import '../models/ticket_model.dart';
import 'conversacion_datasource.dart';

class TicketListDatasource {
  final _api = ApiClient.instance;
  final _conversacion = ConversacionDatasource();

  /// El backend ya filtra por el usuario del token; `userId` se conserva por compatibilidad.
  Future<List<TicketModel>> getActiveTickets(int userId) async {
    final results = await Future.wait([
      _getFromTickets(),
      _getFromOtrosIncidentes(),
    ]);
    final all = [...results[0], ...results[1]];
    all.sort((a, b) => b.date.compareTo(a.date));
    return all;
  }

  TicketModel _fromTicketRow(Map<String, dynamic> r) => TicketModel(
        id:           r['id'] as int,
        userId:       (r['Usuario'] as num?)?.toInt() ?? 0,
        departamento: r['Departamento'] as String? ?? '',
        description:  r['Descripcion'] as String? ?? '',
        status:       r['Status'] as String? ?? 'pending',
        date:         DateTime.parse(r['Fecha'] as String).toLocal(),
        incidenteId:  r['Incidente_ID'] as int?,
        tiempo:       r['Incidente_Tiempo'] as String?,
        source:       TicketSource.tickets,
      );

  Future<List<TicketModel>> _getFromTickets() async {
    try {
      final res = await _api.get('/tickets') as List;
      final tickets = res.map((r) => _fromTicketRow(r as Map<String, dynamic>)).toList();

      final ids = tickets.map((t) => t.id).toList();
      final comments = await _conversacion.getLastComments(ids);
      return tickets.map((t) => TicketModel(
        id:             t.id,
        userId:         t.userId,
        departamento:   t.departamento,
        description:    t.description,
        status:         t.status,
        date:           t.date,
        incidenteId:    t.incidenteId,
        tiempo:         t.tiempo,
        lastComment:    comments[t.id]?.mensaje,
        lastCommentDate: comments[t.id]?.fechaPublicacion,
        source:         TicketSource.tickets,
      )).toList();
    } catch (e) {
      debugPrint('=== Tickets query FAILED: $e');
      return [];
    }
  }

  Future<List<TicketModel>> _getFromOtrosIncidentes() async {
    try {
      final res = await _api.get('/otros-incidentes', query: {'activos': '1'}) as List;
      return res.map((r) => TicketModel(
        id:          r['id'] as int,
        userId:      (r['Usuario_ID'] as num?)?.toInt() ?? 0,
        departamento: r['Departamento'] as String? ?? '',
        description: r['Descripcion'] as String? ?? '',
        status:      r['Status'] as String? ?? 'pending',
        date:        DateTime.parse(r['Fecha'] as String).toLocal(),
        categoria:   r['Categoria'] as String?,
        prioridad:   r['Prioridad'] as String?,
        agente:      (r['Agente'] as num?)?.toInt(),
        source:      TicketSource.otrosIncidentes,
      )).toList();
    } catch (e) {
      debugPrint('=== error fetching Otros_incidentes: $e');
      return [];
    }
  }

  Future<TicketModel?> getTicketById(int id) async {
    try {
      final res = await _api.get('/tickets/$id') as Map<String, dynamic>;
      return _fromTicketRow(res);
    } catch (e) {
      debugPrint('=== getTicketById error: $e');
      return null;
    }
  }
}
