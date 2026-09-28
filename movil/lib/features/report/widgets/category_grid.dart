import 'package:flutter/material.dart';
import '../../../core/constants/app_strings.dart';
import 'category_card.dart';

IconData _iconForCategory(String label) {
  final l = label.toLowerCase();
  if (l.contains('pantalla') || l.contains('monitor') || l.contains('display')) return Icons.monitor_outlined;
  if (l.contains('teclado') || l.contains('keyboard')) return Icons.keyboard_outlined;
  if (l.contains('mouse') || l.contains('ratón') || l.contains('raton')) return Icons.mouse_outlined;
  if (l.contains('red') || l.contains('internet') || l.contains('wifi') || l.contains('router')) return Icons.wifi_outlined;
  if (l.contains('energía') || l.contains('energia') || l.contains('electricidad') || l.contains('poder') || l.contains('power') || l.contains('batería') || l.contains('bateria')) return Icons.power_settings_new_outlined;
  if (l.contains('impresora') || l.contains('print') || l.contains('scanner') || l.contains('escaner')) return Icons.print_outlined;
  if (l.contains('software') || l.contains('programa') || l.contains('app') || l.contains('aplicacion') || l.contains('aplicación') || l.contains('sistema') || l.contains('código') || l.contains('codigo')) return Icons.code_outlined;
  if (l.contains('audio') || l.contains('sonido') || l.contains('parlante') || l.contains('altavoz') || l.contains('audífono') || l.contains('audifono') || l.contains('microfono') || l.contains('micrófono')) return Icons.volume_up_outlined;
  if (l.contains('video') || l.contains('cámara') || l.contains('camara') || l.contains('film') || l.contains('proyector')) return Icons.videocam_outlined;
  if (l.contains('usb') || l.contains('puerto')) return Icons.usb_outlined;
  if (l.contains('cable') || l.contains('hdmi') || l.contains('vga') || l.contains('conector')) return Icons.cable_outlined;
  if (l.contains('disco') || l.contains('almacenamiento') || l.contains('storage') || l.contains('ssd') || l.contains('hdd') || l.contains('nas')) return Icons.storage_outlined;
  if (l.contains('memoria') || l.contains('ram')) return Icons.memory_outlined;
  if (l.contains('celular') || l.contains('teléfono') || l.contains('telefono') || l.contains('móvil') || l.contains('movil') || l.contains('smartphone')) return Icons.phone_iphone_outlined;
  if (l.contains('portátil') || l.contains('portatil') || l.contains('laptop') || l.contains('notebook') || l.contains('chromebook')) return Icons.laptop_chromebook_outlined;
  if (l.contains('seguridad') || l.contains('antivirus') || l.contains('firewall') || l.contains('virus')) return Icons.security_outlined;
  if (l.contains('nube') || l.contains('cloud') || l.contains('correo') || l.contains('email')) return Icons.cloud_outlined;
  if (l.contains('batería') || l.contains('bateria') || l.contains('cargador') || l.contains('carga')) return Icons.battery_charging_full_outlined;
  if (l.contains('luz') || l.contains('foco') || l.contains('led')) return Icons.lightbulb_outline;
  if (l.contains('aire') || l.contains('clima') || l.contains('ventilador') || l.contains('ac') || l.contains('cooling')) return Icons.ac_unit_outlined;
  if (l.contains('auricular') || l.contains('headset') || l.contains('casco')) return Icons.headphones_outlined;
  if (l.contains('tablet') || l.contains('ipad')) return Icons.tablet_mac_outlined;
  if (l.contains('servidor') || l.contains('server') || l.contains('rack')) return Icons.dns_outlined;
  if (l.contains('base') || l.contains('docking') || l.contains('hub') || l.contains('adaptador')) return Icons.settings_input_hdmi_outlined;
  if (l.contains('tarjeta') || l.contains('gráfica') || l.contains('grafica') || l.contains('gpu')) return Icons.developer_board_outlined;
  if (l.contains('actualización') || l.contains('actualizacion') || l.contains('update') || l.contains('upgrade')) return Icons.system_update_alt_outlined;
  return Icons.devices_other_outlined;
}

class CategoryGrid extends StatelessWidget {
  final int? selected;
  final ValueChanged<int> onSelect;
  final List<String> categories;

  const CategoryGrid({
    super.key,
    required this.selected,
    required this.onSelect,
    required this.categories,
  });

  List<String> get _items => [...categories, AppStrings.catOther];

  @override
  Widget build(BuildContext context) {
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: _items.length,
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 3,
        crossAxisSpacing: 10,
        mainAxisSpacing: 10,
        childAspectRatio: 1,
      ),
      itemBuilder: (_, i) {
        final isOther = i == _items.length - 1;
        return CategoryCard(
          label: _items[i],
          icon: isOther ? Icons.build_outlined : _iconForCategory(_items[i]),
          isSelected: selected == i,
          onTap: () => onSelect(i),
        );
      },
    );
  }
}
