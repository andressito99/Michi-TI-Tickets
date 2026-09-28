import 'package:flutter/material.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/constants/app_strings.dart';
import '../../../core/utils/date_formatter.dart';
import '../../../data/models/ticket_model.dart';

class TicketInfoCard extends StatelessWidget {
  final TicketModel ticket;

  const TicketInfoCard({super.key, required this.ticket});

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Ticket #${ticket.id.toString().padLeft(4, '0')}',
                style: AppTextStyles.heading),
            const SizedBox(height: 12),
            _Row(AppStrings.date,        DateFormatter.format(ticket.date)),
            _Row(AppStrings.departamento, ticket.departamento),
            _Row(AppStrings.status,      ticket.statusLabel),
            if (ticket.categoria != null && ticket.categoria!.isNotEmpty)
              _Row('Categoría', ticket.categoria!),
            if (ticket.prioridad != null && ticket.prioridad!.isNotEmpty)
              _Row('Prioridad', ticket.prioridad!),
            if (ticket.agente != null && ticket.agente! > 0)
              _Row('Agente', 'ID: ${ticket.agente}'),
          ],
        ),
      ),
    );
  }
}

class _Row extends StatelessWidget {
  final String label;
  final String value;

  const _Row(this.label, this.value);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(
        children: [
          Text('$label: ', style: AppTextStyles.label),
          Expanded(child: Text(value, style: AppTextStyles.body)),
        ],
      ),
    );
  }
}
