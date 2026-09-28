class UserModel {
  final String username;
  final String password;

  const UserModel({
    required this.username,
    required this.password,
  });

  Map<String, dynamic> toMap() => {
    'username': username,
    'password': password,
  };

  factory UserModel.fromMap(Map<String, dynamic> map) => UserModel(
    username: map['username'] as String,
    password: map['password'] as String,
  );
}
