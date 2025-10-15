import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:geolocator/geolocator.dart';
import 'package:latlong2/latlong.dart';

class MapScreen extends StatefulWidget {
  const MapScreen({super.key});

  @override
  State<MapScreen> createState() => _MapScreenState();
}

class _MapScreenState extends State<MapScreen> {
  LatLng? currentLocation;
  final MapController _mapController = MapController();
  bool isLoading = true;
  String? errorMessage;

  @override
  void initState() {
    super.initState();
    _getCurrentLocation();
  }

  Future<void> _getCurrentLocation() async {
    try {
      // Kiểm tra dịch vụ định vị có bật không
      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        setState(() {
          errorMessage = 'Vui lòng bật GPS trên thiết bị';
          isLoading = false;
        });
        return;
      }

      // Kiểm tra quyền
      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          setState(() {
            errorMessage = 'Quyền truy cập vị trí bị từ chối';
            isLoading = false;
          });
          return;
        }
      }

      if (permission == LocationPermission.deniedForever) {
        setState(() {
          errorMessage =
              'Quyền vị trí bị từ chối vĩnh viễn. Vui lòng bật trong Cài đặt';
          isLoading = false;
        });
        return;
      }

      // Lấy vị trí hiện tại
      Position position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
        timeLimit: const Duration(seconds: 10),
      );

      setState(() {
        currentLocation = LatLng(position.latitude, position.longitude);
        isLoading = false;
      });

      // Debug: In ra tọa độ
      print('Vị trí hiện tại: ${position.latitude}, ${position.longitude}');
    } catch (e) {
      setState(() {
        errorMessage = 'Lỗi khi lấy vị trí: $e';
        isLoading = false;
      });
      print('Lỗi: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Bản đồ OSM'),
        actions: [
          IconButton(
            icon: const Icon(Icons.my_location),
            onPressed: () {
              if (currentLocation != null) {
                _mapController.move(currentLocation!, 16);
              } else {
                _getCurrentLocation();
              }
            },
          ),
        ],
      ),
      body: isLoading
          ? const Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  CircularProgressIndicator(),
                  SizedBox(height: 16),
                  Text('Đang lấy vị trí GPS...'),
                ],
              ),
            )
          : errorMessage != null
          ? Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.error_outline, size: 64, color: Colors.red),
                  SizedBox(height: 16),
                  Padding(
                    padding: EdgeInsets.all(16),
                    child: Text(errorMessage!, textAlign: TextAlign.center),
                  ),
                  ElevatedButton(
                    onPressed: () {
                      setState(() {
                        errorMessage = null;
                        isLoading = true;
                      });
                      _getCurrentLocation();
                    },
                    child: Text('Thử lại'),
                  ),
                ],
              ),
            )
          : SizedBox(
              width: double.infinity,
              height: double.infinity,
              child: FlutterMap(
                mapController: _mapController,
                options: MapOptions(
                  initialCenter: currentLocation!,
                  initialZoom: 16,
                  minZoom: 3,
                  maxZoom: 18,
                ),
                children: [
                  TileLayer(
                    urlTemplate:
                        'https://api.maptiler.com/maps/streets/{z}/{x}/{y}.png?key=fB2GhKrajtlVDReidI6v',
                    userAgentPackageName: 'com.example.app',
                  ),
                  MarkerLayer(
                    markers: [
                      Marker(
                        point: currentLocation!,
                        width: 40,
                        height: 40,
                        child: const Icon(
                          Icons.location_on,
                          color: Colors.red,
                          size: 40,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
    );
  }
}
