import '../../core/services/api_client.dart';

class TicketRemoteDatasource {
  final _api = ApiClient.instance;

  /// El backend asigna el usuario (del token) y la fecha.
  Future<void> insert({
    required int userId,
    required int incidenteId,
    required String departamento,
    required String descripcion,
    required int agente,
    required String prioridad,
  }) async {
    await _api.post('/tickets', {
      'Incidente_ID':  incidenteId,
      'Departamento':  departamento,
      'Status':        'En proceso',
      'Descripcion':   descripcion,
      'Agente':        agente,
      'Prioridad':     prioridad,
    });
  }
}
