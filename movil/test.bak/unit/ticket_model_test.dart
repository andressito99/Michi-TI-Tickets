import 'package:flutter_test/flutter_test.dart';
import 'package:ticket_reporter/data/models/ticket_model.dart';

void main() {
  group('TicketModel', () {
    test('creates a ticket with correct fields', () {
      final ticket = TicketModel(
        id: '0001',
        sentBy: 'Usuario',
        date: DateTime(2026, 6, 4),
        attendedBy: 'Sin atender',
        status: TicketStatus.pending,
        description: 'No jala el sistema',
      );

      expect(ticket.statusLabel, 'Pendiente');
      expect(ticket.response, isNull);
      expect(ticket.imagePath, isNull);
    });

    test('copyWith updates fields correctly', () {
      final ticket = TicketModel(
        id: '0001',
        sentBy: 'Usuario',
        date: DateTime(2026, 6, 4),
        attendedBy: 'Sin atender',
        status: TicketStatus.pending,
        description: 'Falla en la pantalla',
      );

      final updated = ticket.copyWith(
        status: TicketStatus.inProcess,
        attendedBy: 'Miau',
      );

      expect(updated.status, TicketStatus.inProcess);
      expect(updated.attendedBy, 'Miau');
      expect(updated.id, '0001');
    });

    test('statusLabel returns correct string for each status', () {
      expect(TicketModel(
        id: '1', sentBy: '', date: DateTime.now(),
        attendedBy: '', status: TicketStatus.pending, description: '',
      ).statusLabel, 'Pendiente');

      expect(TicketModel(
        id: '2', sentBy: '', date: DateTime.now(),
        attendedBy: '', status: TicketStatus.inProcess, description: '',
      ).statusLabel, 'En proceso');

      expect(TicketModel(
        id: '3', sentBy: '', date: DateTime.now(),
        attendedBy: '', status: TicketStatus.blocked, description: '',
      ).statusLabel, 'Bloqueado');
    });
  });
}
