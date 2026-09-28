import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../data/repositories/auth_repository.dart';
import '../../routes/app_router.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  @override
  void initState() {
    super.initState();
    _checkSession();
  }

  Future<void> _checkSession() async {
    await Future.delayed(const Duration(milliseconds: 1200));

    if (!mounted) return;

    final isLogged = await AuthRepository().isLoggedIn();
    if (!mounted) return;

    Navigator.pushReplacementNamed(
      context,
      isLogged ? AppRouter.home : AppRouter.login,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.primary,
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                color: AppColors.white.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(22),
              ),
              child: const Icon(
                Icons.confirmation_number_outlined,
                color: AppColors.white,
                size: 40,
              ),
            ),
            const SizedBox(height: 20),
            const CircularProgressIndicator(
              color: AppColors.white,
              strokeWidth: 2,
            ),
          ],
        ),
      ),
    );
  }
}
