"use client";

import * as React from "react";
import { Cloud, CloudRain, CloudLightning, CloudFog, Sun, CloudSun, Snowflake, Loader2 } from "lucide-react";
import { Muted } from "@/components/ui/typography";

// Ratneswar Engineering — Office No. 19, Sanghvi Square Complex, Rapar–Kutch
const LOCATION = { name: "Rapar, Kutch", lat: 23.57, lon: 70.63 };

const WMO: Record<number, { label: string; Icon: typeof Sun }> = {
  0: { label: "Clear sky", Icon: Sun },
  1: { label: "Mostly clear", Icon: CloudSun },
  2: { label: "Partly cloudy", Icon: CloudSun },
  3: { label: "Overcast", Icon: Cloud },
  45: { label: "Fog", Icon: CloudFog },
  48: { label: "Fog", Icon: CloudFog },
  51: { label: "Light drizzle", Icon: CloudRain },
  61: { label: "Light rain", Icon: CloudRain },
  63: { label: "Rain", Icon: CloudRain },
  65: { label: "Heavy rain", Icon: CloudRain },
  71: { label: "Snow", Icon: Snowflake },
  80: { label: "Rain showers", Icon: CloudRain },
  95: { label: "Thunderstorm", Icon: CloudLightning },
};

interface WeatherState {
  tempC: number;
  windKph: number;
  code: number;
}

export function WeatherWidget() {
  const [data, setData] = React.useState<WeatherState | null>(null);
  const [error, setError] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${LOCATION.lat}&longitude=${LOCATION.lon}&current_weather=true&timezone=Asia%2FKolkata`;

    fetch(url)
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return;
        const cw = json?.current_weather;
        if (!cw) throw new Error("no data");
        setData({ tempC: cw.temperature, windKph: cw.windspeed, code: cw.weathercode });
      })
      .catch(() => !cancelled && setError(true));

    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return <Muted className="text-xs">Weather unavailable — check network access to api.open-meteo.com</Muted>;
  }

  if (!data) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <Muted className="text-xs">Fetching live conditions…</Muted>
      </div>
    );
  }

  const DEFAULT_WEATHER = { label: "Overcast", Icon: Cloud };
  const info = WMO[data.code] ?? DEFAULT_WEATHER;
  const Icon = info.Icon;

  return (
    <div className="flex items-center gap-4">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-info/10 text-info">
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <p className="tabular font-mono text-2xl font-semibold leading-none">
          {Math.round(data.tempC)}°C
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {info.label} · {LOCATION.name} · {Math.round(data.windKph)} km/h wind
        </p>
      </div>
    </div>
  );
}
