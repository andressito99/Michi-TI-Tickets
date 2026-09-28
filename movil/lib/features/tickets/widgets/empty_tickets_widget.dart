import 'package:flutter/material.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/constants/app_strings.dart';

class EmptyTicketsWidget extends StatelessWidget {
  const EmptyTicketsWidget({super.key});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Image.asset('assets/images/cat_no_tickets.png', height: 160),
          const SizedBox(height: 20),
          Text(AppStrings.noTickets,
              style: AppTextStyles.subheading),
        ],
      ),
    );
  }
}
