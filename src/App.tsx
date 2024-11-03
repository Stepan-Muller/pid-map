import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import axios from "axios";

const createMarker = (line: string, color: string, textColor: string) => {
  const div = document.createElement("div");
  div.style.backgroundColor = `#${color}`;
  div.style.color = `#${textColor}`;
  div.style.fontWeight = "bold";
  div.style.textAlign = "center";
  div.innerHTML = line;

  return new L.DivIcon({
    className: "custom-marker",
    html: div.outerHTML,
    iconSize: [30, 18],
    iconAnchor: [15, 9],
  });
};

interface Vehicle {
  coordinates: [number, number];
  line: string;
  lineId: string;
}

interface Route {
  id: string;
  color: string;
  textColor: string;
}

function App(): JSX.Element {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [timer, setTimer] = useState<number>(10);

  const fetchVehicles = async () => {
    try {
      const response = await axios.get(
        "https://api.golemio.cz/v2/vehiclepositions",
        {
          headers: {
            "X-Access-Token": process.env.REACT_APP_GOLEMIO_API_KEY || "",
          },
        }
      );

      const vehicleData: Vehicle[] = response.data.features.map(
        (feature: any) => {
          const coordinates = feature.geometry.coordinates as [number, number];
          const line = feature.properties.trip.gtfs.route_short_name;
          const lineId = feature.properties.trip.gtfs.route_id;
          return {
            coordinates,
            line,
            lineId,
          };
        }
      );

      setVehicles(vehicleData);
      setTimer(10);
    } catch (error) {
      console.error("Error fetching vehicle data:", error);
    }
  };

  const fetchRoutes = async () => {
    try {
      const response = await axios.get(
        "https://api.golemio.cz/v2/gtfs/routes",
        {
          headers: {
            "X-Access-Token": process.env.REACT_APP_GOLEMIO_API_KEY || "",
          },
        }
      );

      const routeData: Route[] = response.data.map((route: any) => ({
        id: route.route_id,
        color: route.route_color,
        textColor: route.route_text_color,
      }));

      setRoutes(routeData);
    } catch (error) {
      console.error("Error fetching route data:", error);
    }
  };

  useEffect(() => {
    fetchVehicles();
    fetchRoutes();

    const updateInterval = setInterval(() => {
      fetchVehicles();
    }, 10000);

    const timerInterval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);

    return () => {
      clearInterval(updateInterval);
      clearInterval(timerInterval);
    };
  }, []);

  return (
    <div className="relative">
      <div className="absolute top-2 right-2 bg-white p-2 rounded shadow z-10">
        <p className="font-bold">{timer}</p>
      </div>
      <MapContainer
        center={[50.06, 14.46]}
        zoom={12}
        className="w-screen h-screen z-0"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {vehicles.map((vehicle, index) => {
          const route = routes.find((route) => route.id === vehicle.lineId);
          const color = route ? route.color : "000000";
          const textColor = route ? route.textColor : "FFFFFF";

          return (
            <Marker
              key={index}
              position={[vehicle.coordinates[1], vehicle.coordinates[0]]}
              icon={createMarker(vehicle.line, color, textColor)}
            />
          );
        })}
      </MapContainer>
    </div>
  );
}

export default App;
