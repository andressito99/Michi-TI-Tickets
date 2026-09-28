import '../../core/services/api_client.dart';

class OtroIncidenteDatasource {
  final _api = ApiClient.instance;

  /// El backend asigna el usuario (del token) y la fecha.
  Future<void> insert({
    required int userId,
    required String departamento,
    required String status,
    required String categoria,
    required String descripcion,
    required String prioridad,
    required int agente,
  }) async {
    await _api.post('/otros-incidentes', {
      'Departamento': departamento,
      'Status':       status,
      'Categoria':    categoria,
      'Descripcion':  descripcion,
      'Prioridad':    prioridad,
      'Agente':       agente,
    });
  }
}
