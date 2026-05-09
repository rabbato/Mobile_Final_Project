module.exports = {
  expo: {
    name: "ParkingSpotReserve",
    slug: "parkingspotreserve",
    // Include any existing configuration from app.json here (like version, orientation, etc.)
    extra: {
      googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
    },
    ios: {
      config: {
        googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
      },
    },
    android: {
      config: {
        googleMaps: {
          apiKey: process.env.GOOGLE_MAPS_API_KEY,
        },
      },
    },
  },
};