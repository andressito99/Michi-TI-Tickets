import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:ticket_reporter/data/models/ticket_model.dart';
import 'package:ticket_reporter/features/tickets/widgets/ticket_tile.dart';

void main() {
  group('TicketTile', () {
    testWidgets('displays ticket id and status', (tester) async {
      final ticket = TicketModel(
        id: '0001',
        sentBy: 'Usuario',
        date: DateTime(2026, 6, 4),
        attendedBy: 'Sin atender',
        status: TicketStatus.pending,
        description: 'No jala el sistema',
      );

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: TicketTile(ticket: ticket, onTap: () {}),
          ),
        ),
      );

      expect(find.text('Ticket 0001'), findsOneWidget);
      expect(find.text('Estado: Pendiente'), findsOneWidget);
    });
  });
}
