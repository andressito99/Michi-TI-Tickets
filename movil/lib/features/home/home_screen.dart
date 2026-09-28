import 'package:flutter/material.dart';
import '../../core/theme/app_text_styles.dart';
import '../../core/constants/app_strings.dart';
import '../../data/repositories/auth_repository.dart';
import '../../routes/app_router.dart';
import 'widgets/action_button.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  String _username = 'Usuario';
  final _auth = AuthRepository();

  @override
  void initState() {
    super.initState();
    _loadUser();
  }

  Future<void> _loadUser() async {
    final name = await _auth.getUsername();
    if (name != null && mounted) {
      setState(() => _username = name);
    }
  }

  Future<void> _logout() async {
    await _auth.logout();
    if (!mounted) return;
    Navigator.pushReplacementNamed(context, AppRouter.login);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Hola, $_username'),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout_rounded, size: 20),
            tooltip: 'Cerrar sesión',
            onPressed: _logout,
          ),
        ],
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Column(
            children: [
              const Spacer(),
              Image.asset('assets/images/cat_working.png', height: 200),
              const SizedBox(height: 24),
              Text(
                AppStrings.appInDev,
                style: AppTextStyles.heading,
                textAlign: TextAlign.center,
              ),
              const Spacer(),
              ActionButton(
                label: AppStrings.reportFault,
                onTap: () => Navigator.pushNamed(context, AppRouter.report),
              ),
              const SizedBox(height: 12),
              ActionButton(
                label: AppStrings.ticketList,
                onTap: () => Navigator.pushNamed(context, AppRouter.tickets),
                outlined: true,
              ),
              const SizedBox(height: 32),
            ],
          ),
        ),
      ),
    );
  }
}
