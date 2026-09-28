import '../models/ticket_model.dart';

class TicketLocalDatasource {
  final List<TicketModel> _tickets = [
    TicketModel(
      id: '0001',
      sentBy: 'Usuario',
      date: DateTime(2026, 6, 4),
      attendedBy: 'Sin atender',
      status: TicketStatus.pending,
      description: 'No jala el sistema',
    ),
    TicketModel(
      id: '0002',
      sentBy: 'Usuario',
      date: DateTime(2026, 6, 4),
      attendedBy: 'Miau',
      status: TicketStatus.inProcess,
      description: 'No jala el sistema',
      response: 'El lunes sin falta',
    ),
    TicketModel(
      id: '0003',
      sentBy: 'Usuario',
      date: DateTime(2026, 6, 4),
      attendedBy: 'Sin atender',
      status: TicketStatus.blocked,
      description: 'Se cayó el servidor',
    ),
  ];

  List<TicketModel> getAll() => List.unmodifiable(_tickets);

  TicketModel? getById(String id) {
    try {
      return _tickets.firstWhere((t) => t.id == id);
    } catch (_) {
      return null;
    }
  }

  void add(TicketModel ticket) => _tickets.add(ticket);

  String generateId() {
    final next = _tickets.length + 1;
    return next.toString().padLeft(4, '0');
  }
}
