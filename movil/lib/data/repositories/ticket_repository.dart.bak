import '../datasources/ticket_local_datasource.dart';
import '../models/ticket_model.dart';

class TicketRepository {
  final TicketLocalDatasource _datasource;

  TicketRepository({TicketLocalDatasource? datasource})
      : _datasource = datasource ?? TicketLocalDatasource();

  List<TicketModel> getAll() => _datasource.getAll();

  TicketModel? getById(String id) => _datasource.getById(id);

  TicketModel create({
    required String description,
    String? imagePath,
  }) {
    final ticket = TicketModel(
      id:          _datasource.generateId(),
      sentBy:      'Usuario',
      date:        DateTime.now(),
      attendedBy:  'Sin atender',
      status:      TicketStatus.pending,
      description: description,
      imagePath:   imagePath,
    );
    _datasource.add(ticket);
    return ticket;
  }
}
