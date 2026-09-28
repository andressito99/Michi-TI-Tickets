import 'package:flutter/material.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/constants/app_strings.dart';

class DescriptionField extends StatelessWidget {
  final TextEditingController controller;

  const DescriptionField({
    super.key,
    required this.controller,
  });

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: controller,
      maxLines: 5,
      style: AppTextStyles.body,
      decoration: const InputDecoration(
        hintText: AppStrings.descHint,
      ),
    );
  }
}
