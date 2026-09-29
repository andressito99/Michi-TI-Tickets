// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 andressito99 y los colaboradores del proyecto Michi · Soporte TI con siete vidas

import 'package:flutter/foundation.dart';
import '../../core/services/api_client.dart';

class IncidenteItem {
  final int id;
  final String incidente;
  final String tiempo;
  final int? agenteId;
  final String? prioridad;
  IncidenteItem({
    required this.id,
    required this.incidente,
    required this.tiempo,
    this.agenteId,
    this.prioridad,
  });
}

class IncidenteDatasource {
  final _api = ApiClient.instance;

  Future<List<String>> getCategorias() async {
    final res = await _api.get('/incidentes/categorias') as List;
    return res.map((c) => c as String).toList();
  }

  Future<List<IncidenteItem>> getIncidentesPorCategoria(String categoria) async {
    try {
      final res = await _api.get('/incidentes', query: {'categoria': categoria}) as List;
      debugPrint('[IncidenteDatasource] categoria=$categoria -> ${res.length} rows');
      return res.map((r) {
        final agente = r['Agentes'];
        return IncidenteItem(
          id:        r['id'] as int,
          incidente: r['Incidente'] as String,
          tiempo:    r['Tiempo'] as String? ?? '',
          agenteId:  agente is num ? agente.toInt() : null,
          prioridad: r['Prioridad'] as String?,
        );
      }).toList();
    } catch (e) {
      debugPrint('[IncidenteDatasource] FAILED: $e');
      return [];
    }
  }
}
