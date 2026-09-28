import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';
import '../../data/repositories/auth_repository.dart';
import '../../routes/app_router.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _userController = TextEditingController();
  final _passController = TextEditingController();
  final _repo           = AuthRepository();
  bool _loading         = false;
  bool _obscure         = true;
  String? _error;

  Future<void> _login() async {
    setState(() { _loading = true; _error = null; });

    final ok = await _repo.login(
      _userController.text,
      _passController.text,
    );

    if (!mounted) return;

    if (ok) {
      Navigator.pushReplacementNamed(context, AppRouter.home);
    } else {
      setState(() {
        _error   = 'Usuario o contraseña incorrectos';
        _loading = false;
      });
    }
  }

  @override
  void dispose() {
    _userController.dispose();
    _passController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 28),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 60),
              Center(
                child: Container(
                  width: 72,
                  height: 72,
                  decoration: BoxDecoration(
                    color: AppColors.primary,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: const Icon(
                    Icons.confirmation_number_outlined,
                    color: AppColors.white,
                    size: 36,
                  ),
                ),
              ),
              const SizedBox(height: 28),
              Center(
                child: Text('Bienvenido', style: AppTextStyles.heading),
              ),
              const SizedBox(height: 4),
              Center(
                child: Text(
                  'Inicia sesión para continuar',
                  style: AppTextStyles.bodySecondary,
                ),
              ),
              const SizedBox(height: 48),
              Text('Usuario', style: AppTextStyles.label),
              const SizedBox(height: 6),
              TextField(
                controller: _userController,
                keyboardType: TextInputType.text,
                textInputAction: TextInputAction.next,
                style: AppTextStyles.body,
                decoration: const InputDecoration(
                  hintText: 'Ingresa tu usuario',
                  prefixIcon: Icon(Icons.person_outline_rounded,
                      color: AppColors.textSecondary, size: 20),
                ),
              ),
              const SizedBox(height: 16),
              Text('Contraseña', style: AppTextStyles.label),
              const SizedBox(height: 6),
              TextField(
                controller: _passController,
                obscureText: _obscure,
                textInputAction: TextInputAction.done,
                onSubmitted: (_) => _login(),
                style: AppTextStyles.body,
                decoration: InputDecoration(
                  hintText: 'Ingresa tu contraseña',
                  prefixIcon: const Icon(Icons.lock_outline_rounded,
                      color: AppColors.textSecondary, size: 20),
                  suffixIcon: IconButton(
                    icon: Icon(
                      _obscure
                          ? Icons.visibility_off_outlined
                          : Icons.visibility_outlined,
                      color: AppColors.textSecondary,
                      size: 20,
                    ),
                    onPressed: () => setState(() => _obscure = !_obscure),
                  ),
                ),
              ),
              if (_error != null) ...[
                const SizedBox(height: 10),
                Row(
                  children: [
                    const Icon(Icons.error_outline_rounded,
                        color: AppColors.statusBlocked, size: 16),
                    const SizedBox(width: 6),
                    Text(
                      _error!,
                      style: AppTextStyles.label.copyWith(
                          color: AppColors.statusBlocked),
                    ),
                  ],
                ),
              ],
              const SizedBox(height: 32),
              SizedBox(
                width: double.infinity,
                height: 52,
                child: ElevatedButton(
                  onPressed: _loading ? null : _login,
                  child: _loading
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(
                            color: AppColors.white,
                            strokeWidth: 2,
                          ),
                        )
                      : const Text('Iniciar sesión'),
                ),
              ),
              const SizedBox(height: 20),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text('¿No tienes cuenta? ', style: AppTextStyles.bodySecondary),
                  GestureDetector(
                    onTap: () => Navigator.pushNamed(context, AppRouter.register),
                    child: Text(
                      'Regístrate',
                      style: AppTextStyles.body.copyWith(
                        color: AppColors.primary,
                        fontWeight: FontWeight.w600,
                        decoration: TextDecoration.underline,
                        decorationColor: AppColors.primary,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 32),
            ],
          ),
        ),
      ),
    );
  }
}
