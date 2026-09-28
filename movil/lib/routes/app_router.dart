import 'package:flutter/material.dart';
import '../features/auth/splash_screen.dart';
import '../features/auth/login_screen.dart';
import '../features/auth/register_screen.dart';
import '../features/home/home_screen.dart';
import '../features/report/report_screen.dart';
import '../features/confirmation/confirmation_screen.dart';
import '../features/tickets/ticket_list_screen.dart';
import '../features/ticket_detail/ticket_detail_screen.dart';
import '../data/models/ticket_model.dart';

class AppRouter {
  static const String splash       = '/';
  static const String login        = '/login';
  static const String register     = '/register';
  static const String home         = '/home';
  static const String report       = '/report';
  static const String confirmation = '/confirmation';
  static const String tickets      = '/tickets';
  static const String ticketDetail = '/ticket-detail';

  static Route<dynamic> generateRoute(RouteSettings settings) {
    switch (settings.name) {
      case splash:
        return _fade(const SplashScreen());
      case login:
        return _fade(const LoginScreen());
      case register:
        return _slide(const RegisterScreen());
      case home:
        return _fade(const HomeScreen());
      case report:
        return _slide(const ReportScreen());
      case confirmation:
        return _fade(const ConfirmationScreen());
      case tickets:
        return _slide(const TicketListScreen());
      case ticketDetail:
        final ticket = settings.arguments as TicketModel;
        return _slide(TicketDetailScreen(ticket: ticket));
      default:
        return _fade(const SplashScreen());
    }
  }

  static PageRoute _fade(Widget page) => PageRouteBuilder(
    pageBuilder: (_, _, _) => page,
    transitionsBuilder: (_, animation, _, child) =>
        FadeTransition(opacity: animation, child: child),
    transitionDuration: const Duration(milliseconds: 250),
  );

  static PageRoute _slide(Widget page) => PageRouteBuilder(
    pageBuilder: (_, _, _) => page,
    transitionsBuilder: (_, animation, _, child) {
      final tween = Tween(begin: const Offset(1, 0), end: Offset.zero)
          .chain(CurveTween(curve: Curves.easeOutCubic));
      return SlideTransition(position: animation.drive(tween), child: child);
    },
    transitionDuration: const Duration(milliseconds: 300),
  );
}
