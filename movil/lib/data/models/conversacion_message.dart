// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 andressito99 y los colaboradores del proyecto Michi · Soporte TI con siete vidas

class ConversacionMessage {
  final int id;
  final int incidenteId;
  final String mensaje;
  final DateTime fechaPublicacion;
  final int usuarioId;

  const ConversacionMessage({
    required this.id,
    required this.incidenteId,
    required this.mensaje,
    required this.fechaPublicacion,
    required this.usuarioId,
  });

  factory ConversacionMessage.fromMap(Map<String, dynamic> map) {
    return ConversacionMessage(
      id:              map['id'] as int,
      incidenteId:     map['incidente_id'] as int,
      mensaje:         map['mensaje'] as String,
      fechaPublicacion: DateTime.parse(map['fecha_publicacion'] as String).toLocal(),
      usuarioId:       (map['Usuario_ID'] as num?)?.toInt() ?? 0,
    );
  }
}
