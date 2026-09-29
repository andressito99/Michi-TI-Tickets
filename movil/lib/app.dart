// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 andressito99 y los colaboradores del proyecto Michi · Soporte TI con siete vidas

import 'package:flutter/material.dart';
import 'core/theme/app_theme.dart';
import 'routes/app_router.dart';

class App extends StatelessWidget {
  final GlobalKey<NavigatorState> navigatorKey;
  
  const App({super.key, required this.navigatorKey});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Michi',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      navigatorKey: navigatorKey,
      onGenerateRoute: AppRouter.generateRoute,
      initialRoute: '/',
    );
  }
}
