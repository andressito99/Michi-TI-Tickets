// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 andressito99 y los colaboradores del proyecto Michi · Soporte TI con siete vidas

import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';
import '../../core/constants/app_strings.dart';
import '../../data/datasources/incidente_datasource.dart';
import '../../data/datasources/otro_incidente_datasource.dart';
import '../../data/datasources/ticket_remote_datasource.dart';
import '../../data/repositories/auth_repository.dart';
import '../../routes/app_router.dart';
import 'widgets/category_grid.dart';
import 'widgets/description_field.dart';

const _otrosSentinel = '__otros__';

class ReportScreen extends StatefulWidget {
  const ReportScreen({super.key});

  @override
  State<ReportScreen> createState() => _ReportScreenState();
}

class _ReportScreenState extends State<ReportScreen> {
  int? _selectedCategory;
  final _descController           = TextEditingController();
  final _otherCategoryController  = TextEditingController();
  final _otherIncidenteController = TextEditingController();
  final _auth = AuthRepository();
  final _incidenteDatasource = IncidenteDatasource();
  final _ticketDatasource = TicketRemoteDatasource();
  final _otroDatasource = OtroIncidenteDatasource();
  List<String> _categorias = [];
  bool _loadingCategorias = true;
  List<IncidenteItem> _incidentes = [];
  Object? _selectedIncidenteValue;
  IncidenteItem? _selectedIncidente;
  bool _loadingIncidentes = false;

  bool get _isOtherCategory =>
      _selectedCategory != null && _selectedCategory == _categorias.length;

  bool get _isOtherIncidente =>
      _selectedIncidenteValue == _otrosSentinel;

  @override
  void initState() {
    super.initState();
    _loadCategorias();
  }

  Future<void> _loadCategorias() async {
    try {
      final cats = await _incidenteDatasource.getCategorias();
      if (!mounted) return;
      setState(() {
        _categorias = cats;
        _loadingCategorias = false;
      });
    } catch (e) {
      print('=== error cargando categorias: $e');
      if (!mounted) return;
      setState(() => _loadingCategorias = false);
    }
  }

  Future<void> _loadIncidentes(String categoria) async {
    setState(() {
      _loadingIncidentes = true;
      _selectedIncidenteValue = null;
      _selectedIncidente = null;
    });
    try {
      final items = await _incidenteDatasource.getIncidentesPorCategoria(categoria);
      if (!mounted) return;
      setState(() {
        _incidentes = items;
        _loadingIncidentes = false;
      });
    } catch (e) {
      print('=== error cargando incidentes: $e');
      if (!mounted) return;
      setState(() {
        _incidentes = [];
        _loadingIncidentes = false;
      });
    }
  }

  void _onCategorySelected(int index) {
    setState(() {
      _selectedCategory = index;
      _incidentes = [];
      _selectedIncidenteValue = null;
      _selectedIncidente = null;
      _otherCategoryController.clear();
      _otherIncidenteController.clear();
    });
    if (!_isOtherCategory) {
      _loadIncidentes(_categorias[index]);
    }
  }

  void _onIncidenteChanged(Object? value) {
    setState(() {
      _selectedIncidenteValue = value;
      _otherIncidenteController.clear();
      if (value is IncidenteItem) {
        _selectedIncidente = value;
      } else {
        _selectedIncidente = null;
      }
    });
  }

