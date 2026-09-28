String timeAgo(DateTime date) {
  final now = DateTime.now();
  final diff = now.difference(date);
  if (diff.inDays >= 365) {
    final years = (diff.inDays / 365).floor();
    return 'Hace $years año${years == 1 ? '' : 's'}';
  }
  if (diff.inDays >= 30) {
    final months = (diff.inDays / 30).floor();
    return 'Hace $months mes${months == 1 ? '' : 'es'}';
  }
  if (diff.inDays >= 7) {
    final weeks = (diff.inDays / 7).floor();
    return 'Hace $weeks semana${weeks == 1 ? '' : 's'}';
  }
  if (diff.inDays >= 1) {
    return 'Hace ${diff.inDays} día${diff.inDays == 1 ? '' : 's'}';
  }
  if (diff.inHours >= 1) {
    return 'Hace ${diff.inHours} hora${diff.inHours == 1 ? '' : 's'}';
  }
  if (diff.inMinutes >= 1) {
    return 'Hace ${diff.inMinutes} min';
  }
  return 'Hace un momento';
}
