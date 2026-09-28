import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';
import '../../data/repositories/auth_repository.dart';
import '../../routes/app_router.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _userController    = TextEditingController();
  final _emailController   = TextEditingController();
  final _deptController    = TextEditingController();
  final _passController    = TextEditingController();
  final _confirmController = TextEditingController();
  final _repo              = AuthRepository();

  bool    _loading     = false;
  bool    _obscurePass = true;
  bool    _obscureConf = true;
  String? _error;
  String? _userError;
  String? _emailError;
  String? _deptError;
  String? _passError;
  String? _confirmError;

  void _validateUsername(String v) => setState(() {
    _userError = v.isEmpty        ? null
               : v.length < 3    ? 'Mínimo 3 caracteres'
               : null;
  });

  void _validateEmail(String v) => setState(() {
    if (v.isEmpty) {
      _emailError = null;
      return;
    }
    final valid = RegExp(r'^[\w.+-]+@empresa\.com$').hasMatch(v.toLowerCase().trim());
    _emailError = valid ? null : 'Debe ser un correo @empresa.com';
  });

  void _validateDept(String v) => setState(() {
    _deptError = v.isEmpty     ? null
               : v.length < 2 ? 'Mínimo 2 caracteres'
               : null;
  });

  void _validatePassword(String v) {
    setState(() {
      _passError = v.isEmpty     ? null
                 : v.length < 4  ? 'Mínimo 4 caracteres'
                 : null;
      if (_confirmController.text.isNotEmpty) _validateConfirm(_confirmController.text);
    });
  }

  void _validateConfirm(String v) => setState(() {
    _confirmError = v.isEmpty                        ? null
                  : v != _passController.text        ? 'Las contraseñas no coinciden'
                  : null;
  });

  bool get _formValid =>
      _userController.text.length >= 3 &&
      _emailController.text.isNotEmpty &&
      _deptController.text.length >= 2 &&
      _passController.text.length >= 4 &&
      _confirmController.text == _passController.text &&
      _userError == null &&
      _emailError == null &&
      _deptError == null &&
      _passError == null &&
      _confirmError == null;

  Future<void> _register() async {
    setState(() { _loading = true; _error = null; });

    final result = await _repo.register(
      usuario:      _userController.text,
      contrasena:   _passController.text,
      correo:       _emailController.text,
      departamento: _deptController.text,
    );

    if (!mounted) return;

    if (result == RegisterResult.success) {
      await _repo.login(_userController.text, _passController.text);
      if (!mounted) return;
      _showSuccess();
    } else {
      setState(() {
        _error   = result.message;
        _loading = false;
      });
    }
  }

  void _showSuccess() {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(children: [
          const Icon(Icons.check_circle_outline_rounded,
              color: AppColors.white, size: 18),
          const SizedBox(width: 8),
          Text('¡Cuenta creada exitosamente!',
              style: AppTextStyles.body.copyWith(color: AppColors.white)),
        ]),
        backgroundColor: AppColors.statusProcess,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        margin: const EdgeInsets.all(16),
      ),
    );
    Navigator.pushReplacementNamed(context, AppRouter.home);
  }

  @override
  void dispose() {
    _userController.dispose();
    _emailController.dispose();
    _deptController.dispose();
    _passController.dispose();
    _confirmController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        leading: const BackButton(),
        title: const Text('Crear cuenta'),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 28),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 28),
              Center(
                child: Container(
                  width: 64, height: 64,
                  decoration: BoxDecoration(
                    color: AppColors.inputFill,
                    borderRadius: BorderRadius.circular(18),
                  ),
                  child: const Icon(Icons.person_add_alt_1_outlined,
                      color: AppColors.primary, size: 32),
                ),
              ),
              const SizedBox(height: 16),
              Center(child: Text('Nueva cuenta', style: AppTextStyles.heading)),
              Center(
                child: Text('Solo correos @empresa.com',
                    style: AppTextStyles.bodySecondary),
              ),
              const SizedBox(height: 36),
              _Label('Usuario'),
              const SizedBox(height: 6),
              _Field(
                controller:  _userController,
                hint:        'Elige un nombre de usuario',
                icon:        Icons.person_outline_rounded,
                action:      TextInputAction.next,
                onChanged:   _validateUsername,
                errorText:   _userError,
              ),
              const SizedBox(height: 16),
              _Label('Correo corporativo'),
              const SizedBox(height: 6),
              _Field(
                controller:   _emailController,
                hint:         'nombre@empresa.com',
                icon:         Icons.email_outlined,
                action:       TextInputAction.next,
                keyboard:     TextInputType.emailAddress,
                onChanged:    _validateEmail,
                errorText:    _emailError,
                suffix: _emailError == null &&
                        _emailController.text.isNotEmpty
                    ? const Icon(Icons.check_circle_outline_rounded,
                        color: AppColors.statusProcess, size: 18)
                    : null,
              ),
              const SizedBox(height: 16),
              _Label('Departamento'),
              const SizedBox(height: 6),
              _Field(
                controller:  _deptController,
                hint:        'Ej: Sistemas, Soporte, RH...',
                icon:        Icons.business_outlined,
                action:      TextInputAction.next,
                onChanged:   _validateDept,
                errorText:   _deptError,
              ),
              const SizedBox(height: 16),
              _Label('Contraseña'),
              const SizedBox(height: 6),
              _Field(
                controller: _passController,
                hint:       'Mínimo 4 caracteres',
                icon:       Icons.lock_outline_rounded,
                action:     TextInputAction.next,
                obscure:    _obscurePass,
                onChanged:  _validatePassword,
                errorText:  _passError,
                suffix: IconButton(
                  icon: Icon(
                    _obscurePass
                        ? Icons.visibility_off_outlined
                        : Icons.visibility_outlined,
                    color: AppColors.textSecondary, size: 20,
                  ),
                  onPressed: () => setState(() => _obscurePass = !_obscurePass),
                ),
              ),
              const SizedBox(height: 16),
              _Label('Confirmar contraseña'),
              const SizedBox(height: 6),
              _Field(
                controller: _confirmController,
                hint:       'Repite tu contraseña',
                icon:       Icons.lock_outline_rounded,
                action:     TextInputAction.done,
                obscure:    _obscureConf,
                onChanged:  _validateConfirm,
                onSubmitted: (_) => _formValid ? _register() : null,
                errorText:  _confirmError,
                suffix: _confirmController.text.isNotEmpty && _confirmError == null
                    ? const Icon(Icons.check_circle_outline_rounded,
                        color: AppColors.statusProcess, size: 18)
                    : IconButton(
                        icon: Icon(
                          _obscureConf
                              ? Icons.visibility_off_outlined
                              : Icons.visibility_outlined,
                          color: AppColors.textSecondary, size: 20,
                        ),
                        onPressed: () =>
                            setState(() => _obscureConf = !_obscureConf),
                      ),
              ),
              if (_error != null) ...[
                const SizedBox(height: 14),
                _ErrorBanner(message: _error!),
              ],
              const SizedBox(height: 28),
              Container(
                padding: const EdgeInsets.symmetric(
                    horizontal: 16, vertical: 12),
                decoration: BoxDecoration(
                  color: AppColors.inputFill,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(children: [
                  const Icon(Icons.badge_outlined,
                      color: AppColors.textSecondary, size: 18),
                  const SizedBox(width: 10),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Rol asignado', style: AppTextStyles.label),
                      Text('Usuario', style: AppTextStyles.body),
                    ],
                  ),
                  const Spacer(),
                  Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: AppColors.accent.withValues(alpha: 0.3),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text('Por defecto',
                        style: AppTextStyles.caption),
                  ),
                ]),
              ),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                height: 52,
                child: ElevatedButton(
                  onPressed: (_loading || !_formValid) ? null : _register,
                  style: ElevatedButton.styleFrom(
                    disabledBackgroundColor:
                        AppColors.primary.withValues(alpha: 0.3),
                  ),
                  child: _loading
                      ? const SizedBox(
                          width: 20, height: 20,
                          child: CircularProgressIndicator(
                              color: AppColors.white, strokeWidth: 2),
                        )
                      : const Text('Crear cuenta'),
                ),
              ),
              const SizedBox(height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text('¿Ya tienes cuenta? ',
                      style: AppTextStyles.bodySecondary),
                  GestureDetector(
                    onTap: () => Navigator.pop(context),
                    child: Text(
                      'Inicia sesión',
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
              const SizedBox(height: 36),
            ],
          ),
        ),
      ),
    );
  }
}

