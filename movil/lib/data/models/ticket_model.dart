enum TicketSource { tickets, otrosIncidentes }

class TicketModel {
  final int id;
  final int userId;
  final String departamento;
  final String description;
  final String status;
  final DateTime date;
  final int? incidenteId;
  final String? categoria;
  final String? prioridad;
  final int? agente;
  final String? tiempo;
  final String? lastComment;
  final DateTime? lastCommentDate;
  final TicketSource source;

  const TicketModel({
    required this.id,
    required this.userId,
    required this.departamento,
    required this.description,
    required this.status,
    required this.date,
    required this.source,
    this.incidenteId,
    this.categoria,
    this.prioridad,
    this.agente,
    this.tiempo,
    this.lastComment,
    this.lastCommentDate,
  });

  String get statusLabel {
    switch (status) {
      case 'pending':  return 'Pendiente';
      case 'resolved': return 'Resuelto';
      case 'closed':   return 'Cerrado';
      default:         return status;
    }
  }
}