  Future<void> _submit() async {
    if (_descController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Por favor describe el problema')),
      );
      return;
    }
    if (!_isOtherCategory && _selectedIncidenteValue == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Selecciona un incidente')),
      );
      return;
    }
    if (_isOtherCategory && _otherCategoryController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Especifica la categoría')),
      );
      return;
    }
    if (!_isOtherCategory &&
        _isOtherIncidente &&
        _otherIncidenteController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Especifica el incidente')),
      );
      return;
    }

    final userId = await _auth.getUserId();
    final dept = await _auth.getDepartamento();

    if (userId == null) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Sesión inválida, vuelve a iniciar sesión')),
      );
      return;
    }

    try {
      final isOther = _isOtherCategory || _isOtherIncidente;

      if (isOther) {
        final categoria = _isOtherCategory
            ? _otherCategoryController.text.trim()
            : _categorias[_selectedCategory!];
        await _otroDatasource.insert(
          userId:       userId,
          departamento: dept ?? '',
          status:       'Pendiente',
          categoria:    categoria,
          descripcion:  _descController.text.trim(),
          prioridad:    'Pendiente',
          agente:       9,
        );
      } else {
        print('=== _submit incidente: id=${_selectedIncidente!.id} prioridad=${_selectedIncidente!.prioridad} agente=${_selectedIncidente!.agenteId}');
        await _ticketDatasource.insert(
          userId:       userId,
          incidenteId:  _selectedIncidente!.id,
          departamento: dept ?? '',
          descripcion:  _descController.text.trim(),
          agente:       _selectedIncidente!.agenteId ?? 9,
          prioridad:    _selectedIncidente!.prioridad ?? 'Baja',
        );
      }

      if (!mounted) return;
      Navigator.pushNamedAndRemoveUntil(
        context, AppRouter.confirmation, (r) => r.settings.name == AppRouter.home,
      );
    } catch (e, s) {
      print('=== error enviando ticket: $e');
      print('=== stack: $s');
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e')),
      );
    }
  }

  @override
  void dispose() {
    _descController.dispose();
    _otherCategoryController.dispose();
    _otherIncidenteController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text(AppStrings.helloUser),
        leading: const BackButton(),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(AppStrings.whatsWrong, style: AppTextStyles.heading),
              const SizedBox(height: 20),
              if (_loadingCategorias)
                const Center(child: CircularProgressIndicator())
              else
                CategoryGrid(
                  selected: _selectedCategory,
                  onSelect: _onCategorySelected,
                  categories: _categorias,
                ),
              if (_isOtherCategory) ...[
                const SizedBox(height: 20),
                Text('Especifica la categoría', style: AppTextStyles.subheading),
                const SizedBox(height: 8),
                TextField(
                  controller: _otherCategoryController,
                  maxLines: 2,
                  style: AppTextStyles.body,
                  decoration: const InputDecoration(
                    hintText: 'Describe brevemente el problema...',
                  ),
                ),
              ] else if (_selectedCategory != null) ...[
                const SizedBox(height: 20),
                Text('Tipo de incidente', style: AppTextStyles.subheading),
                const SizedBox(height: 8),
                if (_loadingIncidentes)
                  const Center(child: CircularProgressIndicator())
                else
                  _IncidenteDropdown(
                    incidentes: _incidentes,
                    selectedValue: _selectedIncidenteValue,
                    onChanged: _onIncidenteChanged,
                  ),
                if (_isOtherIncidente) ...[
                  const SizedBox(height: 16),
                  Text('Especifica el incidente', style: AppTextStyles.subheading),
                  const SizedBox(height: 8),
                  TextField(
                    controller: _otherIncidenteController,
                    maxLines: 2,
                    style: AppTextStyles.body,
                    decoration: const InputDecoration(
                      hintText: 'Describe el incidente...',
                    ),
                  ),
                ],
              ],
              const SizedBox(height: 24),
              Text(AppStrings.description, style: AppTextStyles.subheading),
              const SizedBox(height: 8),
              DescriptionField(controller: _descController),
              const SizedBox(height: 32),
              ElevatedButton(
                onPressed: _submit,
                child: const Text(AppStrings.sendReport),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _IncidenteDropdown extends StatelessWidget {
  final List<IncidenteItem> incidentes;
  final Object? selectedValue;
  final ValueChanged<Object?> onChanged;

  const _IncidenteDropdown({
    required this.incidentes,
    required this.selectedValue,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14),
      decoration: BoxDecoration(
        color: AppColors.inputFill,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<Object>(
          isExpanded: true,
          value: selectedValue,
          hint: Text('Selecciona un incidente',
              style: AppTextStyles.body.copyWith(color: AppColors.textSecondary)),
          items: [
            ...incidentes.map((item) => DropdownMenuItem(
              value: item as Object,
              child: Text(item.incidente, style: AppTextStyles.body),
            )),
            DropdownMenuItem(
              value: _otrosSentinel,
              child: Text('Otros', style: AppTextStyles.body),
            ),
          ],
          onChanged: onChanged,
        ),
      ),
    );
  }
}
