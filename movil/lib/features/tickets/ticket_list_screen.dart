import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';
import '../../core/constants/app_strings.dart';
import '../../data/datasources/ticket_list_datasource.dart';
import '../../data/models/ticket_model.dart';
import '../../data/repositories/auth_repository.dart';
import '../../routes/app_router.dart';
import 'widgets/ticket_tile.dart';
import 'widgets/empty_tickets_widget.dart';

class TicketListScreen extends StatefulWidget {
  const TicketListScreen({super.key});

  @override
  State<TicketListScreen> createState() => _TicketListScreenState();
}

class _TicketListScreenState extends State<TicketListScreen> {
  final _datasource = TicketListDatasource();
  final _auth = AuthRepository();
  late Future<List<TicketModel>> _future;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final userId = await _auth.getUserId();
    if (!mounted) return;
    setState(() {
      _future = _datasource.getActiveTickets(userId ?? 0);
    });
  }

  Future<void> _refresh() async {
    final userId = await _auth.getUserId();
    if (!mounted) return;
    setState(() {
      _future = _datasource.getActiveTickets(userId ?? 0);
    });
    await _future;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text(AppStrings.helloUser),
        leading: IconButton(
          icon: const Icon(Icons.home_rounded),
          tooltip: 'Inicio',
          onPressed: () =>
              Navigator.pushNamedAndRemoveUntil(
            context,
            AppRouter.home,
            (r) => r.settings.name == AppRouter.home,
          ),
        ),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(44),
          child: Container(
            width: double.infinity,
            color: AppColors.primary,
            padding: const EdgeInsets.symmetric(vertical: 10),
            child: Text(
              AppStrings.myTickets,
              style: AppTextStyles.subheading.copyWith(color: AppColors.white),
              textAlign: TextAlign.center,
            ),
          ),
        ),
      ),
      body: FutureBuilder<List<TicketModel>>(
        future: _future,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError) {
            debugPrint('=== error listando tickets: ${snapshot.error}');
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Text('Error: ${snapshot.error}',
                    style: AppTextStyles.body,
                    textAlign: TextAlign.center),
              ),
            );
          }
          final tickets = snapshot.data ?? [];
          if (tickets.isEmpty) {
            return RefreshIndicator(
              onRefresh: _refresh,
              child: ListView(
                children: const [
                  SizedBox(height: 80),
                  EmptyTicketsWidget(),
                ],
              ),
            );
          }
          return RefreshIndicator(
            onRefresh: _refresh,
            child: ListView.separated(
              padding: const EdgeInsets.symmetric(vertical: 8),
              itemCount: tickets.length,
              separatorBuilder: (_, _) => const Divider(height: 1),
              itemBuilder: (_, i) => TicketTile(
                ticket: tickets[i],
                onTap: () => Navigator.pushNamed(
                  context,
                  AppRouter.ticketDetail,
                  arguments: tickets[i],
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}
