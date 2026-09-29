// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 andressito99 y los colaboradores del proyecto Michi · Soporte TI con siete vidas

import 'package:intl/intl.dart';

class DateFormatter {
  DateFormatter._();

  static String format(DateTime date) {
    return DateFormat('dd/MM/yy').format(date);
  }

  static String formatFull(DateTime date) {
    return DateFormat('dd MMMM yyyy', 'es').format(date);
  }

  static String formatWithTime(DateTime date) {
    return DateFormat('dd/MM/yy HH:mm').format(date);
  }
}
