import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';
import '../../core/constants/app_strings.dart';
import '../../core/utils/date_formatter.dart';
import '../../data/datasources/conversacion_datasource.dart';
import '../../data/models/conversacion_message.dart';
import '../../data/models/ticket_model.dart';
import 'widgets/ticket_info_card.dart';

class TicketDetailScreen extends StatelessWidget {
  final TicketModel ticket;

  const TicketDetailScreen({super.key, required this.ticket});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text(AppStrings.helloUser),
        leading: const BackButton(),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(44),
          child: Container(
            width: double.infinity,
            color: AppColors.primary,
            padding: const EdgeInsets.symmetric(vertical: 10),
            child: Text(
              AppStrings.ticketInfo,
              style: AppTextStyles.subheading.copyWith(color: AppColors.white),
              textAlign: TextAlign.center,
            ),
          ),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            TicketInfoCard(ticket: ticket),
            const SizedBox(height: 16),
            Text(AppStrings.faultDesc, style: AppTextStyles.subheading),
            const SizedBox(height: 8),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: AppColors.inputFill,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(ticket.description, style: AppTextStyles.body),
            ),
            const SizedBox(height: 24),
            Text(AppStrings.conversacion, style: AppTextStyles.subheading),
            const SizedBox(height: 8),
            _ConversacionView(ticketId: ticket.id),
          ],
        ),
      ),
    );
  }
}

class _ConversacionView extends StatefulWidget {
  final int ticketId;
  const _ConversacionView({required this.ticketId});

  @override
  State<_ConversacionView> createState() => _ConversacionViewState();
}

class _ConversacionViewState extends State<_ConversacionView> {
  final _datasource = ConversacionDatasource();
  late Future<List<ConversacionMessage>> _future;

  @override
  void initState() {
    super.initState();
    _future = _datasource.getConversacion(widget.ticketId);
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<List<ConversacionMessage>>(
      future: _future,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(child: CircularProgressIndicator());
        }
        final msgs = snapshot.data ?? [];
        if (msgs.isEmpty) {
          return Container(
            width: double.infinity,
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: AppColors.inputFill,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Text(AppStrings.waitingTech,
                style: AppTextStyles.body.copyWith(
                  color: AppColors.textSecondary,
                )),
          );
        }
        return Column(
          children: msgs.map((m) => _MessageBubble(message: m)).toList(),
        );
      },
    );
  }
}

class _MessageBubble extends StatelessWidget {
  final ConversacionMessage message;
  const _MessageBubble({required this.message});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.accent.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.accent.withValues(alpha: 0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(message.mensaje, style: AppTextStyles.body),
          const SizedBox(height: 6),
          Text(
            DateFormatter.formatWithTime(message.fechaPublicacion),
            style: AppTextStyles.caption.copyWith(
              color: AppColors.textSecondary,
            ),
          ),
        ],
      ),
    );
  }
}