class _Label extends StatelessWidget {
  final String text;
  const _Label(this.text);

  @override
  Widget build(BuildContext context) =>
      Text(text, style: AppTextStyles.label);
}

class _Field extends StatelessWidget {
  final TextEditingController controller;
  final String hint;
  final IconData icon;
  final TextInputAction action;
  final TextInputType keyboard;
  final bool obscure;
  final ValueChanged<String>? onChanged;
  final ValueChanged<String>? onSubmitted;
  final String? errorText;
  final Widget? suffix;

  const _Field({
    required this.controller,
    required this.hint,
    required this.icon,
    this.action       = TextInputAction.next,
    this.keyboard     = TextInputType.text,
    this.obscure      = false,
    this.onChanged,
    this.onSubmitted,
    this.errorText,
    this.suffix,
  });

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller:       controller,
      obscureText:      obscure,
      textInputAction:  action,
      keyboardType:     keyboard,
      onChanged:        onChanged,
      onSubmitted:      onSubmitted,
      style:            AppTextStyles.body,
      decoration: InputDecoration(
        hintText: hint,
        prefixIcon: Icon(icon, color: AppColors.textSecondary, size: 20),
        suffixIcon: suffix,
        errorText: errorText,
        errorStyle: AppTextStyles.caption
            .copyWith(color: AppColors.statusBlocked),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide:
              const BorderSide(color: AppColors.statusBlocked, width: 1.5),
        ),
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide:
              const BorderSide(color: AppColors.statusBlocked, width: 1.5),
        ),
      ),
    );
  }
}

class _ErrorBanner extends StatelessWidget {
  final String message;
  const _ErrorBanner({required this.message});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.statusBlocked.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(
            color: AppColors.statusBlocked.withValues(alpha: 0.3)),
      ),
      child: Row(children: [
        const Icon(Icons.error_outline_rounded,
            color: AppColors.statusBlocked, size: 16),
        const SizedBox(width: 8),
        Expanded(
          child: Text(message,
              style: AppTextStyles.label
                  .copyWith(color: AppColors.statusBlocked)),
        ),
      ]),
    );
  }
}
