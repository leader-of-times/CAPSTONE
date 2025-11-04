import React, { useRef, useEffect } from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';

export default function RideMapView({ 
  driverLocation, 
  pickup, 
  dropoff, 
  currentLocation,
  showRoute = false 
}) {
  const mapRef = useRef(null);

  useEffect(() => {
    if (mapRef.current && (driverLocation || currentLocation)) {
      const coordinates = [];
      
      if (driverLocation) {
        coordinates.push({
          latitude: driverLocation.coordinates[1],
          longitude: driverLocation.coordinates[0],
        });
      }
      
      if (pickup) {
        coordinates.push({
          latitude: pickup.coordinates[1],
          longitude: pickup.coordinates[0],
        });
      }
      
      if (dropoff) {
        coordinates.push({
          latitude: dropoff.coordinates[1],
          longitude: dropoff.coordinates[0],
        });
      }

      if (coordinates.length > 0) {
        mapRef.current.fitToCoordinates(coordinates, {
          edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
          animated: true,
        });
      }
    }
  }, [driverLocation, pickup, dropoff, currentLocation]);

  const defaultRegion = {
    latitude: pickup?.coordinates[1] || 12.9716,
    longitude: pickup?.coordinates[0] || 77.5946,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        initialRegion={defaultRegion}
        showsUserLocation={true}
        showsMyLocationButton={true}
      >
        {driverLocation && (
          <Marker
            coordinate={{
              latitude: driverLocation.coordinates[1],
              longitude: driverLocation.coordinates[0],
            }}
            title="Driver"
            description="Current driver location"
            pinColor="blue"
          >
            <View style={styles.driverMarker}>
              <View style={styles.driverMarkerInner} />
            </View>
          </Marker>
        )}

        {pickup && (
          <Marker
            coordinate={{
              latitude: pickup.coordinates[1],
              longitude: pickup.coordinates[0],
            }}
            title="Pickup"
            description={pickup.address}
            pinColor="green"
          />
        )}

        {dropoff && (
          <Marker
            coordinate={{
              latitude: dropoff.coordinates[1],
              longitude: dropoff.coordinates[0],
            }}
            title="Dropoff"
            description={dropoff.address}
            pinColor="red"
          />
        )}

        {showRoute && driverLocation && pickup && (
          <Polyline
            coordinates={[
              {
                latitude: driverLocation.coordinates[1],
                longitude: driverLocation.coordinates[0],
              },
              {
                latitude: pickup.coordinates[1],
                longitude: pickup.coordinates[0],
              },
            ]}
            strokeWidth={3}
            strokeColor="#4A90E2"
            lineDashPattern={[5, 5]}
          />
        )}

        {showRoute && pickup && dropoff && (
          <Polyline
            coordinates={[
              {
                latitude: pickup.coordinates[1],
                longitude: pickup.coordinates[0],
              },
              {
                latitude: dropoff.coordinates[1],
                longitude: dropoff.coordinates[0],
              },
            ]}
            strokeWidth={3}
            strokeColor="#2ECC71"
          />
        )}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  driverMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(74, 144, 226, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  driverMarkerInner: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#4A90E2',
    borderWidth: 2,
    borderColor: 'white',
  },
});
