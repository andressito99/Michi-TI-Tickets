import 'package:flutter/material.dart';
import '../../core/theme/app_text_styles.dart';
import '../../core/constants/app_strings.dart';
import '../../routes/app_router.dart';

class ConfirmationScreen extends StatelessWidget {
  const ConfirmationScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text(AppStrings.helloUser)),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Column(
            children: [
              const Spacer(),
              Image.asset('assets/images/cat_working.png', height: 180),
              const SizedBox(height: 28),
              Text(AppStrings.reportSent,
                  style: AppTextStyles.heading, textAlign: TextAlign.center),
              const SizedBox(height: 8),
              Text(AppStrings.techWorking,
                  style: AppTextStyles.bodySecondary, textAlign: TextAlign.center),
              const Spacer(),
              ElevatedButton(
                onPressed: () =>
                    Navigator.pushNamedAndRemoveUntil(
                      context, AppRouter.tickets, (r) => r.settings.name == AppRouter.home),
                child: const Text(AppStrings.viewTickets),
              ),
              const SizedBox(height: 32),
            ],
          ),
        ),
      ),
    );
  }
}
