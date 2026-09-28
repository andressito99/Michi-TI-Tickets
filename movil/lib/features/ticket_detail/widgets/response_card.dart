import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/constants/app_strings.dart';

class ResponseCard extends StatelessWidget {
  final String? response;

  const ResponseCard({super.key, this.response});

  @override
  Widget build(BuildContext context) {
    if (response != null) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(AppStrings.response, style: AppTextStyles.subheading),
          const SizedBox(height: 8),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: AppColors.inputFill,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Text(response!, style: AppTextStyles.body),
          ),
        ],
      );
    }

    return Column(
      children: [
        const SizedBox(height: 12),
        Text(
          AppStrings.waitingTech,
          style: AppTextStyles.bodySecondary,
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 16),
        Image.asset('assets/images/cat_waiting.png', height: 160),
      ],
    );
  }
}
